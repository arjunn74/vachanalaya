import indexData from "./gita-index.json";
import allData from "./gita.json";

export type GitaVerse = { id?: string; text: string };

export type GitaChapter = {
  id: string;
  number: number;
  title: string;
  verses: GitaVerse[];
};

export type GitaIndexEntry = {
  id: string;
  number: number;
  title: string;
  verseCount: number;
};

export const gitaIndex = indexData as GitaIndexEntry[];
export const gita = allData as GitaChapter[];

export function getChapter(slug: string): GitaChapter | undefined {
  return gita.find((c) => c.id === slug);
}

export function getGitaNeighbors(slug: string) {
  const i = gita.findIndex((c) => c.id === slug);
  if (i === -1) return { prev: undefined, next: undefined };
  return {
    prev: i > 0 ? gita[i - 1] : undefined,
    next: i < gita.length - 1 ? gita[i + 1] : undefined,
  };
}
