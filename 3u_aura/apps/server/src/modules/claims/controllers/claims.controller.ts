import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@/db';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ClaimSyncRequestDto } from '../dto';
import { ClaimsReadService } from '../services/claims-read.service';
import { ClaimSyncService } from '../services/claim-sync.service';

@Controller('claims')
@UseGuards(JwtAuthGuard)
export class ClaimsController {
  constructor(
    private readonly claimsReadService: ClaimsReadService,
    private readonly claimSyncService: ClaimSyncService,
  ) {}

  @Get('me')
  listMyClaims(@CurrentUser() user: User) {
    return this.claimsReadService.listClaimsForUser(user.id);
  }

  @Post('sync')
  syncMyClaim(@CurrentUser() user: User, @Body() command: ClaimSyncRequestDto) {
    return this.claimSyncService.syncClaimForUser(user, command);
  }
}
