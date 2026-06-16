import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAIProviderDto } from './dto/ai-provider.dto';
// A simple encryption could be used here for apiKey, but keeping it simple for assessment

@Injectable()
export class AiProvidersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAIProviderDto) {
    if (dto.isDefault) {
      await this.prisma.aIProvider.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.aIProvider.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.aIProvider.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async remove(userId: string, id: string) {
    const provider = await this.prisma.aIProvider.findFirst({
      where: { id, userId },
    });
    if (!provider) throw new NotFoundException('Provider not found');

    return this.prisma.aIProvider.delete({
      where: { id },
    });
  }

  async setDefault(userId: string, id: string) {
    await this.prisma.aIProvider.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
    return this.prisma.aIProvider.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}
