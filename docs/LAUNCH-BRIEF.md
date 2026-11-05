# Skillbuffet: final steps before wider public launch

**Context.** Skillbuffet is a curated marketplace for AI agent recipes. Creators submit a recipe package, security checks scan it, and an admin approves it before it's public. Better Auth 1.7.12 (PR #3) is merged as `e61d6b5`. Production is deployed and `/api/health` returns `{"status":"ok"}`. Preview sign-in works. The separate `skillbuffet-production` Supabase project and first administrator account were created during the earlier rollout; verify their current state before wider public launch.

**Goal.** Complete the six items in `docs/PRELAUNCH-REVIEW.md` so the site can open publicly. Don't change product features during this work. Limit changes to setup, verification, legal text, and configuration.

## 0. Owner inputs (provided by the owner before work starts)

The team can't finish these without the owner's answers. Send them all in one message:

| Input | Needed for |
| --- | --- |
| Legal operator name, registered address, jurisdiction | Terms, Privacy |
| Public privacy contact inbox (not a personal address) | Privacy page, `PRIVACY_CONTACT_EMAIL` |
| Retention and deletion policy | Privacy page |
| Owned domain (e.g. `skillbuffet.com`) and DNS access | Canonical URL, HTTPS |
| Manager reviewer name | Preview approval record |
| Rollback owner name | Release record |
| Confirm the existing Production database and admin ownership | Section B; do not send a database URL or password |
| Confirm the previously selected alert destination still has an active recipient | Section F |

Owner decisions and defaults:
- **Email verification:** default is to enable it before open sign-up. If the owner wants to launch invite-only, state that instead.
- **Search indexing:** default is off (`noindex`) until content is approved.
- **Production data:** do not copy Preview accounts or QA content into Production. Confirm the current Production catalog before launch.

## A. Manager review of Preview (gate)

- The manager reviews the current Preview. Record the approval or requested changes in writing, including the reviewer's name and date.
- Any requested changes are fixed on a branch, opened as a PR, and verified before this item is closed.
- **Done when:** a written approval exists in the repo or the launch record.

## B. Production database (verification gate)

1. Verify that Production still uses the separate `skillbuffet-production` Supabase project and Preview uses its own database. Shared credentials or data are a launch blocker.
2. Inspect the Production migration history against the intended `drizzle/` and `supabase/migrations/` sets. Apply only missing migrations through the documented process; do not re-provision the existing database or seed demo data.
3. Confirm a current restore point (backup), and test restoring it into a scratch database.
4. Confirm the existing first administrator can sign in and open `/admin`; use `docs/ADMIN-OPERATIONS.md` only if access needs repair. Registration alone cannot grant admin rights.
5. Verify `/api/health` against Production, including the database check.
- **Done when:** the separate Production database, schema, backup and restore, health responses, and admin access are confirmed with evidence.

## C. Full end-to-end QA on Preview

Run this once, in order, on the unified Preview database. Use disposable QA content only.

1. Sign up as a new creator. Check that the account is created as expected (email verification per owner decision).
2. Upload a valid ZIP recipe package with `recipe.yaml`. Confirm the validation feedback is clear.
3. Submit it. Confirm it stays private (public URL returns 404).
4. Sign in as admin. Confirm the submission appears in review with its scan report.
5. Test each decision: approve, request changes, reject. Confirm each one saves and that the public view changes as expected.
6. After approval: confirm the listing appears in the public catalog.
7. Sign in as a different user. Download the recipe. Confirm the file content matches.
8. Confirm the creator's own download does not count.
9. Rate the recipe from the second user's account. Confirm the rating appears.
10. Unpublish the listing. Confirm it disappears from the public catalog.
11. Clean up: remove all QA catalog records and QA review events. Record the cleanup in the test log.
12. Test an invalid ZIP and a bad YAML file. Confirm both are rejected with clear errors.

Record results with screenshots or a test log. Any failure is a blocker.

- **Done when:** all steps pass, and the cleanup is recorded. Do not include QA content in Production.

## D. Legal and privacy text

- Write the final Terms and Privacy text using the owner's inputs from section 0.
- The current site describes beta behavior. Make sure the text is accurate: no claims about payments, installs, agent outcomes, savings, or measured performance.
- Include these limits in the Terms and on the Security page:
  - Scanning is not antivirus and not a runtime sandbox.
  - Admin approval is not a guarantee of safety or quality.
  - Downloads measure server responses, not installs or successful runs.
  - Ratings come from account holders; identities are not independently verified.
- Verify the privacy contact (`PRIVACY_CONTACT_EMAIL`) is an approved public inbox.
- Have the owner or counsel review the final text. Record their sign-off.
- **Done when:** Terms and Privacy are final, match the actual behavior, and the owner has signed off.

## E. Domain, canonical URLs, indexing

1. Point the owned domain to the Production deployment. Confirm HTTPS works.
2. Set the production canonical URL and metadata to the owned domain. Confirm no hard-coded Preview or Vercel URLs remain.
3. Keep `noindex` on. Only change indexing after owner approval of content.
4. Set up search console ownership only after content is approved. Submit the sitemap after indexing is on.
- **Done when:** the domain serves Production over HTTPS, canonicals point to it, and indexing is set per owner decision.

## F. Release hygiene and monitoring

1. Confirm branch protection on `main`: require PR review and passing checks before merge.
2. Confirm checks are green on the release commit: code quality, build, production dependency audit, CodeQL, and secret scanning/push protection. Review the open Dependabot alerts, including the older development CLI dependency tree addressed in PR #5, and record the disposition of any remaining alerts. Do not dismiss alerts in bulk.
3. Set up runtime error monitoring for Production.
4. Verify the existing external uptime monitor uses plain `/api/health`, its alert reaches the approved recipient, and homepage coverage is configured. Add or repair coverage if a check is missing; keep `?check=db` out of routine uptime polling.
5. Name the rollback owner. Document how to roll back to the previous Vercel deployment.
6. Create a release record: release commit SHA, deployment URL, date, approver names, and the QA test log.
- **Done when:** protections are on, alerts are tested with one forced failure, rollback steps are written, and the release record exists.

## G. Repo housekeeping

- `QA.md` is uncommitted on the owner's machine. Owner decides whether it belongs in the repo. If yes, open a PR. If no, keep it out.
- Remove any QA or test data from the repo, database, and Production.
- No secrets in the repo or in chat. Keep `.env.local` and credentials local.

## Rules for the team

- Do not merge to `main` or deploy to Production without the owner's explicit approval.
- Do not put passwords, API keys, or database URLs in chat, PRs, or docs.
- Use Preview-only test accounts and data for QA.
- Keep copy honest. Illustrative dashboard metrics and example reviews must stay labeled as such.
- Known limits to keep in public copy: recipe installation, adapter execution, payments, and outcome measurement are not live. Healthcare pack source conflicts are unresolved.

## Local verification before any PR

```sh
pnpm install --frozen-lockfile
pnpm exec eslint . --max-warnings=0
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

Run `pnpm test:integration` if the Playwright suite is set up for the release.

## Definition of done (go-live checklist)

- [ ] Manager approval recorded
- [ ] Production database separate, migrated, backed up, restore tested
- [ ] Admin account created via documented process
- [ ] Full Preview QA journey passed and cleaned up
- [ ] Final Terms and Privacy approved by owner
- [ ] Owned domain on HTTPS, canonicals correct, indexing per decision
- [ ] Branch protection on, release-commit checks green
- [ ] Dependabot alerts reviewed and remaining risks recorded
- [ ] Error monitoring and uptime alerts working
- [ ] Rollback owner named, rollback steps documented
- [ ] Release record written (commit, URL, approver, QA log)
- [ ] Owner gives explicit go-live approval

## What the team reports back (one message)

1. Which checklist items are done, with evidence for each
2. Anything that failed and what was done about it
3. Production commit SHA and deployment URL
4. Open risks, if any
