import React from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { 
  Home, 
  Users, 
  Gem, 
  Trophy, 
  Gift, 
  CalendarCheck,
} from 'lucide-react';

export type NavPage = 'dashboard' | 'checkin' | 'team' | 'nft' | 'rewards' | 'claims';

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'nft', label: 'NFT', icon: Gem },
  { id: 'rewards', label: 'Rewards', icon: Trophy },
];

const actionItems: NavItem[] = [
  { id: 'checkin', label: 'Check-in', icon: CalendarCheck },
  { id: 'claims', label: 'Claims', icon: Gift, badge: 0 },
];

export interface BottomNavProps {
  className?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ className }) => {
  const { currentPage, setCurrentPage, showActionMenu, setShowActionMenu, claims } = useAppStore();
  
  // Calculate pending claims count
  const pendingClaims = claims.filter(c => c.status === 'available').length;

  const handleMainNavClick = (pageId: NavPage) => {
    setCurrentPage(pageId);
    setShowActionMenu(false);
  };

  const handleActionButtonClick = () => {
    setShowActionMenu(!showActionMenu);
  };

  const handleActionItemClick = (pageId: NavPage) => {
    setCurrentPage(pageId);
    setShowActionMenu(false);
  };

  return (
    <>
      {/* Action Menu Overlay */}
      {showActionMenu && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setShowActionMenu(false)}
        />
      )}

      {/* Action Menu Sheet */}
      {showActionMenu && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs animate-slide-up">
          <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-4 shadow-2xl">
            <p className="text-xs text-white/50 mb-3 px-2">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {actionItems.map((item) => {
                const Icon = item.icon;
                const badgeCount = item.id === 'claims' ? pendingClaims : item.badge;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleActionItemClick(item.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl',
                      'bg-white/5 hover:bg-white/10 transition-all duration-200',
                      'border border-transparent hover:border-white/[0.08]',
                      currentPage === item.id && 'bg-aura-primary/10 border-aura-primary/30'
                    )}
                  >
                    <div className="relative">
                      <Icon className={cn(
                        'w-6 h-6',
                        currentPage === item.id ? 'text-aura-primary' : 'text-white/70'
                      )} />
                      {badgeCount && badgeCount > 0 ? (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-aura-primary rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                          {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                      ) : null}
                    </div>
                    <span className={cn(
                      'text-xs font-medium',
                      currentPage === item.id ? 'text-aura-primary' : 'text-white/70'
                    )}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav 
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/[0.08]',
          'safe-area-bottom',
          className
        )}
      >
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMainNavClick(item.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2 px-3 rounded-xl',
                    'transition-all duration-200',
                    isActive 
                      ? 'text-aura-primary' 
                      : 'text-white/50 hover:text-white/70'
                  )}
                >
                  <Icon className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    isActive && 'scale-110'
                  )} />
                  <span className={cn(
                    'text-[10px] font-medium',
                    isActive && 'text-aura-primary'
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-aura-primary" />
                  )}
                </button>
              );
            })}

            {/* Main Action Button (FAB) */}
            <button
              onClick={handleActionButtonClick}
              className={cn(
                'relative -mt-6 w-14 h-14 rounded-full',
                'bg-gradient-to-r from-aura-primary to-aura-primary-dark',
                'flex items-center justify-center',
                'shadow-glow transition-all duration-300',
                'hover:scale-105 active:scale-95',
                showActionMenu && 'rotate-45'
              )}
            >
              <div className="w-6 h-6 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-0.5 bg-white rounded-full" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-5 bg-white rounded-full" />
                </div>
              </div>
              {pendingClaims > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-aura-primary rounded-full text-[10px] font-bold flex items-center justify-center">
                  {pendingClaims > 9 ? '9+' : pendingClaims}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
