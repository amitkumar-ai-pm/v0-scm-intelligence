# v0-scm-intelligence

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_hW0DgQN0L8otcgBRp19KSbgRhm0x)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Environment variables (`/.env.local`)

Latest Signals and **Today's Critical Actions** (`/api/insights`) are generated together from **NewsData.io** + **NewsAPI.org** article context via the configured OpenAI model (with sensible fallbacks if validation fails).

Example env:

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

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/amitkumar-ai-pm/v0-scm-intelligence" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
