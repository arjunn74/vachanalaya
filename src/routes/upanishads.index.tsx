import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { upanishadIndex, VEDA_ORDER, type Veda } from "@/data/upanishads";

export const Route = createFileRoute("/upanishads/")({
  head: () => ({
    meta: [
      { title: "The 108 Upanishads — Vachanalaya" },
      { name: "description", content: "Browse all 108 Upanishads grouped by Veda. Filter by name and open any text in the reader." },
      { property: "og:title", content: "The 108 Upanishads — Vachanalaya" },
      { property: "og:description", content: "Browse all 108 Upanishads grouped by Veda. Filter by name and open any text in the reader." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [q, setQ] = useState("");
  const [veda, setVeda] = useState<Veda | "All">("All");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return upanishadIndex.filter((u) => {
      if (veda !== "All" && u.veda !== veda) return false;
      if (!needle) return true;
      return (
        u.title.toLowerCase().includes(needle) ||
        String(u.number) === needle
      );
    });
  }, [q, veda]);

  const grouped = useMemo(() => {
    const map = new Map<Veda, typeof filtered>();
    VEDA_ORDER.forEach((v) => map.set(v, []));
    filtered.forEach((u) => map.get(u.veda)?.push(u));
    return map;
  }, [filtered]);

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-12 md:pt-16">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">The Library</p>
        <h1 className="font-serif text-4xl tracking-tight md:text-5xl">The 108 Upanishads</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Arranged by the Veda each belongs to. {upanishadIndex.length} texts in English translation.
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
              placeholder="Search by name or number…"
              className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {(["All", ...VEDA_ORDER] as const).map((v) => {
              const active = veda === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVeda(v)}
                  className={
                    "rounded-full px-3 py-1.5 transition " +
                    (active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground")
                  }
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-14">
        {VEDA_ORDER.map((v) => {
          const list = grouped.get(v) ?? [];
          if (list.length === 0) return null;
          return (
            <section key={v}>
              <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
                <h2 className="font-serif text-2xl tracking-tight">{v} Veda</h2>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {list.length} {list.length === 1 ? "text" : "texts"}
                </span>
              </div>
              <ul className="divide-y divide-border/70">
                {list.map((u) => (
                  <li key={u.id}>
                    <Link
                      to="/upanishads/$slug"
                      params={{ slug: u.id }}
                      className="group flex items-baseline gap-5 py-3 transition hover:bg-muted/40 -mx-3 px-3 rounded"
                    >
                      <span className="w-8 shrink-0 text-right font-serif text-sm text-muted-foreground tabular-nums">
                        {u.number}
                      </span>
                      <span className="flex-1 text-base">{u.title.replace(/ Upanishad$/, "")}</span>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {u.verseCount} verses
                      </span>
                      <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">No Upanishads match that search.</p>
        )}
      </div>
    </main>
  );
}
