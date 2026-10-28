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
          body: "Account name, email, a password hash managed by the authentication service, session records, submitted recipe Markdown and validation reports, recipe packages or legacy SKILL.md instructions, listing metadata, scan reports, review decisions, ratings and recorded download events. Session records can include IP address and browser information. Hosting providers may retain operational request logs.",
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
          body: "Vercel hosts this deployment and environment-specific Supabase Postgres databases store account, marketplace and private recipe records. Better Auth manages sign-in using that database; Supabase Auth is not enabled for this app. Public GitHub imports fetch the specified repository. If the optional AI classifier is configured, Markdown recipe and legacy instruction-file submissions are sent to its model provider for security review; the scan report shows whether it was used. Structured ZIP recipe uploads use static checks and are not sent to the classifier. Provider terms and processing locations also apply.",
        },
        {
          title: "Cookies and browser storage",
          body: "Better Auth uses essential session cookies to provide sign-in and account security. The site stores your selected display theme and whether you have dismissed the cookie notice in your browser's local storage. The cookie notice does not enable optional tracking. This beta does not use advertising cookies or third-party marketing analytics cookies. Download events store account, recipe, version and time; ratings store account, target, stars and optional comment. The current product does not measure agent execution, time saved or revenue.",
        },
        {
          title: "Retention and requests",
          body: "A 12-month review-event cleanup is defined for environments where its migration and scheduled job are active. Retention of other account, submission and security records is under review. Contact the operator to request access, correction or deletion; identity may need confirmation. Applicable rights depend on your jurisdiction. A legal basis, final retention schedule, complaint route and international transfer disclosures must be reviewed for the intended launch markets.",
        },
      ]}
    />
  );
}
