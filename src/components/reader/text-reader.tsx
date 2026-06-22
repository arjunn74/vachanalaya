import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, Settings2, X } from "lucide-react";
import {
  FONT_SIZE_CLASS,
  LINE_HEIGHT_CLASS,
  useReaderPrefs,
  type ReaderPrefs,
} from "@/hooks/use-reader-prefs";

export type ReaderVerse = {
  id?: string;
  text: string;
  /** Optional original-language block (e.g. Devanagari) shown above text. */
  sanskrit?: string;
  /** Optional IAST / romanized transliteration shown between sanskrit and text. */
  transliteration?: string;
};

export type ReaderNeighbor = {
  slug: string;
  label: string;
};

export type TextReaderProps = {
  /** Stable key used for localStorage scroll position. */
  storageKey: string;
  /** Where the "Library" back-link points. */
  libraryTo: string;
  libraryLabel?: string;
  /** Small uppercase line above the title (e.g. "Rig Veda · No. 12"). */
  eyebrow: string;
  title: string;
  verses: ReaderVerse[];
  /** Optional rich header content rendered above the eyebrow. */
  preHeader?: ReactNode;
  /** Prev/next navigation. `to` is a TanStack route pattern, `params` its params. */
  prev?: { to: string; params: Record<string, string>; label: string };
  next?: { to: string; params: Record<string, string>; label: string };
};

export function TextReader({
  storageKey,
  libraryTo,
  libraryLabel = "Library",
  eyebrow,
  title,
  verses,
  preHeader,
  prev,
  next,
}: TextReaderProps) {
  const { prefs, update, hydrated } = useReaderPrefs();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-reader-theme", prefs.theme);
    return () => document.documentElement.removeAttribute("data-reader-theme");
  }, [prefs.theme]);

  useEffect(() => {
    const stored = Number(localStorage.getItem(storageKey) || 0);
    window.scrollTo({ top: stored > 0 ? stored : 0, behavior: "auto" });
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const total = doc.scrollHeight - window.innerHeight;
        const top = window.scrollY;
        setProgress(total > 0 ? Math.min(1, top / total) : 0);
        try {
          localStorage.setItem(storageKey, String(Math.round(top)));
        } catch {}
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [storageKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName)
      )
        return;
      if (e.key === "ArrowLeft" && prev) {
        navigate({ to: prev.to, params: prev.params } as never);
      } else if (e.key === "ArrowRight" && next) {
        navigate({ to: next.to, params: next.params } as never);
      } else if (e.key === "Escape") {
        setShowSettings(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, navigate]);

  const fontClass =
    prefs.fontFamily === "serif" ? "font-[var(--font-reader-serif)]" : "font-sans";

  return (
    <div className="min-h-screen bg-[var(--color-reader-bg)] text-[var(--color-reader-fg)] transition-colors">
      <div className="fixed left-0 right-0 top-0 z-40 h-[2px] bg-transparent">
        <div
          className="h-full bg-primary transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <header className="sticky top-0 z-30 border-b border-[var(--color-reader-rule)] bg-[var(--color-reader-bg)]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-5">
          <Link
            to={libraryTo as never}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-reader-muted)] hover:text-[var(--color-reader-fg)]"
          >
            <ChevronLeft className="h-4 w-4" />
            {libraryLabel}
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <div className="truncate font-serif text-sm">{title}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-reader-muted)]">
              {eyebrow}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            aria-label="Reader settings"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-reader-muted)] transition hover:bg-[var(--color-reader-rule)]/40 hover:text-[var(--color-reader-fg)]"
          >
            {showSettings ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
          </button>
        </div>
        {showSettings && hydrated && <SettingsPanel prefs={prefs} update={update} />}
      </header>

      <article
        ref={articleRef}
        className={`mx-auto max-w-[68ch] px-5 pb-32 pt-12 ${fontClass} ${FONT_SIZE_CLASS[prefs.fontSize]} ${LINE_HEIGHT_CLASS[prefs.lineHeight]}`}
      >
        <header className="mb-12 border-b border-[var(--color-reader-rule)] pb-8">
          {preHeader}
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-reader-muted)]">
            {eyebrow}
          </div>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight md:text-5xl">
            {title}
          </h1>
        </header>

        <div className="space-y-6">
          {verses.map((v, i) => (
            <div key={i} className="group relative">
              {v.id && (
                <span
                  className="absolute -left-20 top-1 hidden w-16 text-right font-mono text-[11px] tracking-tight text-[var(--color-reader-muted)] md:block"
                  aria-hidden
                >
                  {v.id}
                </span>
              )}
              {v.id && (
                <span className="mr-2 font-mono text-[11px] text-[var(--color-reader-muted)] md:hidden">
                  {v.id}
                </span>
              )}
              {v.sanskrit && (
                <p className="mb-2 whitespace-pre-line font-serif text-[1.05em] leading-relaxed text-[var(--color-reader-fg)]">
                  {v.sanskrit}
                </p>
              )}
              {v.transliteration && (
                <p className="mb-2 whitespace-pre-line text-[0.85em] italic text-[var(--color-reader-muted)]">
                  {v.transliteration}
                </p>
              )}
              <p className="whitespace-pre-line text-[1em]">{v.text}</p>
            </div>
          ))}
        </div>

        <nav className="mt-24 grid grid-cols-2 gap-4 border-t border-[var(--color-reader-rule)] pt-8 text-sm">
          {prev ? (
            <Link
              to={prev.to as never}
              params={prev.params as never}
              className="group flex items-start gap-3 rounded-lg p-3 transition hover:bg-[var(--color-reader-rule)]/30"
            >
              <ArrowLeft className="mt-1 h-4 w-4 text-[var(--color-reader-muted)] transition-transform group-hover:-translate-x-0.5" />
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-reader-muted)]">
                  Previous
                </div>
                <div className="mt-0.5 font-serif">{prev.label}</div>
              </div>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={next.to as never}
              params={next.params as never}
              className="group ml-auto flex items-start gap-3 rounded-lg p-3 text-right transition hover:bg-[var(--color-reader-rule)]/30"
            >
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-reader-muted)]">
                  Next
                </div>
                <div className="mt-0.5 font-serif">{next.label}</div>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 text-[var(--color-reader-muted)] transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </div>
  );
}

function SettingsPanel({
  prefs,
  update,
}: {
  prefs: ReaderPrefs;
  update: <K extends keyof ReaderPrefs>(k: K, v: ReaderPrefs[K]) => void;
}) {
  return (
    <div className="border-t border-[var(--color-reader-rule)] bg-[var(--color-reader-bg)]">
      <div className="mx-auto grid max-w-3xl gap-4 px-5 py-4 sm:grid-cols-4">
        <Field label="Font">
          <Segmented
            value={prefs.fontFamily}
            onChange={(v) => update("fontFamily", v)}
            options={[
              { value: "serif", label: "Serif" },
              { value: "sans", label: "Sans" },
            ]}
          />
        </Field>
        <Field label="Size">
          <Segmented
            value={prefs.fontSize}
            onChange={(v) => update("fontSize", v)}
            options={[
              { value: "sm", label: "S" },
              { value: "md", label: "M" },
              { value: "lg", label: "L" },
              { value: "xl", label: "XL" },
            ]}
          />
        </Field>
        <Field label="Spacing">
          <Segmented
            value={prefs.lineHeight}
            onChange={(v) => update("lineHeight", v)}
            options={[
              { value: "tight", label: "Tight" },
              { value: "normal", label: "Normal" },
              { value: "loose", label: "Loose" },
            ]}
          />
        </Field>
        <Field label="Theme">
          <Segmented
            value={prefs.theme}
            onChange={(v) => update("theme", v)}
            options={[
              { value: "light", label: "Light" },
              { value: "sepia", label: "Sepia" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-reader-muted)]">
        {label}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-full border border-[var(--color-reader-rule)] p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={
              "rounded-full px-3 py-1 text-xs transition " +
              (active
                ? "bg-[var(--color-reader-fg)] text-[var(--color-reader-bg)]"
                : "text-[var(--color-reader-muted)] hover:text-[var(--color-reader-fg)]")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
