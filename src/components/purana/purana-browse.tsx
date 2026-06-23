import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  getPuranaIndex,
  PURANA_META,
  type PuranaSlug,
} from "@/lib/purana";

export function PuranaBrowse({ slug }: { slug: PuranaSlug }) {
  const idx = getPuranaIndex(slug);
  const meta = PURANA_META[slug];
  const [q, setQ] = useState("");
  const [sec, setSec] = useState<string>("All");

  const sections = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return idx.sections
      .filter((s) => sec === "All" || s.key === sec)
      .map((s) => ({
        ...s,
        chapters: s.chapters.filter((c) => {
          if (!needle) return true;
          return (
            c.title.toLowerCase().includes(needle) ||
            String(c.number) === needle
          );
        }),
      }))
      .filter((s) => s.chapters.length > 0);
  }, [idx, q, sec]);

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-12 md:pt-16">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          The Library · {meta.tagline}
        </p>
        <h1 className="font-serif text-4xl tracking-tight md:text-5xl">
          {meta.name}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{meta.blurb}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {idx.totalChapters} chapters · {idx.sections.length} section
          {idx.sections.length === 1 ? "" : "s"}
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
          {idx.sections.length > 1 && (
            <div className="flex max-w-full flex-wrap items-center gap-1 overflow-x-auto text-xs">
              {(["All", ...idx.sections.map((s) => s.key)] as const).map((k) => {
                const active = sec === k;
                const label =
                  k === "All"
                    ? "All"
                    : idx.sections.find((s) => s.key === k)?.label ?? k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSec(k)}
                    className={
                      "shrink-0 rounded-full px-3 py-1.5 transition " +
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
          )}
        </div>
      </div>

      <div className="mt-10 space-y-14">
        {sections.map((s) => (
          <section key={s.key}>
            <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
              <h2 className="font-serif text-2xl tracking-tight">{s.label}</h2>
              <span className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">
                {s.chapters.length}{" "}
                {s.chapters.length === 1 ? "chapter" : "chapters"}
              </span>
            </div>
            <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {s.chapters.map((c) => (
                <li key={c.id} className="border-b border-border/40">
                  <Link
                    to={`/${slug}/$slug` as never}
                    params={{ slug: c.id } as never}
                    className="group -mx-2 flex items-baseline gap-3 rounded px-2 py-2.5 transition hover:bg-muted/40"
                  >
                    <span className="w-8 shrink-0 text-right font-serif text-sm text-muted-foreground tabular-nums">
                      {c.number}
                    </span>
                    <span className="flex-1 text-sm">{c.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.verseCount}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {sections.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No chapters match that search.
          </p>
        )}
      </div>
    </main>
  );
}
