"use client";

import { useState } from "react";
import { User, Bell, Shield, Users, Save, Send, AlertCircle, CheckCircle } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea, Label } from "@/components/ui/form-elements";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "invite", label: "Invite User", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
  const [section, setSection] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", department: "", bio: "" });

  // Invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("AGENT");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [inviteError, setInviteError] = useState("");

  // Security
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus("loading");
    setInviteError("");

    if (!inviteEmail.endsWith("@nationsofsky.com")) {
      setInviteError("Only @nationsofsky.com emails are allowed");
      setInviteStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setInviteStatus("success");
      setInviteEmail("");
      setInviteName("");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite");
      setInviteStatus("error");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPasswordStatus("error"); return; }
    setPasswordStatus("loading");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordStatus("success");
      setNewPassword(""); setConfirmPassword("");
    } catch { setPasswordStatus("error"); }
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Settings" subtitle="Manage your account and preferences" />
      <div className="flex-1 p-6">
        <div className="flex gap-6 max-w-4xl">
          {/* Sidebar */}
          <div className="w-48 shrink-0">
            <nav className="space-y-0.5">
              {SECTIONS.map((s) => (
                <button key={s.id} onClick={() => setSection(s.id)} className="nav-item w-full"
                  style={{ background: section === s.id ? "rgba(201,168,76,0.2)" : "transparent", color: section === s.id ? "var(--gold-500)" : "var(--text-secondary)", border: section === s.id ? "0.5px solid var(--gold-500)" : "0.5px solid transparent" }}>
                  <s.icon className="w-4 h-4" />{s.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">

            {/* Profile */}
            {section === "profile" && (
              <>
                <Card>
                  <CardHeader><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>PROFILE INFORMATION</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">NOS</AvatarFallback>
                      </Avatar>
                      <Button variant="secondary" size="sm">Change Photo</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label className="mb-1.5 block">Full Name</Label><Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your name" /></div>
                      <div><Label className="mb-1.5 block">Email</Label><Input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="you@nationsofsky.com" /></div>
                      <div><Label className="mb-1.5 block">Phone</Label><Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+20 10 0000 0000" /></div>
                      <div><Label className="mb-1.5 block">Department</Label><Input value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))} placeholder="Customer Care" /></div>
                    </div>
                    <div><Label className="mb-1.5 block">Bio</Label><Textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Brief description…" rows={3} /></div>
                  </CardContent>
                </Card>
                <Button onClick={handleSaveProfile} loading={saving}><Save className="w-4 h-4" />{saving ? "Saving…" : "Save Changes"}</Button>
              </>
            )}

            {/* Invite User */}
            {section === "invite" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>INVITE NEW USER</CardTitle>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Only <span style={{ color: "var(--gold-400)" }}>@nationsofsky.com</span> emails are allowed. The user will receive an invite link valid for 3 minutes.
                  </p>
                </CardHeader>
                <CardContent>
                  {inviteStatus === "success" && (
                    <div className="flex items-center gap-2 p-3 rounded-[8px] mb-4 text-sm" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--success)" }}>
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      Invite sent! The user will receive an email shortly.
                    </div>
                  )}
                  {inviteStatus === "error" && inviteError && (
                    <div className="flex items-center gap-2 p-3 rounded-[8px] mb-4 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {inviteError}
                    </div>
                  )}
                  <form onSubmit={handleInvite} className="space-y-3">
                    <div><Label className="mb-1.5 block">Full Name *</Label><Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Ahmed Mohamed" required /></div>
                    <div>
                      <Label className="mb-1.5 block">Email Address *</Label>
                      <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="ahmed@nationsofsky.com" required />
                    </div>
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
                    <Button type="submit" loading={inviteStatus === "loading"} className="w-full">
                      <Send className="w-4 h-4" />
                      {inviteStatus === "loading" ? "Sending invite…" : "Send Invite"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Notifications */}
            {section === "notifications" && (
              <Card>
                <CardHeader><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>NOTIFICATION PREFERENCES</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Ticket assigned to me", desc: "When a ticket is assigned to you" },
                    { label: "Ticket status changes", desc: "When status changes on your tickets" },
                    { label: "New comments", desc: "When someone comments on your tickets" },
                    { label: "System announcements", desc: "Important platform updates" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" defaultChecked className="accent-[var(--gold-500)] w-3.5 h-3.5" />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Email</span>
                      </label>
                    </div>
                  ))}
                  <Button onClick={handleSaveProfile} loading={saving}><Save className="w-4 h-4" />Save</Button>
                </CardContent>
              </Card>
            )}

            {/* Security */}
            {section === "security" && (
              <Card>
                <CardHeader><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>CHANGE PASSWORD</CardTitle></CardHeader>
                <CardContent>
                  {passwordStatus === "success" && (
                    <div className="flex items-center gap-2 p-3 rounded-[8px] mb-4 text-sm" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--success)" }}>
                      <CheckCircle className="w-4 h-4" /> Password updated successfully!
                    </div>
                  )}
                  {passwordStatus === "error" && (
                    <div className="p-3 rounded-[8px] mb-4 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>
                      Passwords don't match or an error occurred.
                    </div>
                  )}
                  <form onSubmit={handlePasswordChange} className="space-y-3">
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
