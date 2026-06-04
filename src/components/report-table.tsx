import { ReportStatus } from "@prisma/client";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShortDate } from "@/lib/presentation";

type ReportRow = {
  id: string;
  title: string;
  reportingPeriod: string;
  status: ReportStatus;
  version: number;
  updatedAt: Date;
  student: { name: string };
  supervisor: { name: string };
};

export function ReportTable({
  reports,
  perspective,
}: {
  reports: ReportRow[];
  perspective: "student" | "supervisor" | "admin";
}) {
  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="font-medium">No reports yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Reports will appear here as they enter the workflow.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Report</TableHead>
            <TableHead className="hidden md:table-cell">
              {perspective === "student" ? "Supervisor" : "Student"}
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Updated</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <Link
                  href={`/reports/${report.id}`}
                  className="font-medium hover:underline"
                >
                  {report.title}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {report.reportingPeriod} · Version {report.version}
                </p>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {perspective === "student"
                  ? report.supervisor.name
                  : report.student.name}
              </TableCell>
              <TableCell>
                <StatusBadge status={report.status} />
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {formatShortDate(report.updatedAt)}
              </TableCell>
              <TableCell>
                <Button asChild size="icon-sm" variant="ghost">
                  <Link href={`/reports/${report.id}`} aria-label="Open report">
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
