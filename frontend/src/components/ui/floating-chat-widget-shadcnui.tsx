"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Bot,
  Loader2,
  MessageSquare,
  Send,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

const QUICK_PROMPTS = [
  "What services does BOCRA regulate?",
  "How do I contact BOCRA?",
  "How do I submit a complaint?",
];

const OPEN_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.96,
    transformOrigin: "bottom right",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 24,
      stiffness: 260,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: 18,
    scale: 0.97,
    transition: { duration: 0.18 },
  },
};

const MESSAGE_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 420, damping: 28 },
  },
};

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content:
        "Dumela. I am the BOCRA smart assistant. Ask me about licensing, complaints, tariffs, or BOCRA services and I will guide you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading, isOpen]);

  async function sendMessage(rawMessage?: string) {
    const content = (rawMessage ?? input).trim();
    if (!content || isLoading) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorPayload?.error || "Failed to fetch assistant response",
        );
      }

      const data = await res.json();
      const reply =
        typeof data?.reply === "string" && data.reply.trim()
          ? data.reply
          : "I could not generate a response just now. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-bot`,
          role: "bot",
          content: reply,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: "bot",
          content:
            error instanceof Error
              ? error.message
              : "I hit a network error. Please try again shortly.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-4 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="floating-chat-window"
            variants={OPEN_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-[min(88vw,21rem)] overflow-hidden rounded-[2rem] border border-white/55 bg-white/88 shadow-[0_28px_80px_-24px_rgba(6,25,62,0.55)] backdrop-blur-2xl"
          >
            <div className="relative overflow-hidden border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(117,170,219,0.45),_transparent_42%),linear-gradient(135deg,_rgba(6,25,62,0.98),_rgba(2,122,198,0.95))] p-5 text-white">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-[#D4921A]/15 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] border border-white/15 bg-white/12 shadow-lg shadow-black/10 backdrop-blur-md">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold tracking-tight">
                        BOCRA Assistant
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/16 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        Online
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/90 transition-colors hover:bg-white/20"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex justify-start">
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-3 py-2 text-[11px] text-blue-50/90">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  BOCRA guidance
                </div>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex h-[18rem] flex-col gap-4 overflow-y-auto bg-[linear-gradient(180deg,_rgba(250,252,255,0.96),_rgba(237,245,255,0.76))] px-4 py-5"
            >
              {messages.map((message) => {
                const isUser = message.role === "user";
                const isWelcome = message.id === "welcome" && !isUser;

                if (isUser) {
                  return (
                    <motion.div
                      key={message.id}
                      variants={MESSAGE_VARIANTS}
                      initial="hidden"
                      animate="visible"
                      className="flex items-end justify-end gap-3"
                    >
                      <div className="max-w-[82%] rounded-[1.5rem] rounded-br-md bg-[#027ac6] px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                        {message.content}
                      </div>

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                        <User className="h-4 w-4 text-[#027ac6]" />
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={message.id}
                    variants={MESSAGE_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col items-start gap-3"
                  >
                    <div className="flex items-end gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#75AADB]/20 bg-white shadow-sm">
                        <Bot className="h-4 w-4 text-[#06193e]" />
                      </div>

                      <div className="max-w-[82%] rounded-[1.5rem] rounded-bl-md border border-slate-200/80 bg-white/92 px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
                        {message.content}
                      </div>
                    </div>

                    {isWelcome && (
                      <div className="ml-12 flex flex-wrap gap-2">
                        {QUICK_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => void sendMessage(prompt)}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#75AADB] hover:bg-[#75AADB]/10 hover:text-[#06193e]"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#75AADB]/20 bg-white shadow-sm">
                    <Bot className="h-4 w-4 text-[#06193e]" />
                  </div>
                  <div className="flex items-center gap-2 rounded-[1.5rem] rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-slate-500 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-[#027ac6]" />
                    <span className="text-sm">Thinking…</span>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="border-t border-slate-200/70 bg-white/88 p-4 backdrop-blur-xl">
              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <label className="sr-only" htmlFor="bocra-chat-input">
                  Message BOCRA Assistant
                </label>
                <input
                  id="bocra-chat-input"
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask BOCRA anything..."
                  className="h-12 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#027ac6]/40 focus:bg-white focus:ring-4 focus:ring-[#027ac6]/10"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-all",
                    !input.trim() || isLoading
                      ? "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none"
                      : "bg-[#06193e] hover:-translate-y-0.5 hover:bg-[#027ac6] hover:shadow-[0_12px_28px_-14px_rgba(2,122,198,0.75)]",
                  )}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-slate-400">
                <span>Powered by AfroNative Solutions</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "group relative flex h-16 w-16 items-center justify-center rounded-full border border-white/20 shadow-[0_22px_55px_-18px_rgba(6,25,62,0.65)] transition-all duration-300",
          isOpen
            ? "bg-[#872030] text-white"
            : "bg-[linear-gradient(135deg,_#06193e,_#027ac6)] text-white",
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <span className="absolute inset-0 -z-10 rounded-full bg-inherit opacity-25 blur-2xl transition-opacity duration-300 group-hover:opacity-45" />
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  );
}
