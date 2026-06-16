import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/project.dto';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Request() req: any, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(req.user.sub, createProjectDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.projectsService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.findOne(req.user.sub, id);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.remove(req.user.sub, id);
  }
}
