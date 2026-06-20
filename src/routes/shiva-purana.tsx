import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/shiva-purana")({
  component: () => <Outlet />,
});
