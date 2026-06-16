import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/chat.dto';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(userId: string, dto: SendMessageDto) {
    const aiProvider = await this.prisma.aIProvider.findUnique({
      where: { id: dto.aiProviderId },
    });
    if (!aiProvider || aiProvider.userId !== userId) {
      throw new NotFoundException('AI Provider not found');
    }

    let sessionId = dto.sessionId;
    if (!sessionId) {
      const session = await this.prisma.chatSession.create({
        data: {
          projectId: dto.projectId,
          userId,
        },
      });
      sessionId = session.id;
    }

    // Save user message
    await this.prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        role: 'USER',
        content: dto.content,
      },
    });

    // Fetch simple context — limit to top 5 files, truncate each to 1500 chars
    const files = await this.prisma.file.findMany({
      where: { projectId: dto.projectId },
      take: 5,
    });
    const codeContext = files
      .map((f) => {
        const snippet = f.content.length > 1500 ? f.content.slice(0, 1500) + '\n...[truncated]' : f.content;
        return `File: ${f.path}\n\n${snippet}`;
      })
      .join('\n\n---\n\n');

    // Fetch previous messages — only last 6 to stay within context limits
    const history = await this.prisma.chatMessage.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
    history.reverse(); // restore chronological order

    const messages: BaseMessage[] = [
      new SystemMessage(
        `You are an AI assistant helping a developer understand their project. ` +
        `Here is a sample of the codebase (may be truncated for brevity):\n\n${codeContext}`
      ),
    ];

    for (const msg of history) {
      if (msg.role === 'USER') messages.push(new HumanMessage(msg.content));
      else messages.push(new AIMessage(msg.content));
    }

    // Run AI Chat
    const chat = new ChatOpenAI({
      modelName: aiProvider.modelName,
      apiKey: aiProvider.apiKey || 'dummy-key',
      openAIApiKey: aiProvider.apiKey || 'dummy-key',
      configuration: {
        baseURL: aiProvider.baseUrl,
      },
      maxTokens: 800,
    });

    const res = await chat.invoke(messages);
    const aiResponse = res.content as string;

    // Save AI response
    const aiMsg = await this.prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        role: 'ASSISTANT',
        content: aiResponse,
      },
    });

    return {
      sessionId,
      message: aiMsg,
    };
  }

  async getSessions(userId: string, projectId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId, projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSessionMessages(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) throw new NotFoundException();

    return this.prisma.chatMessage.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
