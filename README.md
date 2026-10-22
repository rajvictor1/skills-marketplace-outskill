# Skillbuffet

A curated marketplace for AI agent recipes. Creators submit a recipe or a structured recipe package, security checks inspect its files, and an administrator reviews the saved version before publication.

## Current features

- Controlled discovery across 19 categories, including Entertainment and Marketing.
- File upload, paste or public GitHub import. GitHub source links are optional for uploads.
- Private per-version submissions with approve/publish, request changes, reject, unpublish and review history.
- Server-side administrator authorization; registration cannot grant an admin role.
- Approved public listings and a bounded read-only catalog API.
- Authenticated recipe downloads with unique account/version counting; creator downloads do not count.
- Download-eligible skill ratings, marketplace reviews and administrator moderation. No fabricated social proof.
- Creator workspace, live catalog metrics, docs, API reference, changelog and beta policy pages.

## Local setup

Use the package manager version in package.json. Copy `.env.example` to `.env.local`, set a Postgres `DATABASE_URL`, generate a private `BETTER_AUTH_SECRET`, and set `BETTER_AUTH_URL=http://localhost:3000` for local development. Never commit this file. The local app can show its empty public shell without a database, but accounts and submissions need Postgres.

The Vercel Preview uses one Supabase Postgres database for Better Auth accounts, public recipes, review history, and private recipe packages. The server-only `RECIPE_DEV_POSTGRES_URL` points to that database. Supabase Auth is not enabled for the app; existing Better Auth accounts and password hashes retain their IDs. Local development can use `DATABASE_URL` alone, or set `RECIPE_DEV_POSTGRES_URL` to use that same database for all features.

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

Use `/auth/sign-up` to create the owner account. An operator must explicitly provision its user ID in `marketplace_admin`; see [admin operations](docs/ADMIN-OPERATIONS.md). The first registered user is not automatically an administrator. On Vercel, Preview and Production resources and credentials are configured independently.

## Database migration

The migration `0002_admin_reviews_and_community.sql` adds administrator roles, private submission snapshots, audit events, downloads and ratings. It removes rows explicitly marked as samples and moves existing auto-published versions to Pending review. Back up the intended database before migration. It never treats a migration as an administrator approval. Demo catalog fixtures and seeding are removed/disabled.

## Verification and delivery

```sh
pnpm exec eslint . --max-warnings=0
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

GitHub Actions runs code quality, scanner and authorization regression tests, production dependency auditing, and CodeQL source analysis. GitHub's secret scanning and push protection are repository settings, verified separately. Vercel builds the implementation branch as Preview. A branch/PR deployment is not evidence of a merge into main or a production release. See [DevSecOps evidence](docs/DEVSECOPS.md) for all nine lifecycle stages and outstanding account settings.

## Guides and API

- [First submission](docs/FIRST-SKILL-UPLOAD.md)
- [Admin operations](docs/ADMIN-OPERATIONS.md)
- Website docs: `/docs`, `/docs/publishing`, `/docs/api`, `/docs/security`, `/docs/changelog`
- `GET /api/v1/skills?q=research&limit=20&offset=0`
- `GET /api/v1/skills/{slug}`

Public endpoints return approved current versions only. Browser downloads use a same-origin POST and signed-in session; there is no supported token-authenticated download API or CLI yet.

## Security and measurement limits

Skill instructions are scanned and rendered, never executed. The scanner checks hidden text, dangerous instructions and static script patterns. The AI classifier is optional and its actual use is shown in the scan report. There is no antivirus engine or execution sandbox. Admin approval and a scan badge do not guarantee safety, quality or agent outcomes.

Downloads measure server responses to authenticated download requests, not installations or successful runs. Ratings are from account holders; identities are not independently verified. Email verification is currently disabled for beta. Agent outcomes, time saved, revenue and payouts are not measured or implemented.

Privacy/terms pages describe actual beta behavior. The operator must finalize its legal identity, jurisdiction, private contact and retention policy before a general public launch. Set `PRIVACY_CONTACT_EMAIL` only to an inbox approved for public display.

## Credits and license

Skillbuffet builds on [Harshith Vaddiparthy's skills-marketplace-outskill](https://github.com/harshith-vaddiparthy/skills-marketplace-outskill), an open teaching project. Preserve the upstream [MIT license](LICENSE) and required attribution when redistributing the application. Individual uploaded skills have their own declared licenses; the application's MIT license does not automatically cover them.
