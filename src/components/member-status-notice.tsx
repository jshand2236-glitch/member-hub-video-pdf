export default function MemberStatusNotice({ status }: { status: string | null }) {
  if (status === "rejected" || status === "suspended") {
    return (
      <div className="rounded-[4px] border border-line p-6">
        <span className="eyebrow">Membership</span>
        <h1 className="mt-2 font-serif text-xl font-semibold">
          {status === "rejected" ? "会員登録が承認されませんでした" : "アカウントは利用停止中です"}
        </h1>
        <p className="mt-3 text-sm leading-loose text-muted">
          会員限定の動画・資料はご覧いただけません。お心当たりのない場合は、お手数ですが運営までお問い合わせください。
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-[4px] border border-accent/40 bg-soft p-6">
      <span className="eyebrow">Pending approval</span>
      <h1 className="mt-2 font-serif text-xl font-semibold">運営の承認をお待ちください</h1>
      <p className="mt-3 text-sm leading-loose text-muted">
        会員登録を受け付けました。FMCは医療従事者限定のコミュニティのため、運営がご登録内容を確認したうえで承認を行っています。
        承認が完了するとメールでお知らせし、会員限定の動画・資料PDFをご覧いただけるようになります。
      </p>
    </div>
  );
}
