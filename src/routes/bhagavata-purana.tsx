import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/bhagavata-purana")({
  component: () => <Outlet />,
});
