import type { Metadata } from "next";
import { ProsePage } from "@/components/vybe/site-chrome";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <ProsePage
      eyebrow="Terms"
      title="Terms of Use"
      intro="The rules for using VYBE during the private beta."
      notice="Draft for the private beta. These terms will be reviewed by a qualified Australian lawyer, including against Australian Consumer Law and online safety and dating-industry requirements, before public launch."
    >
      <section>
        <h2>Eligibility</h2>
        <p>You must be at least 18 years old to create an account. One person, one account.</p>
      </section>
      <section>
        <h2>Community rules</h2>
        <ul>
          <li>Be respectful. No harassment, hate, threats or sexual content directed at people who haven&apos;t consented.</li>
          <li>Don&apos;t impersonate anyone or share other people&apos;s private information.</li>
          <li>Don&apos;t try to find out where someone lives or track their location.</li>
          <li>Don&apos;t scrape, automate or bulk-collect data from VYBE.</li>
          <li>No spam, scams, solicitation or commercial promotion without permission.</li>
        </ul>
      </section>
      <section>
        <h2>Enforcement</h2>
        <p>
          We may remove content, limit features, or suspend or ban accounts that break these rules, and we may cooperate
          with law enforcement where required by law.
        </p>
      </section>
      <section>
        <h2>Beta software</h2>
        <p>VYBE is in active development. Features may change, and we&apos;ll communicate significant changes.</p>
      </section>
    </ProsePage>
  );
}
