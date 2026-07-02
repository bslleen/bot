const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/chat";

export async function sendChatMessage({ languagePair, country, history, message }) {
  console.log("[api] history length:", history.length, "| history:", history);
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language_pair: languagePair,
      country,
      history,
      message,
    }),
  });
  const data = await res.json();
  // Rate-limit and retry-exhausted responses carry an in-character `reply`
  // even on a non-2xx status (429) — treat those as normal bot messages
  // rather than routing them through the generic error path.
  if (data.reply) {
    return data.reply;
  }
  throw new Error(data.error || `HTTP ${res.status}`);
}
