import { TeamPosition } from '3u-aura-common';
import { VolumePropagationEngine } from './volume-propagation.engine';

describe('VolumePropagationEngine', () => {
  const engine = new VolumePropagationEngine();

  it('builds ancestor propagation targets from the closure path', () => {
    const targets = engine.buildPropagationTargets(
      [
        {
          ancestorId: 'user_1',
          depth: 0,
          teamPosition: TeamPosition.LEFT,
        },
        {
          ancestorId: 'parent_1',
          depth: 1,
          teamPosition: TeamPosition.RIGHT,
        },
        {
          ancestorId: 'root_1',
          depth: 2,
          teamPosition: null,
        },
      ],
      '3000000',
    );

    expect(targets).toEqual([
      {
        amountAtomic: '3000000',
        ancestorId: 'parent_1',
        branch: TeamPosition.LEFT,
      },
      {
        amountAtomic: '3000000',
        ancestorId: 'root_1',
        branch: TeamPosition.RIGHT,
      },
    ]);
  });

  it('updates the selected branch and recomputes the small leg', () => {
    expect(
      engine.applyBranchVolume({
        amountAtomic: '3000000',
        branch: TeamPosition.LEFT,
        currentLeftAtomic: '1000000',
        currentRightAtomic: '5000000',
      }),
    ).toEqual({
      leftAtomic: '4000000',
      rightAtomic: '5000000',
      smallLegAtomic: '4000000',
    });
  });
});
