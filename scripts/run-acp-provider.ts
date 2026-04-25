/**
 * ACP Provider 실행 스크립트
 * Reply Worker + NFT Worker 에이전트를 Provider로 실행하여 Job 수신 대기
 *
 * 실행: npx ts-node --compiler-options '{"module":"CommonJS"}' -r tsconfig-paths/register scripts/run-acp-provider.ts
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { platform } from 'os';
import {
  AcpAgent,
  ACP_CONTRACT_ADDRESSES,
  PrivyAlchemyEvmProviderAdapter,
  ACP_SERVER_URL,
  EVM_MAINNET_CHAINS,
  PRIVY_APP_ID,
  SseTransport,
  AcpApiClient,
} from '@virtuals-protocol/acp-node-v2';
import { handleJob } from '../lib/agents/acpProvider';

const ACP_CLI_DIR = path.join(process.cwd(), 'acp-cli');
const CONFIG_PATH = path.join(ACP_CLI_DIR, 'config.json');

function getBinaryPath(): string {
  const base = path.join(ACP_CLI_DIR, 'bin', 'acp-cli-signer');
  switch (platform()) {
    case 'darwin': return base + '-macos';
    case 'win32': return base + '-windows.exe';
    default: return base + '-linux';
  }
}

function createSignFn(publicKey: string) {
  const binary = getBinaryPath();
  return async (payload: Uint8Array): Promise<string> => {
    const hex = Buffer.from(payload).toString('hex');
    const output = execFileSync(binary, ['sign', '--public-key', publicKey, '--payload', hex], { encoding: 'utf8' });
    const result = JSON.parse(output.trim()) as { signature?: string; error?: string };
    if (result.error) throw new Error(`signer: ${result.error}`);
    return result.signature!;
  };
}

async function createProviderAgent(walletAddress: string, serviceName: string, label: string): Promise<AcpAgent> {
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as {
    agents?: Record<string, { publicKey: string; walletId?: string; builderCode?: string }>;
  };
  const agentConfig = config.agents?.[walletAddress];
  if (!agentConfig?.walletId) throw new Error(`No config for wallet ${walletAddress}`);

  const provider = await PrivyAlchemyEvmProviderAdapter.create({
    walletAddress: walletAddress as `0x${string}`,
    walletId: agentConfig.walletId,
    signFn: createSignFn(agentConfig.publicKey),
    chains: EVM_MAINNET_CHAINS,
    serverUrl: ACP_SERVER_URL,
    privyAppId: PRIVY_APP_ID,
    builderCode: agentConfig.builderCode,
  });

  const agent = await AcpAgent.create({
    contractAddresses: ACP_CONTRACT_ADDRESSES,
    provider,
    api: new AcpApiClient({ serverUrl: ACP_SERVER_URL }),
    transport: new SseTransport({ serverUrl: ACP_SERVER_URL }),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  agent.on('entry', async (session: any, entry: any) => {
    const jobId: string = String(session?.jobId ?? entry?.onChainJobId ?? 'unknown');
    const eventType: string = entry?.kind === 'system' ? (entry?.event?.type ?? '') : 'message';

    console.log(`[${label}] Entry received: jobId=${jobId}, event=${eventType}, status=${session?.status}`);

    // Provider only submits deliverable when job is funded
    if (eventType !== 'job.funded') {
      console.log(`[${label}] Skipping event ${eventType} (waiting for job.funded)`);
      return;
    }

    try {
      const job = session.job;
      let requirement: Record<string, unknown> = {};
      if (job?.description) {
        try {
          requirement = typeof job.description === 'string'
            ? JSON.parse(job.description)
            : job.description;
        } catch {
          requirement = { raw: job.description };
        }
      }

      console.log(`[${label}] Processing ${serviceName} job, requirement keys: ${Object.keys(requirement).join(', ')}`);

      const jobLike = {
        serviceName,
        serviceRequirement: requirement,
        memo: '',
      };

      const result = await handleJob(jobLike);
      const deliverable = JSON.stringify(result);

      await session.submit(deliverable);
      console.log(`[${label}] Job submitted: jobId=${jobId}`);
    } catch (e) {
      console.error(`[${label}] Job handling failed: jobId=${jobId}`, e);
    }
  });

  await agent.start(() => {
    console.log(`[${label}] Provider started, listening for jobs... (wallet=${walletAddress}, service=${serviceName})`);
  });

  return agent;
}

async function main() {
  console.log('ACP Provider 에이전트 시작 중...');

  const REPLY_PROVIDER = process.env.ACP_REPLY_PROVIDER_ADDRESS ?? '0x1b2241c33cf7319475332dd6bddae7bf54c268bd';
  const NFT_PROVIDER = process.env.ACP_NFT_PROVIDER_ADDRESS ?? '0xa271e22771b2445f260b2fe64f5a8b141dcc7d59';

  await Promise.all([
    createProviderAgent(REPLY_PROVIDER, 'generate_fan_reply', 'ReplyWorker'),
    createProviderAgent(NFT_PROVIDER, 'mint_reply_nft', 'NFTWorker'),
  ]);

  console.log('모든 Provider 실행 중. Ctrl+C로 종료.');
  await new Promise(() => {}); // keep alive
}

main().catch(console.error);
