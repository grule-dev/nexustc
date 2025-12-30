import { ArrowLeft02Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Link,
  useCanGoBack,
  useMatchRoute,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SignedIn } from "../auth/signed-in";
import { SignedOut } from "../auth/signed-out";
import { ModeToggle } from "../mode-toggle";
import { RunOnClick } from "../run-on-click";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { UserSection } from "./login-section";

const links = [
  { label: "Inicio", href: "/" },
  { label: "Juegos", href: "/post-search" },
  { label: "Comics", href: "/comic-search" },
  { label: "TheChronos", href: "/chronos" },
  { label: "Tutoriales", href: "/tutorials" },
] as const;

export function Header() {
  const matchRoute = useMatchRoute();

  const isSticky = !matchRoute({
    to: "/comic/$id",
  });

  return (
    <>
      <header className="inset-x-0 top-0 z-10 mx-auto flex w-full flex-col items-center gap-4 border-b bg-primary/50 p-4 backdrop-blur">
        <div>
          <Link to="/">
            <h1 className="font-bold text-primary-foreground text-xl md:text-3xl">
              NeXusTC
              <span className="align-super font-normal text-xs md:text-sm">
                +18
              </span>
              <span className="font-normal text-xs md:text-sm"> BETA</span>
            </h1>
          </Link>
        </div>
      </header>
      <div
        className={cn(
          isSticky && "sticky",
          "inset-x-0 top-0 z-10 mx-auto flex w-full flex-row items-center justify-between border-b bg-primary/50 p-4 backdrop-blur md:justify-center"
        )}
      >
        <BackButton />
        <BurgerMenu />
        <div className="container hidden items-center justify-between px-4 md:flex">
          <nav className="flex items-center justify-center gap-4">
            {links.map((link) => (
              <Link key={link.label} to={link.href}>
                <Button variant="ghost">{link.label}</Button>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <SignedIn>
              <UserSection />
            </SignedIn>
            <SignedOut>
              <Link to="/auth">
                <Button>Login</Button>
              </Link>
            </SignedOut>
            <ModeToggle />
          </div>
        </div>
      </div>
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
      className="md:hidden"
      disabled={!(canGoBack && mounted)}
      onClick={() => router.history.back()}
      size="icon"
      variant="ghost"
    >
      <HugeiconsIcon className="size-6" icon={ArrowLeft02Icon} />
    </Button>
  );
}

function BurgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger
        render={<Button className="md:hidden" size="icon" variant="ghost" />}
      >
        <HugeiconsIcon className="size-6" icon={Menu01Icon} />
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <RunOnClick onClick={() => setOpen(false)}>
          <nav className="flex flex-col gap-4 px-4">
            {links.map((link) => (
              <Link key={link.label} to={link.href}>
                <Button className="w-full" variant="outline">
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        </RunOnClick>

        <SheetFooter className="flex flex-row items-center justify-center gap-4">
          <RunOnClick onClick={() => setOpen(false)}>
            <UserSection />
          </RunOnClick>
          <ModeToggle />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
