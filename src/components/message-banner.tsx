import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function MessageBanner({
  message,
  error,
}: {
  message?: string;
  error?: string;
}) {
  if (!message && !error) {
    return null;
  }

  const isError = Boolean(error);
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <Alert
      className={
        isError
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }
    >
      <Icon className="size-4" />
      <AlertTitle>{isError ? "Action could not be completed" : "Updated"}</AlertTitle>
      <AlertDescription>{error ?? message}</AlertDescription>
    </Alert>
  );
}
