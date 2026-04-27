"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface NotificationCtx {
  unreadCount: number;
  refresh: () => void;
}

const Ctx = createContext<NotificationCtx>({ unreadCount: 0, refresh: () => {} });

// ── Classic soft ding using Web Audio API ─────────────
function playDing() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const playTone = (freq: number, startTime: number, duration: number, gain: number) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.connect(vol);
      vol.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      vol.gain.setValueAtTime(0, startTime);
      vol.gain.linearRampToValueAtTime(gain, startTime + 0.01);
      vol.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Two soft notes — classic "ding dong"
    playTone(880, ctx.currentTime,        0.6, 0.3);
    playTone(660, ctx.currentTime + 0.18, 0.8, 0.2);
  } catch { /* silent fail if audio not available */ }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const isFirst = useRef(true);

  const fetchCount = useCallback(async (uid: string) => {
    const sb = createClient();
    const { count } = await sb
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }, []);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await sb
        .from("users").select("id").eq("supabase_id", user.id).single();
      if (!profile) return;
      setUserId(profile.id);
      await fetchCount(profile.id);

      // ── Real-time subscription ──────────────────────
      const channel = sb
        .channel(`notifications:${profile.id}`)
        .on("postgres_changes", {
          event:  "INSERT",
          schema: "public",
          table:  "notifications",
          filter: `user_id=eq.${profile.id}`,
        }, () => {
          // Skip sound on initial load
          if (isFirst.current) { isFirst.current = false; return; }
          playDing();
          fetchCount(profile.id);
        })
        .on("postgres_changes", {
          event:  "UPDATE",
          schema: "public",
          table:  "notifications",
          filter: `user_id=eq.${profile.id}`,
        }, () => {
          fetchCount(profile.id);
        })
        .subscribe();

      return () => { sb.removeChannel(channel); };
    });
  }, [fetchCount]);

  const refresh = useCallback(() => {
    if (userId) fetchCount(userId);
  }, [userId, fetchCount]);

  return <Ctx.Provider value={{ unreadCount, refresh }}>{children}</Ctx.Provider>;
}

export const useNotifications = () => useContext(Ctx);
