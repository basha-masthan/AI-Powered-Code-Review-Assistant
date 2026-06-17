import { Controller, Post, UseInterceptors, UploadedFile, Param, UseGuards, Request, Get, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('projects/:projectId/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadZip(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({ fileType: 'application/zip|application/x-zip-compressed|multipart/x-zip' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.filesService.processZipUpload(projectId, req.user.sub, file.buffer);
  }

  @Get()
  getFiles(@Request() req: any, @Param('projectId') projectId: string) {
    return this.filesService.getProjectFiles(projectId, req.user.sub);
  }

  @Post('github')
  importFromGitHub(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Body() body: { repoUrl: string },
  ) {
    return this.filesService.importFromGitHub(projectId, req.user.sub, body.repoUrl);
  }

  @Get(':fileId')
  getFileContent(@Request() req: any, @Param('fileId') fileId: string) {
    return this.filesService.getFileContent(fileId, req.user.sub);
  }
}
