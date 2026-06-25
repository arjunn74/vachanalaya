import { createFileRoute } from "@tanstack/react-router";
import { PuranaBrowse } from "@/components/purana/purana-browse";
import { PURANA_META } from "@/lib/purana";

const meta = PURANA_META["valmiki-ramayana"];

export const Route = createFileRoute("/valmiki-ramayana/")({
  head: () => ({
    meta: [
      { title: `${meta.name} — Vachanalaya` },
      { name: "description", content: meta.blurb },
      { property: "og:title", content: `${meta.name} — Vachanalaya` },
      { property: "og:description", content: meta.blurb },
    ],
  }),
  component: () => <PuranaBrowse slug="valmiki-ramayana" />,
});
