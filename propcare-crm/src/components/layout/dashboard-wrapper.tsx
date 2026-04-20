"use client";

import { useState, useCallback, useEffect } from "react";
import { SplashScreen } from "@/components/layout/splash-screen";

const SPLASH_KEY = "nos_splash_shown";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Show splash only once per session
    const shown = sessionStorage.getItem(SPLASH_KEY);
    if (!shown) {
      setShowSplash(true);
    }
  }, []);

  const handleDone = useCallback(() => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onDone={handleDone} />}
      {children}
    </>
  );
}
