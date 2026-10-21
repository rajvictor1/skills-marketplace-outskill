import type { Metadata } from "next";
import { pageMetadata, absoluteUrl, CONTENT_UPDATED } from "@/lib/seo/site";
import { Breadcrumbs, PageSeo } from "@/components/seo/page-seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DOCS } from "@/lib/docs-content";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = Object.hasOwn(DOCS, slug) ? DOCS[slug] : undefined;
  return doc
    ? pageMetadata(`/docs/${slug}`, `${doc.title}: AI Skill Guide`, doc.intro)
    : pageMetadata(
        `/docs/${slug}`,
        "Documentation not found",
        "The requested Skillbuffet documentation page is unavailable.",
        false,
      );
}
export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = Object.hasOwn(DOCS, slug) ? DOCS[slug] : undefined;
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
        <PageSeo
          path={`/docs/${slug}`}
          title={doc.title}
          description={doc.intro}
          crumbs={[
            { name: "Documentation", path: "/docs" },
            { name: doc.title, path: `/docs/${slug}` },
          ]}
          entities={[
            {
              "@type": "TechArticle",
              "@id": absoluteUrl(`/docs/${slug}#article`),
              headline: doc.title,
              description: doc.intro,
              datePublished: CONTENT_UPDATED,
              dateModified: CONTENT_UPDATED,
              author: { "@id": absoluteUrl("/#organization") },
              publisher: { "@id": absoluteUrl("/#organization") },
              image: absoluteUrl(
                `/og?path=${encodeURIComponent(`/docs/${slug}`)}`,
              ),
              mainEntityOfPage: absoluteUrl(`/docs/${slug}`),
            },
          ]}
        />
        <Breadcrumbs
          items={[
            { name: "Documentation", path: "/docs" },
            { name: doc.title, path: `/docs/${slug}` },
          ]}
        />
        <h1 className="text-4xl font-semibold tracking-tight">{doc.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          {doc.intro}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Maintained by Skillbuffet · Updated{" "}
          <time dateTime={CONTENT_UPDATED}>21 October 2026</time>
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
