# 해커톤 기술 명세 — Base Agent Hackathon #1

> Created: 2026-04-21
> Last Updated: 2026-04-24 (Nansen VIP 팬 등급 시스템 추가)

---

## 1. 아키텍처 변경 요약

### 기존 아키텍처
```
Gmail API → Gemini LLM → 답장 이메일 발송
```

### 해커톤 아키텍처
```
Gmail API
  → Flock.io LLM (x402 자율 결제 — Phase 3)
  → AgentKit: Reply NFT 민팅 (Base Sepolia)
  → 답장 이메일 + 전용 NFT Claim Page 링크 발송
```

---

## 2. Flock.io LLM 연동

### 변경 파일: `lib/llm/client.ts`

Flock.io는 OpenAI SDK 호환 API를 제공한다. `baseURL`과 API Key 교체로 전환 가능.

```typescript
// 기존 (Gemini)
import { GoogleGenerativeAI } from '@google/generative-ai'

// 변경 (Flock.io — OpenAI 호환)
import OpenAI from 'openai'

export const flockClient = new OpenAI({
  apiKey: process.env.FLOCK_API_KEY!,
  baseURL: process.env.FLOCK_BASE_URL!,
})

// 모델: Flock.io Web3 Agent Model 권장
export const FLOCK_MODEL = 'flock-web3-agent'
```

### AI Safety & Guardrail (중요)
- 유해 콘텐츠(혐오, 정치, 편향 등) 방지를 위한 시스템 프롬프트 강화
- 크리에이터 페르소나 준수 및 개인정보 수집 금지 가이드라인 적용

---

## 3. AgentKit 연동

### 신규 파일: `lib/blockchain/agentkit.ts`

```typescript
import { AgentKit, CdpWalletProvider } from '@coinbase/agentkit'

let agentkit: AgentKit | null = null

export async function getAgentKit(): Promise<AgentKit> {
  if (agentkit) return agentkit

  const walletProvider = await CdpWalletProvider.configureWithWallet({
    apiKeyName: process.env.CDP_API_KEY_NAME!,
    apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY!,
    networkId: process.env.BASE_NETWORK ?? 'base-sepolia',
    ...(process.env.AGENT_WALLET_SEED && {
      seed: process.env.AGENT_WALLET_SEED,
    }),
  })

  agentkit = await AgentKit.from({ walletProvider })
  return agentkit
}
```

### 신규 파일: `lib/blockchain/nft.ts`

```typescript
import { getAgentKit } from './agentkit'
import crypto from 'crypto'

export interface MintResult {
  tokenId: string
  txHash: string
  claimUrl: string
}

export async function mintReplyNFT(params: {
  senderName: string
  replyContent: string
  receivedAt: string
}): Promise<MintResult> {
  const kit = await getAgentKit()

  const replyHash = crypto
    .createHash('sha256')
    .update(params.replyContent)
    .digest('hex')
    .slice(0, 16)

  const metadata = {
    name: `춘심이의 답장`,
    description: '춘심이가 직접 쓴 팬레터 답장입니다.',
    attributes: [
      { trait_type: 'recipient', value: params.senderName }, // PII 주의: 익명화 처리 권장
      { trait_type: 'date', value: params.receivedAt },
      { trait_type: 'reply_hash', value: replyHash },
    ],
  }

  const result = await kit.run(
    `Mint an NFT on contract ${process.env.NFT_CONTRACT_ADDRESS} with metadata: ${JSON.stringify(metadata)}`
  )

  return {
    tokenId: result.tokenId,
    txHash: result.transactionHash,
    claimUrl: `${process.env.NEXT_PUBLIC_APP_URL}/claim/${result.transactionHash}`,
  }
}
```

---

## 3.5. Basenames & Identity 연동

에이전트 지갑에 온체인 이름을 부여하여 신뢰를 확보한다.

- **방법**: `base.eth` 등록 (Base Sepolia)
- **표출**: 이메일 주소 하단 및 대시보드 상단에 `chooncme.base.eth` 표기
- **효과**: "에이전트"로서의 브랜드 확립 및 Base 생태계 기술 우위 점유

---

## 4. Reply NFT 파이프라인 연동

### 수정 파일: `lib/scheduler/reply-generator.ts`
답장 생성 후 `mintReplyNFT` 호출 및 결과값 저장.

### 수정 파일: `lib/mail.ts`
이메일 본문에 전용 Claim Page 링크 삽입.

---

## 4.5. 전용 NFT Claim Page (app/claim/[id])

- **UX**: Basescan 대신 팬들을 위한 감성적인 UI 제공
- **Web3 연동**: Coinbase Smart Wallet 전면 배치
  - 지갑 없는 사용자도 Passkey(생체인증)로 즉시 지갑 생성 및 보관 가능
- **Verifiable Proof**: 온체인 해시와 이메일 내용 교차 검증 UI 제공

---

## 5. x402 자율 결제 연동 (Phase 3 — 조건부)

- **전제 조건**: Flock.io의 x402 지불 프로토콜 지원 여부 확인
- **개념**: 에이전트가 추론 한 건당 micro-payment를 USDC로 자동 실행

---

## 6. 신규 디렉토리 구조
```
lib/
  blockchain/
    agentkit.ts    # AgentKit 클라이언트 싱글톤
    nft.ts         # Reply NFT 민팅 및 Basenames 연동
app/
  claim/
    [id]/
      page.tsx     # 전용 NFT 클레임 및 시각화 페이지
```

---

## 7. 환경변수 전체 목록 (해커톤 추가분)

| 변수명 | 필수 | 설명 |
|:---|:---:|:---|
| `FLOCK_API_KEY` | O | Flock.io API Key |
| `FLOCK_BASE_URL` | O | Flock.io OpenAI 호환 엔드포인트 URL |
| `CDP_API_KEY_NAME` | O | Coinbase CDP API Key Name |
| `CDP_API_KEY_PRIVATE_KEY` | O | Coinbase CDP API Private Key |
| `AGENT_WALLET_SEED` | 권장 | 에이전트 지갑 복구용 시드 |
| `NFT_CONTRACT_ADDRESS` | O | Base Sepolia ERC-721 컨트랙트 주소 |
| `NEXT_PUBLIC_APP_URL` | O | 앱 도메인 (Claim Page 링크용) |

---

## 8. Nansen VIP 팬 온체인 등급 시스템 (Phase 10)

> Nansen API 검증 결과에 따라 방향 A/B/C 중 선택.
> 검증 절차: [../05_QA_Validation/03_Nansen_API_검증_및_구현결정.md](../05_QA_Validation/03_Nansen_API_검증_및_구현결정.md)

### 8-1. 개요

팬이 팬메일 본문에 지갑 주소를 포함하면 에이전트가 Nansen API로 해당 지갑이
AgentKit 에이전트 지갑(`AGENT_WALLET_ADDRESS`)으로 과거에 ETH/USDC를 송금한 이력이
있는지 조회한다. 후원 이력이 확인되면 Golden Reply NFT + 특별 답장을 발행한다.

### 8-2. 신규 파일: `lib/blockchain/nansen.ts`

```typescript
export type FanTier = 'vip' | 'regular';

export interface NansenProfile {
  tier: FanTier;
  hasSentToAgent: boolean;       // 에이전트 지갑 송금 이력
  totalSentUsd: number;          // 총 송금액 추정치
}

/**
 * 팬 지갑의 에이전트 지갑 후원 이력 조회
 * 방향 A: Nansen API 직접 호출
 * 방향 B: 포트폴리오 데이터 기반 임계값 분류
 * 방향 C: Base RPC 직접 조회 (Nansen 폴백)
 */
export async function getFanProfile(
  fanWalletAddress: string
): Promise<NansenProfile>
```

### 8-3. 수정 파일: `lib/email/classify.ts`

팬메일 본문에서 지갑 주소 파싱 추가.

```typescript
// 0x로 시작하는 42자리 hex 주소 추출
const WALLET_REGEX = /0x[a-fA-F0-9]{40}/g;

export function extractWalletAddress(body: string): string | null {
  const matches = body.match(WALLET_REGEX);
  return matches?.[0] ?? null;
}
```

### 8-4. 수정 파일: `lib/llm/reply-prompt.ts`

팬 티어에 따라 시스템 프롬프트 분기.

```typescript
export function buildReplyPrompt(
  letter: FanLetter,
  tier: FanTier = 'regular'
): { systemPrompt: string; userPrompt: string } {
  const vipPrefix = tier === 'vip'
    ? '이 팬은 직접 후원을 보내준 소중한 팬입니다. 평소보다 훨씬 길고 감동적인 답장을 써주세요. 후원에 대한 진심 어린 감사를 꼭 표현하세요.'
    : '';
  // ...기존 프롬프트에 vipPrefix 주입
}
```

### 8-5. 수정 파일: `lib/blockchain/nft.ts`

`getTierFromEmotion()` 외 온체인 후원 이력 기반 티어 트리거 추가.

```typescript
// 기존: 감정 기반
// 추가: VIP 팬이면 무조건 golden 오버라이드
export function resolveFinalTier(
  emotionTier: NftTier,
  fanTier: FanTier
): NftTier {
  if (fanTier === 'vip') return 'golden';
  return emotionTier;
}
```

### 8-6. 파이프라인 연동 흐름

```
Gmail 수신 → 이메일 본문에서 지갑 주소 추출
  ├─ 지갑 주소 있음 → Nansen API 조회 → FanTier 결정
  │     ├─ vip   → VIP 프롬프트 + Golden NFT 민팅
  │     └─ regular → 기본 프롬프트 + 감정 기반 NFT 티어
  └─ 지갑 주소 없음 → 기본 프롬프트 + 감정 기반 NFT 티어
```

### 8-7. 환경변수 추가

| 변수명 | 필수 | 설명 |
|:---|:---:|:---|
| `NANSEN_API_KEY` | O (Phase 10) | Nansen API Key (행사 당일 크레딧 수령) |
| `NANSEN_BASE_URL` | — | 기본값: `https://api.nansen.ai/v1` |

### 8-8. 데모 준비 (해킹 시작 전)

- 테스트 팬 지갑에서 AgentKit 지갑(`0x363a...`)으로 Base Sepolia ETH 소액 송금
- 해당 지갑 주소를 포함한 팬메일 초안 준비
- 심사 중 발송 → Golden NFT 수령 라이브 시연

---

## 9. Related Documents

- **구현 로드맵**: [05_HACKATHON_ROADMAP.md](../04_Logic_Progress/05_HACKATHON_ROADMAP.md)
- **피칭 전략**: [03_HACKATHON_PITCHING_STRATEGY.md](../01_Concept_Design/03_HACKATHON_PITCHING_STRATEGY.md)
- **기존 DB 스키마**: [03_DATABASE_SCHEMA.md](./03_DATABASE_SCHEMA.md)
