# Skillbuffet delivery and security controls

This guide covers the Skillbuffet application and its user-submitted skills.
The website source is in GitHub, Preview releases are built by Vercel, and the
Neon database is connected to Preview. These controls are separate from any
contest or bonus-prize requirements.

## What runs for a code change

1. A contributor opens a pull request against `main`. Vercel builds a Preview
   deployment from that branch.
2. GitHub Actions runs **Code quality** (ESLint and TypeScript), **Production
   dependencies** (high-or-worse advisory audit), and **Dependency review**
   (new high-or-worse dependency advisories in the pull request). The workflow
   installs the committed lockfile and uses read-only repository permissions.
3. Review the changed code, the three check results, and the Vercel Preview.
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

## What runs for a skill submission

The publishing form validates metadata and parses one `SKILL.md`. The existing
scanner checks hidden text, dangerous instructions, static script patterns,
and optionally an LLM classifier. A critical finding blocks publication, and
the scan report is stored with the version in Postgres. The LLM check can be
skipped if its API key is absent or the call fails; the displayed layer status
is the source of truth. A scan reduces risk but cannot guarantee safety.

## Controls still needing an account setting or service

### Protect the production branch

In GitHub, open the repository, then **Settings → Rules → Rulesets**. Create a
branch ruleset for `main` that requires a pull request and the successful
`Code quality`, `Production dependencies`, and `Dependency review` checks.
Set at least one reviewer if your team has someone who can review the code.
Check the exact required status names after the first workflow run. If you
cannot see **Rulesets**, use **Settings → Branches → Add branch protection
rule**. Verify the rule by opening a pull request, rather than assuming the
saved setting is active.

The repository workflow does not add a Vercel production approval gate. If the
team wants a separate release approval, configure Vercel Deployment Checks or
an environment approval before changing production release behavior.

### Enable monitoring and alerts

Use the Vercel deployment page for build and function errors. Connect an uptime
monitor to the production `/api/health` URL and configure an alert destination
owned by the team. Keep database and publishing checks separate from the
liveness probe so a database incident is diagnosed accurately.

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
| Code review and verification | GitHub pull request workflow added; branch rule pending |
| Package and dependency security | Frozen lockfile, production audit, and pull request dependency review added |
| User-submitted skill security | Four-layer scanner already in the application; LLM layer is best effort |
| Preview release | Existing Vercel Git integration |
| Production release approval | Pending team policy and account setting |
| Runtime monitoring | `/api/health` liveness route added; external alerting pending |
| Governance and evidence | Pull request checks and scan reports; branch rule and release log pending |
