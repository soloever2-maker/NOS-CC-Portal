"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    // fade in → hold → fade out
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"), 1800);
    const t3 = setTimeout(() => onDone(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        backgroundColor: "var(--black-950)",
        opacity: phase === "out" ? 0 : 1,
        transition: phase === "in" ? "opacity 0.6s ease" : phase === "out" ? "opacity 0.6s ease" : "none",
        pointerEvents: "none",
      }}
    >
      {/* Logo */}
      <div
        style={{
          transform: phase === "in" ? "scale(0.85)" : "scale(1)",
          opacity: phase === "in" ? 0 : 1,
          transition: "transform 0.6s ease, opacity 0.6s ease",
        }}
      >
        <Image
          src="/logo.png"
          alt="Nations of Sky"
          width={90}
          height={90}
          className="object-contain"
          priority
        />
      </div>

      {/* Company Name */}
      <div
        style={{
          opacity: phase === "in" ? 0 : 1,
          transform: phase === "in" ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
          textAlign: "center",
          marginTop: 20,
        }}
      >
        <p
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22,
            fontWeight: 600,
            color: "var(--gold-400)",
            letterSpacing: "0.05em",
          }}
        >
          Nations of Sky
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Customer Care
        </p>
      </div>

      {/* Gold line loader */}
      <div
        style={{
          marginTop: 40,
          width: 120,
          height: 2,
          borderRadius: 2,
          background: "var(--black-600)",
          overflow: "hidden",
          opacity: phase === "in" ? 0 : 1,
          transition: "opacity 0.4s ease 0.3s",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, var(--gold-600), var(--gold-400))",
            borderRadius: 2,
            animation: "splashLoad 1.2s ease forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes splashLoad {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
