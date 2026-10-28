import { staticMetadata } from "@/lib/seo/site";

import { PolicyPage } from "@/components/policy-page";
export const metadata = staticMetadata("/terms");
export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms and conditions"
      intro="These beta terms explain the current service and participation rules. They need operator review and jurisdiction-specific legal review before general public launch."
      sections={[
        {
          title: "Age eligibility",
          body: "You must be at least 18 years old to create or use a Skillbuffet account. This beta does not ask for or verify your date of birth during signup; the age requirement is stated here and is not enforced by the signup form.",
        },
        {
          title: "The service",
          body: "Skillbuffet lets creators submit AI agent recipe packages or instruction files for review and lets users discover and download approved versions. It does not install or run recipes, promise task outcomes or guarantee that a recipe is secure, accurate or suitable for your situation. Availability and features may change during beta.",
        },
        {
          title: "Accounts and conduct",
          body: "Provide accurate account information, keep credentials private and use only accounts you control. Do not submit malware, hidden malicious instructions, credentials, personal customer information, unlawful content or content you lack permission to distribute. Do not manipulate reviews or download counts, harass others or attempt to bypass access controls.",
        },
        {
          title: "Creator rights and permission",
          body: "You retain rights you hold in your content. By submitting a recipe, you permit Skillbuffet to store it, scan it, review it, display approved versions and distribute them under the license you declare. Choose a license you are authorized to grant. Third-party code and assets may have additional obligations. A GitHub source link is optional for uploads and does not transfer ownership.",
        },
        {
          title: "Review and moderation",
          body: "Every version requires administrator approval. The operator may request changes, reject or unpublish a recipe, and may hide abusive, irrelevant or privacy-violating reviews. Review decisions and reasons are recorded. Security scanning and administrator approval are limited checks rather than endorsements or guarantees.",
        },
        {
          title: "Using downloaded recipes",
          body: "Read the package files or instructions and reuse terms before use. A structured manifest may still need an adapter and provider connection before it can run. Grant only necessary tool permissions, keep backups and obtain appropriate human review for consequential actions. Your agent provider, connected tools and external services have separate terms. Removing a listing cannot recall copies already downloaded.",
        },
        {
          title: "Feedback, payments and legal details",
          body: "Reviews should reflect the account holder's experience and disclose relevant relationships. Reviews are submitted through signed-in accounts, but account holders' identities are not independently verified. There are no paid listings, creator payouts, billing or refund workflows in this release. Final provisions on eligibility, liability, disputes, governing law and termination need review by the operator for the intended jurisdiction; this beta page does not assert a legal compliance certification.",
        },
      ]}
    />
  );
}
