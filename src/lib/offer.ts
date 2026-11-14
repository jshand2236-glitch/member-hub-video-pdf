import { cookies } from "next/headers";
import { earlyJoinCode } from "@/lib/plans";

/** 限定URLを開いた人のブラウザに残す印（中身は限定コードそのもの。知らない人は作れない）。 */
export const OFFER_COOKIE = "fmc_offer";

/** このブラウザで当日入会の限定URLが開かれているか。 */
export async function hasEarlyOfferCookie(): Promise<boolean> {
  const code = earlyJoinCode();
  if (!code) return false;
  return (await cookies()).get(OFFER_COOKIE)?.value === code;
}
