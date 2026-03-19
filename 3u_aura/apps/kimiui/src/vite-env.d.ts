/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_PROMOTION_RPC_URL: string
  readonly VITE_PROMOTION_CHAIN_ID: string
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_PAYMENT_TOKEN_ADDRESS: string
  readonly VITE_NFT_SALE_ADDRESS: string
  readonly VITE_MERKLE_CLAIM_ADDRESS: string
  readonly VITE_SETTLEMENT_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
