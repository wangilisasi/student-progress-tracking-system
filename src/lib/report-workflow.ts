import {
  AuditAction,
  Prisma,
  ReportStatus,
  Role,
  User,
} from "@prisma/client";

import { getDb } from "@/lib/db";
import {
  assertTransition,
  canEditReport,
  WorkflowError,
} from "@/lib/workflow-policy";

export type ReportInput = {
  title: string;
  reportingPeriod: string;
  summary: string;
  accomplishments: string;
  challenges: string;
  nextSteps: string;
  hoursWorked: number;
};

export type AttachmentInput = {
  name: string;
  url: string;
};

export type ReviewDecision =
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "REJECTED";

async function getActor(actorId: string) {
  const actor = await getDb().user.findUnique({ where: { id: actorId } });
  if (!actor) {
    throw new WorkflowError("Authenticated user no longer exists.");
  }
  return actor;
}

async function getReport(reportId: string) {
  const report = await getDb().report.findUnique({ where: { id: reportId } });
  if (!report) {
    throw new WorkflowError("Report not found.");
  }
  return report;
}

function assertStudentOwnsReport(actor: User, studentId: string) {
  if (actor.role !== Role.STUDENT || actor.id !== studentId) {
    throw new WorkflowError("Only the report owner can perform this action.");
  }
}

function assertAssignedSupervisor(actor: User, supervisorId: string) {
  if (actor.role !== Role.SUPERVISOR || actor.id !== supervisorId) {
    throw new WorkflowError("Only the assigned supervisor can perform this action.");
  }
}

function assertCanView(actor: User, studentId: string, supervisorId: string) {
  if (
    actor.role !== Role.ADMIN &&
    actor.id !== studentId &&
    actor.id !== supervisorId
  ) {
    throw new WorkflowError("You do not have access to this report.");
  }
}

export async function getReportForActor(actorId: string, reportId: string) {
  const actor = await getActor(actorId);
  const report = await getDb().report.findUnique({
    where: { id: reportId },
    include: {
      student: true,
      supervisor: true,
      comments: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
      auditLogs: {
        include: { actor: true },
        orderBy: { createdAt: "desc" },
      },
      attachments: {
        include: { uploader: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!report) {
    throw new WorkflowError("Report not found.");
  }
  assertCanView(actor, report.studentId, report.supervisorId);
  return report;
}

export async function createReport(
  actorId: string,
  supervisorId: string,
  input: ReportInput,
) {
  const actor = await getActor(actorId);
  if (actor.role !== Role.STUDENT) {
    throw new WorkflowError("Only students can create reports.");
  }

  const supervisor = await getDb().user.findUnique({
    where: { id: supervisorId },
  });
  if (!supervisor || supervisor.role !== Role.SUPERVISOR) {
    throw new WorkflowError("Select a valid supervisor.");
  }

  return getDb().report.create({
    data: {
      ...input,
      studentId: actor.id,
      supervisorId,
      auditLogs: {
        create: {
          actorId,
          action: AuditAction.CREATED,
          toStatus: ReportStatus.DRAFT,
          details: "Created progress report",
        },
      },
    },
  });
}

export async function updateReport(
  actorId: string,
  reportId: string,
  input: ReportInput,
  attachment?: AttachmentInput,
) {
  const actor = await getActor(actorId);
  const report = await getReport(reportId);
  assertStudentOwnsReport(actor, report.studentId);

  if (!canEditReport(report.status)) {
    throw new WorkflowError("This report is not editable in its current status.");
  }

  return getDb().$transaction(async (tx) => {
    const updated = await tx.report.update({
      where: { id: reportId },
      data: input,
    });

    await tx.auditLog.create({
      data: {
        reportId,
        actorId,
        action: AuditAction.UPDATED,
        fromStatus: report.status,
        toStatus: report.status,
        details: "Updated report content",
      },
    });

    if (attachment) {
      await tx.attachment.create({
        data: {
          reportId,
          uploaderId: actorId,
          ...attachment,
        },
      });
      await tx.auditLog.create({
        data: {
          reportId,
          actorId,
          action: AuditAction.ATTACHMENT_ADDED,
          fromStatus: report.status,
          toStatus: report.status,
          details: `Added attachment: ${attachment.name}`,
        },
      });
    }

    return updated;
  });
}

export async function submitReport(actorId: string, reportId: string) {
  const actor = await getActor(actorId);
  const report = await getReport(reportId);
  assertStudentOwnsReport(actor, report.studentId);

  const toStatus =
    report.status === ReportStatus.REVISION_REQUESTED
      ? ReportStatus.RESUBMITTED
      : ReportStatus.SUBMITTED;

  assertTransition(report.status, toStatus, actor.role);

  return getDb().$transaction(async (tx) => {
    const updated = await tx.report.update({
      where: { id: reportId },
      data: {
        status: toStatus,
        submittedAt: new Date(),
        version: toStatus === ReportStatus.RESUBMITTED ? { increment: 1 } : undefined,
      },
    });
    await tx.auditLog.create({
      data: {
        reportId,
        actorId,
        action:
          toStatus === ReportStatus.RESUBMITTED
            ? AuditAction.RESUBMITTED
            : AuditAction.SUBMITTED,
        fromStatus: report.status,
        toStatus,
        details:
          toStatus === ReportStatus.RESUBMITTED
            ? "Resubmitted revised report"
            : "Submitted report for supervisor review",
      },
    });
    return updated;
  });
}

export async function startReview(actorId: string, reportId: string) {
  const actor = await getActor(actorId);
  const report = await getReport(reportId);
  assertAssignedSupervisor(actor, report.supervisorId);
  assertTransition(report.status, ReportStatus.UNDER_REVIEW, actor.role);

  return transitionReport({
    actorId,
    reportId,
    fromStatus: report.status,
    toStatus: ReportStatus.UNDER_REVIEW,
    action: AuditAction.REVIEW_STARTED,
    details: "Started supervisor review",
  });
}

export async function decideReport(
  actorId: string,
  reportId: string,
  decision: ReviewDecision,
  feedback: string,
) {
  const actor = await getActor(actorId);
  const report = await getReport(reportId);
  assertAssignedSupervisor(actor, report.supervisorId);
  assertTransition(report.status, decision, actor.role);

  if (!feedback.trim()) {
    throw new WorkflowError("Feedback is required for review decisions.");
  }

  const actionByDecision: Record<ReviewDecision, AuditAction> = {
    REVISION_REQUESTED: AuditAction.REVISION_REQUESTED,
    APPROVED: AuditAction.APPROVED,
    REJECTED: AuditAction.REJECTED,
  };

  return getDb().$transaction(async (tx) => {
    const updated = await tx.report.update({
      where: { id: reportId },
      data: {
        status: decision,
        reviewedAt:
          decision === ReportStatus.REVISION_REQUESTED ? null : new Date(),
      },
    });
    await tx.comment.create({
      data: {
        reportId,
        authorId: actorId,
        body: feedback.trim(),
        isDecision: true,
      },
    });
    await tx.auditLog.create({
      data: {
        reportId,
        actorId,
        action: actionByDecision[decision],
        fromStatus: report.status,
        toStatus: decision,
        details: `${decision.replaceAll("_", " ").toLowerCase()} with feedback`,
      },
    });
    return updated;
  });
}

export async function addComment(
  actorId: string,
  reportId: string,
  body: string,
) {
  const actor = await getActor(actorId);
  const report = await getReport(reportId);
  assertCanView(actor, report.studentId, report.supervisorId);

  if (!body.trim()) {
    throw new WorkflowError("Comment cannot be empty.");
  }

  return getDb().$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        reportId,
        authorId: actorId,
        body: body.trim(),
      },
    });
    await tx.auditLog.create({
      data: {
        reportId,
        actorId,
        action: AuditAction.COMMENTED,
        fromStatus: report.status,
        toStatus: report.status,
        details: "Added a comment",
      },
    });
    return comment;
  });
}

export async function archiveReport(actorId: string, reportId: string) {
  const actor = await getActor(actorId);
  const report = await getReport(reportId);
  assertTransition(report.status, ReportStatus.ARCHIVED, actor.role);

  return transitionReport({
    actorId,
    reportId,
    fromStatus: report.status,
    toStatus: ReportStatus.ARCHIVED,
    action: AuditAction.ARCHIVED,
    details: "Archived report",
  });
}

async function transitionReport(input: {
  actorId: string;
  reportId: string;
  fromStatus: ReportStatus;
  toStatus: ReportStatus;
  action: AuditAction;
  details: string;
}) {
  return getDb().$transaction(async (tx: Prisma.TransactionClient) => {
    const report = await tx.report.update({
      where: { id: input.reportId },
      data: { status: input.toStatus },
    });
    await tx.auditLog.create({
      data: {
        reportId: input.reportId,
        actorId: input.actorId,
        action: input.action,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        details: input.details,
      },
    });
    return report;
  });
}
