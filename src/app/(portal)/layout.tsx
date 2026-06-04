import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth-guards";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
