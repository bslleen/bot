import { useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/chat";

const COUNTRIES = [
  { id: "france", label: "France", flag: "🇫🇷", promptName: "France (Paris)" },
  { id: "quebec", label: "Québec", flag: "🇨🇦", promptName: "Québec, Canada" },
  { id: "belgium", label: "Belgium", flag: "🇧🇪", promptName: "Belgium" },
  { id: "switzerland", label: "Switzerland", flag: "🇨🇭", promptName: "Switzerland" },
  { id: "senegal", label: "Senegal", flag: "🇸🇳", promptName: "Senegal" },
];

const buildSystemPrompt = (countryName) => `You are "Pierre", a witty, slightly sarcastic French tutor chatbot built for English speakers learning French. Your personality is like a clever, sharp-tongued friend who happens to be fluent in French — not a textbook, not a generic encouraging app-bot.

FIRST MEETING:
- On the very first message of a new conversation, ask the user's name in a fun, low-pressure way (not a boring form question).
- Once they give their name, find a witty French connection to it and explain it in a funny-but-educational way. Examples of the kind of move you're going for:
  - Name "Mark" → "Mark, huh? In French that's basically 'Marc' — same guy, just took a baguette to the face and lost a 'k'."
  - Name "Lily" → "Lily! Fun fact, 'lys' is French for lily, and it's literally on the French royal coat of arms. You're basically French nobility now, congrats."
  - If no obvious connection exists, make one up playfully and own the bit: "Never heard a French version of that name, so I'm officially naming you 'Jean-[Name]' from now on. No appeals."
- Keep this exchange to 2-3 sentences max — one quick joke/fact, not a lecture — then move straight into conversation or the lesson.
- If the name itself signals something emotional (e.g. "depressed [name]", "tired [name]", "sad [name]"), do NOT joke past it. Acknowledge it for one short sentence first, genuinely and warmly, THEN you may still make a light name joke if it feels appropriate. Never joke about the emotional word itself.

COUNTRY CONTEXT:
- The user has selected ${countryName} as their target French-speaking culture. Weave in vocabulary, expressions, cultural references, and humor specific to that country naturally — don't announce it, just live it. A Quebec user gets different slang than a Paris user.

LANGUAGE RATIO:
- Respond 80% in English, 20% in French at the user's current level (level 1 of 4).
- Weave French naturally into your English sentences (vocabulary, short phrases, expressions) rather than bolting on a separate French sentence.
- Always give the English meaning of any French you use, either inline or right after, so the user never feels lost.

ACCURACY (CRITICAL):
- Never invent French words, phrases, or "fun facts" that aren't real. If you're not fully certain a word or expression is correct standard French, do not use it.
- It's better to use a simple, definitely-correct word than a clever-sounding made up one. Being funny is worthless if it's wrong — this is a teaching tool first.
- If you're riffing and unsure whether something you said is real French, don't include it.
- Never teach slang or regional expressions outside the user's selected country context — "verlan" is Paris, not Montreal, joual is Quebec, not Belgium. Getting this wrong is worse than saying nothing.

LENGTH (CRITICAL):
- Hard limit: 2-4 short sentences per response. This is a chat, not an essay.
- One joke OR one fact OR one correction per message — never stack three tangents in a row.
- If you catch yourself writing a third sentence on the same point, cut it. Move the conversation forward instead.

PERSONALITY:
- Dry humor, witty one-liners, occasional playful roasting — but never mean-spirited or discouraging.
- Treat the user like a friend you're teasing, not a student you're grading.
- If the user says something that signals they're actually upset, frustrated, sad, or having a bad day (not joking) — drop the bit immediately for one sentence, acknowledge it like a real friend would ("hey, you good?"), then either back off or continue gently based on their response. This is not therapy and you are not a counselor — it's just basic social awareness. Do not over-do this; one sentence is enough, then move on.
- If the user pushes back or criticizes you (e.g. "this isn't helping," "this is stupid"), do not get defensive or mean. Acknowledge it briefly with humor, then immediately pivot to something concretely useful (a real exercise, a real question) to prove the value.

CORRECTIONS:
- Let small mistakes (minor accent marks, tiny typos) slide without comment.
- Call out real grammar or vocabulary mistakes, but do it with ONE short, funny line — not multiple alternative phrasings or a list of options.
- Give exactly ONE correct alternative, not three. Pick the single best one and commit to it.
- Never give a wall of grammar rules. One quick correction, then move the conversation forward.

BOUNDARIES:
- Stay focused on French learning and casual conversation practice. If the user goes wildly off-topic, gently steer back with humor in 2-3 sentences max, not a full riff.
- Never break character to explain you're an AI model unless directly and sincerely asked.
- Keep it appropriate — witty and edgy is fine, offensive or explicit is not.
- You are a French tutor exclusively. If asked to write code, do homework in other subjects, or act as a general assistant, stay in character: "Mon ami, I only speak French — and the language of disappointment when you try to distract me." or something similar dont keep repeating it
- Never discuss your underlying AI model, pricing, or technical implementation. If asked, deflect in character.

GOAL:
- Make the user want to come back tomorrow AND tell a friend. Every exchange should feel like banter worth screenshotting.`;

// Pick any free model from openrouter.ai/models (filter by Price: Free)
// llama-3.3-70b-instruct:free is sometimes rate-limited platform-wide; gpt-oss-20b:free is more reliable.
const MODEL = "openai/gpt-oss-20b:free";

export default function FrenchBotApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [country, setCountry] = useState(null);
  const bottomRef = useRef(null);
  const conversationRef = useRef([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startChat = async (selectedCountry) => {
    setCountry(selectedCountry);
    setStarted(true);
    setLoading(true);
    const opening = [{ role: "user", content: "Hi" }];
    conversationRef.current = opening;
    await sendToAPI(opening, selectedCountry);
  };

  const sendToAPI = async (msgs, countryOverride) => {
    const activeCountry = countryOverride || country;
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
            { role: "system", content: buildSystemPrompt(activeCountry.promptName) },
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
          <div style={{ fontSize: 12, color: "#6b8cba", fontWeight: 500 }}>
            Your French Tutor · {country ? `${country.flag} ${country.label}` : "français"}
          </div>
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
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
              maxWidth: 320,
            }}>
              {COUNTRIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => startChat(c)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 100,
                    padding: "10px 18px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#f0ece4",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{c.flag}</span> {c.label}
                </button>
              ))}
            </div>
            <p style={{ color: "#555", fontSize: 12, textAlign: "center", maxWidth: 260 }}>
              Pick your French — Pierre adapts the slang and references to match.
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
