import { formatEventDate, type EventRow } from "@/lib/events";

/**
 * "Which 医療者交流会 is this a seminar recording from?" select for the video
 * forms. Videos linked to an event are grouped under オフラインセミナー on /videos.
 */
export default function EventPicker({
  events,
  defaultValue,
  className,
}: {
  events: EventRow[];
  defaultValue?: string | null;
  className: string;
}) {
  return (
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium" htmlFor="eventId">
        医療者交流会のセミナー動画
      </label>
      <select id="eventId" name="eventId" defaultValue={defaultValue ?? ""} className={className}>
        <option value="">交流会の動画ではない（通常の講義動画）</option>
        {events.map((e) => (
          <option key={e.id} value={e.id}>
            {formatEventDate(e.eventDate)} {e.title}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-muted">
        交流会で収録した動画は、開催回を選ぶと動画ページの「オフラインセミナー」に開催回ごとにまとめて表示されます。
        {events.length === 0 && " 先に上の「医療者交流会の開催日」で開催回（過去の回も可）を登録してください。"}
      </p>
    </div>
  );
}
