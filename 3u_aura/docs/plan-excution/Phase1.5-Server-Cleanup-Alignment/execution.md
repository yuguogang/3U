# Execution: Phase 1.5 - Server Cleanup & Model Alignment

## 1. Summary
成功清理了 `apps/server` 中的历史遗留代码，将后端架构与 AURA 协议（私钥签名登录、原子单位精度、新数据模型）完全对齐。

## 2. Key Actions Taken

### 2.1 Purge Legacy Modules
- **Physical Removal**: 删除了 `src/asset`, `src/exchange`, `src/order`, `src/ran-finance` 及其所有子文件。
- **Registration Cleanup**: 更新 `app.module.ts` 移除了对已删除模块的引用。

### 2.2 User & Auth Module Overhaul
- **UserService**: 
    - 废弃了 `number` 自增 ID，切换为 `string` (CUID)。
    - 移除了所有密码杂凑和验证逻辑，全面适配 Web3 逻辑。
- **AuthService & Controller**:
    - 重构为纯签名校验（`signinBySignature`）。
    - 删除了 `ChangePassword` 和 `AdminLogin` (基于用户名密码) 的逻辑。
- **Legacy Components**: 删除了 `InviteCodeService`, `InviteLogService` 及其对应的控制器和 DTO。

### 2.3 precision & Type Alignment
- **Enum Standardization**: 将 `UserStatuses` 统一重命名为 `UserStatus`。
- **Precision Hardening**: 数据库层面统一使用 `Decimal(78, 0)` 处理原子单位，代码层面已验证导入正确。
- **Common Package Sync**: 在 `packages/common` 中恢复并导出了 `SignatureScenarios`, `DEVICES`, `AuthSignatureSigninInput` 和相应的 Zod 校验器。

### 2.4 DB Schema Alignment
- **RefreshToken**: 在 `schema.prisma` 中恢复了 `RefreshToken` 模型，并建立了与 `User` 的一对多关系。
- **Models Export**: 修复了 `src/db/index.ts` 中导出的错误（删除了不存在的 `models` 导出）。

## 3. Verification Results
- **Build Errors**: 从初始的 **239** 个错误降至 **0** 个错误。
- **Module Skeleton**: 后端骨架已精简到 `Auth`, `User`, `Db`, `Common` 等核心模块。
- **Command Runs**:
    - `pnpm run build` (common): OK
    - `pnpm prisma generate`: OK
    - `pnpm run build` (server): OK

## 4. Final Status
- **Status**: Completed [x]
- **Remaining Issues**: 无。
- **Next Phase**: Phase 2 - Check-in Accounting.
