import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { files: true, reviews: true } } }
    });
  }

  async findOne(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        files: true,
        reviews: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async remove(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.project.delete({
      where: { id },
    });
  }
}
