import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import AdmZip from 'adm-zip';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async processZipUpload(projectId: string, userId: string, fileBuffer: Buffer) {
    // Verify project belongs to user
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new NotFoundException('Project not found');

    let zip;
    try {
      zip = new AdmZip(fileBuffer);
    } catch (e) {
      throw new BadRequestException('Invalid ZIP file');
    }

    const zipEntries = zip.getEntries();
    const filesToSave: Array<{
      projectId: string;
      path: string;
      content: string;
      size: number;
    }> = [];

    // Filter out binaries, node_modules, .git, etc.
    const ignoredPaths = ['node_modules/', '.git/', '.next/', 'dist/', 'build/', '.vscode/', '.idea/'];
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.exe', '.dll', '.so', '.dylib', '.zip', '.tar', '.gz'];

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;

      const path = entry.entryName;
      if (ignoredPaths.some((ignored) => path.includes(ignored))) continue;
      
      const ext = path.slice(((path.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
      if (binaryExtensions.includes(`.${ext}`)) continue;

      const content = entry.getData().toString('utf8');
      
      filesToSave.push({
        projectId,
        path,
        content,
        size: entry.header.size,
      });
    }

    if (filesToSave.length === 0) {
      throw new BadRequestException('No valid files found in ZIP');
    }

    // Delete existing files for this project to start fresh, or just append? 
    // The requirement says "Uploaded files should be stored and associated with a project." Let's append or replace. Replacing is safer for simple reviews.
    await this.prisma.file.deleteMany({ where: { projectId } });

    await this.prisma.file.createMany({
      data: filesToSave,
    });

    return { message: `Successfully uploaded ${filesToSave.length} files.` };
  }

  async getProjectFiles(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.file.findMany({
      where: { projectId },
      select: { id: true, path: true, size: true, createdAt: true }, // exclude content for tree view
      orderBy: { path: 'asc' },
    });
  }

  async getFileContent(fileId: string, userId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: { project: true },
    });
    if (!file || file.project.userId !== userId) throw new NotFoundException('File not found');
    return file;
  }
}
