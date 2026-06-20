# Add Shiva Purana

Bring the Shiva Purana (Siva Purana, English translation, 1,085 pages) into Vachanalaya alongside the 108 Upanishads, reusing the existing reader and design system.

## Structure of the source

The PDF is organized as:

```
Shiva Purana
├── The Glory of Sivapurana            (7 chapters)
├── Vidyesvara Samhita                 (25 chapters)
├── Rudra Samhita
│   ├── Section I — Creation
│   ├── Section II — Sati
│   ├── Section III — Parvati
│   ├── Section IV — Kumara
│   └── Section V — Yuddha (Battles)
├── Satarudra Samhita
├── Kotirudra Samhita
├── Uma Samhita
├── Kailasa Samhita
└── Vayaviya Samhita (Purvabhaga + Uttarabhaga)
```

Reader unit = one **chapter**. Browse grouping = **Samhita** (with the Rudra/Vayaviya sub-sections shown as sub-headings inside the Rudra/Vayaviya groups).

## What gets built

### 1. Parsing script (`scripts/parse_shiva_purana.py`)

One-off Python script using `pypdf`, mirroring `parse_upanishads.py`:

- Read the TOC (pages 2–5) to capture Samhita headings, optional Section headings ("SECTION I CREATION", etc.), and chapter lines `^(\d+)\.\s*(.+?)\.+\s*(\d+)$`.
- Calibrate the printed-page → PDF-page offset using the first chapter of the Glory section (similar offset-search to the Upanishads parser).
- For each chapter: concatenate pages from its start to the next chapter's start − 1, strip running headers (Samhita/section names) and bare page numbers, collapse soft line breaks, split into paragraph "verses".
- Output:
  - `src/data/shiva-purana.json` — full text
  - `src/data/shiva-purana-index.json` — lightweight list for browse
- The PDF itself is **not** shipped (text only).

### 2. Data layer (`src/data/shiva-purana.ts`)

```ts
export type Samhita =
  | "Glory" | "Vidyesvara" | "Rudra" | "Satarudra"
  | "Kotirudra" | "Uma" | "Kailasa" | "Vayaviya";

export type ShivaChapter = {
  id: string;            // "rudra-sati-17-marriage-of-siva-and-sati"
  number: number;        // chapter # within its section
  globalNumber: number;  // 1..N across whole text, for prev/next ordering
  title: string;
  samhita: Samhita;
  section?: string;      // e.g. "Section II — Sati" or "Purvabhaga"
  verses: { text: string }[];
};
```

Plus `SAMHITA_ORDER`, `getChapter(slug)`, `getNeighbors(slug)`.

### 3. Routes

```
src/routes/
  shiva-purana.tsx           // layout: <Outlet />
  shiva-purana.index.tsx     // browse: search + filter by Samhita, chapters grouped by Samhita (and Section sub-headings)
  shiva-purana.$slug.tsx     // reader (reuses the Upanishad reader UI exactly: scroll progress, sticky title, prefs popover, ←/→ prev-next, localStorage resume)
```

Per-route `head()` SEO with unique title/description.

### 4. Landing & navigation updates

- `src/components/site-header.tsx`: add "Shiva Purana" link next to "Upanishads".
- `src/routes/index.tsx`: add a second card/section under the Upanishad stats summarising the Shiva Purana (Samhita count, chapter count) and linking into `/shiva-purana`.
- `/` head() text unchanged — still introduces the library as a whole.

### 5. Reader reuse (no duplication)

The reader on `/upanishads/$slug` and the new `/shiva-purana/$slug` are visually identical. To avoid drift:

- Extract the existing Upanishad reader body into `src/components/reader/text-reader.tsx` that takes `{ title, eyebrow, verses, prev, next, storageKey }`.
- Both route files become thin wrappers that load their record and render `<TextReader …/>`.
- `use-reader-prefs.ts` and `use-app-theme.ts` are unchanged.

## Out of scope (this milestone)

- Cross-text full-text search (will add MiniSearch once a third text is in).
- Sanskrit/Devanagari source, footnotes, glossary linking.
- User accounts / cross-device progress sync (still `localStorage`).
- Adding Vedas / Gita / Bhagavatam — separate milestones, but the new generic `<TextReader/>` and `src/data/<text>.{json,ts}` pattern make each one a drop-in.

## Deliverables

- `scripts/parse_shiva_purana.py` + generated `src/data/shiva-purana.json` and `…-index.json`.
- `src/data/shiva-purana.ts` typed accessors.
- `src/routes/shiva-purana.tsx`, `shiva-purana.index.tsx`, `shiva-purana.$slug.tsx`.
- `src/components/reader/text-reader.tsx`; `/upanishads/$slug` refactored to use it (no visual change).
- Header + landing page updated to surface the new text.
