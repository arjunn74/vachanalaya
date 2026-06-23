import { createFileRoute } from "@tanstack/react-router";
import { PuranaBrowse } from "@/components/purana/purana-browse";
import { PURANA_META } from "@/lib/purana";

const meta = PURANA_META["bhagavata-purana"];

export const Route = createFileRoute("/bhagavata-purana/")({
  head: () => ({
    meta: [
      { title: `${meta.name} — Vachanalaya` },
      { name: "description", content: meta.blurb },
      { property: "og:title", content: `${meta.name} — Vachanalaya` },
      { property: "og:description", content: meta.blurb },
    ],
  }),
  component: () => <PuranaBrowse slug="bhagavata-purana" />,
});
