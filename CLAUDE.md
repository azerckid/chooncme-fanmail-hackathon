# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

춘심이(K-pop trainee persona) 팬메일 자동 응답 시스템. Gmail API로 팬메일을 수집하고, Gemini LLM으로 분류·답장을 생성하여 자동 발송하는 Next.js 풀스택 앱.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run db:migrate   # Run Drizzle migrations (Turso)
```

No test runner is configured. Manual testing via scripts in `/scripts/`.

## Architecture

### Email Processing Pipeline

```
Cron (/api/cron/check-email, hourly)
  → lib/email/fetch.ts       (Gmail API)
  → lib/email/classify.ts    (LLM: fan vs. non-fan)
  → lib/email/archive.ts     (POST /api/letters → DB)
  → lib/scheduler/reply-generator.ts  (Gemini reply)
  → lib/scheduler/delayed-send.ts     (10–30 min random delay)
  → lib/scheduler/follow-up.ts        (schedule: 1w→2w→4w→8w)
```

### Key Layers

- **`app/api/`** — REST endpoints. All POST routes require `Authorization: Bearer <API_SECRET_KEY>`. Cron endpoint uses `CRON_SECRET` header.
- **`lib/llm/`** — Gemini client + separate prompt files per use case (classify, reply, followup).
- **`lib/scheduler/`** — Pipeline orchestration. `process-emails.ts` is the main entry point called by the cron route.
- **`db/schema.ts`** — Drizzle schema: `fan_letters`, `replies`, `follow_ups`. Topics stored as JSON string.
- **`app/dashboard/`** — Admin UI (Next.js App Router). No auth guard currently.
- **`components/ui/`** — shadcn/ui primitives only. Domain components live in `components/dashboard/`.

### API Response Convention

All API routes return `{ success: boolean, data?: ..., error?: string }`.

## Environment Variables

```env
DATABASE_URL=libsql://...turso.io
DATABASE_AUTH_TOKEN=...
GMAIL_USER=...@gmail.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_GEMINI_API_KEY=...
API_SECRET_KEY=...
CRON_SECRET=...
REPLY_DELAY_MIN=10
REPLY_DELAY_MAX=30
EMAIL_DRY_RUN=false
FOLLOWUP_ENABLED=true
```

Gmail refresh token is generated via `npx ts-node scripts/get-gmail-refresh-token.ts`.

## AGENTS.md Standards (must follow)

- **Before any code change**: report the plan and get explicit approval.
- **Before any DB destructive operation**: confirm a full backup exists.
- **Commits**: `type(scope): 한글 설명` — type in English (feat/fix/refactor/docs/chore), description in Korean.
- **Validation**: Zod for all API inputs. **Date handling**: Luxon only (no native Date manipulation).
- **No emojis** in any communication or code comments.
- **Evidence-based**: verify current state with tools before answering; no speculation.

## Documentation Structure

`docs/` follows the 365 Principle 5-layer structure — preserve it strictly:

| Layer | Path | Contents |
|-------|------|----------|
| 01 | `docs/01_Concept_Design/` | Vision, product planning |
| 02 | `docs/02_UI_Screens/` | UI design, screen flows |
| 03 | `docs/03_Technical_Specs/` | DB schema, API spec |
| 04 | `docs/04_Logic_Progress/` | Roadmap, backlog |
| 05 | `docs/05_QA_Validation/` | Test scenarios, QA reports |

When adding or modifying a feature, check whether docs need updating before implementing.
