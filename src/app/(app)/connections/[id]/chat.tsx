"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Flag, LoaderCircle, MoreVertical, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { AvatarOrb } from "@/components/vybe/avatar-orb";
import { ReportDialog } from "@/components/vybe/report-dialog";
import { hueFor } from "@/lib/person-hue";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { blockAction, markReadAction, sendMessageAction, unmatchAction } from "../actions";

type Message = { id: string; sender_id: string; body: string; created_at: string };

export function Chat({
  conversationId,
  me,
  peer,
  initialMessages,
}: {
  conversationId: string;
  me: string;
  peer: { id: string; nickname: string; kind: string; canMessage: boolean };
  initialMessages: Message[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [closed, setClosed] = useState(!peer.canMessage);
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  // Realtime: RLS ensures only conversation members receive these rows.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== me) void markReadAction(conversationId);
        },
      )
      .subscribe();
    void markReadAction(conversationId);
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, me]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function send() {
    const body = draft.trim();
    if (!body) return;
    start(async () => {
      const res = await sendMessageAction(conversationId, body);
      if (!res.ok) {
        setError(res.message);
        if (/closed/.test(res.message)) setClosed(true);
        return;
      }
      setError(null);
      setDraft("");
      if (res.id) {
        setMessages((prev) =>
          prev.some((x) => x.id === res.id) ? prev : [...prev, { id: res.id!, sender_id: me, body, created_at: new Date().toISOString() }],
        );
      }
    });
  }

  return (
    <div className="-mt-4 flex h-[calc(100dvh-11rem)] flex-col md:h-[calc(100dvh-9rem)]">
      <header className="flex items-center gap-3 border-b border-white/5 pb-3">
        <Button asChild variant="ghost" size="icon" aria-label="Back to connections">
          <Link href="/connections">
            <ArrowLeft aria-hidden="true" />
          </Link>
        </Button>
        <AvatarOrb hue={hueFor(peer.id)} className="size-10" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-lg font-semibold">{peer.nickname}</h1>
          <p className="text-xs text-muted-foreground">{peer.kind === "dating" ? "Dating match" : "Friendship match"}</p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Conversation options">
              <MoreVertical aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="glass mx-auto max-w-md rounded-t-3xl border-white/10 pb-8">
            <SheetHeader>
              <SheetTitle>{peer.nickname}</SheetTitle>
              <SheetDescription>Safety options. They won&apos;t be notified.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-2 px-4">
              <ReportDialog
                targetType="user"
                targetId={peer.id}
                trigger={
                  <Button variant="outline">
                    <Flag aria-hidden="true" /> Report {peer.nickname}
                  </Button>
                }
              />
              <form action={unmatchAction.bind(null, conversationId)}>
                <Button type="submit" variant="outline" className="w-full">
                  Unmatch
                </Button>
              </form>
              <Button
                variant="destructive"
                onClick={() =>
                  start(async () => {
                    const r = await blockAction(peer.id);
                    if (r.ok) router.push("/connections");
                  })
                }
              >
                Block
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto py-4" role="log" aria-live="polite" aria-label={`Messages with ${peer.nickname}`}>
        {messages.length === 0 && (
          <p className="mx-auto max-w-sm py-10 text-center text-sm text-muted-foreground">
            You matched! Start with something you both love. Keep personal details like your address private until you
            trust someone.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={cn("group flex items-end gap-1", mine ? "justify-end" : "justify-start")}>
              {!mine && (
                <ReportDialog
                  targetType="message"
                  targetId={m.id}
                  trigger={
                    <button
                      type="button"
                      className="order-last rounded-full p-1 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      aria-label="Report this message"
                    >
                      <Flag className="size-3.5" aria-hidden="true" />
                    </button>
                  }
                />
              )}
              <p
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 break-words whitespace-pre-wrap",
                  mine ? "rounded-br-md bg-violet text-primary-foreground" : "rounded-bl-md bg-surface-2",
                )}
              >
                {m.body}
                <span className="sr-only">
                  {mine ? " (you)" : ` (${peer.nickname})`}, {new Date(m.created_at).toLocaleTimeString()}
                </span>
              </p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {closed ? (
        <p className="rounded-2xl border border-white/10 p-4 text-center text-sm text-muted-foreground">This conversation has ended.</p>
      ) : (
        <form
          className="flex items-end gap-2 border-t border-white/5 pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <Textarea
            id="message"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            maxLength={2000}
            rows={1}
            placeholder="Write a message"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl text-base"
          />
          <Button type="submit" size="icon" disabled={pending || !draft.trim()} aria-label="Send">
            {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <SendHorizontal aria-hidden="true" />}
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="pt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
