import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/brahma-purana")({
  component: () => <Outlet />,
});
