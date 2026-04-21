# 해커톤 데모 시나리오 & Q&A 레퍼런스

> Created: 2026-04-21
> Last Updated: 2026-04-22
> 심사 시간: 2026-04-25 17:10~18:40

---

## 1. 데모 시나리오 (발표 스크립트)

### 오프닝 (30초)

> "K-pop 팬이라면 누구나 아이돌에게 편지를 보내지만, 답장을 받는 사람은 없습니다.
> 저희는 AI 에이전트가 크리에이터를 대신해 팬 한 명 한 명에게 직접 답장하고,
> 그 답장을 Base 블록체인에 영구 기록하는 시스템을 만들었습니다."

---

### 시연 순서

**Step 1 — 팬레터 발송 (심사위원이 직접)**

> "지금 이 이메일 주소로 팬레터를 보내주세요."

- 심사위원이 직접 이메일 발송
- 내용은 자유 (한국어, 영어 모두 가능)

**Step 2 — 에이전트 파이프라인 시연**

> "에이전트가 지금 세 가지를 동시에 합니다."

대시보드 또는 터미널 로그를 보여주며:
1. Flock.io LLM이 팬메일인지 분류
2. 춘심이 페르소나로 답장 생성
3. AgentKit이 답장을 NFT로 Base Sepolia에 민팅

**Step 3 — 결과 확인**

> "답장 이메일이 도착했습니다. 하단에 링크가 있습니다."

- 심사위원의 수신함에서 답장 이메일 확인
- 이메일 하단 클레임 링크 클릭
- Base Sepolia Explorer에서 NFT 트랜잭션 직접 확인

**Step 4 — 클로징 (15초)**

> "이 에이전트는 크리에이터가 잠든 사이에도 팬 한 명 한 명에게 답장합니다.
> 그리고 그 모든 인터랙션은 Base 위에 영원히 남습니다.
> 춘심이는 첫 번째 인스턴스입니다. 다음은 당신이 좋아하는 아이돌입니다."

---

## 2. 예상 Q&A

### 기술 관련

**Q. AgentKit이 이 제품에서 구체적으로 무엇을 합니까?**

> AgentKit은 에이전트 전용 지갑을 생성하고, 팬레터 답장이 생성될 때마다 ERC-721 NFT 민팅 트랜잭션을 자율으로 서명하고 실행합니다. 사람이 개입하지 않아도 에이전트가 온체인 액션을 직접 수행합니다.

**Q. Flock.io를 왜 사용했습니까? 다른 LLM과 차이가 있습니까?**

> Flock.io는 Web3 Agent Model을 제공하며 탈중앙화 AI 인프라입니다. 이번 해커톤의 필수 기술 스택이기도 하고, 온체인 컨텍스트를 이해하는 데 특화된 모델을 사용할 수 있다는 점에서 선택했습니다.

**Q. x402는 어떻게 사용했습니까?**

> 에이전트가 Flock.io에 LLM 추론을 요청할 때 x402 프로토콜로 USDC를 자율 결제합니다. 사람이 결제 버튼을 누르지 않아도 에이전트가 스스로 운영 비용을 집행하는 구조입니다. (Phase 3 미완성 시: "x402 연동은 준비했으나 오늘 시간 내에 완성하지 못했고, Flock.io + AgentKit NFT 민팅에 집중했습니다.")

**Q. 팬이 NFT를 클레임하려면 지갑이 필요한데, 일반 팬이 사용할 수 있습니까?**

> 현재 프로토타입은 Base Sepolia Explorer 링크를 통해 트랜잭션을 확인하는 방식입니다. 실제 서비스에서는 클레임 페이지에서 지갑 없이도 NFT를 확인하고, 필요 시 Coinbase Wallet 연동으로 클레임할 수 있도록 확장할 수 있습니다.

---

### 비즈니스 관련

**Q. 이건 특정 아이돌 전용 아닌가요? 범용성이 있습니까?**

> 춘심이는 첫 번째 인스턴스입니다. 이 플랫폼은 어떤 크리에이터도 자신의 페르소나와 이메일 주소만 설정하면 동일한 에이전트를 배포할 수 있도록 설계되어 있습니다. Virtuals Protocol이 크리에이터 AI 에이전트 시장을 증명했고, 저희는 그 위에 팬 소통 레이어를 올렸습니다.

**Q. 수익 모델이 있습니까?**

> 크리에이터가 에이전트 배포 구독료를 지불하고, 플랫폼이 에이전트 지갑을 운영합니다. 에이전트는 그 예산 안에서 LLM 추론 비용을 자율 집행합니다. 크리에이터 입장에서는 팬 관리 비용을 예측 가능하게 온체인으로 운영할 수 있습니다.

---

## 3. 데모 전 체크리스트

- [ ] 심사 전날 테스트 이메일 발송 → NFT 민팅 → 클레임 링크 수신 전체 흐름 리허설
- [ ] Base Sepolia Explorer에서 컨트랙트 주소 북마크
- [ ] 에이전트 지갑에 테스트 ETH 잔액 확인 (민팅 가스비)
- [ ] 대시보드 또는 터미널 로그 화면 준비 (파이프라인 시각화용)
- [ ] 심사위원용 테스트 이메일 주소 미리 안내할 방법 준비 (슬라이드 또는 QR코드)

---

## 4. 해커톤 당일 실행 환경 구성

### 역할 분리

```
맥북 로컬 (해커톤 장소)          Vercel (배포)
├── npm run dev 실행             ├── 대시보드 UI
├── 이메일 수집 (Gmail cron)     ├── /pitch 피치덱
├── Flock.io LLM 분류/답장 생성  ├── /claim/[id] NFT 클레임 페이지
├── AgentKit NFT 민팅            └── /api/* REST API (DB 조회)
├── x402 결제
└── 이메일 발송
```

> Vercel은 서버리스라 cron 지속 실행 불가. 이메일 처리 파이프라인은 반드시 맥북 로컬에서 실행.

### 사전 준비 (해커톤 전날)

- [ ] 기존 맥미니 서버 중단 확인 (이메일 중복 처리 방지)
- [ ] 맥북에 `.env.local` 복사 및 아래 항목 추가
  ```env
  DEMO_MODE=true
  FLOCK_API_KEY=          # 해커톤 당일 수령
  CDP_API_KEY_ID=         # 해커톤 당일 수령
  CDP_API_KEY_SECRET=     # 해커톤 당일 수령
  NFT_CONTRACT_ADDRESS=   # Base Sepolia 배포 후 추가
  GAME_API_KEY=           # 해커톤 당일 수령
  ```
- [ ] 맥북에서 `npm run dev` 정상 실행 확인
- [ ] Vercel 배포 URL에서 대시보드, 피치덱 정상 접근 확인

### 해커톤 당일 데모 실행 순서

1. 맥북에서 `npm run dev` 실행
2. 심사위원에게 `choon.cme@gmail.com`으로 이메일 발송 요청
3. 터미널에서 즉시 처리 트리거:
   ```bash
   curl -X POST http://localhost:3000/api/demo/trigger \
     -H "Authorization: Bearer $CRON_SECRET"
   ```
4. 30초 내 답장 이메일 + NFT 클레임 링크 수신 확인
5. 심사위원 브라우저에서 Vercel URL의 `/claim/[tokenId]` 페이지 확인

### GitHub / Vercel 구성

| | 원본 (맥미니) | 해커톤 (맥북) |
|:---|:---|:---|
| GitHub | `azerckid/chooncme-fan-mail` (private) | `azerckid/chooncme-fanmail-hackathon` (public) |
| Vercel | 기존 배포 | 새 배포 (`chooncme-hackathon.vercel.app`) |
| 로컬 서버 | 중단 | 맥북에서 실행 |

---

## 5. Related Documents

- **피칭 전략**: [03_HACKATHON_PITCHING_STRATEGY.md](./03_HACKATHON_PITCHING_STRATEGY.md)
- **구현 로드맵**: [../04_Logic_Progress/05_HACKATHON_ROADMAP.md](../04_Logic_Progress/05_HACKATHON_ROADMAP.md)
- **기술 명세**: [../03_Technical_Specs/06_HACKATHON_TECH_SPEC.md](../03_Technical_Specs/06_HACKATHON_TECH_SPEC.md)
