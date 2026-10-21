# Recipe compatibility QC — 21 October 2026

This report checks the supplied VDX recipe pack and the canonical
`skillport-packages` directory in the healthcare pack against the same
Skillbuffet `recipe.yaml` importer. The pack files are not committed here.
Both supplied ZIP archives passed `unzip -tq` integrity checks.

| Source | Manifests | Structurally valid | Static security | Runtime |
| --- | ---: | ---: | --- | --- |
| VDX pack | 53 | 53 | 53 passed after removing a JSON Schema dialect URL false positive | All 53 declare contract-only placeholder adapters; none verified |
| Healthcare canonical pack | 11 | 0 | 11 passed static checks | None verified; 4 personal-tracking adapters are placeholders |

Structural validity means the manifest, local JSON Schemas, references,
documentation version, and bounded package shape passed inspection. Static
security is not a malware guarantee or a runtime test. Neither pack has been
installed, activated, or executed by this QC.

## What is compatible today

- A `recipe.yaml` plus bundled JSON Schemas is the shared source format across
  all categories. Category selection is listing metadata and does not change
  manifest rules.
- The private owner workbench stores immutable package versions, runs the same
  structural and static-security inspection, and supports private review and
  listing previews. Existing public listings still use a separate SKILL.md
  submission path.
- The collection preparation command creates a separate JSON envelope for
  each `recipe.yaml`. Shared schemas are copied only as needed. This avoids
  treating an entire 53-recipe ZIP as one recipe.
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

1. Replace the split public SKILL.md publisher and private recipe workbench
   with one creator-facing structured-package submission flow. Keep legacy
   SKILL.md listings readable during migration, then retire that upload path.
2. Let the owner inspect a ZIP, choose one or more discovered manifests, see
   each validation report, assign a category, and submit corrected versions
   for review without running a command-line conversion.
3. Resolve the healthcare manifest issues at source. Do not present a failed
   contract as valid because of its category.

**Recommended**

4. Add cross-package dependency checks and publisher identity/rights records
   to the online batch submission flow; the offline QC only checks the
   individual source packages and the VDX collection's declared graph.
5. Add an explicit readiness badge: contract valid, security reviewed,
   adapter bound, runtime tested, and published are separate states.

**Future / optional**

6. Implement the specification's installation, authorization/consent,
   execution adapter, usage events, and personalized analytics only after one
   recipe completes a verified end-to-end runtime journey.

The integrated master specification describes a broader control plane than
the current Preview. Supabase is currently the private Preview recipe registry;
the public catalog and login still use Neon and Better Auth. That database
split is a migration task, not evidence that the full specification is live.

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
