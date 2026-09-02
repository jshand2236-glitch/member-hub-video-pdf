import { requireActiveSubscriber } from "@/lib/require-subscriber";
import { db } from "@/db";
import { pdfDocuments } from "@/db/schema";
import { asc } from "drizzle-orm";

export const metadata = {
  title: "会員限定資料PDF | AAM Fukuoka",
};

export default async function PdfsPage() {
  await requireActiveSubscriber("/pdfs");

  const allPdfs = await db.select().from(pdfDocuments).orderBy(asc(pdfDocuments.sortOrder));

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <span className="eyebrow">Document</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">会員限定資料PDF</h1>

      {allPdfs.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          まだ資料が登録されていません。
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {allPdfs.map((doc) => (
            <div key={doc.id}>
              <h2 className="font-semibold">{doc.title}</h2>
              {doc.description && (
                <p className="mt-1 text-sm text-muted">
                  {doc.description}
                </p>
              )}
              <div className="mt-3 overflow-hidden rounded-[4px] border border-line">
                <iframe
                  src={doc.url}
                  title={doc.title}
                  className="h-[80vh] w-full"
                />
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm underline text-muted"
              >
                新しいタブで開く / ダウンロード
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
