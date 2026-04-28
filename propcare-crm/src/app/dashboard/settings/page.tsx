"use client";

import { useState, useEffect } from "react";
import { User, Bell, Shield, Users, Save, Send, AlertCircle, CheckCircle } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/form-elements";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";

const SECTIONS = [
  { id: "profile",       label: "Profile",       icon: User   },
  { id: "invite",        label: "Invite User",   icon: Users  },
  { id: "notifications", label: "Notifications", icon: Bell   },
  { id: "security",      label: "Security",      icon: Shield },
];

const NOTIF_EVENTS = [
  { key: "ticket_assigned", label: "Ticket assigned to me"  },
  { key: "ticket_status",   label: "Ticket status changes"  },
  { key: "new_comments",    label: "New comments"           },
  { key: "mentions",        label: "Mentions"               },
  { key: "system",          label: "System announcements"   },
];

type NotifPrefs = Record<string, { email: boolean; inapp: boolean }>;

const DEFAULT_PREFS: NotifPrefs = {
  ticket_assigned: { email: true, inapp: true },
  ticket_status:   { email: true, inapp: true },
  new_comments:    { email: true, inapp: true },
  mentions:        { email: true, inapp: true },
  system:          { email: true, inapp: true },
};

export default function SettingsPage() {
  const [section,  setSection]  = useState("profile");
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState<"success" | "error" | null>(null);
  const [userRole, setUserRole] = useState("");

  const [profile, setProfile] = useState({
    id: "", name: "", email: "", phone: "", department: "",
  });

  // Invite
  const [inviteEmail,  setInviteEmail]  = useState("");
  const [inviteName,   setInviteName]   = useState("");
  const [inviteRole,   setInviteRole]   = useState("AGENT");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [inviteError,  setInviteError]  = useState("");

  // Security
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus,  setPasswordStatus]  = useState<"idle" | "loading" | "success" | "error">("idle");

  // Notification prefs
  const [prefs,       setPrefs]       = useState<NotifPrefs>(DEFAULT_PREFS);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMsg,    setPrefsMsg]    = useState<"success" | "error" | null>(null);

  // ── Load current user ──────────────────────────────
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await sb.from("users")
        .select("id, name, email, phone, department, role, notification_prefs")
        .eq("supabase_id", user.id)
        .single();
      if (data) {
        setProfile({ id: data.id, name: data.name ?? "", email: data.email ?? "", phone: data.phone ?? "", department: data.department ?? "" });
        setUserRole(data.role ?? "");
        if (data.notification_prefs) {
          setPrefs({ ...DEFAULT_PREFS, ...data.notification_prefs });
        }
      }
    });
  }, []);

  // ── Save profile ───────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profile.id) return;
    setSaving(true); setSaveMsg(null);
    try {
      const { error } = await createClient().from("users").update({
        name: profile.name, phone: profile.phone || null, department: profile.department || null,
      }).eq("id", profile.id);
      if (error) throw error;
      setSaveMsg("success");
    } catch { setSaveMsg("error"); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(null), 3000); }
  };

  // ── Save notification prefs ────────────────────────
  const handleSavePrefs = async () => {
    if (!profile.id) return;
    setPrefsSaving(true); setPrefsMsg(null);
    try {
      const { error } = await createClient().from("users")
        .update({ notification_prefs: prefs }).eq("id", profile.id);
      if (error) throw error;
      setPrefsMsg("success");
    } catch { setPrefsMsg("error"); }
    finally { setPrefsSaving(false); setTimeout(() => setPrefsMsg(null), 3000); }
  };

  const togglePref = (key: string, channel: "email" | "inapp") => {
    setPrefs(p => ({ ...p, [key]: { ...p[key], [channel]: !p[key]?.[channel] } }));
  };

  // ── Invite ─────────────────────────────────────────
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus("loading"); setInviteError("");
    if (!inviteEmail.endsWith("@nationsofsky.com")) {
      setInviteError("Only @nationsofsky.com emails are allowed");
      setInviteStatus("error"); return;
    }
    try {
      const res  = await fetch("/api/auth/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setInviteStatus("success");
      setInviteEmail(""); setInviteName("");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite");
      setInviteStatus("error");
    }
  };

  // ── Change password ────────────────────────────────
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8 || newPassword !== confirmPassword) { setPasswordStatus("error"); return; }
    setPasswordStatus("loading");
    try {
      const { error } = await createClient().auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordStatus("success");
      setNewPassword(""); setConfirmPassword("");
      setTimeout(() => setPasswordStatus("idle"), 3000);
    } catch { setPasswordStatus("error"); }
  };

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Settings" subtitle="Manage your account and preferences" />
      <div className="flex-1 p-6">
        <div className="flex gap-6 max-w-4xl">

          {/* Sidebar */}
          <div className="w-48 shrink-0">
            <nav className="space-y-0.5">
              {SECTIONS.filter(s => s.id !== "invite" || isAdmin).map(s => (
                <button key={s.id} onClick={() => setSection(s.id)} className="nav-item w-full"
                  style={{ background: section === s.id ? "rgba(201,168,76,0.2)" : "transparent", color: section === s.id ? "var(--gold-500)" : "var(--text-secondary)", border: section === s.id ? "0.5px solid var(--gold-500)" : "0.5px solid transparent" }}>
                  <s.icon className="w-4 h-4" />{s.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 space-y-4">

            {/* ── Profile ── */}
            {section === "profile" && (<>
              <Card>
                <CardHeader><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>PROFILE INFORMATION</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="text-base font-bold" style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>{getInitials(profile.name || "?")}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{profile.name || "—"}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{userRole?.replace("_", " ")}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="mb-1.5 block">Full Name</Label><Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your name" /></div>
                    <div><Label className="mb-1.5 block">Email</Label><Input value={profile.email} disabled style={{ opacity: 0.5 }} /><p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>Email cannot be changed</p></div>
                    <div><Label className="mb-1.5 block">Phone</Label><Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+20 10 0000 0000" /></div>
                    <div><Label className="mb-1.5 block">Department</Label><Input value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))} placeholder="Customer Care" /></div>
                  </div>
                </CardContent>
              </Card>
              {saveMsg === "success" && <div className="flex items-center gap-2 p-3 rounded-[8px] text-sm" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--success)" }}><CheckCircle className="w-4 h-4" /> Profile saved successfully</div>}
              {saveMsg === "error"   && <div className="flex items-center gap-2 p-3 rounded-[8px] text-sm" style={{ background: "rgba(239,68,68,0.1)",  border: "1px solid rgba(239,68,68,0.3)",  color: "var(--danger)"  }}><AlertCircle className="w-4 h-4" /> Failed to save profile</div>}
              <Button onClick={handleSaveProfile} loading={saving}><Save className="w-4 h-4" />{saving ? "Saving…" : "Save Changes"}</Button>
            </>)}

            {/* ── Invite ── */}
            {section === "invite" && isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>INVITE NEW USER</CardTitle>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Only <span style={{ color: "var(--gold-400)" }}>@nationsofsky.com</span> emails are allowed.</p>
                </CardHeader>
                <CardContent>
                  {inviteStatus === "success" && <div className="flex items-center gap-2 p-3 rounded-[8px] mb-4 text-sm" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--success)" }}><CheckCircle className="w-4 h-4 shrink-0" /> Invite sent successfully!</div>}
                  {inviteStatus === "error" && inviteError && <div className="flex items-center gap-2 p-3 rounded-[8px] mb-4 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}><AlertCircle className="w-4 h-4 shrink-0" /> {inviteError}</div>}
                  <form onSubmit={handleInvite} className="space-y-3">
                    <div><Label className="mb-1.5 block">Full Name *</Label><Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Ahmed Mohamed" required /></div>
                    <div><Label className="mb-1.5 block">Email Address *</Label><Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="ahmed@nationsofsky.com" required /></div>
                    <div>
                      <Label className="mb-1.5 block">Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AGENT">Agent</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" loading={inviteStatus === "loading"} className="w-full"><Send className="w-4 h-4" />{inviteStatus === "loading" ? "Sending…" : "Send Invite"}</Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ── Notifications ── */}
            {section === "notifications" && (
              <Card>
                <CardHeader><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>NOTIFICATION PREFERENCES</CardTitle></CardHeader>
                <CardContent className="space-y-0">
                  <div className="grid grid-cols-3 gap-2 pb-2 mb-2" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Event</span>
                    <span className="text-xs font-semibold text-center" style={{ color: "var(--text-muted)" }}>Email</span>
                    <span className="text-xs font-semibold text-center" style={{ color: "var(--text-muted)" }}>In-app</span>
                  </div>
                  {NOTIF_EVENTS.map(({ key, label }) => (
                    <div key={key} className="grid grid-cols-3 items-center gap-2 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
                      <p className="text-sm" style={{ color: "var(--text-primary)" }}>{label}</p>
                      <div className="flex justify-center">
                        <input type="checkbox" checked={prefs[key]?.email ?? true} onChange={() => togglePref(key, "email")} className="accent-[var(--gold-500)] w-4 h-4 cursor-pointer" />
                      </div>
                      <div className="flex justify-center">
                        <input type="checkbox" checked={prefs[key]?.inapp ?? true} onChange={() => togglePref(key, "inapp")} className="accent-[var(--gold-500)] w-4 h-4 cursor-pointer" />
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 space-y-2">
                    {prefsMsg === "success" && <div className="flex items-center gap-2 p-3 rounded-[8px] text-sm" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--success)" }}><CheckCircle className="w-4 h-4" /> Preferences saved</div>}
                    {prefsMsg === "error"   && <div className="flex items-center gap-2 p-3 rounded-[8px] text-sm" style={{ background: "rgba(239,68,68,0.1)",  border: "1px solid rgba(239,68,68,0.3)",  color: "var(--danger)"  }}><AlertCircle className="w-4 h-4" /> Failed to save</div>}
                    <Button size="sm" onClick={handleSavePrefs} loading={prefsSaving}><Save className="w-3.5 h-3.5" />{prefsSaving ? "Saving…" : "Save Preferences"}</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Security ── */}
            {section === "security" && (
              <Card>
                <CardHeader><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>CHANGE PASSWORD</CardTitle></CardHeader>
                <CardContent>
                  {passwordStatus === "success" && <div className="flex items-center gap-2 p-3 rounded-[8px] mb-4 text-sm" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--success)" }}><CheckCircle className="w-4 h-4" /> Password updated successfully!</div>}
                  {passwordStatus === "error"   && <div className="p-3 rounded-[8px] mb-4 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>Passwords don&apos;t match or too short (min 8 chars).</div>}
                  <form onSubmit={handlePasswordChange} className="space-y-3 max-w-sm">
                    <div><Label className="mb-1.5 block">New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" required /></div>
                    <div><Label className="mb-1.5 block">Confirm Password</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required /></div>
                    <Button type="submit" loading={passwordStatus === "loading"}><Save className="w-4 h-4" />Update Password</Button>
                  </form>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
