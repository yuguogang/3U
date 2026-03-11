import { JwtAuthGuard } from '@/auth';
import { Controller, UseGuards } from '@nestjs/common';

@Controller('withdraws')
@UseGuards(JwtAuthGuard)
export class WithdrawController {}
