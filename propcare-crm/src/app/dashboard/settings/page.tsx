"use client";

import { useState } from "react";
import { User, Bell, Shield, Palette, Save } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea, Label } from "@/components/ui/form-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export default function SettingsPage() {
  const [section, setSection] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: "Agent", email: "agent@propcare.demo", phone: "", department: "", bio: "" });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
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
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className="nav-item w-full"
                  style={{
                    background: section === s.id ? "rgba(201,168,76,0.2)" : "transparent",
                    color: section === s.id ? "var(--gold-500)" : "var(--text-secondary)",
                    border: section === s.id ? "0.5px solid var(--gold-500)" : "0.5px solid transparent",
                  }}
                >
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">
            {section === "profile" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>PROFILE INFORMATION</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">AG</AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="secondary" size="sm">Change Photo</Button>
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>JPG, PNG up to 2MB</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-1.5 block">Full Name</Label>
                        <Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="mb-1.5 block">Email</Label>
                        <Input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="mb-1.5 block">Phone</Label>
                        <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+971 50 000 0000" />
                      </div>
                      <div>
                        <Label className="mb-1.5 block">Department</Label>
                        <Input value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))} placeholder="Customer Care" />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-1.5 block">Bio</Label>
                      <Textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Brief description about yourself…" rows={3} />
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleSave} loading={saving}>
                  <Save className="w-4 h-4" />
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </>
            )}

            {section === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>NOTIFICATION PREFERENCES</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Ticket assigned to me", desc: "When a ticket is assigned to you" },
                    { label: "Ticket status changes", desc: "When a ticket you own changes status" },
                    { label: "New comments", desc: "When someone comments on your tickets" },
                    { label: "Lead updates", desc: "When a lead is updated or assigned" },
                    { label: "System announcements", desc: "Important platform updates" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                      </div>
                      <div className="flex gap-3">
                        {["Email", "In-app"].map((ch) => (
                          <label key={ch} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" defaultChecked className="accent-[var(--gold-500)] w-3.5 h-3.5" />
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{ch}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button onClick={handleSave} loading={saving}>
                    <Save className="w-4 h-4" />Save Preferences
                  </Button>
                </CardContent>
              </Card>
            )}

            {section === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>CHANGE PASSWORD</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="mb-1.5 block">Current Password</Label>
                    <Input type="password" placeholder="Enter current password" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">New Password</Label>
                    <Input type="password" placeholder="Enter new password" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Confirm New Password</Label>
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                  <Button onClick={handleSave} loading={saving}>
                    <Save className="w-4 h-4" />Update Password
                  </Button>
                </CardContent>
              </Card>
            )}

            {section === "appearance" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>APPEARANCE</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Theme</p>
                  <div className="flex gap-3">
                    {["Dark (Default)", "Light", "System"].map((t) => (
                      <button
                        key={t}
                        className="px-4 py-2 rounded-[8px] text-sm font-medium transition-all"
                        style={{
                          background: t === "Dark (Default)" ? "var(--gold-glow)" : "var(--black-700)",
                          border: t === "Dark (Default)" ? "1px solid var(--gold-500)" : "1px solid var(--black-500)",
                          color: t === "Dark (Default)" ? "var(--gold-500)" : "var(--text-muted)",
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>PropCare CRM is optimized for dark mode.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
