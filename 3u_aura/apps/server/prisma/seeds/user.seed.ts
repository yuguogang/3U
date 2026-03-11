import { hashSync } from 'bcrypt';
import { customAlphabet } from 'nanoid';
import { PrismaClient } from 'generated/prisma/client';

const isDev = process.env.NODE_ENV === 'development';

export const userSeed = async (prisma: PrismaClient) => {
  // 创建虚拟管理员钱包用户
  const adminAddress = '0x1234567890123456789012345678901234567890';

  await prisma.user.upsert({
    where: { walletAddress: adminAddress },
    update: {},
    create: {
      walletAddress: adminAddress,
      inviteCode: 'ADMIN888',
      status: 'ACTIVE',
      profile: {
        create: {
          totalCheckinDays: 0,
        }
      }
    },
  });

  console.log('Admin user seeded:', adminAddress);
};
