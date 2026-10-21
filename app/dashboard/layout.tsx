import type { Metadata } from "next";
import { DashboardNav } from "@/components/dashboard-nav";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard" },
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dashboard-workspace mx-auto flex min-h-[calc(100vh-4rem)] max-w-[90rem] flex-col border-x border-border/50 md:flex-row">
      <DashboardNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
