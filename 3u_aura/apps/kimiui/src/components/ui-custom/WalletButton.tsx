import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { cn } from '@/lib/utils';
import { Wallet, ChevronDown, Loader2 } from 'lucide-react';

export interface WalletButtonProps {
  variant?: 'default' | 'minimal' | 'pill';
  showBalance?: boolean;
  showNetwork?: boolean;
  className?: string;
}

const WalletButton: React.FC<WalletButtonProps> = ({
  variant = 'default',
  showBalance = true,
  showNetwork = true,
  className,
}) => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected = ready && account && chain;
        const isConnecting = authenticationStatus === 'loading';

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    disabled={isConnecting}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200',
                      'bg-gradient-to-r from-aura-primary to-aura-primary-dark text-white',
                      'hover:shadow-glow-sm hover:scale-[1.02] active:scale-[0.98]',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      variant === 'pill' && 'rounded-full',
                      variant === 'minimal' && 'bg-white/5 hover:bg-white/10',
                      className
                    )}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        <span>Connect Wallet</span>
                      </>
                    )}
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium',
                      'bg-aura-error/20 text-aura-error border border-aura-error/30',
                      'hover:bg-aura-error/30 transition-all duration-200',
                      className
                    )}
                  >
                    <span>Wrong Network</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  {showNetwork && (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl',
                        'bg-white/5 border border-white/[0.08] text-white/80',
                        'hover:bg-white/10 transition-all duration-200'
                      )}
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 16, height: 16 }}
                            />
                          )}
                        </div>
                      )}
                      <span className="text-sm font-medium">{chain.name}</span>
                      <ChevronDown className="w-3 h-3 text-white/50" />
                    </button>
                  )}

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl',
                      'bg-white/5 border border-white/[0.08] text-white',
                      'hover:bg-white/10 transition-all duration-200'
                    )}
                  >
                    {showBalance && (
                      <span className="text-sm font-mono">
                        {account.displayBalance || '0.00'}
                      </span>
                    )}
                    <span className="text-sm font-mono">
                      {account.displayName}
                    </span>
                    <ChevronDown className="w-3 h-3 text-white/50" />
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletButton;
