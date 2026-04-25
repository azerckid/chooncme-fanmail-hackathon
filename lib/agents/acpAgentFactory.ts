/**
 * ACP v2 에이전트 팩토리 — acp-cli 설정을 읽어 Next.js 서버에서 Privy 기반 에이전트 생성
 *
 * acp-cli/src/lib/agentFactory.ts를 참조해 서버 환경에 맞게 재구현:
 * - config.json: acp-cli/config.json (acp configure + agent create 결과)
 * - signer binary: acp-cli/bin/acp-cli-signer-linux (P256 키 서명)
 */

import path from 'path';
import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { platform } from 'os';
import {
  AcpAgent,
  ACP_CONTRACT_ADDRESSES,
  PrivyAlchemyEvmProviderAdapter,
  ACP_TESTNET_SERVER_URL,
  ACP_SERVER_URL,
  EVM_TESTNET_CHAINS,
  EVM_MAINNET_CHAINS,
  TESTNET_PRIVY_APP_ID,
  PRIVY_APP_ID,
  SseTransport,
  AcpApiClient,
} from '@virtuals-protocol/acp-node-v2';

const ACP_CLI_DIR = path.join(process.cwd(), 'acp-cli');
const CONFIG_PATH = path.join(ACP_CLI_DIR, 'config.json');

function getBinaryPath(): string {
  const base = path.join(ACP_CLI_DIR, 'bin', 'acp-cli-signer');
  switch (platform()) {
    case 'darwin': return base + '-macos';
    case 'win32':  return base + '-windows.exe';
    default:       return base + '-linux';
  }
}

interface AgentConfig {
  publicKey: string;
  walletId?: string;
  id?: string;
  builderCode?: string;
}

interface CliConfig {
  ownerWallet?: string;
  activeWallet?: string;
  agents?: Record<string, AgentConfig>;
}

function loadCliConfig(): CliConfig {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error(
      `acp-cli config not found at ${CONFIG_PATH}. Run: cd acp-cli && IS_TESTNET=true npx tsx src/index.ts agent create`
    );
  }
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as CliConfig;
}

function createSignFn(publicKeyB64: string): (payload: Uint8Array) => Promise<string> {
  const binary = getBinaryPath();
  return async (payload: Uint8Array): Promise<string> => {
    const hex = Buffer.from(payload).toString('hex');
    const output = execFileSync(binary, ['sign', '--public-key', publicKeyB64, '--payload', hex], {
      encoding: 'utf8',
    });
    const result = JSON.parse(output.trim()) as { signature?: string; error?: string };
    if (result.error) throw new Error(`acp-cli-signer: ${result.error}`);
    return result.signature!;
  };
}

export async function createAcpAgent(): Promise<AcpAgent> {
  const isTestnet = process.env.IS_TESTNET === 'true';
  const chains = isTestnet ? EVM_TESTNET_CHAINS : EVM_MAINNET_CHAINS;
  const serverUrl = isTestnet ? ACP_TESTNET_SERVER_URL : ACP_SERVER_URL;
  const privyAppId = isTestnet ? TESTNET_PRIVY_APP_ID : PRIVY_APP_ID;

  const config = loadCliConfig();
  const walletAddress = config.activeWallet as `0x${string}`;
  if (!walletAddress) {
    throw new Error('No active agent in acp-cli config. Run: acp agent create');
  }

  const agentConfig = config.agents?.[walletAddress];
  if (!agentConfig) {
    throw new Error(`Agent config not found for wallet ${walletAddress}`);
  }

  const { publicKey, walletId, builderCode } = agentConfig;
  if (!walletId) {
    throw new Error(`walletId missing in acp-cli config for ${walletAddress}`);
  }

  const signFn = createSignFn(publicKey);

  const provider = await PrivyAlchemyEvmProviderAdapter.create({
    walletAddress,
    walletId,
    signFn,
    chains,
    serverUrl,
    privyAppId,
    builderCode,
  });

  console.log(`[ACP] Creating agent with wallet: ${walletAddress}`);

  return AcpAgent.create({
    contractAddresses: ACP_CONTRACT_ADDRESSES,
    provider,
    api: new AcpApiClient({ serverUrl }),
    transport: new SseTransport({ serverUrl }),
  });
}
