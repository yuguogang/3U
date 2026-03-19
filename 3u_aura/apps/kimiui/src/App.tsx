import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '@/config/web3';
import { useAppStore } from '@/store/appStore';
import { ToastContainer } from '@/components/ui-custom/Toast';
import BottomNav from '@/components/ui-custom/BottomNav';

// Pages
import Dashboard from '@/components/pages/Dashboard';
import Checkin from '@/components/pages/Checkin';
import Team from '@/components/pages/Team';
import NFT from '@/components/pages/NFT';
import Rewards from '@/components/pages/Rewards';
import Claims from '@/components/pages/Claims';

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

// Page Router Component
const PageRouter: React.FC = () => {
  const { currentPage } = useAppStore();

  switch (currentPage) {
    case 'dashboard':
      return <Dashboard />;
    case 'checkin':
      return <Checkin />;
    case 'team':
      return <Team />;
    case 'nft':
      return <NFT />;
    case 'rewards':
      return <Rewards />;
    case 'claims':
      return <Claims />;
    default:
      return <Dashboard />;
  }
};

// Main App Content
const AppContent: React.FC = () => {
  const { notifications, removeNotification } = useAppStore();

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Toast Notifications */}
      <ToastContainer 
        toasts={notifications} 
        onDismiss={removeNotification}
        position="top-right"
      />

      {/* Main Content */}
      <PageRouter />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

// App with Providers
const App: React.FC = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;
