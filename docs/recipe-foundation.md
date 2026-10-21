# Recipe backend foundation

Status: first implementation slice, 21 October 2026. Existing catalog and publishing remain operational. This is package inspection, not installation or execution.

## Architecture inventory

| Requirement                             | Existing implementation                                           | Current work / gap                                                                                                          |
| --------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Human accounts                          | Better Auth, Neon/Postgres                                        | Supabase project does not exist yet; migration is pending                                                                   |
| Catalog, categories, search, ratings    | Existing marketplace and controlled taxonomy                      | Reuse presentation; move taxonomy to data when schema migration is agreed                                                   |
| Publishing and immutable saved versions | Existing listing/version/file/submission records and admin review | Existing uploader accepts SKILL.md; structured-package persistence remains pending                                          |
| Recipe package contract                 | New lib/recipes/package.ts                                        | Reads original recipe.yaml, local schemas, optional SKILL.md and text adapters                                              |
| Security inspection                     | Existing static scanner reused                                    | All submitted text files scanned; no adapter execution, external LLM call or antivirus certification                        |
| Input requirements                      | New inputFields and optional inputValidation report               | Nested schema fields remain complex; no generated forms UI yet                                                              |
| API protection                          | Existing sessions and marketplace_admin role reused               | New owner/team-only POST /api/v1/recipes/validate, same-origin check, bounded body, database-backed request limit and audit |
| Registered machine clients / MCP        | Not implemented                                                   | Requires scoped client identity and a separate authorization contract                                                       |
| Installation, consent and providers     | Not implemented                                                   | Separate records and explicit state transitions required                                                                    |
| Runtime and activation                  | Not connected                                                     | Readiness stays false; adapter names and source test logs do not establish readiness                                        |
| Operational metrics                     | Existing illustrative dashboard and real catalog totals           | Execution metrics require authenticated runtime events                                                                      |

## Supported source layouts

1. A standalone folder containing recipe.yaml, SKILL.md, schemas and optional adapter text.
2. A shared package with capabilities/<id>/recipe.yaml and root schemas, selected by manifestPath.

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

1. Create/connect a Supabase development project; retain the working Preview until authentication and data migration are reviewed. Map existing opaque IDs, accounts, versions, ratings and reviews before any migration. Do not silently replace authentication providers.
2. Introduce only the normalized catalog/version/capability/recipe records needed for one selected capability, with profiles and ownership policies. Keep immutable package files and hashes attached to a version. Public discovery policy remains an explicit decision.
3. Add installations, consents, provider-connection references and runtime bindings with owner scope. No provider secrets in manifests or public metadata.
4. Agree a versioned execution request/result contract with the runtime engineer. Include canonical capability/function/version, actor scope, input schema, idempotency and correlation IDs.
5. Activation becomes ACTIVE only after readiness is confirmed. Revoke blocks later executions. Keep operational step logs in the runtime.
6. Add scoped agent discovery and real events. Record interest, installation, activation, execution and success separately. No default prompt-history archive, monetization, VDX implementation or automatic arbitrary code execution.

## Verification and rollback

TypeScript and lint checks are required for this slice. Source package inspection reports are generated separately; no supplied adapter/test code is executed. Live authenticated endpoint behavior and runtime activation need verification once the review environment and runtime are connected. Automated tests have not been added or run in this slice.

This change uses no database migration. Removing the new endpoint and inspection modules reverses it; request audit entries may remain in the existing review_event table under normal retention policy. No existing catalog entries or accounts are modified.
