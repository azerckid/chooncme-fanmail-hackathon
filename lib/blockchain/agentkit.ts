import { CdpEvmWalletProvider } from '@coinbase/agentkit';

let walletProvider: CdpEvmWalletProvider | null = null;

export async function getWalletProvider(): Promise<CdpEvmWalletProvider> {
  if (walletProvider) return walletProvider;

  // CDP SDK v2 환경변수: CDP_API_KEY_ID, CDP_API_KEY_SECRET
  walletProvider = await CdpEvmWalletProvider.configureWithWallet({
    apiKeyId: process.env.CDP_API_KEY_ID,
    apiKeySecret: process.env.CDP_API_KEY_SECRET,
    walletSecret: process.env.CDP_WALLET_SECRET,
    networkId: process.env.BASE_NETWORK ?? 'base-sepolia',
    ...(process.env.AGENT_WALLET_ADDRESS && {
      address: process.env.AGENT_WALLET_ADDRESS as `0x${string}`,
    }),
  });

  const address = await walletProvider.getAddress();
  console.log(`[AgentKit] Initialized. Wallet: ${address}`);

  return walletProvider;
}

export async function getAgentWalletAddress(): Promise<string> {
  const provider = await getWalletProvider();
  return provider.getAddress();
}
