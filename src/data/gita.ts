import indexData from "./gita-index.json";
import allData from "./gita.json";

export type GitaVerse = {
  id: string;
  sanskrit: string;
  transliteration: string;
  english: string;
  hindi: string;
};

export type GitaChapterIndexEntry = {
  id: string;
  number: number;
  name: string;
  translation: string;
  transliteration: string;
  meaning: string;
  verseCount: number;
};

export type GitaChapter = {
  id: string;
  number: number;
  name: string;
  translation: string;
  transliteration: string;
  meaning: string;
  summary: string;
  verses: GitaVerse[];
};

export const gitaIndex = indexData as GitaChapterIndexEntry[];
export const gitaChapters = allData as GitaChapter[];

export function getGitaChapter(slug: string): GitaChapter | undefined {
  return gitaChapters.find((c) => c.id === slug);
}

export function getGitaNeighbors(slug: string) {
  const i = gitaChapters.findIndex((c) => c.id === slug);
  if (i === -1) return { prev: undefined, next: undefined };
  return {
    prev: i > 0 ? gitaChapters[i - 1] : undefined,
    next: i < gitaChapters.length - 1 ? gitaChapters[i + 1] : undefined,
  };
}

export const GITA_TOTAL_VERSES = gitaIndex.reduce(
  (n, c) => n + c.verseCount,
  0,
);
