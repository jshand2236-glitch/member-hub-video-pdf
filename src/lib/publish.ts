import { isNull, lte, or, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/**
 * 予約配信（publishAt）の共通処理。日時は日本時間で入力・表示する。
 */

/** 会員向けの一覧・詳細で「公開済み」だけに絞る条件。 */
export function isPublishedSql(col: PgColumn): SQL {
  return or(isNull(col), lte(col, new Date()))!;
}

export * from "./publish-format";
