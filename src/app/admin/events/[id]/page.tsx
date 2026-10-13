import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/db";
import { events } from "@/db/schema";
import SubmitButton from "@/components/submit-button";
import { updateEventAction } from "../../actions";
import EventFields from "../../event-fields";

export const metadata = {
  title: "交流会の編集 | FMC",
};

export default async function EditEventPage(props: PageProps<"/admin/events/[id]">) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (!isAdminEmail(session.user.email)) redirect("/dashboard");

  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <nav aria-label="パンくず" className="text-sm text-muted">
        <Link href="/admin#events" className="hover:underline">
          管理画面
        </Link>
        <span className="mx-2">/</span>
        交流会の編集
      </nav>
      <h1 className="mt-4 font-serif text-2xl font-semibold">交流会の編集</h1>

      {searchParams?.saved === "1" && (
        <p role="status" className="mt-6 rounded-[4px] border border-accent/40 bg-soft px-4 py-3 text-sm">
          保存しました。
        </p>
      )}
      {searchParams?.error === "1" && (
        <p role="alert" className="mt-6 rounded-[4px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          開催日と申し込みURL（https:// から始まるもの）を確認してください。
        </p>
      )}

      <form action={updateEventAction} className="mt-8 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={event.id} />
        <EventFields event={event} />
        <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
          <SubmitButton
            pendingLabel="保存中…"
            className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            保存する
          </SubmitButton>
          <Link href="/dashboard" className="text-sm text-accent hover:underline">
            マイページで確認 →
          </Link>
        </div>
      </form>
    </div>
  );
}
