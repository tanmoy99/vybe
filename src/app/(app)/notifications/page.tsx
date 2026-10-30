import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Bell } from "lucide-react";
import { requireOnboardedProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { MarkAllRead } from "./mark-all-read";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold sm:text-4xl">Notifications</h1>
      <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-3xl bg-white/5" aria-label="Loading" />}>
        <Notifications />
      </Suspense>
    </div>
  );
}

async function Notifications() {
  const profile = await requireOnboardedProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, link, created_at, read_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const items = data ?? [];
  const unread = items.some((n) => !n.read_at);

  return (
    <div className="mt-6">
      {unread && <MarkAllRead />}
      {items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/15 p-10 text-center text-muted-foreground">
          <Bell className="size-8" aria-hidden="true" />
          Nothing yet. Requests, matches and messages will show up here.
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/8">
          {items.map((n) => {
            const content = (
              <>
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-blush")} aria-hidden="true" />
                <span className="flex-1">
                  <span className="block font-medium">{n.title}</span>
                  {n.body && <span className="block text-sm text-muted-foreground">{n.body}</span>}
                  <span className="mt-1 block text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("en-AU")}</span>
                </span>
                {!n.read_at && <span className="sr-only">(unread)</span>}
              </>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className="flex gap-3 px-4 py-3 hover:bg-white/[0.03]">
                    {content}
                  </Link>
                ) : (
                  <div className="flex gap-3 px-4 py-3">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
