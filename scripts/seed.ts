/**
 * Seeds a couple of sample videos and PDFs so you can see the member pages
 * working right away. Safe to run multiple times against a fresh database;
 * re-running against a database that already has content will just add
 * duplicates, so feel free to edit rows via /admin instead once you're set
 * up.
 *
 * Usage: npm run db:seed
 */
import { db } from "../src/db";
import { videos, pdfDocuments } from "../src/db/schema";

async function main() {
  await db.insert(videos).values([
    {
      title: "サンプル動画1（YouTube限定公開）",
      description: "YouTubeの限定公開動画を埋め込むサンプルです。実際の動画IDに差し替えてください。",
      instructorName: "サンプル講師",
      provider: "youtube",
      providerVideoId: "dQw4w9WgXcQ",
      sortOrder: 0,
    },
  ]);

  await db.insert(pdfDocuments).values([
    {
      title: "サンプル資料PDF",
      description: "public/pdfs にPDFを置いて、そのパスを指定するとここに表示されます。",
      url: "/pdfs/sample.pdf",
      sortOrder: 0,
    },
  ]);

  console.log("Seed data inserted. Visit /videos and /pdfs after logging in with an active subscription.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
