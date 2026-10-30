import Link from "next/link";
import { ArrowRight, EyeOff, Lock, MapPinned, MessageCircleHeart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarOrb } from "@/components/vybe/avatar-orb";
import { OrbitField, type OrbitNode } from "@/components/vybe/orbit-field";

const HERO_NODES: OrbitNode[] = [
  { id: "a", ring: 0, angle: 20, hue: "blush", scale: 1.1 },
  { id: "b", ring: 0, angle: 200, hue: "indigo" },
  { id: "c", ring: 1, angle: 95, hue: "violet", scale: 1.05 },
  { id: "d", ring: 1, angle: 250, hue: "blush", scale: 0.9 },
  { id: "e", ring: 1, angle: 330, hue: "indigo", scale: 0.85 },
  { id: "f", ring: 2, angle: 140, hue: "indigo", scale: 0.8 },
  { id: "g", ring: 2, angle: 300, hue: "violet", scale: 0.75 },
  { id: "h", ring: 2, angle: 40, hue: "blush", scale: 0.7 },
];

const WORLDS = [
  "Cinema Planet",
  "Music Galaxy",
  "Road Trip Island",
  "Gaming Dimension",
  "Food Street",
  "Culture Circle",
  "Deep Talks Lounge",
  "Tech Universe",
];

const COMMUNITIES = [
  "Bengali Community",
  "South Asian Circle",
  "Asian Connect",
  "International Students",
  "Sydney Newcomers",
  "Night Drive Club",
  "Cinema Lovers",
  "Food Explorers",
  "Deep Conversations",
];

const DNA: { strand: string; values: string[]; hue: string }[] = [
  { strand: "Languages", values: ["Bengali", "English", "Hindi"], hue: "bg-violet" },
  { strand: "Cinema", values: ["Psychological thrillers", "Korean dramas"], hue: "bg-indigo" },
  { strand: "Music", values: ["Indie", "Bengali classics", "Lo-fi"], hue: "bg-blush" },
  { strand: "Travel", values: ["Night drives", "Coastal roads", "Spontaneous trips"], hue: "bg-violet" },
  { strand: "Social style", values: ["Introvert", "Deep conversations"], hue: "bg-indigo" },
  { strand: "Looking for", values: ["Friendship", "Maybe dating"], hue: "bg-blush" },
];

const PROMISES = [
  {
    icon: MapPinned,
    title: "Approximate, never exact",
    body: "We match on suburb-level areas and show only broad tiers like \"Nearby area\". There are no distances, no map pins and no live tracking.",
  },
  {
    icon: MessageCircleHeart,
    title: "Consent before conversation",
    body: "Nobody can message you until you accept their request. A high compatibility score never overrides your preferences.",
  },
  {
    icon: EyeOff,
    title: "Anonymous by default",
    body: "You appear as a nickname and an avatar. Any photos you upload for your avatar stay private, and you can hide any detail of your VYBE DNA.",
  },
  {
    icon: ShieldCheck,
    title: "Adults only, with real safety",
    body: "18+ only. You can block and report anyone, and our moderation team reviews reports. Optional verification arrives during the beta.",
  },
];

export default function LandingPage() {
  return (
    <main id="main" className="overflow-x-clip">
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-16 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pt-20 md:pb-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground">
            <span className="size-1.5 rounded-full bg-blush" aria-hidden="true" />
            Private beta · Sydney
          </p>
          <h1 className="mt-6 text-5xl leading-[1.02] font-semibold sm:text-6xl lg:text-7xl">
            Find someone on your <span className="text-gradient">wavelength</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Discover someone&apos;s world before you see their face. VYBE connects adults across Sydney through what they
            love, the languages they speak and the experiences they want to share. You stay anonymous, and you decide who reaches you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Create your VYBE <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">18+ only · No swiping · No face grids</p>
        </div>

        <div className="relative mx-auto w-full max-w-[520px]">
          <OrbitField nodes={HERO_NODES} />
          <figure className="glass absolute right-0 -bottom-6 w-[78%] max-w-xs rounded-2xl p-4 shadow-2xl shadow-black/40 sm:-right-4">
            <figcaption className="sr-only">Example of a match panel</figcaption>
            <div className="flex items-center gap-3">
              <AvatarOrb hue="blush" className="size-10" />
              <div className="min-w-0">
                <p className="truncate font-heading font-semibold">CoastalDrifter</p>
                <p className="text-xs text-muted-foreground">Nearby area · Friendship</p>
              </div>
              <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] tracking-wider text-muted-foreground uppercase">
                Example
              </span>
            </div>
            <p className="mt-3 text-sm">You both love late-night drives, Korean thrillers and Bengali music.</p>
          </figure>
        </div>
      </section>

      {/* VYBE DNA */}
      <section aria-labelledby="dna-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium tracking-[0.2em] text-violet uppercase">Your VYBE DNA</p>
            <h2 id="dna-heading" className="mt-3 text-3xl font-semibold sm:text-4xl">
              More than &ldquo;likes movies&rdquo;.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Bollywood romance or Korean psychological thrillers? Driver or passenger on a sunrise coastal run? Subtitles
              or dubbed? Your VYBE DNA captures the specifics, so matches come with real reasons rather than a mysterious score.
            </p>
            <p className="mt-4 text-muted-foreground">
              Every strand can be public, used for matching only, or kept private. You choose.
            </p>
          </div>

          <div className="glass rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <AvatarOrb hue="violet" className="size-12" />
              <div>
                <p className="font-heading text-lg font-semibold">MidnightNomad</p>
                <p className="text-xs text-muted-foreground">Example profile</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3">
              {DNA.map((row) => (
                <div key={row.strand} className="grid grid-cols-[6.5rem_1fr] items-start gap-3">
                  <dt className="flex items-center gap-2 pt-1 text-xs tracking-wide text-muted-foreground uppercase">
                    <span className={`size-1.5 rounded-full ${row.hue}`} aria-hidden="true" />
                    {row.strand}
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {row.values.map((v) => (
                      <span key={v} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-sm">
                        {v}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Three ways to explore */}
      <section aria-labelledby="explore-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-sm font-medium tracking-[0.2em] text-violet uppercase">Three ways to explore</p>
        <h2 id="explore-heading" className="mt-3 max-w-2xl text-3xl font-semibold sm:text-4xl">
          A living universe, not a catalogue of profiles.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <article className="glass rounded-3xl p-6">
            <h3 className="text-xl font-semibold">The Orbit</h3>
            <p className="mt-2 text-muted-foreground">
              You sit at the centre. People on your wavelength orbit around you: those in your local area on the inner
              ring, wider Sydney further out. Tap anyone to see why you connect.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Always available as a simple list, too.</p>
          </article>
          <article className="glass rounded-3xl p-6">
            <h3 className="text-xl font-semibold">Taste Galaxy</h3>
            <p className="mt-2 text-muted-foreground">Step into worlds built around what you love, and meet people who share your exact taste.</p>
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Example worlds">
              {WORLDS.map((w) => (
                <li key={w} className="rounded-full bg-indigo/10 px-2.5 py-1 text-xs text-indigo">
                  {w}
                </li>
              ))}
            </ul>
          </article>
          <article className="glass rounded-3xl p-6">
            <h3 className="text-xl font-semibold">The Pulse</h3>
            <p className="mt-2 text-muted-foreground">
              What&apos;s happening around you: groups planning a coastal drive, people up for a thriller this weekend, new
              conversation prompts.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Real activity only. It&apos;s shown in aggregate and never pins anyone to a place.
            </p>
          </article>
        </div>
      </section>

      {/* Privacy promises */}
      <section aria-labelledby="privacy-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium tracking-[0.2em] text-violet uppercase">Designed for trust</p>
            <h2 id="privacy-heading" className="mt-3 text-3xl font-semibold sm:text-4xl">
              Privacy is the product.
            </h2>
          </div>
          <Lock className="hidden size-10 text-violet/60 sm:block" aria-hidden="true" />
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {PROMISES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-3xl border border-white/8 bg-white/[0.02] p-6">
              <Icon className="size-6 text-violet" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Communities */}
      <section aria-labelledby="communities-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="communities-heading" className="text-3xl font-semibold sm:text-4xl">
          Circles you choose to join.
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Cultural and interest communities are voluntary and open to everyone who respects them. We never infer anyone&apos;s
          background.
        </p>
        <ul className="mt-8 flex flex-wrap gap-2">
          {COMMUNITIES.map((c, i) => (
            <li
              key={c}
              className={`rounded-full border px-4 py-2 text-sm ${
                ["border-violet/30 bg-violet/10", "border-indigo/30 bg-indigo/10", "border-blush/30 bg-blush/10"][i % 3]
              }`}
            >
              {c}
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-6">
        <div className="glass relative overflow-hidden rounded-[2rem] px-6 py-12 text-center sm:px-12">
          <div className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-violet/25 blur-3xl" aria-hidden="true" />
          <h2 className="relative text-3xl font-semibold sm:text-4xl">Your universe is waiting.</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-muted-foreground">
            We&apos;re opening VYBE to a small group in Sydney first. Create your anonymous VYBE and help shape what comes next.
          </p>
          <Button asChild size="lg" className="relative mt-8">
            <Link href="/signup">
              Join the private beta <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
