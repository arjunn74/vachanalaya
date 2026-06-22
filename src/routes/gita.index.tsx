import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { gitaIndex, GITA_TOTAL_VERSES } from "@/data/gita";

export const Route = createFileRoute("/gita/")({
  head: () => ({
    meta: [
      { title: "Shrimad Bhagavad Gita — Vachanalaya" },
      {
        name: "description",
        content:
          "Read the Shrimad Bhagavad Gita in Sanskrit, transliteration and English — all 18 chapters, 700 verses.",
      },
      { property: "og:title", content: "Shrimad Bhagavad Gita — Vachanalaya" },
      {
        property: "og:description",
        content:
          "Read the Shrimad Bhagavad Gita in Sanskrit, transliteration and English — all 18 chapters, 700 verses.",
      },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return gitaIndex;
    return gitaIndex.filter(
      (c) =>
        c.translation.toLowerCase().includes(needle) ||
        c.transliteration.toLowerCase().includes(needle) ||
        c.meaning.toLowerCase().includes(needle) ||
        String(c.number) === needle,
    );
  }, [q]);

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-12 md:pt-16">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          The Library
        </p>
        <h1 className="font-serif text-4xl tracking-tight md:text-5xl">
          Shrimad Bhagavad Gita
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          The Song of the Lord — 18 chapters, {GITA_TOTAL_VERSES} verses in
          Sanskrit with English translation.
        </p>
      </div>

      <div className="sticky top-14 z-20 -mx-5 mt-10 border-y border-border/60 bg-background/85 px-5 py-3 backdrop-blur">
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
      </div>

      <ul className="mt-10 divide-y divide-border/70">
        {filtered.map((c) => (
          <li key={c.id}>
            <Link
              to="/gita/$slug"
              params={{ slug: c.id }}
              className="group -mx-3 flex items-baseline gap-5 rounded px-3 py-4 transition hover:bg-muted/40"
            >
              <span className="w-8 shrink-0 text-right font-serif text-base text-muted-foreground tabular-nums">
                {c.number}
              </span>
              <span className="flex-1">
                <span className="block font-serif text-lg">
                  {c.transliteration}
                </span>
                <span className="mt-0.5 block text-xs uppercase tracking-wider text-muted-foreground">
                  {c.translation} · {c.meaning}
                </span>
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {c.verseCount} verses
              </span>
              <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-16 text-center text-sm text-muted-foreground">
            No chapters match that search.
          </li>
        )}
      </ul>

      <p className="mt-12 text-xs text-muted-foreground">
        Verse text courtesy of{" "}
        <a
          href="https://github.com/vedicscriptures/bhagavad-gita-api"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:underline"
        >
          vedicscriptures/bhagavad-gita-api
        </a>
        .
      </p>
    </main>
  );
}
