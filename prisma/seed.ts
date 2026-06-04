import {
  AuditAction,
  PrismaClient,
  ReportStatus,
  Role,
} from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

const USERS = {
  student: "demo-student-amina",
  studentTwo: "demo-student-daniel",
  supervisor: "demo-supervisor-maya",
  admin: "demo-admin-jordan",
} as const;

const REPORTS = {
  draft: "demo-report-draft",
  revision: "demo-report-revision",
  review: "demo-report-review",
  approved: "demo-report-approved",
} as const;

async function main() {
  const passwordHash = await hash("Demo123!", 12);

  const users = [
    {
      id: USERS.student,
      email: "student@example.com",
      name: "Amina Yusuf",
      role: Role.STUDENT,
    },
    {
      id: USERS.studentTwo,
      email: "student2@example.com",
      name: "Daniel Kim",
      role: Role.STUDENT,
    },
    {
      id: USERS.supervisor,
      email: "supervisor@example.com",
      name: "Dr. Maya Chen",
      role: Role.SUPERVISOR,
    },
    {
      id: USERS.admin,
      email: "admin@example.com",
      name: "Jordan Lee",
      role: Role.ADMIN,
    },
  ];

  for (const user of users) {
    await db.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
      },
      create: {
        ...user,
        passwordHash,
      },
    });
  }

  const reports = [
    {
      id: REPORTS.draft,
      title: "Research foundation and literature review",
      reportingPeriod: "May 2026",
      summary:
        "Initial planning for the applied machine learning research project.",
      accomplishments:
        "Defined the research question and shortlisted twelve foundational papers.",
      challenges:
        "The available datasets use inconsistent labels and need normalization.",
      nextSteps:
        "Complete the annotated bibliography and select a primary dataset.",
      hoursWorked: 18,
      status: ReportStatus.DRAFT,
      studentId: USERS.student,
      supervisorId: USERS.supervisor,
    },
    {
      id: REPORTS.revision,
      title: "Prototype evaluation and revised methodology",
      reportingPeriod: "April 2026",
      summary:
        "Evaluated the first prototype against the baseline and documented findings.",
      accomplishments:
        "Implemented the baseline model and completed the first evaluation pass.",
      challenges:
        "The evaluation section does not yet explain the sampling method clearly.",
      nextSteps:
        "Revise the evaluation methodology and add confidence intervals.",
      hoursWorked: 34,
      status: ReportStatus.REVISION_REQUESTED,
      submittedAt: new Date("2026-05-01T09:15:00.000Z"),
      studentId: USERS.student,
      supervisorId: USERS.supervisor,
    },
    {
      id: REPORTS.review,
      title: "Field study data collection",
      reportingPeriod: "May 2026",
      summary:
        "Completed the planned field interviews and started coding responses.",
      accomplishments:
        "Conducted eight interviews and transcribed all recordings.",
      challenges:
        "Two participants withdrew, requiring a small recruitment extension.",
      nextSteps:
        "Finish thematic coding and prepare the initial results matrix.",
      hoursWorked: 42,
      status: ReportStatus.UNDER_REVIEW,
      submittedAt: new Date("2026-06-01T13:30:00.000Z"),
      studentId: USERS.studentTwo,
      supervisorId: USERS.supervisor,
    },
    {
      id: REPORTS.approved,
      title: "Project proposal and ethics preparation",
      reportingPeriod: "March 2026",
      summary:
        "Finalized the project proposal and prepared the ethics submission.",
      accomplishments:
        "Completed the proposal, risk assessment, and consent materials.",
      challenges: "No material blockers.",
      nextSteps: "Begin participant recruitment after ethics clearance.",
      hoursWorked: 27,
      status: ReportStatus.APPROVED,
      submittedAt: new Date("2026-04-02T10:00:00.000Z"),
      reviewedAt: new Date("2026-04-04T15:20:00.000Z"),
      studentId: USERS.studentTwo,
      supervisorId: USERS.supervisor,
    },
  ];

  for (const report of reports) {
    await db.report.upsert({
      where: { id: report.id },
      update: {},
      create: report,
    });
  }

  await db.comment.upsert({
    where: { id: "demo-comment-revision" },
    update: {},
    create: {
      id: "demo-comment-revision",
      reportId: REPORTS.revision,
      authorId: USERS.supervisor,
      isDecision: true,
      body: "Please explain the sampling method and add confidence intervals before resubmitting.",
      createdAt: new Date("2026-05-03T14:10:00.000Z"),
    },
  });

  await db.comment.upsert({
    where: { id: "demo-comment-approved" },
    update: {},
    create: {
      id: "demo-comment-approved",
      reportId: REPORTS.approved,
      authorId: USERS.supervisor,
      isDecision: true,
      body: "Clear, well-scoped proposal. Approved to proceed.",
      createdAt: new Date("2026-04-04T15:20:00.000Z"),
    },
  });

  const audits = [
    {
      id: "demo-audit-draft-created",
      reportId: REPORTS.draft,
      actorId: USERS.student,
      action: AuditAction.CREATED,
      toStatus: ReportStatus.DRAFT,
      details: "Created progress report",
      createdAt: new Date("2026-05-28T08:45:00.000Z"),
    },
    {
      id: "demo-audit-revision-submitted",
      reportId: REPORTS.revision,
      actorId: USERS.student,
      action: AuditAction.SUBMITTED,
      fromStatus: ReportStatus.DRAFT,
      toStatus: ReportStatus.SUBMITTED,
      details: "Submitted report for supervisor review",
      createdAt: new Date("2026-05-01T09:15:00.000Z"),
    },
    {
      id: "demo-audit-revision-requested",
      reportId: REPORTS.revision,
      actorId: USERS.supervisor,
      action: AuditAction.REVISION_REQUESTED,
      fromStatus: ReportStatus.UNDER_REVIEW,
      toStatus: ReportStatus.REVISION_REQUESTED,
      details: "Requested revisions with feedback",
      createdAt: new Date("2026-05-03T14:10:00.000Z"),
    },
    {
      id: "demo-audit-review-started",
      reportId: REPORTS.review,
      actorId: USERS.supervisor,
      action: AuditAction.REVIEW_STARTED,
      fromStatus: ReportStatus.SUBMITTED,
      toStatus: ReportStatus.UNDER_REVIEW,
      details: "Started supervisor review",
      createdAt: new Date("2026-06-02T08:30:00.000Z"),
    },
    {
      id: "demo-audit-approved",
      reportId: REPORTS.approved,
      actorId: USERS.supervisor,
      action: AuditAction.APPROVED,
      fromStatus: ReportStatus.UNDER_REVIEW,
      toStatus: ReportStatus.APPROVED,
      details: "Approved report",
      createdAt: new Date("2026-04-04T15:20:00.000Z"),
    },
  ];

  for (const audit of audits) {
    await db.auditLog.upsert({
      where: { id: audit.id },
      update: {},
      create: audit,
    });
  }

  console.log("Seeded demo users and reports.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
