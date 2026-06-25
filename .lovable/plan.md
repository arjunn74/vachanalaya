# Add Valmiki Ramayana

Ship the full Valmiki Ramayana — 7 kandas, ~600 sargas, ~24,000 shlokas — as a new top-level text alongside Upanishads, Gita, and the three Puranas. Devanagari from the `jayeshmepani/HinduScriptures` repo (already a clean JSON dataset), English translation paired in from a separate source.

## Source pairing

- **Sanskrit (Devanagari):** `jayeshmepani/HinduScriptures` → `DharmicData/Ramayanas/ValmikiRamayana/{1..7}.json`. Each entry: `{ kaanda, sarg, shloka, text }`. Already validated against the repo.
- **English translation:** `valmikiramayan.net` (KMK Murthy / Desiraju Hanumanta Rao verse-by-verse translation). It has a stable per-sarga URL pattern (`/utf8/baala/sarga1/bala_1_frame.htm` etc.) with `<dl>`-style Sanskrit/translation pairs that scrape cleanly into shloka-aligned English.
  - Fallback if a sarga fails to scrape (encoding issue / missing page): use Ralph T. H. Griffith's public-domain prose translation from sacred-texts.com keyed at the sarga level. English text is still shown, just not aligned per shloka.
  - Attribution line on every reader page and on the browse page.

If neither source yields English for a sarga, the reader still renders the Devanagari and shows a small "Translation unavailable for this sarga" note rather than failing.

## What gets built

### 1. Build script (`scripts/build_ramayana.py`)

One-off Python script (mirrors `scripts/build_puranas.py`):

1. Fetch the 7 ValmikiRamayana JSONs from the GitHub raw URLs, normalize Devanagari (strip stray control chars, collapse whitespace inside a shloka).
2. For each `(kaanda, sarg)`, fetch the corresponding valmikiramayan.net page, parse with `BeautifulSoup`, walk shloka-translation pairs, and attach `english` to each shloka by index. Cache raw HTML under `scripts/.cache/ramayana/` so re-runs are cheap.
3. On parse failure, fetch the Griffith sarga page and attach a single `englishProse` field at the sarga level.
4. Emit per-sarga JSON files to `public/data/valmiki-ramayana/{kaanda}-{sarg}.json` and a top-level `index.json` with `{ kaandas: [{ id, title, englishTitle, sargas: [{ number, title, shlokaCount }] }], totals }`.
5. Emit `src/data/valmiki-ramayana.json` (lightweight: kanda + sarga list only) for fast import on the browse page.

The PDF/large raw JSONs are **not** shipped — only the parsed per-sarga JSON in `public/data/`.

### 2. Data layer (`src/lib/ramayana.ts`)

Typed accessors mirroring `src/lib/purana.ts`:

```ts
export type Kaanda =
  | "balakanda" | "ayodhyakanda" | "aranyakanda"
  | "kishkindhakanda" | "sundarakanda" | "yuddhakanda" | "uttarakanda";

export type RamayanaShloka = {
  number: number;
  sanskrit: string;           // Devanagari
  english?: string;           // verse-aligned when available
};

export type RamayanaSarga = {
  kaanda: Kaanda;
  number: number;             // sarga within kaanda
  globalNumber: number;       // 1..N across all 7 kaandas, for prev/next
  title: string;              // "Bala Kanda — Sarga 1"
  shlokas: RamayanaShloka[];
  englishProse?: string;      // Griffith fallback when verse-by-verse missing
  source: { sanskrit: string; english: string };
};

export const KAANDA_ORDER: Kaanda[];
export function getSargaSlug(k: Kaanda, n: number): string;
export async function loadSarga(slug: string): Promise<RamayanaSarga>;
export function getNeighbors(slug: string): { prev?: string; next?: string };
```

`loadSarga` does a `fetch('/data/valmiki-ramayana/${slug}.json')` so the 24k-shloka payload stays out of the JS bundle (same pattern as the Puranas).

### 3. Routes

```
src/routes/
  valmiki-ramayana.tsx         // layout: <Outlet />
  valmiki-ramayana.index.tsx   // browse: search + filter by kaanda, sargas grouped by kaanda
  valmiki-ramayana.$slug.tsx   // reader
```

Each with its own `head()` (title, description, og:title, og:description).

### 4. Reader

Reuse `src/components/purana/purana-reader.tsx` as the base, but extend it to render **two stacked lines per shloka**:

- Devanagari (serif, slightly larger)
- English translation (sans, muted, indented)

Same scroll progress bar, sticky header, prefs popover (font size, theme), keyboard ←/→ prev/next, `localStorage` resume — all unchanged.

If `englishProse` is present instead of per-shloka English, render Devanagari shloka list followed by a single prose block under a "Translation (Griffith)" sub-heading.

### 5. Browse page

Reuse `src/components/purana/purana-browse.tsx` shape:

- Search box (matches sarga title and number across kaandas)
- Kaanda filter chips (All / Bala / Ayodhya / Aranya / Kishkindha / Sundara / Yuddha / Uttara)
- Sargas grouped by kaanda, each row shows sarga number, title, shloka count

### 6. Navigation & landing

- `src/components/site-header.tsx`: add **Ramayana** link between Gita and Shiva.
- `src/routes/index.tsx`: add a "Valmiki Ramayana" card with kaanda + sarga + shloka counts linking to `/valmiki-ramayana`.
- `src/routes/about.tsx`: append Valmiki Ramayana to the "What's inside" list.

## Out of scope

- Sanskrit transliteration (IAST/Harvard-Kyoto).
- Word-by-word glossary / commentary.
- Other Ramayanas in the source repo (Adhyatma, Ananda, Bhushundi, Ramcharitmanas, Yoga Vasistha) — separate milestones.
- Cross-text full-text search (still per-text).

## Deliverables

- `scripts/build_ramayana.py` + generated `public/data/valmiki-ramayana/*.json` and `src/data/valmiki-ramayana.json`.
- `src/lib/ramayana.ts` typed accessors.
- `src/routes/valmiki-ramayana.{tsx,index.tsx,$slug.tsx}`.
- Reader extended to render Devanagari + English shloka pairs (Purana reader stays backwards-compatible).
- Header, landing page, About page updated to surface the new text.
