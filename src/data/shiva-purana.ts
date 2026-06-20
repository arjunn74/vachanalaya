import indexData from "./shiva-purana-index.json";
import allData from "./shiva-purana.json";

export type ShivaSection =
  | "glory"
  | "vidyesvara"
  | "creation"
  | "sati"
  | "parvati"
  | "kumara"
  | "yuddha";

export type ShivaChapterIndexEntry = {
  id: string;
  section: ShivaSection;
  sectionShort: string;
  sectionFull: string;
  number: number;
  globalNumber: number;
  title: string;
  verseCount: number;
};

export type ShivaVerse = { text: string };

export type ShivaChapter = {
  id: string;
  section: ShivaSection;
  sectionShort: string;
  sectionFull: string;
  number: number;
  globalNumber: number;
  title: string;
  verses: ShivaVerse[];
};

export const shivaIndex = indexData as ShivaChapterIndexEntry[];
export const shivaChapters = allData as ShivaChapter[];

export const SHIVA_SECTION_ORDER: ShivaSection[] = [
  "glory",
  "vidyesvara",
  "creation",
  "sati",
  "parvati",
  "kumara",
  "yuddha",
];

export const SHIVA_SECTION_META: Record<
  ShivaSection,
  { short: string; full: string; blurb: string }
> = {
  glory: {
    short: "Mahatmya",
    full: "The Glory of Sivapurana",
    blurb: "Seven chapters on the merit of hearing the Purana.",
  },
  vidyesvara: {
    short: "Vidyesvara",
    full: "Vidyesvara Samhita",
    blurb: "On the worship of the phallic emblem and the means of liberation.",
  },
  creation: {
    short: "Creation",
    full: "Rudra Samhita — Creation",
    blurb: "The cosmogony, the dispute of Brahma and Vishnu, the rise of Rudra.",
  },
  sati: {
    short: "Sati",
    full: "Rudra Samhita — Sati",
    blurb: "The marriage of Siva and Sati and the destruction of Daksha's sacrifice.",
  },
  parvati: {
    short: "Parvati",
    full: "Rudra Samhita — Parvati",
    blurb: "Parvati's birth, penance, and union with Siva.",
  },
  kumara: {
    short: "Kumara",
    full: "Rudra Samhita — Kumara",
    blurb: "The dalliance of Siva and the birth of Ganesha and Skanda.",
  },
  yuddha: {
    short: "Yuddha",
    full: "Rudra Samhita — The Battles",
    blurb: "The wars of Siva against Tripura, Jalandhara, and other Asuras.",
  },
};

export function getShivaChapter(slug: string): ShivaChapter | undefined {
  return shivaChapters.find((c) => c.id === slug);
}

export function getShivaNeighbors(slug: string) {
  const i = shivaChapters.findIndex((c) => c.id === slug);
  if (i === -1) return { prev: undefined, next: undefined };
  return {
    prev: i > 0 ? shivaChapters[i - 1] : undefined,
    next: i < shivaChapters.length - 1 ? shivaChapters[i + 1] : undefined,
  };
}
