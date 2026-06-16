import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Patch } from '@nestjs/common';
import { AiProvidersService } from './ai-providers.service';
import { CreateAIProviderDto } from './dto/ai-provider.dto';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('ai-providers')
export class AiProvidersController {
  constructor(private readonly aiProvidersService: AiProvidersService) {}

  @Post()
  create(@Request() req: any, @Body() createAiProviderDto: CreateAIProviderDto) {
    return this.aiProvidersService.create(req.user.sub, createAiProviderDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.aiProvidersService.findAll(req.user.sub);
  }

  @Patch(':id/default')
  setDefault(@Request() req: any, @Param('id') id: string) {
    return this.aiProvidersService.setDefault(req.user.sub, id);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.aiProvidersService.remove(req.user.sub, id);
  }
}
