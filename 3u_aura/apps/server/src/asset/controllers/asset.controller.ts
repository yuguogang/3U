import { JwtAuthGuard } from '@/auth';
import { Controller, UseGuards } from '@nestjs/common';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetController {}
