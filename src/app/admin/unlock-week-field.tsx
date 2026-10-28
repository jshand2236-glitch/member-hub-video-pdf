/** ステップ配信：入会何週目に解放するか（空欄なら最初から見られる）。 */
export default function UnlockWeekField({
  defaultValue,
  inputClass,
  labelClass,
  id = "unlockWeek",
}: {
  defaultValue?: number | null;
  inputClass: string;
  labelClass: string;
  id?: string;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        ステップ配信（入会何週目に解放・任意）
      </label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">第</span>
        <input
          id={id}
          name="unlockWeek"
          type="number"
          min={1}
          max={104}
          step={1}
          defaultValue={defaultValue ?? ""}
          placeholder="空欄"
          className={`${inputClass} w-28`}
        />
        <span className="text-sm text-muted">週</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        空欄なら最初から見られます。「2」なら入会から7日後、「3」なら14日後に解放（入会日＝会員承認日と有料プラン申し込み日の早い方）。
      </p>
    </div>
  );
}
