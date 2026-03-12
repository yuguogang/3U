import { Controller, Get, Query } from '@nestjs/common';
import { WeeklyEpochBoundaryQueryDto } from './dto';
import { WeeklyEpochApplicationService } from './services/weekly-epoch-application.service';

@Controller('epoch')
export class WeeklyEpochController {
  constructor(
    private readonly weeklyEpochApplicationService: WeeklyEpochApplicationService,
  ) {}

  @Get('boundary')
  async getBoundary(@Query() query: WeeklyEpochBoundaryQueryDto) {
    return this.weeklyEpochApplicationService.getBoundary(query);
  }
}
