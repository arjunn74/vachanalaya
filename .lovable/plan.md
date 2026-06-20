## Vachanalaya — MVP plan

A modern, minimal reading app for the 108 Upanishads (English). No accounts in this milestone — bookmarks and progress are stored in `localStorage` and can be promoted to Lovable Cloud later when more texts (Vedas, Bhagavatam, Gita) are added.

### What we'll build

1. **Offline PDF → structured data pipeline** (run once during development)
   - Parse `108-Upanishads-English.pdf` (1,437 pages, clean TOC by Veda group: Rig, Shukla Yajur, Krishna Yajur, Sama, Atharva).
   - Extract the Table of Contents to get all 108 Upanishad titles + start pages.
   - Split body text by page ranges into one JSON record per Upanishad with: `id` (slug), `number` (1–108), `title`, `veda` (group), `pages` (start/end), `verses[]` (paragraph blocks with their original section markers like `II-i-4`).
   - Output: `src/data/upanishads.json` (text) + `src/data/upanishads-index.json` (lightweight list for browse).
   - The original PDF is **not** shipped — text only, keeping the bundle small and the reader fast.

2. **App shell & routes** (TanStack Start)
   - `/` — landing: brand intro, search/filter input, count of texts, link into the library.
   - `/upanishads` — browse all 108, grouped by Veda with collapsible sections, filter-as-you-type, shows number + title + veda chip.
   - `/upanishads/$slug` — reader for a single Upanishad.
   - Shared minimal top bar: wordmark "Vachanalaya" + nav + theme toggle.
   - Per-route SEO (`head()`) with unique title/description.

3. **Reader experience** (`/upanishads/$slug`)
   - Centered single column, generous line-height, max ~68ch.
   - Sticky compact header: Upanishad title, Veda group, prev/next navigation between Upanishads.
   - Reader controls (popover): font family (serif / sans), font size (S/M/L/XL), line spacing, light / sepia / dark theme.
   - Verse blocks preserve their section ids (e.g. `II-i-4`) as anchorable, copy-friendly markers in the margin.
   - Reading progress bar at top based on scroll position; last-read position per Upanishad saved to `localStorage` and restored on revisit.
   - Keyboard: `←` / `→` for prev/next Upanishad, `j` / `k` to scroll by verse.

4. **Design system — modern & minimal**
   - Palette (light): background `#FAFAF7` ivory, surface `#FFFFFF`, text `#1A1A1A`, muted `#6B6B68`, single accent `#8B1E1E` (deep saffron-red, used sparingly for active states and the wordmark dot).
   - Palette (dark): background `#0F0F0E`, surface `#1A1A18`, text `#F3F1EC`, accent `#D97757`.
   - Sepia reader theme: background `#F5EFE2`, text `#3A2E1F`.
   - Typography: headings in **Fraunces** (variable serif), body in **Inter**, reader-mode serif option **Source Serif 4**. Loaded via `@fontsource` packages (no CDN tags).
   - Tokens defined as semantic CSS variables in `src/styles.css` per existing pattern (no hard-coded color utilities in components).
   - Components from existing shadcn set: `button`, `input`, `popover`, `toggle-group`, `tabs`, `separator`, `scroll-area`, `command` (for browse filter).

5. **Future-proofing** (structure only, not implemented this milestone)
   - `src/data/texts/` namespace with one file per scripture so adding Gita/Vedas/Bhagavatam is just dropping in another JSON and listing it in a registry.
   - Reader is fed by a generic `Text` shape (`{ id, title, tradition, sections[] }`) so it works for any future text without rewrites.

### Technical details

**PDF parsing** — one-off Python script `scripts/parse_upanishads.py` using `pypdf`:
- Read pages 2–6 (the TOC) → regex `^(\d+)\.\s*(.+?)\.+\s*(\d+)$` to capture `[number, title, startPage]`. Track current Veda heading (`RIG-VEDA`, `SHUKLA-YAJUR-VEDA`, etc.) as it appears.
- Compute `endPage[i] = startPage[i+1] - 1`; last Upanishad ends at `len(pages) - 1`.
- For each Upanishad: concatenate page text, strip the running header (Veda name) and page numbers, split on the section-id regex `^([IVX]+(?:-[ivx]+)?(?:-\d+)?[\.:])` to produce `verses[]`. Fall back to paragraph splitting when no section ids are present.
- Slug = kebab-case of title (e.g. `aitareya`, `isha`). Write `src/data/upanishads.json` and the trimmed `src/data/upanishads-index.json`.
- Script lives in `scripts/` and is **not** part of the runtime — only re-run if source changes.

**Data shape**
```ts
type Upanishad = {
  id: string;           // "aitareya"
  number: number;       // 1..108
  title: string;        // "Aitareya Upanishad"
  veda: "Rig" | "Shukla Yajur" | "Krishna Yajur" | "Sama" | "Atharva";
  verses: { id?: string; text: string }[];
};
```

**Routes**
```text
src/routes/
  __root.tsx                    // shell + theme provider + header
  index.tsx                     // landing
  upanishads.tsx                // layout: <Outlet />
  upanishads.index.tsx          // browse + filter
  upanishads.$slug.tsx          // reader (loader reads from imported JSON)
```

**State**
- Reader preferences (`fontFamily`, `fontSize`, `lineHeight`, `theme`) → `localStorage` key `vachanalaya:reader-prefs`, hydrated through a small `useReaderPrefs` hook.
- Last-read scroll position per slug → `localStorage` key `vachanalaya:progress:<slug>`.
- Theme toggle attaches/removes `.dark` and `data-reader-theme="sepia"` on `<html>`.

**Out of scope (deferred to later milestones)**
- Full-text search across Upanishads (will add with a prebuilt MiniSearch index next).
- User accounts, cross-device sync, notes/highlights.
- Sanskrit / Devanagari source text, audio recitations, additional scriptures.

### Deliverables this milestone

- Parsing script + generated JSON for all 108 Upanishads.
- Landing, browse, and reader routes with the design system above.
- Reader controls (font, size, spacing, theme) persisted locally.
- Prev/next navigation and resume-where-you-left-off per Upanishad.
