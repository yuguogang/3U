import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User Profile Type
export interface UserProfile {
  address: string;
  inviteCode?: string;
  inviterAddress?: string;
  totalCheckins: number;
  consecutiveCheckins: number;
  lastCheckinTime?: number;
  auraBalance: string;
  usdtBalance: string;
  teamSize: number;
  leftLegVolume: string;
  rightLegVolume: string;
  hasPurchasedNFT: boolean;
  hasReferralNFT: boolean;
  nftTokenIds: number[];
}

// Check-in State
export interface CheckinState {
  canCheckin: boolean;
  cooldownEndTime?: number;
  currentEpoch: number;
  epochProgress: number;
}

// Team Member Type
export interface TeamMember {
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

// NFT Item Type
export interface NFTItem {
  tokenId: number;
  name: string;
  image: string;
  type: 'purchased' | 'referral';
  status: 'available' | 'owned' | 'locked' | 'claimable';
  price?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  weeklySubsidy?: string;
}

// Claim Item Type
export interface ClaimItem {
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

// Lottery State
export interface LotteryState {
  currentRound: number;
  poolAmount: string;
  participantCount: number;
  userTickets: number;
  timeUntilDraw: number;
  hasWon?: boolean;
  winAmount?: string;
  winRank?: number;
}

// App State Interface
interface AppState {
  // Navigation
  currentPage: 'dashboard' | 'checkin' | 'team' | 'nft' | 'rewards' | 'claims';
  setCurrentPage: (page: AppState['currentPage']) => void;
  
  // User Profile
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  
  // Check-in State
  checkinState: CheckinState;
  setCheckinState: (state: CheckinState) => void;
  
  // Team Data
  teamMembers: TeamMember[];
  setTeamMembers: (members: TeamMember[]) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  
  // NFT Data
  nftItems: NFTItem[];
  setNftItems: (items: NFTItem[]) => void;
  updateNftItem: (tokenId: number, updates: Partial<NFTItem>) => void;
  
  // Claims Data
  claims: ClaimItem[];
  setClaims: (claims: ClaimItem[]) => void;
  updateClaim: (id: string, updates: Partial<ClaimItem>) => void;
  
  // Lottery State
  lotteryState: LotteryState;
  setLotteryState: (state: LotteryState) => void;
  
  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showActionMenu: boolean;
  setShowActionMenu: (show: boolean) => void;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  
  // Transactions
  pendingTransactions: Array<{
    id: string;
    hash: string;
    status: 'pending' | 'confirming' | 'success' | 'error';
    title: string;
    description?: string;
  }>;
  addTransaction: (tx: Omit<AppState['pendingTransactions'][0], 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<AppState['pendingTransactions'][0]>) => void;
  removeTransaction: (id: string) => void;
}

// Create Store with Persistence
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Navigation
      currentPage: 'dashboard',
      setCurrentPage: (page) => set({ currentPage: page }),
      
      // User Profile
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      updateUserProfile: (updates) => set((state) => ({
        userProfile: state.userProfile ? { ...state.userProfile, ...updates } : null,
      })),
      
      // Check-in State
      checkinState: {
        canCheckin: true,
        currentEpoch: 1,
        epochProgress: 0,
      },
      setCheckinState: (checkinState) => set({ checkinState }),
      
      // Team Data
      teamMembers: [],
      setTeamMembers: (teamMembers) => set({ teamMembers }),
      updateTeamMember: (id, updates) => set((state) => ({
        teamMembers: state.teamMembers.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        ),
      })),
      
      // NFT Data
      nftItems: [],
      setNftItems: (nftItems) => set({ nftItems }),
      updateNftItem: (tokenId, updates) => set((state) => ({
        nftItems: state.nftItems.map((item) =>
          item.tokenId === tokenId ? { ...item, ...updates } : item
        ),
      })),
      
      // Claims Data
      claims: [],
      setClaims: (claims) => set({ claims }),
      updateClaim: (id, updates) => set((state) => ({
        claims: state.claims.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      })),
      
      // Lottery State
      lotteryState: {
        currentRound: 1,
        poolAmount: '0',
        participantCount: 0,
        userTickets: 0,
        timeUntilDraw: 0,
      },
      setLotteryState: (lotteryState) => set({ lotteryState }),
      
      // UI State
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      showActionMenu: false,
      setShowActionMenu: (show) => set({ showActionMenu: show }),
      
      // Notifications
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [
          ...state.notifications,
          { ...notification, id: Math.random().toString(36).substr(2, 9) },
        ],
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
      
      // Transactions
      pendingTransactions: [],
      addTransaction: (tx) => set((state) => ({
        pendingTransactions: [
          ...state.pendingTransactions,
          { ...tx, id: Math.random().toString(36).substr(2, 9) },
        ],
      })),
      updateTransaction: (id, updates) => set((state) => ({
        pendingTransactions: state.pendingTransactions.map((tx) =>
          tx.id === id ? { ...tx, ...updates } : tx
        ),
      })),
      removeTransaction: (id) => set((state) => ({
        pendingTransactions: state.pendingTransactions.filter((tx) => tx.id !== id),
      })),
    }),
    {
      name: '3u-aura-storage',
      partialize: (state) => ({
        userProfile: state.userProfile,
        checkinState: state.checkinState,
      }),
    }
  )
);
