import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
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
        <h1 className="text-3xl font-semibold text-ink-950">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-500">Last updated: September 4, 2026</p>

        <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-ink-700">
          <section>
            <h2 className="text-lg font-semibold text-ink-950">1. Who We Are</h2>
            <p className="mt-2">
              LeadsPilot ("we," "us," or "our") operates the LeadsPilot platform, an AI-powered B2B lead generation and multi-channel outreach SaaS platform accessible via leads-pilot-latest-j5zj.vercel.app. This policy explains how we collect, use, store, and protect your personal data and prospect information when you use our software and services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">2. Information We Collect</h2>
            <p className="mt-2">We collect the following categories of information to provide and improve our lead generation services:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                <strong>User Account Information:</strong> Name, work email address, profile picture, and authentication tokens provided when registering or logging in via Google OAuth or standard sign-up.
              </li>
              <li>
                <strong>Connected Accounts & Credentials:</strong> Email server details (SMTP/IMAP), LinkedIn session data, or WhatsApp API credentials integrated into LeadsPilot for executing outreach campaigns.
              </li>
              <li>
                <strong>Prospect and Campaign Data:</strong> Target lead profiles, uploaded contact lists, company intelligence parameters, search criteria, personalized messaging templates, and interaction history generated during outreach.
              </li>
              <li>
                <strong>Usage and Telemetry Data:</strong> IP address, browser type, feature usage metrics, credits used, and interaction timestamps required to optimize app performance and enforce plan parameters.
              </li>
              <li>
                <strong>Billing Data:</strong> Payment transaction details and billing addresses managed securely through our third-party payment gateways (e.g., Razorpay/Stripe). We do not store raw credit card or bank credentials.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">3. Legal Basis and Purpose of Processing</h2>
            <p className="mt-2">
              We process personal data based on your <strong>consent</strong> when creating an account, for the performance of our contract to deliver B2B prospecting tools, and for legitimate business interests in preventing fraud and improving services. Where you import or scrape prospect data using our integrations, you confirm that you have a lawful basis for contacting such prospects under applicable anti-spam and privacy regulations (e.g., GDPR, CAN-SPAM, DPDP Act 2023).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">4. How We Use Your Data</h2>
            <p className="mt-2">
              We process your data strictly to execute B2B lead discovery queries, generate AI-driven campaign copy, send multi-channel outreach messages on your instruction, manage subscriptions, and maintain platform security. We do not sell your personal data or your custom prospect lists to third parties or data brokers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">5. Third-Party Service Providers</h2>
            <p className="mt-2">To deliver platform features, we share relevant data with trusted third-party infrastructure and service providers:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                <strong>Database & Auth Infrastructure:</strong> Supabase (for database storage, encrypted credential management, and user authentication).
              </li>
              <li>
                <strong>Sourcing & Enricment APIs:</strong> External web-scraping and data verification services (e.g., Apify, Proxycurl) to extract public business data on your request.
              </li>
              <li>
                <strong>AI Processing Models:</strong> Artificial intelligence APIs utilized to generate personalized message copy and analyze campaign responses.
              </li>
              <li>
                <strong>Payment Processors:</strong> Razorpay or Stripe to process recurring subscription payments securely.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">6. Customer Responsibility for Prospect Data</h2>
            <p className="mt-2">
              When using LeadsPilot to source or message business prospects, you act as the <strong>Data Controller / Data Fiduciary</strong> for that prospect data, and LeadsPilot operates solely as your <strong>Data Processor</strong>. You are responsible for ensuring your prospecting criteria and cold outreach communications comply with applicable privacy laws, opt-out requirements, and marketing rules in your target jurisdictions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">7. Data Retention and Account Deletion</h2>
            <p className="mt-2">
              We retain account data and campaign records for as long as your subscription is active. Upon account cancellation or deletion, campaign data and connected integration tokens are purged or anonymized within 30 days, except where retention is legally required. You may request immediate deletion of your account and related data at any time by contacting shashank.bawane@gmail.com.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">8. Security Measures</h2>
            <p className="mt-2">
              We implement industry-standard encryption protocols (TLS/SSL in transit, AES-256 at rest) for stored credentials, campaign data, and integration keys. While we employ rigorous access controls and monitoring, no web platform is entirely immune to security threats, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">9. Your Rights</h2>
            <p className="mt-2">Depending on your region (including India DPDP Act, EU GDPR, and US State Laws), you have the right to access, rectify, or request deletion of your personal data, withdraw consent, or request a summary of data processed. To exercise these rights, submit a request to shashank.bawane@gmail.com.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">10. Grievance Officer & Contact</h2>
            <p className="mt-2">For inquiries, privacy concerns, or grievance redressal regarding your data under applicable law, please contact:</p>
            <p className="mt-2">
              <strong>Shashank Bawane</strong><br />
              Founder / Grievance Officer, LeadsPilot<br />
              Email: shashank.bawane@gmail.com<br />
              Response Time: Within 7 business days
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-950">11. Updates to This Policy</h2>
            <p className="mt-2">
              We may revise this Privacy Policy periodically to reflect product updates or legal requirements. Material updates will be communicated via in-app banner or email notification.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}