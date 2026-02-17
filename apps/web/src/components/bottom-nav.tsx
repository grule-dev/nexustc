import {
  Book03Icon,
  GameController03Icon,
  Home07Icon,
  MoreHorizontalCircle01Icon,
  Search01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import { motion } from "motion/react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AuthDialog, AuthDialogContent } from "./auth/auth-dialog";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navItems = [
  { href: "/", label: "Inicio", icon: Home07Icon },
  { href: "/search", label: "Juegos", icon: GameController03Icon },
  { href: "/search", label: "Comics", icon: Book03Icon },
  { href: "/search", label: "Buscar", icon: Search01Icon },
  { href: "/extras", label: "Extras", icon: MoreHorizontalCircle01Icon },
] as const;

const navItemVariants = cva(
  "relative flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 transition-all duration-200",
  {
    variants: {
      active: {
        true: "text-primary",
        false: "text-muted-foreground hover:text-foreground",
      },
    },
  }
);

export function BottomNav() {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const isExtrasActive = isActive("/profile") || isActive("/auth");

  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50",
        "bg-background/95 backdrop-blur",
        "border-border border-t",
        "pb-[env(safe-area-inset-bottom)]",
        "md:hidden",
        "flex items-center justify-around",
        "h-16 px-2"
      )}
    >
      <NavItem href="/" icon={Home07Icon} label="Inicio" />
      <NavItem href="/chronos" icon={GameController03Icon} label="Chronos" />
      <NavButtonItem href="/search" icon={Search01Icon} />
      <NavItem href="/tutorials" icon={Book03Icon} label="Tutoriales" />
      <ExtrasNavMenu isActive={isExtrasActive} />
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
  search,
}: {
  href: string;
  label: string;
  icon: (typeof navItems)[number]["icon"];
  active?: boolean;
  search?: Record<string, string>;
}) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const isItemActive = active ?? isActive(href);

  return (
    <Link
      aria-current={isItemActive ? "page" : undefined}
      className={navItemVariants({ active: isItemActive })}
      search={search}
      to={href}
    >
      {isItemActive && (
        <motion.span
          className="absolute -top-2 h-px w-full rounded-full bg-primary"
          layoutId="navbar-indicator"
        />
      )}
      <HugeiconsIcon className="size-6" icon={icon} />
      <span className="text-xs">{label}</span>
    </Link>
  );
}

function NavButtonItem({
  href,
  icon,
}: {
  href: string;
  icon: (typeof navItems)[number]["icon"];
}) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const active = isActive(href);

  return (
    <Button
      className="size-14 -translate-y-4 rounded-full"
      nativeButton={false}
      render={<Link aria-current={active ? "page" : undefined} to={href} />}
      size="icon"
    >
      <HugeiconsIcon className="size-6" icon={icon} />
    </Button>
  );
}

function ExtrasNavMenu({ isActive }: { isActive: boolean }) {
  const { data: auth } = authClient.useSession();
  const navigate = useNavigate();
  const [openAuth, setOpenAuth] = useState(false);
  const { setTheme } = useTheme();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              aria-current={isActive ? "page" : undefined}
              className={navItemVariants({ active: isActive })}
              type="button"
            />
          }
        >
          {isActive && (
            <motion.span
              className="absolute -top-2 h-px w-14 rounded-full bg-primary"
              layoutId="navbar-indicator"
            />
          )}
          <HugeiconsIcon className="size-6" icon={MoreHorizontalCircle01Icon} />
          <span className="text-xs">Extras</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top" sideOffset={8}>
          {auth?.session ? (
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <HugeiconsIcon icon={UserIcon} />
              Perfil
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setOpenAuth(true)}>
              <HugeiconsIcon icon={UserIcon} />
              Login
            </DropdownMenuItem>
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Tema</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Claro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Oscuro
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  Sistema
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      <AuthDialog onOpenChange={setOpenAuth} open={openAuth}>
        <AuthDialogContent />
      </AuthDialog>
    </>
  );
}
