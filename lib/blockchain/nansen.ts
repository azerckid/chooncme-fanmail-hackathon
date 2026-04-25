/**
 * Nansen API 클라이언트 — 팬 지갑 온체인 프로파일링
 *
 * 방향 A (기본): 에이전트 지갑의 수신 트랜잭션 조회 → 팬 지갑이 송금한 이력 확인 → VIP
 * 방향 B (폴백): 팬 지갑 레이블 조회 → Smart Money/High Activity 여부 확인
 * 방향 C (최종 폴백): Base RPC 잔액 기반 판단
 *
 * 에러 시 항상 { tier: 'regular', hasSentToAgent: false } 반환 (파이프라인 중단 방지)
 *
 * 주의: Nansen은 테스트넷(Base Sepolia) 미지원 — base 메인넷으로 조회
 */

export type FanTier = 'vip' | 'regular';

export interface NansenProfile {
  tier: FanTier;
  hasSentToAgent: boolean;
  labels?: string[];
}

const NANSEN_API_KEY = process.env.NANSEN_API_KEY;
const NANSEN_BASE_URL = process.env.NANSEN_BASE_URL ?? 'https://api.nansen.ai/api/v1';
const AGENT_WALLET = (process.env.AGENT_WALLET_ADDRESS ?? '').toLowerCase();

const FALLBACK: NansenProfile = { tier: 'regular', hasSentToAgent: false };

interface NansenTx {
  chain?: string;
  method?: string;
  from_address?: string;
  to_address?: string;
  tokens_sent?: Array<{ from_address?: string; to_address?: string }>;
  tokens_received?: Array<{ from_address?: string; to_address?: string }>;
}

interface NansenLabel {
  label: string;
  category: string;
}

function nansenHeaders() {
  return {
    'apikey': NANSEN_API_KEY!,
    'Content-Type': 'application/json',
  };
}

function dateRange() {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { from, to };
}

// 방향 A: 에이전트 지갑 수신 트랜잭션에서 팬 지갑 송금 이력 확인
async function checkViaSentToAgent(fanWallet: string): Promise<NansenProfile | null> {
  if (!AGENT_WALLET) return null;
  try {
    const res = await fetch(`${NANSEN_BASE_URL}/profiler/address/transactions`, {
      method: 'POST',
      headers: nansenHeaders(),
      body: JSON.stringify({
        address: AGENT_WALLET,
        chain: 'base',
        date: dateRange(),
      }),
    });
    if (!res.ok) return null;

    const data = await res.json() as { data?: NansenTx[] };
    const txs = data.data ?? [];
    const fanLower = fanWallet.toLowerCase();

    // tokens_received 내 from_address 또는 top-level from_address 확인
    const hasSentToAgent = txs.some((tx) => {
      if (tx.from_address?.toLowerCase() === fanLower) return true;
      return tx.tokens_received?.some((t) => t.from_address?.toLowerCase() === fanLower) ?? false;
    });

    if (!hasSentToAgent) return null;
    return { tier: 'vip', hasSentToAgent: true };
  } catch {
    return null;
  }
}

// 방향 B: 팬 지갑 레이블 조회 — Smart Money / High Activity 여부
async function checkViaLabels(fanWallet: string): Promise<NansenProfile | null> {
  try {
    const res = await fetch(`${NANSEN_BASE_URL}/profiler/address/labels`, {
      method: 'POST',
      headers: nansenHeaders(),
      body: JSON.stringify({ address: fanWallet, chain: 'base' }),
    });
    if (!res.ok) return null;

    const data = await res.json() as { data?: NansenLabel[] };
    const labels = (data.data ?? []).map((l) => l.label.toLowerCase());

    const VIP_LABELS = ['smart money', 'fund', 'whale', 'token billionaire', 'high activity', '30d smart trader'];
    const isVip = labels.some((l) => VIP_LABELS.some((v) => l.includes(v)));

    return {
      tier: isVip ? 'vip' : 'regular',
      hasSentToAgent: false,
      labels: data.data?.map((l) => l.label),
    };
  } catch {
    return null;
  }
}

// 방향 C: Base RPC 잔액 기반 (Nansen 불가 시 최종 폴백)
async function checkViaBaseRpc(fanWallet: string): Promise<NansenProfile | null> {
  const rpc = 'https://mainnet.base.org';
  try {
    const res = await fetch(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [fanWallet, 'latest'],
        id: 1,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { result?: string };
    const balanceEth = Number(BigInt(data.result ?? '0x0')) / 1e18;
    return { tier: balanceEth > 0.05 ? 'vip' : 'regular', hasSentToAgent: false };
  } catch {
    return null;
  }
}

/**
 * 팬 지갑 프로파일 조회
 * A(에이전트 지갑 수신 이력) → B(레이블) → C(Base RPC) 순서로 시도
 */
export async function getFanProfile(fanWalletAddress: string): Promise<NansenProfile> {
  if (!fanWalletAddress) return FALLBACK;

  if (NANSEN_API_KEY) {
    const resultA = await checkViaSentToAgent(fanWalletAddress);
    if (resultA) {
      console.log(`[Nansen] A: wallet=${fanWalletAddress}, tier=${resultA.tier}, hasSentToAgent=${resultA.hasSentToAgent}`);
      return resultA;
    }

    const resultB = await checkViaLabels(fanWalletAddress);
    if (resultB) {
      console.log(`[Nansen] B: wallet=${fanWalletAddress}, tier=${resultB.tier}, labels=${resultB.labels?.join(',')}`);
      return resultB;
    }

    console.warn('[Nansen] API failed, falling back to Base RPC');
  }

  const resultC = await checkViaBaseRpc(fanWalletAddress);
  if (resultC) {
    console.log(`[Nansen] C: wallet=${fanWalletAddress}, tier=${resultC.tier}`);
    return resultC;
  }

  return FALLBACK;
}
