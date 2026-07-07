import { useNavigate } from "@tanstack/react-router";
import { Search, Bell, Sun, Moon, Command, User, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";

function GenderAvatar({ gender, initials }: { gender?: string; initials: string }) {
  if (gender === "male") {
    return (
      <Avatar className="size-7">
        <AvatarFallback className="bg-blue-500/15 text-blue-400 text-xs">
          <User className="size-4" />
        </AvatarFallback>
      </Avatar>
    );
  }
  if (gender === "female") {
    return (
      <Avatar className="size-7">
        <AvatarFallback className="bg-pink-500/15 text-pink-400 text-xs">
          <UserRound className="size-4" />
        </AvatarFallback>
      </Avatar>
    );
  }
  return (
    <Avatar className="size-7">
      <AvatarFallback className="bg-accent text-accent-foreground text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function TopNav() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  const displayName = user?.name ?? "User";
  const displayEmail = user?.email ?? "";
  const initials = user?.avatar ?? "?";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border glass px-4 md:px-6">
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search documents, notes, conversations…"
          className="h-9 w-full rounded-md border border-border bg-surface/60 pl-9 pr-16 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-surface"
        />
        <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-flex">
          <Command className="size-3" />K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="relative size-9" aria-label="Notifications">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-muted">
              <GenderAvatar gender={user?.gender} initials={initials} />
              <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm">{displayName}</span>
                <span className="text-xs text-muted-foreground">{displayEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
