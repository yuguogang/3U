import React from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui-custom/GlassCard';
import StatCard from '@/components/ui-custom/StatCard';
import { useAppStore } from '@/store/appStore';
import { 
  CalendarCheck, 
  Users, 
  Gem, 
  Trophy, 
  Gift, 
  TrendingUp,
  Share2,
  Zap,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const { setCurrentPage } = useAppStore();

  // Mock data for demo
  const stats = {
    totalAura: '12,345.67',
    usdValue: '$1,234.56',
    change: { value: 5.2, type: 'increase' as const },
    currentEpoch: 12,
    epochProgress: 65,
    teamSize: 156,
    lotteryTickets: 3,
    nextLotteryTime: '2d 14h 32m',
  };

  const quickActions = [
    { 
      id: 'checkin', 
      label: 'Check-in', 
      icon: CalendarCheck, 
      color: 'from-aura-primary to-aura-primary-dark',
      onClick: () => setCurrentPage('checkin')
    },
    { 
      id: 'invite', 
      label: 'Invite', 
      icon: Share2, 
      color: 'from-blue-500 to-blue-600',
      onClick: () => {}
    },
    { 
      id: 'claim', 
      label: 'Claim', 
      icon: Gift, 
      color: 'from-green-500 to-green-600',
      onClick: () => setCurrentPage('claims')
    },
    { 
      id: 'buy-nft', 
      label: 'Buy NFT', 
      icon: Gem, 
      color: 'from-purple-500 to-purple-600',
      onClick: () => setCurrentPage('nft')
    },
  ];

  const featureCards = [
    { 
      id: 'checkin', 
      title: 'Daily Check-in', 
      description: 'Earn 1000 AURA daily',
      icon: CalendarCheck, 
      color: 'text-aura-primary',
      bgColor: 'bg-aura-primary/10',
      onClick: () => setCurrentPage('checkin')
    },
    { 
      id: 'team', 
      title: 'My Team', 
      description: `${stats.teamSize} members`,
      icon: Users, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      onClick: () => setCurrentPage('team')
    },
    { 
      id: 'rewards', 
      title: 'Rewards', 
      description: 'View earnings',
      icon: Trophy, 
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      onClick: () => setCurrentPage('rewards')
    },
    { 
      id: 'nft', 
      title: 'NFT Market', 
      description: 'Buy & Claim NFTs',
      icon: Gem, 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      onClick: () => setCurrentPage('nft')
    },
    { 
      id: 'claims', 
      title: 'Claims', 
      description: 'Pending rewards',
      icon: Gift, 
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      onClick: () => setCurrentPage('claims')
    },
    { 
      id: 'lottery', 
      title: 'Lottery', 
      description: `${stats.lotteryTickets} tickets`,
      icon: Zap, 
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      onClick: () => setCurrentPage('rewards')
    },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aura-primary to-aura-primary-dark flex items-center justify-center">
              <span className="text-white font-bold text-sm">3U</span>
            </div>
            <span className="font-semibold text-white">AURA</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/[0.08] text-xs text-white/70">
              Epoch {stats.currentEpoch}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Hero Stats */}
        <section className="animate-fade-in">
          <GlassCard variant="highlight" className="p-6">
            <div className="text-center">
              <p className="text-sm text-white/50 mb-2">Total Earnings (AURA)</p>
              <h1 className="text-4xl font-bold gradient-text font-mono mb-1">
                {stats.totalAura}
              </h1>
              <p className="text-sm text-white/40">≈ {stats.usdValue} USD</p>
              <div className="flex items-center justify-center gap-1 mt-3">
                <TrendingUp className="w-4 h-4 text-aura-success" />
                <span className="text-sm text-aura-success">+{stats.change.value}%</span>
                <span className="text-xs text-white/40 ml-1">this week</span>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Quick Actions */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                    'transition-all duration-200 group-hover:scale-105 group-active:scale-95',
                    action.color
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs text-white/70">{action.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Stats Grid */}
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Current Epoch"
              value={`Week ${stats.currentEpoch}`}
              subValue={`${stats.epochProgress}% completed`}
              icon={<Clock className="w-5 h-5" />}
            />
            <StatCard
              label="Team Size"
              value={stats.teamSize}
              subValue="Direct + Indirect"
              icon={<Users className="w-5 h-5" />}
              trend="up"
              change={{ value: 12, type: 'increase' }}
            />
          </div>
        </section>

        {/* Lottery Info */}
        <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <GlassCard variant="elevated" className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Next Lottery</p>
                  <p className="text-xs text-white/50">{stats.nextLotteryTime}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-orange-400">{stats.lotteryTickets}</p>
                <p className="text-xs text-white/50">Tickets</p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Feature Cards Grid */}
        <section className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-sm font-medium text-white/70 mb-3">Features</h2>
          <div className="grid grid-cols-2 gap-3">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <GlassCard
                  key={card.id}
                  variant="interactive"
                  className="p-4"
                  onClick={card.onClick}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', card.bgColor)}>
                    <Icon className={cn('w-5 h-5', card.color)} />
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">{card.title}</h3>
                  <p className="text-xs text-white/50">{card.description}</p>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* Referral Banner */}
        <section className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <GlassCard variant="highlight" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white mb-1">Invite Friends</h3>
                <p className="text-xs text-white/50">Earn 10% from direct referrals</p>
              </div>
              <Button 
                size="sm" 
                className="bg-aura-primary hover:bg-aura-primary-dark"
              >
                Share
                <Share2 className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </GlassCard>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
