"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface NotificationCtx {
  unreadCount: number;
  refresh: () => void;
}

const Ctx = createContext<NotificationCtx>({ unreadCount: 0, refresh: () => {} });

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

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
          event:  "*",
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
