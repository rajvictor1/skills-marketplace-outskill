export const DOCS: Record<
  string,
  { title: string; intro: string; sections: { title: string; body: string }[] }
> = {
  "recipe-packages": {
    title: "Structured recipe packages",
    intro:
      "The manager-standard creator submission is recipe.md with a separate validation-report.md. New YAML and ZIP creator submissions are paused until the team approves a package schema. Inspection does not publish, install or execute a recipe.",
    sections: [
      {
        title: "Supported package layouts",
        body: "The creator publishing page currently accepts recipe.md and a separate validation-report.md only. New recipe.yaml and ZIP uploads are paused until the team approves their package contract. The manager's YAML example is conceptual, not an approved runtime schema. Existing published listings remain available.",
      },
      {
        title: "Prepare a ZIP",
        body: "YAML and ZIP creator uploads are currently unavailable. Do not package or submit them as a workaround. Prepare recipe.md and its separate validation-report.md, choose one category and subcategory, and upload both from /publish. Remove credentials, patient records and real runtime input.",
      },
      {
        title: "Owner/team inspection endpoint",
        body: "POST /api/v1/recipes/validate accepts { files: [{ path, content }], manifestPath?, input? }. It requires a signed-in platform administrator and a same-origin JSON request. The request limit is 1 MB and 256 text files. Paths, manifests, local schema references and declared approval requirements are checked before a report is returned.",
      },
      {
        title: "What the report tells you",
        body: "The report contains file integrity information, structural issues, required input fields, optional input validation, static scanner findings and runtime blockers. In the private workbench, use Preview required inputs with fictional guided values or a JSON object; the server checks the bundled schema and returns only validation errors, without storing those values. A contract can be structurally valid while its adapter remains unimplemented. Report readiness flags stay false; successful validation is not evidence of a live integration.",
      },
      {
        title: "Private upload and review",
        body: "Creators use /publish to submit recipe.md and its separate report. YAML and ZIP submissions are paused. The validator checks the manager's A–Q recipe sections and the report sections, then runs static scanning. It does not verify report evidence or execute recipes. Submissions remain private for administrator review. No structured JSON upload is offered until the team agrees an approved schema.",
      },
    ],
  },
  "getting-started": {
    title: "Start with a useful recipe",
    intro:
      "Skillbuffet is a curated library of AI agent recipes. The current manager-standard submission pairs a human-readable Markdown recipe with a separate validation report. Discover an approved recipe, inspect it and download the saved version.",
    sections: [
      {
        title: "1. Discover",
        body: "Browse a category or search by recipe name, use case, creator or tag. Entertainment, Marketing, Research and the other categories share one submission and review process.",
      },
      {
        title: "2. Inspect",
        body: "Read the complete instructions, creator-declared compatibility, required permissions, license, static scan report and administrator approval badge. The approval applies to the displayed version. Static checks and admin review may identify some problems but cannot guarantee safety or accuracy.",
      },
      {
        title: "3. Download and use",
        body: "Sign in to download the approved version. Markdown listings provide recipe.md and validation-report.md separately; structured listings provide recipe-package.json; legacy listings provide SKILL.md. Follow your agent application's instructions and grant only the access needed. Skillbuffet does not activate the recipe or connect your accounts.",
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
      "Submit the manager-standard recipe.md and its separate validation report. Upload both files separately. YAML, ZIP and SKILL.md submissions are paused until their formats are aligned with the manager's standard. Every public recipe version requires administrator approval.",
    sections: [
      {
        title: "Prepare your recipe files",
        body: "Prepare two UTF-8 files: recipe.md and validation-report.md. Download the outlines on /publish. Submit one recipe at a time and choose its category and subcategory. YAML and ZIP uploads are paused; do not use them as a workaround. Remove credentials, private customer information and files you cannot distribute. Uploaded code is never executed.",
      },
      {
        title: "Complete your listing",
        body: "Sign in and open Submit a recipe. Upload the Markdown recipe and report, then enter the listing title, recipe ID, version, summary, category and subcategory. Choose reuse terms and confirm your right to submit the files. Submit one recipe at a time.",
      },
      {
        title: "Scan and submit",
        body: "The server rechecks the manager's A–Q recipe sections, required validation-report sections, and static security scan at submission. The report and its evidence are creator-provided; the system does not independently verify them or execute reported tests. Blocked recipes cannot be submitted. Successful submissions remain private as Pending admin review. Structured JSON upload is not enabled because the team has not selected an approved schema.",
      },
      {
        title: "Follow the decision",
        body: "Open My recipes to see status and administrator feedback. Approval publishes the reviewed version automatically. Request changes or rejection keeps that submission private. Submit a revision with the same recipe name and a new version number, such as 1.0.1. An existing approved version remains public until a replacement is approved or it is explicitly unpublished.",
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
        body: "The website uses POST /api/skills/{slug}/download with a signed-in session cookie and matching Origin. It returns recipe.md or validation-report.md for approved Markdown listings, recipe-package.json for structured recipes, or SKILL.md for legacy listings. Signed-out requests redirect to sign-in; unapproved versions return 404. This is a browser session endpoint, not a public token-authenticated integration API. API keys and a supported CLI are not available yet.",
      },
      {
        title: "Counting and limits",
        body: "A recorded download request is counted for a signed-in non-creator account when the server begins sending a saved file. Each account counts once per recipe version. The record does not confirm a complete transfer, installation or use. Catalog responses are bounded; there is no API uptime guarantee in beta. Avoid bulk polling.",
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
        body: "Structured package and SKILL.md submissions are read and scanned, never executed. Static scanning does not prove runtime safety. External source repositories can change after approval; direct GitHub downloads are outside Skillbuffet's saved-version review. Email verification is disabled in the current beta; download-request labels describe account activity, not independently verified identities.",
      },
    ],
  },
  changelog: {
    title: "Changelog",
    intro:
      "Product changes and release notes. Feature availability follows the deployed version.",
    sections: [
      {
        title: "2026-10-22 · One Preview database",
        body: "Preview account, catalog, review and private package records now use one Supabase Postgres database. Better Auth remains the sign-in system and existing account IDs were preserved. Supabase Auth, recipe activation and runtime execution are not enabled. The previous Neon database is retained as a rollback copy while the migration is verified.",
      },
      {
        title: "2026-10-21 · ZIP recipe submissions",
        body: "Creators can inspect a VDX-style ZIP, choose one valid recipe, assign its category and submit it to the administrator review desk. A larger collection ZIP may be inspected, but each submission selects one recipe. Its original files are saved in a versioned JSON package. Inspection and download do not execute or activate recipes. The legacy SKILL.md form remains available during migration.",
      },
      {
        title: "2026-10-21 · Recipe package inspection",
        body: "Added owner/team-only inspection for standalone recipe folders and capability packages with shared JSON Schemas. Reports distinguish contract validation, static scanning and runtime readiness. Source files are preserved; no recipe is automatically published or executed. Private structured-package storage, an administrator upload/review workbench and a marketplace submission handoff were added on Preview. Full package downloads preserve the original files and share the existing authenticated download counters. This historical release initially used Better Auth with Neon; the 2026-10-22 update moved Preview records to Supabase Postgres. Runtime activation remains pending.",
      },
      {
        title: "2026-10-21 · Curated publishing",
        body: "Added a private admin review queue, approve/publish, request changes, reject, unpublish and review history. New versions retain the previously approved public version while waiting. Legacy auto-published recipes return to review. Removed catalog fixture counts; the dashboard still contains labeled illustrative activity.",
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
