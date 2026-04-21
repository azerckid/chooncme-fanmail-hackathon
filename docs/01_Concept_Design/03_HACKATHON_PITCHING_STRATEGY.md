# Base Agent Hackathon #1 — 피칭 전략 문서

> Created: 2026-04-21
> Last Updated: 2026-04-21 (Basenames, Smart Wallet, AI Safety 보강)

---

## 1. 핵심 포지셔닝

**제품명**: Creator Agent Platform (on Base)

**한 줄 정의 (Hook)**
> "모든 크리에이터가 자신만의 AI 팬 에이전트를 Base 위에 배포할 수 있는 플랫폼"

**포지셔닝 원칙**
- 춘심이는 프로토타입 유즈케이스(데모 인스턴스)다.
- 실제 제품은 어떤 크리에이터/아이돌/인플루언서도 자신만의 AI 팬 응답 에이전트를 Base 위에 배포할 수 있는 플랫폼이다.
- "Protocol"이 아닌 "Platform" — 현재 구조는 멀티테넌트 배포 인터페이스가 없으므로 과장을 피한다.

---

## 2. 피칭 구조

### Problem
**크리에이터의 스케일링 한계 문제 (실제 데이터 증명)**
- 춘심이의 X(Twitter) 팬덤은 33,000명이나 됨
- 이메일을 공개한 지 오픈 1개월 만에 코어 팬 23명이 228통의 팬레터를 쏟아냄
- **문제**: 글로벌 규모로 쏟아지는 극도의 팬심을 크리에이터가 수동으로 절대 감당 불가 (답장 확률 수렴 = 0%)
- 기존 챗봇은 기계적이고 차가워서 팬덤의 몰입(Persona)을 깨뜨림

### Solution
- 크리에이터 페르소나 기반 AI 에이전트가 팬 메일을 자동 분류 및 답장 생성 (Flock.io LLM)
- 에이전트가 **팬레터의 감정을 자율 분석하고, 결과에 따라 다르게 행동**한다:
  - 감동적인 팬레터 (sentimentScore >= 0.9) → **Golden Reply NFT** 민팅 (특별 한정판)
  - 슬픈 팬레터 → 위로 특화 답장 + 팔로업 주기 단축
  - 일반 → 표준 답장 + 표준 Reply NFT
- 답장을 **Reply NFT**로 민팅(AgentKit) → 팬에게 전용 Claim Page 링크 발송
- **Basenames Identity**: 에이전트 지갑에 `chooncme.base.eth` 이름을 부여하여 온체인 정체성 확립
- **보안 & 신뢰**: 에이전트가 부적합한 발언을 하지 않도록 **AI Safety Guardrail** 적용
- **페르소나를 JSON 설정 파일로 외부화** → 코드 변경 없이 새 크리에이터 에이전트 즉시 배포 가능

> 이것은 단순 자동화 파이프라인이 아니다. 에이전트가 상황을 판단하고 행동을 달리하며, 자신의 이름을 가진 **자율적 지능**이다.

### Demo (라이브 인스턴스)
- 춘심이 = 실제 작동하는 프로덕션 인스턴스
- 심사위원이 직접 이메일 발송 → NFT 클레임 링크 수신 → 전용 UI에서 확인까지 시연

**Web3 UX 시연 (The "Wow" Factor):**
- 클레임 페이지에서 **Coinbase Smart Wallet** 버튼 클릭 한 번으로 지갑 생성 및 NFT 수령 시연
- "지갑이 없는 팬들도 10초 만에 Base 유저가 됩니다." 문구 강조

**Agent Intelligence 시연 시나리오:**
1. 심사위원이 일반 팬레터 발송 → 표준 Reply NFT 민팅
2. 심사위원이 감동적인 팬레터 발송 → **Golden Reply NFT** 민팅
3. 클레임 페이지에서 두 NFT의 메타데이터 및 `reply_hash` 무결성 검증 시연

### Traction
- **X(Twitter) 팬덤 33,000명** 보유
- **런칭 1개월 만에 23명의 코어 팬과 228통의 팬레터 교환 완료**
- 이미 트래픽이 터지고 있는 제품에 Web3의 **"영구성(NFT)"**과 **"자율성(Agent)"**을 결합

### Why Base / Why Now
- Virtuals Protocol이 증명한 시장: 크리에이터 AI 에이전트 수요 폭발
- **Mass Adoption Ready**: Coinbase Smart Wallet을 통해 복잡한 복구구문 없이 일반 팬들을 대거 온보딩 가능
- Flock.io LLM + AgentKit 조합으로 가장 Base스러운 AI 에이전트 구현

### Business Model (Agentic Commerce)
- 플랫폼 수익: 에이전트 배포 및 관리 구독료
- 에이전트 지출: Flock.io 추론 비용을 x402로 자율 온체인 결제
- 에이전트는 "자율적으로 운영 비용을 집행하는 경제 주체"

### Closing Line
> "춘심이는 첫 번째 인스턴스입니다. 다음은 당신이 좋아하는 아이돌입니다."

---

## 3. 피칭 섹션별 강도 평가

| 항목 | 점수 | 비고 |
|:---|:---:|:---|
| Hook | 9/10 | 강력한 시장성 |
| Problem | 10/10 | 실제 데이터(33k 팬덤)로 완벽 증명 |
| Solution | 10/10 | Intelligence + Identity + Safety 모두 충족 |
| Demo | 9/10 | Smart Wallet UX로 "Web3는 어렵다"는 편견 타파 |
| Traction | 10/10 | "이미 작동 중"이라는 사실이 가장 강력함 |
| Why Base | 10/10 | Basenames, Smart Wallet 등 Base 핵심 기술 집약 |

---

## 4. 기술별 구현 기능 일람

심사위원 질문 대응 및 데모 시연 레퍼런스.

| 기술 | 구현된 기능 | 파일 |
|:---|:---|:---|
| **Flock.io** | 팬메일/일반메일 자동 분류 | `lib/llm/client.ts` |
| | 춘심이 페르소나로 다국어 답장 생성 (한/영/일) | `lib/llm/reply-prompt.ts` |
| | LLM 추론 비용 x402 자율 결제 연동 | `lib/llm/client.ts` |
| **AgentKit** | 에이전트 전용 지갑 생성 및 관리 | `lib/blockchain/agentkit.ts` |
| | 답장을 ERC-721 Reply NFT로 Base Sepolia에 민팅 | `lib/blockchain/nft.ts` |
| | NFT 민팅 트랜잭션 서명 및 실행 | `lib/blockchain/nft.ts` |
| **x402** | 에이전트가 Flock.io 추론 비용을 USDC로 자율 온체인 결제 | `lib/blockchain/x402.ts` |
| **Base** | ERC-721 Reply NFT 온체인 영구 기록 (Base Sepolia) | `lib/blockchain/nft.ts` |
| | 감정 분석 기반 NFT 티어 분기 (Golden / Comfort / Standard) | `lib/blockchain/nft.ts` |
| | 팬 이메일에 NFT 클레임 링크 자동 삽입 | `lib/scheduler/process-emails.ts` |
| **Virtuals GAME** | ClassifierWorker — 팬메일 분류 에이전트 | `lib/agents/workers/classifierWorker.ts` |
| | ReplyWorker — 감정 분석 + 답장 생성 에이전트 | `lib/agents/workers/replyWorker.ts` |
| | NFTWorker — NFT 민팅 에이전트 | `lib/agents/workers/nftWorker.ts` |
| | GameAgent Orchestrator — 3개 에이전트 순차 조율 | `lib/agents/orchestrator.ts` |
| **Virtuals ACP** | Orchestrator → ReplyWorker ACP Job 생성 (USDC 지불) | `lib/agents/acpBridge.ts` |
| | Orchestrator → NFTWorker ACP Job 생성 (USDC 지불) | `lib/agents/acpBridge.ts` |
| | AcpContractClientV2 + Base Sepolia x402 설정 | `lib/agents/acpBridge.ts` |
| | 에이전트 간 서비스 상거래 (Client ↔ Provider 구조) | `lib/agents/acpBridge.ts` |

---

## 5. Related Documents

- **기술 명세**: [../03_Technical_Specs/06_HACKATHON_TECH_SPEC.md](../03_Technical_Specs/06_HACKATHON_TECH_SPEC.md)
- **구현 로드맵**: [../04_Logic_Progress/05_HACKATHON_ROADMAP.md](../04_Logic_Progress/05_HACKATHON_ROADMAP.md)
- **행사 개요**: [02_HACKATHON_BASE_AGENT.md](./02_HACKATHON_BASE_AGENT.md)
