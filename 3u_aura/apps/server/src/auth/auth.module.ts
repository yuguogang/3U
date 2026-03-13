import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AuthService } from './services/auth.service';
import { AdminPermissionService } from './services/admin-permission.service';
import { UserModule } from '@/user';
import { RefreshTokenService } from './services/refresh-token.service';
import { AdminWalletGuard } from './guards/admin-wallet.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UserModule),

    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jwt = config.get<{
          secret: string;
          signOptions: { expiresIn: number };
        }>('auth.jwt');
        return {
          secret: jwt?.secret || 'default-secret-change-in-production',
          signOptions: {
            expiresIn: jwt?.signOptions?.expiresIn ?? 60 * 60 * 24 * 7,
          }, // 7 days
        };
      },
    }),
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [
    JwtStrategy,
    JwtRefreshStrategy,
    AdminPermissionService,
    AdminWalletGuard,
    JwtAuthGuard,
    JwtRefreshAuthGuard,
    AuthService,
    RefreshTokenService,
  ],
  exports: [
    AdminPermissionService,
    AdminWalletGuard,
    JwtAuthGuard,
    JwtRefreshAuthGuard,
    AuthService,
  ],
})
export class AuthModule {}
