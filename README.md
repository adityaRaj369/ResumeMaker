# ResumeForge

ATS-optimized resume builder. Users sign in, swipe a gallery of real **LaTeX** templates, then either edit by hand or generate a job-tailored version with AI that **never invents experience**. Output is a compiled, text-based PDF — never a screenshot.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn-style UI + Framer Motion
- Auth.js (NextAuth v5) with Google OAuth + local demo login
- Prisma + SQLite locally (swap `DATABASE_URL` to Postgres/Supabase/Neon for production)
- Gemini primary via `AIProvider` (OpenAI / Grok / mock swap with `AI_PROVIDER`)
- Embla carousel, Monaco editor, TanStack Query
- LaTeX compile: Dockerized `tectonic` service, local `tectonic` binary, or pdf-lib fallback
- Optional BullMQ + Redis; in-process jobs if Redis is unset

## Quick start

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Continue with demo**. First login lands on the template gallery.

### Google login

Create OAuth credentials, then set:

```
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_SECRET=...   # openssl rand -base64 32
```

Callback URL: `http://localhost:3000/api/auth/callback/google`

Set `AUTH_DEMO_LOGIN=false` in production.

### Real Gemini pipeline

```
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-pro
```

Without a key, the app uses a deterministic **mock** provider so the multi-step pipeline, warnings, compile, and ATS score still run end-to-end.

### Real LaTeX (tectonic)

```bash
docker compose up latex
```

Then set `LATEX_SERVICE_URL=http://localhost:8080`. If unset, ResumeForge looks for a local `tectonic` binary, then falls back to a Times-font, single-column, text PDF via `pdf-lib` (still ATS-parseable — not an image).

## Product flow

1. Landing → Google or demo login → **gallery** (no forced onboarding)
2. Template carousel → Edit (manual split-pane) or **Match to a job**
3. Profile stepper is shown once before the first ATS match, then reused from `/profile`
4. AI pipeline: JD analysis → gap match → rewrite → claim validation → LaTeX inject → compile → ATS score
5. Generation UI streams steps over SSE, then side-by-side reveal + score ring → continue in the editor

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run db:push` | Sync Prisma schema |
| `npm run db:seed` | Seed 8 ATS-safe templates |
| `docker compose up` | Optional Postgres, Redis, tectonic microservice |

## Production notes

- Point Prisma at Postgres and set `LATEX_SERVICE_URL` to the Railway/Fly tectonic service.
- Set `REDIS_URL` to enable BullMQ workers for compile/generate.
- `AI_RATE_LIMIT_PER_HOUR` caps generation per user.
- Never commit `.env`. Rotate `AUTH_SECRET` before deploy.
