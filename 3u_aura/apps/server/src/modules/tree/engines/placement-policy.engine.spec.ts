import { ConflictException } from '@nestjs/common';
import { TeamPosition, UserStatus } from '3u-aura-common';
import { PlacementPolicyEngine } from './placement-policy.engine';

describe('PlacementPolicyEngine', () => {
  const engine = new PlacementPolicyEngine();

  it('builds placement keys deterministically', () => {
    expect(
      engine.buildPlacementKey({
        placementUserId: 'user_1',
        parentId: 'parent_1',
        teamPosition: TeamPosition.LEFT,
      }),
    ).toBe('parent_1:LEFT');
  });

  it('builds closure rows from parent ancestors', () => {
    expect(
      engine.buildClosureRows('child_1', [
        { ancestorId: 'parent_1', depth: 0 },
        { ancestorId: 'root_1', depth: 1 },
      ]),
    ).toEqual([
      { ancestorId: 'child_1', depth: 0, descendantId: 'child_1' },
      { ancestorId: 'parent_1', depth: 1, descendantId: 'child_1' },
      { ancestorId: 'root_1', depth: 2, descendantId: 'child_1' },
    ]);
  });

  it('rejects placement outside inviter subtree', () => {
    expect(() =>
      engine.assertPlacementAllowed({
        allowedByPlacementTree: false,
        existingOccupantId: null,
        parent: {
          id: 'parent_1',
          inviterId: null,
          parentId: null,
          status: UserStatus.ACTIVE,
        },
        parentIsReady: true,
        requestedPlacementKey: 'parent_1:LEFT',
        user: {
          id: 'user_1',
          inviterId: 'inviter_1',
          parentId: null,
          placementKey: null,
          status: UserStatus.ACTIVE,
          teamPosition: null,
        },
      }),
    ).toThrow(ConflictException);
  });
});
