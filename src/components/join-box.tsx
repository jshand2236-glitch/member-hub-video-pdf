import Link from "next/link";
import Jp from "@/components/jp";

export default function JoinBox() {
  return (
    <div className="mt-14 rounded-[4px] border border-line bg-soft p-6 text-center sm:p-8">
      <p className="font-serif text-lg font-semibold">続きは会員限定で。</p>
      <p className="mt-2 text-sm text-muted">
        <Jp>会員になると、すべての動画講義と資料PDFをご覧いただけます。</Jp>
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/register" className="btn btn-primary">
          会員登録する
        </Link>
        <Link href="/student" className="btn btn-outline">
          学生の方へ
        </Link>
      </div>
    </div>
  );
}
