"use client";

import { useEffect } from "react";

type ThemePreference = "light" | "dark" | "system";

function normalizeTheme(value: string | null): ThemePreference {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
}

export function ThemeController() {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (theme: ThemePreference) => {
      const isDark =
        theme === "dark" || (theme === "system" && mediaQuery.matches);
      document.documentElement.classList.toggle("dark", isDark);
    };

    const getCurrentTheme = () => normalizeTheme(localStorage.getItem("theme"));

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "theme") {
        applyTheme(normalizeTheme(event.newValue));
      }
    };

    const handleSystemChange = () => {
      applyTheme(getCurrentTheme());
    };

    applyTheme(getCurrentTheme());
    window.addEventListener("storage", handleStorage);
    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, []);

  return null;
}
