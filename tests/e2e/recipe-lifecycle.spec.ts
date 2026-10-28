import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type BrowserContext } from "@playwright/test";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const databaseUrl = process.env.TEST_DATABASE_URL!;
const baseURL = "http://localhost:3100";

function recipeDocuments(recipeId: string) {
  const directory = mkdtempSync(join(tmpdir(), "skillbuffet-e2e-recipe-"));
  const recipePath = join(directory, "recipe.md");
  const reportPath = join(directory, "validation-report.md");
  const sections = [
    "A. Identity and ownership", "B. Capability register and callable objects", "C. Intent and applicability",
    "D. Inputs and outputs", "E. Constraints and budgets", "F. CRUD and side effects",
    "G. Autonomy and approval policy", "H. Execution plan", "I. Continuous verification",
    "J. Self-correction and recovery", "K. Independent challenge", "L. Human escalation",
    "M. Completion conditions", "N. Final output contract", "O. Learning and revision",
    "P. Testing and publication readiness", "Q. Open questions and known limitations",
  ];
  writeFileSync(recipePath, `# Lifecycle test recipe\n\nRecipe ID: ${recipeId}. Test-only declaration; runtime capabilities and evidence are UNVERIFIED.\n\n${sections.map((heading) =>
    `## ${heading}\n\nThis test recipe documents a harmless review-flow fixture. No external capability is claimed; runtime and evidence are UNVERIFIED.`).join("\n\n")}`);
  writeFileSync(reportPath, `# Validation report\n\n${[
    "Checks performed", "Results", "Findings", "Evidence", "Tests still needed", "Limitations",
  ].map((heading) => `## ${heading}\n\nUNVERIFIED: test fixture has not been executed as a recipe.`).join("\n\n")}`);
  return { recipePath, reportPath, directory };
}

async function signUp(context: BrowserContext, email: string, password: string) {
  const response = await context.request.post(`${baseURL}/api/auth/sign-up/email`, {
    data: { name: "Lifecycle Test User", email, password },
    headers: { origin: baseURL },
  });
  expect(response.status()).toBe(200);
  const signIn = await context.request.post(`${baseURL}/api/auth/sign-in/email`, {
    data: { email, password },
    headers: { origin: baseURL },
  });
  expect(signIn.status()).toBe(200);
  const page = await context.newPage();
  await page.goto("/dashboard/skills");
  await expect(page).toHaveURL(/\/dashboard\/skills/);
  return page;
}

test("creator Markdown recipe requires admin approval before authenticated downloads", async ({ browser }) => {
  const sql = postgres(databaseUrl, { max: 2, prepare: false });
  const creator = await browser.newContext();
  const reviewer = await browser.newContext();
  const anonymous = await browser.newContext();
  const suffix = randomUUID().replaceAll("-", "");
  const recipeId = `e2e.lifecycle.${suffix}`;
  const title = `Lifecycle recipe ${suffix.slice(0, 8)}`;
  const password = `test-${randomUUID()}`;
  const creatorEmail = `creator-${suffix}@example.test`;
  const reviewerEmail = `reviewer-${suffix}@example.test`;
  const { recipePath, reportPath, directory } = recipeDocuments(recipeId);
  try {
    await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
    const creatorPage = await signUp(creator, creatorEmail, password);
    await creatorPage.goto("/publish");
    await expect(creatorPage.getByRole("button", { name: /Switch to (light|dark) mode/ })).toBeEnabled({ timeout: 15_000 });
    await expect(creatorPage.getByRole("heading", { name: "Submit a recipe and its validation report" })).toBeVisible();
    await expect(creatorPage.getByRole("button", { name: /Recipe ZIP|Single recipe\.yaml/ })).toHaveCount(0);
    await creatorPage.getByLabel(/Recipe Markdown/).setInputFiles(recipePath);
    await creatorPage.getByLabel(/Separate validation report/).setInputFiles(reportPath);
    await creatorPage.getByLabel("Display title").fill(title);
    await creatorPage.getByLabel("Stable recipe ID").fill(recipeId);
    await creatorPage.getByLabel("Short summary").fill("A harmless recipe used to verify the manager-standard marketplace publication flow.");
    await creatorPage.getByLabel("Reuse terms").selectOption("Other");
    await creatorPage.getByRole("checkbox", { name: /permission to submit these files/ }).check();
    await creatorPage.getByRole("button", { name: "Check both files" }).click();
    await expect(creatorPage.getByRole("status")).toContainText("passed format and static security checks");
    await creatorPage.getByRole("button", { name: "Submit for admin review" }).click();
    await expect(creatorPage.getByRole("status")).toContainText("submitted for administrator review");

    const [listing] = await sql<{ id: string; slug: string; status: string }[]>`
      select id, slug, status from public.skill where metadata->>'recipeId' = ${recipeId}`;
    expect(listing?.status).toBe("draft");
    const anonymousPage = await anonymous.newPage();
    const pendingResponse = await anonymousPage.goto(`/skills/${listing.slug}`);
    expect(pendingResponse?.status()).toBe(404);
    expect(await pendingResponse?.text()).not.toContain(recipeId);
    expect(await pendingResponse?.text()).not.toContain(title);
    await expect(anonymousPage.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    await expect(anonymousPage.getByRole("heading", { name: title, exact: true, level: 1 })).toHaveCount(0);

    const unknownResponse = await anonymousPage.goto(`/skills/unknown-${suffix}`);
    expect(unknownResponse?.status()).toBe(404);
    await expect(anonymousPage.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);

    const reviewerPage = await signUp(reviewer, reviewerEmail, password);
    const [adminUser] = await sql<{ id: string }[]>`
      select id from public."user" where email = ${reviewerEmail}`;
    await sql`insert into public.marketplace_admin (user_id) values (${adminUser.id})`;
    await reviewerPage.goto("/admin");
    const reviewCard = reviewerPage.locator("article").filter({
      hasText: title,
      has: reviewerPage.getByRole("button", { name: "Approve and publish" }),
    });
    await expect(reviewCard).toContainText("Pending admin review");
    await reviewCard.getByRole("button", { name: "Approve and publish" }).click();
    await expect.poll(async () => {
      const [row] = await sql<{ status: string }[]>`select status from public.skill where id = ${listing.id}`;
      return row.status;
    }).toBe("published");

    const [published] = await sql<{ status: string; current_version_id: string }[]>`
      select status, current_version_id from public.skill where id = ${listing.id}`;
    expect(published.status).toBe("published");
    expect(published.current_version_id).toBeTruthy();
    const [approved] = await sql<{ status: string }[]>`
      select status from public.skill_submission where skill_id = ${listing.id}`;
    expect(approved.status).toBe("approved");
    await anonymousPage.goto(`/skills/${listing.slug}`);
    await expect(anonymousPage.getByRole("heading", { name: title, exact: true, level: 1 })).toBeVisible();

    const download = await reviewer.request.post(`/api/skills/${listing.slug}/download`, {
      form: { file: "recipe.md" }, headers: { origin: baseURL },
    });
    expect(download.status()).toBe(200);
    expect(download.headers()["content-type"]).toContain("text/markdown");
    expect((await download.text())).toContain(recipeId);
    const reportDownload = await reviewer.request.post(`/api/skills/${listing.slug}/download`, {
      form: { file: "validation-report.md" }, headers: { origin: baseURL },
    });
    expect(reportDownload.status()).toBe(200);
    expect(await reportDownload.text()).toContain("Validation report");
    const [record] = await sql<{ count: string }[]>`
      select count(*)::text as count from public.skill_download where skill_id = ${listing.id}`;
    expect(record.count).toBe("1");

  } finally {
    await sql`
      delete from public.review_event
      where skill_id in (select id from public.skill where metadata->>'recipeId' = ${recipeId})
         or actor_id in (select id from public."user" where email in (${creatorEmail}, ${reviewerEmail}))`;
    await sql`delete from public.skill where metadata->>'recipeId' = ${recipeId}`;
    await sql`delete from public."user" where email in (${creatorEmail}, ${reviewerEmail})`;
    await creator.close();
    await reviewer.close();
    await anonymous.close();
    await sql.end();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("review history has cleanup indexes and keeps only the most recent 12 months", async () => {
  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
    const indexes = await sql<{ indexname: string }[]>`
      select indexname from pg_indexes
      where schemaname = 'public' and tablename = 'review_event'`;
    expect(indexes.map((row) => row.indexname)).toEqual(expect.arrayContaining([
      "review_event_created_at_idx",
      "review_event_action_created_at_idx",
    ]));

    const oldId = randomUUID();
    const recentId = randomUUID();
    const rollback = new Error("roll back retention test rows");
    await expect(sql.begin(async (tx) => {
      await tx`insert into public.review_event (id, action, note, created_at)
        values (${oldId}, 'e2e_retention', 'old', now() - interval '13 months'),
               (${recentId}, 'e2e_retention', 'recent', now())`;
      await tx`delete from public.review_event
        where created_at < now() - interval '12 months'`;
      const rows = await tx<{ id: string }[]>`
        select id from public.review_event where id in (${oldId}, ${recentId})`;
      expect(rows.map((row) => row.id)).toEqual([recentId]);
      throw rollback;
    })).rejects.toBe(rollback);
  } finally {
    await sql.end();
  }
});
