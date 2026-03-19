import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui-custom/GlassCard';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { 
  Gem, 
  ChevronLeft,
  Check,
  Lock,
  Sparkles,
  Crown,
  Star,
  Zap,
  Info
} from 'lucide-react';
import type { NFTItem } from '@/types';

// Mock NFT data
const mockNFTs: NFTItem[] = [
  {
    tokenId: 1,
    name: 'Founder #001',
    image: '/nft-legendary.png',
    type: 'purchased',
    status: 'available',
    price: '1000',
    rarity: 'legendary',
    weeklySubsidy: '30',
  },
  {
    tokenId: 2,
    name: 'Founder #002',
    image: '/nft-epic.png',
    type: 'purchased',
    status: 'available',
    price: '1000',
    rarity: 'epic',
    weeklySubsidy: '30',
  },
  {
    tokenId: 3,
    name: 'Founder #003',
    image: '/nft-rare.png',
    type: 'purchased',
    status: 'owned',
    rarity: 'rare',
    weeklySubsidy: '30',
  },
  {
    tokenId: 4,
    name: 'Referral #001',
    image: '/nft-epic.png',
    type: 'referral',
    status: 'claimable',
    rarity: 'epic',
  },
  {
    tokenId: 5,
    name: 'Founder #004',
    image: '/nft-common.png',
    type: 'purchased',
    status: 'available',
    price: '1000',
    rarity: 'common',
    weeklySubsidy: '30',
  },
  {
    tokenId: 6,
    name: 'Referral #002',
    image: '/nft-rare.png',
    type: 'referral',
    status: 'locked',
    rarity: 'rare',
  },
];

const rarityConfig: Record<string, { color: string; bgColor: string; borderColor: string; stars: number }> = {
  common: { color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30', stars: 1 },
  rare: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', stars: 2 },
  epic: { color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', stars: 3 },
  legendary: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', stars: 4 },
};

const NFTCard: React.FC<{ nft: NFTItem }> = ({ nft }) => {
  const { addNotification } = useAppStore();
  const rarity = rarityConfig[nft.rarity];
  
  const handleAction = () => {
    if (nft.status === 'available') {
      addNotification({
        type: 'info',
        title: 'Purchase NFT',
        message: `Buying ${nft.name} for ${nft.price} USDT`,
      });
    } else if (nft.status === 'claimable') {
      addNotification({
        type: 'success',
        title: 'NFT Claimed!',
        message: `Successfully claimed ${nft.name}`,
      });
    }
  };

  const getActionButton = () => {
    switch (nft.status) {
      case 'available':
        return (
          <Button 
            onClick={handleAction}
            className="w-full bg-aura-primary hover:bg-aura-primary-dark"
          >
            Buy {nft.price} USDT
          </Button>
        );
      case 'owned':
        return (
          <Button 
            disabled
            variant="outline"
            className="w-full border-white/20 text-white/50"
          >
            <Check className="w-4 h-4 mr-1" />
            Owned
          </Button>
        );
      case 'claimable':
        return (
          <Button 
            onClick={handleAction}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Claim Free
          </Button>
        );
      case 'locked':
        return (
          <Button 
            disabled
            variant="outline"
            className="w-full border-white/20 text-white/50"
          >
            <Lock className="w-4 h-4 mr-1" />
            Locked
          </Button>
        );
    }
  };

  const getStatusBadge = () => {
    switch (nft.status) {
      case 'owned':
        return (
          <span className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs bg-green-500/20 text-green-400">
            Owned
          </span>
        );
      case 'claimable':
        return (
          <span className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs bg-aura-primary/20 text-aura-primary">
            Claimable
          </span>
        );
      case 'locked':
        return (
          <span className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs bg-white/10 text-white/50">
            Locked
          </span>
        );
    }
    return null;
  };

  return (
    <GlassCard 
      variant={nft.status === 'owned' ? 'highlight' : 'default'}
      className="overflow-hidden"
      radius="lg"
    >
      {/* NFT Image Placeholder */}
      <div className={cn(
        'relative aspect-square flex items-center justify-center',
        rarity.bgColor
      )}>
        {getStatusBadge()}
        <div className="text-center">
          <Gem className={cn('w-16 h-16 mx-auto mb-2', rarity.color)} />
          <p className={cn('text-lg font-bold', rarity.color)}>{nft.name}</p>
        </div>
        
        {/* Rarity Stars */}
        <div className="absolute bottom-2 left-2 flex gap-0.5">
          {Array.from({ length: rarity.stars }).map((_, i) => (
            <Star key={i} className={cn('w-3 h-3 fill-current', rarity.color)} />
          ))}
        </div>
      </div>

      {/* NFT Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className={cn('text-xs px-2 py-1 rounded-full', rarity.bgColor, rarity.color)}>
            {nft.rarity.charAt(0).toUpperCase() + nft.rarity.slice(1)}
          </span>
          <span className={cn(
            'text-xs',
            nft.type === 'purchased' ? 'text-aura-primary' : 'text-purple-400'
          )}>
            {nft.type === 'purchased' ? 'Purchase' : 'Referral'}
          </span>
        </div>

        {nft.weeklySubsidy && (
          <div className="flex items-center gap-2 mb-3 text-xs text-white/50">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span>{nft.weeklySubsidy} USDT/week subsidy</span>
          </div>
        )}

        {getActionButton()}
      </div>
    </GlassCard>
  );
};

const NFT: React.FC = () => {
  const { setCurrentPage } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'owned' | 'claimable'>('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'available', label: 'For Sale' },
    { id: 'owned', label: 'Owned' },
    { id: 'claimable', label: 'Claimable' },
  ];

  const filteredNFTs = mockNFTs.filter(nft => {
    if (activeFilter === 'all') return true;
    return nft.status === activeFilter;
  });

  const stats = {
    totalSupply: 100,
    purchasedMinted: 15,
    referralMinted: 23,
    owned: 1,
    claimable: 1,
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
          <h1 className="text-lg font-semibold text-white">NFT Market</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* NFT Stats */}
        <section>
          <GlassCard variant="highlight" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-white/50">Total Supply</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {stats.totalSupply}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-aura-primary/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-aura-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.08]">
              <div>
                <p className="text-xs text-white/50">Purchased</p>
                <p className="text-lg font-semibold text-aura-primary">
                  {stats.purchasedMinted}/{30}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50">Referral</p>
                <p className="text-lg font-semibold text-purple-400">
                  {stats.referralMinted}/{70}
                </p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* My NFTs Summary */}
        <section>
          <h2 className="text-sm font-medium text-white/70 mb-3">My NFTs</h2>
          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="p-3">
              <p className="text-xs text-white/50 mb-1">Owned</p>
              <p className="text-2xl font-bold text-white font-mono">{stats.owned}</p>
            </GlassCard>
            <GlassCard className="p-3">
              <p className="text-xs text-white/50 mb-1">Claimable</p>
              <p className="text-2xl font-bold text-aura-primary font-mono">{stats.claimable}</p>
            </GlassCard>
          </div>
        </section>

        {/* Filters */}
        <section>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={cn(
                  'flex-shrink-0 py-2 px-4 rounded-full text-sm font-medium transition-all',
                  activeFilter === filter.id
                    ? 'bg-aura-primary text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {/* NFT Grid */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            {filteredNFTs.map((nft) => (
              <NFTCard key={nft.tokenId} nft={nft} />
            ))}
          </div>
        </section>

        {/* NFT Benefits Info */}
        <section>
          <GlassCard className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-aura-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium mb-2">NFT Benefits</p>
                <ul className="text-xs text-white/50 space-y-1">
                  <li>• <span className="text-aura-primary">Purchased NFT</span>: 30 USDT weekly subsidy + trading fee share</li>
                  <li>• <span className="text-purple-400">Referral NFT</span>: Trading fee share only</li>
                  <li>• All NFTs receive 60% of trading fees after token launch</li>
                  <li>• Future governance rights (coming soon)</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Referral NFT Requirements */}
        <section>
          <GlassCard variant="highlight" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-white font-medium">Free Referral NFT</p>
                <p className="text-xs text-white/50">Qualify to claim for free</p>
              </div>
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Small Leg Volume</span>
                <span className="text-white">3,456 / 6,000 USDT</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '57%' }} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Personal Check-ins</span>
                <span className="text-white">18 / 30</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          </GlassCard>
        </section>
      </main>
    </div>
  );
};

export default NFT;
