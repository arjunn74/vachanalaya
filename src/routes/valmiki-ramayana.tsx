import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/valmiki-ramayana")({
  component: () => <Outlet />,
});
