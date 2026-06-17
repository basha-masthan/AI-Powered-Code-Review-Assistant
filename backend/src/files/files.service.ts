import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import AdmZip from 'adm-zip';

interface GitHubFile {
  path: string;
  content: string;
  size: number;
}

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

  async importFromGitHub(projectId: string, userId: string, repoUrl: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new NotFoundException('Project not found');

    // Parse GitHub URL: https://github.com/owner/repo or https://github.com/owner/repo/tree/branch
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+?)(?:\/tree\/([^\/\s]+))?(?:\/blob\/([^\/\s]+\/.+))?$/);
    if (!match) throw new BadRequestException('Invalid GitHub URL format. Expected: https://github.com/owner/repo');

    const [, owner, repo, branch, filePath] = match;
    const resolvedBranch = branch || 'main';

    // Use GitHub API to get the repo contents
    const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CodeReviewApp/1.0',
    };

    const filesToSave: GitHubFile[] = [];

    if (filePath) {
      // Single file from blob URL
      const resp = await fetch(`${apiBase}/contents/${filePath}?ref=${resolvedBranch}`, { headers });
      if (!resp.ok) throw new BadRequestException('Failed to fetch file from GitHub');
      const data = await resp.json();
      if (data.type === 'file') {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        filesToSave.push({ path: data.path, content, size: data.size || content.length });
      }
    } else {
      // Fetch entire repo recursively
      await this.fetchGitHubDir(apiBase, '', resolvedBranch, headers, filesToSave);
    }

    if (filesToSave.length === 0) throw new BadRequestException('No valid files found in repository');

    await this.prisma.file.deleteMany({ where: { projectId } });
    await this.prisma.file.createMany({
      data: filesToSave.map(f => ({ ...f, projectId })),
    });

    return { message: `Successfully imported ${filesToSave.length} files from GitHub.` };
  }

  private async fetchGitHubDir(
    apiBase: string,
    dirPath: string,
    branch: string,
    headers: Record<string, string>,
    files: GitHubFile[],
  ) {
    const ignoredPaths = ['node_modules/', '.git/', '.next/', 'dist/', 'build/', '.vscode/', '.idea/', '__pycache__/', '.venv/'];
    const binaryExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.exe', '.dll', '.so', '.dylib', '.zip', '.tar', '.gz', '.svg', '.webp', '.woff', '.woff2', '.eot', '.ttf']);

    const resp = await fetch(`${apiBase}/contents/${dirPath}?ref=${branch}`, { headers });
    if (!resp.ok) return;

    const items: any[] = await resp.json();
    for (const item of items) {
      if (ignoredPaths.some(p => item.path.includes(p))) continue;

      if (item.type === 'file') {
        const ext = item.name.slice(((item.name.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
        if (binaryExtensions.has(`.${ext}`)) continue;

        try {
          const fileResp = await fetch(item.url, { headers });
          if (!fileResp.ok) continue;
          const fileData = await fileResp.json();
          const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
          files.push({ path: item.path, content, size: item.size || content.length });
        } catch { /* skip problematic files */ }
      } else if (item.type === 'dir') {
        await this.fetchGitHubDir(apiBase, item.path, branch, headers, files);
      }
    }
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
