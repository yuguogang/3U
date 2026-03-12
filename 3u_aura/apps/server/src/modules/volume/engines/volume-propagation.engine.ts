import { Injectable } from '@nestjs/common';
import { TeamPosition } from '3u-aura-common';

@Injectable()
export class VolumePropagationEngine {
  buildPropagationTargets(
    pathRows: Array<{
      ancestorId: string;
      depth: number;
      teamPosition: TeamPosition | null;
    }>,
    amountAtomic: string,
  ): Array<{ ancestorId: string; branch: TeamPosition; amountAtomic: string }> {
    return pathRows.slice(1).flatMap((row, index) => {
      const branch = pathRows[index]?.teamPosition;

      return branch
        ? [{ ancestorId: row.ancestorId, branch, amountAtomic }]
        : [];
    });
  }

  applyBranchVolume(params: {
    amountAtomic: string;
    branch: TeamPosition;
    currentLeftAtomic: string;
    currentRightAtomic: string;
  }): {
    leftAtomic: string;
    rightAtomic: string;
    smallLegAtomic: string;
  } {
    const amount = BigInt(params.amountAtomic);
    const left =
      BigInt(params.currentLeftAtomic) +
      (params.branch === TeamPosition.LEFT ? amount : 0n);
    const right =
      BigInt(params.currentRightAtomic) +
      (params.branch === TeamPosition.RIGHT ? amount : 0n);

    return {
      leftAtomic: left.toString(),
      rightAtomic: right.toString(),
      smallLegAtomic: (left < right ? left : right).toString(),
    };
  }
}
