/** 無料公開：チェックすると会員登録していない人も見られる。 */
export default function FreeField({ defaultChecked = false, labelClass }: { defaultChecked?: boolean; labelClass: string }) {
  return (
    <div className="sm:col-span-2">
      <span className={labelClass}>無料公開</span>
      <label className="mt-1 flex items-start gap-2.5 rounded-[4px] border border-line px-3 py-3 text-sm">
        <input type="checkbox" name="isFree" defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-accent" />
        <span>
          誰でも見られるようにする（会員登録なしで視聴可）
          <span className="mt-0.5 block text-xs text-muted">
            トップページと「無料動画」ページに表示されます。ステップ配信の設定は無視され、会員も最初から見られます。予約配信は有効です。
          </span>
        </span>
      </label>
    </div>
  );
}
