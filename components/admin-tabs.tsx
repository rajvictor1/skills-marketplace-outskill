import Link from "next/link";

const items = [
  { label: "Submissions", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Private recipes", href: "/admin/recipes" },
  { label: "Reviews", href: "/admin#reviews" },
  { label: "Activity", href: "/admin#activity" },
] as const;

export function AdminTabs({ active }: { active: "submissions" | "users" | "recipes" }) {
  return (
    <nav aria-label="Admin sections" className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4">
      {items.map((item) => {
        const selected =
          (active === "submissions" && item.href === "/admin") ||
          (active === "users" && item.href === "/admin/users") ||
          (active === "recipes" && item.href === "/admin/recipes");
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={selected ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-primary/10 hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
