"use client";

import { useState } from "react";
import { Send, Bot, User, Loader2, X, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      content: "Dumela! Supported by Vertex AI, I am your BOCRA smart assistant. How can I help you regarding licensing, complaints, or telecom tariffs today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { id: Date.now().toString(), role: "bot", content: data.reply }]);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "bot", content: "I encountered a network error. Ensure the FastAPI backend is running on port 8000." },
      ]);
    }

    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-[#027ac6] text-white rounded-2xl flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(2,122,198,0.8)] hover:scale-105 transition-all z-50 group"
        >
          <MessageSquare className="w-8 h-8 group-hover:hidden" />
          <Bot className="w-8 h-8 hidden group-hover:block animate-bounce" />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[85vh] bg-white rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col border border-gray-100 z-50"
          >
            {/* Header */}
            <div className="bg-[#06193e] p-5 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">BOCRA Assistant</h3>
                  <p className="text-xs text-blue-200 flex items-center gap-1.5 font-medium mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FAFCFF]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "bot" && (
                    <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-[#06193e]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] p-3.5 text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-[#027ac6] text-white rounded-2xl rounded-br-sm"
                        : "bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start gap-2 items-end">
                  <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-[#06193e]" />
                  </div>
                  <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-sm flex gap-1 items-center shadow-sm">
                    <div className="w-1.5 h-1.5 bg-[#027ac6] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#027ac6] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#027ac6] rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask me about licensing..."
                  className="w-full bg-gray-50 border border-gray-200 focus:border-[#06193e] focus:ring-2 focus:ring-[#06193e]/10 focus:bg-white rounded-xl pl-4 pr-12 py-3.5 text-sm transition-all outline-none text-gray-800"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 bg-[#027ac6] hover:bg-[#005ea6] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 text-center">
                <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
                  Powered by Vertex AI
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
