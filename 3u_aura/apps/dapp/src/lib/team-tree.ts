import type { TeamPosition, TeamTreeNodeView } from "3u-aura-common";

export type TeamTreeDisplayNode = TeamTreeNodeView & {
  children: Partial<Record<TeamPosition, TeamTreeDisplayNode>>;
};

export function buildTeamTree(
  nodes: TeamTreeNodeView[] | null | undefined,
  rootUserId?: string | null,
) {
  if (!nodes?.length || !rootUserId) {
    return null;
  }

  const nodeMap = new Map<string, TeamTreeDisplayNode>();

  for (const node of nodes) {
    nodeMap.set(node.userId, {
      ...node,
      children: {},
    });
  }

  for (const node of nodeMap.values()) {
    if (!node.parentId || !node.teamPosition) {
      continue;
    }

    const parent = nodeMap.get(node.parentId);
    if (!parent) {
      continue;
    }

    parent.children[node.teamPosition] = node;
  }

  return nodeMap.get(rootUserId) ?? null;
}
