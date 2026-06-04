import { ReportStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusLabels } from "@/lib/presentation";

const statusClasses: Record<ReportStatus, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  SUBMITTED: "border-blue-200 bg-blue-50 text-blue-700",
  UNDER_REVIEW: "border-violet-200 bg-violet-50 text-violet-700",
  REVISION_REQUESTED: "border-amber-200 bg-amber-50 text-amber-800",
  RESUBMITTED: "border-cyan-200 bg-cyan-50 text-cyan-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  ARCHIVED: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap font-medium", statusClasses[status], className)}
    >
      {statusLabels[status]}
    </Badge>
  );
}
