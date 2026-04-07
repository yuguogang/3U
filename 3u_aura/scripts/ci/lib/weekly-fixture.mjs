import { createRequire } from 'node:module';
import { loadManifest } from './manifest.mjs';
import {
  buildDatabaseConnectionConfig,
  seedWeeklyForkFixtures,
} from '../../uat/seed-weekly-fork-fixtures.mjs';

const requireFromServer = createRequire(
  new URL('../../../apps/server/package.json', import.meta.url),
);
const { Client } = requireFromServer('pg');

export function addDays(isoString, days) {
  const date = new Date(isoString);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export async function withWeeklyFixtureClient(envName, fn) {
  const manifest = loadManifest(envName);
  const client = new Client(buildDatabaseConnectionConfig(manifest));
  await client.connect();

  try {
    return await fn(client, manifest.infra.database.schema);
  } finally {
    await client.end();
  }
}

export async function seedWeeklyEpochScenario({
  envName,
  epochNo,
  dailyCheckinTimesForSelectedParticipants = 1,
  observerUserId,
  observerWallet,
  qualifiedRankingCount = 15,
  referenceAt,
  selectedParticipantCount,
  syntheticParticipantCount,
}) {
  const manifest = loadManifest(envName);
  const targetStartAt = new Date(manifest.promotion.startAt).toISOString();
  const targetEndAt = addDays(targetStartAt, manifest.promotion.epochLengthDays);

  const seeded = await seedWeeklyForkFixtures({
    envName,
    observerUserId,
    observerWallet,
    poolContributorCount: 10,
    qualifiedRankingCount,
    referenceAt,
    syntheticParticipantCount,
    targetEndAt,
    targetEpochNo: epochNo,
    targetStartAt,
  });

  const epochId = `ci_weekly_epoch_${epochNo}`;
  await withWeeklyFixtureClient(envName, async (client, schema) => {
    await client.query('BEGIN');
    try {
      await client.query(
        `
          INSERT INTO "${schema}"."WeeklyEpoch" (
            "id",
            "epochNo",
            "epochType",
            "status",
            "lotteryStatus",
            "rankingStatus",
            "startAt",
            "endAt",
            "participantCount",
            "qualifiedTicketCount",
            "lotteryPoolUsdt",
            "rankingPoolUsdt",
            "rolloverUsdt",
            "lotteryRolloverUsdt",
            "rankingRolloverUsdt",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            $1,
            $2,
            'WEEKLY_PROMOTION',
            'OPEN',
            'OPEN',
            'OPEN',
            $3,
            $4,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            NOW(),
            NOW()
          )
          ON CONFLICT ("epochType", "epochNo")
          DO UPDATE SET
            "startAt" = EXCLUDED."startAt",
            "endAt" = EXCLUDED."endAt",
            "status" = 'OPEN',
            "lotteryStatus" = 'OPEN',
            "rankingStatus" = 'OPEN',
            "participantCount" = 0,
            "qualifiedTicketCount" = 0,
            "lotteryPoolUsdt" = 0,
            "rankingPoolUsdt" = 0,
            "rolloverUsdt" = 0,
            "lotteryRolloverUsdt" = 0,
            "rankingRolloverUsdt" = 0,
            "snapshotAt" = NULL,
            "settledAt" = NULL,
            "merkleRoot" = NULL,
            "merkleTreeUri" = NULL,
            "rewardJsonUri" = NULL,
            "calculationRemark" = NULL,
            "updatedAt" = NOW()
        `,
        [epochId, epochNo, targetStartAt, targetEndAt],
      );

      const selectedParticipants = seeded.participants.slice(0, selectedParticipantCount);

      if (dailyCheckinTimesForSelectedParticipants > 1 && selectedParticipants.length) {
        await client.query(
          `
            UPDATE "${schema}"."UserDailyStat"
            SET "checkinTimes" = $2,
                "updatedAt" = NOW()
            WHERE "userId" = ANY($1::text[])
              AND "dateKey" = ANY($3::text[])
          `,
          [
            selectedParticipants.map((participant) => participant.userId),
            dailyCheckinTimesForSelectedParticipants,
            seeded.dateKeys,
          ],
        );
      }

      for (const participant of selectedParticipants) {
        await client.query(
          `
            INSERT INTO "${schema}"."LotteryTicket" (
              "id",
              "epochId",
              "userId",
              "streakDays",
              "isEligible",
              "ticketCount",
              "isParticipating",
              "participatedAt",
              "createdAt",
              "updatedAt"
            )
            VALUES (
              $1,
              $2,
              $3,
              0,
              FALSE,
              0,
              TRUE,
              NOW(),
              NOW(),
              NOW()
            )
            ON CONFLICT ("epochId", "userId")
            DO UPDATE SET
              "isParticipating" = TRUE,
              "participatedAt" = COALESCE("${schema}"."LotteryTicket"."participatedAt", NOW()),
              "updatedAt" = NOW()
          `,
          [`ci_weekly_ticket_${epochNo}_${participant.userId}`, epochId, participant.userId],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });

  return {
    epochId,
    referenceAt,
    seeded,
    targetEndAt,
    targetStartAt,
  };
}
