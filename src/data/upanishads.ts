import indexData from "./upanishads-index.json";
import allData from "./upanishads.json";

export type Veda = "Rig" | "Shukla Yajur" | "Krishna Yajur" | "Sama" | "Atharva";

export type UpanishadIndexEntry = {
  id: string;
  number: number;
  title: string;
  veda: Veda;
  verseCount: number;
};

export type Verse = { id?: string; text: string };

export type Upanishad = {
  id: string;
  number: number;
  title: string;
  veda: Veda;
  verses: Verse[];
};

export const upanishadIndex = indexData as UpanishadIndexEntry[];
export const upanishads = allData as Upanishad[];

export const VEDA_ORDER: Veda[] = ["Rig", "Shukla Yajur", "Krishna Yajur", "Sama", "Atharva"];

export function getUpanishad(slug: string): Upanishad | undefined {
  return upanishads.find((u) => u.id === slug);
}

export function getNeighbors(slug: string) {
  const i = upanishads.findIndex((u) => u.id === slug);
  if (i === -1) return { prev: undefined, next: undefined };
  return {
    prev: i > 0 ? upanishads[i - 1] : undefined,
    next: i < upanishads.length - 1 ? upanishads[i + 1] : undefined,
  };
}
