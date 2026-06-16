import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { TriggerReviewDto } from './dto/review.dto';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('trigger')
  triggerReview(@Request() req: any, @Body() triggerReviewDto: TriggerReviewDto) {
    return this.reviewsService.triggerReview(req.user.sub, triggerReviewDto);
  }

  @Get()
  findAll(@Request() req: any, @Query('projectId') projectId: string) {
    return this.reviewsService.findAll(req.user.sub, projectId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.reviewsService.findOne(req.user.sub, id);
  }

  @Get('bonus/generate-docs')
  generateDocs(@Request() req: any, @Query('projectId') projectId: string, @Query('aiProviderId') aiProviderId: string) {
    return this.reviewsService.generateDocs(req.user.sub, projectId, aiProviderId);
  }

  @Get('bonus/generate-test')
  generateTest(@Request() req: any, @Query('fileId') fileId: string, @Query('aiProviderId') aiProviderId: string) {
    return this.reviewsService.generateTest(req.user.sub, fileId, aiProviderId);
  }
}
