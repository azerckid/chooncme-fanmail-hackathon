/**
 * Virtuals ACP (Agent Commerce Protocol) 브릿지
 *
 * 역할:
 * - Orchestrator = ACP Client (서비스 구매자)
 * - 각 Worker    = ACP Provider (서비스 판매자)
 *
 * 흐름:
 * 1. Orchestrator → ACP Job 생성 (on-chain) + USDC 에스크로
 * 2. Provider(Worker)가 Job 수락 → 서비스 실행
 * 3. 완료 시 USDC 릴리즈
 *
 * 환경변수:
 * ACP_ENABLED=true
 * AGENT_WALLET_PRIVATE_KEY=   (AgentKit 지갑 private key)
 * ACP_REPLY_PROVIDER_ADDRESS= (ReplyWorker 에이전트 주소)
 * ACP_NFT_PROVIDER_ADDRESS=   (NFTWorker 에이전트 주소)
 */

import AcpClient from '@virtuals-protocol/acp-node';
import {
  AcpContractClientV2,
  AcpJobPhases,
  baseSepoliaAcpX402ConfigV2,
  ethFare,
  FareAmount,
} from '@virtuals-protocol/acp-node';

export function isAcpEnabled(): boolean {
  return (
    process.env.ACP_ENABLED === 'true' &&
    !!process.env.ACP_WALLET_PRIVATE_KEY  // AgentKit의 CDP 키와 별도 관리
  );
}

let acpClient: AcpClient | null = null;

export async function getAcpClient(): Promise<AcpClient> {
  if (acpClient) return acpClient;

  // ACP는 AgentKit(CDP OAuth)과 독립적인 raw private key 방식 사용
  // AgentKit: CDP_API_KEY_ID + CDP_API_KEY_SECRET
  // ACP:      ACP_WALLET_PRIVATE_KEY (동일 또는 별도 지갑 가능)
  const privateKey = process.env.ACP_WALLET_PRIVATE_KEY as `0x${string}`;
  const agentAddress = process.env.AGENT_WALLET_ADDRESS as `0x${string}`;

  if (!privateKey || !agentAddress) {
    throw new Error('ACP_WALLET_PRIVATE_KEY and AGENT_WALLET_ADDRESS are required for ACP');
  }

  // AcpContractClientV2: Base Sepolia + x402 결제 설정
  const contractClient = await AcpContractClientV2.build(
    privateKey,
    1, // sessionEntityKeyId
    agentAddress,
    baseSepoliaAcpX402ConfigV2,
  );

  acpClient = new AcpClient({
    acpContractClient: contractClient,
    skipSocketConnection: true, // 소켓 없이 온체인 직접 호출

    onNewTask: async (job: any, memo?: any) => {
      console.log(`[ACP] New job received: jobId=${job.id}, from=${job.clientAddress}`);
    },

    onEvaluate: async (job: any) => {
      console.log(`[ACP] Job evaluated: jobId=${job.id}, phase=${job.phase}`);
    },
  });

  await acpClient.init(true); // skipSocketConnection=true
  console.log('[ACP] Client initialized');

  return acpClient;
}

/**
 * ACP Job 생성 — Orchestrator가 Provider Worker에게 서비스 의뢰
 *
 * @param providerAddress Worker의 온체인 주소
 * @param serviceName      서비스 이름 (로깅용)
 * @param requirement      서비스 요구사항 (JSON)
 * @param fareUsdc         USDC 요금 (기본 0.001 USDC — 테스트넷)
 */
export async function initiateAcpJob(
  providerAddress: `0x${string}`,
  serviceName: string,
  requirement: Record<string, unknown>,
  fareUsdc = 0.001,
): Promise<number | null> {
  if (!isAcpEnabled()) return null;

  try {
    const client = await getAcpClient();

    const expiredAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

    // FareAmount: fareUsdc * 1e6 = base unit (number 타입)
    const fareBaseUnit = Math.round(fareUsdc * 1_000_000);
    const fare = new FareAmount(fareBaseUnit, ethFare);

    const jobId = await client.initiateJob(
      providerAddress,
      JSON.stringify(requirement),
      fare,
      undefined,  // evaluator (옵션)
      expiredAt,
      serviceName,
    );

    console.log(`[ACP] Job initiated: service=${serviceName}, jobId=${jobId}, fare=${fareUsdc} USDC`);
    return jobId;
  } catch (e) {
    console.warn(`[ACP] Job initiation failed for ${serviceName}, continuing without ACP:`, e);
    return null;
  }
}

/**
 * ACP 멀티 에이전트 파이프라인:
 * 1. ReplyWorker에게 Job 생성 → 답장 의뢰 (USDC 지불)
 * 2. NFTWorker에게 Job 생성  → NFT 민팅 의뢰 (USDC 지불)
 */
export async function runAcpPipeline(params: {
  fanEmail: string;
  fanName: string;
  subject: string;
  content: string;
}): Promise<{ replyJobId: number | null; nftJobId: number | null }> {
  const replyProviderAddress = process.env.ACP_REPLY_PROVIDER_ADDRESS as `0x${string}`;
  const nftProviderAddress = process.env.ACP_NFT_PROVIDER_ADDRESS as `0x${string}`;

  // ReplyWorker에게 답장 생성 의뢰
  const replyJobId = replyProviderAddress
    ? await initiateAcpJob(
        replyProviderAddress,
        'generate_fan_reply',
        {
          fan_name: params.fanName,
          letter_subject: params.subject,
          letter_content: params.content.slice(0, 500),
        },
        0.001,
      )
    : null;

  // NFTWorker에게 NFT 민팅 의뢰
  const nftJobId = nftProviderAddress
    ? await initiateAcpJob(
        nftProviderAddress,
        'mint_reply_nft',
        {
          fan_email_hash: Buffer.from(params.fanEmail).toString('base64').slice(0, 16),
          received_at: new Date().toISOString(),
        },
        0.001,
      )
    : null;

  return { replyJobId, nftJobId };
}
