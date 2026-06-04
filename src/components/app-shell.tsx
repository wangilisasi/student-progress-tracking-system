import { Role } from "@prisma/client";
import {
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/app/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { roleLabels } from "@/lib/presentation";

export function AppShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; role: Role };
  children: React.ReactNode;
}) {
  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-muted/25">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="rounded-lg bg-primary p-1.5 text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-semibold tracking-tight">Progress Review</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {roleLabels[user.role]}
              </p>
            </div>
            <Avatar className="size-9">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            <NavLink href="/dashboard" icon={LayoutDashboard}>
              Dashboard
            </NavLink>
            {user.role === Role.ADMIN ? (
              <NavLink href="/admin" icon={ShieldCheck}>
                Administration
              </NavLink>
            ) : null}
            <Separator className="my-4" />
            <div className="rounded-xl border bg-background p-4 text-sm shadow-sm">
              <FileCheck2 className="mb-3 size-5 text-primary" />
              <p className="font-medium">Workflow tracked</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Every submission, review decision, comment, and update is recorded.
              </p>
            </div>
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  children: React.ReactNode;
}) {
  return (
    <Button asChild variant="ghost" className="w-full justify-start">
      <Link href={href}>
        <Icon className="size-4" />
        {children}
      </Link>
    </Button>
  );
}
