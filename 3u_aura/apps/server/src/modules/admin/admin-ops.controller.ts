import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { AdminWalletGuard, JwtAuthGuard } from '@/auth';
import type { User } from '@/db';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  AdminApproveReferralNftRequestDto,
  AdminCheckinRepairRequestDto,
  AdminClaimSyncRequestDto,
  AdminEpochSyncRequestDto,
  AdminGiftReferralNftRequestDto,
  AdminRejectReferralNftRequestDto,
  AdminRewardPublicationRequestDto,
  AdminSubsidyPublicationRequestDto,
  AdminWeeklySettlementEpochRequestDto,
} from './dto';
import { AdminOpsService } from './services/admin-ops.service';
import { AdminSettlementService } from './services/admin-settlement.service';

@Controller('admin/ops')
@UseGuards(JwtAuthGuard, AdminWalletGuard)
export class AdminOpsController {
  constructor(
    private readonly adminOpsService: AdminOpsService,
    private readonly adminSettlementService: AdminSettlementService,
  ) {}

  @Post('checkins/repair/preview')
  @HttpCode(HttpStatus.OK)
  previewCheckinRepair(@Body() command: AdminCheckinRepairRequestDto) {
    return this.adminOpsService.previewCheckinRepair(command);
  }

  @Post('checkins/repair')
  @HttpCode(HttpStatus.OK)
  executeCheckinRepair(
    @CurrentUser() operator: User,
    @Body() command: AdminCheckinRepairRequestDto,
  ) {
    return this.adminOpsService.executeCheckinRepair(operator, command);
  }

  @Post('claims/sync/preview')
  @HttpCode(HttpStatus.OK)
  previewClaimSync(@Body() command: AdminClaimSyncRequestDto) {
    return this.adminOpsService.previewClaimSync(command);
  }

  @Post('claims/sync')
  @HttpCode(HttpStatus.OK)
  executeClaimSync(
    @CurrentUser() operator: User,
    @Body() command: AdminClaimSyncRequestDto,
  ) {
    return this.adminOpsService.executeClaimSync(operator, command);
  }

  @Post('epochs/sync/preview')
  @HttpCode(HttpStatus.OK)
  previewEpochSync(@Body() command: AdminEpochSyncRequestDto) {
    return this.adminOpsService.previewEpochSync(command);
  }

  @Post('rewards/publish/preview')
  @HttpCode(HttpStatus.OK)
  previewRewardPublication(@Body() command: AdminRewardPublicationRequestDto) {
    return this.adminOpsService.previewRewardPublication(command);
  }

  @Post('epochs/sync')
  @HttpCode(HttpStatus.OK)
  executeEpochSync(
    @CurrentUser() operator: User,
    @Body() command: AdminEpochSyncRequestDto,
  ) {
    return this.adminOpsService.executeEpochSync(operator, command);
  }

  @Post('rewards/publish')
  @HttpCode(HttpStatus.OK)
  executeRewardPublication(
    @CurrentUser() operator: User,
    @Body() command: AdminRewardPublicationRequestDto,
  ) {
    return this.adminOpsService.executeRewardPublication(operator, command);
  }

  @Post('settlement/weekly/draft')
  @HttpCode(HttpStatus.OK)
  executeWeeklySettlementDraft(
    @CurrentUser() operator: User,
    @Body() command: AdminWeeklySettlementEpochRequestDto,
  ) {
    return this.adminSettlementService.executeWeeklySettlementDraft(
      operator,
      command,
    );
  }

  @Post('settlement/weekly/publish')
  @HttpCode(HttpStatus.OK)
  executeWeeklySettlementPublish(
    @CurrentUser() operator: User,
    @Body() command: AdminWeeklySettlementEpochRequestDto,
  ) {
    return this.adminSettlementService.executeWeeklySettlementPublish(
      operator,
      command,
    );
  }

  @Post('subsidy/publish/preview')
  @HttpCode(HttpStatus.OK)
  previewSubsidyPublish(
    @CurrentUser() operator: User,
    @Body() command: AdminSubsidyPublicationRequestDto,
  ) {
    return this.adminSettlementService.previewSubsidyPublication(
      operator,
      command,
    );
  }

  @Post('nft-eligibility/approve')
  @HttpCode(HttpStatus.OK)
  approveReferralNft(
    @CurrentUser() operator: User,
    @Body() command: AdminApproveReferralNftRequestDto,
  ) {
    return this.adminOpsService.approveReferralNft(operator, command);
  }

  @Post('nft-eligibility/gift')
  @HttpCode(HttpStatus.OK)
  giftReferralNft(
    @CurrentUser() operator: User,
    @Body() command: AdminGiftReferralNftRequestDto,
  ) {
    return this.adminOpsService.giftReferralNft(operator, command);
  }

  @Post('nft-eligibility/reject')
  @HttpCode(HttpStatus.OK)
  rejectReferralNft(
    @CurrentUser() operator: User,
    @Body() command: AdminRejectReferralNftRequestDto,
  ) {
    return this.adminOpsService.rejectReferralNft(operator, command);
  }
}
