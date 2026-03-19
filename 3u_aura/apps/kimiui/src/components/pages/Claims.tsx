import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui-custom/GlassCard';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { 
  Gift, 
  ChevronLeft,
  Check,
  Coins,
  Gem,
  Users,
  Zap
} from 'lucide-react';

// Claim Item Type
interface ClaimItem {
  id: string;
  type: 'reward' | 'nft_subsidy' | 'referral' | 'lottery' | 'ranking';
  amount: string;
  currency: string;
  availableAt: number;
  expiresAt?: number;
  status: 'available' | 'claimed' | 'expired' | 'pending';
  merkleProof?: string[];
  epochId?: number;
  description?: string;
}

// Mock claims data
const mockClaims: ClaimItem[] = [
  {
    id: '1',
    type: 'lottery',
    amount: '2182',
    currency: 'USDT',
    availableAt: Date.now() - 86400000,
    status: 'available',
    epochId: 11,
    description: '1st Prize - Round #11',
  },
  {
    id: '2',
    type: 'nft_subsidy',
    amount: '30',
    currency: 'USDT',
    availableAt: Date.now() - 172800000,
    status: 'available',
    epochId: 12,
    description: 'Weekly NFT Subsidy',
  },
  {
    id: '3',
    type: 'referral',
    amount: '5000',
    currency: 'AURA',
    availableAt: Date.now() - 259200000,
    status: 'available',
    description: 'Direct Referral Rewards',
  },
  {
    id: '4',
    type: 'ranking',
    amount: '480',
    currency: 'USDT',
    availableAt: Date.now() - 345600000,
    status: 'claimed',
    epochId: 11,
    description: 'Weekly Ranking #4',
  },
  {
    id: '5',
    type: 'lottery',
    amount: '87',
    currency: 'USDT',
    availableAt: Date.now() - 432000000,
    status: 'claimed',
    epochId: 10,
    description: 'Lucky Prize - Round #10',
  },
];

const Claims: React.FC = () => {
  const { setCurrentPage, addNotification } = useAppStore();
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Initialize mock claims
  useEffect(() => {
    if (claims.length === 0) {
      setClaims(mockClaims);
    }
  }, [claims.length]);

  const handleClaim = async (claimId: string) => {
    setClaimingId(claimId);
    
    // Simulate claim process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update claim status
    const updatedClaims = claims.map(c => 
      c.id === claimId ? { ...c, status: 'claimed' as const } : c
    );
    setClaims(updatedClaims);
    
    setClaimingId(null);
    addNotification({
      type: 'success',
      title: 'Claim Successful!',
      message: 'Your rewards have been sent to your wallet',
    });
  };

  const handleClaimAll = async () => {
    const availableClaims = claims.filter(c => c.status === 'available');
    if (availableClaims.length === 0) return;

    setClaimingId('all');
    
    // Simulate batch claim
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const updatedClaims = claims.map(c => 
      c.status === 'available' ? { ...c, status: 'claimed' as const } : c
    );
    setClaims(updatedClaims);
    
    setClaimingId(null);
    addNotification({
      type: 'success',
      title: 'All Claims Successful!',
      message: `${availableClaims.length} rewards claimed`,
    });
  };

  const getClaimIcon = (type: string) => {
    switch (type) {
      case 'lottery':
        return <Zap className="w-5 h-5 text-orange-400" />;
      case 'ranking':
        return <Gift className="w-5 h-5 text-aura-primary" />;
      case 'nft_subsidy':
        return <Gem className="w-5 h-5 text-purple-400" />;
      case 'referral':
        return <Users className="w-5 h-5 text-blue-400" />;
      default:
        return <Coins className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getClaimColor = (type: string) => {
    switch (type) {
      case 'lottery':
        return 'text-orange-400';
      case 'ranking':
        return 'text-aura-primary';
      case 'nft_subsidy':
        return 'text-purple-400';
      case 'referral':
        return 'text-blue-400';
      default:
        return 'text-yellow-400';
    }
  };

  const availableClaims = claims.filter(c => c.status === 'available');
  const claimedClaims = claims.filter(c => c.status === 'claimed');
  
  const totalAvailableValue = availableClaims.reduce((acc, c) => {
    return acc + parseFloat(c.amount);
  }, 0);

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
          <h1 className="text-lg font-semibold text-white">Claims</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Total Available */}
        <section>
          <GlassCard variant="highlight" className="p-4">
            <div className="text-center mb-4">
              <p className="text-sm text-white/50 mb-1">Available to Claim</p>
              <p className="text-3xl font-bold gradient-text font-mono">
                {totalAvailableValue.toLocaleString()} USDT
              </p>
              <p className="text-sm text-white/40">+ 5,000 AURA</p>
            </div>
            {availableClaims.length > 0 && (
              <Button 
                onClick={handleClaimAll}
                disabled={claimingId === 'all'}
                className="w-full bg-aura-primary hover:bg-aura-primary-dark"
              >
                {claimingId === 'all' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Claim All ({availableClaims.length})
                  </>
                )}
              </Button>
            )}
          </GlassCard>
        </section>

        {/* Available Claims */}
        <section>
          <h2 className="text-sm font-medium text-white/70 mb-3">
            Available ({availableClaims.length})
          </h2>
          <div className="space-y-3">
            {availableClaims.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <Gift className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No available claims</p>
                <p className="text-xs text-white/30 mt-1">
                  Check back after the next lottery or epoch
                </p>
              </GlassCard>
            ) : (
              availableClaims.map((claim) => (
                <GlassCard key={claim.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      {getClaimIcon(claim.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{claim.description}</p>
                      <p className="text-xs text-white/50">
                        {new Date(claim.availableAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-lg font-bold font-mono', getClaimColor(claim.type))}>
                        {claim.amount}
                      </p>
                      <p className="text-xs text-white/50">{claim.currency}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleClaim(claim.id)}
                    disabled={claimingId === claim.id}
                    className="w-full mt-3 bg-aura-primary hover:bg-aura-primary-dark"
                    size="sm"
                  >
                    {claimingId === claim.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Claim
                      </>
                    )}
                  </Button>
                </GlassCard>
              ))
            )}
          </div>
        </section>

        {/* Claimed History */}
        <section>
          <h2 className="text-sm font-medium text-white/70 mb-3">
            Claimed History ({claimedClaims.length})
          </h2>
          <div className="space-y-2">
            {claimedClaims.map((claim) => (
              <GlassCard 
                key={claim.id} 
                className="p-3 opacity-60"
                radius="md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    {getClaimIcon(claim.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{claim.description}</p>
                    <p className="text-xs text-white/40">
                      {new Date(claim.availableAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold font-mono', getClaimColor(claim.type))}>
                      {claim.amount} {claim.currency}
                  </p>
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <Check className="w-3 h-3" />
                      Claimed
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Info Card */}
        <section>
          <GlassCard className="p-4">
            <h3 className="text-sm font-medium text-white mb-3">How Claims Work</h3>
            <div className="space-y-3 text-xs text-white/50">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-aura-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-aura-primary font-bold">1</span>
                </div>
                <p>Lottery and ranking rewards are distributed weekly via Merkle claims</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-aura-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-aura-primary font-bold">2</span>
                </div>
                <p>NFT subsidies can be claimed every 7 days per NFT owned</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-aura-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-aura-primary font-bold">3</span>
                </div>
                <p>All AURA rewards will be claimable after token launch via Merkle tree</p>
              </div>
            </div>
          </GlassCard>
        </section>
      </main>
    </div>
  );
};

export default Claims;
