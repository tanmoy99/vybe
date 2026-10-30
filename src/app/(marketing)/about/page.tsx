import type { Metadata } from "next";
import { ProsePage } from "@/components/vybe/site-chrome";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <ProsePage
      eyebrow="About VYBE"
      title="Discover someone's world before their face."
      intro="VYBE is a Sydney-born social discovery platform for adults who'd rather connect through culture, taste and shared plans than through a stack of photos."
    >
      <section>
        <h2>Why we&apos;re building it</h2>
        <p>
          Moving to a new city, studying far from home, or simply wanting people who get your references can be lonely.
          Most apps rank people by their photos. We think the better starting point is what someone loves, the languages
          they think in, and what they want to do this weekend.
        </p>
      </section>
      <section>
        <h2>What makes it different</h2>
        <ul>
          <li>Anonymous nicknames and stylised 3D avatars instead of face grids.</li>
          <li>A detailed VYBE DNA instead of a short list of interests.</li>
          <li>Friendship, dating and community, each with clear, mutual intentions.</li>
          <li>Suburb-first discovery that never reveals where anyone actually is.</li>
          <li>Plain-language reasons for every match, not mysterious percentages.</li>
        </ul>
      </section>
      <section>
        <h2>Where we are</h2>
        <p>
          VYBE is in private beta in Sydney. Features roll out in phases, and we&apos;ll be open about what exists today and
          what&apos;s still coming.
        </p>
      </section>
    </ProsePage>
  );
}
