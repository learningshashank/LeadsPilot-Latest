import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsOfService,
});

function TermsOfService() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-paper-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-lg font-semibold text-ink-950">
            LeadsPilot
          </Link>
          <Link to="/" className="text-sm text-ink-600 hover:text-ink-950">
            ← Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-semibold text-ink-950">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-500">Last updated: September 4, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-700">
          <section>
            <h2 className="text-lg font-semibold text-ink-950">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By creating an account, accessing, or using LeadsPilot ("Service," "Platform"), you enter into a binding legal agreement with LeadsPilot ("we," "us," or "our") and agree to these Terms of Service and our{" "}
              <Link to="/privacy" className="text-brass-dark underline">
                Privacy Policy
              </Link>
              . If you are accepting on behalf of a company or other legal entity, you represent that you have the authority to bind such entity to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">2. Description of Service</h2>
            <p className="mt-2">
              LeadsPilot provides a B2B SaaS platform offering AI-driven lead discovery, public profile enrichment, personalized outreach copy generation, and multi-channel campaign automation (including Email, LinkedIn, and WhatsApp integrations).
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>LeadsPilot acts as a software tool to automate prospecting tasks at your direct instruction and parameter settings.</li>
              <li>We do not guarantee specific conversion rates, response rates, sales outcomes, or deliverability metrics, as these depend on third-party mail servers, recipient settings, and your campaign content.</li>
              <li>You retain sole control over campaign target criteria, messaging content, and sending cadence.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">3. Accounts and Credentials</h2>
            <p className="mt-2">
              You must provide accurate information when setting up your account. You are responsible for safeguarding your login credentials and integration tokens (e.g., SMTP/IMAP credentials, session cookies, API keys). You accept full responsibility for all activities occurring under your account or connected integration channels.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">4. Subscriptions, Billing, and Credits</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><strong>Billing Cycle:</strong> Subscription plans (Monthly/Annual) and search/enrichment credit allotments are detailed on our Pricing page and are billed in advance via our payment processors (e.g., Razorpay or Stripe).</li>
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time. Your access will remain active until the conclusion of the current paid billing cycle.</li>
              <li><strong>Refunds:</strong> Payments are non-refundable except where explicitly required by applicable law or agreed upon in writing. Unused monthly search credits expire at the end of each billing cycle and do not roll over.</li>
              <li><strong>Price Revisions:</strong> We reserve the right to modify subscription pricing or credit allocations upon reasonable advance notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">5. Acceptable Use and Anti-Spam Compliance</h2>
            <p className="mt-2">
              You agree to use LeadsPilot responsibly and in strict compliance with all applicable laws and regulations. You specifically agree that you will NOT:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Send illegal, deceptive, fraudulent, or unsolicited bulk messaging in violation of anti-spam regulations (including CAN-SPAM, GDPR, PECR, or the India DPDP Act, 2023).</li>
              <li>Fail to provide valid opt-out mechanisms (such as unsubscribe links) in your cold outreach communications.</li>
              <li>Violate the terms of service of third-party platforms (such as LinkedIn, WhatsApp, or Google) integrated with your LeadsPilot account.</li>
              <li>Attempt to reverse engineer, scrape, bypass API rate limits, or disrupt the integrity of the Platform.</li>
              <li>Harvest or process sensitive personal data, financial credentials, or medical data using the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">6. Third-Party Platforms & Account Risk</h2>
            <p className="mt-2">
              LeadsPilot connects with external third-party services (e.g., email providers, social networks, messaging platforms). You acknowledge that third-party platforms may update their API terms, enforce rate limits, or restrict accounts for policy violations. LeadsPilot is not responsible for any restrictions, suspensions, or actions taken against your external accounts by third-party providers resulting from your outreach practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">7. Data Ownership and Compliance</h2>
            <p className="mt-2">
              You retain ownership of all target lead lists, custom campaign templates, and prospect data uploaded or generated within your account. You acknowledge that under relevant data protection regulations, you act as the <strong>Data Controller / Data Fiduciary</strong> for prospect details, and LeadsPilot processes such data strictly on your behalf as a <strong>Data Processor</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">8. Intellectual Property</h2>
            <p className="mt-2">
              LeadsPilot and its original code, user interface, features, software algorithms, and trademarks remain the exclusive property of LeadsPilot. You are granted a limited, non-exclusive, non-transferable license to access and use the platform during your active subscription term.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">9. Limitation of Liability and Disclaimer</h2>
            <p className="mt-2">
              THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, LEADSPILOT AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR SPECIAL DAMAGES, OR FOR ANY LOSS OF REVENUE, PROFITS, OR DATA ARISING FROM YOUR USE OF THE SERVICE OR ANY ACTIONS TAKEN BY THIRD-PARTY PLATFORMS AGAINST YOUR CONNECTED ACCOUNTS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">10. Termination</h2>
            <p className="mt-2">
              We reserve the right to suspend or terminate your account immediately, without prior notice, if you violate these Terms, engage in excessive spamming activity, or misuse the Service. You may discontinue use and delete your account at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">11. Governing Law and Jurisdiction</h2>
            <p className="mt-2">
              These Terms shall be governed by and construed in accordance with the laws of India. Any legal action, suit, or proceeding arising out of or relating to these Terms shall be instituted exclusively in the courts located in Nagpur, Maharashtra, India.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">12. Contact Information</h2>
            <p className="mt-2">
              For questions, legal inquiries, or notice regarding these Terms, please contact: shashank.bawane@gmail.com
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}