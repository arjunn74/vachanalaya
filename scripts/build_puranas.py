import json, os, re, pathlib, html

SRC = "/tmp/hs/DharmicData/Purana"
OUT = "public/data"

PURANAS = [
    ("shiva-purana", "Shiva Purana", "Shiva Purana"),
    ("bhagavata-purana", "Shrimad Bhagavata Mahapurana", "Bhagavata Purana"),
    ("brahma-purana", "Brahma Purana", "Brahma Purana"),
]

def slugify(s):
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s

def chapter_num(fname):
    m = re.match(r"(\d+)", fname)
    return int(m.group(1)) if m else 0

def strip_html(s):
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(s)

def normalize_verses(raw):
    """raw: list of dicts. Returns list of ReaderVerse-compat dicts."""
    out = []
    for i, v in enumerate(raw):
        if not isinstance(v, dict):
            continue
        if "devanagari" in v or "translation" in v:
            out.append({
                "id": str(v.get("verse", i + 1)),
                "sanskrit": strip_html(v.get("devanagari", "")).strip() or None,
                "transliteration": (v.get("english_devnagari") or "").strip() or None,
                "text": strip_html(v.get("translation", "")).strip(),
            })
        elif "text" in v:
            txt = strip_html(v["text"]).strip()
            out.append({"sanskrit": txt, "text": ""})
    return [{k: val for k, val in v.items() if val} for v in out]

def walk_sections(root):
    """Return ordered list of (section_key, section_label, [(num, json_path)])."""
    sections = []
    # Top-level dirs sorted
    for top in sorted(os.listdir(root)):
        tp = os.path.join(root, top)
        if not os.path.isdir(tp):
            continue
        # Check if contains .json directly or subdirs
        jsons = [f for f in os.listdir(tp) if f.endswith(".json")]
        subdirs = [d for d in os.listdir(tp) if os.path.isdir(os.path.join(tp, d))]
        if jsons:
            files = sorted(((chapter_num(f), os.path.join(tp, f)) for f in jsons), key=lambda x: x[0])
            sections.append((slugify(top), top, files))
        if subdirs:
            for sub in sorted(subdirs):
                sp = os.path.join(tp, sub)
                sjsons = [f for f in os.listdir(sp) if f.endswith(".json")]
                if sjsons:
                    files = sorted(((chapter_num(f), os.path.join(sp, f)) for f in sjsons), key=lambda x: x[0])
                    label = f"{top} / {sub}"
                    sections.append((slugify(f"{top}-{sub}"), label, files))
    return sections

def has_only_flat_chapters(root):
    return any(f.endswith(".json") for f in os.listdir(root))

for slug, name, folder in PURANAS:
    root = os.path.join(SRC, folder)
    out_dir = os.path.join(OUT, slug)
    pathlib.Path(out_dir).mkdir(parents=True, exist_ok=True)

    # Flat case: brahma purana
    jsons = [f for f in os.listdir(root) if f.endswith(".json")]
    if jsons:
        sections = [("chapters", "Chapters", sorted(((chapter_num(f), os.path.join(root, f)) for f in jsons), key=lambda x: x[0]))]
    else:
        sections = walk_sections(root)

    index_sections = []
    flat_order = []  # list of chapter slugs in order, for prev/next
    total_chapters = 0
    total_verses = 0

    for sec_key, sec_label, files in sections:
        chapters_meta = []
        for n, path in files:
            with open(path, encoding="utf-8") as f:
                raw = json.load(f)
            verses = normalize_verses(raw if isinstance(raw, list) else [raw])
            chapter_slug = f"{sec_key}-{n}"
            chapter_obj = {
                "id": chapter_slug,
                "section": sec_key,
                "sectionLabel": sec_label,
                "number": n,
                "title": f"Chapter {n}",
                "verses": verses,
            }
            # write chapter file
            with open(os.path.join(out_dir, f"{chapter_slug}.json"), "w", encoding="utf-8") as f:
                json.dump(chapter_obj, f, ensure_ascii=False)
            chapters_meta.append({"id": chapter_slug, "number": n, "title": chapter_obj["title"], "verseCount": len(verses)})
            flat_order.append(chapter_slug)
            total_chapters += 1
            total_verses += len(verses)
        index_sections.append({"key": sec_key, "label": sec_label, "chapters": chapters_meta})

    index = {
        "slug": slug,
        "name": name,
        "totalChapters": total_chapters,
        "totalVerses": total_verses,
        "sections": index_sections,
        "order": flat_order,
    }
    with open(os.path.join(out_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False)
    print(slug, "->", total_chapters, "chapters,", total_verses, "verses")

