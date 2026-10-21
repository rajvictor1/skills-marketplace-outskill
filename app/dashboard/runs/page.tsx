import Link from "next/link";
export default function RunsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="editorial-kicker text-primary">Agents & runs</p>
      <h1 className="mt-4 text-4xl font-semibold">
        Execution tracking is coming later.
      </h1>
      <p className="mt-5 text-muted-foreground">
        Skillbuffet distributes reviewed skill instructions. It does not execute
        skills or measure agent task outcomes yet. There are no recorded runs to
        show.
      </p>
      <Link
        href="/dashboard/skills"
        className="mt-7 inline-block font-semibold text-primary underline"
      >
        Manage your submissions
      </Link>
    </main>
  );
}
