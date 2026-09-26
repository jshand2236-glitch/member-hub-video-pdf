import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireActiveSubscriber } from "@/lib/require-subscriber";
import { db } from "@/db";
import { pdfDocuments } from "@/db/schema";
import { BODY_PARTS, UNCATEGORIZED, findBodyPart } from "@/data/body-parts";
import FilterChip from "@/components/filter-chip";

export const metadata = {
  title: "会員限定資料PDF | AAM Fukuoka",
};

type Doc = typeof pdfDocuments.$inferSelect;
const NO_DISEASE = "その他の資料";

function groupByDisease(docs: Doc[]) {
  const map = new Map<string, Doc[]>();
  for (const d of docs) {
    const key = d.disease?.trim() || NO_DISEASE;
    map.set(key, [...(map.get(key) ?? []), d]);
  }
  // Named conditions alphabetically (Japanese collation), catch-all last.
  return [...map.entries()].sort(([a], [b]) =>
    a === NO_DISEASE ? 1 : b === NO_DISEASE ? -1 : a.localeCompare(b, "ja"),
  );
}

function listHref(part?: string, disease?: string) {
  const q = new URLSearchParams();
  if (part) q.set("part", part);
  if (disease) q.set("disease", disease);
  const s = q.toString();
  return s ? `/pdfs?${s}` : "/pdfs";
}

function DocRow({ doc }: { doc: Doc }) {
  return (
    <li className="flex items-start gap-4 border border-line bg-background p-4 transition hover:border-accent">
      <span
        aria-hidden="true"
        className="flex h-14 w-11 shrink-0 items-end justify-center rounded-[3px] bg-navy pb-1.5 font-sans text-[10px] font-semibold tracking-wider text-accent-light"
      >
        PDF
      </span>
      <div className="min-w-0 flex-1">
        <Link href={`/pdfs/${doc.id}`} className="font-medium leading-snug hover:text-accent">
          {doc.title}
        </Link>
        {doc.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{doc.description}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-4 font-sans text-xs tracking-wider">
          <Link href={`/pdfs/${doc.id}`} className="text-accent hover:underline">
            開いて読む →
          </Link>
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-muted hover:underline">
            新しいタブ / ダウンロード
          </a>
        </div>
      </div>
    </li>
  );
}

export default async function PdfsPage(props: PageProps<"/pdfs">) {
  await requireActiveSubscriber("/pdfs");
  const sp = await props.searchParams;
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const partParam = pick(sp?.part);
  const diseaseParam = pick(sp?.disease);

  const allDocs = await db.select().from(pdfDocuments).orderBy(asc(pdfDocuments.sortOrder));

  const parts = [
    ...BODY_PARTS.map((p) => ({ ...p, docs: allDocs.filter((d) => d.bodyPart === p.slug) })),
    { ...UNCATEGORIZED, docs: allDocs.filter((d) => !findBodyPart(d.bodyPart)) },
  ].filter((p) => p.docs.length > 0);

  const selectedPart = parts.find((p) => p.slug === partParam);
  const inScope = selectedPart ? selectedPart.docs : allDocs;
  const diseases = groupByDisease(inScope);
  const selectedDisease = diseases.find(([name]) => name === diseaseParam)?.[0];

  const visibleParts = (selectedPart ? [selectedPart] : parts)
    .map((p) => ({
      ...p,
      docs: selectedDisease ? p.docs.filter((d) => (d.disease?.trim() || NO_DISEASE) === selectedDisease) : p.docs,
    }))
    .filter((p) => p.docs.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <span className="eyebrow">Document</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">会員限定資料PDF</h1>
      <p className="mt-3 text-sm text-muted">部位と疾患から、読みたい資料を探せます。</p>

      {allDocs.length === 0 ? (
        <p className="mt-10 text-sm text-muted">まだ資料が登録されていません。</p>
      ) : (
        <>
          <div className="mt-8 space-y-4">
            <div>
              <p className="mb-2 font-sans text-[11px] tracking-[0.2em] text-muted">部位</p>
              <nav aria-label="部位で絞り込み" className="flex flex-wrap gap-2">
                <FilterChip href="/pdfs" active={!selectedPart} label="すべて" count={allDocs.length} />
                {parts.map((p) => (
                  <FilterChip
                    key={p.slug}
                    href={listHref(p.slug)}
                    active={selectedPart?.slug === p.slug}
                    label={p.label}
                    count={p.docs.length}
                  />
                ))}
              </nav>
            </div>
            <div>
              <p className="mb-2 font-sans text-[11px] tracking-[0.2em] text-muted">
                疾患{selectedPart ? `（${selectedPart.label}）` : ""}
              </p>
              <nav aria-label="疾患で絞り込み" className="flex flex-wrap gap-2">
                <FilterChip
                  href={listHref(selectedPart?.slug)}
                  active={!selectedDisease}
                  label="すべて"
                  count={inScope.length}
                />
                {diseases.map(([name, docs]) => (
                  <FilterChip
                    key={name}
                    href={listHref(selectedPart?.slug, name)}
                    active={selectedDisease === name}
                    label={name}
                    count={docs.length}
                  />
                ))}
              </nav>
            </div>
          </div>

          <div className="mt-12 space-y-14">
            {visibleParts.map((p) => (
              <section key={p.slug} aria-labelledby={`h-${p.slug}`}>
                <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
                  <div>
                    <span className="eyebrow">{p.en}</span>
                    <h2 id={`h-${p.slug}`} className="mt-1 font-serif text-xl font-semibold">
                      {p.label}
                      <span className="ml-2 font-sans text-sm font-normal text-muted">{p.docs.length}件</span>
                    </h2>
                  </div>
                  {!selectedPart && parts.length > 1 && (
                    <Link
                      href={listHref(p.slug)}
                      className="shrink-0 font-sans text-xs tracking-[0.12em] text-accent hover:underline"
                    >
                      この部位だけ見る →
                    </Link>
                  )}
                </div>

                <div className="mt-6 space-y-8">
                  {groupByDisease(p.docs).map(([name, docs]) => (
                    <div key={name}>
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <span className="h-3.5 w-[3px] bg-accent" aria-hidden="true" />
                        {name}
                        <span className="font-sans text-xs font-normal text-muted">{docs.length}件</span>
                      </h3>
                      <ul className="mt-3 grid gap-3 md:grid-cols-2">
                        {docs.map((d) => (
                          <DocRow key={d.id} doc={d} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
