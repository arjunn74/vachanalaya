import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getGitaChapter, getGitaNeighbors } from "@/data/gita";
import { TextReader, type ReaderVerse } from "@/components/reader/text-reader";

export const Route = createFileRoute("/gita/$slug")({
  loader: ({ params }) => {
    const c = getGitaChapter(params.slug);
    if (!c) throw notFound();
    return { chapter: c };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.chapter;
    const title = c
      ? `Chapter ${c.number} — ${c.transliteration} — Bhagavad Gita — Vachanalaya`
      : "Bhagavad Gita — Vachanalaya";
    const desc = c
      ? `${c.translation} (${c.meaning}). Read all ${c.verses.length} verses of chapter ${c.number} of the Shrimad Bhagavad Gita.`
      : "Read the Shrimad Bhagavad Gita on Vachanalaya.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: Reader,
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="font-serif text-3xl">Not found</h1>
      <p className="mt-2 text-muted-foreground">
        That chapter isn't in the library.
      </p>
      <Link
        to="/gita"
        className="mt-6 inline-block text-primary underline-offset-4 hover:underline"
      >
        Back to the Bhagavad Gita
      </Link>
    </div>
  ),
});

function Reader() {
  const { chapter } = Route.useLoaderData();
  const { prev, next } = getGitaNeighbors(chapter.id);

  const verses: ReaderVerse[] = chapter.verses.map((v) => ({
    id: v.id,
    sanskrit: v.sanskrit,
    transliteration: v.transliteration,
    text: v.english || v.hindi,
  }));

  return (
    <TextReader
      storageKey={`vachanalaya:progress:gita:${chapter.id}`}
      libraryTo="/gita"
      libraryLabel="Bhagavad Gita"
      eyebrow={`Bhagavad Gita · Chapter ${chapter.number} · ${chapter.translation}`}
      title={chapter.transliteration}
      verses={verses}
      prev={
        prev
          ? {
              to: "/gita/$slug",
              params: { slug: prev.id },
              label: `Chapter ${prev.number} — ${prev.transliteration}`,
            }
          : undefined
      }
      next={
        next
          ? {
              to: "/gita/$slug",
              params: { slug: next.id },
              label: `Chapter ${next.number} — ${next.transliteration}`,
            }
          : undefined
      }
    />
  );
}
