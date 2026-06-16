import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  sendMessage(@Request() req: any, @Body() sendMessageDto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.sub, sendMessageDto);
  }

  @Get('sessions')
  getSessions(@Request() req: any, @Query('projectId') projectId: string) {
    return this.chatService.getSessions(req.user.sub, projectId);
  }

  @Get('sessions/:id/messages')
  getSessionMessages(@Request() req: any, @Param('id') id: string) {
    return this.chatService.getSessionMessages(req.user.sub, id);
  }
}
