import type { Metadata } from "next";
import { ProsePage } from "@/components/vybe/site-chrome";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <ProsePage
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="This summary explains what VYBE collects, why we collect it, and the control you have over it."
      notice="Draft for the private beta. This policy will be reviewed against the Privacy Act 1988 (Cth) and the Australian Privacy Principles before public launch."
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Account details: your email address and a securely hashed password, managed by our authentication provider.</li>
          <li>Your date of birth, used only to confirm you are 18 or over. It is never shown to other members.</li>
          <li>Profile choices: your nickname, gender, intentions, languages, interests and social preferences.</li>
          <li>Your home suburb, if you choose one. We store a suburb, not your GPS coordinates.</li>
          <li>Content you create, such as messages, posts and reports.</li>
          <li>Optional photos you upload to generate an avatar. These are stored privately and can be deleted.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To operate matching and discovery according to your settings.</li>
          <li>To keep the community safe, for example by investigating reports and enforcing our rules.</li>
          <li>To secure accounts and prevent abuse, scraping and fraud.</li>
        </ul>
        <p>We do not sell personal information, and we do not use your photos to infer your ethnicity or any other attribute.</p>
      </section>
      <section>
        <h2>Your controls</h2>
        <ul>
          <li>Hide any interest, pause discovery, or hide yourself from local discovery.</li>
          <li>Choose whether any approximate area label is shown.</li>
          <li>Delete your photos at any time, and delete your account and associated data.</li>
        </ul>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Privacy questions can be sent to the VYBE team via the contact details published at launch.</p>
      </section>
    </ProsePage>
  );
}
