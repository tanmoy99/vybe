import Link from "next/link";
import { Bell } from "lucide-react";
import { getSessionUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

/** Header bell with unread count. Reads the session, so render inside <Suspense>. */
export async function NotificationBell() {
  const user = await getSessionUser();
  let count = 0;
  if (user) {
    const supabase = await createClient();
    const { count: c } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    count = c ?? 0;
  }
  return <BellLink count={count} />;
}

export function BellLink({ count }: { count: number }) {
  return (
    <Link
      href="/notifications"
      className="relative flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground"
      aria-label={count ? `Notifications, ${count} unread` : "Notifications"}
    >
      <Bell className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute top-1 right-1 min-w-4 rounded-full bg-blush px-1 text-center text-[10px] leading-4 font-semibold text-background">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
