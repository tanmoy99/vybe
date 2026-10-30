import type { Metadata } from "next";
import { ProsePage } from "@/components/vybe/site-chrome";

export const metadata: Metadata = { title: "Safety" };

export default function SafetyPage() {
  return (
    <ProsePage
      eyebrow="Safety"
      title="Anonymous, but never lawless."
      intro="You can be publicly anonymous on VYBE, and everyone is still bound by the same safety rules."
    >
      <section>
        <h2>Built-in protections</h2>
        <ul>
          <li>Adults only: every account must be 18 or older.</li>
          <li>No one can message you until you accept their connection request.</li>
          <li>Blocking removes you from each other&apos;s discovery, communities and conversations.</li>
          <li>Location is shown only as broad areas, never as distances, addresses or map pins.</li>
          <li>Photos used to create avatars are stored privately and are never shown to other members.</li>
          <li>Rate limits and scraping protections stop people from mass-browsing profiles.</li>
        </ul>
      </section>
      <section>
        <h2>Meeting in person</h2>
        <ul>
          <li>Meet in a public place and tell a friend where you&apos;ll be.</li>
          <li>Arrange your own transport, and leave whenever you feel uncomfortable.</li>
          <li>Never send money or financial details to someone you met online.</li>
          <li>Keep conversations on VYBE until you trust someone, so our reporting tools can help.</li>
        </ul>
      </section>
      <section>
        <h2>If something goes wrong</h2>
        <p>
          Report any profile, message or post from the menu next to it. Reports are confidential: the person you report
          is not told who reported them. If you are in immediate danger, call <strong>000</strong>. For support, you can
          contact 1800RESPECT (1800 737 732) or Lifeline (13 11 14). You can also report serious online abuse to the
          eSafety Commissioner at esafety.gov.au.
        </p>
      </section>
    </ProsePage>
  );
}
