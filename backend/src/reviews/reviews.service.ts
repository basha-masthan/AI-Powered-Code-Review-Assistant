import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TriggerReviewDto } from './dto/review.dto';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async triggerReview(userId: string, dto: TriggerReviewDto) {
    const aiProvider = await this.prisma.aIProvider.findUnique({
      where: { id: dto.aiProviderId },
    });
    if (!aiProvider || aiProvider.userId !== userId) {
      throw new NotFoundException('AI Provider not found');
    }

    let codeContent = '';
    if (dto.fileId) {
      const file = await this.prisma.file.findFirst({
        where: { id: dto.fileId, projectId: dto.projectId },
      });
      if (!file) throw new NotFoundException('File not found');
      codeContent = `File: ${file.path}\n\n${file.content}`;
    } else {
      const files = await this.prisma.file.findMany({
        where: { projectId: dto.projectId },
      });
      if (files.length === 0) throw new BadRequestException('No files in project');
      codeContent = files.map((f) => `File: ${f.path}\n\n${f.content}`).join('\n\n---\n\n');
    }

    // Create review record (PENDING)
    const review = await this.prisma.review.create({
      data: {
        projectId: dto.projectId,
        fileId: dto.fileId,
        mode: dto.mode,
        status: 'PENDING',
      },
    });

    // Run AI in background (fire and forget for this simple assessment, or await it)
    this.runAIReview(review.id, codeContent, aiProvider, dto.mode).catch(console.error);

    return review;
  }

  private async runAIReview(reviewId: string, codeContent: string, aiProvider: any, mode: string) {
    try {
      const chat = new ChatOpenAI({
        modelName: aiProvider.modelName,
        apiKey: aiProvider.apiKey || 'dummy-key',
        openAIApiKey: aiProvider.apiKey || 'dummy-key',
        configuration: {
          baseURL: aiProvider.baseUrl,
        },
        maxTokens: 2000,
      });

      let focus = '';
      if (mode === 'SECURITY') focus = 'Security: Hardcoded credentials, Authentication issues, Input validation, Injection risks.';
      else if (mode === 'PERFORMANCE') focus = 'Performance: Slow operations, Inefficient rendering, Unnecessary database queries.';
      else if (mode === 'CODE_QUALITY') focus = 'Code Quality: Naming, Structure, Readability, Maintainability.';

      const systemPrompt = `You are an expert AI code reviewer. Focus on: ${focus}.
Review the provided code. Provide your response strictly in the following JSON format. Do not use markdown blocks around the JSON, just raw JSON text:
{
  "summary": "High-level overview of findings",
  "issues": [
    {
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "description": "Detected problem",
      "recommendation": "Suggested improvement",
      "lineNumber": 10
    }
  ]
}`;

      const res = await chat.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(codeContent),
      ]);

      let contentStr = res.content as string;
      // Clean up potential markdown blocks if the model ignored instructions
      if (contentStr.startsWith('\`\`\`json')) {
        contentStr = contentStr.replace(/^\`\`\`json/m, '').replace(/\`\`\`$/m, '');
      }

      const parsed = JSON.parse(contentStr);

      await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          status: 'COMPLETED',
          summary: parsed.summary,
          issues: {
            create: parsed.issues.map((i: any) => ({
              severity: i.severity || 'LOW',
              description: i.description || 'No description',
              recommendation: i.recommendation || 'No recommendation',
              lineNumber: i.lineNumber,
            })),
          },
        },
      });
    } catch (error) {
      console.error('AI Review Error:', error);
      await this.prisma.review.update({
        where: { id: reviewId },
        data: { status: 'FAILED' },
      });
    }
  }

  async findAll(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new NotFoundException();

    return this.prisma.review.findMany({
      where: { projectId },
      include: { file: { select: { path: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { issues: true, file: { select: { path: true } }, project: true },
    });
    if (!review || review.project.userId !== userId) throw new NotFoundException();
    return review;
  }

  async generateDocs(userId: string, projectId: string, aiProviderId: string) {
    const aiProvider = await this.prisma.aIProvider.findUnique({ where: { id: aiProviderId } });
    if (!aiProvider || aiProvider.userId !== userId) throw new NotFoundException();

    const files = await this.prisma.file.findMany({ where: { projectId } });
    if (files.length === 0) throw new BadRequestException();
    const codeContent = files.map((f) => `File: ${f.path}\n\n${f.content}`).join('\n\n---\n\n');

    const chat = new ChatOpenAI({
      modelName: aiProvider.modelName,
      apiKey: aiProvider.apiKey || 'dummy-key',
      openAIApiKey: aiProvider.apiKey || 'dummy-key',
      configuration: { baseURL: aiProvider.baseUrl },
      maxTokens: 2000,
    });

    const res = await chat.invoke([
      new SystemMessage('You are an expert technical writer. Based on the provided project code, generate a comprehensive README.md including Setup Instructions, Architecture Overview, and API endpoints (if any). Do NOT wrap in JSON, just return raw markdown.'),
      new HumanMessage(codeContent),
    ]);

    return { content: res.content as string };
  }

  async generateTest(userId: string, fileId: string, aiProviderId: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId }, include: { project: true } });
    if (!file || file.project.userId !== userId) throw new NotFoundException();

    const aiProvider = await this.prisma.aIProvider.findUnique({ where: { id: aiProviderId } });
    if (!aiProvider || aiProvider.userId !== userId) throw new NotFoundException();

    const chat = new ChatOpenAI({
      modelName: aiProvider.modelName,
      apiKey: aiProvider.apiKey || 'dummy-key',
      openAIApiKey: aiProvider.apiKey || 'dummy-key',
      configuration: { baseURL: aiProvider.baseUrl },
      maxTokens: 1500,
    });

    const res = await chat.invoke([
      new SystemMessage('You are an expert QA engineer. Generate Unit Tests for the provided code file using a standard testing framework like Jest or PyTest. Return ONLY the code for the test, nothing else.'),
      new HumanMessage(`File: ${file.path}\n\n${file.content}`),
    ]);

    return { content: res.content as string };
  }
}
