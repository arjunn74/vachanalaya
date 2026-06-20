import { useEffect, useState } from "react";

const KEY = "vachanalaya:theme";
type Theme = "light" | "dark";

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function useAppTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let t: Theme = "light";
    try {
      const stored = localStorage.getItem(KEY) as Theme | null;
      if (stored === "light" || stored === "dark") t = stored;
      else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) t = "dark";
    } catch {}
    setTheme(t);
    apply(t);
    setHydrated(true);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      apply(next);
      try {
        localStorage.setItem(KEY, next);
      } catch {}
      return next;
    });
  };

  return { theme, toggle, hydrated };
}
