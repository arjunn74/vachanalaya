import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { TextReader } from "@/components/reader/text-reader";
import {
  fetchPuranaChapter,
  getPuranaNeighbors,
  PURANA_META,
  type PuranaChapter,
  type PuranaSlug,
} from "@/lib/purana";

export function PuranaReader({
  slug,
  chapterId,
}: {
  slug: PuranaSlug;
  chapterId: string;
}) {
  const [chapter, setChapter] = useState<PuranaChapter | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setChapter(null);
    setError(null);
    fetchPuranaChapter(slug, chapterId)
      .then((c) => {
        if (!cancelled) setChapter(c);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [slug, chapterId]);

  const meta = PURANA_META[slug];
  const { prev, next } = getPuranaNeighbors(slug, chapterId);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-serif text-3xl">Couldn't load chapter</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Link
          to={`/${slug}` as never}
          className="mt-6 inline-block text-primary underline-offset-4 hover:underline"
        >
          Back to {meta.name}
        </Link>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <TextReader
      storageKey={`vachanalaya:progress:${slug}:${chapterId}`}
      libraryTo={`/${slug}`}
      libraryLabel={meta.name}
      eyebrow={`${chapter.sectionLabel} · Chapter ${chapter.number}`}
      title={chapter.title}
      verses={chapter.verses.map((v) => ({ ...v, text: v.text ?? "" }))}
      prev={
        prev
          ? {
              to: `/${slug}/$slug`,
              params: { slug: prev.id },
              label: `${prev.sectionLabel} · ${prev.title}`,
            }
          : undefined
      }
      next={
        next
          ? {
              to: `/${slug}/$slug`,
              params: { slug: next.id },
              label: `${next.sectionLabel} · ${next.title}`,
            }
          : undefined
      }
    />
  );
}
