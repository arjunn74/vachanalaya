import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { gitaIndex } from "@/data/gita";

export const Route = createFileRoute("/gita/")({
  head: () => ({
    meta: [
      { title: "The Bhagavad Gītā — Vachanalaya" },
      { name: "description", content: "Read the 18 chapters of the Bhagavad Gītā in English translation, with Sanskrit and transliteration." },
      { property: "og:title", content: "The Bhagavad Gītā — Vachanalaya" },
      { property: "og:description", content: "Read the 18 chapters of the Bhagavad Gītā in English translation." },
    ],
  }),
  component: BrowseGita,
});

function BrowseGita() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return gitaIndex;
    return gitaIndex.filter(
      (c) => c.title.toLowerCase().includes(n) || String(c.number) === n,
    );
  }, [q]);

  const totalVerses = gitaIndex.reduce((a, c) => a + c.verseCount, 0);

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-12 md:pt-16">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">The Library</p>
        <h1 className="font-serif text-4xl tracking-tight md:text-5xl">The Bhagavad Gītā</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Eighteen chapters · {totalVerses} verses · spoken by Śrī Kṛṣṇa to Arjuna on the field of Kurukṣetra.
        </p>
      </div>

      <div className="sticky top-14 z-20 -mx-5 mt-10 border-y border-border/60 bg-background/85 px-5 py-3 backdrop-blur">
        <label className="relative block w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by chapter or number…"
            className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
          />
        </label>
      </div>

      <ul className="mt-8 divide-y divide-border/70">
        {filtered.map((c) => (
          <li key={c.id}>
            <Link
              to="/gita/$slug"
              params={{ slug: c.id }}
              className="group flex items-baseline gap-5 -mx-3 rounded px-3 py-4 transition hover:bg-muted/40"
            >
              <span className="w-8 shrink-0 text-right font-serif text-sm text-muted-foreground tabular-nums">
                {c.number}
              </span>
              <span className="flex-1">
                <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Chapter {c.number}
                </span>
                <span className="mt-0.5 block font-serif text-lg">{c.title}</span>
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {c.verseCount} verses
              </span>
              <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="py-16 text-center text-sm text-muted-foreground">No chapters match that search.</li>
        )}
      </ul>
    </main>
  );
}
