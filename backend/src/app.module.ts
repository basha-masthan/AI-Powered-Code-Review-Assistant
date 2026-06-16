import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { FilesModule } from './files/files.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AiProvidersModule } from './ai-providers/ai-providers.module';
import { ChatModule } from './chat/chat.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, ProjectsModule, FilesModule, ReviewsModule, AiProvidersModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
