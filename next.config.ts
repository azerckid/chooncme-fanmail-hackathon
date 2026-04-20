import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@coinbase/agentkit',
    '@coinbase/cdp-sdk',
    '@coinbase/coinbase-sdk',
    'viem',
  ],
};

export default nextConfig;
