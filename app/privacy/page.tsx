import { staticMetadata } from "@/lib/seo/site";

import { PolicyPage } from "@/components/policy-page";
export const metadata = staticMetadata("/privacy");
export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy policy"
      intro="This beta notice describes the data used by Skillbuffet's current marketplace features. The operator is Rajesh Kumar; legal entity and jurisdiction details must be confirmed before general public launch."
      sections={[
        {
          title: "What we collect",
          body: "Account name, email, a password hash managed by the authentication service, session records, submitted recipe packages or SKILL.md instructions, listing metadata, scan reports, review decisions, ratings and recorded download events. Session records can include IP address and browser information. Hosting providers may retain operational request logs.",
        },
        {
          title: "How data is used",
          body: "To provide account access, save and review submissions, distribute approved versions, prevent duplicate rating/download counts, moderate abuse and investigate errors. Submitted files are stored in the marketplace database and are not automatically committed to the application source repository. Do not submit secrets or personal customer data.",
        },
        {
          title: "What becomes public",
          body: "Approved recipe instructions or package guides, creator display name, declared metadata, source links, security summaries, ratings and public review comments are visible to visitors. Approved package files are available to signed-in downloaders. Pending, rejected and blocked submissions are restricted to the creator and administrators. Administrator review notes may be shown privately to the creator. Account email addresses are not part of the public catalog API.",
        },
        {
          title: "Providers and automated review",
          body: "Vercel hosts this deployment and Neon stores marketplace records. Public GitHub imports fetch the specified repository. If the optional AI classifier is configured, submitted recipe instructions are sent to its model provider for security review; the scan report shows whether it was used. No claim is made that an AI review ran when it was skipped. Provider terms and processing locations also apply.",
        },
        {
          title: "Cookies and measurement",
          body: "Authentication uses essential session cookies. Download events store account, recipe, version and time; ratings store account, target, stars and optional comment. The current product does not measure agent execution, time saved or revenue. It does not implement an advertising or third-party marketing analytics integration.",
        },
        {
          title: "Retention and requests",
          body: "No automatic retention or deletion schedule is configured yet. Account, submission, review and security records remain until the operator deletes them or establishes a retention schedule. Contact the operator to request access, correction or deletion; identity may need confirmation. Applicable rights depend on your jurisdiction. A legal basis, final retention schedule, complaint route and international transfer disclosures must be reviewed for the intended launch markets.",
        },
      ]}
    />
  );
}
