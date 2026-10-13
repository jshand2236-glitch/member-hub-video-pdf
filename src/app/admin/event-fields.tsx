import type { EventRow } from "@/lib/events";

const labelClass = "block text-sm font-medium";
const inputClass =
  "mt-1 w-full rounded-[4px] border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

/** Input fields for a 医療者交流会, shared by the add form and the edit page. */
export default function EventFields({ event }: { event?: EventRow }) {
  return (
    <>
      <div>
        <label className={labelClass} htmlFor="eventDate">
          開催日
        </label>
        <input
          id="eventDate"
          name="eventDate"
          type="date"
          required
          defaultValue={event?.eventDate ?? ""}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="eventTitle">
          名称
        </label>
        <input
          id="eventTitle"
          name="title"
          maxLength={100}
          defaultValue={event?.title ?? "医療者交流会"}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="startTime">
          開始時刻（任意）
        </label>
        <input id="startTime" name="startTime" type="time" defaultValue={event?.startTime ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="endTime">
          終了時刻（任意）
        </label>
        <input id="endTime" name="endTime" type="time" defaultValue={event?.endTime ?? ""} className={inputClass} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="venue">
          会場（任意）
        </label>
        <input
          id="venue"
          name="venue"
          maxLength={200}
          placeholder="例: 福岡市博多区 〇〇会議室"
          defaultValue={event?.venue ?? ""}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="eventDescription">
          内容・テーマ（任意）
        </label>
        <textarea
          id="eventDescription"
          name="description"
          rows={3}
          maxLength={2000}
          placeholder="例: 腰部疾患の病態判断（講師: 安良田）／懇親会あり／参加費 3,000円"
          defaultValue={event?.description ?? ""}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="applyUrl">
          申し込みURL（任意）
        </label>
        <input
          id="applyUrl"
          name="applyUrl"
          type="url"
          maxLength={500}
          placeholder="例: https://forms.gle/..."
          defaultValue={event?.applyUrl ?? ""}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted">入れるとマイページに「参加を申し込む」ボタンが出ます。</p>
      </div>
    </>
  );
}
