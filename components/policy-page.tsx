import Link from "next/link";
export function PolicyPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { title: string; body: string }[];
}) {
  const contact = process.env.PRIVACY_CONTACT_EMAIL;
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <p className="editorial-kicker text-primary">
        Skillbuffet / Beta policies
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Updated 21 October 2026
      </p>
      <p className="mt-6 text-lg leading-relaxed">{intro}</p>
      {sections.map((item) => (
        <section key={item.title} className="mt-8">
          <h2 className="text-xl font-semibold">{item.title}</h2>
          <p className="mt-3 leading-8 text-muted-foreground">{item.body}</p>
        </section>
      ))}
      <section className="mt-9 rounded-2xl bg-[#eee8ff] p-6">
        <h2 className="text-xl font-semibold">Contact the operator</h2>
        {contact ? (
          <a
            href={`mailto:${contact}`}
            className="mt-3 inline-block text-primary underline"
          >
            {contact}
          </a>
        ) : (
          <p className="mt-3 text-sm leading-relaxed">
            The operator&apos;s private policy contact is being configured
            before public launch. These beta policies require the
            operator&apos;s review, jurisdiction details and contact before they
            are final.
          </p>
        )}
        <Link
          href="/docs"
          className="mt-4 block text-sm text-primary underline"
        >
          Documentation and non-sensitive support
        </Link>
      </section>
    </main>
  );
}
