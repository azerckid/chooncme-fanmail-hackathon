# Base Agent Hackathon #1 — 출전 전략 문서

> Created: 2026-04-21 00:42
> Last Updated: 2026-04-24

---

## 1. 행사 개요 (Confirmed)

| 항목 | 내용 |
|:---|:---|
| 행사명 | Base Agent Hackathon #1: Build AI Agents on Base |
| 주최 | Base Korea (Daehan Base) / Logan Kang |
| 일시 | 2026년 4월 25일 (토) 09:30 ~ 20:30 |
| 장소 | Future House (서울 강남구 선릉로158길 13-12) |
| 상금 | 총 $5,000 (세부 순위별 배분 미공개 — 당일 오프닝에서 공개 예정) |
| 팀 구성 | 개인 또는 2~4인 팀 |
| 행사 언어 | 한국어 |
| Luma 링크 | https://luma.com/9u7gz0kn |

---

## 2. 행사 일정

| 시간 | 내용 |
|:---|:---|
| 09:30 | 체크인 및 등록 |
| 10:00 | 오프닝 |
| 10:10 | 스폰서 및 기술 스택 소개 (평가 기준 발표 예상) |
| 11:00 | 해커톤 시작 |
| 12:30 | 점심 (피자) 및 스낵 |
| 16:00 | 마감 1시간 전 안내 |
| 17:00 | 제출 마감 |
| 17:10 | 심사 시작 |
| 18:40 | 점수 집계 |
| 19:00 | 시상식 |
| 19:20 | 마무리 및 네트워킹 + 저녁 |

실질적인 빌드 시간: 11:00 ~ 17:00 (총 6시간)

---

## 3. 참가 요구 사항 (Confirmed)

| 항목 | 내용 |
|:---|:---|
| 사전 등록 | Google Form 제출 필수 (팀 대표 1인, 전 팀원 이메일 포함) |
| 입장 방식 | Luma 사전 승인(Approval) 기반. 당일 드롭인 불가 |
| 장비 | 개인 노트북 지참 필수 |
| LLM 사용 규칙 | AI Agent 빌드 참가자는 Flock.io 플랫폼 LLM 사용 필수 |
| 등록 링크 | https://forms.gle/WVBCXL8fR5XVZJAb8 |

---

## 4. 필수 기술 스택

아래 중 최소 1개 이상을 실질적으로 통합해야 유효한 제출로 인정될 가능성이 높다.

### 4-1. Flock.io (LLM 인프라 — 필수 사용)

- 정체성: Federated Learning + 블록체인을 결합한 탈중앙화 AI 훈련/추론 플랫폼
- 역할: 에이전트의 LLM 추론을 담당하는 뇌(Brain) 역할
- 핵심 특징:
  - OpenAI SDK 호환 API Platform 제공 — `base_url`과 API key만 교체하면 기존 OpenAI 코드 전환 가능
  - AI Arena: 경쟁적 모델 훈련 플랫폼
  - Web3 Agent Model: 온체인 분석, 스마트 컨트랙트 실행에 특화된 전용 LLM
  - 개발자 문서: https://docs.flock.io

### 4-2. Base 체인 (L2 인프라)

- 정체성: Ethereum Layer 2, Coinbase 내부 인큐베이팅
- 기술 스펙:
  - OP Stack 기반 Ethereum L2
  - 자체 가스 토큰 없음 — ETH 사용
  - 트랜잭션 수수료 $0.0001 미만
  - Finality 약 200ms
- 개발자 문서: https://docs.base.org

### 4-3. AgentKit (Coinbase CDP)

- 역할: AI 에이전트의 온체인 액션 실행 레이어
- 핵심 기능:
  - 자율적 지갑 생성 및 관리
  - 트랜잭션 서명 및 실행
  - DeFi 프로토콜 상호작용 (스왑, 유동성 공급 등)
- 특징: 에이전트가 인간 개입 없이 온체인에서 행동 가능

### 4-4. x402 Protocol

- 정체성: Coinbase가 2025년 5월 출시한 HTTP 기반 M2M 마이크로페이먼트 표준
- 역할: 머신-투-머신(M2M) 결제 레이어 — 에이전트가 자율적으로 서비스 비용을 결제
- 작동 방식:
  1. Agent가 유료 API/리소스 요청
  2. 서버가 HTTP 402 Payment Required 응답 반환 (금액, 토큰 정보 포함)
  3. Agent가 USDC로 자동 온체인 결제 실행
  4. 서버가 검증 후 리소스 제공
- Base 위에서 동작 시: 수수료 $0.0001 미만, finality 약 200ms
- 의미: "HTTPS for Value" — 가치 전송의 인터넷 표준화 목표

### 4-5. Virtuals ACP (Agent Coordination Protocol)

- 역할: 복수 에이전트 간 역할 분담 및 통신 프로토콜
- 핵심 기능: 에이전트 간 태스크 위임, 역할 조율, 협력 체계 구성
- 활용 시나리오: Trading Agent + DeFi Agent + Social Agent를 ACP로 연결

### 기술 스택 관계도

```
Flock.io API (LLM 추론 — 필수)
        |
AgentKit (온체인 액션 실행) <---> Base L2
        |
x402 (에이전트 자율 결제)
```

> Virtuals ACP는 이번 구현 범위에서 제외한다. 복수 에이전트 간 협력이 필요하지 않은 단일 Social Agent 구조이므로 ACP 통합은 불필요하다.

사실상 "LLM 두뇌 → 온체인 실행 → 자율 결제"의 핵심 Agentic Stack을 6시간 안에 구현하는 것이 이번 해커톤의 목표다.

---

## 5. 예상 평가 기준

공식 루브릭은 당일 오프닝(10:10)에 공개될 가능성이 높다. 아래는 동일 기술 스택 해커톤 업계 표준 기반 추정이다.

| 평가 영역 | 세부 기준 | 비고 |
|:---|:---|:---|
| 기술 통합 완성도 | Base 기술(ACP, AgentKit, x402)을 실질적으로 활용했는가. Flock.io LLM을 실제 추론에 통합했는가 | 가장 핵심 |
| 기능 동작 여부 | 17:00 마감 시점에 실제로 동작하는 프로토타입인가. 단순 UI 목업이 아닌가 | Working Prototype |
| 혁신성 및 아이디어 | 기존에 없던 에이전트 활용 사례인가. Trading/DeFi/Social 영역에서 새로운 접근인가 | |
| 실용성 및 시장 가치 | 실제 사용자 문제를 해결하는가. Agentic Commerce 비즈니스 모델이 존재하는가 | |
| 발표 및 데모 품질 | 심사 시간(17:10~18:40) 동안 에이전트 동작을 명확히 시연할 수 있는가 | |

---

## 6. 제출 시 준비해야 할 것 (예상)

유사 해커톤 패턴 기반:

- GitHub 레포지토리 (오픈소스 공개)
- README — 실행 방법, 아키텍처 설명 포함
- 데모 영상 또는 라이브 시연
- 발표 자료 (피치덱 또는 간단한 슬라이드)
- 배포 링크 (테스트넷 또는 메인넷)

---

## 7. 사전 준비 체크리스트

행사 당일 빌드 시간을 최대화하기 위해 아래 항목을 4월 24일(금)까지 완료해야 한다.

### 필수 사전 작업

- [ ] Google Form 제출 완료 (팀 등록)
- [ ] Luma 사전 승인 확인
- [ ] Flock.io 계정 생성 및 API Key 발급 (https://flock.io)
- [ ] Coinbase Developer Platform 계정 생성 및 AgentKit 환경 셋업
- [ ] Base 테스트넷(Base Sepolia) 지갑 및 테스트 ETH 확보
- [ ] x402 기본 사용法 숙지 (https://docs.base.org/ai-agents/quickstart/payments)
- [ ] 아이디어 초안 결정 (Trading/DeFi/Social 중 방향 확정)

### 권장 사전 작업

- [ ] Flock.io API Platform OpenAI 호환 예제 코드 실행 확인
- [ ] AgentKit 기본 예제 (지갑 생성 + 트랜잭션 실행) 로컬 실행 확인
- [ ] 팀 역할 분담 확정 (LLM 통합 / 온체인 / 프론트엔드)

---

## 8. 최종 구현 방향 (확정)

초안 검토 결과 아래 방향으로 확정하였다.

**Reply NFT Social Agent + VIP 팬 온체인 등급 시스템**

팬이 팬레터 이메일을 보내면 Flock.io LLM이 춘심이 페르소나로 답장을 생성하고, AgentKit으로 답장을 ERC-721 NFT로 민팅하여 Base Sepolia에 영구 기록한다. 에이전트는 LLM 추론 비용을 x402로 자율 결제한다(Phase 3, 조건부).

여기에 더해, 팬이 메일에 지갑 주소를 포함할 경우 Nansen API로 해당 지갑의 AgentKit 에이전트 지갑(`0x363a...`)으로의 과거 송금 이력을 조회한다. 후원 이력이 확인되면 '최우수 후원자' 전용 프롬프트로 훨씬 길고 감동적인 답장을 생성하고, 한정판 **Golden Reply NFT**를 발행한다.

**확정 근거**:
- Reply NFT는 이메일 파이프라인을 거의 건드리지 않고 온체인 가치를 추가할 수 있는 가장 현실적인 방식
- 심사위원이 라이브로 NFT를 Base Sepolia Explorer에서 직접 확인 가능
- 온체인 후원 이력(결제) → 오프체인 서비스 품질 향상이 Agentic Commerce 심사 기준에 정확히 부합
- `getTierFromEmotion()`에 이미 `golden` 티어가 구현되어 있어 트리거 조건만 추가하면 됨
- Nansen API 실패 시 Base 퍼블릭 RPC로 폴백 가능 (구현 리스크 낮음)

**데모 시나리오 핵심**:
> "이 팬은 과거에 에이전트 지갑으로 ETH를 보낸 이력이 있습니다. 에이전트가 이를 인식하고 Golden NFT와 특별 답장을 자동 발송합니다."

---

## 9. Related Documents

- **프로젝트 비전**: [01_CONCEPT_AND_VISION.md](./01_CONCEPT_AND_VISION.md)
- **피칭 전략**: [03_HACKATHON_PITCHING_STRATEGY.md](./03_HACKATHON_PITCHING_STRATEGY.md)
- **기술 명세**: [../03_Technical_Specs/06_HACKATHON_TECH_SPEC.md](../03_Technical_Specs/06_HACKATHON_TECH_SPEC.md)
- **구현 계획**: [../04_Logic_Progress/04_HACKATHON_IMPLEMENTATION_PLAN.md](../04_Logic_Progress/04_HACKATHON_IMPLEMENTATION_PLAN.md)
- **구현 로드맵**: [../04_Logic_Progress/05_HACKATHON_ROADMAP.md](../04_Logic_Progress/05_HACKATHON_ROADMAP.md)
