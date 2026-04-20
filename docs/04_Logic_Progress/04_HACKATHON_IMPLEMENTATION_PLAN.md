# 해커톤 구현 계획 — Base Agent Hackathon #1

> Created: 2026-04-21
> Last Updated: 2026-04-21

---

## 1. 개요

**목표**: 2026-04-25 해커톤 당일 11:00~17:00 (6시간) 안에 작동하는 프로토타입 제출  
**전략**: 기존 팬레터 파이프라인을 유지하면서 3개 레이어를 순차 추가

```
[기존] Gmail → Gemini LLM → 답장 이메일
[추가] Gmail → Flock.io LLM (x402 자율 결제) → 답장 NFT 민팅 (AgentKit) → 답장 이메일 + 클레임 링크
```

---

## 2. 사전 준비 (4월 24일까지 완료 필수)

| 항목 | 내용 | 확인 |
|:---|:---|:---:|
| Flock.io 계정 생성 및 API Key 발급 | https://flock.io | [ ] |
| Coinbase Developer Platform 계정 생성 | https://portal.cdp.coinbase.com | [ ] |
| AgentKit npm 패키지 설치 확인 | `@coinbase/agentkit` | [ ] |
| Base Sepolia 테스트넷 지갑 생성 | Base Sepolia ETH 확보 | [ ] |
| NFT 컨트랙트 배포 (ERC-721) | Base Sepolia 테스트넷 | [ ] |
| x402 패키지 설치 확인 | `x402` | [ ] |
| 환경변수 추가 | 아래 섹션 참고 | [ ] |

---

## 3. 구현 단계

### Phase 1 — Flock.io LLM 교체 (예상 소요: 30분)

**목표**: Gemini → Flock.io API로 교체. 기존 파이프라인 동작 유지.

**작업 파일**: `lib/llm/client.ts`

**변경 내용**:
- `@google/generative-ai` 클라이언트를 Flock.io OpenAI 호환 엔드포인트로 교체
- `baseURL`: Flock.io API Platform URL
- `model`: Flock.io 제공 모델명 (Web3 Agent Model 권장)

**완료 기준**:
- [ ] 팬레터 분류 API 호출 성공
- [ ] 답장 생성 API 호출 성공
- [ ] 기존 파이프라인 (`/api/cron/check-email`) 정상 작동

---

### Phase 2 — AgentKit 지갑 + Reply NFT 민팅 (예상 소요: 2~3시간)

**목표**: 팬레터 답장 생성 시 AgentKit으로 Reply NFT를 Base Sepolia에 민팅하고, 팬에게 클레임 링크를 발송.

**작업 파일**:
- `lib/blockchain/agentkit.ts` (신규)
- `lib/blockchain/nft.ts` (신규)
- `lib/scheduler/reply-generator.ts` (수정)
- `lib/mail.ts` (수정 — 클레임 링크 삽입)

**구현 흐름**:
```
reply-generator.ts
  → 답장 텍스트 생성 완료
  → nft.ts: AgentKit으로 ERC-721 민팅 (메타데이터: 팬 이름, 날짜, 답장 내용 해시)
  → 민팅 성공 시 tokenId + Base Sepolia 트랜잭션 해시 반환
  → mail.ts: 답장 이메일 본문 하단에 클레임 링크 삽입
```

**NFT 메타데이터 구조**:
```json
{
  "name": "춘심이의 답장 #<tokenId>",
  "description": "춘심이가 직접 쓴 팬레터 답장입니다.",
  "attributes": [
    { "trait_type": "recipient", "value": "<senderName>" },
    { "trait_type": "date", "value": "<ISO 날짜>" },
    { "trait_type": "reply_hash", "value": "<답장 내용 SHA256>" }
  ]
}
```

**완료 기준**:
- [ ] AgentKit 지갑 생성 및 Base Sepolia 연결 확인
- [ ] 테스트 민팅 성공 (트랜잭션 해시 반환)
- [ ] 답장 이메일에 클레임 링크 포함 확인
- [ ] Base Sepolia Explorer에서 NFT 확인 가능

---

### Phase 3 — x402 에이전트 자율 결제 (예상 소요: 1~2시간)

**목표**: 에이전트가 Flock.io LLM 추론 요청 시 x402 프로토콜로 USDC 자율 결제.

**전제 조건**: Phase 1, 2 완료 후 진행

**작업 파일**:
- `lib/llm/client.ts` (수정 — x402 미들웨어 추가)
- `lib/blockchain/agentkit.ts` (수정 — USDC 결제 트랜잭션 추가)

**작동 방식**:
```
LLM 추론 요청
  → Flock.io 서버가 HTTP 402 반환 (금액 + USDC 주소)
  → x402 클라이언트가 AgentKit 지갑으로 USDC 자동 결제
  → 결제 검증 후 추론 결과 반환
```

**완료 기준**:
- [ ] x402 결제 트랜잭션이 Base Sepolia에서 확인 가능
- [ ] 추론 요청 → 결제 → 응답 전체 흐름 로그 확인

> 주의: Phase 3은 Flock.io가 x402를 실제로 지원하는 경우에만 가능. 지원하지 않을 경우 "에이전트 지갑에서 운영비 자율 집행" 개념을 시뮬레이션으로 대체한다.

---

## 4. 신규 환경변수

```env
# Flock.io
FLOCK_API_KEY=...
FLOCK_BASE_URL=https://api.flock.io/v1  # 실제 URL 확인 필요

# Coinbase AgentKit
CDP_API_KEY_NAME=...
CDP_API_KEY_PRIVATE_KEY=...
AGENT_WALLET_SEED=...  # 에이전트 지갑 복구용

# NFT 컨트랙트
NFT_CONTRACT_ADDRESS=...  # Base Sepolia 배포 주소
BASE_NETWORK=base-sepolia  # 해커톤: base-sepolia / 프로덕션: base-mainnet

# x402
X402_ENABLED=true
```

---

## 5. 해커톤 당일 타임라인

| 시간 | 작업 |
|:---|:---|
| 11:00 | Phase 1 시작 (Flock.io 교체) |
| 11:30 | Phase 1 완료 확인 → Phase 2 시작 |
| 14:00 | Phase 2 완료 목표 (NFT 민팅 + 클레임 링크) |
| 14:00~16:00 | Phase 3 시도 (x402) 또는 데모 안정화 |
| 16:00 | 코드 프리즈 — 데모 시나리오 리허설 |
| 17:00 | 제출 마감 |

---

## 6. 데모 시나리오 (심사 시연용)

1. 심사위원이 춘심이 이메일로 팬레터 발송
2. 에이전트가 Flock.io LLM으로 분류 및 답장 생성
3. AgentKit이 Reply NFT를 Base Sepolia에 민팅
4. 심사위원이 답장 이메일 + NFT 클레임 링크 수신
5. Base Sepolia Explorer에서 트랜잭션 및 NFT 직접 확인

---

## 7. 리스크 및 대응

| 리스크 | 대응 |
|:---|:---|
| Flock.io API가 OpenAI 완전 호환이 아닌 경우 | Flock.io SDK 직접 사용으로 전환 |
| AgentKit 민팅 실패 (가스 부족 등) | 사전에 Base Sepolia ETH 충분히 확보 |
| x402 미지원 | Phase 3 스킵 — Phase 1+2만으로도 심사 기준 충족 가능 |
| 6시간 내 Phase 2 미완성 | Phase 1(Flock.io) + 온체인 기록 이벤트로 최소 제출 |

---

## 8. Related Documents

- **피칭 전략**: [03_HACKATHON_PITCHING_STRATEGY.md](../01_Concept_Design/03_HACKATHON_PITCHING_STRATEGY.md)
- **행사 개요 및 기술 스택**: [02_HACKATHON_BASE_AGENT.md](../01_Concept_Design/02_HACKATHON_BASE_AGENT.md)
- **기술 명세**: [06_HACKATHON_TECH_SPEC.md](../03_Technical_Specs/06_HACKATHON_TECH_SPEC.md)
