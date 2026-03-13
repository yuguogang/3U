import type { User } from '@/db';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AdminPermissionService } from '../services/admin-permission.service';

@Injectable()
export class AdminWalletGuard implements CanActivate {
  constructor(
    private readonly adminPermissionService: AdminPermissionService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    this.adminPermissionService.assertAdminWallet(request.user?.walletAddress);
    return true;
  }
}
