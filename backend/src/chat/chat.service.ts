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

    // Fetch simple context (all project files)
    const files = await this.prisma.file.findMany({
      where: { projectId: dto.projectId },
    });
    const codeContext = files.map((f) => `File: ${f.path}\n\n${f.content}`).join('\n\n---\n\n');

    // Fetch previous messages
    const history = await this.prisma.chatMessage.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { createdAt: 'asc' },
    });

    const messages: BaseMessage[] = [
      new SystemMessage(`You are an AI assistant helping a developer with their project. Here is the codebase context:\n\n${codeContext}`),
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
      maxTokens: 1000,
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
