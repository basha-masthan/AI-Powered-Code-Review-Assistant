import { ReviewMode } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class TriggerReviewDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsString()
  @IsOptional()
  fileId?: string;

  @IsEnum(ReviewMode)
  @IsNotEmpty()
  mode!: ReviewMode;

  @IsString()
  @IsNotEmpty()
  aiProviderId!: string;
}
