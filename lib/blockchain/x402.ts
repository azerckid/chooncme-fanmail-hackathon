/**
 * x402 에이전트 자율 결제 미들웨어
 * Flock.io LLM 추론 요청 시 HTTP 402 응답을 감지하고 USDC로 자동 결제
 *
 * 작동 방식:
 * 1. 에이전트가 Flock.io API 요청
 * 2. 서버가 HTTP 402 + 결제 요구사항 반환
 * 3. x402 클라이언트가 AgentKit 지갑으로 USDC 자동 결제
 * 4. 결제 증명 헤더와 함께 원래 요청 재시도
 */

import { wrapFetchWithPayment, x402Client } from '@x402/fetch';
import { ExactEvmScheme, toClientEvmSigner } from '@x402/evm';
import { getWalletProvider, getAgentWalletAddress } from './agentkit';

// Base Sepolia = eip155:84532, Base Mainnet = eip155:8453
function getChainId(): string {
  return process.env.BASE_NETWORK === 'base-mainnet' ? 'eip155:8453' : 'eip155:84532';
}

let x402FetchInstance: typeof fetch | null = null;

export async function getX402Fetch(): Promise<typeof fetch> {
  if (x402FetchInstance) return x402FetchInstance;

  const provider = await getWalletProvider();
  const address = await getAgentWalletAddress() as `0x${string}`;

  // CdpEvmWalletProvider의 signTypedData를 x402 ClientEvmSigner로 래핑
  const signer = toClientEvmSigner({
    address,
    signTypedData: (typedData: Parameters<typeof provider.signTypedData>[0]) =>
      provider.signTypedData(typedData),
  });

  const chainId = getChainId() as `${string}:${string}`;
  const client = new x402Client().register(chainId, new ExactEvmScheme(signer));

  x402FetchInstance = wrapFetchWithPayment(globalThis.fetch, client);

  console.log(`[x402] Payment-enabled fetch initialized. Chain: ${chainId}, Wallet: ${address}`);
  return x402FetchInstance;
}

export function isX402Enabled(): boolean {
  return process.env.X402_ENABLED === 'true';
}
