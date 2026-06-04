import { ReportStatus, Role } from "@prisma/client";

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowError";
  }
}

export const allowedTransitions: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: [ReportStatus.SUBMITTED],
  SUBMITTED: [ReportStatus.UNDER_REVIEW],
  UNDER_REVIEW: [
    ReportStatus.REVISION_REQUESTED,
    ReportStatus.APPROVED,
    ReportStatus.REJECTED,
  ],
  REVISION_REQUESTED: [ReportStatus.RESUBMITTED],
  RESUBMITTED: [ReportStatus.UNDER_REVIEW],
  APPROVED: [ReportStatus.ARCHIVED],
  REJECTED: [ReportStatus.ARCHIVED],
  ARCHIVED: [],
};

export function assertTransition(
  from: ReportStatus,
  to: ReportStatus,
  actorRole: Role,
) {
  if (!allowedTransitions[from].includes(to)) {
    throw new WorkflowError(`Cannot move a report from ${from} to ${to}.`);
  }

  const studentTransitions: ReportStatus[] = [
    ReportStatus.SUBMITTED,
    ReportStatus.RESUBMITTED,
  ];
  const supervisorTransitions: ReportStatus[] = [
    ReportStatus.UNDER_REVIEW,
    ReportStatus.REVISION_REQUESTED,
    ReportStatus.APPROVED,
    ReportStatus.REJECTED,
  ];

  if (studentTransitions.includes(to) && actorRole !== Role.STUDENT) {
    throw new WorkflowError("Only a student can submit or resubmit a report.");
  }

  if (supervisorTransitions.includes(to) && actorRole !== Role.SUPERVISOR) {
    throw new WorkflowError("Only a supervisor can perform this review action.");
  }

  if (to === ReportStatus.ARCHIVED && actorRole !== Role.ADMIN) {
    throw new WorkflowError("Only an administrator can archive a report.");
  }
}

export function canEditReport(status: ReportStatus) {
  const editableStatuses: ReportStatus[] = [
    ReportStatus.DRAFT,
    ReportStatus.REVISION_REQUESTED,
  ];
  return editableStatuses.includes(status);
}
