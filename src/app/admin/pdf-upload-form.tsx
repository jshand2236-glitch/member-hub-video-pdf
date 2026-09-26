"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BODY_PARTS } from "@/data/body-parts";

// Must match PDF_CHUNK_SIZE / PDF_MAX_PARTS in src/lib/pdf-storage.ts
const CHUNK_SIZE = 3 * 1024 * 1024;
const MAX_PARTS = 30;

const labelClass = "block text-sm font-medium";
const inputClass =
  "mt-1 w-full rounded-[4px] border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

export default function PdfUploadForm({ diseases }: { diseases: string[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "done" | "error"; message?: string }>({
    kind: "idle",
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setStatus({ kind: "error", message: "PDFファイルを選択してください" });
      return;
    }
    if (file.type && file.type !== "application/pdf") {
      setStatus({ kind: "error", message: "PDFファイルのみアップロードできます" });
      return;
    }
    const parts = Math.ceil(file.size / CHUNK_SIZE);
    if (parts > MAX_PARTS) {
      setStatus({ kind: "error", message: `ファイルが大きすぎます（上限 約${(CHUNK_SIZE * MAX_PARTS) / 1024 / 1024}MB）` });
      return;
    }

    const key = crypto.randomUUID();
    try {
      for (let i = 0; i < parts; i++) {
        setStatus({ kind: "busy", message: `アップロード中… ${Math.round((i / parts) * 100)}%` });
        const res = await fetch(`/api/admin/pdf-upload?key=${key}&part=${i}`, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "アップロードに失敗しました");
      }

      setStatus({ kind: "busy", message: "仕上げ中…" });
      const res = await fetch("/api/admin/pdf-upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          parts,
          size: file.size,
          filename: file.name,
          title: String(data.get("title") ?? ""),
          description: String(data.get("description") ?? ""),
          bodyPart: String(data.get("bodyPart") ?? ""),
          disease: String(data.get("disease") ?? ""),
          sortOrder: Number.parseInt(String(data.get("sortOrder") ?? "0"), 10) || 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "登録に失敗しました");

      formRef.current?.reset();
      setStatus({ kind: "done", message: `「${String(data.get("title"))}」を追加しました` });
      router.refresh();
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "アップロードに失敗しました" });
    }
  }

  const busy = status.kind === "busy";

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={labelClass}>タイトル</label>
        <input name="title" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>部位</label>
        <select name="bodyPart" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            選択してください
          </option>
          {BODY_PARTS.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>疾患名</label>
        <input
          name="disease"
          required
          list="pdf-diseases"
          placeholder="例: 腰椎椎間板ヘルニア"
          className={inputClass}
        />
        <datalist id="pdf-diseases">
          {diseases.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
        <p className="mt-1 text-xs text-muted">同じ疾患の資料は同じ表記にすると、まとめて表示されます。</p>
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>説明（任意）</label>
        <textarea name="description" rows={2} className={inputClass} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>PDFファイル</label>
        <input name="file" type="file" accept="application/pdf,.pdf" required className={`${inputClass} py-1.5`} />
        <p className="mt-1 text-xs text-muted">
          会員だけが閲覧できる場所に保存されます（ログインしていない人はURLを知っていても開けません）。
        </p>
      </div>
      <div>
        <label className={labelClass}>並び順（小さい順）</label>
        <input name="sortOrder" type="number" defaultValue={0} className={inputClass} />
      </div>
      <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "アップロード中…" : "PDFをアップロード"}
        </button>
        {status.message && (
          <p
            role="status"
            className={`text-sm ${status.kind === "error" ? "text-red-600" : status.kind === "done" ? "text-accent" : "text-muted"}`}
          >
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}
