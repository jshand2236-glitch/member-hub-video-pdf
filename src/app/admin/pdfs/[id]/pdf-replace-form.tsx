"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { checkPdfFile, uploadPdfInChunks } from "@/lib/pdf-upload-client";

export default function PdfReplaceForm({ id }: { id: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "done" | "error"; message?: string }>({
    kind: "idle",
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = new FormData(e.currentTarget).get("file");
    const problem = checkPdfFile(file);
    if (problem) {
      setStatus({ kind: "error", message: problem });
      return;
    }
    try {
      const uploaded = await uploadPdfInChunks(file as File, (pct) =>
        setStatus({ kind: "busy", message: `アップロード中… ${pct}%` }),
      );
      setStatus({ kind: "busy", message: "差し替え中…" });
      const res = await fetch("/api/admin/pdf-upload/replace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...uploaded }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "差し替えに失敗しました");
      formRef.current?.reset();
      setStatus({ kind: "done", message: `「${uploaded.filename}」に差し替えました` });
      router.refresh();
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "差し替えに失敗しました" });
    }
  }

  const busy = status.kind === "busy";

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block text-sm font-medium" htmlFor="replace-file">
          新しいPDFファイル
        </label>
        <input
          id="replace-file"
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          required
          className="mt-1 w-full rounded-[4px] border border-line bg-transparent px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <p className="mt-1 text-xs text-muted">
          タイトル・部位・疾患名と資料ページのURLはそのままで、ファイルだけが入れ替わります。古いファイルは削除されます。
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-[4px] border border-accent px-5 py-2.5 text-sm font-medium text-accent hover:bg-accent hover:text-white disabled:opacity-50"
        >
          {busy ? "アップロード中…" : "ファイルを差し替える"}
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
