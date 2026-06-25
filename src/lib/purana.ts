import shivaIndex from "@/data/puranas/shiva-purana.json";
import bhagavataIndex from "@/data/puranas/bhagavata-purana.json";
import brahmaIndex from "@/data/puranas/brahma-purana.json";
import valmikiIndex from "@/data/puranas/valmiki-ramayana.json";

export type PuranaSlug =
  | "shiva-purana"
  | "bhagavata-purana"
  | "brahma-purana"
  | "valmiki-ramayana";

export type PuranaChapterMeta = {
  id: string;
  number: number;
  title: string;
  verseCount: number;
};

export type PuranaSection = {
  key: string;
  label: string;
  chapters: PuranaChapterMeta[];
};

export type PuranaIndex = {
  slug: PuranaSlug;
  name: string;
  totalChapters: number;
  totalVerses: number;
  sections: PuranaSection[];
  order: string[];
};

export type PuranaVerse = {
  id?: string;
  sanskrit?: string;
  transliteration?: string;
  text?: string;
};

export type PuranaChapter = {
  id: string;
  section: string;
  sectionLabel: string;
  number: number;
  title: string;
  verses: PuranaVerse[];
};

const INDEXES: Record<PuranaSlug, PuranaIndex> = {
  "shiva-purana": shivaIndex as PuranaIndex,
  "bhagavata-purana": bhagavataIndex as PuranaIndex,
  "brahma-purana": brahmaIndex as PuranaIndex,
  "valmiki-ramayana": valmikiIndex as PuranaIndex,
};

export const PURANA_META: Record<
  PuranaSlug,
  { name: string; tagline: string; blurb: string }
> = {
  "shiva-purana": {
    name: "Shiva Purana",
    tagline: "Seven Samhitas",
    blurb:
      "The Mahapurana of Shiva — from the Vishweshwara Samhita through the Vayaviya, including the five khandas of the Rudra Samhita.",
  },
  "bhagavata-purana": {
    name: "Shrimad Bhagavata Mahapurana",
    tagline: "Twelve Skandhas",
    blurb:
      "The Bhagavata in Devanagari with romanized transliteration and English translation, across all twelve Skandhas.",
  },
  "brahma-purana": {
    name: "Brahma Purana",
    tagline: "Adi Purana",
    blurb:
      "The first of the Mahapuranas, narrated by Brahma — cosmology, tirthas of Orissa, and the deeds of the gods.",
  },
  "valmiki-ramayana": {
    name: "Valmiki Ramayana",
    tagline: "Seven Kandas",
    blurb:
      "The Adi Kavya of Maharishi Valmiki — Devanagari with verse-by-verse English translation, from Bala Kanda through Uttara Kanda.",
  },
};

export function getPuranaIndex(slug: PuranaSlug): PuranaIndex {
  return INDEXES[slug];
}

export function getPuranaNeighbors(slug: PuranaSlug, chapterId: string) {
  const idx = INDEXES[slug];
  const i = idx.order.indexOf(chapterId);
  if (i === -1) return { prev: undefined, next: undefined };
  const prevId = i > 0 ? idx.order[i - 1] : undefined;
  const nextId = i < idx.order.length - 1 ? idx.order[i + 1] : undefined;
  const find = (id?: string) => {
    if (!id) return undefined;
    for (const s of idx.sections) {
      const c = s.chapters.find((c) => c.id === id);
      if (c) return { id, title: c.title, sectionLabel: s.label, number: c.number };
    }
    return undefined;
  };
  return { prev: find(prevId), next: find(nextId) };
}

export async function fetchPuranaChapter(
  slug: PuranaSlug,
  chapterId: string,
): Promise<PuranaChapter> {
  const res = await fetch(`/data/${slug}/${chapterId}.json`);
  if (!res.ok) throw new Error(`Chapter not found: ${chapterId}`);
  return (await res.json()) as PuranaChapter;
}
