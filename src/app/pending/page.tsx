import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMemberStatus, isApprovedMember } from "@/lib/member-status";
import MemberStatusNotice from "@/components/member-status-notice";

export const metadata = {
  title: "承認待ち | FMC",
};

export default async function PendingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (await isApprovedMember(session.user)) {
    redirect("/dashboard");
  }
  const status = await getMemberStatus(session.user.id);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <MemberStatusNotice status={status} />
      <p className="mt-8 text-sm">
        <Link href="/instructors" className="text-accent hover:underline">
          講師紹介を見る →
        </Link>
      </p>
    </div>
  );
}
