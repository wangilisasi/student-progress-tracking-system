"use server";

import { Role } from "@prisma/client";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { requireUser } from "@/lib/auth-guards";
import {
  addComment,
  archiveReport,
  createReport,
  decideReport,
  ReviewDecision,
  startReview,
  submitReport,
  updateReport,
} from "@/lib/report-workflow";

const reportSchema = z.object({
  title: z.string().trim().min(3).max(160),
  reportingPeriod: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(10).max(5000),
  accomplishments: z.string().trim().min(10).max(10000),
  challenges: z.string().trim().min(2).max(10000),
  nextSteps: z.string().trim().min(10).max(10000),
  hoursWorked: z.coerce.number().int().min(0).max(1000),
});

function formValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function parseReport(formData: FormData) {
  return reportSchema.parse({
    title: formValue(formData, "title"),
    reportingPeriod: formValue(formData, "reportingPeriod"),
    summary: formValue(formData, "summary"),
    accomplishments: formValue(formData, "accomplishments"),
    challenges: formValue(formData, "challenges"),
    nextSteps: formValue(formData, "nextSteps"),
    hoursWorked: formValue(formData, "hoursWorked"),
  });
}

function pathWithNotice(path: string, key: "message" | "error", value: string) {
  return `${path}?${key}=${encodeURIComponent(value)}`;
}

function reportPath(reportId: string, key: "message" | "error", value: string) {
  return pathWithNotice(`/reports/${reportId}`, key, value);
}

function newReportPath(key: "message" | "error", value: string) {
  return pathWithNotice("/reports/new", key, value);
}

function actionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => {
        const field = issue.path.join(".");
        return field ? `${field}: ${issue.message}` : issue.message;
      })
      .join("; ");
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formValue(formData, "email").toLowerCase(),
      password: formValue(formData, "password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=Invalid%20email%20or%20password");
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function createReportAction(formData: FormData) {
  const user = await requireUser([Role.STUDENT]);

  let reportId: string;
  try {
    const input = parseReport(formData);
    const report = await createReport(
      user.id,
      formValue(formData, "supervisorId"),
      input,
    );
    reportId = report.id;
    revalidatePath("/dashboard");
  } catch (error) {
    redirect(newReportPath("error", actionErrorMessage(error, "Could not create report")));
  }

  redirect(reportPath(reportId, "message", "Draft report created"));
}

export async function updateReportAction(formData: FormData) {
  const user = await requireUser([Role.STUDENT]);
  const reportId = formValue(formData, "reportId");

  try {
    const attachmentUrl = formValue(formData, "attachmentUrl").trim();
    const attachment = attachmentUrl
      ? {
          url: z.string().url().parse(attachmentUrl),
          name: formValue(formData, "attachmentName").trim() || "Reference link",
        }
      : undefined;

    await updateReport(user.id, reportId, parseReport(formData), attachment);
    revalidatePath(`/reports/${reportId}`);
  } catch (error) {
    redirect(
      reportPath(
        reportId,
        "error",
        actionErrorMessage(error, "Could not update report"),
      ),
    );
  }

  redirect(reportPath(reportId, "message", "Report saved"));
}

export async function submitReportAction(formData: FormData) {
  const user = await requireUser([Role.STUDENT]);
  const reportId = formValue(formData, "reportId");

  try {
    await submitReport(user.id, reportId);
    revalidatePath(`/reports/${reportId}`);
    revalidatePath("/dashboard");
  } catch (error) {
    redirect(
      reportPath(
        reportId,
        "error",
        actionErrorMessage(error, "Could not submit report"),
      ),
    );
  }

  redirect(reportPath(reportId, "message", "Report submitted for review"));
}

export async function startReviewAction(formData: FormData) {
  const user = await requireUser([Role.SUPERVISOR]);
  const reportId = formValue(formData, "reportId");

  try {
    await startReview(user.id, reportId);
    revalidatePath(`/reports/${reportId}`);
    revalidatePath("/dashboard");
  } catch (error) {
    redirect(
      reportPath(
        reportId,
        "error",
        actionErrorMessage(error, "Could not start review"),
      ),
    );
  }

  redirect(reportPath(reportId, "message", "Review started"));
}

export async function decideReportAction(formData: FormData) {
  const user = await requireUser([Role.SUPERVISOR]);
  const reportId = formValue(formData, "reportId");

  try {
    const decision = z
      .enum(["REVISION_REQUESTED", "APPROVED", "REJECTED"])
      .parse(formValue(formData, "decision")) as ReviewDecision;
    await decideReport(
      user.id,
      reportId,
      decision,
      formValue(formData, "feedback"),
    );
    revalidatePath(`/reports/${reportId}`);
    revalidatePath("/dashboard");
  } catch (error) {
    redirect(
      reportPath(
        reportId,
        "error",
        actionErrorMessage(error, "Could not record decision"),
      ),
    );
  }

  redirect(reportPath(reportId, "message", "Review decision recorded"));
}

export async function addCommentAction(formData: FormData) {
  const user = await requireUser();
  const reportId = formValue(formData, "reportId");

  try {
    await addComment(user.id, reportId, formValue(formData, "body"));
    revalidatePath(`/reports/${reportId}`);
  } catch (error) {
    redirect(
      reportPath(
        reportId,
        "error",
        actionErrorMessage(error, "Could not add comment"),
      ),
    );
  }

  redirect(reportPath(reportId, "message", "Comment added"));
}

export async function archiveReportAction(formData: FormData) {
  const user = await requireUser([Role.ADMIN]);
  const reportId = formValue(formData, "reportId");

  try {
    await archiveReport(user.id, reportId);
    revalidatePath(`/reports/${reportId}`);
    revalidatePath("/admin");
  } catch (error) {
    redirect(
      reportPath(
        reportId,
        "error",
        actionErrorMessage(error, "Could not archive report"),
      ),
    );
  }

  redirect(reportPath(reportId, "message", "Report archived"));
}
