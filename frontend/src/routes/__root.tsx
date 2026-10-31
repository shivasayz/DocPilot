import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useMatch,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { Toaster } from "@/components/ui/sonner";
import { getToken, logout } from "@/lib/auth";
import { initTheme } from "@/lib/theme";
import { setUnauthorizedHandler } from "@/lib/api";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold tracking-tight">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We couldn't find that page.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DocPilot — Ask your documents" },
      {
        name: "description",
        content:
          "An AI-powered learning copilot that ingests your knowledge sources and helps you learn faster.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const isLogin = useMatch({ from: "/login", shouldThrow: false });
  const isSignup = useMatch({ from: "/signup", shouldThrow: false });
  const isForgot = useMatch({ from: "/forgot-password", shouldThrow: false });

  const isAuthPage = !!(isLogin || isSignup || isForgot);
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    initTheme();
    setUnauthorizedHandler(() => {
      logout();
      setAuthenticated(false);
      sessionStorage.setItem("docpilot.session.expired", "1");
      window.location.assign("/login");
    });

    const token = getToken();
    if (!isAuthPage && !token) {
      router.navigate({ to: "/login" });
    } else {
      setAuthenticated(!!token);
    }
    setReady(true);
  }, [isAuthPage, router]);

  if (!ready) return null;

  if (isAuthPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster />
      </QueryClientProvider>
    );
  }

  if (!authenticated) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav />
          <main className="flex-1 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}
