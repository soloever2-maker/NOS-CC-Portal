"use client";

import { useState, useCallback } from "react";
import { SplashScreen } from "@/components/layout/splash-screen";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  const handleDone = useCallback(() => setShowSplash(false), []);

  return (
    <>
      {showSplash && <SplashScreen onDone={handleDone} />}
      <div style={{ opacity: showSplash ? 0 : 1, transition: "opacity 0.4s ease" }}>
        {children}
      </div>
    </>
  );
}
