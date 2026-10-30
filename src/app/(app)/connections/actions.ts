"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: boolean; message: string; conversationId?: string };

const uuid = z.uuid();

function friendly(message: string): string {
  if (/RATE_LIMITED/.test(message)) return "You're doing that a lot. Please take a break and try again later.";
  if (/ALREADY_CONNECTED/.test(message)) return "You're already connected.";
  if (/ALREADY_REQUESTED/.test(message)) return "You've already sent them a request.";
  if (/CANNOT_REQUEST/.test(message)) return "You can't connect with this person right now.";
  if (/NOTE_TOO_LONG/.test(message)) return "Keep your note under 300 characters.";
  if (/NOT_FOUND/.test(message)) return "That's no longer available.";
  return "Something went wrong. Please try again.";
}

export async function sendInterestAction(personId: string, kind: "dating" | "friendship" | null, note: string): Promise<ActionResult> {
  await requireOnboardedProfile();
  if (!uuid.safeParse(personId).success) return { ok: false, message: "Invalid person." };
  const trimmed = note.trim().slice(0, 300);
  const supabase = await createClient();
  const { error } = await supabase.rpc("send_connection_request", {
    p_recipient: personId,
    p_kind: kind ?? undefined,
    p_note: trimmed || undefined,
  });
  if (error) return { ok: false, message: friendly(error.message) };
  revalidatePath("/connections");
  return { ok: true, message: "Interest sent. If they accept, you can start chatting." };
}

export async function respondToRequestAction(requestId: string, accept: boolean): Promise<ActionResult> {
  await requireOnboardedProfile();
  if (!uuid.safeParse(requestId).success) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("respond_connection_request", { p_request: requestId, p_accept: accept });
  if (error) return { ok: false, message: friendly(error.message) };
  revalidatePath("/connections");
  return accept
    ? { ok: true, message: "You're connected!", conversationId: data ?? undefined }
    : { ok: true, message: "Request declined. They won't be told." };
}

export async function withdrawRequestAction(requestId: string): Promise<ActionResult> {
  await requireOnboardedProfile();
  if (!uuid.safeParse(requestId).success) return { ok: false, message: "Invalid request." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_connection_request", { p_request: requestId });
  if (error) return { ok: false, message: friendly(error.message) };
  revalidatePath("/connections");
  return { ok: true, message: "Request withdrawn." };
}

export async function unmatchAction(conversationId: string) {
  await requireOnboardedProfile();
  if (!uuid.safeParse(conversationId).success) return;
  const supabase = await createClient();
  await supabase.rpc("unmatch", { p_conversation: conversationId });
  revalidatePath("/connections");
  redirect("/connections");
}

export async function blockAction(personId: string): Promise<ActionResult> {
  await requireOnboardedProfile();
  if (!uuid.safeParse(personId).success) return { ok: false, message: "Invalid person." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("block_user", { p_user: personId });
  if (error) return { ok: false, message: friendly(error.message) };
  revalidatePath("/connections");
  revalidatePath("/radar");
  return { ok: true, message: "Blocked. You won't see each other anywhere on VYBE." };
}

export async function unblockAction(personId: string): Promise<ActionResult> {
  await requireOnboardedProfile();
  if (!uuid.safeParse(personId).success) return { ok: false, message: "Invalid person." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("unblock_user", { p_user: personId });
  if (error) return { ok: false, message: friendly(error.message) };
  revalidatePath("/me/blocked");
  return { ok: true, message: "Unblocked." };
}

const reportSchema = z.object({
  targetType: z.enum(["user", "message", "post", "comment"]),
  targetId: z.string().min(1).max(64),
  reason: z.enum(["harassment", "hate", "sexual_content", "spam_or_scam", "impersonation", "underage", "privacy", "violence", "other"]),
  details: z.string().trim().max(1000).optional(),
});

export async function reportAction(input: z.input<typeof reportSchema>): Promise<ActionResult> {
  await requireOnboardedProfile();
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please choose a reason." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("report_content", {
    p_target_type: parsed.data.targetType,
    p_target_id: parsed.data.targetId,
    p_reason: parsed.data.reason,
    p_details: parsed.data.details || undefined,
  });
  if (error) return { ok: false, message: friendly(error.message) };
  return { ok: true, message: "Thanks for reporting. Our team will review it. The person won't know it was you." };
}

export async function sendMessageAction(conversationId: string, body: string): Promise<ActionResult & { id?: string }> {
  const profile = await requireOnboardedProfile();
  const text = body.trim();
  if (!uuid.safeParse(conversationId).success) return { ok: false, message: "Invalid conversation." };
  if (text.length === 0 || text.length > 2000) return { ok: false, message: "Messages can be 1 to 2,000 characters." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: profile.id, body: text })
    .select("id")
    .single();
  if (error) {
    if (/RATE_LIMITED/.test(error.message)) return { ok: false, message: "Slow down a little. Try again in a minute." };
    return { ok: false, message: "This conversation is closed." };
  }
  return { ok: true, message: "", id: data.id };
}

export async function markReadAction(conversationId: string) {
  const profile = await requireOnboardedProfile();
  if (!uuid.safeParse(conversationId).success) return;
  const supabase = await createClient();
  await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", profile.id);
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .eq("link", `/connections/${conversationId}`)
    .is("read_at", null);
}
