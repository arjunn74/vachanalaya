import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { upanishadIndex, VEDA_ORDER } from "@/data/upanishads";
import { gitaIndex, GITA_TOTAL_VERSES } from "@/data/gita";
import { getPuranaIndex, PURANA_META, type PuranaSlug } from "@/lib/purana";

const PURANA_CARDS: PuranaSlug[] = [
  "shiva-purana",
  "bhagavata-purana",
  "brahma-purana",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vachanalaya — Read the 108 Upanishads" },
      { name: "description", content: "A calm, focused digital library for studying the 108 Upanishads in English, with more Hindu texts to come." },
      { property: "og:title", content: "Vachanalaya — Read the 108 Upanishads" },
      { property: "og:description", content: "A calm, focused digital library for studying the 108 Upanishads in English, with more Hindu texts to come." },
    ],
  }),
  component: Home,
});

function Home() {
  const counts = VEDA_ORDER.map((v) => ({
    veda: v,
    count: upanishadIndex.filter((u) => u.veda === v).length,
  }));

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-16 md:pt-28">
      <section className="max-w-2xl">
        <p className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-px w-6 bg-primary" />
          A digital library of Hindu texts
        </p>
        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl">
          वाचनालय <span className="text-muted-foreground">·</span> Vachanalaya
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          A quiet place to read the foundational texts of the Indian tradition.
          Begin with the 108 Upanishads — the Vedas, Bhagavad Gita and
          Shrimadbhagavatam follow.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            to="/upanishads"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Browse the 108 Upanishads
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/upanishads/$slug"
            params={{ slug: "isavasya" }}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            or start with the Isha
          </Link>
        </div>
      </section>

      <section className="mt-24 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-5">
        {counts.map(({ veda, count }) => (
          <div key={veda} className="bg-background p-6">
            <div className="font-serif text-3xl">{count}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {veda} Veda
            </div>
          </div>
        ))}
      </section>

      <section className="mt-24 space-y-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl tracking-tight">Also in the library</h2>
        </div>

        <div className="rounded-2xl border border-border p-6 md:p-8">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Bhagavad Gita · {gitaIndex.length} chapters · {GITA_TOTAL_VERSES} verses
            </p>
            <Link to="/gita" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Open →
            </Link>
          </div>
          <h3 className="mt-2 font-serif text-3xl tracking-tight">
            The Song of the Lord
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            All 18 chapters of the Shrimad Bhagavad Gita in Sanskrit with
            transliteration and English translation — Arjuna's dilemma, the
            yogas of knowledge, action and devotion, and the vision of the
            cosmic form.
          </p>
        </div>

        {PURANA_CARDS.map((slug) => {
          const idx = getPuranaIndex(slug);
          const meta = PURANA_META[slug];
          return (
            <div key={slug} className="rounded-2xl border border-border p-6 md:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {meta.name} · {idx.totalChapters} chapters
                </p>
                <Link
                  to={`/${slug}` as never}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Open →
                </Link>
              </div>
              <h3 className="mt-2 font-serif text-3xl tracking-tight">
                {meta.tagline}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {meta.blurb}
              </p>
              {idx.sections.length > 1 && (
                <ul className="mt-6 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 md:grid-cols-3">
                  {idx.sections.map((s) => (
                    <li key={s.key} className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-1">
                      <span className="truncate">{s.label}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {s.chapters.length}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <section className="mt-20 grid gap-10 md:grid-cols-3">
        {[
          { h: "Read", p: "A single-column reader with adjustable type, line spacing, and a sepia mode for long sessions." },
          { h: "Browse", p: "All 108 Upanishads grouped by Veda, with a filter that finds any title in a keystroke." },
          { h: "Return", p: "Your place in each Upanishad is remembered locally so you can pick up where you left off." },
        ].map((f) => (
          <div key={f.h}>
            <h3 className="text-base font-medium">{f.h}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.p}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
