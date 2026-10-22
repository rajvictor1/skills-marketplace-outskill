# Skillbuffet delivery and security controls

This guide covers the Skillbuffet application and its user-submitted recipes.
The website source is in GitHub, Preview releases are built by Vercel, and one
Supabase Postgres database stores Preview accounts and recipes. These controls are separate from any
contest or bonus-prize requirements.

## What runs for a code change

1. A contributor opens a pull request against `main`. Vercel builds a Preview
   deployment from that branch.
2. GitHub Actions runs **Code quality** (ESLint, TypeScript, regression tests and
   a production build), **Recipe lifecycle integration** (real browser flow against
   an isolated Postgres service), and **Production dependencies** (high-or-worse advisory audit). The workflow
   installs the committed lockfile and uses read-only repository permissions.
3. Review the changed code, all three check results, and the Vercel Preview.
   The checks do not themselves prevent a merge until the GitHub branch rule
   described below is enabled. Vercel's Git integration can build a Preview
   while checks are running.
4. Merge an approved change to the production branch only after the checks and
   Preview review pass. Vercel's Git integration handles the deployment. Record
   the commit and deployment URL in the release notes or pull request.
5. After deployment, open `/api/health` on the deployment URL. HTTP 200 with
   `{ "status": "ok" }` confirms the server can respond. It does **not**
   check database access, login, or skill publishing. Review Vercel deployment
   and function logs for those failures.

## What runs for a recipe submission

The primary publisher reads a ZIP of text-only source files, finds each
`recipe.yaml`, checks local schemas and file integrity, and lets the creator
submit one valid recipe at a time. Deterministic scanning checks hidden text,
dangerous instructions and static script patterns; it never runs submitted
code. Critical findings block submission. The legacy `SKILL.md` uploader also
supports an optional LLM classifier, which can be skipped when unavailable.
The displayed scan report states which layers ran. Every submitted version
remains private until administrator approval. Static checks and approval do
not establish runtime safety or successful execution.

## Controls still needing an account setting or service

### Protect the production branch

In GitHub, open the repository, then **Settings → Rules → Rulesets**. Create a
branch ruleset for `main` that requires a pull request and the successful
`Code quality` and `Production dependencies` checks.
Set at least one reviewer if your team has someone who can review the code.
Check the exact required status names after the first workflow run. If you
cannot see **Rulesets**, use **Settings → Branches → Add branch protection
rule**. Verify the rule by opening a pull request, rather than assuming the
saved setting is active.

The repository workflow does not add a Vercel production approval gate. If the
team wants a separate release approval, configure Vercel Deployment Checks or
an environment approval before changing production release behavior.

GitHub's Dependency Review action also requires the repository Dependency Graph
setting. Enable that setting before adding the separate pull request review
check. The production audit above already blocks high and critical advisories.

### Enable monitoring and alerts

Use the Vercel deployment page for build and function errors. Connect an uptime
monitor to the production `/api/health` URL and configure an alert destination
owned by the team. Keep database and publishing checks separate from the
liveness probe so a database incident is diagnosed accurately.
The uptime monitor should use plain `/api/health`, not `?check=db`. The active
Vercel edge rule limits `/api/health?check=db` before it reaches the app. The
database readiness route does not write a usage event or enforce an app-side
rate limit; edge protection must remain enabled in every deployment environment.

### Review history retention and integration verification

`public.review_event` keeps administrator decisions and recipe inspection
events for 12 months. The Supabase migration
`20261022090000_review_event_retention.sql` creates indexes on `created_at`
and `(action, created_at)`, enables Supabase Cron, and schedules a daily
03:00 UTC delete of rows older than 12 months. Apply and verify that migration
in the target Supabase database during an approved release; check the Cron job
and recent run history in Supabase afterward. This policy does not change the
separate immutable `recipe_private.review_events` table.

The `Recipe lifecycle integration` GitHub Actions job runs `pnpm test:integration`
for every pull request and `main` push against a disposable Postgres service named
`skillbuffet_e2e`. This job is a required release check: verify it passed before
merging, and add its exact status name to the `main` branch ruleset. For local
verification, run the same command with `TEST_DATABASE_URL` pointing to a disposable
local Postgres database named `skillbuffet_e2e`. The browser test creates test
accounts and checks creator ZIP upload, admin approval, public listing, and
signed-in package download using real SQL. It refuses remote databases and
does not run in the ordinary mocked Vitest suite. Install Chrome and the
Postgres schema migrations before the first run; the test also reapplies
pending migrations safely.

### Handle a failed check or bad release

- **Code quality failed:** Open the failed GitHub Actions job, read the ESLint
  or TypeScript message, fix the named file, and push to the same branch.
- **Dependency check failed:** Read the package and advisory in the job log;
  update the dependency and lockfile. Do not bypass the check to release a
  known high or critical vulnerability without a documented owner decision.
- **Vercel build failed:** Open the deployment's build log and fix the branch.
  The previous Ready deployment remains available.
- **Production is unhealthy:** Check Vercel function logs and the deployed
  commit. Roll back to the last known-good production deployment through
  Vercel if the new release caused the incident, then investigate on a branch.
  A rollback changes what users see and should be recorded.

## Current coverage

| Area | Current state |
| --- | --- |
| Code review and verification | GitHub pull request workflow includes lint, types, regression tests, real database/browser lifecycle integration and build; branch rule pending |
| Package and dependency security | Frozen lockfile and production audit added; GitHub Dependency Graph setting pending for the separate review action |
| User-submitted recipe security | ZIP importer and deterministic scanner; legacy LLM layer is best effort |
| Preview release | Existing Vercel Git integration |
| Production release approval | Pending team policy and account setting |
| Runtime monitoring | `/api/health` liveness route added; external alerting pending |
| Governance and evidence | Pull request checks and scan reports; branch rule and release log pending |

## Nine lifecycle stages and evidence (21 October 2026)

| Stage | Repository evidence | Limit / owner setting |
| --- | --- | --- |
| Plan | README, docs/ADMIN-OPERATIONS.md, changelog | Product priorities remain operator owned |
| Create | Git branch and pull request; immutable skill versions and content hashes | Application changes require code review |
| Verify | ESLint, TypeScript, scanner and authorization tests in .github/workflows/devsecops.yml | Passing checks do not prove all behavior safe |
| Package | Committed pnpm lockfile, frozen CI install, Next build | Dependency audit is advisory-database coverage |
| Secure | Submission scanner, server-side admin authorization, same-origin download POST, sanitized Markdown | AI classifier optional; no antivirus engine or code-execution sandbox |
| Release | Vercel Preview plus separate production branch workflow; admin approve/publish per saved version | Main merge/production promotion still needs operator release decision |
| Configure | .env.example, migrations, explicit administrator provisioning | Never commit credentials; configure production independently |
| Monitor | /api/health, Vercel logs, review events, download records | External uptime alerts and agent execution telemetry not connected |
| Govern | Review queue, reasons, per-version approvals, unpublish controls, review moderation, beta policies | Branch protection, legal details, private contact and retention migration verification require operator configuration |

The pipeline is on the implementation branch until its pull request is merged into `main`. The presence of a workflow is not evidence that every stage passed in a run: inspect the commit's GitHub check results and Vercel deployment state. [GitHub's secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use) explains immutable SHA-pinned actions.

## Source analysis and verified account settings

`.github/workflows/codeql.yml` adds GitHub CodeQL analysis for JavaScript/TypeScript using an official action pinned to immutable commit `f051dc808ef3645eb0d08647ec751634ec2304ac`. Its first run must be checked before describing source analysis as passed. The existing DevSecOps workflow also runs the scanner and authorization regression suite.

A repository API read on 21 October 2026 confirmed **Secret scanning enabled** and **Secret scanning push protection enabled**. Dependabot security updates were disabled at that read. These are account settings, so verify again before release. Do not describe them as enabled by the application code.

## Security finding addressed in this release

The first CodeQL analysis identified executable frontmatter parsing in the inherited `lib/skills/parse.ts` implementation. This release removes `gray-matter` from parsing and rendering, accepts only a plain `---` YAML block, parses with js-yaml's data-only FAILSAFE schema, bounds metadata to 16 KB and strips unknown object graphs. Regression tests reject JavaScript engine selectors and custom JavaScript YAML tags without executing them. Check the latest CodeQL result for the fixing commit rather than the earlier failing run.
