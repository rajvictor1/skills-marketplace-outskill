import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type BrowserContext } from "@playwright/test";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const databaseUrl = process.env.TEST_DATABASE_URL!;
const baseURL = "http://localhost:3100";

function recipeArchive(recipeId: string) {
  const directory = mkdtempSync(join(tmpdir(), "skillbuffet-e2e-recipe-"));
  mkdirSync(join(directory, "schemas"));
  writeFileSync(join(directory, "recipe.yaml"), [
    `id: ${recipeId}`,
    "version: 1.0.0",
    "description: A harmless recipe used to verify the marketplace publication flow.",
    "provides: [e2e.result.v1]",
    "requires: []",
    "dependencies: []",
    "preconditions: []",
    "side_effects: none",
    "permissions: []",
    "adapter: unimplemented:e2e.recipe",
    "input_schema: schemas/input.schema.json",
    "output_schema: schemas/output.schema.json",
    "",
  ].join("\n"));
  const schema = JSON.stringify({ type: "object", properties: {}, additionalProperties: false });
  writeFileSync(join(directory, "schemas/input.schema.json"), schema);
  writeFileSync(join(directory, "schemas/output.schema.json"), schema);
  const archive = join(directory, "recipe.zip");
  execFileSync("zip", ["-X", "-q", "-r", archive, "recipe.yaml", "schemas"], { cwd: directory });
  return { archive, directory };
}

async function signUp(context: BrowserContext, email: string, password: string) {
  const response = await context.request.post(`${baseURL}/api/auth/sign-up/email`, {
    data: { name: "Lifecycle Test User", email, password },
    headers: { origin: baseURL },
  });
  expect(response.status()).toBe(200);
  const page = await context.newPage();
  await page.goto("/dashboard/skills");
  await expect(page).toHaveURL(/\/dashboard\/skills/);
  return page;
}

test("creator upload requires admin approval before an authenticated package download", async ({ browser }) => {
  const sql = postgres(databaseUrl, { max: 2, prepare: false });
  const creator = await browser.newContext();
  const reviewer = await browser.newContext();
  const anonymous = await browser.newContext();
  const suffix = randomUUID().replaceAll("-", "");
  const recipeId = `e2e.lifecycle.${suffix}`;
  const title = `Lifecycle recipe ${suffix.slice(0, 8)}`;
  const password = `test-${randomUUID()}`;
  const { archive, directory } = recipeArchive(recipeId);
  try {
    await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
    const creatorPage = await signUp(creator, `creator-${suffix}@example.test`, password);
    await creatorPage.goto("/publish");
    await expect(creatorPage.getByRole("button", { name: /Switch to (light|dark) mode/ })).toBeEnabled();
    await creatorPage.locator('section[aria-labelledby="zip-publish-heading"] input[type="file"]').first().setInputFiles(archive);
    await expect(creatorPage.getByRole("button", { name: "Find recipes" })).toBeEnabled();
    await creatorPage.getByRole("button", { name: "Find recipes" }).click();
    await expect(creatorPage.getByText("File checks passed")).toBeVisible();
    await creatorPage.getByLabel("Display title").fill(title);
    await creatorPage.getByLabel("Reuse terms for this recipe").selectOption("Other");
    await creatorPage.getByRole("checkbox", { name: /permission to submit this recipe/ }).check();
    await creatorPage.getByRole("button", { name: "Submit this recipe" }).click();
    await expect(creatorPage.getByRole("status")).toContainText("submitted for admin review");

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

    const reviewerEmail = `reviewer-${suffix}@example.test`;
    const reviewerPage = await signUp(reviewer, reviewerEmail, password);
    const [adminUser] = await sql<{ id: string }[]>`
      select id from public."user" where email = ${reviewerEmail}`;
    await sql`insert into public.marketplace_admin (user_id) values (${adminUser.id})`;
    await reviewerPage.goto("/admin");
    const reviewCard = reviewerPage.locator("article").filter({ hasText: title });
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
      headers: { origin: baseURL },
    });
    expect(download.status()).toBe(200);
    expect(download.headers()["content-type"]).toContain("application/json");
    const payload = JSON.parse((await download.body()).toString());
    expect(payload.manifestPath).toBe("recipe.yaml");
    expect(payload.files.some((file: { path: string; content: string }) =>
      file.path === "recipe.yaml" && file.content.includes(recipeId))).toBe(true);
    const [record] = await sql<{ count: string }[]>`
      select count(*)::text as count from public.skill_download where skill_id = ${listing.id}`;
    expect(record.count).toBe("1");
  } finally {
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
