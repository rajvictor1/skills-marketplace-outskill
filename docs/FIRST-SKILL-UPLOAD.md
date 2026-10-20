# Publish your first real skill on Skillbuffet

The catalog currently contains labeled example listings. A real skill is one
`SKILL.md` file containing instructions for an AI agent. You can submit it
through the Preview publishing form; approved content is saved in the Preview
database, not committed to this website's GitHub repository.

## Step 1: Write your skill

Create a plain UTF-8 text file named exactly `SKILL.md`. Start with YAML
frontmatter containing a lowercase `name` (letters, numbers, and hyphens;
64 characters maximum) and a clear `description` (1,024 characters maximum).
Then write the instructions in Markdown. For example:

```md
---
name: campaign-brief-builder
description: Create a reviewable marketing campaign brief from a target audience, offer, and objective. Use this when planning a new campaign.
---

# Campaign Brief Builder

## Inputs
- Target audience and their problem
- Offer and proof points
- Campaign objective and channel
- Brand voice and any restrictions

## Workflow
1. Check which inputs are missing. Ask for critical missing facts.
2. Separate supplied facts from assumptions. Do not invent performance results.
3. Draft positioning, message, channel plan, and a clear call to action.
4. Flag claims that need approval or evidence.
5. Return a concise brief with next actions and a measurement plan.

## Output
Provide the audience, objective, message, channel plan, CTA, evidence gaps,
review owner, and suggested success metrics.
```

Replace the example with your own workflow and test the instructions with a
realistic input before publishing. Remove passwords, API keys, private client
data, and instructions that exceed the access you intend to declare.

## Step 2: Open the publishing form

Open the Skillbuffet Preview at `/publish` and sign in or create an account.
For a first upload, choose **Upload file**, select your `SKILL.md`, and confirm
the filename appears. The file must be smaller than 256 KB. You can also
choose **Paste text** to paste the full file content. **Import GitHub** reads
only a root `SKILL.md` on the default branch of a public repository.

ZIP files, companion scripts, nested GitHub folders, and private GitHub
repositories are not accepted in this version.

## Step 3: Describe the listing

Enter a marketplace title (3–80 characters), a version such as `1.0.0`, one
category and subcategory, and a summary (20–280 characters). Add up to eight
tags if useful, and select a license that matches your actual reuse terms.
`Proprietary` is available if you do not want to grant an open-source license.

Select compatible agent products and declare every access need the skill may
request. Add expected inputs, outputs, and a data-handling note. Documentation
and support links are optional and must use HTTPS.

## Step 4: Scan and submit

Read the rights statement, check it only if it is true, then click **Scan and
submit skill**. The scanner reads the instructions but does not run them.
Critical findings block publication. Other findings can publish with a caution
badge; review and fix them where possible.

After a successful submission, open the new listing to check the title,
category, rendered instructions, and scan result. Your own submissions appear
under **Dashboard → My skills**. A blocked submission stays out of the public
catalog; edit your file and resubmit after addressing the finding.

## What to expect in Preview

The 36 prebuilt example listings are only display fixtures. They are labeled
**Example** and have not been submitted, scanned, installed, or measured. Your
published skill is a separate database record. The dashboard's run, earnings,
cost, and time-saved views are illustrative until product telemetry exists.
