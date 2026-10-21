# Preview release verification — 21 October 2026

## Checks performed

- ESLint and TypeScript passed against the locked installation.
- 24 tests passed: scanner fixtures, administrator authorization, blocked/incomplete/critical scan gates, replayed decisions, reviewed-version snapshot publication, preservation of the previous approved version, rating permissions, download Origin/session checks, and data-only YAML parser regressions.
- Production build passed with Next.js 16.3.8 and the committed lockfile.
- A Preview database transaction verified pending privacy, approved-version visibility, unique account/version downloads, unique account/target ratings and valid star bounds. All transaction fixtures were rolled back. Reproducible SQL: `scripts/verify-review-database.sql`.
- Browser test: a generated QA skill was submitted without GitHub and stayed private (public route 404); administrator approval created the listing; SKILL.md downloaded with expected content; creator download count stayed zero.
- Browser test: a new QA version entered review; Request changes kept version 1.0.0 public. Unpublish removed the public listing and returned the old version to Pending. Reject saved the decision. All QA catalog records and QA review events were removed after verification.
- The real Deep Research upload remains private and Pending for the owner to review. It was not approved as part of the QA tests.
- CodeQL initially detected executable frontmatter in the inherited parser. The fixing commit removed the executable parser. CodeQL, production dependency audit and code quality checks passed for fixing commit 7a491ea. Check newer head results for the final styling commit.

## What is not claimed

These checks do not establish antivirus coverage, guaranteed safety, independently verified reviewer identities, task execution success or a production launch. All nine DevSecOps stages are mapped in `docs/DEVSECOPS.md`; external uptime alerts, main-branch policy and final legal jurisdiction/retention provisions remain operator settings or decisions.
