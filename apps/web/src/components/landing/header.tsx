import {
  ArrowLeft02Icon,
  Book02Icon,
  Clock01Icon,
  Home01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Link,
  useCanGoBack,
  useMatchRoute,
  useRouter,
} from "@tanstack/react-router";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SignedIn } from "../auth/signed-in";
import { SignedOut } from "../auth/signed-out";
import { ModeToggle } from "../mode-toggle";
import { Button } from "../ui/button";
import { UserSection } from "./login-section";

const navItems = [
  { href: "/", label: "Inicio", icon: Home01Icon },
  { href: "/search", label: "Buscar", icon: Search01Icon },
  { href: "/tutorials", label: "Tutoriales", icon: Book02Icon },
  { href: "/chronos", label: "Chronos", icon: Clock01Icon },
] as const;

export function Header() {
  return (
    <>
      <header className="inset-x-0 top-0 z-10 mx-auto flex w-full flex-col items-center gap-4 border-b bg-primary/50 p-4 backdrop-blur">
        <div className="flex w-full items-center justify-between">
          <BackButton />
          <Link to="/">
            <h1 className="font-bold text-primary-foreground text-xl md:text-3xl">
              NeXusTC
              <span className="align-super font-normal text-xs md:text-sm">
                +18
              </span>
              <span className="font-normal text-xs md:text-sm"> BETA</span>
            </h1>
          </Link>
          <ModeToggle />
        </div>
      </header>
      <FloatingNavbar />
    </>
  );
}

function BackButton() {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      className="md:invisible"
      disabled={!(canGoBack && mounted)}
      onClick={() => router.history.back()}
      size="icon"
      variant="ghost"
    >
      <HugeiconsIcon className="size-6" icon={ArrowLeft02Icon} />
    </Button>
  );
}

function FloatingNavbar() {
  const matchRoute = useMatchRoute();

  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  const isSticky = !matchRoute({
    to: "/chronos",
  });

  return (
    <motion.div
      className={cn(
        "inset-x-0 top-4 z-10 mb-4 w-full flex-row items-center justify-center rounded-xl rounded-t-none md:flex md:justify-center",
        isSticky ? "sticky" : "block"
      )}
      ref={ref}
    >
      <motion.div
        animate={{
          boxShadow: visible
            ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
            : "none",
          width: visible ? "auto" : "100%",
          borderRadius: visible ? "50px" : "0",
        }}
        className="hidden items-center justify-between border bg-primary/50 p-2 backdrop-blur md:flex"
        initial={{ boxShadow: "none", width: "100%", borderRadius: "0" }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 50,
        }}
      >
        <nav className="flex items-center justify-center gap-1">
          {navItems.map((link) => (
            <Button
              key={link.href}
              nativeButton={false}
              render={<Link key={link.label} to={link.href} />}
              variant="ghost"
            >
              <HugeiconsIcon className="size-5" icon={link.icon} />
              {link.label}
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <SignedIn>
            <UserSection />
          </SignedIn>
          <SignedOut>
            <Button nativeButton={false} render={<Link to="/auth" />}>
              Login
            </Button>
          </SignedOut>
        </div>
      </motion.div>
    </motion.div>
  );
}
