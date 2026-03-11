import type { User } from '@/db';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InviteLogService } from './invite-log.service';
import { InviteCodeService } from './invite-code.service';
import { UserService } from '@/user';

@Injectable()
export class InviteService {
  constructor(
    private readonly inviteCodeService: InviteCodeService,
    private readonly inviteLogService: InviteLogService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  // 使用邀请码
  async inviteByCode({ code, user }: { code: string; user: User }) {
    const invite = await this.inviteCodeService.getByCode(code);

    const result = await this.inviteLogService.create({
      data: {
        inviteCodeId: invite.id,
        userId: user.id,
        usedAt: new Date(), // 标记使用时间
      },
    });
    // 更新用户的邀请的邀请人
    await this.userService.update({
      where: { id: user.id },
      data: {
        inviterId: invite.userId,
      },
    });

    return result;
  }
}
