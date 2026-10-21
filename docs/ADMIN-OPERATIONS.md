# Admin review operations

Administrators are explicit user IDs in `marketplace_admin`. There is no public role selector, sign-up shortcut, email-based runtime role, or first-user-is-admin rule. Bootstrap an existing owner account through an operator-only database connection:

```sql
INSERT INTO marketplace_admin (user_id) VALUES ('<existing-owner-user-id>') ON CONFLICT DO NOTHING;
```

Grant this role only after independently confirming the account owner. An authenticated `/api/me` reports whether the session is an administrator. `/admin` checks the session and database role on the server; every mutation repeats authorization.

## Workflow

1. Open `/admin`. New submissions appear as Pending. Inspect the full saved instructions, hash, source, category, license, permissions, data handling, scan layers and findings.
2. Approve and publish, request changes (with feedback), or reject (with reason). The approved snapshot replaces the public listing atomically. A critical/incomplete/blocked version cannot be approved.
3. The creator sees status and private feedback under My skills. Revisions use the same frontmatter ID and a new semantic version. Older approved content remains public until a replacement is approved.
4. Unpublish removes the public version and returns it to Pending. Review history records the operator, time and reason. A new approval is needed to restore visibility.
5. Moderate reviews for abuse, private information or irrelevant content. Do not hide a review because its rating is negative. Hidden reviews cannot be resurrected by their author.

## Migration and removal of fixtures

`0002_admin_reviews_and_community.sql` adds roles, submissions, review events, ratings and download events. It deletes only `metadata.isSample=true` rows. The code fixture catalog and demo seed script are removed/disabled. Existing real skill versions are moved to Pending and removed from public visibility until the operator reviews them. Do not treat a migration as an admin approval.

Run migrations against the intended environment before deploying this release. Keep a database restore point before any data migration. Production promotion requires separate operator intent; this implementation is first verified on Preview.

## Measurement

Downloads count once per signed-in account per version; creator downloads do not count. This measures server responses to download requests, not installation or successful agent use. Skill ratings require a recorded download and exclude the creator. Platform ratings require a signed-in non-admin account. One editable rating per account/target. There is no independently verified identity system; beta email verification is disabled.

## Public launch policy settings

Set `PRIVACY_CONTACT_EMAIL` to a dedicated support/privacy inbox after the owner approves its publication. Confirm the legal entity, launch jurisdiction, lawful basis, retention schedule, complaint route and final terms. Existing policy pages intentionally identify these beta details as unresolved rather than claiming legal compliance.

Privacy-notice preparation reference: [ICO transparency guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/). This is a reference, not a conclusion that UK law applies to this operator.
