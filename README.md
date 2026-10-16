# Labdox Adaptive Website

Greenfield Next.js app for the Labdox intent site. Stack is locked (DEC-028): Next.js App Router, TypeScript (strict), Tailwind, Prisma, Supabase, Vercel. Do not re-open it.

Planning docs live in the parent workspace: `docs/labdox-website-upgrade/`. Conflict arbiter: `Ansh PRD.pdf` + `Cursor_Master_Prompt.md`, then the decisions register. DEC-041 is current Blue/home.

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20.x (`nvm use` reads `.nvmrc`) |
| pnpm | ≥ 9 (`corepack prepare pnpm@9.15.9 --activate`) |
| Docker Desktop | required by `supabase start` |
| Supabase CLI | ≥ 1.200 (`brew install supabase/tap/supabase`) |

## First-time setup

```bash
nvm use
pnpm install
cp .env.example .env.local   # then paste values from `supabase start`
supabase start
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm dev                     # http://localhost:3000
```

`supabase start` prints local credentials. Map:

| Printed value | Env var |
|---|---|
| DB URL (port 54322) | `DATABASE_URL` and `DIRECT_URL` |
| API URL (port 54321) | `NEXT_PUBLIC_SUPABASE_URL` |
| anon key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role key | `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_`) |

Studio: http://localhost:54323

## What this repo owns (Sprint 0–1)

- App Router shell, Tailwind tokens (void / phosphor / electric / crimson)
- Google-minimal pill fork at `/` — Red is crimson, Blue is electric, pills are real `<a>` links, colour is not the only cue
- Nav / footer per `SITE_CHROME_AND_CONTENT_PAGES_FREEZE.md`
- Stub routes from the IA register
- Legal stubs at `/privacy`, `/terms`, `/accessibility`
- Prisma schema + seed against local Supabase
- GitHub Actions CI stub and Vercel project config

Not in this slice: live Gemini enablement (blocked pending the golden evaluation), HubSpot, full quiz, Stitch UI, audience-card Blue wall, chatbot, custom CRM.

## Scripts

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm prisma migrate deploy
pnpm prisma db seed
```

## Vercel wiring

1. Import this GitHub repo in Vercel (framework: Next.js, Root Directory: repo root, Node 20).
2. Create two Supabase projects (staging, production). Previews use staging.
3. Set Preview vs Production env vars from `.env.example`. `SUPABASE_SERVICE_ROLE_KEY`, `AI_API_KEY`, and `LEAD_WEBHOOK_SECRET` exist only in Vercel — never in git.
4. Production region in `vercel.json` is `sin1` (closest default to Pune). Change if the team prefers another.
5. After HubSpot / GA4 IDs exist, paste them into the Vercel dashboard. Then add GitHub secrets `DATABASE_URL`, `DIRECT_URL`, and `VERCEL_DEPLOY_HOOK_URL` so `.github/workflows/deploy.yml` can migrate before a production promote.

`AI_ENABLED` stays `false` until the golden set passes. Blue never calls Gemini even when the flag is true.

AI requests use shared Postgres hourly buckets (10 calls per hour per IP and
session) and atomically reserve daily budget before contacting Gemini. Provider
calls remain disabled unless `AI_MAX_REQUEST_COST_USD` is configured as a
conservative upper bound for the request and its retry; usage-store failures
fall back to deterministic results. `AI_MODEL` must be explicitly configured;
live model availability and credentials have not been verified. Free text is
stored on a session only when the visitor explicitly enables “Save my answer to
improve my result”; otherwise the session stores `said.freeText = null`.
