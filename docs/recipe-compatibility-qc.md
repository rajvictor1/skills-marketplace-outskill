# Recipe compatibility QC — 21 October 2026

Database update, 22 October 2026: Preview account, catalog, review and private
recipe records now share one Supabase Postgres database. The compatibility
findings below remain an historical snapshot of the supplied package files.

This report checks the supplied VDX and healthcare archives against the same
Skillbuffet `recipe.yaml` importer. The pack files are not committed here.
Both supplied ZIP archives passed `unzip -tq` integrity checks.

| Source | Manifests | Structurally valid | Static security | Runtime |
| --- | ---: | ---: | --- | --- |
| VDX pack | 53 | 53 | 53 passed after removing a JSON Schema dialect URL false positive | All 53 declare contract-only placeholder adapters; none verified |
| Healthcare canonical pack | 11 | 0 | 11 passed static checks | None verified; 4 personal-tracking adapters are placeholders |
| Healthcare full archive | 25, including sample and global variants | 0 | Source-level contract issues remain | None verified |

Structural validity means the manifest, local JSON Schemas, references,
documentation version, and bounded package shape passed inspection. Static
security is not a malware guarantee or a runtime test. Neither pack has been
installed, activated, or executed by this QC.

## What is compatible today

- A `recipe.yaml` plus bundled JSON Schemas is the shared source format across
  all categories. Category selection is listing metadata and does not change
  manifest rules.
- The `/publish` ZIP form discovers each `recipe.yaml`, shows its QC result,
  and lets a signed-in creator submit one valid recipe at a time. The creator
  gives it a title, category and subcategory. It enters the admin review queue
  privately; approval is a separate action. A larger ZIP may be used as a
  source collection, but never as a single recipe listing.
- The private owner workbench and creator submission queue now use separate
  schemas within the same Preview Supabase database.
- The offline collection preparation command creates a separate JSON envelope
  for each `recipe.yaml`, with shared schemas only as needed.
- `SKILL.md` is optional documentation in a structured package. It is not the
  required recipe manifest.

## Healthcare source corrections

The importer did not reject these because they are in Healthcare. The files
conflict with the common contract and, in several cases, with their own
bundled `recipe-manifest.schema.json`:

- Six hospital recipes use invalid `preconditions` or `timeout_ms` values;
  four of those also use an invalid `dependencies` value. These fields need
  the declared array or integer types.
- Seven hospital recipes use `payment_modes` and
  `patient_initiated_order` values that conflict with their bundled schema.
  One also has an invalid `booking_style` value.
- The billing recipe's `SKILL.md` and `recipe.yaml` declare different
  versions.
- Four personal-tracking drafts have empty input/output schema paths and no
  named human gate for their declared write behavior. Their adapters are also
  marked pending.

Do not silently coerce these values at import time. The team should correct
the source packages and increment recipe versions when previously saved
versions change. Private drafts may still be inspected while corrections are
pending.

## Remaining product work

**Required now**

1. Correct the healthcare manifest and schema conflicts in the team's source
   files. The publisher will not silently rewrite them.
2. Verify one creator ZIP submission and its administrator decision on Preview
   with an authorized sample package. The legacy SKILL.md uploader remains
   available under a collapsed section during migration.

**Recommended**

3. Add cross-package dependency checks and publisher identity/rights records
   to the online batch submission flow; the offline QC only checks the
   individual source packages and the VDX collection's declared graph.
4. Add an explicit readiness badge: contract valid, security reviewed,
   adapter bound, runtime tested, and published are separate states.

**Future / optional**

5. Implement the specification's installation, authorization/consent,
   execution adapter, usage events, and personalized analytics only after one
   recipe completes a verified end-to-end runtime journey.

The integrated master specification describes a broader control plane than
the current Preview. Supabase stores the account and recipe records, while
Better Auth continues to manage login. The single database does not imply
that installation, execution or runtime analytics are live.

## Reproduce the offline QC

```sh
python3 scripts/recipe-pack-to-json.py /path/to/VDX_Syed_Abid_Recipe_Pack.zip > /private/tmp/vdx-collection.json
node --import tsx scripts/prepare-recipe-collection.ts /private/tmp/vdx-collection.json /private/tmp/vdx-individual > /private/tmp/vdx-qc.json
python3 scripts/recipe-pack-to-json.py /path/to/healthcare/skillport-packages recipe.yaml > /private/tmp/healthcare-collection.json
node --import tsx scripts/prepare-recipe-collection.ts /private/tmp/healthcare-collection.json /private/tmp/healthcare-individual > /private/tmp/healthcare-qc.json
```

These commands only read supplied source and write local JSON reports/packages
to the nominated output directory. They do not execute adapters, upload
packages, or publish catalog entries.
