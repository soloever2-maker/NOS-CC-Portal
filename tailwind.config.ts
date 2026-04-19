import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: {
          950: "#080808",
          900: "#0D0D0D",
          800: "#141414",
          700: "#1C1C1C",
          600: "#242424",
          500: "#2E2E2E",
        },
        gold: {
          200: "#EEE0B8",
          300: "#E2CC8F",
          400: "#D4B96A",
          500: "#C9A84C",
          600: "#A8882E",
        },
        border: "rgba(201,168,76,0.15)",
        background: "#080808",
        foreground: "#F5F5F5",
        primary: { DEFAULT: "#C9A84C", foreground: "#080808" },
        secondary: { DEFAULT: "#1C1C1C", foreground: "#F5F5F5" },
        muted: { DEFAULT: "#141414", foreground: "#A0A0A0" },
        accent: { DEFAULT: "#242424", foreground: "#C9A84C" },
        destructive: { DEFAULT: "#ef4444", foreground: "#F5F5F5" },
        card: { DEFAULT: "#141414", foreground: "#F5F5F5" },
        popover: { DEFAULT: "#1C1C1C", foreground: "#F5F5F5" },
        input: "#1C1C1C",
        ring: "#C9A84C",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: { lg: "12px", md: "8px", sm: "6px" },
      boxShadow: {
        gold: "0 0 20px rgba(201,168,76,0.15)",
        "gold-lg": "0 0 40px rgba(201,168,76,0.2)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #C9A84C 0%, #A8882E 100%)",
        "gold-subtle": "linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(168,136,46,0.05) 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in": "slideIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideIn: { "0%": { transform: "translateX(-10px)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
      },
    },
  },
  plugins: [],
};

export default config;
