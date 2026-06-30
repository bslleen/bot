import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../lib/api";

const ERROR_MESSAGE = "Oops, lost my train of thought. Try again?";

export default function ChatScreen({ languagePair, country, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const greeted = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    (async () => {
      setLoading(true);
      try {
        const reply = await sendChatMessage({
          languagePair,
          country: country.name,
          history: [],
          message: "Hi",
        });
        setMessages([{ role: "assistant", content: reply }]);
      } catch (e) {
        setMessages([{ role: "assistant", content: ERROR_MESSAGE }]);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const priorMessages = messages;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const reply = await sendChatMessage({
        languagePair,
        country: country.name,
        history: priorMessages,
        message: userMsg,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: ERROR_MESSAGE }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col bg-black animate-fade-in">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <button onClick={onBack} className="text-neutral-400 hover:text-white text-sm">
          ←
        </button>
        <div className="mx-auto flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-neutral-300">
          <span>{country.flag}</span>
          <span>{country.name}</span>
        </div>
        <div className="w-4" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
                P
              </div>
            )}
            <div
              className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-[15px] leading-snug ${
                msg.role === "user"
                  ? "rounded-br-sm bg-blue-600 text-white"
                  : "rounded-bl-sm bg-neutral-800 text-white"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
              P
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-neutral-800 px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-neutral-400"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="iMessage"
          className="flex-1 rounded-full border border-white/10 bg-neutral-900 px-4 py-2 text-[15px] text-white outline-none placeholder:text-neutral-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition ${
            input.trim() && !loading ? "bg-blue-600" : "bg-neutral-800"
          }`}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
