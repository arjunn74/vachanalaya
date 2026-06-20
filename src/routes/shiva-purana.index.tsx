import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  shivaIndex,
  SHIVA_SECTION_ORDER,
  SHIVA_SECTION_META,
  type ShivaSection,
} from "@/data/shiva-purana";

export const Route = createFileRoute("/shiva-purana/")({
  head: () => ({
    meta: [
      { title: "The Shiva Purana — Vachanalaya" },
      {
        name: "description",
        content:
          "Read the Shiva Purana (Mahatmya, Vidyesvara and Rudra Samhitas) in English translation, chapter by chapter.",
      },
      { property: "og:title", content: "The Shiva Purana — Vachanalaya" },
      {
        property: "og:description",
        content:
          "Read the Shiva Purana (Mahatmya, Vidyesvara and Rudra Samhitas) in English translation, chapter by chapter.",
      },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [q, setQ] = useState("");
  const [section, setSection] = useState<ShivaSection | "All">("All");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return shivaIndex.filter((c) => {
      if (section !== "All" && c.section !== section) return false;
      if (!needle) return true;
      return (
        c.title.toLowerCase().includes(needle) ||
        String(c.number) === needle ||
        String(c.globalNumber) === needle
      );
    });
  }, [q, section]);

  const grouped = useMemo(() => {
    const map = new Map<ShivaSection, typeof filtered>();
    SHIVA_SECTION_ORDER.forEach((s) => map.set(s, []));
    filtered.forEach((c) => map.get(c.section)?.push(c));
    return map;
  }, [filtered]);

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-12 md:pt-16">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          The Library
        </p>
        <h1 className="font-serif text-4xl tracking-tight md:text-5xl">
          The Shiva Purana
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          The Mahatmya, Vidyesvara Samhita, and the five sections of the Rudra
          Samhita. {shivaIndex.length} chapters in English translation.
        </p>
      </div>

      <div className="sticky top-14 z-20 -mx-5 mt-10 border-y border-border/60 bg-background/85 px-5 py-3 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search chapters…"
              className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {(["All", ...SHIVA_SECTION_ORDER] as const).map((s) => {
              const active = section === s;
              const label =
                s === "All" ? "All" : SHIVA_SECTION_META[s].short;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSection(s)}
                  className={
                    "rounded-full px-3 py-1.5 transition " +
                    (active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground")
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-14">
        {SHIVA_SECTION_ORDER.map((s) => {
          const list = grouped.get(s) ?? [];
          if (list.length === 0) return null;
          const meta = SHIVA_SECTION_META[s];
          return (
            <section key={s}>
              <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
                <div>
                  <h2 className="font-serif text-2xl tracking-tight">
                    {meta.full}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {meta.blurb}
                  </p>
                </div>
                <span className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">
                  {list.length} {list.length === 1 ? "chapter" : "chapters"}
                </span>
              </div>
              <ul className="divide-y divide-border/70">
                {list.map((c) => (
                  <li key={c.id}>
                    <Link
                      to="/shiva-purana/$slug"
                      params={{ slug: c.id }}
                      className="group -mx-3 flex items-baseline gap-5 rounded px-3 py-3 transition hover:bg-muted/40"
                    >
                      <span className="w-8 shrink-0 text-right font-serif text-sm text-muted-foreground tabular-nums">
                        {c.number}
                      </span>
                      <span className="flex-1 text-base">{c.title}</span>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {c.verseCount} para
                      </span>
                      <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No chapters match that search.
          </p>
        )}
      </div>
    </main>
  );
}
