"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  lineMode: boolean;
  toggleLineMode: () => void;
}

const AppContext = createContext<AppContextType>({
  theme: "dark",
  toggleTheme: () => {},
  lineMode: false,
  toggleLineMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lineMode, setLineMode] = useState(false);

  useEffect(() => {
    const storedTheme = (localStorage.getItem("nos-theme") as Theme) ?? "dark";
    const storedLine = localStorage.getItem("nos-line-mode") === "true";
    setTheme(storedTheme);
    setLineMode(storedLine);
    document.documentElement.setAttribute("data-theme", storedTheme);
    if (storedLine) document.documentElement.classList.add("line-mode");
    else document.documentElement.classList.remove("line-mode");
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("nos-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const toggleLineMode = () => {
    const next = !lineMode;
    setLineMode(next);
    localStorage.setItem("nos-line-mode", String(next));
    if (next) document.documentElement.classList.add("line-mode");
    else document.documentElement.classList.remove("line-mode");
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, lineMode, toggleLineMode }}>
      {children}
    </AppContext.Provider>
  );
}

export const useTheme = () => useContext(AppContext);
