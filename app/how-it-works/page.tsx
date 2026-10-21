import { staticMetadata } from "@/lib/seo/site";
import { InfoPage } from "@/components/seo/info-page";
export const metadata = staticMetadata("/how-it-works");
export default function HowItWorks() {
  return (
    <InfoPage
      path="/how-it-works"
      heading="How AI agent recipes work on Skillbuffet"
      intro="Use Skillbuffet to find a task-specific instruction file, inspect its review and access requirements, then download the approved SKILL.md. Your compatible agent runs those instructions in your own environment. Skillbuffet does not connect your accounts or execute an agent on your behalf."
      sections={[
        {
          title: "1. Find a recipe for your task",
          body: "Browse the category directory or search the catalog by name, use case, creator or tag. For example, a marketing team can start with Marketing and inspect its SEO & GEO specialty. Category membership describes the intended task; it does not certify quality.",
        },
        {
          title: "2. Inspect the approved version",
          body: "Read the summary, full SKILL.md, license, compatibility and declared inputs and outputs. Check the automated findings and administrator approval for the displayed version. Confirm that requested file access, network calls and external integrations are suitable for your information.",
        },
        {
          title: "3. Download and install in your own agent",
          body: "Sign in and select Download SKILL.md on an approved listing. Follow your agent application’s installation instructions, since folders and supported features vary. Review external URLs before opening them and grant minimum permissions. There is no supported Skillbuffet CLI or hosted agent runtime in this beta.",
        },
        {
          title: "4. Check the result and share feedback",
          body: "Use a non-sensitive example first. Check the output against your task and the recipe’s stated limitations. A recorded downloader can leave a star rating and optional comment; creators cannot rate their own recipe. Download counts record account activity and do not prove installation or successful execution.",
        },
        {
          title: "5. Recheck changes before updating",
          body: "Each new recipe version requires another administrator review. An older approved version can remain public while its replacement is pending. Download and inspect the approved version you intend to use; a linked external GitHub repository may change independently of the saved review.",
        },
      ]}
    />
  );
}
