import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@coinbase/agentkit',
    '@coinbase/cdp-sdk',
    '@coinbase/coinbase-sdk',
    'viem',
  ],
  transpilePackages: [
    '@virtuals-protocol/acp-node-v2',
  ],
};

export default nextConfig;
