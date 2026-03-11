import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { AdminUserController } from './controllers/admin-user.controller';
import { AdminInviteCodeController } from './controllers/admin-invite-code.controller';
import { AdminInviteLogController } from './controllers/admin-invite-log.controller';
import { AuthModule } from '@/auth';
import { InviteService } from './services/invite.service';
import { InviteLogService } from './services/invite-log.service';
import { InviteCodeService } from './services/invite-code.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [
    UserController,
    AdminUserController,
    AdminInviteCodeController,
    AdminInviteLogController,
  ],
  providers: [UserService, InviteService, InviteCodeService, InviteLogService],
  exports: [UserService, InviteService, InviteCodeService, InviteLogService],
})
export class UserModule {}
