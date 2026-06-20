import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  getShivaChapter,
  getShivaNeighbors,
  SHIVA_SECTION_META,
} from "@/data/shiva-purana";
import { TextReader } from "@/components/reader/text-reader";

export const Route = createFileRoute("/shiva-purana/$slug")({
  loader: ({ params }) => {
    const c = getShivaChapter(params.slug);
    if (!c) throw notFound();
    return { chapter: c };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.chapter;
    const secKey = c?.section as keyof typeof SHIVA_SECTION_META | undefined;
    const title = c && secKey
      ? `${c.title} — ${SHIVA_SECTION_META[secKey].full} — Vachanalaya`
      : "Shiva Purana — Vachanalaya";
    const desc = c && secKey
      ? `Read “${c.title}” from the ${SHIVA_SECTION_META[secKey].full} of the Shiva Purana in English translation.`
      : "Read the Shiva Purana on Vachanalaya.";
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
        to="/shiva-purana"
        className="mt-6 inline-block text-primary underline-offset-4 hover:underline"
      >
        Back to the Shiva Purana
      </Link>
    </div>
  ),
});

function Reader() {
  const { chapter } = Route.useLoaderData();
  const { prev, next } = getShivaNeighbors(chapter.id);
  const meta = SHIVA_SECTION_META[chapter.section as keyof typeof SHIVA_SECTION_META];

  return (
    <TextReader
      storageKey={`vachanalaya:progress:shiva:${chapter.id}`}
      libraryTo="/shiva-purana"
      libraryLabel="Shiva Purana"
      eyebrow={`${meta.full} · Chapter ${chapter.number}`}
      title={chapter.title}
      verses={chapter.verses}
      prev={
        prev
          ? {
              to: "/shiva-purana/$slug",
              params: { slug: prev.id },
              label: prev.title,
            }
          : undefined
      }
      next={
        next
          ? {
              to: "/shiva-purana/$slug",
              params: { slug: next.id },
              label: next.title,
            }
          : undefined
      }
    />
  );
}
