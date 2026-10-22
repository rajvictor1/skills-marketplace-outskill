import { staticMetadata } from "@/lib/seo/site";
import { InfoPage } from "@/components/seo/info-page";
export const metadata = staticMetadata("/how-it-works");
export default function HowItWorks() {
  return (
    <InfoPage
      path="/how-it-works"
      heading="How AI agent recipes work on Skillbuffet"
      intro="Find a recipe for a specific task, inspect its saved files and review result, then download the approved version. Structured recipes arrive as packages with a manifest and supporting files; older recipes may be a single SKILL.md file. You connect and run them in your own environment. Skillbuffet does not activate a recipe for you."
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
          body: "Sign in and download the approved version. Structured recipes provide recipe-package.json with the reviewed files; older listings provide SKILL.md. A manifest describes the contract, but a working adapter or provider setup may still be needed. Follow your own agent or application's integration instructions and grant minimum permissions. Skillbuffet has no automatic activation or hosted recipe runtime in this beta.",
        },
        {
          title: "4. Check the result and share feedback",
          body: "After integrating a recipe yourself, try it with non-sensitive sample data and check the result against your task. A recorded downloader can leave a star rating and optional comment; creators cannot rate their own recipe. Download counts record account activity, not installation or successful execution.",
        },
        {
          title: "5. Recheck changes before updating",
          body: "Each new recipe version requires another administrator review. An older approved version can remain public while its replacement is pending. Download and inspect the approved version you intend to use; a linked external GitHub repository may change independently of the saved review.",
        },
      ]}
    />
  );
}
