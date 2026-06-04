import { Role } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { createReportAction } from "@/app/actions";
import { ReportForm } from "@/components/report-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";

export const metadata = { title: "New report" };

export default async function NewReportPage() {
  await requireUser([Role.STUDENT]);
  const supervisors = await getDb().user.findMany({
    where: { role: Role.SUPERVISOR },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/dashboard">
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
      </Button>

      <div>
        <p className="text-sm font-medium text-primary">New progress report</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Start a draft
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your report remains private to you and your selected supervisor until
          you submit it.
        </p>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Report details</CardTitle>
          <CardDescription>
            Capture enough context for a focused supervisor review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm
            action={createReportAction}
            supervisors={supervisors}
            submitLabel="Create draft"
          />
        </CardContent>
      </Card>
    </div>
  );
}
