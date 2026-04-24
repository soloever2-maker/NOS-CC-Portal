"use client";

import { useState, useCallback, useEffect } from "react";
import { SplashScreen } from "@/components/layout/splash-screen";
import { NotificationProvider } from "@/lib/notification-context";

const SPLASH_KEY = "nos_splash_shown";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem(SPLASH_KEY);
    if (!shown) setShowSplash(true);
  }, []);

  const handleDone = useCallback(() => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setShowSplash(false);
  }, []);

  return (
    <NotificationProvider>
      {showSplash && <SplashScreen onDone={handleDone} />}
      {children}
    </NotificationProvider>
  );
}
