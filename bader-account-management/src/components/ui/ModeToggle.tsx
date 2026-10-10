"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "bader-mode";

export function applyStoredMode() {
  try {
    document.documentElement.setAttribute("data-mode", localStorage.getItem(KEY) === "dark" ? "dark" : "light");
  } catch {
    /* ignore */
  }
}

export default function ModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-mode") === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-mode", next ? "dark" : "light");
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="toggle dark mode"
      className="p-2.5 rounded-xl hover:bg-white/60 transition-colors"
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
