# 해커톤 기술 명세 — Base Agent Hackathon #1

> Created: 2026-04-21
> Last Updated: 2026-04-21 (Basenames & Claim Page 설계 추가)

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

## 8. Related Documents

- **구현 로드맵**: [05_HACKATHON_ROADMAP.md](../04_Logic_Progress/05_HACKATHON_ROADMAP.md)
- **피칭 전략**: [03_HACKATHON_PITCHING_STRATEGY.md](../01_Concept_Design/03_HACKATHON_PITCHING_STRATEGY.md)
- **기존 DB 스키마**: [03_DATABASE_SCHEMA.md](./03_DATABASE_SCHEMA.md)
