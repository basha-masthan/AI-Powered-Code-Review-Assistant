import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
      },
    });

    await this.createDefaultProvidersForUser(user.id);

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    await this.createDefaultProvidersForUser(user.id);

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, email: user.email },
    };
  }

  private async createDefaultProvidersForUser(userId: string) {
    // Check if the user already has any providers configured
    const existingProviders = await this.prisma.aIProvider.findMany({
      where: { userId },
    });
    if (existingProviders.length > 0) return;

    const providers: Array<{
      name: string;
      baseUrl: string;
      apiKey: string;
      modelName: string;
      isDefault: boolean;
    }> = [];

    const openAIApiKey = process.env.OPENAI_API_KEY_2 || process.env.OPENAI_API_KEY;
    if (openAIApiKey) {
      providers.push({
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: openAIApiKey,
        modelName: 'gpt-4o-mini',
        isDefault: true,
      });
    }

    if (process.env.OPENROUTER_API_KEY) {
      providers.push({
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
        modelName: 'google/gemini-2.5-flash',
        isDefault: providers.length === 0,
      });
    }

    if (process.env.GROQ_API_KEY) {
      providers.push({
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY,
        modelName: 'llama-3.1-8b-instant',
        isDefault: providers.length === 0,
      });
    }

    for (const p of providers) {
      await this.prisma.aIProvider.create({
        data: {
          userId,
          name: p.name,
          baseUrl: p.baseUrl,
          apiKey: p.apiKey,
          modelName: p.modelName,
          isDefault: p.isDefault,
        },
      });
    }
  }
}
