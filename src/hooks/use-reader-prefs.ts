import { useEffect, useState } from "react";

export type ReaderPrefs = {
  fontFamily: "serif" | "sans";
  fontSize: "sm" | "md" | "lg" | "xl";
  lineHeight: "tight" | "normal" | "loose";
  theme: "light" | "sepia" | "dark";
};

const DEFAULTS: ReaderPrefs = {
  fontFamily: "serif",
  fontSize: "md",
  lineHeight: "normal",
  theme: "light",
};

const KEY = "vachanalaya:reader-prefs";

export function useReaderPrefs() {
  const [prefs, setPrefs] = useState<ReaderPrefs>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {}
  }, [prefs, hydrated]);

  const update = <K extends keyof ReaderPrefs>(key: K, value: ReaderPrefs[K]) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  return { prefs, update, hydrated };
}

export const FONT_SIZE_CLASS: Record<ReaderPrefs["fontSize"], string> = {
  sm: "text-[16px]",
  md: "text-[18px]",
  lg: "text-[20px]",
  xl: "text-[22px]",
};

export const LINE_HEIGHT_CLASS: Record<ReaderPrefs["lineHeight"], string> = {
  tight: "leading-[1.55]",
  normal: "leading-[1.75]",
  loose: "leading-[2]",
};
