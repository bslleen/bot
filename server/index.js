import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config({ override: true });

const PORT = process.env.PORT || 3001;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

if (!OPENROUTER_API_KEY) {
  console.error("Missing OPENROUTER_API_KEY in server/.env");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

async function callOpenRouter(model, messages, max_tokens) {
  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, max_tokens }),
  });
  const data = await upstream.json();
  return { ok: upstream.ok && !data.error, status: upstream.status, data };
}

async function callClaude(messages, max_tokens) {
  const system = messages.find((m) => m.role === "system")?.content;
  const claudeMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens,
      system,
      messages: claudeMessages,
    }),
  });
  const data = await upstream.json();
  if (!upstream.ok || data.error) {
    return { ok: false, status: upstream.status, data };
  }
  const text = data.content?.find((b) => b.type === "text")?.text || "";
  return {
    ok: true,
    status: 200,
    data: { choices: [{ message: { role: "assistant", content: text } }] },
  };
}

app.post("/api/chat", async (req, res) => {
  const { model, messages, max_tokens } = req.body;
  try {
    const primary = await callOpenRouter(model, messages, max_tokens);
    if (primary.ok) {
      res.status(primary.status).json(primary.data);
      return;
    }
    if (!ANTHROPIC_API_KEY) {
      res.status(primary.status).json(primary.data);
      return;
    }
    const fallback = await callClaude(messages, max_tokens);
    res.status(fallback.status).json(fallback.data);
  } catch (e) {
    res.status(502).json({ error: "Upstream request failed" });
  }
});

app.listen(PORT, () => {
  console.log(`French bot proxy listening on http://localhost:${PORT}`);
});
