import { TeamPosition } from "3u-aura-common";

export type TeamTreeNodeLike = {
  userId: string;
  walletAddress: string;
  inviteCode?: string;
  inviterId?: string;
  parentId?: string;
  placementKey?: string;
  teamPosition?: TeamPosition;
  depth: number;
  isRoot: boolean;
  hasPurchasedNft: boolean;
  hasReferralNft: boolean;
  totalAuraAtomic: string;
  leftTeamVolume: string;
  rightTeamVolume: string;
  smallLegVolume: string;
  openChildPositions: TeamPosition[];
  ensName?: string;
  ensAvatarUrl?: string | null;
  nftTierLabel?: string;
  rewardLabel?: string;
};

export type TeamTreeNodeBranch = TeamTreeNodeLike & {
  children: TeamTreeNodeBranch[];
};

const WALLET_SHORT_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function getTreeNodeLabel(node: Pick<TeamTreeNodeLike, "walletAddress" | "inviteCode"> & { ensName?: string }) {
  return node.ensName?.trim() || node.inviteCode?.trim() || formatCompactWallet(node.walletAddress);
}

export function formatCompactWallet(address: string) {
  if (!address) return "-";
  if (WALLET_SHORT_REGEX.test(address)) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  if (address.length <= 12) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatCompactId(value?: string | null) {
  if (!value) return "-";
  return formatCompactWallet(value);
}

export function hashSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarPalette(seed: string) {
  const hash = hashSeed(seed);
  const hue = hash % 360;
  const accent = (hue + 28) % 360;
  const light = `hsl(${hue} 84% 58%)`;
  const dark = `hsl(${accent} 72% 34%)`;
  const glow = `hsl(${(hue + 180) % 360} 95% 55% / 0.18)`;
  return { accent, dark, glow, hue, light };
}

export function buildTreeBranches(nodes: TeamTreeNodeLike[], rootUserId?: string) {
  const map = new Map<string, TeamTreeNodeBranch>();
  const roots: TeamTreeNodeBranch[] = [];

  for (const node of nodes) {
    map.set(node.userId, { ...node, children: [] });
  }

  for (const node of map.values()) {
    const parentId = node.parentId;
    const shouldTreatAsRoot = node.userId === rootUserId || !parentId || !map.has(parentId);

    if (shouldTreatAsRoot) {
      roots.push(node);
      continue;
    }

    const parent = map.get(parentId);
    if (!parent) {
      roots.push(node);
      continue;
    }

    parent.children.push(node);
  }

  const sortChildren = (branch: TeamTreeNodeBranch) => {
    branch.children.sort((a, b) => {
      const positionOrder = (position?: TeamPosition) => {
        if (position === TeamPosition.LEFT) return 0;
        if (position === TeamPosition.RIGHT) return 1;
        return 2;
      };

      const positionDiff = positionOrder(a.teamPosition) - positionOrder(b.teamPosition);
      if (positionDiff !== 0) return positionDiff;

      return a.walletAddress.localeCompare(b.walletAddress);
    });

    branch.children.forEach(sortChildren);
  };

  roots.sort((a, b) => {
    if (a.isRoot && !b.isRoot) return -1;
    if (!a.isRoot && b.isRoot) return 1;
    return a.walletAddress.localeCompare(b.walletAddress);
  });

  roots.forEach(sortChildren);
  return roots;
}
