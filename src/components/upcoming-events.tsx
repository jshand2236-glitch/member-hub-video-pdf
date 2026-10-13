import { daysUntil, formatEventDate, formatEventTime, type EventRow } from "@/lib/events";

/** Dashboard card: the next 医療者交流会 plus the ones after it. */
export default function UpcomingEvents({ events }: { events: EventRow[] }) {
  const [next, ...later] = events;

  return (
    <section aria-labelledby="events-heading" className="mt-8 overflow-hidden rounded-[4px] border border-line">
      <div className="bg-[linear-gradient(100deg,#091326_0%,#16264a_100%)] px-6 py-6 text-white">
        <span className="eyebrow eyebrow-light">Next meetup</span>
        <h2 id="events-heading" className="mt-1 font-serif text-lg font-semibold">
          次回の医療者交流会
        </h2>
        {next ? (
          <>
            <p className="mt-4 font-serif text-2xl font-semibold sm:text-3xl">
              {formatEventDate(next.eventDate)}
              <CountdownBadge days={daysUntil(next.eventDate)} />
            </p>
            <dl className="mt-3 space-y-1 text-sm text-white/85">
              {formatEventTime(next) && (
                <div className="flex gap-3">
                  <dt className="w-10 shrink-0 text-white/55">時間</dt>
                  <dd>{formatEventTime(next)}</dd>
                </div>
              )}
              {next.venue && (
                <div className="flex gap-3">
                  <dt className="w-10 shrink-0 text-white/55">会場</dt>
                  <dd>{next.venue}</dd>
                </div>
              )}
            </dl>
            {next.title !== "医療者交流会" && <p className="mt-3 text-sm font-medium">{next.title}</p>}
            {next.description && (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/80">{next.description}</p>
            )}
            {next.applyUrl && (
              <a
                href={next.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
              >
                参加を申し込む →
              </a>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-white/80">次回の日程は決まり次第、こちらでお知らせします。</p>
        )}
      </div>

      {later.length > 0 && (
        <div className="bg-background px-6 py-4">
          <p className="text-xs font-semibold tracking-wider text-muted">その後の予定</p>
          <ul className="mt-2 divide-y divide-line text-sm">
            {later.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-4 gap-y-1 py-2">
                <span className="font-medium">{formatEventDate(e.eventDate)}</span>
                <span className="text-muted">{[formatEventTime(e), e.venue].filter(Boolean).join(" / ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function CountdownBadge({ days }: { days: number }) {
  const label = days === 0 ? "本日開催" : days === 1 ? "明日" : `あと${days}日`;
  return (
    <span className="ml-3 inline-block rounded-full border border-accent-light/60 px-2.5 py-0.5 align-middle font-sans text-xs font-normal text-accent-light">
      {label}
    </span>
  );
}
