import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function requireUser(allowedRoles?: Role[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return session.user;
}
