const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/chat";

export async function sendChatMessage({ languagePair, country, history, message }) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language_pair: languagePair,
      country,
      history: history.slice(-6),
      message,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data.reply;
}
