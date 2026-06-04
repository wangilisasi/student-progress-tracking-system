import { ReportStatus, Role } from "@prisma/client";
import { Archive, FileText, GraduationCap, Users } from "lucide-react";

import { ReportTable } from "@/components/report-table";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guards";
import { getDb } from "@/lib/db";
import { formatShortDate, roleLabels } from "@/lib/presentation";

export const metadata = { title: "Administration" };

export default async function AdminPage() {
  await requireUser([Role.ADMIN]);

  const [users, reports] = await Promise.all([
    getDb().user.findMany({ orderBy: { createdAt: "desc" } }),
    getDb().report.findMany({
      include: {
        student: { select: { name: true } },
        supervisor: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const students = users.filter((user) => user.role === Role.STUDENT).length;
  const supervisors = users.filter(
    (user) => user.role === Role.SUPERVISOR,
  ).length;
  const finalStatuses: ReportStatus[] = [
    ReportStatus.APPROVED,
    ReportStatus.REJECTED,
    ReportStatus.ARCHIVED,
  ];
  const active = reports.filter(
    (report) => !finalStatuses.includes(report.status),
  ).length;
  const archived = reports.filter(
    (report) => report.status === ReportStatus.ARCHIVED,
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary">Admin dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          System oversight
        </h1>
        <p className="mt-2 text-muted-foreground">
          Monitor people, active review workflows, and completed records.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Users"
          value={users.length}
          detail={`${students} students · ${supervisors} supervisors`}
          icon={Users}
        />
        <StatCard
          label="Reports"
          value={reports.length}
          detail="Across all students"
          icon={FileText}
        />
        <StatCard
          label="Active workflows"
          value={active}
          detail="Awaiting action or review"
          icon={GraduationCap}
        />
        <StatCard
          label="Archived"
          value={archived}
          detail="Closed records"
          icon={Archive}
        />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>All reports</CardTitle>
          <CardDescription>
            Administrators can inspect audit trails and archive final reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportTable reports={reports} perspective="admin" />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Demo users</CardTitle>
          <CardDescription>
            Accounts currently provisioned in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabels[user.role]}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatShortDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
