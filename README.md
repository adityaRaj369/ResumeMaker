# ResumeForge

ATS-optimized resume builder. Sign in with **Google**, pick a template, then edit by hand or generate a job-tailored version with AI that never invents experience. Output is a real text PDF.

## Stack

- Next.js 16 + TypeScript + Tailwind v4
- Auth.js (NextAuth v5) with **Google OAuth only** (demo login is off)
- Prisma + **SQLite locally** / **Postgres in production**
- Gemini for JD analysis + resume rewrite (`GEMINI_API_KEY`)
- ATS checker with **PDF upload** or pasted text
- Redis is **optional** (only if you want a shared job queue)

## Local setup

Node.js 20+ required.

```bash
cp .env.example .env
# Fill AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, GEMINI_API_KEY (see below)
npm install
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Continue with Google**.

`GET /api/health` should return `{ "ok": true, "database": "ok", "ai": "gemini" }`.

---

## Google login (required)

Demo login is disabled. You must create Google OAuth credentials.

### 1. Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or pick an existing one).
3. **APIs & Services → OAuth consent screen**
   - User type: **External** (personal Gmail) or **Internal** (Google Workspace only).
   - App name: `ResumeForge`
   - User support email: your email
   - Developer contact: your email
   - Scopes: the default `email`, `profile`, `openid` are enough. Do not add extra scopes.
   - If the app is in **Testing**, add your Gmail under **Test users** or you will get `403: access_denied`.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `ResumeForge local`
   - **Authorized JavaScript origins**
     - `http://localhost:3000`
   - **Authorized redirect URIs** (must match exactly, no trailing slash)
     - `http://localhost:3000/api/auth/callback/google`
5. Copy the **Client ID** and **Client secret**.

### 2. Paste into `.env`

```
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=xxxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxxxx
AUTH_DEMO_LOGIN=false
AUTH_SECRET=   # already generated locally; keep it
```

Restart `npm run dev` after saving. The home page button becomes **Continue with Google**.

### 3. Production Google URLs

Create a second OAuth client (or add URIs to the same client):

- Origin: `https://your-domain.com`
- Redirect: `https://your-domain.com/api/auth/callback/google`
- Set `AUTH_URL=https://your-domain.com`

Mismatch on the redirect URI is the #1 cause of `redirect_uri_mismatch`.

---

## Gemini AI

Already wired. Put the key in `.env`:

```
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

Restart the server after changing it. Empty key → rules-based mock (ATS and generate still run; the UI says so).

---

## Database

| Environment | What to use |
| --- | --- |
| Local | SQLite — `DATABASE_URL="file:./dev.db"` in `prisma/schema.prisma`. Run `npm run setup`. **Do not use Redis for this.** |
| Production | **Postgres** (Neon, Supabase, Railway, RDS). SQLite will not persist on Vercel. |

Production Prisma change in `prisma/schema.prisma`:

```
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then set `DATABASE_URL` to the Postgres URL, run `npx prisma db push` (or migrate) and `npx tsx prisma/seed.ts` so templates exist.

---

## Redis — not required

Leave `REDIS_URL` empty.

- Empty: generate/compile jobs run **in-process** (fine for local and a small production app).
- Set `REDIS_URL` only if you run multiple server instances and want BullMQ to share the queue (`docker compose up redis` or a hosted Redis).

You do **not** need Docker, Redis, or the LaTeX microservice to test locally. PDFs render in-process.

---

## Production checklist

```
AUTH_SECRET=              # long random
AUTH_URL=https://your-domain.com
AUTH_DEMO_LOGIN=false
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
DATABASE_URL=postgresql://...
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
REDIS_URL=                # leave empty unless you need a shared queue
```

Google callback: `https://your-domain.com/api/auth/callback/google`

Never commit `.env`.

## Product flow

1. Google sign-in → gallery
2. Edit a template or **Match to a job**
3. Fill `/profile` once before the first AI match
4. AI: JD analysis → match → rewrite → validate → PDF → ATS score
5. Public ATS checker: upload PDF or paste text

| Command | What it does |
| --- | --- |
| `npm run setup` | Prisma generate + SQLite schema + seed templates |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production |
