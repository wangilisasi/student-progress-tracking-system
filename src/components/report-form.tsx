import { Report } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReportFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  report?: Report;
  supervisors?: { id: string; name: string; email: string }[];
  submitLabel: string;
};

export function ReportForm({
  action,
  report,
  supervisors,
  submitLabel,
}: ReportFormProps) {
  return (
    <form action={action} className="space-y-6">
      {report ? <input type="hidden" name="reportId" value={report.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Report title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={report?.title}
            placeholder="e.g. Prototype evaluation and revised methodology"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reportingPeriod">Reporting period</Label>
          <Input
            id="reportingPeriod"
            name="reportingPeriod"
            defaultValue={report?.reportingPeriod}
            placeholder="e.g. June 2026"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hoursWorked">Hours worked</Label>
          <Input
            id="hoursWorked"
            name="hoursWorked"
            type="number"
            min="0"
            max="1000"
            defaultValue={report?.hoursWorked ?? 0}
            required
          />
        </div>
        {supervisors ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="supervisorId">Supervisor</Label>
            <select
              id="supervisorId"
              name="supervisorId"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              required
            >
              <option value="">Select a supervisor</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.name} ({supervisor.email})
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <ReportTextarea
        name="summary"
        label="Executive summary"
        placeholder="Summarize this reporting period and the overall direction of your work."
        value={report?.summary}
      />
      <ReportTextarea
        name="accomplishments"
        label="Accomplishments"
        placeholder="Describe completed work, milestones, evidence, and outcomes."
        value={report?.accomplishments}
      />
      <ReportTextarea
        name="challenges"
        label="Challenges and blockers"
        placeholder="Explain blockers, risks, and where support may be needed."
        value={report?.challenges}
      />
      <ReportTextarea
        name="nextSteps"
        label="Next steps"
        placeholder="List the concrete work planned for the next reporting period."
        value={report?.nextSteps}
      />

      {report ? (
        <div className="rounded-xl border bg-muted/35 p-4">
          <p className="text-sm font-medium">Add an optional attachment link</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add a durable link to a document, dataset, repository, or shared file.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="attachmentName">Display name</Label>
              <Input
                id="attachmentName"
                name="attachmentName"
                placeholder="Evaluation results"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachmentUrl">URL</Label>
              <Input
                id="attachmentUrl"
                name="attachmentUrl"
                type="url"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      ) : null}

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}

function ReportTextarea({
  name,
  label,
  placeholder,
  value,
}: {
  name: string;
  label: string;
  placeholder: string;
  value?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        name={name}
        defaultValue={value}
        placeholder={placeholder}
        rows={5}
        required
      />
    </div>
  );
}
