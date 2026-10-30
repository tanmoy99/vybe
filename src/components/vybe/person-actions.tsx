"use client";

import { useState, useTransition } from "react";
import { Ban, Heart, LoaderCircle, Send } from "lucide-react";
import { blockAction, sendInterestAction } from "@/app/(app)/connections/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReportDialog } from "@/components/vybe/report-dialog";
import type { PanelPerson } from "@/components/vybe/person-panel";
import { cn } from "@/lib/utils";

/** Send interest (consent-based), block and report, shown in the person panel. */
export function PersonActions({ person, onRemoved }: { person: PanelPerson; onRemoved: () => void }) {
  const [note, setNote] = useState(person.spark);
  const [kind, setKind] = useState<"friendship" | "dating">("friendship");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [pending, start] = useTransition();
  const chooseKind = person.connectionKind === "dating_or_friendship";

  if (result?.ok) {
    return (
      <p role="status" className="rounded-2xl border border-violet/40 bg-violet/10 p-4">
        {result.message}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {chooseKind && (
        <div role="radiogroup" aria-label="Connect as" className="flex gap-2">
          {(["friendship", "dating"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                "h-10 flex-1 rounded-xl border border-white/10 text-sm",
                kind === k ? "border-violet bg-violet/15" : "text-muted-foreground",
              )}
            >
              {k === "friendship" ? "As friends" : "For dating"}
            </button>
          ))}
        </div>
      )}
      <label className="block space-y-2 text-sm">
        <span>Add a note (optional)</span>
        <Textarea value={note} onChange={(e) => setNote(e.currentTarget.value)} maxLength={300} rows={2} className="rounded-xl text-base" />
      </label>
      {result && !result.ok && (
        <p role="alert" className="text-sm text-destructive">
          {result.message}
        </p>
      )}
      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() => start(async () => setResult(await sendInterestAction(person.id, chooseKind ? kind : null, note)))}
      >
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Heart aria-hidden="true" />}
        Send interest
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        <Send className="mr-1 inline size-3" aria-hidden="true" />
        Chat opens only if they accept.
      </p>

      <div className="flex items-center justify-center gap-2 border-t border-white/5 pt-3">
        {confirmBlock ? (
          <>
            <span className="text-sm">Block {person.nickname}?</span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await blockAction(person.id);
                  if (r.ok) onRemoved();
                  else setResult(r);
                })
              }
            >
              Block
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmBlock(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmBlock(true)}>
              <Ban aria-hidden="true" /> Block
            </Button>
            <ReportDialog targetType="user" targetId={person.id} />
          </>
        )}
      </div>
    </div>
  );
}
