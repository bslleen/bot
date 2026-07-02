import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { buildSystemPrompt, isValidContext } from "./prompts.js";

dotenv.config({ override: true });

const PORT = process.env.PORT || 3001;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY in server/.env");
  process.exit(1);
}

// --- Rate limiting: 100 messages per IP per rolling 1-hour window ---
// In-memory Map, no database. This resets if the server restarts, and
// won't be shared across multiple server instances if Railway ever scales
// this service horizontally. Acceptable for early testing / low traffic —
// move to Redis (or another shared store) before real production load.
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const rateLimitStore = new Map(); // ip -> { count, windowStart }

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Periodic sweep so the map doesn't grow forever with stale IPs.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore) {
    if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(ip);
    }
  }
}, 10 * 60 * 1000).unref();

const RATE_LIMIT_MESSAGE =
  "On a beaucoup travaillé aujourd'hui — come back in an hour for more. C'est bon pour toi.";
const RETRY_EXHAUSTED_MESSAGE = "On fait une petite pause — back in deux secondes.";
const RETRY_DELAYS_MS = [2000, 4000, 8000];

async function fetchClaudeWithRetry(body) {
  let upstream;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    if (upstream.status !== 429) return upstream;
    if (attempt < RETRY_DELAYS_MS.length) {
      const delay = RETRY_DELAYS_MS[attempt];
      console.warn(
        `[backend] Claude API returned 429; retrying in ${delay}ms (attempt ${attempt + 1}/${RETRY_DELAYS_MS.length})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return upstream; // still 429 after exhausting retries
}

const app = express();
// Railway sits behind a reverse proxy — without this, req.ip is Railway's
// edge IP for every request, and per-IP rate limiting would rate-limit
// everyone as a single "user." Trust exactly one proxy hop.
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  if (!checkRateLimit(req.ip)) {
    res.status(429).json({ reply: RATE_LIMIT_MESSAGE });
    return;
  }

  const { language_pair, country, history, message } = req.body;

  if (!isValidContext(language_pair, country)) {
    res.status(400).json({ error: "Invalid language_pair or country" });
    return;
  }
  if (typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Missing message" });
    return;
  }

  const claudeMessages = (Array.isArray(history) ? history : [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));
  claudeMessages.push({ role: "user", content: message });

  console.log(`[backend] messages array sent to Claude (${claudeMessages.length} turns):`,
    JSON.stringify(claudeMessages, null, 2));

  try {
    const upstream = await fetchClaudeWithRetry({
      model: ANTHROPIC_MODEL,
      max_tokens: 300,
      system: buildSystemPrompt(language_pair, country),
      messages: claudeMessages,
    });

    if (upstream.status === 429) {
      // Exhausted all retries — respond in character instead of a raw error.
      res.status(200).json({ reply: RETRY_EXHAUSTED_MESSAGE });
      return;
    }

    const data = await upstream.json();
    if (!upstream.ok || data.error) {
      const reason = data.error?.message || `HTTP ${upstream.status}`;
      res.status(upstream.status).json({ error: reason });
      return;
    }
    const reply = data.content?.find((b) => b.type === "text")?.text || "";
    res.status(200).json({ reply });
  } catch (e) {
    res.status(502).json({ error: "Upstream request failed" });
  }
});

app.listen(PORT, () => {
  console.log(`French bot proxy listening on http://localhost:${PORT}`);
});
