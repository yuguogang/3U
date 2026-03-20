import { DbService, Prisma, User, UserStatus } from '@/db';
import { Injectable } from '@nestjs/common';

type DbExecutor = DbService | Prisma.TransactionClient;

export type ReferralBindingUser = Pick<
  User,
  'id' | 'inviteCode' | 'inviterId' | 'parentId' | 'status'
>;

export type PendingPlacementInvitee = Pick<
  User,
  'createdAt' | 'id' | 'inviterId' | 'parentId' | 'walletAddress'
>;

@Injectable()
export class ReferralRepository {
  constructor(private readonly db: DbService) {}

  async findUserForBinding(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<ReferralBindingUser | null> {
    return executor.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        inviteCode: true,
        inviterId: true,
        parentId: true,
        status: true,
      },
    });
  }

  async findInviterByInviteCode(
    inviteCode: string,
    executor: DbExecutor = this.db,
  ): Promise<ReferralBindingUser | null> {
    return executor.user.findFirst({
      where: { inviteCode: inviteCode.trim().toUpperCase() },
      select: {
        id: true,
        inviteCode: true,
        inviterId: true,
        parentId: true,
        status: true,
      },
    });
  }

  async bindInviter(
    userId: string,
    inviterId: string,
    executor: DbExecutor = this.db,
  ): Promise<ReferralBindingUser> {
    return executor.user.update({
      where: { id: userId },
      data: { inviterId },
      select: {
        id: true,
        inviteCode: true,
        inviterId: true,
        parentId: true,
        status: true,
      },
    });
  }

  async assignInviteCode(
    userId: string,
    inviteCode: string,
    executor: DbExecutor = this.db,
  ): Promise<ReferralBindingUser> {
    return executor.user.update({
      where: { id: userId },
      data: { inviteCode },
      select: {
        id: true,
        inviteCode: true,
        inviterId: true,
        parentId: true,
        status: true,
      },
    });
  }

  async listPendingPlacementInvitees(
    inviterId: string,
    executor: DbExecutor = this.db,
  ): Promise<PendingPlacementInvitee[]> {
    return executor.user.findMany({
      where: {
        inviterId,
        parentId: null,
        status: UserStatus.ACTIVE,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        createdAt: true,
        id: true,
        inviterId: true,
        parentId: true,
        walletAddress: true,
      },
    });
  }
}
