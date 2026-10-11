// Shown immediately on every page change while the server prepares the next
// page (all member pages are rendered per request, so without this the click
// would appear to do nothing until the whole page arrives).
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">読み込み中…</span>
      <div className="fmc-skeleton h-3 w-20 rounded" />
      <div className="fmc-skeleton mt-4 h-8 w-64 max-w-full rounded" />
      <div className="fmc-skeleton mt-4 h-3 w-80 max-w-full rounded" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-[4px] border border-line">
            <div className="fmc-skeleton aspect-video w-full" />
            <div className="space-y-2 p-4">
              <div className="fmc-skeleton h-4 w-4/5 rounded" />
              <div className="fmc-skeleton h-3 w-3/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
