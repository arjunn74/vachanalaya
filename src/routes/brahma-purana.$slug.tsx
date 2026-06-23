import { createFileRoute } from "@tanstack/react-router";
import { PuranaReader } from "@/components/purana/purana-reader";

export const Route = createFileRoute("/brahma-purana/$slug")({
  component: Reader,
});

function Reader() {
  const { slug } = Route.useParams();
  return <PuranaReader slug="brahma-purana" chapterId={slug} />;
}
