import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="rounded-2xl bg-muted p-4 text-muted-foreground">
        <FileQuestion className="size-8" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Report not found
      </h1>
      <p className="mt-3 text-muted-foreground">
        The report does not exist or your account does not have access to it.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Return to dashboard</Link>
      </Button>
    </main>
  );
}
