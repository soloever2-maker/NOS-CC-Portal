"use client";

import { useState, useEffect, useRef } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText, Upload, Trash2, Bot, Send, Sparkles,
  BookOpen, AlertCircle, CheckCircle, X, Loader2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Policy {
  id:         string;
  title:      string;
  file_name:  string | null;
  file_url:   string | null;
  created_at: string;
}
interface Message { role: "user" | "assistant"; text: string; }

// ─────────────────────────────────────────────────────────────────────────────

export default function PoliciesPage() {
  const [tab, setTab]             = useState<"library" | "ai">("library");
  const [policies, setPolicies]   = useState<Policy[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [isAdmin,  setIsAdmin]    = useState(false);

  // upload state
  const [uploading,     setUploading]     = useState(false);
  const [uploadTitle,   setUploadTitle]   = useState("");
  const [uploadFile,    setUploadFile]    = useState<File | null>(null);
  const [uploadContent, setUploadContent] = useState("");
  const [needsContent,  setNeedsContent]  = useState(false);
  const [uploadError,   setUploadError]   = useState("");
  const [uploadOk,      setUploadOk]      = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // AI state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/policies")
      .then(r => r.json())
      .then(d => { setPolicies(d.data ?? []); setLoading(false); });

    fetch("/api/users/me")
      .then(r => r.json())
      .then(d => {
        if (d.data?.role && ["ADMIN","SUPER_ADMIN","MANAGER"].includes(d.data.role)) setIsAdmin(true);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    setUploadError("");
    setUploadOk(false);

    const fd = new FormData();
    fd.append("file",    uploadFile);
    fd.append("title",   uploadTitle.trim());
    if (uploadContent.trim()) fd.append("content", uploadContent.trim());

    const res  = await fetch("/api/policies", { method: "POST", body: fd });
    const data = await res.json();

    if (data.needsContent) {
      setNeedsContent(true);
      setUploading(false);
      return;
    }
    if (!data.success) {
      setUploadError(data.error ?? "Upload failed");
      setUploading(false);
      return;
    }

    setPolicies(prev => [data.data, ...prev]);
    setUploadTitle("");
    setUploadFile(null);
    setUploadContent("");
    setNeedsContent(false);
    setUploadOk(true);
    if (fileRef.current) fileRef.current.value = "";
    setTimeout(() => setUploadOk(false), 3000);
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this policy?")) return;
    await fetch("/api/policies", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setPolicies(prev => prev.filter(p => p.id !== id));
  };

  // ── AI ──────────────────────────────────────────────────────────────────────
  const send = async (text: string) => {
    if (!text.trim() || aiLoading) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAiLoading(true);

    try {
      const res  = await fetch("/api/ai", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text.trim(), history: messages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.text ?? "No response." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Connection error. Please try again." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const SUGGESTIONS = [
    "ما هي سياسة التأخر في سداد الإيجار؟",
    "ما هي شروط إلغاء العقد؟",
    "ما حقوق العميل في حالة عيوب الوحدة؟",
    "كيف يتم التعامل مع شكاوى الصيانة؟",
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Policies & AI Advisor" subtitle="Company policies, contracts, and AI-powered answers" />

      {/* Tabs */}
      <div className="px-5 pt-4 flex gap-2">
        {(["library", "ai"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all"
            style={{
              background: tab === t ? "var(--gold-glow)" : "var(--black-800)",
              border:     tab === t ? "1px solid var(--gold-500)" : "1px solid var(--border)",
              color:      tab === t ? "var(--gold-400)" : "var(--text-muted)",
            }}>
            {t === "library" ? <><BookOpen className="w-4 h-4" /> Policy Library</> : <><Bot className="w-4 h-4" /> AI Advisor</>}
          </button>
        ))}
      </div>

      <div className="flex-1 p-5">

        {/* ── LIBRARY TAB ── */}
        {tab === "library" && (
          <div className="space-y-5 max-w-4xl">

            {/* Upload (admin only) */}
            {isAdmin && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>
                    UPLOAD POLICY DOCUMENT
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {uploadOk && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm"
                      style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
                      <CheckCircle className="w-4 h-4" /> Policy uploaded successfully
                    </div>
                  )}
                  {uploadError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                      <AlertCircle className="w-4 h-4" /> {uploadError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] mb-1.5 font-medium" style={{ color: "var(--text-muted)" }}>Policy Title *</p>
                      <input className="crm-input w-full h-9 text-sm px-3"
                        placeholder="e.g. Late Payment Policy"
                        value={uploadTitle}
                        onChange={e => setUploadTitle(e.target.value)} />
                    </div>
                    <div>
                      <p className="text-[11px] mb-1.5 font-medium" style={{ color: "var(--text-muted)" }}>File (PDF, Word, TXT) *</p>
                      <input ref={fileRef} type="file"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        className="crm-input w-full h-9 text-sm px-3 pt-1.5 cursor-pointer"
                        onChange={e => { setUploadFile(e.target.files?.[0] ?? null); setNeedsContent(false); setUploadError(""); }} />
                    </div>
                  </div>

                  {/* النص اليدوي — بيظهر لو PDF/Word */}
                  {(needsContent || uploadFile?.name.match(/\.(pdf|doc|docx)$/i)) && (
                    <div>
                      <p className="text-[11px] mb-1.5 font-medium" style={{ color: "var(--text-muted)" }}>
                        Document Text * <span className="font-normal">(paste the text content of the document so the AI can read it)</span>
                      </p>
                      <textarea className="crm-input w-full text-sm p-3 resize-none" rows={6}
                        placeholder="Paste the full text of the document here…"
                        value={uploadContent}
                        onChange={e => setUploadContent(e.target.value)} />
                    </div>
                  )}

                  <Button onClick={handleUpload}
                    disabled={!uploadFile || !uploadTitle.trim() || uploading}
                    loading={uploading}>
                    <Upload className="w-4 h-4" />
                    {uploading ? "Uploading…" : "Upload Policy"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Policies list */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>
                  POLICY LIBRARY ({policies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--gold-500)" }} />
                  </div>
                )}
                {!loading && policies.length === 0 && (
                  <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No policies uploaded yet</p>
                    {isAdmin && <p className="text-xs mt-1">Use the form above to upload your first policy</p>}
                  </div>
                )}
                <div className="space-y-2">
                  {policies.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-[10px]"
                      style={{ background: "var(--black-800)", border: "1px solid var(--border)" }}>
                      <FileText className="w-5 h-5 shrink-0" style={{ color: "var(--gold-500)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{p.title}</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {p.file_name} · {formatDateTime(p.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.file_url && (
                          <a href={p.file_url} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-[7px] text-xs font-medium transition-all"
                            style={{ background: "var(--black-700)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                            View
                          </a>
                        )}
                        {isAdmin && (
                          <button onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-[7px] transition-all"
                            style={{ color: "var(--text-muted)" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── AI TAB ── */}
        {tab === "ai" && (
          <div className="flex flex-col max-w-3xl" style={{ height: "calc(100vh - 180px)" }}>
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">

              {/* Welcome */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-5 pb-10">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "var(--gold-glow)", border: "1px solid var(--border-strong)" }}>
                    <Sparkles className="w-7 h-7" style={{ color: "var(--gold-500)" }} />
                  </div>
                  <div className="text-center">
                    <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>
                      Policy AI Advisor
                    </h2>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Ask anything about company policies, contracts, or client rights
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => send(s)}
                        className="px-4 py-3 rounded-[10px] text-sm text-right transition-all"
                        style={{ background: "var(--black-800)", border: "1px solid var(--border)", color: "var(--text-secondary)", direction: "rtl" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold-500)"; (e.currentTarget as HTMLElement).style.color = "var(--gold-400)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {policies.length === 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-xs"
                      style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "var(--warning)" }}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      No policies uploaded yet — answers will be based on CRM data only
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: m.role === "user" ? "var(--gold-glow)" : "var(--black-700)", border: "1px solid var(--border)" }}>
                    {m.role === "user"
                      ? <span className="text-xs font-bold" style={{ color: "var(--gold-500)" }}>أنا</span>
                      : <Bot className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />}
                  </div>
                  <div className={`max-w-[80%] px-4 py-3 rounded-[14px] text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "rounded-tr-[4px]" : "rounded-tl-[4px]"}`}
                    style={{
                      background: m.role === "user" ? "var(--gold-glow)" : "var(--black-800)",
                      border:     m.role === "user" ? "1px solid var(--border-strong)" : "1px solid var(--border)",
                      color:      m.role === "user" ? "var(--gold-400)" : "var(--text-primary)",
                      direction:  "rtl",
                    }}>
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Loading dots */}
              {aiLoading && (
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
            <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }}}
                  placeholder="اسأل عن أي سياسة أو عقد…"
                  rows={1}
                  className="flex-1 crm-input text-sm resize-none py-2.5 px-3"
                  style={{ direction: "rtl", minHeight: 42, maxHeight: 120 }}
                />
                <button onClick={() => send(input)} disabled={!input.trim() || aiLoading}
                  className="w-10 h-10 flex items-center justify-center rounded-[10px] shrink-0 transition-all"
                  style={{
                    background: input.trim() && !aiLoading ? "var(--gold-glow)" : "var(--black-700)",
                    border:     input.trim() && !aiLoading ? "1px solid var(--gold-500)" : "1px solid var(--border)",
                    color:      input.trim() && !aiLoading ? "var(--gold-500)" : "var(--text-muted)",
                  }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
