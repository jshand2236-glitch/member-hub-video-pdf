# Member Hub — 会員限定動画・PDF閲覧サイト

会員登録・ログインしたユーザーだけが、限定公開動画（YouTube/Vimeo埋め込み）とPDF資料を閲覧できる会員制サイトです。Stripeによる月額サブスクリプション決済に対応し、**Vercelへのデプロイを前提に構成**しています。

## 使っている技術

- **Next.js 16**（App Router / TypeScript / Tailwind CSS）
- **Auth.js (NextAuth v5)** — メールアドレス＋パスワードでのログイン
- **Drizzle ORM + PostgreSQL** — Vercelのサーバーレス環境でも動く構成（[Neon](https://neon.tech/) 等の無料枠を想定）
- **Stripe** — Checkout（サブスク決済）・Webhook・カスタマーポータル

## できること

- 会員登録 / ログイン / ログアウト
- Stripeでの月額サブスクリプション決済（Checkout）
- 有効な会員（サブスク中）だけが `/videos`・`/pdfs` を閲覧できるアクセス制御
- YouTube / Vimeo の限定公開動画を埋め込んだ動画一覧・再生ページ
- PDF資料の一覧・埋め込みビューア
- 管理者だけがアクセスできる `/admin` で動画・PDFの追加/削除
- Stripeカスタマーポータルへのリンク（お支払い管理・解約）

---

## 1. ローカルで動かす

### 1-1. 依存パッケージをインストール

```bash
npm install
```

### 1-2. データベース（PostgreSQL）を用意する

本番と同じPostgreSQLをローカルでも使います。一番手軽なのは、本番でも使う予定の [Neon](https://neon.tech/) を先に作ってしまい、開発用のブランチをそのまま使う方法です（無料枠で十分足ります）。

1. [neon.tech](https://neon.tech/) にサインアップし、新しいプロジェクトを作成
2. ダッシュボードの "Connection string" を控える（`postgresql://user:password@ep-xxxx.aws.neon.tech/dbname?sslmode=require` のような形式）

> ローカルにDockerやPostgreSQLがある場合は、もちろんそちらを使っても構いません。

### 1-3. 環境変数を設定

```bash
cp .env.example .env
```

`.env` を開いて、少なくとも以下を埋めてください（各項目の詳細は後述）。

| 変数 | ローカル開発時の値 |
| --- | --- |
| `AUTH_SECRET` | `openssl rand -base64 32` で生成した値 |
| `DATABASE_URL` | 1-2で控えたPostgreSQLの接続文字列 |
| `STRIPE_SECRET_KEY` | Stripeのテストモードのキー（`sk_test_...`） |
| `STRIPE_PRICE_ID` | Stripeで作成したサブスク用PriceのID |
| `STRIPE_WEBHOOK_SECRET` | 後述の Stripe CLI で取得 |
| `ADMIN_EMAILS` | 自分のメールアドレス |

`APP_URL` はローカルでは未設定のままでOKです（`http://localhost:3000` にフォールバックします）。

### 1-4. テーブルを作成 & サンプルデータ投入

```bash
npm run db:push
npm run db:seed
```

### 1-5. 開発サーバーを起動

```bash
npm run dev
```

`http://localhost:3000` にアクセスできます。

---

## 2. Vercelにデプロイする

### 2-1. GitHubにプッシュ

VercelはGitリポジトリからデプロイするので、まずこのプロジェクトをGitHubにあげます。

```bash
git init
git add .
git commit -m "Initial commit"
```

GitHubで空のリポジトリを作成し、指示に従って `git remote add origin ...` → `git push -u origin main` します。

### 2-2. 本番用データベースを用意

ローカルと同じNeonのプロジェクトをそのまま本番用に使って構いません（規模が大きくなってきたら、Neonの「ブランチ」機能で開発用・本番用を分けるのがおすすめです）。

Neonのダッシュボードには2種類の接続文字列があります。

- **Pooled connection**（ホスト名に `-pooler` が付く方）: サーバーレス環境向け。**こちらをVercelの `DATABASE_URL` に使ってください。**
- Direct connection: マイグレーション実行など一時的な接続向け

### 2-3. Vercelにインポート

1. [vercel.com](https://vercel.com/) にログインし、「Add New... → Project」からGitHubリポジトリを選択
2. Framework Presetは自動で `Next.js` が選ばれます。ビルド設定はそのままでOKです
3. 「Environment Variables」に以下を設定（**Production** と **Preview** の両方に設定するのが無難です）

   | 変数 | 値 |
   | --- | --- |
   | `AUTH_SECRET` | `openssl rand -base64 32` で新しく生成した値（ローカルと共用しない） |
   | `DATABASE_URL` | NeonのPooled connection文字列 |
   | `STRIPE_SECRET_KEY` | 本番は `sk_live_...`（まず動作確認するならテストモードの `sk_test_...` でもOK） |
   | `STRIPE_PRICE_ID` | Stripeのサブスク用Price ID |
   | `STRIPE_WEBHOOK_SECRET` | 2-5で発行するWebhookシークレット（`whsec_...`） |
   | `NEXT_PUBLIC_PRICE_LABEL` | 例: `月額 ¥1,980`（表示用） |
   | `ADMIN_EMAILS` | 管理画面を使う自分のメールアドレス |

   `APP_URL` は**設定不要**です。VercelのURL（`https://your-app.vercel.app` や独自ドメイン）が自動的に使われます。

4. 「Deploy」をクリック

### 2-4. 本番データベースにテーブルを作成

初回デプロイの前後どちらでも構いませんが、手元のターミナルから本番のDBにテーブルを作成します。

```bash
DATABASE_URL="Neonの接続文字列" npx drizzle-kit push
```

以降、`src/db/schema.ts` を変更した際は、デプロイの都度この `drizzle-kit push` を本番のDATABASE_URLに対して実行してください（規模が大きくなったらCIでのマイグレーション運用に切り替えることをおすすめします）。

### 2-5. Stripe Webhookを本番用に設定

1. デプロイが終わったら、まずVercelが割り当てたURL（例: `https://your-app.vercel.app`）を確認
2. [Stripeダッシュボード](https://dashboard.stripe.com/) → 開発者 → Webhook → 「エンドポイントを追加」
3. エンドポイントURLに `https://your-app.vercel.app/api/stripe/webhook` を入力
4. 購読するイベントを選択:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. 作成後に表示される署名シークレット（`whsec_...`）をコピーし、Vercelの環境変数 `STRIPE_WEBHOOK_SECRET` に設定 → 再デプロイ（環境変数の変更は再デプロイしないと反映されません）

### 2-6. 独自ドメインを使う場合

Vercelのプロジェクト設定 → Domains から独自ドメインを追加し、指示に従ってDNSレコード（AレコードまたはCNAME）を設定してください。ドメインが有効になったら、2-5のWebhookのURLもそのドメインに更新しておきましょう。

### 2-7. 動作確認

1. デプロイ先のURLで会員登録
2. 料金プランページでStripeテストカード `4242 4242 4242 4242`（任意の将来日付・任意のCVC）で決済（`STRIPE_SECRET_KEY` がテストモードの場合）
3. マイページで会員ステータスが「有効」になっていることを確認
4. `/videos`・`/pdfs` が閲覧できることを確認
5. 本番で実際に課金する前に、必ずStripeのキーを `sk_live_...` に切り替え、Webhookも本番用エンドポイントで再設定してください

---

## 3. Stripeの設定（共通）

1. [Stripeダッシュボード](https://dashboard.stripe.com/)で商品を作成し、月額のPriceを作成 → その **Price ID**（`price_...`）を `STRIPE_PRICE_ID` に設定
2. ローカル開発でWebhookを受け取るには [Stripe CLI](https://stripe.com/docs/stripe-cli) が簡単です。

   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   表示される `whsec_...` を `.env` の `STRIPE_WEBHOOK_SECRET` に設定してください。

## 4. 動画・PDF資料の追加方法

`ADMIN_EMAILS` に設定したメールアドレスで会員登録・ログインすると `/admin` にアクセスできます。

### 動画（YouTube）

1. YouTubeで動画を「限定公開」でアップロード
2. 動画URL（例: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`）の `v=` の後ろの文字列（`dQw4w9WgXcQ`）が動画IDです
3. `/admin` の「動画を追加」フォームで、配信元を「YouTube」にして動画IDを入力

### 動画（Vimeo）

1. Vimeoで動画を「限定公開」でアップロード
2. 埋め込みコード（共有 → 埋め込み）を確認すると、`https://player.vimeo.com/video/123456789?h=abcdef1234` のような形式のURLが表示されます。`123456789` が動画ID、`h=` の後ろがハッシュです
3. `/admin` で配信元を「Vimeo」にし、動画IDとハッシュをそれぞれ入力

### PDF資料

- 少数のPDFなら `public/pdfs/` にファイルを置き、`/admin` のURL欄に `/pdfs/ファイル名.pdf` と入力するのが簡単です。ただし **Vercelでは`public`フォルダの中身を変更するには再デプロイが必要**です（管理画面から追加したレコードのURLだけを差し替える形になり、ファイル自体のアップロードはリポジトリの更新＋再デプロイで行います）。
- 頻繁に差し替える場合や容量が大きい場合は、Google DriveやAmazon S3、Vercel Blobなどにアップロードし、その公開URLを指定する方法をおすすめします。

## ディレクトリ構成（抜粋）

```
src/
  app/
    page.tsx              # トップページ
    login/                # ログイン
    register/             # 会員登録
    pricing/               # 料金プラン・Stripe Checkout
    dashboard/             # マイページ（会員ステータス確認）
    videos/                # 動画一覧・再生（要サブスク）
    pdfs/                  # PDF一覧（要サブスク）
    admin/                 # コンテンツ管理（要管理者権限）
    api/
      auth/                # NextAuth・会員登録API
      stripe/              # Checkout・Webhook・ポータル
  auth.ts                  # NextAuth設定
  proxy.ts                 # ログイン状態チェック（旧middleware）
  db/                      # Drizzle ORM スキーマ・DB接続（PostgreSQL）
  lib/                     # サブスク判定・管理者判定などの共通処理
scripts/seed.ts            # サンプルデータ投入スクリプト
```

## よくある質問

**Q. なぜVercel + Neon（PostgreSQL）の構成にしているのですか？**
A. Vercelはサーバーレス環境のため、ファイルベースのSQLiteのようなDBはデータが保存されません。Neonなどのホスティング型PostgreSQLと組み合わせることで、Vercelの手軽さを活かしたまま安全にデータを永続化できます。

**Q. Vercel以外（VPS・Railway・Render・Fly.ioなど）にデプロイしたい**
A. そのまま動きます。`DATABASE_URL` にお使いの環境のPostgreSQL接続文字列を設定し、`APP_URL` にそのサービスの公開URLを明示的に設定してください（`VERCEL_URL` は自動では入りません）。

**Q. パスワードを忘れた場合のリセット機能はありますか？**
A. 現時点では未実装です。必要であればメール送信サービス（Resendなど）と組み合わせたパスワードリセット機能を追加できます。

**Q. 無料トライアルを設定したい**
A. Stripe側のPrice設定でトライアル期間を設定すれば、`status` が `trialing` の間もこのアプリでは会員としてアクセスできるようになっています。

**Q. Googleログインなど他のログイン方法を追加したい**
A. `src/auth.ts` の `providers` 配列に Auth.js の対応プロバイダー（Google、GitHubなど）を追加するだけで拡張できます。
