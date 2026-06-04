import { ReportStatus, Role } from "@prisma/client";
import { format } from "date-fns";

export const statusLabels: Record<ReportStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  REVISION_REQUESTED: "Revision requested",
  RESUBMITTED: "Resubmitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

export const roleLabels: Record<Role, string> = {
  STUDENT: "Student",
  SUPERVISOR: "Supervisor",
  ADMIN: "Administrator",
};

export function formatDate(date: Date | null | undefined) {
  return date ? format(date, "MMM d, yyyy · HH:mm") : "Not yet";
}

export function formatShortDate(date: Date) {
  return format(date, "MMM d, yyyy");
}

export function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
