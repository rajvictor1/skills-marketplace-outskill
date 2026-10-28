# Recipe backend foundation

Status: first implementation slice, 21 October 2026. Existing catalog and publishing remain operational. Includes package inspection, private immutable storage and owner/team review. Installation and execution are not implemented.

## Architecture inventory

| Requirement                             | Existing implementation                                           | Current work / gap                                                                                                                                                              |
| --------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Human accounts                          | Better Auth with Postgres                                         | Preview uses one Supabase Postgres database for account, catalog, and private recipe tables; Better Auth remains the login system                                                 |
| Catalog, categories, search, ratings    | Existing marketplace and controlled taxonomy                      | Reuse presentation; move taxonomy to data when schema migration is agreed                                                                                                       |
| Publishing and immutable saved versions | Existing listing/version/file/submission records and admin review | Structured-package immutable versions and private review are added through /admin/recipes; approved private packages can be submitted to the existing public admin review queue |
| Recipe package contract                 | New lib/recipes/package.ts                                        | Reads original recipe.yaml, local schemas, optional SKILL.md and text adapters                                                                                                  |
| Security inspection                     | Existing static scanner reused                                    | All submitted text files scanned; no adapter execution, external LLM call or antivirus certification                                                                            |
| Input requirements                      | New inputFields and optional inputValidation report               | Nested schema fields remain complex; no generated forms UI yet                                                                                                                  |
| API protection                          | Existing sessions and marketplace_admin role reused               | New owner/team-only POST /api/v1/recipes/validate, same-origin check, bounded body, database-backed request limit and audit                                                     |
| Registered machine clients / MCP        | Not implemented                                                   | Requires scoped client identity and a separate authorization contract                                                                                                           |
| Installation, consent and providers     | Not implemented                                                   | Separate records and explicit state transitions required                                                                                                                        |
| Runtime and activation                  | Not connected                                                     | Readiness stays false; adapter names and source test logs do not establish readiness                                                                                            |
| Operational metrics                     | Existing illustrative dashboard and real catalog totals           | Execution metrics require authenticated runtime events                                                                                                                          |

## Supported source layouts

1. A paired Markdown submission: `recipe.md` plus a separate `validation-report.md`. Markdown sections are checked against the manager's canonical A–Q headings, and the report must include checks performed, results, findings, evidence, tests still needed, and limitations. The checks do not validate factual claims or execute reported tests.
2. Creator submissions currently use `recipe.md` and `validation-report.md` directly. New ZIP and standalone YAML submissions are paused until the team approves their package contract. The Markdown pair is the manager-standard human-readable deliverable.

YAML and ZIP inspection/submission server actions now return a paused-format response. The `skillport_standard` YAML example is conceptual and is not enforced as an approved runtime schema. The actual runtime schema remains unselected; no JSON execution upload is offered.

The Markdown path accepts exactly two UTF-8 Markdown files, a recipe and its separate validation report. It checks required headings, bounded file sizes and the existing static scanner, then stores both original files with the pending listing. This is a structural intake check only; creator-provided evidence is not independently verified. JSON is not accepted as a substitute because the team has not supplied an agreed JSON Schema for the Markdown contract. Templates are available at `public/templates/recipe-markdown-standard.md` and `public/templates/recipe-validation-report.md`.

## Manager-standard boundaries

The Markdown validator checks the manager's A–Q section structure and the separate report sections. This is structural coverage, not proof that the author supplied complete, accurate, or independently verified information. The example YAML shape in the manager's document is explicitly conceptual; Skillbuffet no longer treats a custom `skillport_standard` block as an approved machine schema. Recipes are not installed, activated, or executed here. Marketplace approval is publication review only.

Identifiers containing dots or underscores are preserved. The original files are not rewritten into the legacy SKILL.md format. No source scripts, test suites, shell commands or bundled validators are run. A ZIP is prepared by the repository's own read-only Python utility, without extraction or script execution. Binary caches and hidden files are omitted.

## API contract

POST /api/v1/recipes/validate

- A signed-in platform administrator is required; ordinary accounts and anonymous requests are denied.
- This is session-authenticated, not an MCP/client-token endpoint.
- Content-Type: application/json; Origin must match the request origin.
- Body: { files: [{ path, content }], manifestPath?: "recipe.yaml", input?: { ... } }.
- 1 MB serialized request; 1–256 files; each file at most 256 KB text; relative paths only.
- Default six inspections per administrator per minute; RECIPE_VALIDATIONS_PER_MINUTE accepts 1–60.
- Responses: 200 accepted for review; 422 structural issues or blocking scanner result; 400 malformed package; 401 signed out; 403 wrong role/origin; 429 request limit; 503 unavailable dependency.
- Response includes structural issues, warnings, field descriptors, optional input errors, file inventory/hash, static scan status, runtime blockers and explicit false readiness flags.
- No package content or user inputs are stored in generic audit events. Audit contains actor, action, timestamps and bounded counts/status only.
- A successful inspection does not create a public listing, installation, provider connection or authorization grant.

## Schema profile

Uses Ajv with JSON Schema draft-07 and 2020-12; local bundled references only, with no network schema loading. Supports standard date/time, URI, UUID and email formats. Uses typed validation without coercing data, applying defaults or removing fields. Type-specific linting is disabled for valid compositional fragments; unknown keywords remain rejected.

Schemas are bounded by file count, byte size, node count and depth. Custom IDs, async/custom execution, dynamic/recursive reference keywords, patternProperties and arbitrary patterns require a separately reviewed import profile. A small audited pattern allowlist plus anchored literal prefixes is supported. References and file paths cannot escape the supplied package. Schema validation is not runtime permission enforcement.

## Read-only preparation and inspection

```sh
python3 scripts/recipe-pack-to-json.py /absolute/package/folder > /private/tmp/recipe-package.json
node --import tsx scripts/inspect-recipe-package.ts /private/tmp/recipe-package.json
```

For a shared ZIP:

```sh
python3 scripts/recipe-pack-to-json.py /absolute/package.zip capabilities/example.read/recipe.yaml > /private/tmp/recipe-package.json
node --import tsx scripts/inspect-recipe-package.ts /private/tmp/recipe-package.json --all > /private/tmp/recipe-report.json
```

--all inspects every recipe.yaml in the prepared collection, flags duplicate IDs, and reports declared dependency cycles and unresolved references. It is an offline content inspection command, not a provider/runtime integration test. Inputs and reports stay local. Do not commit customer/team packages to a public repository.

## Minimum next migration and runtime handoff

1. Preview uses one Supabase Postgres database for accounts, catalog, reviews and private packages. Better Auth remains authoritative; owner IDs in the private schema are opaque Better Auth IDs, not Supabase auth.uid() identities.
2. Introduce only the normalized catalog/version/capability/recipe records needed for one selected capability, with profiles and ownership policies. Keep immutable package files and hashes attached to a version. Public discovery policy remains an explicit decision.
3. Add installations, consents, provider-connection references and runtime bindings with owner scope. No provider secrets in manifests or public metadata.
4. Agree a versioned execution request/result contract with the runtime engineer. Include canonical capability/function/version, actor scope, input schema, idempotency and correlation IDs.
5. Activation becomes ACTIVE only after readiness is confirmed. Revoke blocks later executions. Keep operational step logs in the runtime.
6. Add scoped agent discovery and real events. Record interest, installation, activation, execution and success separately. No default prompt-history archive, monetization, VDX implementation or automatic arbitrary code execution.

## Verification and rollback

TypeScript and lint checks are required for this slice. Source package inspection reports are generated separately; no supplied adapter/test code is executed. Live authenticated endpoint behavior and runtime activation need verification once the review environment and runtime are connected. Focused publication authorization and integrity checks are included; supplied source adapter/test code is never executed.

Migration supabase/migrations/20261021124104_recipe_package_versions.sql adds recipe_private.package_versions, package_reviews and append-only review_events. The private schema is not exposed to PostgREST. RLS is enabled and all public/anon/authenticated grants are revoked. Server operations enforce the existing admin role; Preview-only server credentials access this isolated store. Immutable file payloads and reports cannot be updated or deleted through normal SQL operations; corrections require a new semantic version. Mutable review status is separate and transitions are locked in a transaction.

The Preview Supabase connection now serves all account, catalog and private recipe records. Disconnecting it would disable login and publishing. For rollback, restore the previous application deployment and database connection together from the retained Neon snapshot; do not delete either database while verifying the move. Retain private records until the owner agrees a data retention policy.

## Private workbench

- Open /admin/recipes as a platform administrator on the configured Preview.
- Upload the prepared JSON envelope (up to 1 MB). The server inspects files without executing scripts and discards optional runtime input before storage. Source files themselves must not contain secrets or real patient/customer input.
- Save a private draft to inspect schema/security issues, or select submit for review when the report is valid.
- Draft → pending_review → approved/rejected. Review decisions require a 10–2,000 character note. Approval requires a valid report and the current scanner version. A rejected version needs a new version number for corrections.
- Same ID/version/hash/manifest retries return the existing version. Different files under an existing version are rejected.
- GET /api/v1/recipes/packages/<UUID> returns the private package and report as an attachment only to signed-in administrators. No anonymous package API is provided.
- Registry approval does not make a public marketplace listing. An administrator supplies public metadata, a taxonomy category/subcategory, license and redistribution confirmation, then sends an immutable copy to the publication queue in the same Supabase database. Final approval there publishes the listing. Authenticated downloads return recipe-package.json with all original files and count once per non-author account/version. Runtime readiness remains false.
- Supabase Auth migration, provider connections, machine-client scopes, runtime readiness and execution metrics remain pending.

## Publication handoff and verified scope

The private and public schemas now share one Supabase database. The private version is immutable; the publication action checks its approved review and repeats the static inspection and hash comparison before a transaction creates the pending listing/version/files/scan/review. A recipe-scoped advisory lock and existing version uniqueness make repeated submissions idempotent. No public catalog state changes until the existing administrator approval action. The listing stores its private source version ID and canonical source hash for traceability.

The public integration guide is generated separately from source files. The original manifest/schema bundle is delivered as recipe-package.json; it is not relabeled as executable SKILL.md. Listings carry caution status and explicitly show that runtime execution is unverified. Owner confirmation of redistribution rights is required before the handoff; no license is inferred from a supplied ZIP.

Verification on Preview: supplied research.question.frame v1.0.0 saved as a private draft, submitted, approved for private contract inspection, and downloaded with all 41 files identical to the prepared local package. Its adapter remains unimplemented. This evidence does not establish runtime execution or public redistribution rights. Publication authorization/integrity gates have focused automated checks.

## Editable private listing preview

Any private package version, including a draft with compatibility findings, can have an owner-only listing draft with an editable title, summary, category and subcategory. This is stored in `recipe_private.package_listing_drafts` in the Preview Supabase project and is never added to the public catalog by saving it. A license is not needed for this private team-testing step. The public publication flow remains separate and requires approved source, redistribution terms and permission when the owner elects to use it. The supplied research package remains private.

## Private sample input preview

The owner/team workbench builds guided fields from the bundled JSON Schema and provides a JSON mode for nested values. A server action converts typed values, applies a 32 KB input limit and reuses the static package inspector for schema validation. Input checks remain available on private drafts with unrelated manifest findings when the input schema itself compiles. Only validation status and issue locations return to the browser. Sample values are not persisted in Supabase or audit events; use fictional values. This checks the contract only and never calls a runtime adapter or provider.

The owner/team file viewer at `/admin/recipes/<version-id>` lists every saved source file and opens one at a time. JSON is formatted for reading, while the immutable package download retains the original file content. The same sample input check is available beside the source. The viewer uses the existing administrator session check, remains out of search indexing and does not execute source files.
