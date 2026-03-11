import { forwardRef, Module } from '@nestjs/common';
import { DepositService } from './services/deposit.service';
import { WithdrawService } from './services/withdraw.service';
import { WithdrawController } from './controllers/withdraw.controller';
import { DepositController } from './controllers/deposit.controller';
import { AssetController } from './controllers/asset.controller';
import { BalanceController } from './controllers/balance.controller';
import { AdminAssetController } from './controllers/admin-asset.controller';
import { AdminBalanceController } from './controllers/admin-balance.controller';
import { AdminBalanceLogController } from './controllers/admin-balance-log.controller';
import { AdminDepositController } from './controllers/admin-deposit.controller';
import { AdminWithdrawController } from './controllers/admin-withdraw.controller';
import { UserModule } from '@/user';
import { BalanceService } from './services/balance.service';
import { AssetService } from './services/asset.sevice';
import { BalanceLogService } from './services/balance-log.service';

@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [
    AssetController,
    BalanceController,
    DepositController,
    WithdrawController,
    AdminAssetController,
    AdminBalanceController,
    AdminBalanceLogController,
    AdminDepositController,
    AdminWithdrawController,
  ],
  providers: [
    AssetService,
    DepositService,
    WithdrawService,
    BalanceService,
    BalanceLogService,
  ],
  exports: [DepositService, WithdrawService, BalanceService],
})
export class AssetModule {}
