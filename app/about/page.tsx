import { staticMetadata } from "@/lib/seo/site";
import { InfoPage } from "@/components/seo/info-page";
export const metadata = staticMetadata("/about");
export default function About() {
  return (
    <InfoPage
      path="/about"
      heading="About Skillbuffet"
      intro="Skillbuffet is a marketplace for reusable AI agent recipes. Browse by category, inspect the saved package or instruction file and its review results, then download an approved version for your own environment. The beta is operated by Rajesh Kumar."
      sections={[
        {
          title: "Why this marketplace exists",
          body: "An instruction file can ask an agent to read files, call tools or use external services. Skillbuffet makes the instructions and declared access needs visible before download so users can make a more informed decision. The marketplace organizes recipes for business, technology, research and everyday work.",
        },
        {
          title: "How a recipe reaches the public catalog",
          body: "Creators upload a ZIP containing recipe.yaml and its local files, choose one recipe and category, and submit it with reuse terms. The older single-file SKILL.md form remains available. File checks and static security scanning run before an administrator reviews the saved version. Pending, rejected and blocked submissions stay private; approval makes the reviewed version public.",
        },
        {
          title: "What we can and cannot verify",
          body: "Scanning and review reduce risk but do not prove a recipe is safe, accurate or useful for every task. Skillbuffet does not execute submissions, independently verify every creator identity or certify external services. Review the instructions yourself and grant only the permissions your agent needs.",
        },
        {
          title: "Operator, source and beta status",
          body: "Rajesh Kumar operates this beta. Skillbuffet builds on Harshith Vaddiparthy’s MIT-licensed skills-marketplace-outskill project, linked in the footer alongside the current source repository. Legal entity, jurisdiction and private policy contact details remain launch requirements; no location or team credentials are implied.",
        },
      ]}
    />
  );
}
