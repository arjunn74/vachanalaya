import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getNeighbors, getUpanishad } from "@/data/upanishads";
import { TextReader } from "@/components/reader/text-reader";

export const Route = createFileRoute("/upanishads/$slug")({
  loader: ({ params }) => {
    const u = getUpanishad(params.slug);
    if (!u) throw notFound();
    return { upanishad: u };
  },
  head: ({ loaderData }) => {
    const t = loaderData?.upanishad;
    const title = t ? `${t.title} — Vachanalaya` : "Upanishad — Vachanalaya";
    const desc = t
      ? `Read the ${t.title} (${t.veda} Veda) in English translation on Vachanalaya.`
      : "Read the Upanishads on Vachanalaya.";
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
      <p className="mt-2 text-muted-foreground">That Upanishad isn't in the library.</p>
      <Link to="/upanishads" className="mt-6 inline-block text-primary underline-offset-4 hover:underline">
        Back to the library
      </Link>
    </div>
  ),
});

function Reader() {
  const { upanishad } = Route.useLoaderData();
  const { prev, next } = getNeighbors(upanishad.id);

  return (
    <TextReader
      storageKey={`vachanalaya:progress:${upanishad.id}`}
      libraryTo="/upanishads"
      libraryLabel="Library"
      eyebrow={`${upanishad.veda} Veda · No. ${upanishad.number}`}
      title={upanishad.title}
      verses={upanishad.verses}
      prev={
        prev
          ? {
              to: "/upanishads/$slug",
              params: { slug: prev.id },
              label: prev.title,
            }
          : undefined
      }
      next={
        next
          ? {
              to: "/upanishads/$slug",
              params: { slug: next.id },
              label: next.title,
            }
          : undefined
      }
    />
  );
}
