import { ClipboardCheck, FileClock, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions";
import { auth } from "@/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  const { error } = await searchParams;

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
      <section>
        <Badge variant="outline" className="mb-6 bg-background/70">
          Academic progress workflow
        </Badge>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Progress reports that move from draft to decision.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Students document progress. Supervisors review with context. Every
          decision and revision stays visible in a complete audit trail.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Feature icon={FileClock} title="Clear lifecycle">
            Draft, submit, revise, approve, and archive.
          </Feature>
          <Feature icon={ClipboardCheck} title="Focused review">
            Feedback and decisions stay with each report.
          </Feature>
          <Feature icon={ShieldCheck} title="Role protected">
            Actions are enforced by role and current status.
          </Feature>
        </div>
      </section>

      <Card className="border-border/70 bg-background/90 shadow-xl shadow-primary/5">
        <CardHeader>
          <CardTitle>Sign in to the demo</CardTitle>
          <CardDescription>
            Use a seeded account to explore each role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert className="mb-5 border-red-200 bg-red-50 text-red-900">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <form action={loginAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="student@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Demo123!"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-xs">
            <p className="mb-2 font-medium text-foreground">
              Demo password for every account: <code>Demo123!</code>
            </p>
            <p>Student: student@example.com</p>
            <p>Supervisor: supervisor@example.com</p>
            <p>Admin: admin@example.com</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileClock;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-background/75 p-4 shadow-sm">
      <Icon className="size-5 text-primary" />
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}
