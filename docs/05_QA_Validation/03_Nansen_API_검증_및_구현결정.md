# Nansen API 검증 및 구현 결정

- Created: 2026-04-24
- Updated: 2026-04-25
- Status: 검증 완료 — 방향 A+B 혼합 구현

## 관련 문서

- [해커톤 발표 전 체크리스트](./02_해커톤_발표전_체크리스트.md)

---

## 배경

팬 지갑 프로파일링 기반 맞춤 답장 기능 구현을 위해 Nansen API 사용을 검토 중.
핵심 전제: "단일 API 호출로 지갑의 Smart Money 여부 또는 온체인 활동 등급을 판단할 수 있는가"

구현 전 반드시 검증 필요. 검증 결과에 따라 구현 방향이 달라짐.

---

## 검증 항목

### Check 1 — Smart Money 레이블 API 존재 여부

Nansen의 Smart Money 분류는 자체 모델 기반 프로프라이어터리 레이블.
공개 API에서 직접 노출 여부 불확실.

```bash
# Nansen API 크레딧 수령 후 실행
curl -X GET "https://api.nansen.ai/v1/wallet/{address}/labels" \
  -H "Authorization: Bearer $NANSEN_API_KEY"
```

확인 포인트:
- 응답에 `smart_money`, `whale` 등의 레이블 필드가 있는가
- 레이블이 없다면 어떤 필드로 티어 구분이 가능한가

### Check 2 — 지갑 포트폴리오 조회 가능 여부

```bash
curl -X GET "https://api.nansen.ai/v1/wallet/{address}/portfolio" \
  -H "Authorization: Bearer $NANSEN_API_KEY"
```

확인 포인트:
- 잔액, NFT 보유 수, 총 자산가치 조회 가능한가
- 응답 속도가 3초 이내인가 (이메일 처리 파이프라인 내 허용 범위)

### Check 3 — Base Sepolia 지원 여부

Nansen이 Base Mainnet은 지원하나, Base Sepolia(테스트넷) 지원 여부 확인 필요.

---

## 결정 트리

```
Nansen API 크레딧 수령 후 Check 1 실행
        │
        ├─ Smart Money 레이블 직접 조회 가능
        │       → 구현 방향 A (Nansen 핵심 사용)
        │
        ├─ 레이블 없음, 포트폴리오 데이터만 가능
        │       → 구현 방향 B (임계값 기반 자체 분류)
        │
        └─ API 응답 불안정 또는 Base 미지원
                → 구현 방향 C (Nansen 제외, Base RPC 직접 사용)
```

---

## 구현 방향별 계획

### 방향 A — Nansen Smart Money 레이블 직접 활용

Nansen이 레이블을 제공하는 경우.

```
lib/blockchain/nansen.ts
  → getWalletProfile(address): { tier: 'smart_money' | 'whale' | 'regular' }
lib/email/classify.ts
  → 지갑 주소 파싱 후 Nansen 호출
lib/llm/reply-prompt.ts
  → 티어별 프롬프트 컨텍스트 주입
```

### 방향 B — 포트폴리오 데이터 기반 자체 분류

Nansen 포트폴리오 데이터(잔액, NFT 수)로 자체 티어 판단.

```typescript
// 임계값 기준 (조정 가능)
if (totalValueUsd > 10000) return 'whale';
if (nftCount > 5)          return 'nft_collector';
return 'regular';
```

Nansen은 데이터 소스로 활용, 분류 로직은 자체 구현.

### 방향 C — Base RPC 직접 조회 (Nansen 제외)

Nansen API가 불안정하거나 유용한 데이터를 제공하지 않는 경우.
Base Sepolia 퍼블릭 RPC로 ETH 잔액 + NFT 보유 수만 조회.
Nansen은 대시보드에서 "외부 분석 링크" 용도로만 표시.

---

## 검증 일정

| 시점 | 액션 |
|------|------|
| 2026-04-25 오전 (크레딧 수령 후) | Check 1, 2, 3 순서로 실행 |
| 결과 확인 후 즉시 | 방향 A/B/C 중 선택, 구현 시작 |
| 해킹 시작(11:00) 전까지 | `lib/blockchain/nansen.ts` 완성 |

---

## 검증 결과 기록란 (2026-04-25)

- **Check 1 결과**: 레이블 API 정상 — `POST /profiler/address/labels` 응답 200, `High Activity`, `Token Billionaire` 등 레이블 반환 확인
- **Check 2 결과**: 트랜잭션 API 정상 — `POST /profiler/address/transactions` 응답 200, `chain: 'base'` 지원 확인
- **Check 3 결과**: Base Sepolia 미지원 — `chain: 'base_sepolia'` 422 오류. Base 메인넷(`chain: 'base'`)만 사용
- **선택 방향**: 방향 A + B 혼합
  - 방향 A (우선): 에이전트 지갑 수신 트랜잭션에서 팬 지갑 송금 이력 확인 → VIP
  - 방향 B (폴백): 팬 지갑 레이블 조회 → `Token Billionaire`, `High Activity` 등 → VIP
  - 방향 C (최종 폴백): Base RPC 잔액 기반 (Nansen 불가 시)
- **구현 파일**: `lib/blockchain/nansen.ts`, `lib/email/parse-wallet.ts`

### VIP 판별 흐름

```
팬메일 수신
  → 본문에서 지갑 주소 추출 (0x... 정규식)
  → Nansen 방향 A: 에이전트 지갑 수신 tx 조회 → 팬 지갑이 송금했으면 VIP
  → (A 실패 시) 방향 B: 팬 지갑 레이블 조회 → Smart Money/Whale/Token Billionaire → VIP
  → (B 실패 시) 방향 C: Base RPC 잔액 > 0.05 ETH → VIP
  → VIP이면 → 골든 NFT 민팅 + VIP 전용 답장 생성
```

### 인증 방식

- 헤더: `apikey: <NANSEN_API_KEY>` (소문자, Bearer 아님)
- 트랜잭션 API 필수 파라미터: `address`, `chain`, `date: { from, to }`
