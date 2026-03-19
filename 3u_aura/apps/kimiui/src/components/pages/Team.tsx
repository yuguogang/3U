import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui-custom/GlassCard';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Wallet,
  TrendingUp,
  TrendingDown,
  Share2,
  Copy,
  Check
} from 'lucide-react';

// Team Member Type
interface TeamMember {
  id: string;
  address: string;
  avatar?: string;
  ensName?: string;
  checkinCount: number;
  nftType?: 'none' | 'purchased' | 'referral';
  rewards: string;
  leftChild?: TeamMember;
  rightChild?: TeamMember;
  isExpanded?: boolean;
}

// Mock team data
const mockTeamData: TeamMember[] = [
  {
    id: '1',
    address: '0x1234...5678',
    checkinCount: 45,
    nftType: 'purchased',
    rewards: '45000',
    leftChild: {
      id: '2',
      address: '0xabcd...ef01',
      checkinCount: 23,
      nftType: 'referral',
      rewards: '23000',
    },
    rightChild: {
      id: '3',
      address: '0x9876...5432',
      checkinCount: 18,
      rewards: '18000',
    },
  },
  {
    id: '4',
    address: '0x1111...2222',
    checkinCount: 32,
    rewards: '32000',
  },
];

const TeamNode: React.FC<{
  member: TeamMember;
  depth?: number;
  isLast?: boolean;
}> = ({ member, depth = 0, isLast = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = member.leftChild || member.rightChild;

  const getNFTBadge = () => {
    if (member.nftType === 'purchased') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] bg-aura-primary/20 text-aura-primary">
          NFT
        </span>
      );
    }
    if (member.nftType === 'referral') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-400">
          Ref
        </span>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      {/* Connection Line */}
      {depth > 0 && (
        <div 
          className={cn(
            'absolute -left-4 top-6 w-4 h-px bg-white/20',
            isLast && 'h-6 rounded-bl-lg border-l border-b border-white/20 bg-transparent'
          )}
        />
      )}

      {/* Node Card */}
      <GlassCard 
        variant="default" 
        className="p-3 mb-2"
        radius="md"
      >
        <div className="flex items-center gap-3">
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-white/50 hover:text-white/70"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
            </button>
          )}
          
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aura-primary/30 to-aura-primary-dark/30 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-aura-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white truncate">
                {member.address}
              </p>
              {getNFTBadge()}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-white/50">
                {member.checkinCount} check-ins
              </span>
              <span className="text-xs text-aura-primary">
                {parseInt(member.rewards || '0').toLocaleString()} AURA
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-6 pl-4 border-l border-white/10">
          {member.leftChild && (
            <TeamNode 
              member={member.leftChild} 
              depth={depth + 1}
              isLast={!member.rightChild}
            />
          )}
          {member.rightChild && (
            <TeamNode 
              member={member.rightChild} 
              depth={depth + 1}
              isLast={true}
            />
          )}
        </div>
      )}
    </div>
  );
};

const Team: React.FC = () => {
  const { setCurrentPage } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tree' | 'stats'>('tree');

  // Mock stats
  const teamStats = {
    totalMembers: 156,
    directReferrals: 12,
    indirectReferrals: 144,
    leftLegVolume: '45,678',
    rightLegVolume: '32,456',
    smallLegVolume: '32,456',
    totalRewards: '125,000',
  };

  const inviteCode = '3U2024ABC';

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button 
            onClick={() => setCurrentPage('dashboard')}
            className="p-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white/70" />
          </button>
          <h1 className="text-lg font-semibold text-white">My Team</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Team Overview */}
        <section>
          <GlassCard variant="highlight" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-white/50">Total Members</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {teamStats.totalMembers}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-aura-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-aura-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.08]">
              <div>
                <p className="text-xs text-white/50">Direct</p>
                <p className="text-lg font-semibold text-white">{teamStats.directReferrals}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Indirect</p>
                <p className="text-lg font-semibold text-white">{teamStats.indirectReferrals}</p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Invite Code */}
        <section>
          <h2 className="text-sm font-medium text-white/70 mb-3">Your Invite Code</h2>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-aura-primary" />
                </div>
                <div>
                  <p className="text-lg font-mono font-semibold text-white">{inviteCode}</p>
                  <p className="text-xs text-white/50">Share to invite friends</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInvite}
                className="border-white/20"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-aura-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </GlassCard>
        </section>

        {/* Volume Stats */}
        <section>
          <h2 className="text-sm font-medium text-white/70 mb-3">Team Volume</h2>
          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs text-white/50">Left Leg</span>
              </div>
              <p className="text-lg font-semibold text-white font-mono">
                {teamStats.leftLegVolume}
              </p>
              <p className="text-xs text-white/40">USDT Volume</p>
            </GlassCard>
            <GlassCard className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-white/50">Right Leg</span>
              </div>
              <p className="text-lg font-semibold text-white font-mono">
                {teamStats.rightLegVolume}
              </p>
              <p className="text-xs text-white/40">USDT Volume</p>
            </GlassCard>
          </div>
          <GlassCard variant="highlight" className="p-3 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50">Small Leg (Ranking)</p>
                <p className="text-xl font-bold text-aura-primary font-mono">
                  {teamStats.smallLegVolume} USDT
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50">Your Rank</p>
                <p className="text-xl font-bold text-white">#12</p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Tabs */}
        <section>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('tree')}
              className={cn(
                'flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all',
                activeTab === 'tree'
                  ? 'bg-aura-primary text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              )}
            >
              Team Tree
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={cn(
                'flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all',
                activeTab === 'stats'
                  ? 'bg-aura-primary text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              )}
            >
              Statistics
            </button>
          </div>

          {activeTab === 'tree' ? (
            <div className="space-y-2">
              <p className="text-xs text-white/50 mb-3">Direct referrals and their teams</p>
              {mockTeamData.map((member) => (
                <TeamNode key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <GlassCard className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/[0.08]">
                  <span className="text-sm text-white/50">Total Team Rewards</span>
                  <span className="text-sm font-semibold text-aura-primary">
                    {parseInt(teamStats.totalRewards).toLocaleString()} AURA
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/[0.08]">
                  <span className="text-sm text-white/50">Direct Referral Rewards</span>
                  <span className="text-sm font-semibold text-white">10%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/[0.08]">
                  <span className="text-sm text-white/50">Indirect Referral Rewards</span>
                  <span className="text-sm font-semibold text-white">5%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-white/50">Weekly Ranking Pool</span>
                  <span className="text-sm font-semibold text-white">30% of Lottery</span>
                </div>
              </div>
            </GlassCard>
          )}
        </section>
      </main>
    </div>
  );
};

export default Team;
