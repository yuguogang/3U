import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui-custom/GlassCard';
import { useAppStore } from '@/store/appStore';
import { 
  CalendarCheck, 
  Clock, 
  Coins, 
  TrendingUp,
  Check,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';

const Checkin: React.FC = () => {
  const { setCurrentPage, addNotification } = useAppStore();
  const [canCheckin, setCanCheckin] = useState(true);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [consecutiveDays, setConsecutiveDays] = useState(5);
  const [totalCheckins, setTotalCheckins] = useState(42);

  // Mock calendar data
  const calendarDays = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    checked: i < 18,
    isToday: i === 18,
  }));

  const handleCheckin = async () => {
    if (!canCheckin) return;
    
    setIsCheckingIn(true);
    
    // Simulate check-in process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsCheckingIn(false);
    setShowSuccess(true);
    setConsecutiveDays(prev => prev + 1);
    setTotalCheckins(prev => prev + 1);
    setCanCheckin(false);
    setCooldownTime(24 * 60 * 60);
    
    addNotification({
      type: 'success',
      title: 'Check-in Successful!',
      message: 'You earned 1000 AURA',
    });

    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Countdown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCanCheckin(true);
    }
  }, [cooldownTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          <h1 className="text-lg font-semibold text-white">Daily Check-in</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Check-in Button */}
        <section className="flex flex-col items-center py-8">
          <button
            onClick={handleCheckin}
            disabled={!canCheckin || isCheckingIn}
            className={cn(
              'relative w-48 h-48 rounded-full flex flex-col items-center justify-center',
              'transition-all duration-500',
              canCheckin && !isCheckingIn && 'animate-pulse-glow',
              canCheckin 
                ? 'bg-gradient-to-br from-aura-primary to-aura-primary-dark cursor-pointer hover:scale-105 active:scale-95'
                : 'bg-white/10 cursor-not-allowed'
            )}
          >
            {isCheckingIn ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3" />
                <span className="text-white font-medium">Processing...</span>
              </div>
            ) : showSuccess ? (
              <div className="flex flex-col items-center animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <span className="text-white font-bold text-lg">Success!</span>
                <span className="text-white/80 text-sm">+1000 AURA</span>
              </div>
            ) : canCheckin ? (
              <div className="flex flex-col items-center">
                <CalendarCheck className="w-12 h-12 text-white mb-3" />
                <span className="text-white font-bold text-xl">Check In</span>
                <span className="text-white/70 text-sm mt-1">Tap to earn</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Clock className="w-12 h-12 text-white/50 mb-3" />
                <span className="text-white/50 font-medium">Next in</span>
                <span className="text-white font-mono text-xl mt-1">
                  {formatTime(cooldownTime)}
                </span>
              </div>
            )}
          </button>

          {/* Reward Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/50">Daily Reward</p>
            <p className="text-2xl font-bold gradient-text font-mono">1000 AURA</p>
            <p className="text-xs text-white/40 mt-1">≈ $0.10 USD</p>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 gap-3">
          <GlassCard className="p-4 text-center">
            <p className="text-xs text-white/50 mb-1">Consecutive Days</p>
            <p className="text-2xl font-bold text-white font-mono">{consecutiveDays}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-aura-success" />
              <span className="text-xs text-aura-success">Keep it up!</span>
            </div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-xs text-white/50 mb-1">Total Check-ins</p>
            <p className="text-2xl font-bold text-white font-mono">{totalCheckins}</p>
            <p className="text-xs text-white/40 mt-2">All time</p>
          </GlassCard>
        </section>

        {/* Progress to Next Reward */}
        <section>
          <GlassCard variant="highlight" className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-aura-primary" />
                <span className="text-sm text-white">Weekly Lottery Ticket</span>
              </div>
              <span className="text-xs text-aura-primary">{consecutiveDays % 7}/7 days</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-aura-primary to-aura-primary-light rounded-full transition-all duration-500"
                style={{ width: `${((consecutiveDays % 7) / 7) * 100}%` }}
              />
            </div>
            <p className="text-xs text-white/40 mt-2">
              Check in for {7 - (consecutiveDays % 7)} more days to earn a lottery ticket
            </p>
          </GlassCard>
        </section>

        {/* Calendar */}
        <section>
          <h2 className="text-sm font-medium text-white/70 mb-3">This Month</h2>
          <GlassCard className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs text-white/40 py-1">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    'aspect-square rounded-lg flex items-center justify-center text-sm',
                    day.checked && 'bg-aura-primary/20 text-aura-primary',
                    day.isToday && 'ring-2 ring-aura-primary text-white',
                    !day.checked && !day.isToday && 'text-white/50'
                  )}
                >
                  {day.checked ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    day.day
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        {/* Info Card */}
        <section>
          <GlassCard className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-aura-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium mb-1">How it works</p>
                <ul className="text-xs text-white/50 space-y-1">
                  <li>• Check in daily to earn 1000 AURA</li>
                  <li>• 3 USDT is required for each check-in</li>
                  <li>• 7 consecutive days = 1 lottery ticket</li>
                  <li>• Rewards are credited to your account instantly</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </section>
      </main>
    </div>
  );
};

export default Checkin;
