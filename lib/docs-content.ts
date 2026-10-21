export const DOCS: Record<
  string,
  { title: string; intro: string; sections: { title: string; body: string }[] }
> = {
  "recipe-packages": {
    title: "Structured recipe packages",
    intro:
      "The recipe backend supports private owner/team package inspection, immutable version storage and review. A package may contain recipe.yaml, shared JSON Schemas, optional SKILL.md documentation and adapter source files. Inspection does not publish, install or execute a recipe.",
    sections: [
      {
        title: "Supported package layouts",
        body: "Inspect a standalone recipe folder or select one capabilities/<id>/recipe.yaml inside a shared schema package. Original IDs and source files are preserved. Adapter and test code is read as text and never executed.",
      },
      {
        title: "Prepare a package",
        body: "Use the repository utility: python3 scripts/recipe-pack-to-json.py /absolute/package/folder recipe.yaml > /private/tmp/recipe-package.json. For a shared capability pack, replace recipe.yaml with capabilities/example.read/recipe.yaml. The utility reads source text without executing it. Upload the resulting JSON in the private workbench. Do not include credentials, patient records or other real runtime input in source files.",
      },
      {
        title: "Owner/team inspection endpoint",
        body: "POST /api/v1/recipes/validate accepts { files: [{ path, content }], manifestPath?, input? }. It requires a signed-in platform administrator and a same-origin JSON request. The request limit is 1 MB and 256 text files. Paths, manifests, local schema references and declared approval requirements are checked before a report is returned.",
      },
      {
        title: "What the report tells you",
        body: "The report contains file integrity information, structural issues, required input fields, optional input validation, static scanner findings and runtime blockers. A contract can be structurally valid while its adapter remains unimplemented. Report readiness flags stay false; successful validation is not evidence of a live integration.",
      },
      {
        title: "Private upload and review",
        body: "On the configured Preview, platform administrators can open /admin/recipes, upload a prepared JSON package, save a private draft and submit it for review. The private Supabase registry preserves source files, hashes and inspection reports. Approval records a private registry decision; public catalog publishing, registered agent access, installation and runtime activation are separate and remain pending. Current accounts still use Better Auth and Neon. The existing SKILL.md publishing flow remains available. The schema profile permits bundled local references and reviewed patterns; remote schemas, executable custom validators and arbitrary code execution are unsupported.",
      },
    ],
  },
  "getting-started": {
    title: "Start with a useful recipe",
    intro:
      "Skillbuffet is a curated library of AI agent recipes. Recipes currently use SKILL.md instruction files. Discover an approved recipe, inspect it, and download its file.",
    sections: [
      {
        title: "1. Discover",
        body: "Browse a category or search by recipe name, use case, creator or tag. Entertainment, Marketing, Research and the other categories share one submission and review process.",
      },
      {
        title: "2. Inspect",
        body: "Read the complete instructions, compatibility, required permissions, license, automated scan report and administrator approval badge. The approval applies to the displayed version. A scan and an admin review reduce risk but do not guarantee safety or accuracy.",
      },
      {
        title: "3. Download and use",
        body: "Sign in, then select Download SKILL.md. Follow your agent application's instructions for loading SKILL.md and grant only the access needed. Skillbuffet does not execute your agent or connect your accounts. The CLI shown in earlier previews is not a supported installation method.",
      },
      {
        title: "4. Share feedback",
        body: "After downloading a recipe, you can leave 1–5 stars and an optional public comment. One rating per account can be edited by resubmitting. Creators cannot rate their own recipe. Marketplace reviews are separate from GitHub stars and security reviews.",
      },
    ],
  },
  publishing: {
    title: "Publish your expertise",
    intro:
      "Every new recipe and every new version requires administrator approval before it becomes public.",
    sections: [
      {
        title: "Prepare SKILL.md",
        body: "Create one UTF-8 Markdown file up to 256 KB. Start with YAML frontmatter containing name (a unique lowercase ID) and description. Follow with useful, concrete instructions. Remove credentials, private customer information and copyrighted material you cannot distribute. ZIP bundles and companion scripts are not supported in this publishing flow.",
      },
      {
        title: "Complete your listing",
        body: "Sign in and choose Submit a recipe. Paste or upload SKILL.md, or import a public GitHub repository containing SKILL.md at its root. GitHub is optional for file uploads. Add a title, category, subcategory, summary, version, license, tags, supported agents and access declarations. A source URL is not a claim that ownership has been independently verified.",
      },
      {
        title: "Scan and submit",
        body: "Confirm your right to publish. Deterministic checks look for hidden text, dangerous patterns and script patterns; the optional AI classifier runs only when configured and available. Critical findings block approval. Successful submissions remain private as Pending admin review.",
      },
      {
        title: "Follow the decision",
        body: "Open My recipes to see status and administrator feedback. Approval publishes the reviewed version automatically. Request changes or rejection keeps that submission private. Submit a revision with the same recipe name and a new version number, such as 1.0.1. An existing approved version remains public until a replacement is approved or it is explicitly unpublished.",
      },
      {
        title: "Useful frontmatter",
        body: "Example: put three dashes on the first line, name: campaign-brief on the next line, description: Create a campaign brief from a target audience and offer on the following line, then close with three dashes. Below that, write the step-by-step instructions, expected inputs and outputs, and limits.",
      },
    ],
  },
  api: {
    title: "Catalog API",
    intro:
      "A small read-only API for discovering approved public recipes. Pending, rejected, blocked and unpublished submissions are excluded. Existing /skills endpoint paths and the skills response field are retained for compatibility.",
    sections: [
      {
        title: "GET /api/v1/skills",
        body: "Returns { total, limit, offset, skills }. Optional query parameters: q (search text), category (exact category label), limit (1–50, default 20) and offset (default 0). Each item includes slug, name, summary, category, subcategory, version, downloads, ratingAverage, ratingCount, adminApproved and a relative listing URL. Example: /api/v1/skills?category=Marketing&limit=10",
      },
      {
        title: "GET /api/v1/skills/{slug}",
        body: "Returns the approved listing, public creator declarations, instructions and security summary. Returns 404 for a recipe that is not public, and 503 if the catalog is unavailable. A ratingAverage of 0 with ratingCount 0 means no ratings, not a zero-star review.",
      },
      {
        title: "Downloads",
        body: "The website uses POST /api/skills/{slug}/download with a signed-in session cookie and matching Origin. It returns a SKILL.md attachment. Signed-out requests redirect to sign-in; unapproved versions return 404. This is a browser session endpoint, not a public token-authenticated integration API. API keys and a supported CLI are not available yet.",
      },
      {
        title: "Counting and limits",
        body: "A recorded download is a successful server response request by a signed-in non-creator account. Each account counts once per recipe version. It does not prove the recipe was installed or used successfully. Catalog responses are bounded; there is no API uptime guarantee in beta. Avoid bulk polling.",
      },
    ],
  },
  security: {
    title: "Review and security",
    intro:
      "Automated scanning and administrator review are different checks, recorded separately for each version.",
    sections: [
      {
        title: "Administrator permissions",
        body: "Only accounts explicitly provisioned in the server-side administrator table can open the review desk or approve, reject, request changes, unpublish and moderate reviews. Registration and submitted metadata cannot grant administrator access.",
      },
      {
        title: "Version review",
        body: "An administrator reads the submitted instructions, metadata, permissions, scan layer status and findings. Approve and publish switches the public listing to that exact saved version. Repeated review decisions are checked against current state, and actions are recorded in the review history.",
      },
      {
        title: "Report a concern",
        body: "Use the support link in these docs to report non-sensitive bugs. Do not post credentials or private information in public GitHub issues. Privacy requests should use the private contact shown on the Privacy page once the operator configures it.",
      },
      {
        title: "Known limits",
        body: "SKILL.md submissions are read and scanned, never executed. External source repositories can change after approval. Files downloaded from GitHub directly are outside Skillbuffet's saved-version review. Email verification is disabled in the current beta; verified-download labels describe account activity, not independently verified identities.",
      },
    ],
  },
  changelog: {
    title: "Changelog",
    intro:
      "Product changes and release notes. Feature availability follows the deployed version.",
    sections: [
      {
        title: "2026-10-21 · Recipe package inspection",
        body: "Added owner/team-only inspection for standalone recipe folders and capability packages with shared JSON Schemas. Reports distinguish contract validation, static scanning and runtime readiness. Source files are preserved; no recipe is automatically published or executed. Private structured-package storage and an administrator upload/review workbench have been added on Preview. Current accounts remain on Better Auth and Neon; auth migration and runtime activation are pending.",
      },
      {
        title: "2026-10-21 · Curated publishing",
        body: "Added a private admin review queue, approve/publish, request changes, reject, unpublish and review history. New versions retain the previously approved public version while waiting. Legacy auto-published recipes return to review. Removed catalog fixtures and illustrative dashboard activity.",
      },
      {
        title: "2026-10-21 · Community and discovery",
        body: "Added optional GitHub source links for file uploads, Entertainment, recorded downloads, download-eligible recipe reviews, marketplace ratings and moderation controls. Added documentation, public catalog endpoints, privacy and terms pages. No historical adoption numbers are synthesized.",
      },
      {
        title: "Earlier beta",
        body: "Introduced Skillbuffet branding, category browsing, SKILL.md file upload and GitHub import, the automated scanner, account access, and the Preview database integration.",
      },
    ],
  },
};
