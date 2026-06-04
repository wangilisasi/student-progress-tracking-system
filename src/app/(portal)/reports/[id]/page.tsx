import { ReportStatus, Role } from "@prisma/client";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  MessageSquareText,
  PlayCircle,
  Send,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addCommentAction,
  archiveReportAction,
  decideReportAction,
  startReviewAction,
  submitReportAction,
  updateReportAction,
} from "@/app/actions";
import { MessageBanner } from "@/components/message-banner";
import { ReportForm } from "@/components/report-form";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth-guards";
import { formatDate, humanize, roleLabels } from "@/lib/presentation";
import { getReportForActor } from "@/lib/report-workflow";
import { canEditReport } from "@/lib/workflow-policy";

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const report = await getReportForActor(user.id, id).catch(() => notFound());

  const isOwner = user.role === Role.STUDENT && report.studentId === user.id;
  const isSupervisor =
    user.role === Role.SUPERVISOR && report.supervisorId === user.id;
  const editable = isOwner && canEditReport(report.status);
  const submittableStatuses: ReportStatus[] = [
    ReportStatus.DRAFT,
    ReportStatus.REVISION_REQUESTED,
  ];
  const reviewableStatuses: ReportStatus[] = [
    ReportStatus.SUBMITTED,
    ReportStatus.RESUBMITTED,
  ];
  const archivableStatuses: ReportStatus[] = [
    ReportStatus.APPROVED,
    ReportStatus.REJECTED,
  ];
  const canSubmit =
    isOwner && submittableStatuses.includes(report.status);
  const canStartReview =
    isSupervisor && reviewableStatuses.includes(report.status);
  const canDecide =
    isSupervisor && report.status === ReportStatus.UNDER_REVIEW;
  const canArchive =
    user.role === Role.ADMIN && archivableStatuses.includes(report.status);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href={user.role === Role.ADMIN ? "/admin" : "/dashboard"}>
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
      </Button>

      <MessageBanner message={query.message} error={query.error} />

      <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-background/85 p-6 shadow-sm sm:flex-row sm:items-start">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={report.status} />
            <Badge variant="outline">Version {report.version}</Badge>
            <Badge variant="outline">{report.reportingPeriod}</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{report.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {report.student.name} · supervised by {report.supervisor.name}
          </p>
        </div>
        <div className="text-sm text-muted-foreground sm:text-right">
          <p>Last updated</p>
          <p className="mt-1 font-medium text-foreground">
            {formatDate(report.updatedAt)}
          </p>
        </div>
      </div>

      {report.status === ReportStatus.REVISION_REQUESTED && isOwner ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <Clock3 className="size-4" />
          <AlertTitle>Revision requested</AlertTitle>
          <AlertDescription>
            Update the report in response to supervisor feedback, save it, then
            resubmit for another review.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>{editable ? "Edit report" : "Progress report"}</CardTitle>
              <CardDescription>
                {report.hoursWorked} hours reported for this period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editable ? (
                <ReportForm
                  action={updateReportAction}
                  report={report}
                  submitLabel="Save report"
                />
              ) : (
                <div className="space-y-7">
                  <ReportSection title="Executive summary" body={report.summary} />
                  <ReportSection
                    title="Accomplishments"
                    body={report.accomplishments}
                  />
                  <ReportSection
                    title="Challenges and blockers"
                    body={report.challenges}
                  />
                  <ReportSection title="Next steps" body={report.nextSteps} />
                </div>
              )}

              {canSubmit ? (
                <>
                  <Separator className="my-6" />
                  <form action={submitReportAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <Button type="submit" variant="default">
                      <Send className="size-4" />
                      {report.status === ReportStatus.REVISION_REQUESTED
                        ? "Resubmit revised report"
                        : "Submit for review"}
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Save any edits before submitting. Submission locks editing
                      until a revision is requested.
                    </p>
                  </form>
                </>
              ) : null}
            </CardContent>
          </Card>

          {canStartReview || canDecide ? (
            <Card className="border-primary/25 bg-primary/[0.025] shadow-sm">
              <CardHeader>
                <CardTitle>Supervisor review</CardTitle>
                <CardDescription>
                  Review actions are recorded in the report audit trail.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canStartReview ? (
                  <form action={startReviewAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <Button type="submit">
                      <PlayCircle className="size-4" />
                      Start review
                    </Button>
                  </form>
                ) : null}

                {canDecide ? (
                  <form action={decideReportAction} className="space-y-4">
                    <input type="hidden" name="reportId" value={report.id} />
                    <div className="space-y-2">
                      <Label htmlFor="decision">Decision</Label>
                      <select
                        id="decision"
                        name="decision"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        required
                      >
                        <option value="APPROVED">Approve report</option>
                        <option value="REVISION_REQUESTED">Request revision</option>
                        <option value="REJECTED">Reject report</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="feedback">Decision feedback</Label>
                      <Textarea
                        id="feedback"
                        name="feedback"
                        rows={5}
                        placeholder="Explain the decision and provide clear next steps."
                        required
                      />
                    </div>
                    <Button type="submit">
                      <CheckCircle2 className="size-4" />
                      Record decision
                    </Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="size-5" />
                Feedback and comments
              </CardTitle>
              <CardDescription>
                Discussion stays attached to the report lifecycle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form action={addCommentAction} className="space-y-3">
                <input type="hidden" name="reportId" value={report.id} />
                <Textarea
                  name="body"
                  rows={3}
                  placeholder="Add a comment or clarify a point..."
                  required
                />
                <Button type="submit" variant="outline">
                  Add comment
                </Button>
              </form>
              <Separator />
              {report.comments.length ? (
                <div className="space-y-4">
                  {report.comments.map((comment) => (
                    <div key={comment.id} className="rounded-xl border p-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">{comment.author.name}</span>
                        <Badge variant="secondary">
                          {roleLabels[comment.author.role]}
                        </Badge>
                        {comment.isDecision ? (
                          <Badge variant="outline">Decision feedback</Badge>
                        ) : null}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {comment.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No comments have been added yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Workflow summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <SummaryLine label="Student" value={report.student.name} />
              <SummaryLine label="Supervisor" value={report.supervisor.name} />
              <SummaryLine label="Submitted" value={formatDate(report.submittedAt)} />
              <SummaryLine label="Reviewed" value={formatDate(report.reviewedAt)} />
              <SummaryLine label="Hours" value={String(report.hoursWorked)} />
              {canArchive ? (
                <>
                  <Separator />
                  <form action={archiveReportAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <Button type="submit" variant="outline" className="w-full">
                      <Archive className="size-4" />
                      Archive report
                    </Button>
                  </form>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4" />
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.attachments.length ? (
                <div className="space-y-3">
                  {report.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm hover:bg-muted/50"
                    >
                      <span>
                        <span className="block font-medium">{attachment.name}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Added by {attachment.uploader.name}
                        </span>
                      </span>
                      <ExternalLink className="mt-0.5 size-4 shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No attachment links added.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Audit history</CardTitle>
              <CardDescription>Newest activity first.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-5">
                {report.auditLogs.map((log) => (
                  <li key={log.id} className="relative pl-5 text-sm">
                    <span className="absolute left-0 top-1.5 size-2 rounded-full bg-primary" />
                    <p className="font-medium">{humanize(log.action)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {log.actor.name} · {formatDate(log.createdAt)}
                    </p>
                    {log.details ? (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {log.details}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ReportSection({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <p className="mt-2 whitespace-pre-wrap leading-relaxed">{body}</p>
    </section>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
