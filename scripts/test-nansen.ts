/**
 * Nansen API 검증 스크립트 (Phase 0)
 * Check 1: Smart Money 레이블 조회
 * Check 2: 포트폴리오 조회
 * Check 3: Base Sepolia 지원 여부
 *
 * 실행: npx ts-node scripts/test-nansen.ts [wallet_address]
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.NANSEN_API_KEY;
const BASE_URL = process.env.NANSEN_BASE_URL ?? 'https://api.nansen.ai/api/v1';

// 에이전트 지갑 (실제 송금 이력 확인용)
const AGENT_WALLET = process.env.AGENT_WALLET_ADDRESS ?? '0x363ad1c57C5cf94Ff4C0728Ca187bE4afB1Ee8B5';

// 테스트용 지갑 (Base Sepolia에서 활동 있는 유명 주소)
const TEST_WALLET = process.argv[2] ?? '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

if (!API_KEY) {
  console.error('[ERROR] NANSEN_API_KEY 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const headers = {
  'apikey': API_KEY!,
  'Content-Type': 'application/json',
};

async function checkEndpoint(name: string, url: string, method = 'GET', payload?: object): Promise<{ ok: boolean; status: number; body: unknown }> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const elapsed = Date.now() - start;
    let body: unknown;
    try { body = await res.json(); } catch { body = null; }

    const ok = res.status >= 200 && res.status < 300;
    console.log(`\n[${ok ? 'OK' : 'FAIL'}] ${name}`);
    console.log(`  URL: ${url}`);
    console.log(`  Status: ${res.status} (${elapsed}ms)`);
    console.log(`  Body: ${JSON.stringify(body, null, 2).slice(0, 500)}`);
    return { ok, status: res.status, body };
  } catch (err) {
    console.log(`\n[ERROR] ${name}`);
    console.log(`  URL: ${url}`);
    console.log(`  Error: ${err instanceof Error ? err.message : String(err)}`);
    return { ok: false, status: 0, body: null };
  }
}

const BASE_URL_CANDIDATES = [
  'https://api.nansen.ai/api/v1',
  'https://api.nansen.ai/api/v2',
  'https://api.nansen.ai/v1',
  'https://api.nansen.ai',
];

async function main() {
  console.log('=== Nansen API 검증 시작 ===');
  console.log(`Test Wallet: ${TEST_WALLET}`);
  console.log(`Agent Wallet: ${AGENT_WALLET}`);

  const BASE = 'https://api.nansen.ai/api/v1';

  // Check 1: 트랜잭션 이력 (팬 → 에이전트 지갑 송금 확인 핵심)
  const today = new Date().toISOString().slice(0, 10);
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dateRange = { from: oneYearAgo, to: today };

  // Check 1: 트랜잭션 이력 (base 메인넷 — Nansen은 테스트넷 미지원)
  const check1 = await checkEndpoint(
    'Check 1 — 트랜잭션 이력 (chain=base)',
    `${BASE}/profiler/address/transactions`,
    'POST',
    { address: TEST_WALLET, chain: 'base', date: dateRange }
  );

  // Check 1-B: ethereum
  await checkEndpoint(
    'Check 1-B — 트랜잭션 이력 (chain=ethereum)',
    `${BASE}/profiler/address/transactions`,
    'POST',
    { address: TEST_WALLET, chain: 'ethereum', date: dateRange }
  );

  // Check 2: Smart Money 레이블 (이미 동작 확인됨)
  const check2 = await checkEndpoint(
    'Check 2 — Smart Money 레이블 (chain=ethereum)',
    `${BASE}/profiler/address/labels`,
    'POST',
    { address: TEST_WALLET, chain: 'ethereum' }
  );

  // Check 2-B: base 레이블
  await checkEndpoint(
    'Check 2-B — Smart Money 레이블 (chain=base)',
    `${BASE}/profiler/address/labels`,
    'POST',
    { address: TEST_WALLET, chain: 'base' }
  );

  // Check 3: base 트랜잭션 + 에이전트 지갑 수신 이력 확인
  const check3 = await checkEndpoint(
    'Check 3 — 에이전트 지갑 수신 이력 (base)',
    `${BASE}/profiler/address/transactions`,
    'POST',
    { address: AGENT_WALLET, chain: 'base', date: dateRange }
  );

  // VIP 판별: 에이전트 지갑의 수신 트랜잭션에서 팬 지갑 확인
  console.log(`\n--- VIP 판별: 에이전트 지갑 수신 트랜잭션 ---`);
  if (check3.ok) {
    const txData = check3.body as { data?: Array<{ from?: string; to?: string }> };
    const txs = txData?.data ?? [];
    const testLower = TEST_WALLET.toLowerCase();
    const vipTx = txs.find((tx) => tx.from?.toLowerCase() === testLower);
    console.log(`  수신 트랜잭션 수: ${txs.length}`);
    console.log(`  테스트 지갑(${TEST_WALLET.slice(0,10)}...) 송금 이력: ${vipTx ? 'O (VIP!)' : 'X'}`);
    if (txs.length > 0) console.log(`  샘플: ${JSON.stringify(txs[0])}`);
  }

  // 결론
  console.log('\n=== 검증 결과 요약 ===');
  console.log(`트랜잭션 API (base 메인넷): ${check1.ok ? 'O' : 'X'}`);
  console.log(`레이블 API: ${check2.ok ? 'O' : 'X'}`);
  console.log(`에이전트 지갑 수신 조회: ${check3.ok ? 'O' : 'X'}`);
  console.log(`Base Sepolia 지원: X (Nansen 테스트넷 미지원 — base 메인넷 사용)`);

  console.log('\n=== 권장 방향 ===');
  if (check1.ok && check3.ok) {
    console.log('→ 방향 A: 에이전트 지갑 수신 트랜잭션에서 팬 지갑 확인 → VIP 판별');
  } else if (check2.ok) {
    console.log('→ 방향 B: Nansen 레이블(Smart Money) 기반 VIP 판별');
  } else {
    console.log('→ 방향 C: Base RPC 직접 조회');
  }
}

main().catch(console.error);
