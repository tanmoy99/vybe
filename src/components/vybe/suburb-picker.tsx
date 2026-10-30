"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { LoaderCircle, LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  searchSuburbsAction,
  setHomeSuburbAction,
  suggestSuburbAction,
  type SuburbOption,
} from "@/app/(app)/location-actions";
import { cn } from "@/lib/utils";

export function SuburbPicker({ current, onSaved }: { current: { name: string } | null; onSaved?: () => void }) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SuburbOption[]>([]);
  const [selected, setSelected] = useState<(SuburbOption & { source: "manual" | "browser_suggested" }) | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2) return;
    const t = setTimeout(async () => setResults(await searchSuburbsAction(query)), 250);
    return () => clearTimeout(t);
  }, [query]);

  function locate() {
    if (!("geolocation" in navigator)) {
      setMessage({ ok: false, text: "Location isn't available in this browser. Search instead." });
      return;
    }
    setLocating(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const s = await suggestSuburbAction(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
        if (s) setSelected({ ...s, source: "browser_suggested" });
        else setMessage({ ok: false, text: "We couldn't match that location to a NSW suburb. Search instead." });
      },
      () => {
        setLocating(false);
        setMessage({ ok: false, text: "Location permission was declined. That's fine; search instead." });
      },
      { enableHighAccuracy: false, maximumAge: 600_000, timeout: 15_000 },
    );
  }

  function save() {
    if (!selected) return;
    startSaving(async () => {
      const res = await setHomeSuburbAction(selected.id, selected.source);
      setMessage({ ok: res.ok, text: res.message });
      if (res.ok) {
        setSelected(null);
        setQuery("");
        setResults([]);
        onSaved?.();
      }
    });
  }

  return (
    <div className="space-y-4">
      {current && (
        <p className="flex items-center gap-2 text-sm">
          <MapPin className="size-4 text-violet" aria-hidden="true" />
          Home area: <strong className="font-medium">{current.name}</strong>
          <span className="text-muted-foreground">(only you can see this)</span>
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor={inputId}>{current ? "Change suburb" : "Your suburb"}</Label>
        <Input
          id={inputId}
          type="search"
          autoComplete="off"
          placeholder="Start typing, e.g. Yagoona"
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
            setSelected(null);
            if (e.currentTarget.value.trim().length < 2) setResults([]);
          }}
          aria-controls={`${inputId}-results`}
        />
        {results.length > 0 && !selected && (
          <ul id={`${inputId}-results`} aria-label="Matching suburbs" className="overflow-hidden rounded-xl border border-white/10">
            {results.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelected({ ...s, source: "manual" })}
                  className="flex min-h-11 w-full items-center justify-between px-4 text-left text-sm hover:bg-white/5"
                >
                  <span>{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.inSydney ? "Greater Sydney" : s.state}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={locate} disabled={locating}>
        {locating ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LocateFixed aria-hidden="true" />}
        Suggest from my location
      </Button>
      <p className="text-xs text-muted-foreground">
        Your location is used once to suggest a suburb and is never stored. Others only ever see broad areas like
        &ldquo;Nearby area&rdquo;.
      </p>

      {selected && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-violet/40 bg-violet/10 p-3">
          <span className="flex-1 text-sm">
            Set <strong>{selected.name}</strong> as your home area?
          </span>
          <Button type="button" size="sm" onClick={save} disabled={saving}>
            {saving && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            Save
          </Button>
        </div>
      )}

      {message && (
        <p role={message.ok ? "status" : "alert"} className={cn("text-sm", message.ok ? "text-violet" : "text-destructive")}>
          {message.text}
        </p>
      )}
    </div>
  );
}
