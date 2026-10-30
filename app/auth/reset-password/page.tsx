import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { privateRobots } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: privateRobots,
  alternates: { canonical: null },
};

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-lg px-5 py-16 sm:py-24">
      <ResetPasswordForm />
    </main>
  );
}
