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

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
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
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 300,
        system: buildSystemPrompt(language_pair, country),
        messages: claudeMessages,
      }),
    });
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
