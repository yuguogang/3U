import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { AdminUserController } from './controllers/admin-user.controller';
import { AuthModule } from '@/auth';
import { ClaimsModule } from '@/modules/claims';

@Module({
  imports: [forwardRef(() => AuthModule), ClaimsModule],
  controllers: [
    UserController,
    AdminUserController,
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
