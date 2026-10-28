import { staticMetadata } from "@/lib/seo/site";
import { InfoPage } from "@/components/seo/info-page";
export const metadata = staticMetadata("/how-it-works");
export default function HowItWorks() {
  return (
    <InfoPage
      path="/how-it-works"
      heading="How AI agent recipes work on Skillbuffet"
      intro="Find a recipe for a specific task, inspect its saved files and review result, then download the approved version. A listing may provide recipe.md with a separate validation report, a structured package, or a legacy SKILL.md file. You connect and run recipes in your own environment. Skillbuffet does not activate them for you."
      sections={[
        {
          title: "1. Find a recipe for your task",
          body: "Browse the category directory or search the catalog by name, use case, creator or tag. For example, a marketing team can start with Marketing and inspect its SEO & GEO specialty. Category membership describes the intended task; it does not certify quality.",
        },
        {
          title: "2. Inspect the approved version",
          body: "Read the summary, saved instructions or package guide, reuse terms, declared inputs and outputs, and runtime status. Check the automated findings and administrator approval for the displayed version. Confirm that any requested file access or external service is suitable for your data.",
        },
        {
          title: "3. Download and integrate in your own environment",
          body: "Sign in and download the approved version. Markdown listings provide recipe.md and validation-report.md separately; structured listings provide recipe-package.json; legacy listings provide SKILL.md. The report's evidence is creator-provided, and a working adapter or provider setup may still be needed. Follow your own agent or application's integration instructions and grant minimum permissions. Skillbuffet has no automatic activation or hosted recipe runtime in this beta.",
        },
        {
          title: "4. Check the result and share feedback",
          body: "After integrating a recipe yourself, try it with non-sensitive sample data and check the result against your task. An account with a recorded download request can leave a star rating and optional comment; creators cannot rate their own recipe. Download-request counts record account activity, not installation or successful execution.",
        },
        {
          title: "5. Recheck changes before updating",
          body: "Each new recipe version requires another administrator review. An older approved version can remain public while its replacement is pending. Download and inspect the approved version you intend to use; a linked external GitHub repository may change independently of the saved review.",
        },
      ]}
    />
  );
}
