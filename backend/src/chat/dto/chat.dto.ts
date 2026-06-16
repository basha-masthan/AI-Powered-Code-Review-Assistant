import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsString()
  @IsNotEmpty()
  aiProviderId!: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
