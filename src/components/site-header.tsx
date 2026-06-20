import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useAppTheme } from "@/hooks/use-app-theme";

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle, hydrated } = useAppTheme();

  const isReader = /^\/(upanishads|shiva-purana)\/[^/]+$/.test(pathname);
  if (isReader) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <Link to="/" className="group flex items-baseline gap-1.5">
          <span className="font-serif text-xl tracking-tight">Vachanalaya</span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary transition-transform group-hover:scale-125" />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          <Link
            to="/upanishads"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Upanishads
          </Link>
          <Link
            to="/shiva-purana"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Shiva Purana
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {hydrated && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
