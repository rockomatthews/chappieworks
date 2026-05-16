"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "scribe-chat-v1";

const INTRO: Message = {
  role: "assistant",
  content:
    "Scribe here — part of the Chappie Studio team. Ask me about the free audits, agent builds, pricing, or anything you saw on the site. I'll keep it short.",
};

export function ScribeChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INTRO]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Message[];
        if (Array.isArray(saved) && saved.length > 0) setMessages(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/scribe/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m, i) => i !== 0 || m !== INTRO),
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      const reply =
        data.reply?.trim() ||
        data.error ||
        "Scribe didn't reply. Try again or email intake@chappieworks.com.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Connection blip — try again in a moment, or email intake@chappieworks.com.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  function reset() {
    setMessages([INTRO]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button
        aria-label={open ? "Close Scribe chat" : "Chat with Scribe"}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 w-16 h-16 rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
        style={{
          background: open ? "var(--color-ink)" : "var(--color-raven)",
          boxShadow:
            "0 12px 32px rgba(0,0,0,0.5), 0 0 0 2px var(--color-gold)",
        }}
      >
        {open ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <Image
            src="/profileShotScribe.png"
            alt="Scribe"
            width={64}
            height={64}
            priority
            className="object-cover w-full h-full"
          />
        )}
        {!open && (
          <span
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2"
            style={{
              background: "#22c55e",
              borderColor: "var(--color-ink)",
            }}
            aria-hidden="true"
          />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Scribe chat"
          className="fixed bottom-24 right-5 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-8rem))] rounded-xl flex flex-col overflow-hidden"
          style={{
            background: "var(--color-raven)",
            border: "1px solid rgba(201,164,55,0.25)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,164,55,0.18), rgba(201,164,55,0.04))",
              borderBottom: "1px solid rgba(201,164,55,0.18)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                style={{
                  boxShadow: "0 0 0 2px var(--color-gold)",
                }}
              >
                <Image
                  src="/profileShotScribe.png"
                  alt="Scribe"
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">
                  Scribe
                </div>
                <div
                  className="text-[10px] mono uppercase tracking-widest"
                  style={{ color: "var(--color-gold)" }}
                >
                  Chappie Studio · live
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              className="text-[11px] mono uppercase tracking-wider opacity-60 hover:opacity-100 transition"
              aria-label="Reset chat"
            >
              reset
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className="rounded-lg px-3 py-2 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap"
                  style={
                    m.role === "user"
                      ? {
                          background: "var(--color-gold)",
                          color: "var(--color-ink)",
                        }
                      : {
                          background: "rgba(255,255,255,0.06)",
                          color: "var(--color-paper)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "var(--color-mute)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span className="inline-block animate-pulse">
                    Scribe is typing…
                  </span>
                </div>
              </div>
            )}
          </div>

          <div
            className="p-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="flex gap-2 rounded-lg p-2"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about audits, builds, pricing…"
                rows={1}
                className="flex-1 bg-transparent border-0 outline-none resize-none text-sm placeholder:opacity-40 leading-relaxed"
                style={{
                  color: "var(--color-paper)",
                  maxHeight: 120,
                  minHeight: 24,
                }}
                disabled={sending}
              />
              <button
                onClick={() => void send()}
                disabled={sending || !input.trim()}
                aria-label="Send message"
                className="self-end px-3 py-1.5 rounded text-sm font-medium disabled:opacity-30 transition"
                style={{
                  background: "var(--color-gold)",
                  color: "var(--color-ink)",
                }}
              >
                Send
              </button>
            </div>
            <div
              className="mt-2 text-[10px] mono uppercase tracking-widest opacity-50 text-center"
              style={{ color: "var(--color-mute)" }}
            >
              Enter to send · Shift+Enter for newline
            </div>
          </div>
        </div>
      )}
    </>
  );
}
