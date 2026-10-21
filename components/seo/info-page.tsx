import Link from "next/link";
import { Breadcrumbs, FaqSection, PageSeo } from "@/components/seo/page-seo";
import { CONTENT_UPDATED, PUBLIC_PAGES } from "@/lib/seo/site";
import { HOME_FAQ } from "@/lib/seo/content";
export function InfoPage({
  path,
  heading,
  intro,
  sections,
}: {
  path: string;
  heading: string;
  intro: string;
  sections: { title: string; body: string }[];
}) {
  const crumbs = [{ name: heading, path }];
  return (
    <main>
      <article className="mx-auto max-w-3xl px-5 py-14">
        <PageSeo
          path={path}
          {...PUBLIC_PAGES[path]}
          crumbs={crumbs}
          faq={path === "/how-it-works" ? HOME_FAQ : []}
        />
        <Breadcrumbs items={crumbs} />
        <p className="editorial-kicker text-primary">Skillbuffet / Guides</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          {heading}
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">{intro}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Maintained by Skillbuffet · Updated{" "}
          <time dateTime={CONTENT_UPDATED}>21 October 2026</time>
        </p>
        {sections.map((s) => (
          <section key={s.title} className="mt-9">
            <h2 className="text-2xl font-semibold">{s.title}</h2>
            <p className="mt-3 leading-8 text-muted-foreground">{s.body}</p>
          </section>
        ))}
        <nav
          aria-label="Related resources"
          className="mt-10 flex flex-wrap gap-5 text-primary underline"
        >
          <Link href="/skills">Browse AI agent skills</Link>
          <Link href="/docs/publishing">Skill publishing requirements</Link>
          <Link href="/security">Security review and limitations</Link>
        </nav>
      </article>
      {path === "/how-it-works" && <FaqSection items={HOME_FAQ} />}
    </main>
  );
}
