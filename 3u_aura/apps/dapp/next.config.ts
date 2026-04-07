import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  webpack(config) {
    // RainbowKit / wagmi can reference optional wallet SDKs that are not
    // installed in our local fork-anvil UAT environment. Ignore them so dev
    // compilation can proceed for injected-wallet testing.
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@base-org/account": false,
      "@coinbase/wallet-sdk": false,
      "@metamask/connect-evm": false,
      "@react-native-async-storage/async-storage": false,
      "@safe-global/safe-apps-provider": false,
      "@safe-global/safe-apps-sdk": false,
      "@walletconnect/ethereum-provider": false,
      porto: false,
      "porto/internal": false,
    };

    return config;
  },
};

export default withNextIntl(nextConfig);
