import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { isBypassEmail } from "../lib/movieEmail";
import { MeBlock } from "./MeBlock";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your profile — Chappie Works",
  description:
    "Your chappieworks account: email, role, linked wallet, products in flight, admin tools.",
  robots: { index: false, follow: false },
};

function isAdmin(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export default async function ProfilePage() {
  let me: {
    email: string;
    admin: boolean;
    superUser: boolean;
    linkedAddress: string | null;
  } | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      const email = user.email.toLowerCase();
      me = {
        email,
        admin: isAdmin(email),
        superUser: isBypassEmail(email),
        linkedAddress:
          typeof user.user_metadata?.wallet_address === "string"
            ? user.user_metadata.wallet_address.toLowerCase()
            : null,
      };
    }
  } catch {
    // Supabase not configured locally — fall through to redirect.
  }

  if (!me) {
    redirect("/signin?next=/profile");
  }

  return (
    <main>
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← chappieworks
          </Link>
          <div className="mt-8">
            <MeBlock
              email={me.email}
              admin={me.admin}
              superUser={me.superUser}
              linkedAddress={me.linkedAddress}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
