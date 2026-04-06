import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard, AdminWalletGuard } from '@/auth';
import type { User } from '@/db';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  AdminAuditLogListQueryDto,
  AdminCheckinIssueListQueryDto,
  AdminClaimIssueListQueryDto,
  AdminNftEligibilityListQueryDto,
  AdminPendingPlacementListQueryDto,
  AdminSubsidyCenterQueryDto,
  AdminWeeklySettlementQueryDto,
} from './dto';
import { AdminConsoleService } from './services/admin-console.service';
import { AdminSettlementService } from './services/admin-settlement.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminWalletGuard)
export class AdminConsoleController {
  constructor(
    private readonly adminConsoleService: AdminConsoleService,
    private readonly adminSettlementService: AdminSettlementService,
  ) {}

  @Get('overview')
  getOverview() {
    return this.adminConsoleService.getOverview();
  }

  @Get('placements/pending')
  listPendingPlacements(@Query() query: AdminPendingPlacementListQueryDto) {
    return this.adminConsoleService.listPendingPlacements(query);
  }

  @Get('checkins')
  listCheckinIssues(@Query() query: AdminCheckinIssueListQueryDto) {
    return this.adminConsoleService.listCheckinIssues(query);
  }

  @Get('claims')
  listClaimIssues(@Query() query: AdminClaimIssueListQueryDto) {
    return this.adminConsoleService.listClaimIssues(query);
  }

  @Get('nft-eligibility')
  listNftEligibility(@Query() query: AdminNftEligibilityListQueryDto) {
    return this.adminConsoleService.listNftEligibility(query);
  }

  @Get('audit')
  listAuditLogs(@Query() query: AdminAuditLogListQueryDto) {
    return this.adminConsoleService.listAuditLogs(query);
  }

  @Get('settlement/weekly')
  getWeeklySettlement(
    @CurrentUser() operator: User,
    @Query() query: AdminWeeklySettlementQueryDto,
  ) {
    return this.adminSettlementService.getWeeklySettlement(operator, query);
  }

  @Get('subsidy')
  getSubsidyOverview(
    @CurrentUser() operator: User,
    @Query() query: AdminSubsidyCenterQueryDto,
  ) {
    return this.adminSettlementService.getPurchasedNftSubsidyCenter(
      operator,
      query,
    );
  }
}
