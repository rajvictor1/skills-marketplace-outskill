# Production database backup and scratch-restore runbook

**Status: prepared, not executed.** No Production dump has been taken, no restore point was created, and no scratch database has been created. Do not run this procedure until the owner approves the specific backup window, secure destination, and scratch target in writing.

## Purpose and scope

Take one encrypted logical PostgreSQL dump of Skillbuffet Production, keep the encrypted artifact in an approved private location, restore it to a separate empty scratch PostgreSQL database, and verify the schema plus core marketplace tables. This is not a Supabase project clone or a full disaster-recovery test. `pg_dump` does not back up Supabase Storage object bytes, Vercel settings, environment secrets, project-level Auth settings, DNS, or other Supabase project configuration. Back up any Storage objects separately if the app uses them.

## Required approvals and safeguards

Before the run, record:

- Written owner approval to read Production data and create a backup.
- The approved encrypted private destination and who can access it.
- The scratch database/project name, owner, region, and a confirmation that it is separate from Production and not connected to the live app or Vercel.
- The backup retention date and who will authorize later deletion of the dump and scratch copy.
- A maintenance window and contact for stopping if the database or application shows unexpected load/errors.

Use the Production connection details only from the approved password manager. Never paste credentials into chat, GitHub, a ticket, a shell command, shell history, or a committed file. Prefer a direct database connection where supported; use TLS. Confirm the installed `pg_dump` major version is equal to or newer than the server version. Keep the current Preview test account and its records untouched.

## 1. Create the encrypted dump

Run locally on a trusted, encrypted device after approval. GPG prompts interactively for a new encryption passphrase; store that passphrase separately in the approved password manager. The PostgreSQL password is requested interactively and is not included in the command. Replace the angle-bracket placeholders locally; do not commit this runbook with real values.

```sh
umask 077
set -o pipefail

# Choose an approved private directory on encrypted storage.
BACKUP_FILE="/private/approved/location/skillbuffet-prod-$(date -u +%Y%m%dT%H%M%SZ).dump.gpg"

pg_dump --format=custom --no-owner --no-acl --password \
  --host='<PRODUCTION_DB_HOST>' --port=5432 \
  --username='<PRODUCTION_DB_USER>' --dbname=postgres \
| gpg --symmetric --cipher-algo AES256 --output "$BACKUP_FILE"

shasum -a 256 "$BACKUP_FILE"
gpg --decrypt "$BACKUP_FILE" | pg_restore --list
```

The final command verifies the encrypted archive can be decrypted and read as a PostgreSQL archive; it does not restore data. Confirm the output is an encrypted `.gpg` file with restrictive access. Record only its timestamp, byte size, checksum, and result in a private operations log. Do not put the dump or checksum in this public repository. If either pipeline step fails, stop; do not treat a partial file as a backup.

## 2. Restore to the approved scratch database

Create or select an **empty** scratch PostgreSQL database on a separate project/instance. Check its hostname/project ID carefully before proceeding. Do not point this command at Production, Preview, the live application, or Vercel. Keep any cron/scheduled jobs disabled in scratch unless the owner separately approves testing them.

```sh
set -o pipefail

gpg --decrypt "$BACKUP_FILE" \
| pg_restore --no-owner --no-acl --password \
    --host='<SCRATCH_DB_HOST>' --port=5432 \
    --username='<SCRATCH_DB_USER>' --dbname='<SCRATCH_DB_NAME>'
```

GPG and PostgreSQL credentials are entered at their interactive prompts. Do not add `--clean` or `--create`: the target should be a separately created empty scratch database, and the command must not drop or recreate another database.

## 3. Verify the restored copy

Against the scratch database only:

1. Confirm `pg_restore --list` succeeds and the restore exits with status 0.
2. Compare the restored schema and migration history with the repository migrations for this release.
3. Confirm core tables exist: `account`, `session`, `skill`, `skill_version`, `skill_file`, `skill_submission`, `skill_download`, `community_rating`, `review_event`, `scan_result`, `marketplace_admin`, and `marketplace_admin_invite` (adapt only if the checked-in schema names differ).
4. Verify expected indexes, foreign keys, check constraints, RLS policies, and triggers from migrations. Inspect aggregate row counts for key tables without exporting personal row contents.
5. Confirm the scratch database is not used by the application and that scheduled jobs/external integrations have not run.
6. Record pass/fail, timestamps, archive checksum, PostgreSQL client/server versions, migration head and table/index checks in the private log. Redact hostnames, usernames, row data and all credentials before sharing any result.

If a table or migration is missing, stop and preserve the encrypted archive. Do not “fix” Production or re-run against live data as part of the restore test; investigate the scratch restore separately.

## Completion and limits

After the owner reviews the private result, decide whether to retain or remove the scratch database and encrypted dump under the approved retention policy. Do not delete either automatically. A logical dump/restore checks database objects and data recoverability; it does not prove a point-in-time recovery, recovery-time objective, full project configuration restore, or Supabase Storage object recovery.

## References

- [PostgreSQL `pg_dump`](https://www.postgresql.org/docs/current/app-pgdump.html)
- [PostgreSQL `pg_restore`](https://www.postgresql.org/docs/current/app-pgrestore.html)
- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
