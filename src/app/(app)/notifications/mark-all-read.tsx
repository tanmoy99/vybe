"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction } from "./actions";

export function MarkAllRead() {
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => start(() => markAllNotificationsReadAction())}>
      Mark all as read
    </Button>
  );
}
