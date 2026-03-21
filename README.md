# v0-scm-intelligence

**Supply chain intelligence dashboard** — news-backed signals, AI-generated critical actions, sector trends, PDF export, and an embedded SCM assistant (Next.js App Router, TypeScript, Tailwind CSS).

[![CI](https://github.com/amitkumar-ai-pm/v0-scm-intelligence/actions/workflows/ci.yml/badge.svg)](https://github.com/amitkumar-ai-pm/v0-scm-intelligence/actions/workflows/ci.yml)

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below — start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` can trigger CI and (if connected) deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_hW0DgQN0L8otcgBRp19KSbgRhm0x)

## Architecture

| Layer | Role |
|--------|------|
| **UI** | `app/page.tsx` — dashboard (critical actions, latest signals, sector trends, PDF export). `app/chat/page.tsx` + `components/scm-assistant.tsx` — assistant UI with sidebar, composer, and local session history. |
| **API** | `app/api/insights/route.ts` — fetches two news providers, calls OpenAI for categories + critical actions, uses `unstable_cache` with configurable TTL. `app/api/chat/route.ts` — assistant chat with dashboard context. |
| **Data** | NewsData.io–style + NewsAPI.org–style feeds (URLs configurable); **Zod** validation; **OpenAI** for structured JSON. |
| **Static** | `lib/sector-trends.ts`, `lib/scm-types.ts` — sector trend series and shared types. |
| **Access** | **Path 2 (private):** `middleware.ts` — shared password → **HttpOnly JWT** cookie (`jose`); **Upstash** rate limits (global + `/api/auth/login`). Production **requires** `AUTH_SECRET`, `SITE_ACCESS_PASSWORD`, Upstash. |

```text
Browser → Next.js (App Router) → Route handlers → OpenAI / News APIs
                ↓
         Vercel Analytics (optional)
```

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Local development server |
| `pnpm lint` | ESLint (flat config + `eslint-config-next`) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm build` | Production build (`next build`) |
| `pnpm start` | Run production server after `build` |

## Getting started

```bash
pnpm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
# Edit .env.local with real API keys + auth (see below)

pnpm dev
```

**Local dev:** To work **without** the login gate / Upstash while coding, add **`SKIP_AUTH=true`** to `.env.local` (development only). To test the full gate locally, set `SKIP_AUTH` unset/false and fill `AUTH_SECRET`, `SITE_ACCESS_PASSWORD`, and Upstash keys.

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Access control (Path 2 — private / trusted users)

This app can run **behind a shared password** with **rate limits** (not suitable for public anonymous traffic; use full auth providers if you need per-user accounts).

| Mechanism | What it does |
|-----------|----------------|
| **`/login`** | User enters `SITE_ACCESS_PASSWORD`. On success, server sets an **HttpOnly, Secure (prod), SameSite=Lax** cookie with a **signed JWT** (`AUTH_SECRET` ≥ 32 chars). |
| **Middleware** | All routes except `/login`, `/api/auth/login`, `/api/auth/logout` require a valid session. APIs return **401 JSON** (no HTML redirect) for `fetch` callers. |
| **Upstash Redis** | **~120 requests / minute / IP** globally; **~5 login attempts / 15 min / IP** to slow brute force. **Required in production** — create a free database at [Upstash](https://console.upstash.com) and add REST URL + token to Vercel. |
| **`SKIP_AUTH`** | If `SKIP_AUTH=true` **and** `NODE_ENV=development`, the gate is **disabled** (local dev only). **Never** set `SKIP_AUTH=true` on Vercel Production. |
| **Sign out** | Header button (log out icon) calls `POST /api/auth/logout` and returns to `/login`. |

**Security notes:** One shared password means **anyone with the password** has full access — rotate it if it leaks. For stronger isolation later, replace with proper user auth (Clerk, Auth.js, etc.).

## Production checklist (portfolio / resume)

1. **Secrets:** Copy `/.env.example` → `.env.local` and fill in keys; never commit `.env.local`.
2. **Quality gate:** `pnpm lint` → `pnpm typecheck` → `pnpm build` (mirrors CI).
3. **Deploy:** Push to GitHub; set the same variables in Vercel (or your host) — see [Deploy (Vercel)](#deploy-vercel).
4. **CI:** Confirm the [CI workflow](.github/workflows/ci.yml) is green on `main`.
5. **Optional:** Enable [branch protection](#branch-protection-github) and require the **quality** check.

## CI (GitHub Actions)

On every **push** and **pull request** to `main`, the workflow runs:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm build` (with placeholder env vars so the build compiles without real secrets)

## Deploy (Vercel)

1. Push this repo to GitHub (already done if you’re reading this from the remote).
2. In [Vercel](https://vercel.com) → **Add New…** → **Project** → **Import** your GitHub repository `amitkumar-ai-pm/v0-scm-intelligence`.
3. **Framework Preset:** Next.js (auto-detected). **Build Command:** `pnpm build` (or leave default if Vercel detects `pnpm`). **Output:** default (`.next`).
4. Under **Environment Variables**, add the same keys as in `.env.example` / `.env.local` — including **`AUTH_SECRET`**, **`SITE_ACCESS_PASSWORD`**, **`UPSTASH_REDIS_REST_URL`**, **`UPSTASH_REDIS_REST_TOKEN`**. Do **not** set `SKIP_AUTH` in Production.
5. **Deploy**. After the first deploy, visitors hit **`/login`** first; after signing in, the dashboard and APIs work when news/OpenAI keys are valid.

**Tips**

- Never commit `.env.local`; keep secrets only in Vercel (and local).
- If the build fails, run `pnpm build` locally and fix errors before redeploying.
- Optional: assign a custom domain under **Project → Settings → Domains**.

## Branch protection (GitHub)

Do this in the repo on GitHub: **Settings** → **Branches** → **Add branch protection rule** (or **Add rule**).

- **Branch name pattern:** `main`
- Enable **Require a pull request before merging** (optional but recommended for teams).
- Enable **Require status checks to pass** after CI is on `main` — select the **`quality`** job from the **CI** workflow.
- Enable **Do not allow bypassing the above settings** for admins if you want strict enforcement.

This cannot be turned on from the git CLI — you configure it in the GitHub UI.

## Environment variables (`/.env.local`)

Latest Signals and **Today's Critical Actions** (`/api/insights`) are generated together from **NewsData.io** + **NewsAPI.org** article context via the configured OpenAI model (with sensible fallbacks if validation fails).

**Template:** see [`.env.example`](./.env.example) in the repo (safe to commit).

Example:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini

# Primary news (NewsData.io — use the "latest" endpoint; free tier uses `size` 1–10 per request)
NEWS1_API_URL=https://newsdata.io/api/1/latest
NEWS1_API_KEY=your_newsdata_api_key
# Optional; default is `apikey` (NewsData.io)
# NEWS1_API_KEY_PARAM=apikey

# Second news provider (NewsAPI.org — `from` / `to` are added automatically for a 48h window)
NEWS2_API_URL=https://newsapi.org/v2/everything
NEWS2_API_KEY=your_newsapi_key
# NEWS2_API_KEY_PARAM=apiKey

# Optional tuning
# NEWS_PROVIDER_TIMEOUT_MS=15000
# INSIGHTS_CACHE_SECONDS=90
```

### SCM Assistant (`/api/chat`)

Click **Assistant** (floating button, bottom-right) to open a wide panel (ChatGPT-style): **sidebar** (New chat + recent history), **main column** with centered messages (`max-w-3xl`), and a **bottom composer**. **Close** (X) or **Escape** or backdrop click dismisses it. **Pop out** opens `/chat` in a larger window. **Last five** chats persist in **`localStorage`** (`scm-assistant-sessions-v1`) on this device only.

If you still point `NEWS1_API_URL` at **GNews**, set `NEWS1_API_KEY_PARAM` to what that API expects (often `token`).

## Learn more

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) — learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) — an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) — learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/amitkumar-ai-pm/v0-scm-intelligence" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
