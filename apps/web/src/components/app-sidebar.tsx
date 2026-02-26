import {
  Book03Icon,
  BubbleChatQuestionIcon,
  CircleLockIcon,
  Clock01Icon,
  GameController03Icon,
  Home01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { SignedIn } from "@/components/auth/signed-in";
import { SignedOut } from "@/components/auth/signed-out";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { AuthDialog, AuthDialogContent } from "./auth/auth-dialog";

const navItems = [
  { href: "/", label: "Inicio", search: {}, icon: Home01Icon },
  {
    href: "/search",
    label: "Juegos",
    search: { type: "juegos" },
    icon: GameController03Icon,
  },
  {
    href: "/search",
    label: "Comics",
    search: { type: "comics" },
    icon: Book03Icon,
  },
  {
    href: "/tutorials",
    label: "Tutoriales",
    search: {},
    icon: BubbleChatQuestionIcon,
  },
  { href: "/chronos", label: "Chronos", search: {}, icon: Clock01Icon },
] as const;

export function AppSidebar() {
  const auth = authClient.useSession();
  const [openAuth, setOpenAuth] = useState(false);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="inline-flex w-full items-center justify-center overflow-hidden"
                render={<Link to="/" />}
                size="lg"
              >
                <h1 className="line-clamp-2 text-center font-[Lexend] font-bold text-2xl tracking-wider">
                  N
                  <span className="transition-[opacity,transform] duration-300 group-data-[state=collapsed]:scale-x-0 group-data-[state=collapsed]:opacity-0">
                    eXusTC
                    <span className="align-super font-normal text-xs">+18</span>
                  </span>
                </h1>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={`${item.href}-${item.label}`}>
                    <SidebarMenuButton
                      render={<Link search={item.search} to={item.href} />}
                    >
                      <HugeiconsIcon icon={item.icon} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Usuario</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SignedIn>
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<Link to={"/profile"} />}>
                      <HugeiconsIcon icon={UserIcon} />
                      <span>Perfil</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {auth.data?.user.role !== "user" && (
                    <SidebarMenuItem>
                      <SidebarMenuButton render={<Link to={"/admin"} />}>
                        <HugeiconsIcon icon={CircleLockIcon} />
                        <span>Admin</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SignedIn>
                <SignedOut>
                  <SidebarMenuItem>
                    <AuthDialog>
                      <SidebarMenuButton onClick={() => setOpenAuth(true)}>
                        <HugeiconsIcon icon={UserIcon} />
                        <span>Login</span>
                      </SidebarMenuButton>
                      <AuthDialogContent />
                    </AuthDialog>
                  </SidebarMenuItem>
                </SignedOut>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail className="border-primary" />
      </Sidebar>
      <AuthDialog onOpenChange={setOpenAuth} open={openAuth}>
        <AuthDialogContent />
      </AuthDialog>
    </>
  );
}
