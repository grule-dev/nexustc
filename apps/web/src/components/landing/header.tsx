import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage, Facehash } from "facehash";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { defaultFacehashProps, getBucketUrl } from "@/lib/utils";
import {
  AuthDialog,
  AuthDialogContent,
  AuthDialogTrigger,
} from "../auth/auth-dialog";
import { Logo } from "../logo";
import { Button } from "../ui/button";
import { SidebarTrigger } from "../ui/sidebar";

export function Header() {
  return (
    <header className="w-full px-2 pt-2">
      <div className="flex w-full flex-col items-center gap-4 rounded-lg bg-linear-to-b from-primary to-primary/50 p-4">
        <div className="flex w-full items-center justify-between">
          <div className="hidden md:block">
            <SidebarTrigger className="text-primary-foreground" />
          </div>
          <BackButton />
          <Link to="/">
            <Logo />
          </Link>
          <ProfileNavItem />
        </div>
      </div>
    </header>
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

function ProfileNavItem() {
  const { data: auth } = authClient.useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthed = mounted && Boolean(auth?.session);
  const href = isAuthed ? "/profile" : "/auth";
  const displayName = isAuthed ? (auth?.user.name ?? "cronos") : "cronos";
  const imageSrc = isAuthed
    ? auth?.user.image
      ? getBucketUrl(auth.user.image)
      : undefined
    : undefined;

  if (!isAuthed) {
    return (
      <AuthDialog>
        <AuthDialogTrigger
          nativeButton={false}
          render={
            <Facehash
              name=""
              {...defaultFacehashProps}
              className="rounded-full"
            />
          }
        />
        <AuthDialogContent />
      </AuthDialog>
    );
  }

  return (
    <Link to={href}>
      <Avatar className="size-8 rounded-full">
        <AvatarImage src={imageSrc} />
        <AvatarFallback
          className="rounded-full"
          facehashProps={defaultFacehashProps}
          name={displayName}
        />
      </Avatar>
    </Link>
  );
}
