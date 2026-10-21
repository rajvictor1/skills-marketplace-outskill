import { staticMetadata } from "@/lib/seo/site";
import { InfoPage } from "@/components/seo/info-page";
export const metadata = staticMetadata("/about");
export default function About() {
  return (
    <InfoPage
      path="/about"
      heading="About Skillbuffet"
      intro="Skillbuffet is a marketplace for reusable AI agent instructions. It helps people browse by category, inspect a saved SKILL.md and its review results, and download approved versions for use in their own agents. The beta is operated by Rajesh Kumar."
      sections={[
        {
          title: "Why this marketplace exists",
          body: "An instruction file can ask an agent to read files, call tools or use external services. Skillbuffet makes the instructions and declared access needs visible before download so users can make a more informed decision. The marketplace organizes skills for business, technology, research and everyday work.",
        },
        {
          title: "How a skill reaches the public catalog",
          body: "Creators submit a SKILL.md file with a category, version, license and access declarations. Automated checks look for suspicious patterns. An administrator then reviews that saved version. Pending, rejected and blocked submissions stay private; an approved version can become public.",
        },
        {
          title: "What we can and cannot verify",
          body: "Scanning and review reduce risk but do not prove a skill is safe, accurate or useful for every task. Skillbuffet does not execute submissions, independently verify every creator identity or certify external services. Review the instructions yourself and grant only the permissions your agent needs.",
        },
        {
          title: "Operator, source and beta status",
          body: "Rajesh Kumar operates this beta. Skillbuffet builds on Harshith Vaddiparthy’s MIT-licensed skills-marketplace-outskill project, linked in the footer alongside the current source repository. Legal entity, jurisdiction and private policy contact details remain launch requirements; no location or team credentials are implied.",
        },
      ]}
    />
  );
}
