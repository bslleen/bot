import { useState, useRef, useEffect } from "react";

const API_URL = "http://localhost:3001/api/chat";

const SYSTEM_PROMPT = `You are "Pierre", a witty, slightly sarcastic French tutor for English speakers learning French. You're like a clever, sharp-tongued friend who's fluent in French — not a textbook, not a generic cheerful app-bot.

CORE RULE: Accuracy first, jokes second. Never invent French words or phrases. If you're not 100% sure something is real, correct French, don't say it. A boring correct answer beats a funny wrong one, always.

LENGTH: Max 1-2 short sentences per reply, under 25 words total. Never more. This is a text chat, not an essay — if you can cut a clause, cut it.

LANGUAGE RATIO: If the user is writing in English, respond roughly 80% English / 20% French — weave real French words or short phrases naturally into your English sentence, and always give the English meaning right after (inline or in parentheses) so they're never lost. If the user writes to you in French, drop the ratio and just reply in French at their level, correcting gently per the rules below.

FIRST MESSAGE: Ask for their name in a fun way. Once they answer, make ONE quick witty French connection to it (real connection only, or honestly say there isn't one and invent a nickname instead, but be upfront it's made up). Then move on immediately.

IF THE NAME OR MESSAGE SOUNDS GENUINELY SAD OR DOWN (not joking): Drop the bit for one sentence, say something simple and warm, then gently continue. Don't dwell on it.

IF THEY MAKE A REAL FRENCH MISTAKE: Point it out with one short funny line and give exactly one correct way to say it. Don't list alternatives. Don't skip it just because the mood is soft — still correct gently.

IF THEY GO OFF TOPIC: One short funny redirect back to French. Don't follow the tangent.

IF THEY PUSH BACK OR SAY THIS ISN'T HELPING: Acknowledge briefly, no defensiveness, then immediately give them one real, useful thing (a question or mini exercise) to prove value.

TONE: Dry humor, playful teasing, never mean, never a lecture. Talk like a witty friend, not a teacher.

GOAL: Make them want to come back tomorrow.`;

// Pick any free model from openrouter.ai/models (filter by Price: Free)
// llama-3.3-70b-instruct:free is sometimes rate-limited platform-wide; gpt-oss-20b:free is more reliable.
const MODEL = "openai/gpt-oss-20b:free";

export default function FrenchBotApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);
  const conversationRef = useRef([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startChat = async () => {
    setStarted(true);
    setLoading(true);
    const opening = [{ role: "user", content: "Hi" }];
    conversationRef.current = opening;
    await sendToAPI(opening);
  };

  const sendToAPI = async (msgs) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1000,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...msgs,
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const reason = data.error?.message || `HTTP ${res.status}`;
        setMessages((prev) => [...prev, { role: "assistant", content: `(Pierre's stuck: ${reason})` }]);
        setLoading(false);
        return;
      }
      const reply = data.choices?.[0]?.message?.content || "...";
      conversationRef.current = [...msgs, { role: "assistant", content: reply }];
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Oops, something went wrong. Try again!" }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    const updated = [...conversationRef.current, { role: "user", content: userMsg }];
    conversationRef.current = updated;
    await sendToAPI(updated);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #12101a 50%, #0d1117 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#f0ece4",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 480,
        padding: "20px 20px 0",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #4a6fa5, #6b8cba)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          flexShrink: 0,
        }}>🥖</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>Pierre</div>
          <div style={{ fontSize: 12, color: "#6b8cba", fontWeight: 500 }}>Your French Tutor · français</div>
        </div>
        <div style={{
          marginLeft: "auto",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: started ? "#4ade80" : "#666",
          boxShadow: started ? "0 0 8px #4ade80" : "none",
        }} />
      </div>

      <div style={{
        width: "100%",
        maxWidth: 480,
        flex: 1,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflowY: "auto",
        minHeight: 0,
      }}>
        {!started && (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            paddingTop: 60,
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🇫🇷</div>
              <h1 style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.8px",
                margin: "0 0 8px",
                background: "linear-gradient(135deg, #f0ece4, #4a6fa5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>Apprends le Français</h1>
              <p style={{ color: "#888", fontSize: 15, margin: 0, lineHeight: 1.5 }}>
                Real conversations. No boring lessons. Just French.
                <br />And a little roasting along the way 😏
              </p>
            </div>
            <button
              onClick={startChat}
              style={{
                background: "linear-gradient(135deg, #4a6fa5, #6b8cba)",
                border: "none",
                borderRadius: 100,
                padding: "14px 36px",
                fontSize: 16,
                fontWeight: 700,
                color: "#0a0a0f",
                cursor: "pointer",
                letterSpacing: "-0.2px",
              }}
            >
              Start talking →
            </button>
            <p style={{ color: "#555", fontSize: 12, textAlign: "center", maxWidth: 260 }}>
              No forms. No levels to pick. Pierre figures you out himself.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            alignItems: "flex-end",
            gap: 8,
          }}>
            {msg.role === "assistant" && (
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4a6fa5, #6b8cba)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}>🥖</div>
            )}
            <div style={{
              maxWidth: "78%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #4a6fa5, #6b8cba)"
                : "rgba(255,255,255,0.06)",
              color: msg.role === "user" ? "#0a0a0f" : "#f0ece4",
              fontSize: 14,
              lineHeight: 1.6,
              fontWeight: msg.role === "user" ? 600 : 400,
              border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none",
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #4a6fa5, #6b8cba)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>🥖</div>
            <div style={{
              padding: "12px 16px",
              borderRadius: "18px 18px 18px 4px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", gap: 4, alignItems: "center",
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#4a6fa5",
                  animation: "bounce 1.2s infinite",
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {started && (
        <div style={{
          width: "100%",
          maxWidth: 480,
          padding: "12px 20px 24px",
          display: "flex",
          gap: 10,
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type in English..."
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 100,
              padding: "12px 18px",
              fontSize: 14,
              color: "#f0ece4",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: input.trim() && !loading
                ? "linear-gradient(135deg, #4a6fa5, #6b8cba)"
                : "rgba(255,255,255,0.08)",
              border: "none",
              cursor: input.trim() && !loading ? "pointer" : "default",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.2s",
            }}
          >→</button>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(200,135,58,0.3); border-radius: 2px; }
      `}</style>
    </div>
  );
}
