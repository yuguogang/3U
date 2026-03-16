import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@/db';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ClaimSyncRequestDto, PurchasedNftSyncRequestDto } from '../dto';
import { ClaimsReadService } from '../services/claims-read.service';
import { ClaimSyncService } from '../services/claim-sync.service';
import { PurchasedNftSyncService } from '../services/purchased-nft-sync.service';

@Controller('claims')
@UseGuards(JwtAuthGuard)
export class ClaimsController {
  constructor(
    private readonly claimsReadService: ClaimsReadService,
    private readonly claimSyncService: ClaimSyncService,
    private readonly purchasedNftSyncService: PurchasedNftSyncService,
  ) {}

  @Get('me')
  listMyClaims(@CurrentUser() user: User) {
    return this.claimsReadService.listClaimsForUser(user);
  }

  @Post('sync')
  syncMyClaim(@CurrentUser() user: User, @Body() command: ClaimSyncRequestDto) {
    return this.claimSyncService.syncClaimForUser(user, command);
  }

  @Post('purchased-nft/sync')
  syncMyPurchasedNft(
    @CurrentUser() user: User,
    @Body() command: PurchasedNftSyncRequestDto,
  ) {
    return this.purchasedNftSyncService.syncPurchaseForUser(user, command.txHash);
  }
}
