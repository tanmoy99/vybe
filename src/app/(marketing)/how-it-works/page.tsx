import type { Metadata } from "next";
import { ProsePage } from "@/components/vybe/site-chrome";

export const metadata: Metadata = { title: "How it works" };

const STEPS = [
  {
    title: "1. Create an anonymous VYBE",
    body: "Pick a nickname, tell us what you're here for (friendship, dating, both, or just communities) and who you'd like to meet. We confirm you're 18 or over.",
  },
  {
    title: "2. Grow your VYBE DNA",
    body: "Go deeper than \"likes music\": Bengali classics or K-pop, night drives or sunrise hikes, subtitles or dubbed. Hide anything you like.",
  },
  {
    title: "3. Choose your home area",
    body: "Select your suburb. We use it only to rank people by broad areas such as \"Nearby area\" or \"Greater Sydney\". Nobody sees your exact location, and your suburb stays hidden unless you choose to show it.",
  },
  {
    title: "4. Explore your Orbit",
    body: "People on your wavelength appear around you. Tap anyone to see what you share, and where you differ.",
  },
  {
    title: "5. Connect by consent",
    body: "Send an interest request with a conversation spark. Chat opens only when they accept. You can unmatch, block or report at any time.",
  },
];

export default function HowItWorksPage() {
  return (
    <ProsePage
      eyebrow="How it works"
      title="From your world to theirs, in five steps."
      intro="No swiping, no endless face grids. VYBE matches you on the specifics that actually make people click."
    >
      {STEPS.map((step) => (
        <section key={step.title}>
          <h2>{step.title}</h2>
          <p>{step.body}</p>
        </section>
      ))}
      <section>
        <h2>How matching works</h2>
        <p>
          First we apply hard rules that a score can never override: age, mutual preferences, intentions, blocks and
          privacy settings. Among eligible people, we consider shared interests, broad proximity, intentions, languages,
          activity preferences and communication style. Then we tell you why in plain words, such as &ldquo;You both love
          Korean thrillers and coastal drives.&rdquo; These are signals, not science, and we never claim a percentage
          defines a person.
        </p>
      </section>
    </ProsePage>
  );
}
