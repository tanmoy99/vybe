"use client";

import { useState, useTransition } from "react";
import { Flag, LoaderCircle } from "lucide-react";
import { reportAction } from "@/app/(app)/connections/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ChoiceGroup } from "@/components/vybe/choice";

const REASONS = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate or discrimination" },
  { value: "sexual_content", label: "Unwanted sexual content" },
  { value: "spam_or_scam", label: "Spam or scam" },
  { value: "impersonation", label: "Pretending to be someone" },
  { value: "underage", label: "May be under 18" },
  { value: "privacy", label: "Sharing private information" },
  { value: "violence", label: "Threats or violence" },
  { value: "other", label: "Something else" },
];

export function ReportDialog({
  targetType,
  targetId,
  label = "Report",
  trigger,
}: {
  targetType: "user" | "message" | "post" | "comment";
  targetId: string;
  label?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setResult(null);
          setReason(null);
          setDetails("");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="ghost" size="sm">
            <Flag aria-hidden="true" /> {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass max-h-[90dvh] overflow-y-auto rounded-3xl border-white/10">
        <DialogHeader>
          <DialogTitle>Report</DialogTitle>
          <DialogDescription>Reports are confidential. If you&apos;re in danger, call 000.</DialogDescription>
        </DialogHeader>
        {result?.ok ? (
          <p role="status" className="py-4">
            {result.message}
          </p>
        ) : (
          <div className="space-y-4">
            <ChoiceGroup
              name="reason"
              legend="What's happening?"
              options={REASONS}
              columns={1}
              onValueChange={(v) => setReason(v)}
            />
            <label className="block space-y-2 text-sm">
              <span>Anything else we should know? (optional)</span>
              <Textarea value={details} onChange={(e) => setDetails(e.currentTarget.value)} maxLength={1000} rows={3} className="rounded-xl text-base" />
            </label>
            {result && !result.ok && (
              <p role="alert" className="text-sm text-destructive">
                {result.message}
              </p>
            )}
            <Button
              type="button"
              className="w-full"
              disabled={!reason || pending}
              onClick={() =>
                start(async () =>
                  setResult(await reportAction({ targetType, targetId, reason: reason as "other", details })),
                )
              }
            >
              {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              Send report
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
