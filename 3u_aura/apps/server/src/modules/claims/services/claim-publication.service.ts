import { ClaimType, Prisma } from '@/db';
import { Injectable } from '@nestjs/common';
import { ClaimRecordRepository } from '../repositories/claim-record.repository';

const EMPTY_MERKLE_ROOT =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

@Injectable()
export class ClaimPublicationService {
  constructor(private readonly claimRecordRepository: ClaimRecordRepository) {}

  async markMerkleClaimsClaimable(
    epochId: string,
    claimTypes: ClaimType[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await this.claimRecordRepository.markClaimsClaimable(
      {
        claimTypes,
        epochId,
      },
      tx,
    );
  }

  async resolveMerkleDraftRoot(
    epochId: string,
    claimTypes: ClaimType[],
    tx: Prisma.TransactionClient,
  ): Promise<{
    claimCount: number;
    merkleRoot: string;
  }> {
    const claims = await this.claimRecordRepository.listClaimsByEpochAndTypes(
      {
        claimTypes,
        epochId,
      },
      tx,
    );

    if (!claims.length) {
      return {
        claimCount: 0,
        merkleRoot: EMPTY_MERKLE_ROOT,
      };
    }

    const roots = [
      ...new Set(claims.map((claim) => claim.root).filter(Boolean)),
    ];
    if (roots.length !== 1) {
      throw new Error(
        `Weekly epoch ${epochId} has inconsistent merkle claim roots`,
      );
    }

    return {
      claimCount: claims.length,
      merkleRoot: roots[0]!,
    };
  }
}
