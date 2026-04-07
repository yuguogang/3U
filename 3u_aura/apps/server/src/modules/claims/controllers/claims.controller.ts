import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@/db';
import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import {
  ClaimSyncRequestDto,
  PurchasedNftSyncRequestDto,
  ReferralNftSyncRequestDto,
} from '../dto';
import { ClaimsReadService } from '../services/claims-read.service';
import { ClaimSyncService } from '../services/claim-sync.service';
import { PurchasedNftSyncService } from '../services/purchased-nft-sync.service';
import { ReferralNftSyncService } from '../services/referral-nft-sync.service';

@Controller('claims')
@UseGuards(JwtAuthGuard)
export class ClaimsController {
  private readonly logger = new Logger(ClaimsController.name);

  constructor(
    private readonly claimsReadService: ClaimsReadService,
    private readonly claimSyncService: ClaimSyncService,
    private readonly purchasedNftSyncService: PurchasedNftSyncService,
    private readonly referralNftSyncService: ReferralNftSyncService,
  ) {}

  @Get('me')
  async listMyClaims(@CurrentUser() user: User) {
    try {
      await this.purchasedNftSyncService.syncStateForUser(user);
    } catch (error) {
      this.logger.warn(
        `Best-effort purchased NFT refresh failed for ${user.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

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

  @Post('purchased-nft/refresh')
  refreshMyPurchasedNft(@CurrentUser() user: User) {
    return this.purchasedNftSyncService.syncStateForUser(user);
  }

  @Post('referral-nft/sync')
  syncMyReferralNft(
    @CurrentUser() user: User,
    @Body() command: ReferralNftSyncRequestDto,
  ) {
    return this.referralNftSyncService.syncMintForUser(user, command.txHash);
  }
}
