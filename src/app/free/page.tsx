import { connection } from "next/server";
import { auth } from "@/auth";
import Jp from "@/components/jp";
import JoinBox from "@/components/join-box";
import FreeVideoCard from "@/components/free-video-card";
import { getFreeVideos } from "@/lib/free-videos";

export const metadata = {
  title: "無料で見られる動画 | FMC",
  description: "FUKUOKA MEDICAL CONNECT の動画講義から、会員登録なしで見られる動画を公開しています。",
};

export default async function FreePage() {
  await connection(); // 予約配信の時刻に合わせて毎回最新を出す
  const [list, session] = await Promise.all([getFreeVideos(), auth()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <span className="eyebrow">Free videos</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">無料で見られる動画</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        <Jp>会員登録なしでご覧いただけます。FMCの講義の雰囲気をお確かめください。</Jp>
      </p>

      {list.length === 0 ? (
        <p className="mt-10 text-sm text-muted">現在、無料公開中の動画はありません。</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => (
            <FreeVideoCard key={v.id} video={v} />
          ))}
        </div>
      )}

      {!session?.user && <JoinBox />}
    </div>
  );
}
