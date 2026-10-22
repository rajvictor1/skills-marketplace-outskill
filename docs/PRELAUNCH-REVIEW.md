# Skillbuffet pre-launch review

Status on 22 October 2026: **Preview hardening; awaiting manager review.** This
document is evidence for a launch decision, not a claim that the public launch
has happened or that every error has been ruled out.

## Product hypothesis

If creators can submit one standard `recipe.yaml` package from a collection,
see precise validation feedback, and receive an administrator decision before
publication, then users can discover and download recipes with clearer
provenance and fewer unsafe or misleading listings. The first meaningful
measure is the share of valid submissions that reach an administrator decision
and a successful, versioned download. A download does not prove installation,
execution or a useful task result.

## Verified scope

| Area | Current evidence | Limit |
| --- | --- | --- |
| Source and deployment | The implementation branch builds on Vercel Preview; the latest commit and CI results should be checked before sign-off. | No production release or manager approval yet. |
| Accounts and data | Preview login, public catalog, review history and private package records use one Supabase Postgres database. Admin pages load registered users, submissions and private versions. | Better Auth manages login; Supabase Auth is not used. |
| Publisher | The primary website form discovers `recipe.yaml` manifests in a ZIP and submits one valid selected recipe to private admin review. A legacy `SKILL.md` form remains available. | A complete post-migration creator submission and admin decision should be repeated on Preview with a disposable QA package. |
| Package inspection | VDX source pack: 53 of 53 manifests pass structural and static checks. ZIP and YAML rejection cases are in the regression suite. | The supplied healthcare pack has source contract conflicts; no pack has a verified runtime adapter. Static scanning is not antivirus or a runtime sandbox. |
| Public catalog | Only approved saved versions appear publicly; download counts and ratings are separated from scan and approval status. | Example content and illustrative dashboard metrics are labeled and excluded from real totals. |
| SEO | Preview is marked noindex. Canonicals, metadata and structured content are prepared for an owned production domain. | Search indexing and sitemap submission require a verified final domain. |

## Required before public launch

1. Manager reviews the Preview and records approval or requested changes.
2. Repeat a full creator ZIP submission, administrator decision, public listing,
   authenticated download and rating journey against the unified Preview
   database. Keep synthetic QA content private or remove it after the check.
3. Confirm the legal operator, jurisdiction, public privacy contact, retention
   and deletion policy, and final Terms and Privacy text. Enable a verified
   account-email flow before unrestricted sign-up.
4. Provision and migrate the intended **Production** database and credentials;
   make and test a restore point. Preview credentials must stay Preview-only.
5. Set and verify an owned HTTPS domain, production canonical URL, indexing
   switch and search-console ownership only after the content is approved.
6. Confirm branch protection, green code-quality/build/dependency/CodeQL checks
   on the release commit, runtime error monitoring, uptime alerts and rollback
   ownership. Record the exact release commit and deployment URL.

## Later product work

Recipe installation, adapter execution, provider permissions and consent,
outcome telemetry, payments and real time-saved metrics are not live. Healthcare
source corrections are needed before those packages can pass the common
contract. None of these should be represented as a working capability at
launch.
