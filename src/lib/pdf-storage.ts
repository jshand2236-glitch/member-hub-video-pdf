import { promises as fs } from "node:fs";
import path from "node:path";
import { getStore } from "@netlify/blobs";

/**
 * Private storage for member-only PDFs.
 *
 * Files are NOT put in /public (or the Git repo, which is public on GitHub):
 * they live in a Netlify Blobs store and are only ever served through
 * /api/pdfs/[key], which checks that the viewer is a logged-in member.
 *
 * Uploads arrive in chunks (see PDF_CHUNK_SIZE) because a single request to a
 * Netlify Function is capped at ~6 MB. Each file is stored as
 *   <key>/part-0, <key>/part-1, ...  +  <key>/manifest (JSON)
 * and streamed back out part by part.
 *
 * Outside Netlify (local dev/tests) the same layout is written to .data/blobs.
 */

export const PDF_CHUNK_SIZE = 3 * 1024 * 1024; // 3 MB
export const PDF_MAX_PARTS = 30; // => max ~90 MB per file
export const PDF_KEY_PATTERN = /^[a-f0-9-]{36}$/; // crypto.randomUUID()

export type PdfManifest = {
  parts: number;
  size: number;
  filename: string;
  contentType: "application/pdf";
  uploadedAt: string;
};

type Backend = {
  set(key: string, data: ArrayBuffer | string): Promise<void>;
  getBuffer(key: string): Promise<ArrayBuffer | null>;
  getText(key: string): Promise<string | null>;
  has(key: string): Promise<boolean>;
  listPrefix(prefix: string): Promise<string[]>;
  delete(key: string): Promise<void>;
};

function netlifyBackend(): Backend {
  const store = getStore({ name: "member-pdfs", consistency: "strong" });
  return {
    async set(key, data) {
      await store.set(key, data);
    },
    async getBuffer(key) {
      return (await store.get(key, { type: "arrayBuffer" })) ?? null;
    },
    async getText(key) {
      return (await store.get(key, { type: "text" })) ?? null;
    },
    async has(key) {
      return (await store.getMetadata(key)) !== null;
    },
    async listPrefix(prefix) {
      const { blobs } = await store.list({ prefix });
      return blobs.map((b) => b.key);
    },
    async delete(key) {
      await store.delete(key);
    },
  };
}

function fsBackend(): Backend {
  const root = path.join(process.cwd(), ".data", "blobs");
  const file = (key: string) => path.join(root, key);
  return {
    async set(key, data) {
      await fs.mkdir(path.dirname(file(key)), { recursive: true });
      await fs.writeFile(file(key), typeof data === "string" ? data : Buffer.from(data));
    },
    async getBuffer(key) {
      try {
        const b = await fs.readFile(file(key));
        return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
      } catch {
        return null;
      }
    },
    async getText(key) {
      try {
        return await fs.readFile(file(key), "utf8");
      } catch {
        return null;
      }
    },
    async has(key) {
      try {
        await fs.access(file(key));
        return true;
      } catch {
        return false;
      }
    },
    async listPrefix(prefix) {
      const dir = path.join(root, prefix);
      try {
        return (await fs.readdir(dir)).map((name) => `${prefix}${name}`);
      } catch {
        return [];
      }
    },
    async delete(key) {
      await fs.rm(file(key), { force: true });
    },
  };
}

function backend(): Backend {
  // Netlify injects NETLIFY_BLOBS_CONTEXT into functions at runtime.
  return process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY ? netlifyBackend() : fsBackend();
}

const partKey = (key: string, index: number) => `${key}/part-${index}`;
const manifestKey = (key: string) => `${key}/manifest`;

export async function savePdfPart(key: string, index: number, data: ArrayBuffer) {
  await backend().set(partKey(key, index), data);
}

/** Checks every part is present, then writes the manifest that makes the file servable. */
export async function finalizePdf(
  key: string,
  info: { parts: number; size: number; filename: string },
): Promise<boolean> {
  const b = backend();
  for (let i = 0; i < info.parts; i++) {
    if (!(await b.has(partKey(key, i)))) return false;
  }
  const manifest: PdfManifest = {
    ...info,
    contentType: "application/pdf",
    uploadedAt: new Date().toISOString(),
  };
  await b.set(manifestKey(key), JSON.stringify(manifest));
  return true;
}

export async function getPdfManifest(key: string): Promise<PdfManifest | null> {
  const text = await backend().getText(manifestKey(key));
  return text ? (JSON.parse(text) as PdfManifest) : null;
}

/** Streams the parts back out in order, one at a time. */
export function streamPdf(key: string, manifest: PdfManifest): ReadableStream<Uint8Array> {
  const b = backend();
  let index = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (index >= manifest.parts) {
        controller.close();
        return;
      }
      const buf = await b.getBuffer(partKey(key, index++));
      if (!buf) {
        controller.error(new Error(`missing part ${index - 1} of ${key}`));
        return;
      }
      controller.enqueue(new Uint8Array(buf));
    },
  });
}

export async function deletePdf(key: string) {
  const b = backend();
  const keys = await b.listPrefix(`${key}/`);
  await Promise.all(keys.map((k) => b.delete(k)));
}

/** "/api/pdfs/<key>" -> "<key>" for files stored here; null for external URLs. */
export function storedPdfKeyFromUrl(url: string): string | null {
  const m = url.match(/^\/api\/pdfs\/([a-f0-9-]{36})$/);
  return m ? m[1] : null;
}
