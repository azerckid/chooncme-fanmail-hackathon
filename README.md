# Creator Agent Platform — on Base

> 모든 크리에이터가 자신만의 AI 팬 에이전트를 Base 위에 배포할 수 있는 플랫폼.
> 춘심이(K-pop trainee)는 첫 번째 인스턴스입니다.

**Base Agent Hackathon #1** 출전작 | 2026-04-25

---

## Architecture

```
팬 이메일
    │
    ▼
Gmail API (수집)
    │
    ▼
Flock.io LLM ──(x402 자율 결제)──▶ AgentKit 지갑 (Base Sepolia)
(분류 + 답장 생성)                        │
    │                            감정 분석 기반 NFT 민팅
    │                            ├── Golden Reply NFT  (love/support/joy)
    │                            ├── Comfort Reply NFT (longing/sadness)
    │                            └── Standard Reply NFT (neutral)
    │                                     │
    ▼                                     ▼
답장 이메일 발송 ◀────── NFT 클레임 링크 생성
    │
    ▼
팬 수신함: 답장 + "Base에서 내 Reply NFT 확인하기" 링크
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Database | Turso (SQLite) + Drizzle ORM |
| LLM | Flock.io Web3 Agent Model |
| Email | Gmail API (OAuth2) |
| Blockchain | Base Sepolia (ERC-721) |
| Agent Wallet | Coinbase AgentKit (CdpEvmWalletProvider) |
| Payment | x402 Protocol (M2M autonomous payment) |
| Scheduler | Vercel Cron |

---

## Key Features

- **AI Fan Reply** — Flock.io LLM이 춘심이 페르소나로 팬레터에 자동 답장
- **Reply NFT Minting** — AgentKit이 답장을 ERC-721 NFT로 Base에 영구 기록
- **Emotion-Based Tier** — 감정 분석 결과에 따라 Golden / Comfort / Standard NFT 자동 결정
- **Autonomous Payment** — 에이전트가 LLM 추론 비용을 x402로 자율 온체인 결제 (Phase 3)
- **Multi-language** — 팬레터 언어(한/영/일)에 맞춰 자동 답장
- **Follow-up** — 1주 → 2주 → 4주 → 8주 자동 팔로업
- **Demo Mode** — `DEMO_MODE=true` 시 즉시 처리 (지연 0~30초)

---

## Traction

- X(Twitter) 팬덤 **33,000명**
- 런칭 1개월 만에 **23명의 코어 팬과 228통의 팬레터** 교환 완료
- 이미 프로덕션 수준의 파이프라인이 실제로 작동 중

---

## Quick Start

```bash
npm install
cp .env.example .env.local   # 환경변수 설정
npm run db:migrate
npm run dev
```

### Demo Mode (해커톤 시연용)

```bash
# .env.local
DEMO_MODE=true

# 이메일 처리 즉시 트리거
curl -X POST http://localhost:3000/api/demo/trigger \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Environment Variables

```env
# Database
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=

# Gmail
GMAIL_USER=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=

# LLM — Flock.io (우선) / Gemini (폴백)
FLOCK_API_KEY=
FLOCK_BASE_URL=
GOOGLE_GEMINI_API_KEY=

# Coinbase AgentKit
CDP_API_KEY_ID=
CDP_API_KEY_SECRET=
AGENT_WALLET_ADDRESS=      # 재시작 시 동일 지갑 복구

# NFT
NFT_CONTRACT_ADDRESS=      # Base Sepolia ERC-721
BASE_NETWORK=base-sepolia
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Demo
DEMO_MODE=false
CRON_SECRET=

# Optional
REPLY_DELAY_MIN=10
REPLY_DELAY_MAX=30
EMAIL_DRY_RUN=false
FOLLOWUP_ENABLED=true
```

---

## NFT Contract (ERC-721)

```solidity
// contracts/ReplyNFT.sol
contract ReplyNFT is ERC721URIStorage, Ownable {
    function mintTo(address recipient, string memory tokenURI)
        external onlyOwner returns (uint256)
}
```

Deploy on Base Sepolia via [Remix IDE](https://remix.ethereum.org).
Contract owner must match AgentKit wallet address.

---

## Project Structure

```
lib/
  blockchain/
    agentkit.ts     # CdpEvmWalletProvider singleton
    nft.ts          # Reply NFT minting (tier-based)
  llm/
    client.ts       # Flock.io / Gemini / OpenAI multi-provider
  scheduler/
    process-emails.ts   # Main pipeline (fetch → classify → reply → mint)
    delayed-send.ts     # DEMO_MODE delay control
app/
  api/
    cron/check-email/   # Hourly cron trigger
    demo/trigger/       # Instant trigger for demo
  dashboard/            # Admin UI (Coinbase design)
  claim/[id]/           # NFT claim page (WIP)
```

---

## Closing

> "춘심이는 첫 번째 인스턴스입니다. 다음은 당신이 좋아하는 아이돌입니다."
