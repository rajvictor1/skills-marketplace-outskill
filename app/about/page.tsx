import { staticMetadata } from "@/lib/seo/site";
import { InfoPage } from "@/components/seo/info-page";
import { RecipeLifecycleDiagram } from "@/components/recipe-lifecycle-diagram";
export const metadata = staticMetadata("/about");
export default function About() {
  return (
    <>
      <InfoPage
        path="/about"
        heading="About Product"
        intro="Skillbuffet is a marketplace for reusable AI agent recipes. The product follows a simple path: discover a recipe, inspect its files and review status, then download an approved version for your own environment."
        sections={[
          {
            title: "01 · Discover",
            body: "Browse recipes by category to find a reusable set of instructions for business, technology, research or everyday work. Each recipe page explains its purpose and intended use.",
          },
          {
            title: "02 · Inspect",
            body: "Before adopting a recipe, review its instructions, included files, declared access needs and available scan results. Static checks can flag some risks, but cannot establish that a recipe is safe for every environment.",
          },
          {
            title: "03 · Submit and review",
            body: "Creators upload an accepted recipe file or ZIP package and choose reuse terms. File validation and static scanning run before an administrator reviews the submitted version. Pending, rejected and blocked submissions remain private; approval publishes the reviewed version.",
          },
          {
            title: "04 · Download and adapt",
            body: "Download an approved recipe and adapt it in your own agent environment. Skillbuffet does not execute recipes, independently verify every creator identity or certify external services. Review instructions and grant only the permissions your agent needs.",
          },
        ]}
      />
      <RecipeLifecycleDiagram />
    </>
  );
}
