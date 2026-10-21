import { CircleHelp, Plus } from "lucide-react";
import Link from "next/link";
import { absoluteUrl, REPOSITORY } from "@/lib/seo/site";
import type { Faq } from "@/lib/seo/content";
export type Crumb = { name: string; path: string };
export function PageSeo({
  path,
  title,
  description,
  crumbs = [],
  faq = [],
  entities = [],
}: {
  path: string;
  title: string;
  description: string;
  crumbs?: Crumb[];
  faq?: Faq[];
  entities?: Record<string, unknown>[];
}) {
  const url = absoluteUrl(path);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: "Skillbuffet",
      url: absoluteUrl("/"),
      logo: absoluteUrl("/icon.svg"),
      sameAs: [REPOSITORY],
    },
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      name: "Skillbuffet",
      url: absoluteUrl("/"),
      publisher: { "@id": absoluteUrl("/#organization") },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: "en",
      isPartOf: { "@id": absoluteUrl("/#website") },
    },
    ...entities,
  ];
  if (crumbs.length)
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumbs`,
      itemListElement: [{ name: "Home", path: "/" }, ...crumbs].map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: absoluteUrl(c.path),
      })),
    });
  if (faq.length)
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  // Always escape HTML-significant characters, including untrusted creator strings.
  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  })
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
    >
      <Link href="/" className="text-primary hover:underline">
        Home
      </Link>
      {items.map((c, i) => (
        <span key={c.path} className="inline-flex items-center gap-2">
          <span aria-hidden="true">/</span>
          {i === items.length - 1 ? (
            <span aria-current="page">{c.name}</span>
          ) : (
            <Link href={c.path} className="text-primary hover:underline">
              {c.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
export function FaqSection({
  items,
  groupName,
}: {
  items: Faq[];
  groupName: string;
}) {
  return (
    <section
      className="mx-auto my-16 max-w-7xl px-5 sm:px-8"
      aria-labelledby="faq-heading"
    >
      <h2 id="faq-heading" className="text-2xl font-semibold tracking-tight">
        Frequently asked questions
      </h2>
      <div className="faq-list mt-8 divide-y divide-border border-y border-border">
        {items.map((f, index) => (
          <details
            key={f.question}
            className="faq-row group"
            name={`skillbuffet-faq-${groupName}`}
            open={index === 0}
          >
            <summary className="flex min-h-20 cursor-pointer list-none items-start gap-4 py-6 marker:hidden sm:items-center sm:gap-5">
              <CircleHelp
                className="mt-0.5 size-6 shrink-0 text-muted-foreground sm:mt-0"
                aria-hidden="true"
              />
              <h3 className="flex-1 text-base font-semibold leading-7 sm:text-xl">
                {f.question}
              </h3>
              <Plus
                className="mt-0.5 size-6 shrink-0 text-muted-foreground transition-transform group-open:rotate-45 motion-reduce:transition-none sm:mt-0"
                aria-hidden="true"
              />
            </summary>
            <div className="pb-7 pl-10 pr-10 sm:pl-11 sm:pr-12">
              <p className="max-w-5xl text-base leading-8 text-muted-foreground">
                {f.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
