import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Health check endpoint for quick runtime health status
  @Get('health')
  getHealth(): { status: string; ts: string } {
    return { status: 'ok', ts: new Date().toISOString() };
  }
}
