import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DOCS } from "@/lib/docs-content";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const doc = DOCS[(await params).slug];
  return { title: doc?.title ?? "Documentation" };
}
export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const doc = DOCS[(await params).slug];
  if (!doc) notFound();
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-12">
      <nav
        aria-label="Documentation"
        className="mb-8 h-fit rounded-2xl bg-category-violet p-5"
      >
        <Link href="/docs" className="text-sm font-semibold">
          Documentation
        </Link>
        <div className="mt-4 grid gap-3">
          {Object.entries(DOCS).map(([slug, item]) => (
            <Link
              key={slug}
              href={`/docs/${slug}`}
              className="text-sm text-primary hover:underline"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </nav>
      <article className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight">{doc.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          {doc.intro}
        </p>
        {doc.sections.map((section) => (
          <section key={section.title} className="mt-9">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-muted-foreground">
              {section.body}
            </p>
          </section>
        ))}
      </article>
    </main>
  );
}
