# 개발 원칙 및 구현 프로세스 (Development Principles)

> Created: 2026-04-21
> Last Updated: 2026-04-21
> 이 문서는 프로젝트의 모든 코드 수정 시 준수해야 할 표준 워크플로우를 정의합니다.

---

## 1. 표준 구현 워크플로우 (5-Step Workflow)

모든 기능 구현 및 코드 수정은 반드시 아래의 5단계를 순차적으로 거쳐야 합니다. 단계를 건너뛰는 '졸속 구현'은 엄격히 금지됩니다.

### Step 1. 코드 심층 분석 (Code Reading)
- 수정하려는 대상 파일뿐만 아니라, 해당 파일을 참조하는 의존성 관계(Imports/Exports)를 모두 파악한다.
- `view_file` 또는 `grep_search`를 통해 관련 로직을 완벽히 이해한다.
- **필수 확인**: 현재 기술 스택(Next.js, Drizzle, Zod 등)의 Best Practice와 일치하는지 확인한다.

### Step 2. 문제 진단 및 영향 분석 (Problem Diagnosis)
- 단순히 "기능 추가"가 아니라 "기존 시스템에 미칠 영향"을 분석한다.
- 예상되는 블로커(Blocker), 라이브러리 버전 충돌, 사이드 이펙트를 사전에 식별한다.
- **사상 검증**: 수정 후에도 운영 데이터(Production Data)의 정합성이 유지되는지 확인한다.

### Step 3. 구현 전략 보고 (Strategy Proposal)
- 분석한 내용을 바탕으로 구체적인 구현 계획을 사용자에게 보고한다.
- **보고 형식**:
    - [ ] 수정할 파일 목록
    - [ ] 변경될 핵심 로직 설명
    - [ ] 데이터베이스 스키마 변경 여부
    - [ ] 테스트/검증 방법
- "OOO 기능을 수정하겠습니다"라고 목적을 명확히 밝힌다.

### Step 4. 사용자 명시적 승인 (Human Approval)
- 사용자의 "승인합니다" 또는 "진행하세요"와 같은 **명시적인 텍스트 승인**을 기다린다.
- 사용자가 질문을 던질 경우, 코드를 건드리지 않고 상세한 텍스트 답변으로 의문을 해소한다.

### Step 5. 정밀 구현 및 완료 보고 (Implementation & Report)
- 승인된 범위 내에서만 정밀하게 코드를 작성한다.
- 구현 완료 후 본인이 직접 `Self-Review`를 수행한다.
    - 불필요한 로그(`console.log`) 삭제 여부
    - 타입 안전성(`Any` 지양) 확보 여부
    - 문서(`README`, `docs/`) 업데이트 여부
- 최종 작업 결과를 요약하여 보고한다.

---

## 2. 코드 품질 표준

1. **Type Safety**: 모든 데이터 모델은 Zod를 통해 검증하며, TypeScript의 `strict` 모드 수준을 준수한다.
2. **Standard Architecture**: 임시 방편(Quick-fix)보다는 확장 가능한 표준 아키텍처를 지향한다.
3. **No Guessing**: 도구(Tool)로 검증되지 않은 사실을 바탕으로 코딩하거나 답변하지 않는다. (Evidence-Based Implementation)
4. **Environment Isolation**: `.env` 관리는 환경별로 엄격히 분리하며, 보안 정보를 코드에 하드코딩하지 않는다.

---

## 3. Related Documents

- **프로젝트 헌법**: [AGENTS.md](../../AGENTS.md)
- **구현 로드맵**: [../04_Logic_Progress/05_HACKATHON_ROADMAP.md](../04_Logic_Progress/05_HACKATHON_ROADMAP.md)
- **기술 명세**: [06_HACKATHON_TECH_SPEC.md](./06_HACKATHON_TECH_SPEC.md)
