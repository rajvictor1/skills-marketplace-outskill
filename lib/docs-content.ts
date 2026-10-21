export const DOCS: Record<
  string,
  { title: string; intro: string; sections: { title: string; body: string }[] }
> = {
  "recipe-packages": {
    title: "Structured recipe packages",
    intro:
      "A standard recipe has one recipe.yaml with its local JSON Schemas, optional documentation and adapter source. Upload a pack containing one or many recipes, then choose one to submit. Inspection does not publish, install or execute it.",
    sections: [
      {
        title: "Supported package layouts",
        body: "Inspect a standalone recipe folder or select one capabilities/<id>/recipe.yaml inside a shared schema package. Original IDs and source files are preserved. Adapter and test code is read as text and never executed.",
      },
      {
        title: "Prepare a ZIP",
        body: "Keep recipe.yaml with its local source files and schemas in a ZIP. Sign in and upload it at /publish. If the ZIP contains several recipes, choose one valid recipe to submit. Assign its category and subcategory; the same VDX-style contract applies across categories. The current ZIP limit is 1.5 MB. Remove credentials, patient records and real runtime input. The offline recipe-pack-to-json.py and prepare-recipe-collection.ts tools remain available for owner QC.",
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
        body: "Platform administrators can use /admin/recipes to inspect and save private drafts, including packages with compatibility issues, in the Preview Supabase registry. Creators use /publish to inspect a ZIP and submit selected valid recipes to the existing Neon-backed admin review desk. These are separate storage paths that share the package inspector. Source issues must be corrected before submission; a saved draft is not public. The administrator reviews the original package JSON and static findings before approving a listing. An approved package offers an authenticated JSON download of its original files. Agent registration, installation and runtime activation remain pending. The older SKILL.md uploader remains under Legacy format. Remote schemas, executable custom validators and arbitrary code execution are unsupported.",
      },
    ],
  },
  "getting-started": {
    title: "Start with a useful recipe",
    intro:
      "Skillbuffet is a curated library of AI agent recipes. Listings may contain a structured recipe.yaml package or a legacy SKILL.md instruction file. Discover an approved recipe, inspect it and download the saved version.",
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
        body: "Sign in and select Download recipe. Structured listings provide recipe-package.json with the reviewed source files; older listings provide SKILL.md. Follow your agent application's instructions and grant only the access needed. Skillbuffet does not activate the recipe or connect your accounts.",
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
      "Upload your recipe pack and choose one recipe.yaml package to submit at a time. A larger archive can be inspected, but each submission selects one recipe. The older single-file SKILL.md form is under Legacy format. Every public recipe version requires administrator approval.",
    sections: [
      {
        title: "Prepare your recipe archive",
        body: "Create a ZIP with one or more recipe.yaml manifests and their referenced local JSON Schemas. Include documentation and adapter source when useful. The publisher reads text files but never runs adapter code. Remove credentials, private customer information and files you cannot distribute. A structurally invalid or scanner-blocked recipe cannot be selected for submission.",
      },
      {
        title: "Complete your listing",
        body: "Sign in, open Submit a recipe, choose the ZIP and click Inspect ZIP. Select one valid recipe, then give it a display title, category and subcategory. Choose reuse terms and confirm your right to submit its files. Repeat for another recipe. The legacy SKILL.md form still supports paste, file upload and optional GitHub import.",
      },
      {
        title: "Scan and submit",
        body: "The server rechecks the same ZIP and every selected package at submission. It verifies the inspected file hash, manifest and local schemas, then runs deterministic security checks. The ZIP path does not execute code or send package content to an AI classifier. Blocked recipes cannot be submitted. Successful submissions remain private as Pending admin review.",
      },
      {
        title: "Follow the decision",
        body: "Open My recipes to see status and administrator feedback. Approval publishes the reviewed version automatically. Request changes or rejection keeps that submission private. Submit a revision with the same recipe name and a new version number, such as 1.0.1. An existing approved version remains public until a replacement is approved or it is explicitly unpublished.",
      },
      {
        title: "Legacy SKILL.md format",
        body: "If you only have a single instruction file, expand Legacy format on the publishing page. Its YAML frontmatter needs a lowercase name and description. Structured packages use recipe.yaml instead; SKILL.md is optional documentation inside them.",
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
        body: "The website uses POST /api/skills/{slug}/download with a signed-in session cookie and matching Origin. It returns recipe-package.json for approved structured recipes or SKILL.md for legacy listings. Signed-out requests redirect to sign-in; unapproved versions return 404. This is a browser session endpoint, not a public token-authenticated integration API. API keys and a supported CLI are not available yet.",
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
        body: "Structured package and SKILL.md submissions are read and scanned, never executed. Static scanning does not prove runtime safety. External source repositories can change after approval; direct GitHub downloads are outside Skillbuffet's saved-version review. Email verification is disabled in the current beta; verified-download labels describe account activity, not independently verified identities.",
      },
    ],
  },
  changelog: {
    title: "Changelog",
    intro:
      "Product changes and release notes. Feature availability follows the deployed version.",
    sections: [
      {
        title: "2026-10-21 · ZIP recipe submissions",
        body: "Creators can inspect a VDX-style ZIP, choose one valid recipe, assign its category and submit it to the administrator review desk. A larger collection ZIP may be inspected, but each submission selects one recipe. Its original files are saved in a versioned JSON package. Inspection and download do not execute or activate recipes. The legacy SKILL.md form remains available during migration.",
      },
      {
        title: "2026-10-21 · Recipe package inspection",
        body: "Added owner/team-only inspection for standalone recipe folders and capability packages with shared JSON Schemas. Reports distinguish contract validation, static scanning and runtime readiness. Source files are preserved; no recipe is automatically published or executed. Private structured-package storage, an administrator upload/review workbench and a marketplace submission handoff have been added on Preview. Full package downloads preserve the original files and share the existing authenticated download counters. Current accounts remain on Better Auth and Neon; auth migration and runtime activation are pending.",
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
