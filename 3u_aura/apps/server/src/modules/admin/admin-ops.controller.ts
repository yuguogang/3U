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
  AdminRejectReferralNftRequestDto,
} from './dto';
import { AdminOpsService } from './services/admin-ops.service';

@Controller('admin/ops')
@UseGuards(JwtAuthGuard, AdminWalletGuard)
export class AdminOpsController {
  constructor(private readonly adminOpsService: AdminOpsService) {}

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

  @Post('epochs/sync')
  @HttpCode(HttpStatus.OK)
  executeEpochSync(
    @CurrentUser() operator: User,
    @Body() command: AdminEpochSyncRequestDto,
  ) {
    return this.adminOpsService.executeEpochSync(operator, command);
  }

  @Post('nft-eligibility/approve')
  @HttpCode(HttpStatus.OK)
  approveReferralNft(
    @CurrentUser() operator: User,
    @Body() command: AdminApproveReferralNftRequestDto,
  ) {
    return this.adminOpsService.approveReferralNft(operator, command);
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
