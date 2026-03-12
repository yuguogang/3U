import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { TeamPosition } from '3u-aura-common';
import { AppModule } from '../src/app.module';
import { DbService } from '../src/db';
import { TreeTopologyService } from '../src/modules/tree';
import { UserService } from '../src/user';

function readArg(name: string): string | undefined {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const mode = readArg('mode');
  const userId = readArg('user-id');
  const parentId = readArg('parent-id');
  const teamPosition = readArg('team-position');
  const operatorWallet = readArg('operator-wallet');

  if (!mode || !userId) {
    throw new Error(
      'Usage: pnpm tsx scripts/repair-tree-placement.ts --mode <init-root|bind-placement> --user-id <id> [--parent-id <id> --team-position <LEFT|RIGHT>] [--operator-wallet <wallet>]',
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const db = app.get(DbService);
    const userService = app.get(UserService);
    const treeTopologyService = app.get(TreeTopologyService);

    const user = await userService.findById(userId, false);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    if (mode === 'init-root') {
      if (user.parentId) {
        throw new Error('Root initialization requires a user without parentId');
      }

      await db.$transaction(async (tx) => {
        await tx.teamClosure.createMany({
          data: [
            {
              ancestorId: user.id,
              depth: 0,
              descendantId: user.id,
            },
          ],
          skipDuplicates: true,
        });

        await tx.adminAuditLog.create({
          data: {
            action: 'tree.root.init',
            operatorWallet,
            payload: { userId: user.id },
            targetId: user.id,
            targetType: 'User',
          },
        });
      });

      console.log(JSON.stringify({ ok: true, mode, userId: user.id }, null, 2));
      return;
    }

    if (mode === 'bind-placement') {
      if (!parentId || !teamPosition) {
        throw new Error(
          'bind-placement requires --parent-id and --team-position <LEFT|RIGHT>',
        );
      }

      const result = await treeTopologyService.repairPlacementForUser(
        { id: user.id },
        {
          parentId,
          teamPosition: teamPosition.toUpperCase() as TeamPosition,
        },
      );

      await db.adminAuditLog.create({
        data: {
          action: 'tree.repair.bind-placement',
          operatorWallet,
          payload: {
            parentId,
            teamPosition: teamPosition.toUpperCase(),
            userId: user.id,
          },
          targetId: user.id,
          targetType: 'User',
        },
      });

      console.log(JSON.stringify(result, null, 2));
      return;
    }

    throw new Error(`Unsupported mode: ${mode}`);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
