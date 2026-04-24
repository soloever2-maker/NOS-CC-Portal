"use client";

import { useState, useRef, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Send, Bot, User, Sparkles, TrendingUp, AlertTriangle, Users, Lightbulb } from "lucide-react";

interface Message { role: "user" | "assistant"; text: string; }

const SUGGESTIONS = [
  { icon: TrendingUp,    text: "إيه المشاكل المتكررة عندي دلوقتي؟" },
  { icon: AlertTriangle, text: "فيه تيكتس متأخرة محتاجة attention فوري؟" },
  { icon: Users,         text: "إيه أداء الأجنتس وعندهم مشاكل فين؟" },
  { icon: Lightbulb,     text: "إيه توصياتك عشان أحسن الخدمة؟" },
];

export default function AIPage() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input,    setInput]      = useState("");
  const [loading,  setLoading]    = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res  = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.text ?? "عذراً، حدث خطأ." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "عذراً، حدث خطأ في الاتصال." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen animate-fade-in">
      <Topbar title="AI Assistant" subtitle="تحليل ذكي لبيانات الـ CRM" />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Welcome screen */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-20">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "var(--gold-glow)", border: "1px solid var(--border-strong)" }}>
              <Sparkles className="w-8 h-8" style={{ color: "var(--gold-500)" }} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>
                مساعد الـ CRM الذكي
              </h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                بيشوف بياناتك الحية ويحللها ويقولك كل حاجة
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s.text)}
                  className="flex items-center gap-3 p-3 rounded-[12px] text-right transition-all"
                  style={{ background: "var(--black-800)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-500)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--gold-400)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}>
                  <s.icon className="w-4 h-4 shrink-0" style={{ color: "var(--gold-500)" }} />
                  <span className="text-sm">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: m.role === "user" ? "var(--gold-glow)" : "var(--black-700)", border: "1px solid var(--border)" }}>
              {m.role === "user"
                ? <User className="w-4 h-4" style={{ color: "var(--gold-500)" }} />
                : <Bot  className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-[14px] text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "rounded-tr-[4px]" : "rounded-tl-[4px]"}`}
              style={{
                background:  m.role === "user" ? "var(--gold-glow)" : "var(--black-800)",
                border:      m.role === "user" ? "1px solid var(--border-strong)" : "1px solid var(--border)",
                color:       m.role === "user" ? "var(--gold-400)" : "var(--text-primary)",
                direction:   "rtl",
              }}>
              {m.text}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--black-700)", border: "1px solid var(--border)" }}>
              <Bot className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </div>
            <div className="px-4 py-3 rounded-[14px] rounded-tl-[4px]"
              style={{ background: "var(--black-800)", border: "1px solid var(--border)" }}>
              <div className="flex gap-1 items-center h-5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: "var(--gold-500)", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: "var(--border)", background: "var(--black-900)" }}>
        <div className="flex gap-2 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اسأل عن أي حاجة في الـ CRM…"
            rows={1}
            className="flex-1 crm-input text-sm resize-none py-2.5 px-3"
            style={{ direction: "rtl", minHeight: 42, maxHeight: 120 }}
          />
          <button onClick={() => send(input)} disabled={!input.trim() || loading}
            className="w-10 h-10 flex items-center justify-center rounded-[10px] shrink-0 transition-all"
            style={{
              background: input.trim() && !loading ? "var(--gold-glow)" : "var(--black-700)",
              border:     input.trim() && !loading ? "1px solid var(--gold-500)" : "1px solid var(--border)",
              color:      input.trim() && !loading ? "var(--gold-500)" : "var(--text-muted)",
            }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
          Enter للإرسال · Shift+Enter لسطر جديد
        </p>
      </div>
    </div>
  );
}
