import { JwtAuthGuard } from '@/auth';
import { Controller, UseGuards } from '@nestjs/common';

@Controller('deposits')
@UseGuards(JwtAuthGuard)
export class DepositController {}
