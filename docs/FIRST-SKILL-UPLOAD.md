# Submit a recipe using the manager's standard

1. Create an account, sign in, and open `/publish`.
2. Choose **Recipe Markdown + report**. Download the `recipe.md` and `validation-report.md` outlines.
3. Complete all sections A–Q in `recipe.md`. If an item is unknown, mark it `TBD` or `UNVERIFIED`; do not claim a tool, permission, test, or runtime behavior that has not been confirmed.
4. Complete the separate `validation-report.md`. Record the checks performed, results, findings, evidence, tests still needed, and limitations. Clearly mark tests that have not run.
5. Upload both Markdown files. Add the marketplace title, lowercase recipe ID, version, summary, category, subcategory, and reuse terms.
6. Inspect the findings, confirm you have the right to submit the files, then send the recipe for administrator review.
7. Track the result under **My recipes**. It remains private until an administrator approves it.

The checks validate the document structure and run static security scanning. They do not verify the truth of the report, establish that a capability is registered, grant permissions, or execute the recipe.

## Structured files

New creator submissions currently accept only `recipe.md` and its separate `validation-report.md`. YAML and ZIP uploads are paused on both the publishing page and server actions until the team approves their package contract. The example `skillport_standard` block is conceptual and is not an approved runtime schema. No structured JSON execution upload is enabled until the team selects an approved schema.
