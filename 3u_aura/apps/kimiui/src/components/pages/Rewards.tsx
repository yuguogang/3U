import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui-custom/GlassCard';
import { useAppStore } from '@/store/appStore';
import { 
  Trophy, 
  ChevronLeft,
  Zap,
  TrendingUp,
  Award,
  Clock,
  Info
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock lottery data
const lotteryData = {
  currentRound: 12,
  poolAmount: '12,456',
  participantCount: 89,
  userTickets: 3,
  timeUntilDraw: 172800,
  prizes: {
    first: '2,182',
    second: '1,746',
    third: '1,309',
    lucky: '87',
  },
};

// Mock ranking data
const rankingData = [
  { rank: 1, address: '0x1234...5678', smallLegVolume: '45,678', reward: '1,200' },
  { rank: 2, address: '0xabcd...ef01', smallLegVolume: '38,456', reward: '720' },
  { rank: 3, address: '0x9876...5432', smallLegVolume: '32,123', reward: '576' },
  { rank: 4, address: '0x1111...2222', smallLegVolume: '28,765', reward: '480' },
  { rank: 5, address: '0x3333...4444', smallLegVolume: '25,432', reward: '432' },
];

// Mock history data
const historyData = [
  { round: 11, date: '2024-03-10', result: 'won', amount: '87', rank: 'lucky' },
  { round: 10, date: '2024-03-03', result: 'lost', amount: '100', rank: 'consolation' },
  { round: 9, date: '2024-02-25', result: 'won', amount: '1,746', rank: 'second' },
];

const Rewards: React.FC = () => {
  const { setCurrentPage } = useAppStore();
  const [activeTab, setActiveTab] = useState('lottery');

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
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
          <h1 className="text-lg font-semibold text-white">Rewards</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Total Rewards Card */}
        <section>
          <GlassCard variant="highlight" className="p-4">
            <div className="text-center mb-4">
              <p className="text-sm text-white/50 mb-1">Total Rewards Earned</p>
              <p className="text-3xl font-bold gradient-text font-mono">
                45,678 AURA
              </p>
              <p className="text-sm text-white/40">≈ $4,567.80 USD</p>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.08]">
              <div className="text-center">
                <p className="text-xs text-white/50">Check-in</p>
                <p className="text-lg font-semibold text-white">42K</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/50">Referral</p>
                <p className="text-lg font-semibold text-white">2.5K</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/50">Lottery</p>
                <p className="text-lg font-semibold text-white">1.1K</p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="lottery" className="data-[state=active]:bg-aura-primary">
              Lottery
            </TabsTrigger>
            <TabsTrigger value="ranking" className="data-[state=active]:bg-aura-primary">
              Ranking
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-aura-primary">
              History
            </TabsTrigger>
          </TabsList>

          {/* Lottery Tab */}
          <TabsContent value="lottery" className="space-y-4 mt-4">
            {/* Current Lottery */}
            <GlassCard variant="elevated" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-white/50">Round #{lotteryData.currentRound}</p>
                  <p className="text-2xl font-bold text-orange-400 font-mono">
                    {lotteryData.poolAmount} USDT
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-white/50">Participants</p>
                  <p className="text-lg font-semibold text-white">{lotteryData.participantCount}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-white/50">Your Tickets</p>
                  <p className="text-lg font-semibold text-aura-primary">{lotteryData.userTickets}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Next draw in:</span>
                <span className="text-orange-400 font-mono">
                  {formatTime(lotteryData.timeUntilDraw)}
                </span>
              </div>
            </GlassCard>

            {/* Prize Structure */}
            <GlassCard className="p-4">
              <h3 className="text-sm font-medium text-white mb-3">Prize Structure</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-white">1st Prize (1 winner)</span>
                  </div>
                  <span className="text-sm font-semibold text-yellow-400">{lotteryData.prizes.first} USDT</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-300" />
                    <span className="text-sm text-white">2nd Prize (2 winners)</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-300">{lotteryData.prizes.second} USDT</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-white">3rd Prize (3 winners)</span>
                  </div>
                  <span className="text-sm font-semibold text-orange-400">{lotteryData.prizes.third} USDT</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white">Lucky Prize (remaining)</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-400">{lotteryData.prizes.lucky} USDT</span>
                </div>
              </div>
            </GlassCard>

            {/* How to get tickets */}
            <GlassCard className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-aura-info flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white font-medium mb-1">How to get tickets</p>
                  <p className="text-xs text-white/50">
                    Check in for 7 consecutive days to earn 1 lottery ticket. 
                    Tickets reset every week. 50% win rate!
                  </p>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="space-y-4 mt-4">
            <GlassCard variant="highlight" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-white/50">Weekly Ranking Pool</p>
                  <p className="text-2xl font-bold text-aura-primary font-mono">
                    3,737 USDT
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-aura-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-aura-primary" />
                </div>
              </div>
              <p className="text-xs text-white/50">
                Top 10 by Small Leg volume share 30% of lottery pool
              </p>
            </GlassCard>

            <GlassCard className="p-4">
              <h3 className="text-sm font-medium text-white mb-3">This Week&apos;s Leaders</h3>
              <div className="space-y-2">
                {rankingData.map((item, index) => (
                  <div 
                    key={index}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl',
                      index === 0 ? 'bg-yellow-500/10' :
                      index === 1 ? 'bg-gray-500/10' :
                      index === 2 ? 'bg-orange-500/10' :
                      'bg-white/5'
                    )}
                  >
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-400 text-black' :
                      'bg-white/10 text-white'
                    )}>
                      {item.rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-mono">{item.address}</p>
                      <p className="text-xs text-white/50">{item.smallLegVolume} USDT</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-aura-primary">{item.reward} USDT</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* My Ranking */}
            <GlassCard variant="highlight" className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-aura-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-aura-primary">12</span>
                  </div>
                  <div>
                    <p className="text-sm text-white">Your Rank</p>
                    <p className="text-xs text-white/50">32,456 USDT volume</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">Need 2,000 more</p>
                  <p className="text-xs text-white/50">to reach top 10</p>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <GlassCard className="p-4">
              <h3 className="text-sm font-medium text-white mb-3">Lottery History</h3>
              <div className="space-y-3">
                {historyData.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        item.result === 'won' ? 'bg-green-500/20' : 'bg-white/5'
                      )}>
                        {item.result === 'won' ? (
                          <Trophy className="w-5 h-5 text-green-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-white/50" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-white">Round #{item.round}</p>
                        <p className="text-xs text-white/50">{item.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'text-sm font-semibold',
                        item.result === 'won' ? 'text-green-400' : 'text-white/50'
                      )}>
                        {item.result === 'won' ? '+' : ''}{item.amount} AURA
                      </p>
                      <p className="text-xs text-white/50 capitalize">{item.rank}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Rewards;
