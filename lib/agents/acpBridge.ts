/**
 * Virtuals ACP (Agent Commerce Protocol) 브릿지 — v2 SDK
 *
 * 역할:
 * - Provider: ACP Job을 수신하여 서비스 실행 (generate_fan_reply, mint_reply_nft)
 * - Buyer: 외부 Provider에게 Job 생성 (선택적)
 *
 * 전제조건:
 * - acp-cli configure 완료 (OS keychain에 Privy 토큰 저장)
 * - acp-cli agent create 완료 (acp-cli/config.json에 스마트 컨트랙트 지갑 정보)
 * - acp-cli agent register-erc8004 완료 (Base Sepolia 온체인 등록)
 */

import type { AcpAgent } from '@virtuals-protocol/acp-node-v2';
import { handleJob } from './acpProvider';
import { createAcpAgent } from './acpAgentFactory';

export function isAcpEnabled(): boolean {
  return process.env.ACP_ENABLED === 'true';
}

let acpAgent: AcpAgent | null = null;
let startPromise: Promise<AcpAgent> | null = null;

export async function getAcpAgent(): Promise<AcpAgent> {
  if (acpAgent) return acpAgent;

  // 동시 호출 시 하나의 초기화만 실행
  if (!startPromise) {
    startPromise = (async () => {
      const agent = await createAcpAgent();

      // Provider: 들어오는 ACP Job 처리
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      agent.on('entry', async (session: any, entry: any) => {
        const jobId: string = String(session?.jobId ?? entry?.onChainJobId ?? 'unknown');
        const eventType: string = entry?.kind === 'system' ? (entry?.event?.type ?? '') : 'message';

        console.log(`[ACP] Entry received: jobId=${jobId}, event=${eventType}`);

        // Provider only submits deliverable when job is funded
        if (eventType !== 'job.funded') return;

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

          const serviceName: string = (requirement.serviceName as string) ?? (requirement.service_name as string) ?? '';
          const jobLike = { serviceName, serviceRequirement: requirement, memo: '' };

          const result = await handleJob(jobLike);
          const deliverable = JSON.stringify(result);

          await session.submit(deliverable);
          console.log(`[ACP] Job submitted: jobId=${jobId}`);
        } catch (e) {
          console.error(`[ACP] Job handling failed: jobId=${jobId}`, e);
        }
      });

      await agent.start(() => {
        console.log(`[ACP] Agent started, listening for jobs (wallet: ${process.env.AGENT_WALLET_ADDRESS})`);
      });

      acpAgent = agent;
      return agent;
    })();
  }

  return startPromise;
}

/**
 * ACP Provider로서 초기화 — cron 또는 서버 시작 시 호출
 */
export async function initAcpProvider(): Promise<void> {
  if (!isAcpEnabled()) {
    console.log('[ACP] Disabled (ACP_ENABLED != true)');
    return;
  }
  try {
    await getAcpAgent();
  } catch (e) {
    console.error('[ACP] Provider init failed:', e);
    throw e;
  }
}

/**
 * ACP Buyer로서 Job 생성 — 외부 Provider에게 서비스 의뢰
 * (acp-node-v2의 AcpAgent 내부 client를 통해 온체인 Job 생성)
 */
export async function initiateAcpJob(
  providerAddress: `0x${string}`,
  serviceName: string,
  requirement: Record<string, unknown>,
): Promise<string | null> {
  if (!isAcpEnabled()) return null;

  try {
    const agent = await getAcpAgent();
    const chainId = process.env.IS_TESTNET === 'true' ? 84532 : 8453;

    const result = await agent.createJobByOfferingName(
      chainId,
      serviceName,
      providerAddress,
      requirement,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jobId = (result as any)?.jobId ?? (result as any)?.id ?? String(result ?? '');
    console.log(`[ACP] Job initiated: service=${serviceName}, jobId=${jobId}`);
    return String(jobId);
  } catch (e) {
    console.warn(`[ACP] Job initiation failed for ${serviceName}:`, e);
    return null;
  }
}

/**
 * 팬메일 처리 ACP 파이프라인
 */
export async function runAcpPipeline(params: {
  fanEmail: string;
  fanName: string;
  subject: string;
  content: string;
}): Promise<{ replyJobId: string | null; nftJobId: string | null }> {
  const replyProviderAddress = process.env.ACP_REPLY_PROVIDER_ADDRESS as `0x${string}`;
  const nftProviderAddress = process.env.ACP_NFT_PROVIDER_ADDRESS as `0x${string}`;

  const replyJobId = replyProviderAddress
    ? await initiateAcpJob(replyProviderAddress, 'generate_fan_reply', {
        fan_name: params.fanName,
        letter_subject: params.subject,
        letter_content: params.content.slice(0, 500),
      })
    : null;

  const nftJobId = nftProviderAddress
    ? await initiateAcpJob(nftProviderAddress, 'mint_reply_nft', {
        fan_email_hash: Buffer.from(params.fanEmail).toString('base64').slice(0, 16),
        received_at: new Date().toISOString(),
      })
    : null;

  return { replyJobId, nftJobId };
}
