import { JwtAuthGuard, AdminWalletGuard } from '@/auth';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  AdminAuditLogListQueryDto,
  AdminCheckinIssueListQueryDto,
  AdminClaimIssueListQueryDto,
  AdminNftEligibilityListQueryDto,
  AdminPendingPlacementListQueryDto,
} from './dto';
import { AdminConsoleService } from './services/admin-console.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminWalletGuard)
export class AdminConsoleController {
  constructor(private readonly adminConsoleService: AdminConsoleService) {}

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
}
