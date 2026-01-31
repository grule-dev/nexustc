import {
  Book02Icon,
  Clock01Icon,
  Home01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useLocation } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import { Avatar, AvatarFallback, AvatarImage, Facehash } from "facehash";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { cn, defaultFacehashProps, getBucketUrl } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Inicio", icon: Home01Icon },
  { href: "/search", label: "Buscar", icon: Search01Icon },
  { href: "/tutorials", label: "Tutoriales", icon: Book02Icon },
  { href: "/chronos", label: "Chronos", icon: Clock01Icon },
] as const;

const navItemVariants = cva(
  "relative flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 transition-all duration-200 active:scale-95",
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

  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50",
        "bg-background/95 backdrop-blur-lg",
        "border-border border-t",
        "pb-[env(safe-area-inset-bottom)]",
        "md:hidden",
        "flex items-center justify-around",
        "h-16 px-2"
      )}
    >
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={navItemVariants({ active })}
            key={item.href}
            to={item.href}
          >
            {active && (
              <span className="absolute top-0 h-1 w-4 rounded-full bg-primary" />
            )}
            <HugeiconsIcon className="size-6" icon={item.icon} />
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
      <ProfileNavItem isActive={isActive("/profile") || isActive("/auth")} />
    </nav>
  );
}

function ProfileNavItem({ isActive }: { isActive: boolean }) {
  const { data: auth } = authClient.useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const href = auth?.session ? "/profile" : "/auth";

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={navItemVariants({ active: isActive })}
      to={href}
    >
      {isActive && (
        <span className="absolute top-0.5 h-1 w-4 rounded-full bg-primary" />
      )}
      {mounted && auth?.session ? (
        <Avatar className="size-6 rounded-full">
          <AvatarImage
            src={auth.user.image ? getBucketUrl(auth.user.image) : undefined}
          />
          <AvatarFallback
            className="rounded-full"
            facehashProps={defaultFacehashProps}
            name={auth.user.name}
          />
        </Avatar>
      ) : (
        <Facehash
          className="rounded-full"
          colorClasses={["bg-pink-500"]}
          name={auth?.user?.name ?? "cronos"}
          size={24}
          variant="solid"
        />
      )}
      <span className="text-xs">Perfil</span>
    </Link>
  );
}
