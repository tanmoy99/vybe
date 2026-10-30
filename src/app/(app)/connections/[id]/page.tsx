import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { Chat } from "./chat";

export const metadata: Metadata = { title: "Chat" };

export default function ChatPage({ params }: PageProps<"/connections/[id]">) {
  return (
    <Suspense fallback={<div className="h-[70dvh] animate-pulse rounded-3xl bg-white/5" aria-label="Loading chat" />}>
      <ChatLoader params={params} />
    </Suspense>
  );
}

async function ChatLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const profile = await requireOnboardedProfile();
  const supabase = await createClient();

  const { data: peers } = await supabase.rpc("conversation_peer", { p_conversation: id });
  const peer = peers?.[0];
  if (!peer) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <Chat
      conversationId={id}
      me={profile.id}
      peer={{ id: peer.person_id, nickname: peer.nickname, kind: peer.match_kind, canMessage: peer.can_message }}
      initialMessages={(messages ?? []).reverse()}
    />
  );
}
