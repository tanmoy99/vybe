import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { RequestCard } from "./request-card";
import { AvatarOrb } from "@/components/vybe/avatar-orb";
import { hueFor } from "@/lib/person-hue";

export const metadata: Metadata = { title: "Connections" };

export default function ConnectionsPage() {
  return (
    <div>
      <p className="text-sm font-medium tracking-[0.2em] text-violet uppercase">Connections</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Your conversations</h1>
      <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-3xl bg-white/5" aria-label="Loading" />}>
        <Connections />
      </Suspense>
    </div>
  );
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

async function Connections() {
  await requireOnboardedProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_connections");
  if (error) throw new Error("Couldn't load connections.");
  const rows = data ?? [];
  const incoming = rows.filter((r) => r.kind === "incoming");
  const outgoing = rows.filter((r) => r.kind === "outgoing");
  const matches = rows
    .filter((r) => r.kind === "match")
    .sort((a, b) => (b.last_message_at ?? b.created_at).localeCompare(a.last_message_at ?? a.created_at));

  return (
    <div className="mt-8 space-y-10">
      {incoming.length > 0 && (
        <section aria-labelledby="incoming-h">
          <h2 id="incoming-h" className="text-lg font-semibold">
            Interested in you <span className="text-muted-foreground">({incoming.length})</span>
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {incoming.map((r) => (
              <li key={r.request_id}>
                <RequestCard
                  direction="incoming"
                  requestId={r.request_id!}
                  personId={r.person_id}
                  nickname={r.nickname}
                  kind={r.connection_type}
                  note={r.note}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="matches-h">
        <h2 id="matches-h" className="text-lg font-semibold">
          Matches
        </h2>
        {matches.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-dashed border-white/15 p-6 text-center text-muted-foreground">
            No matches yet. Find people on your wavelength in{" "}
            <Link href="/radar" className="text-violet underline-offset-4 hover:underline">
              Radar
            </Link>
            .
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/8">
            {matches.map((m) => (
              <li key={m.conversation_id}>
                <Link href={`/connections/${m.conversation_id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03]">
                  <AvatarOrb hue={hueFor(m.person_id)} className="size-12 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-heading font-semibold">{m.nickname}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(m.last_message_at ?? m.created_at)}</span>
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {m.last_message ?? (m.connection_type === "dating" ? "New dating match. Say hello!" : "New friend. Say hello!")}
                    </span>
                  </span>
                  {m.unread > 0 && (
                    <span className="rounded-full bg-blush px-2 py-0.5 text-xs font-semibold text-background">
                      {m.unread}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section aria-labelledby="sent-h">
          <h2 id="sent-h" className="text-lg font-semibold">
            Sent <span className="text-muted-foreground">({outgoing.length})</span>
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {outgoing.map((r) => (
              <li key={r.request_id}>
                <RequestCard
                  direction="outgoing"
                  requestId={r.request_id!}
                  personId={r.person_id}
                  nickname={r.nickname}
                  kind={r.connection_type}
                  note={r.note}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
