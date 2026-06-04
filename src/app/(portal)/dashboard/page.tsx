import { ReportStatus, Role } from "@prisma/client";
import {
  CheckCircle2,
  Clock3,
  FileText,
  Inbox,
  Plus,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MessageBanner } from "@/components/message-banner";
import { ReportTable } from "@/components/report-table";
import { StatCard } from "@/components/stat-card";
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

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const user = await requireUser();
  if (user.role === Role.ADMIN) {
    redirect("/admin");
  }

  const reports = await getDb().report.findMany({
    where:
      user.role === Role.STUDENT
        ? { studentId: user.id }
        : { supervisorId: user.id },
    include: {
      student: { select: { name: true } },
      supervisor: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const query = await searchParams;

  const isStudent = user.role === Role.STUDENT;
  const reviewQueueStatuses: ReportStatus[] = [
    ReportStatus.SUBMITTED,
    ReportStatus.RESUBMITTED,
  ];
  const awaitingReview = reports.filter((report) =>
    reviewQueueStatuses.includes(report.status),
  ).length;
  const inReview = reports.filter(
    (report) => report.status === ReportStatus.UNDER_REVIEW,
  ).length;
  const revisions = reports.filter(
    (report) => report.status === ReportStatus.REVISION_REQUESTED,
  ).length;
  const approved = reports.filter(
    (report) => report.status === ReportStatus.APPROVED,
  ).length;

  return (
    <div className="space-y-8">
      <MessageBanner message={query.message} error={query.error} />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            {isStudent ? "Student dashboard" : "Supervisor dashboard"}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {isStudent ? `Welcome back, ${user.name}` : "Review workspace"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isStudent
              ? "Create reports, respond to feedback, and track decisions."
              : "Work through submitted reports and keep students moving."}
          </p>
        </div>
        {isStudent ? (
          <Button asChild>
            <Link href="/reports/new">
              <Plus className="size-4" />
              New report
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total reports"
          value={reports.length}
          detail={isStudent ? "Across all reporting periods" : "Assigned to you"}
          icon={FileText}
        />
        <StatCard
          label={isStudent ? "Awaiting review" : "Review queue"}
          value={awaitingReview}
          detail={isStudent ? "Submitted or resubmitted" : "Ready to be opened"}
          icon={Inbox}
        />
        <StatCard
          label={isStudent ? "Revisions needed" : "In review"}
          value={isStudent ? revisions : inReview}
          detail={isStudent ? "Needs your response" : "Reviews in progress"}
          icon={isStudent ? RotateCcw : Clock3}
        />
        <StatCard
          label="Approved"
          value={approved}
          detail="Completed successfully"
          icon={CheckCircle2}
        />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{isStudent ? "Your reports" : "Assigned reports"}</CardTitle>
          <CardDescription>
            {isStudent
              ? "Open a report to edit, submit, or respond to feedback."
              : "Reports are sorted by their most recent activity."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportTable
            reports={reports}
            perspective={isStudent ? "student" : "supervisor"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
