"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AvatarOrb } from "@/components/vybe/avatar-orb";
import { ReportDialog } from "@/components/vybe/report-dialog";
import { hueFor } from "@/lib/person-hue";
import { blockAction, respondToRequestAction, withdrawRequestAction } from "./actions";

export function RequestCard({
  direction,
  requestId,
  personId,
  nickname,
  kind,
  note,
}: {
  direction: "incoming" | "outgoing";
  requestId: string;
  personId: string;
  nickname: string;
  kind: string;
  note: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <AvatarOrb hue={hueFor(personId)} className="size-11" />
        <div>
          <p className="font-heading font-semibold">{nickname}</p>
          <p className="text-xs text-muted-foreground">{kind === "dating" ? "Dating" : "Friendship"} request</p>
        </div>
      </div>
      {note && <p className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-sm">&ldquo;{note}&rdquo;</p>}
      {message ? (
        <p role="status" className="mt-3 text-sm text-violet">
          {message}
        </p>
      ) : direction === "incoming" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await respondToRequestAction(requestId, true);
                if (r.ok && r.conversationId) router.push(`/connections/${r.conversationId}`);
                else setMessage(r.message);
              })
            }
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => start(async () => setMessage((await respondToRequestAction(requestId, false)).message))}
          >
            Decline
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => start(async () => setMessage((await blockAction(personId)).message))}
          >
            Block
          </Button>
          <ReportDialog targetType="user" targetId={personId} />
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Waiting for them to respond</span>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => start(async () => setMessage((await withdrawRequestAction(requestId)).message))}
          >
            Withdraw
          </Button>
        </div>
      )}
    </div>
  );
}
