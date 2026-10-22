import { Breadcrumbs, PageSeo } from "@/components/seo/page-seo";
import { PUBLIC_PAGES } from "@/lib/seo/site";
import { staticMetadata } from "@/lib/seo/site";
import Link from "next/link";

import { DOCS } from "@/lib/docs-content";
export const metadata = staticMetadata("/docs", true);
export default function DocsPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-16">
      <PageSeo
        path="/docs"
        {...PUBLIC_PAGES["/docs"]}
        crumbs={[{ name: "Documentation", path: "/docs" }]}
      />
      <div className="col-span-full mx-auto w-full max-w-7xl px-5 pt-6">
        <Breadcrumbs items={[{ name: "Documentation", path: "/docs" }]} />
      </div>
      <p className="editorial-kicker text-primary">Skillbuffet docs</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">
        Build with a little more clarity.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
        Practical guides for creators, recipe users and developers. Start with
        the workflow you need.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {Object.entries(DOCS).map(([slug, doc]) => (
          <Link
            key={slug}
            href={`/docs/${slug}`}
            className="rounded-3xl border border-border bg-card p-7 transition-colors hover:bg-primary/10"
          >
            <h2 className="text-2xl font-semibold">{doc.title} ↗</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {doc.intro}
            </p>
          </Link>
        ))}
      </div>
      <section className="mt-10 rounded-2xl bg-category-teal p-7">
        <h2 className="text-xl font-semibold">Source and support</h2>
        <p className="mt-3 text-sm">
          Report non-sensitive issues or contribute through the project
          repository. Do not include passwords, customer information or private
          files.
        </p>
        <a
          href="https://github.com/rajvictor1/skills-marketplace-outskill/issues"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm font-semibold text-primary underline"
        >
          Open repository issues ↗
        </a>
      </section>
    </main>
  );
}
