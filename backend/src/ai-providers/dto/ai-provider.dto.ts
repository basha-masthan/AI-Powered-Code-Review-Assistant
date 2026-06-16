import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateAIProviderDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  baseUrl!: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsNotEmpty()
  modelName!: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
