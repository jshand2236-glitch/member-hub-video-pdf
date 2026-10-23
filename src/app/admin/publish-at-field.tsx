import { toPublishInput } from "@/lib/publish-format";

/** 予約配信の日時入力（日本時間）。空欄ならすぐ公開。 */
export default function PublishAtField({
  defaultValue,
  inputClass,
  labelClass,
  id = "publishAt",
}: {
  defaultValue?: Date | null;
  inputClass: string;
  labelClass: string;
  id?: string;
}) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        公開日時（予約配信・任意）
      </label>
      <input
        id={id}
        name="publishAt"
        type="datetime-local"
        step={60}
        defaultValue={toPublishInput(defaultValue)}
        className={inputClass}
      />
      <p className="mt-1 text-xs text-muted">空欄ならすぐ公開。日時を入れると、その時刻まで会員には表示されません。</p>
    </div>
  );
}
