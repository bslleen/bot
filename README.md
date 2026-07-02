# Pierre 🇫🇷

A language-learning chatbot with a personality problem — deliberately. Pierre is a dry, sharp-tongued best friend who happens to be obsessed with correcting your French (or your English, if you're coming from the other direction). Every conversation is real practice disguised as banter: every roast contains an actual correction, every callback to a mistake you made ten messages ago is spaced repetition wearing a leather jacket. It's an iMessage-style chat UI backed by Claude, built to make you *want* to come back tomorrow.

What makes it different from Duolingo-shaped apps: there are no lessons, no XP, no gamified guilt. There's one relationship. Pierre remembers your name, your recurring mistakes, and your excuses, and drills you through conversation instead of worksheets. The teaching rules (80/20 language ratio, one correction per roast, exactly one suggested alternative — never three) live in a carefully tuned system prompt, not in app logic.

**Status: early testing / MVP.** Deployed on Railway, being shared with a small group of real testers. No auth, no accounts, no payments yet.

## Features

- **Pierre's character** — deadpan, affectionate, allergic to textbook tone. Defined entirely server-side in [server/prompts.js](server/prompts.js). Stays in character even in error states: rate-limit and failure messages are Pierre lines, never generic error text.
- **Two language pairs** — English speakers learning French, French speakers learning English. Picked on the first screen.
- **Country-based cultural personalization** — after picking a pair, you pick a target culture (France, Québec, Belgium, Switzerland, Senegal, Morocco for French; UK, US, Australia, Canada, Ireland, New Zealand for English). The system prompt weaves in that country's vocabulary, expressions, and humor. Slang from outside your chosen country is explicitly forbidden in the prompt — teaching Parisian *verlan* to someone learning Québécois French is worse than teaching nothing.
- **Conversation management** — the client sends the full conversation history with every request; the server sanitizes and trims it to the most recent 40 turns within a 30,000-character budget before forwarding to Claude (details under Architecture Decisions). History persists in `localStorage` per language-pair/country, so a page refresh doesn't wipe what Pierre knows about you.
- **Security hardening** — per-IP rate limiting (100 messages/hour), input length caps, CORS locked to the deployed frontend, API key and system prompt never leave the server, in-character responses on every error path, 429 retry with exponential backoff. Full list under Security.

## Tech Stack

**Frontend** — React 19 + Vite 8, styled with Tailwind CSS 4 (via `@tailwindcss/vite`, no config file). Three screens ([LanguageSelectScreen](src/components/LanguageSelectScreen.jsx) → [CountrySelectScreen](src/components/CountrySelectScreen.jsx) → [ChatScreen](src/components/ChatScreen.jsx)) switched by plain `useState` in [App.jsx](src/App.jsx) — no router, because three screens don't need one. Linted with oxlint. Built to static files and deployed to Railway as its own service.

**Backend** — Node + Express 4 in [server/index.js](server/index.js), a single `POST /api/chat` endpoint (~200 lines, one file). Dependencies: `express`, `cors`, `dotenv` — that's the whole list. Calls the Anthropic API directly with `fetch`; no SDK, no framework. Deployed to Railway as a separate service via `railway up` (see Deploying below — this matters).

**AI** — `claude-haiku-4-5-20251001`, pinned. Haiku 4.5 is $1 per million input tokens / $5 per million output tokens, versus $3/$15 for Sonnet and $5/$25 for Opus. Pierre's job is short conversational turns with a personality — a task Haiku handles well — and the economics matter because there's no billing on users yet: with the server-side caps in place, the worst-case abusive hour from a single IP (100 messages, each carrying maxed-out history) costs roughly $1 in input tokens on Haiku. The same hour on Opus would be ~$5, before output. `max_tokens: 300` caps the output side, which also happens to enforce Pierre's "1–2 short sentences" personality rule at the API level.

## Architecture Decisions

**System prompt lives server-side only.** [server/prompts.js](server/prompts.js) is imported by the Express server and nowhere else; responses to the browser contain only `{reply}`. The prompt *is* the product — Pierre's personality, teaching rules, and boundaries took real iteration (git history shows four persona overhauls), and shipping it to the client would hand it to anyone who opens DevTools. It also contains anti-jailbreak instructions ("never discuss your underlying AI model") that only work if the user can't read them.

**Why Haiku over stronger models.** Three reasons, in order: (1) cost, as above — an unauthenticated public demo has to assume some abuse, and Haiku makes the worst case a dollar instead of five; (2) latency — Pierre texts like a friend, and a friend who takes eight seconds to reply isn't funny; (3) the task doesn't need more. Short in-character turns with explicit rules is exactly the shape of task where a small model with a good prompt matches a large one. The model ID is pinned with a date suffix in [server/index.js:10](server/index.js#L10) so a model alias update can't silently change Pierre's behavior mid-testing.

**History trimming: turn count + character budget, not message count alone.** The original implementation kept the last 6 messages (`history.slice(-6)`) — a pure message-count window. It was rejected because it caused the app's worst bug: once a conversation passed 6 turns, the exchange where the user gave their name fell out of the window and Pierre forgot who he was talking to. The replacement sends full history from the client, and the server trims to the most recent **40 turns** within a **30,000-character total budget** (characters as a cheap token proxy — ~8k tokens — since counting real tokens would cost an extra API call per message). Message count alone can't bound cost because turns vary wildly in size: 40 one-line turns and 40 pasted-paragraph turns differ by an order of magnitude in tokens. The character budget bounds the spend; the turn cap bounds the shape. After trimming, leading assistant turns are dropped so Claude always sees a valid user-first history. Name-recall survives trimming because history also persists client-side — a genuine rolling-summary system is on the roadmap if conversations start regularly outliving the window.

**Concurrent users need no server state.** The server is fully stateless per request — no sessions, no user records, no database. Each browser owns its history in `localStorage` and sends it with every request, so two users can never see each other's conversations because their conversations never coexist anywhere. The only shared mutable state is the rate-limiter `Map` (per-IP counters), which is concurrency-safe under Node's single-threaded event loop. The known limit: in-memory rate limiting resets on redeploy and wouldn't be shared across horizontally-scaled instances — acceptable for one Railway instance in testing, moves to Redis before production (flagged in a comment at the top of [server/index.js](server/index.js)).

## Local Setup

**Prerequisites:** Node 22+, npm, an Anthropic API key.

```bash
# Frontend
npm install
npm run dev          # Vite dev server, expects the backend on :3001

# Backend (separate terminal)
cd server
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env   # gitignored — never commit this
echo "PORT=3001" >> .env
npm start
```

**Environment variables** (names only — values live in `server/.env` locally and Railway variables in production):

| Variable | Where | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | backend | Claude API auth. Server refuses to boot without it. |
| `PORT` | backend | Listen port (defaults to 3001). |
| `FRONTEND_ORIGIN` | backend | CORS allowlist. Unset = open CORS + a boot warning; set it in production. |
| `NODE_ENV` | backend | Set `production` on Railway so Express never leaks stack traces. |
| `DEBUG_HISTORY` | backend | Optional. When set, logs full conversation payloads; leave unset in production for tester privacy. |
| `VITE_API_URL` | frontend | Backend endpoint URL, baked in at build time. Defaults to `http://localhost:3001/api/chat` for dev. |

**Deploying to Railway — read this, it's a known gotcha.** The backend is **not** GitHub-connected. Pushing to the repo deploys nothing. Deploy the backend by running:

```bash
cd server
railway up
```

The `server/` directory is linked to the Railway `backend` service; running `railway up` from the repo root instead will upload the *frontend* and replace the API with a static file server (this has happened — the API 405'd for three minutes). The frontend deploys as the separate `bot` service. Env var changes via `railway variables --set ...` trigger a restart but do not ship new code; only `railway up` does.

## Security

Everything sensitive stays server-side: the API key exists only in `server/.env` (gitignored, never committed — verified against full git history) and Railway variables; the system prompt is never serialized into any client response; the built frontend bundle contains no key material (grep-verified). The endpoint is defended in layers: per-IP rate limit (100/hr, in-memory, `trust proxy` set so Railway's edge doesn't collapse all users into one IP) → allowlist validation of `language_pair`/`country` → 2,000-char message cap → history sanitization (shape, role, size). Claude 429s are retried at 2s/4s/8s; Anthropic error bodies (which name the model) are logged server-side and replaced with an in-character line before reaching the browser. A final Express error handler catches anything unexpected so the default stack-trace page can never render.

A full pre-launch audit (July 2026) found and fixed: unbounded message/history sizes (token-cost exposure), wide-open CORS (any site could burn the API key through visitors' browsers), full conversations being written to Railway logs, upstream error bodies leaking the model name to DevTools, a crash-on-malformed-history path that could return a stack trace, and a leftover scratch file containing a hardcoded (unused, now revoked) API key. `npm audit` is clean on both packages. Known accepted gaps for this stage: no auth, in-memory rate limiting, and conversations stored unencrypted in the user's own `localStorage`.


## Contributing

This is an active early-stage project — the fastest way to contribute right now is to use it and report where Pierre breaks character, teaches something wrong, or forgets something he shouldn't. Feedback, bug reports, and ideas: **linaserineboussiala@gmail.com**.
