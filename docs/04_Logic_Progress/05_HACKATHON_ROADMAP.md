# 해커톤 구현 로드맵 — Base Agent Hackathon #1

> Created: 2026-04-21
> Last Updated: 2026-04-21 (구현 진행 상황 반영)
> 해커톤 일시: 2026-04-25 (토) 11:00~17:00
> 사전 구현 방침: 해커톤 당일 전 구현 완료 목표. 당일 소요 시간 제약 없음.

## 현재 진행 상황 요약

| Phase | 상태 | 비고 |
|:---|:---:|:---|
| Phase 0 — 사전 준비 | 🟡 진행중 | 패키지 설치 완료. API Key/컨트랙트 배포 대기 |
| Phase 1 — Flock.io LLM | ✅ 코드 완료 | API Key 수령 후 동작 검증 필요 |
| Phase 2 — AgentKit + NFT | ✅ 코드 완료 | API Key + 컨트랙트 배포 후 검증 필요 |
| Phase 3 — x402 결제 | ✅ 코드 완료 | Flock.io x402 지원 여부 당일 확인 |
| Phase 4-A — 데모 모드 | ✅ 완료 | DEMO_MODE + /api/demo/trigger 구현 |
| Phase 4-B — 발표 자료 | ✅ 완료 | README + HTML 피치덱 생성 완료 |
| Phase 4 — 최종 제출 | 🔲 대기 | API Key 수령 후 진행 |
| Phase 5 — 대시보드 버그 | ✅ 완료 | Critical 항목 전체 수정 완료 |
| Phase 6 — Coinbase 디자인 | ✅ 완료 | globals.css / sidebar / header / charts 적용 |

---

## 사전 작업 우선순위 (해커톤 전 완료 순서)

해커톤 전에 모든 Phase를 완료하는 것이 목표다. 의존 관계상 아래 순서로 진행한다.

```
Phase 0 (계정·컨트랙트·환경) → Phase 1 (Flock LLM) → Phase 2 (NFT 민팅)
→ Phase 5 Critical (대시보드 버그) → Phase 6 (디자인) → Phase 3 (x402, 조건부) → Phase 4 (제출 준비)
```

| 우선순위 | Phase | 이유 |
|:---:|:---|:---|
| 1 | Phase 0 | 모든 구현의 전제 조건 |
| 2 | Phase 1 | Phase 2의 전제 조건 |
| 3 | Phase 2 | 핵심 데모 기능 |
| 4 | Phase 5 Critical | 심사위원 대시보드 직접 노출 위험 |
| 5 | Phase 6 | 완성도 향상 (선택적) |
| 6 | Phase 3 | 조건부 — Flock.io 지원 확인 후 결정 |
| 7 | Phase 4 | 최종 제출 준비 |

---

## Phase 0. 사전 준비

### 0-1. 계정 및 API Key 발급

- [ ] Flock.io 계정 생성 (https://flock.io)
- [ ] Flock.io API Key 발급 및 `.env.local`에 추가
  - `FLOCK_API_KEY=`
  - `FLOCK_BASE_URL=` (Flock.io 문서에서 OpenAI 호환 엔드포인트 확인)
- [ ] Flock.io Web3 Agent Model명 확인 및 기록
- [ ] Coinbase Developer Platform 계정 생성 (https://portal.cdp.coinbase.com)
- [ ] CDP API Key 생성 및 `.env.local`에 추가
  - `CDP_API_KEY_NAME=`
  - `CDP_API_KEY_PRIVATE_KEY=`

### 0-2. 블록체인 환경 세팅

- [ ] Base Sepolia 테스트넷 지갑 생성
- [ ] Base Sepolia Faucet에서 테스트 ETH 확보 (https://faucet.base.org)
- [ ] `.env.local`에 추가
  - `BASE_NETWORK=base-sepolia`

### 0-3. ERC-721 컨트랙트 작성 및 배포

- [ ] `contracts/ReplyNFT.sol` 파일 생성 — 아래 스펙으로 작성

  ```solidity
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.20;

  import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
  import "@openzeppelin/contracts/access/Ownable.sol";

  contract ReplyNFT is ERC721URIStorage, Ownable {
      uint256 private _tokenIdCounter;

      constructor() ERC721("Chooncme Reply", "CPLY") Ownable(msg.sender) {}

      function mintTo(address recipient, string memory tokenURI)
          external onlyOwner returns (uint256)
      {
          uint256 tokenId = _tokenIdCounter++;
          _safeMint(recipient, tokenId);
          _setTokenURI(tokenId, tokenURI);
          return tokenId;
      }
  }
  ```

- [ ] **Remix IDE + MetaMask**로 Base Sepolia에 배포 (Hardhat 셋업 불필요 — 해커톤 전날 기준 가장 빠른 방법)
  1. https://remix.ethereum.org 접속
  2. `ReplyNFT.sol` 붙여넣기 후 OpenZeppelin import 확인
  3. Compiler: 0.8.20, Optimization ON
  4. MetaMask를 Base Sepolia로 전환 후 Deploy
- [ ] 배포된 컨트랙트 주소를 `.env.local`에 추가
  - `NFT_CONTRACT_ADDRESS=`
- [ ] Base Sepolia Explorer에서 컨트랙트 확인 (https://sepolia.basescan.org)

> **[Critical] onlyOwner 충돌 해결 — 반드시 처리**
> `mintTo`는 `onlyOwner`로 제한되어 있다. MetaMask 지갑으로 배포하면 배포자가 owner가 되고, AgentKit이 생성하는 별도 지갑은 owner가 아니므로 민팅이 실패한다.
> 두 가지 해결 방법 중 하나를 선택한다:

- [ ] **방법 A (권장)**: AgentKit 지갑 주소를 먼저 확인한 후, 그 주소로 컨트랙트를 배포
  1. AgentKit 초기화 스크립트(`scripts/get-agent-wallet.ts`) 실행하여 지갑 주소 출력
  2. 해당 주소에 Base Sepolia ETH 충전 (Faucet)
  3. 해당 지갑의 Private Key를 MetaMask에 import
  4. 그 MetaMask 계정으로 컨트랙트 배포 → AgentKit 지갑 = 컨트랙트 owner
- [ ] **방법 B (대안)**: 기존 MetaMask로 배포 후 `transferOwnership(agentWalletAddress)` 호출
  1. 컨트랙트에 `Ownable` 상속 확인 (`transferOwnership` 함수 포함)
  2. Remix에서 배포 후 `transferOwnership(AgentKit 지갑 주소)` 트랜잭션 실행
- [ ] 선택한 방법 기록 후 민팅 테스트로 owner 권한 확인

### 0-4. NFT 메타데이터 저장 방식 결정

- [x] IPFS 사용 여부 결정 → **옵션 B 확정**: on-chain data URI (`data:application/json;base64,...`)
  - 외부 의존성 없음, `lib/blockchain/nft.ts`에 구현 완료
- [x] 결정한 방식을 코드에 반영 완료

### 0-5. 패키지 설치

- [x] `npm install @coinbase/agentkit` 설치 확인
- [x] `npm install openai` 설치 확인 (Flock.io OpenAI 호환용)
- [x] `npm install x402` 설치 확인 (Phase 3용 — @x402/fetch, @x402/evm 포함)
- [x] `npm install viem` 설치 확인 (컨트랙트 직접 호출)

### 0-6. 기존 파이프라인 동작 확인

- [ ] DB 연결 상태 정상 확인

### 0-7. Basenames 등록 (에이전트 아이덴티티)

> Base 생태계 핵심 기술인 Basenames를 활용해 에이전트 지갑에 이름을 부여한다. (예: `chooncme.base.eth`)

- [ ] Base Sepolia용 Basenames 등록 (https://base.eth)
- [ ] 등록된 이름을 에이전트 지갑 주소와 연결
- [ ] 대시보드 및 이메일 하단에 "Managed by [Name].base.eth" 표출 준비

---

## Phase 1. Flock.io LLM 교체 (목표: 1시간)

> 현재 `lib/llm/client.ts`는 Gemini 전용 클래스 구조(`chat(systemPrompt, userPrompt)`)다. 단순 `baseURL` 교체가 아니라 OpenAI SDK 방식(`chat.completions.create()`)으로 인터페이스를 재설계해야 하며, 프롬프트 파일 3개도 각각 응답 파싱 방식을 확인해야 한다.

### 1-1. LLM 클라이언트 교체

- [x] `lib/llm/client.ts` 수정
  - `LLMProvider`에 `'flock'` 타입 추가
  - `OpenAIClient` baseUrl을 생성자 파라미터로 외부화 (Flock.io 호환)
  - `FLOCK_API_KEY` 최우선 선택, Gemini/OpenAI 폴백 유지
  - `FLOCK_MODEL` 환경변수 지원

### 1-2. 프롬프트 포맷 변환

- [x] `lib/llm/classify-prompt.ts` — 기존 `systemPrompt + userPrompt` 구조가 OpenAI chat format과 호환 확인
- [x] `lib/llm/reply-prompt.ts` — 동일
- [x] `lib/llm/followup-prompt.ts` — 동일

### 1-3. LLM 파서 검토

- [x] `lib/llm/reply-parser.ts` — 응답 구조 호환 확인, 변경 불필요

### 1-4. 동작 검증

- [ ] 팬레터 분류 단독 테스트 (FLOCK_API_KEY 수령 후)
- [ ] 답장 생성 단독 테스트
- [ ] 전체 파이프라인 (`/api/cron/check-email`) 엔드투엔드 테스트

### 1-6. AI Safety & Guardrail (감점 방지 필수)

> AI 에이전트가 부적절하거나 위험한 답변을 생성하는 것은 해커톤의 치명적 감점 요소다.

- [ ] `lib/llm/reply-prompt.ts`에 Safety 지침 추가
  - "정치적, 종교적, 혐오 발언 절대 금지"
  - "크리에이터의 명예를 훼손하는 발언 차단"
  - "개인정보(전화번호, 주소 등) 유도 또는 노출 금지"
- [ ] 비인가 요청(스팸) 필터링 로직 강화 (Classify 단계)

### 1-5. Persona Config 외부화 (Platform 증거)

> 현재 춘심이 페르소나가 `reply-prompt.ts`에 하드코딩되어 있다. 심사위원이 "다른 크리에이터는 어떻게 쓰는가?"라고 물었을 때 "소스 코드를 수정해야 합니다"는 약한 답변이다. 페르소나를 설정 파일로 분리하여 "JSON 하나 교체로 새 에이전트 배포 가능"을 시연한다.

- [ ] `config/persona.json` 파일 생성

  ```json
  {
    "name": { "ko": "춘심이", "en": "ChoonCme", "ja": "春心" },
    "age": 21,
    "role": "아이돌 지망생",
    "personality": "애교 있고 친절하며 사랑스러운",
    "specialties": ["노래", "춤", "패션"],
    "tone": "정성껏 쓴 답장, 팬을 사랑하는 마음",
    "boundaries": "민감한 요구 시 부드럽게 거절, 순수한 이미지 유지"
  }
  ```

- [ ] `lib/llm/reply-prompt.ts` 수정 — 하드코딩된 페르소나 텍스트를 `persona.json`에서 동적 로드하도록 변경
- [ ] `lib/llm/classify-prompt.ts` — 동일하게 페르소나 참조 분리
- [ ] 검증: `persona.json`의 `name`을 다른 이름으로 임시 변경 후 답장 생성 → 새 페르소나로 답장이 나오는지 확인
- [ ] 데모용: 두 번째 페르소나 예시 파일 `config/persona-example.json` 생성 (예: 가상 뮤지션)

---

## Phase 2. AgentKit + Reply NFT 민팅 (목표: 2~3시간)

### 2-1. AgentKit 클라이언트 모듈 생성

- [x] `lib/blockchain/` 디렉토리 생성
- [x] `lib/blockchain/agentkit.ts` 파일 생성
  - `CdpEvmWalletProvider`로 Base Sepolia 지갑 초기화 (실제 API 확인 후 수정)
  - 싱글톤 패턴으로 인스턴스 관리
  - 환경변수 `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `AGENT_WALLET_ADDRESS`, `BASE_NETWORK` 연결

### 2-2. NFT 메타데이터 생성 유틸리티

- [x] `lib/blockchain/nft.ts` 파일 생성
- [x] `buildMetadata(params)` 함수 구현
  - PII 보호: senderName 제외, 답장 내용 SHA256 해시만 기록
- [x] `buildDataUri(metadata)` — data URI (Base64) 방식으로 구현 완료

### 2-3. NFT 민팅 함수 구현

- [x] `lib/blockchain/nft.ts`에 `mintReplyNFT(params)` 함수 구현
  - **방식 B 채택**: `kit.run()`이 이 버전 AgentKit에 없음을 확인 → viem `encodeFunctionData` + `sendTransaction` 직접 호출
  - `REPLY_NFT_ABI` (`mintTo(address, string)`) 정의
  - Transfer 이벤트 log에서 tokenId 파싱
  - 반환값: `{ tokenId, txHash, claimUrl, tier }`

- [ ] 단독 테스트 실행 (`scripts/test-nft-mint.ts`) — 컨트랙트 배포 후 진행
- [ ] Base Sepolia Explorer에서 민팅 트랜잭션 확인

### 2-4. 감정 기반 차별 NFT (Agent Intelligence)

- [x] `lib/blockchain/nft.ts`의 `getTierFromEmotion()` 구현
  - `love/support/joy/gratitude` → `golden`
  - `longing/sadness/concern` → `comfort`
  - `neutral` → `standard`
- [x] NFT 메타데이터에 `tier` attribute 포함
- [ ] 검증: 감정별 NFT 티어 분기 동작 확인 (API Key 수령 후)

### 2-5. 파이프라인 연동

- [x] `lib/scheduler/process-emails.ts` 수정
  - 답장 생성 후 `mintReplyNFT()` 호출 추가
  - `NFT_CONTRACT_ADDRESS` 미설정 시 민팅 스킵 (하위 호환)
  - 민팅 실패해도 이메일 발송 계속 진행 (폴백)
- [x] 이메일 본문 언어 감지 후 한/영/일 NFT 클레임 섹션 자동 삽입 (`buildNftSection()`)

### 2-6. DB 스키마 업데이트 (선택)

- [ ] `db/schema.ts`의 `replies` 테이블에 NFT 컬럼 추가 (nftTokenId, nftTxHash, nftClaimUrl) — 시간 여유 시 진행

### 2-8. Smart Wallet 대응 전략 (Web3 UX 혁신)

- [ ] 클레임 페이지에 "Coinbase Smart Wallet" 버튼 활성화 — Claim Page 구현 시 함께 진행

### 2-9. 동작 검증

- [ ] AgentKit 지갑 주소 로그 출력 확인 (CDP API Key 수령 후)
- [ ] 테스트 NFT 민팅 단독 실행
- [ ] Base Sepolia Explorer에서 트랜잭션 및 NFT 확인
- [ ] 전체 파이프라인 테스트: 이메일 수신 → 답장 생성 → NFT 민팅 → 클레임 링크 포함 이메일 발송

---

## Phase 3. x402 에이전트 자율 결제 (조건부 — 해커톤 당일 판단)

> 전제 조건: Flock.io가 x402 결제를 지원하는지 오프닝(10:10) 후 확인. 미지원 시 전체 스킵.

### 3-1. x402 지원 여부 확인

- [ ] 해커톤 오프닝 후 Flock.io x402 지원 여부 확인
- [ ] 지원 시 X402_ENABLED=true로 활성화 / 미지원 시 스킵

### 3-2. x402 클라이언트 미들웨어 구현

- [x] `lib/blockchain/x402.ts` 파일 생성
  - `@x402/fetch` + `@x402/evm` 연동
  - `CdpEvmWalletProvider.signTypedData` → `toClientEvmSigner` 변환
  - `wrapFetchWithPayment`로 HTTP 402 자동 결제 fetch 생성
  - Base Sepolia/Mainnet 체인 자동 선택

### 3-3. LLM 클라이언트에 x402 미들웨어 적용

- [x] `lib/llm/client.ts` 수정
  - Flock.io 클라이언트에 x402 fetch 연결
  - `X402_ENABLED=true` 시 자율 결제 fetch 사용, 실패 시 표준 fetch 폴백

### 3-4. 동작 검증

- [ ] LLM 추론 요청 시 x402 결제 트랜잭션 Base Sepolia에서 확인 (Flock.io x402 지원 확인 후)
- [ ] 결제 → 추론 → 응답 전체 흐름 로그 확인

---

## Phase 4-A. 데모 모드 구현 (사전 완료 필수)

> 이것 없으면 심사 시연 자체가 불가능할 수 있다. 반드시 Phase 2 완료 후 바로 구현한다.

### 4-A-1. 지연 발송 단축

- [x] `lib/scheduler/delayed-send.ts` 수정
  - `DEMO_MODE=true`일 때 지연 0~30초로 단축
  - `isDemoMode()` 유틸 함수 추가

### 4-A-2. cron 대기 제거

- [x] `app/api/demo/trigger/route.ts` 신규 생성
  - `DEMO_MODE=true`일 때만 활성화 (비데모 환경 403 차단)
  - `CRON_SECRET` 인증 재사용
  - `processEmails({ hoursAgo: 24, maxEmails: 10 })` 즉시 실행
- [ ] 해커톤 당일 `.env.local`에 `DEMO_MODE=true` 추가

### 4-A-3. 검증

- [ ] `DEMO_MODE=true` 상태에서 전체 흐름 30초 내 완료 확인 (API Key 수령 후)
- [ ] `DEMO_MODE=false` 상태에서 기존 지연 발송 정상 동작 확인

---

## Phase 4-B. 발표 자료 준비 (사전 완료 필수)

### 4-B-1. 아키텍처 다이어그램

- [x] README.md에 텍스트 기반 아키텍처 다이어그램 추가 (감정별 NFT 티어 포함)

### 4-B-2. 피치덱 슬라이드 (6장)

- [x] `public/pitch/index.html` 생성 — HTML 기반 프레젠테이션 (키보드 네비게이션)
  - Slide 1: Hook (팬은 답장을 받지 못한다)
  - Slide 2: Traction (33K 팬덤, 228통)
  - Slide 3: Solution (NFT 티어 시각화)
  - Slide 4: Tech Stack
  - Slide 5: Business Model (Agentic Commerce)
  - Slide 6: Closing
  - Coinbase 디자인 시스템 적용
- [ ] 발표 시간 5분 기준 리허설 (당일 전)

### 4-B-3. 데모 녹화 영상 (라이브 실패 대비)

- [ ] 이메일 발송 → 답장 수신 → NFT 확인 전체 흐름 2분 내외 녹화 (API Key 수령 후)
- [ ] 로컬 저장 + YouTube/Drive 링크 준비

---

## Phase 4. 데모 안정화 및 제출 (16:00~17:00)

### 4-1. 코드 정리

- [ ] 불필요한 `console.log` 제거
- [ ] 에러 핸들링 최종 점검 (민팅 실패 시 폴백 동작 확인)
- [ ] 환경변수 누락 여부 최종 확인

### 4-2. README 업데이트

- [x] 해커톤용 실행 방법 추가
- [x] 기술 스택에 Flock.io, AgentKit, Base, x402 추가
- [x] 아키텍처 다이어그램 업데이트

### 4-3. GitHub 제출 준비

- [ ] 레포지토리 public으로 전환 (또는 신규 public 레포 생성)
- [ ] `.env.local`이 `.gitignore`에 포함되어 있는지 최종 확인
- [ ] `git push` 완료

### 4-4. 데모 시나리오 리허설

- [ ] 심사위원이 이메일 발송 → 답장 수신 전체 흐름 시연 가능 여부 확인
- [ ] NFT 클레임 링크 클릭 → Base Sepolia Explorer에서 확인 시연 준비
- [ ] 예상 질문 답변 준비
  - "AgentKit이 구체적으로 무엇을 하는가?" → NFT 민팅 트랜잭션 직접 시연
  - "Flock.io를 왜 썼는가?" → Web3 Agent Model 특화 설명

### 4-5. 제출

- [ ] GitHub 링크 제출 (17:00 마감)
- [ ] 데모 영상 또는 배포 링크 제출 (요구 시)

---

## Phase 5. 대시보드 버그 수정 (4월 24일 또는 해커톤 전 완료)

> 심사위원이 대시보드를 직접 볼 수 있으므로 Critical 항목은 반드시 수정한다.

### 5-1. Critical — 즉시 수정 (데모 신뢰도 직결)

- [x] **[letters/page.tsx]** 검색 form 연결 (`name="search"`, GET method, `defaultValue`)
- [x] **[letters/page.tsx]** LEFT JOIN 후 `GROUP BY fanLetters.id` 추가
- [x] **[stats/page.tsx]** 답장률 계산 수정 (`is_replied` 기준 실제 답장률)
- [x] **[letters/[id]/page.tsx]** `isRead` 업데이트 — 기존 코드에 `await` 이미 있음 확인

### 5-2. High — 데모 품질 향상

- [x] **[sidebar.tsx]** `usePathname`으로 현재 메뉴 활성화 하이라이트 추가
- [ ] **[sidebar.tsx]** 로그아웃 버튼 `onClick` 핸들러 연결
- [ ] **[header.tsx]** unread count 실제 DB 값으로 연동
- [x] **[letters/[id]/page.tsx]** topics JSON 파싱에 try-catch 추가
- [ ] **[reply-form.tsx]** API 에러 시 사용자 친화적 메시지 표시

### 5-3. Low — 선택사항

- [ ] **[letters/page.tsx]** 페이지네이션 UI 추가 (현재 limit 50 고정)
- [ ] **[charts.tsx]** 모바일 반응형 높이 조정
- [ ] **[layout.tsx]** 모바일에서 Sidebar 반응형 처리

---

## Phase 6. 대시보드 디자인 개선 (4월 24일 또는 해커톤 전 완료)

> 디자인 시스템: **Coinbase** 테마 적용
> 선택 근거: Base(Coinbase L2) + AgentKit(Coinbase CDP) 생태계와 일관성. 심사위원에게 기술 선택과 UI가 같은 맥락으로 연결됨.
> 레퍼런스: `.agent/skills/ext-awesome-design/design-md/coinbase/`

### 6-1. 디자인 시스템 분석

- [x] `.agent/skills/ext-awesome-design/design-md/coinbase/DESIGN.md` 숙지
- [x] 현재 대시보드와 Coinbase 디자인 토큰 차이 파악 완료

### 6-2. 색상 및 토큰 적용

- [x] `app/globals.css`에 Coinbase CSS 변수 반영
  - Primary: `#0052ff`, Near Black: `#0a0b0d`, Cool Gray: `#eef0f3`
  - Hover: `#578bfa`, Muted: `#5b616e`, Dark Card: `#282b31`
  - Sidebar: 다크 테마 변수 전체 교체

### 6-3. 컴포넌트 스타일 업데이트

- [x] **[sidebar.tsx]** Coinbase 다크 사이드바 (`#0a0b0d`) + Blue 액티브 메뉴 + usePathname
- [x] **[header.tsx]** 흰 헤더 + Coinbase Blue 알림 점 + 아바타 테두리
- [ ] **[dashboard/page.tsx]** KPI 카드 스타일 Coinbase 패턴 교체 (추가 작업 필요)
- [x] **[charts.tsx]** 차트 색상 Coinbase 팔레트 (`#0052ff`, `#578bfa`, `#0667d0`) 적용

### 6-4. 전용 NFT Claim Page UI 개발 (고득점 포인트)

- [ ] **[app/claim/[id]/page.tsx]** 신규 생성
- [ ] NFT 메타데이터 로드 및 시각화
- [ ] "Coinbase Smart Wallet으로 받기" 버튼 구현

### 6-5. 검증

- [x] `npm run build` 빌드 오류 없음 확인
- [ ] 브라우저에서 대시보드 전체 UI 시각적 확인
- [ ] 심사 데모용 스크린샷 캡처

---

## 체크포인트 요약

| Phase | 완료 기준 | 상태 | 폴백 |
|:---|:---|:---:|:---|
| Phase 0 | 모든 API Key 발급 + 컨트랙트 + owner 확인 | 🟡 진행중 | 당일 오전 불가 시 출전 포기 |
| Phase 1 | Flock.io LLM으로 답장 생성 성공 | ✅ 코드완료 | API Key 수령 후 테스트 |
| Phase 2 | NFT 민팅 + 클레임 링크 이메일 수신 성공 | ✅ 코드완료 | 컨트랙트 배포 후 테스트 |
| Phase 3 | x402 결제 트랜잭션 온체인 확인 | ✅ 코드완료 | 조건부 — Flock.io 지원 시 활성화 |
| Phase 4-A | DEMO_MODE 30초 내 답장 수신 확인 | ✅ 코드완료 | **스킵 불가 — 시연 불가능** |
| Phase 4-B | 피치덱 + 다이어그램 완료 | ✅ 완료 | 녹화 영상만 미완 |
| Phase 4 | 데모 리허설 완료 + GitHub 제출 | 🔲 대기 | 당일 16:00~17:00 |
| Phase 5 | 대시보드 Critical 버그 수정 완료 | ✅ 완료 | — |
| Phase 6 | Coinbase 디자인 적용 + 빌드 통과 | ✅ 완료 | Claim Page 미완 |

---

## Related Documents

- **피칭 전략**: [../01_Concept_Design/03_HACKATHON_PITCHING_STRATEGY.md](../01_Concept_Design/03_HACKATHON_PITCHING_STRATEGY.md)
- **기술 명세**: [../03_Technical_Specs/06_HACKATHON_TECH_SPEC.md](../03_Technical_Specs/06_HACKATHON_TECH_SPEC.md)
- **구현 계획 (요약)**: [04_HACKATHON_IMPLEMENTATION_PLAN.md](./04_HACKATHON_IMPLEMENTATION_PLAN.md)
