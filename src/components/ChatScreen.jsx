import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../lib/api";
import { loadHistory, saveHistory } from "../lib/storage";
import { addXp, recordStreak } from "../lib/gamification";

const XP_PER_EXCHANGE = 10;
const ERROR_MESSAGE = "Oops, lost my train of thought. Try again?";
const MAX_TEXTAREA_HEIGHT_PX = 112; // ~4 lines before the textarea scrolls internally

function formatTime(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function PierreAvatar({ pulsing = false }) {
  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 p-[1.5px] shadow-[0_0_10px_rgba(139,92,246,0.4)] ${
        pulsing ? "animate-pulse-glow" : ""
      }`}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0d1326] text-[11px] font-bold text-white/90">
        P
      </div>
    </div>
  );
}

export default function ChatScreen({ languagePair, country, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const greeted = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // recordStreak() is idempotent within a calendar day, so calling it
  // unconditionally on every mount is safe even if ChatScreen mounts more
  // than once in a session (e.g. navigating away and back via the tab bar).
  useEffect(() => {
    recordStreak();
  }, []);

  // Auto-resize the textarea to fit content, capped at MAX_TEXTAREA_HEIGHT_PX —
  // beyond that it scrolls internally instead of growing further.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  }, [input]);

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;

    // Rehydrate from localStorage first — history previously lived only in
    // this component's state, so a page refresh or navigating back to the
    // country picker and returning (which unmounts/remounts ChatScreen)
    // wiped everything, including any name the user had already given.
    const saved = loadHistory(languagePair, country.name);
    if (saved && saved.length > 0) {
      setMessages(saved);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const reply = await sendChatMessage({
          languagePair,
          country: country.name,
          history: [],
          message: "Hi",
        });
        // Include the hidden "Hi" turn so Claude always sees a valid
        // user-first conversation history on subsequent messages.
        setMessages([
          { role: "user", content: "Hi", hidden: true, timestamp: Date.now() },
          { role: "assistant", content: reply, timestamp: Date.now() },
        ]);
        addXp(XP_PER_EXCHANGE, "chat");
      } catch (e) {
        setMessages([{ role: "assistant", content: ERROR_MESSAGE, timestamp: Date.now() }]);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      saveHistory(languagePair, country.name, messages);
    }
  }, [messages, languagePair, country.name]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const priorMessages = messages;
    setMessages((prev) => [...prev, { role: "user", content: userMsg, timestamp: Date.now() }]);
    setLoading(true);
    console.log("[chat] sending history:", priorMessages, "| message:", userMsg);
    try {
      const reply = await sendChatMessage({
        languagePair,
        country: country.name,
        history: priorMessages,
        message: userMsg,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: reply, timestamp: Date.now() }]);
      addXp(XP_PER_EXCHANGE, "chat");
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: ERROR_MESSAGE, timestamp: Date.now() }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter falls through to the textarea's default newline behavior.
  };

  return (
    <div className="chat-bg relative flex h-full flex-col overflow-hidden animate-fade-in">
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3 backdrop-blur-xl">
        <button
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
          aria-label="Back"
        >
          ←
        </button>
        <div className="mx-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-neutral-200 shadow-[0_0_20px_rgba(99,102,241,0.12)] backdrop-blur-md">
          <span className="text-sm">{country.flag}</span>
          <span>{country.name}</span>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.filter((msg) => !msg.hidden).map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 animate-fade-in ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && <PierreAvatar />}
            <div className="flex max-w-[78%] flex-col gap-1">
              <div
                className={`whitespace-pre-wrap px-4 py-2.5 text-[15px] leading-snug ${
                  msg.role === "user"
                    ? "rounded-[18px] rounded-br-md bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-[0_0_18px_rgba(139,92,246,0.3)]"
                    : "rounded-[18px] rounded-bl-md border border-white/10 bg-white/[0.06] text-white/95 shadow-[0_0_14px_rgba(59,130,246,0.06)] backdrop-blur-xl"
                }`}
              >
                {msg.content}
              </div>
              {formatTime(msg.timestamp) && (
                <span
                  className={`px-1 text-[10px] text-neutral-500 ${
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2 animate-fade-in">
            <PierreAvatar pulsing />
            <div className="flex items-center gap-1 rounded-[18px] rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xl">
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

      <div className="flex items-end gap-2 border-t border-white/10 bg-white/[0.02] px-4 py-3 backdrop-blur-xl">
        <div className="flex flex-1 items-end rounded-[22px] border border-white/10 bg-white/5 px-4 py-2.5 shadow-[0_0_16px_rgba(99,102,241,0.08)] backdrop-blur-md">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="iMessage"
            className="max-h-[112px] w-full resize-none overflow-y-auto bg-transparent text-[15px] text-white outline-none placeholder:text-neutral-500"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          aria-label="Send"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition active:scale-90 ${
            input.trim() && !loading
              ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_16px_rgba(139,92,246,0.5)]"
              : "bg-white/10"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4 12L20 4L14 20L11 13L4 12Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
