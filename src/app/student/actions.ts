"use server";

import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { queueAdminStudentRequestNotice } from "@/lib/welcome-email";

/** ログイン済みの会員が、あとから学割を申請する。 */
export async function requestStudentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/student");

  const school = String(formData.get("school") ?? "").trim().slice(0, 100);
  if (!school) redirect("/student?error=school#apply");

  const updated = await db
    .update(users)
    .set({ student: "requested" })
    .where(and(eq(users.id, session.user.id), isNull(users.student)))
    .returning({ email: users.email, name: users.name });

  if (updated[0]) queueAdminStudentRequestNotice({ ...updated[0], school });
  redirect("/student?requested=1#apply");
}
