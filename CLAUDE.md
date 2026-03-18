# Kaimemo 開発ガイド

## プロジェクト概要

買い物リスト共有アプリ（Web + Mobile）のモノレポプロジェクト。

詳細仕様: [kaimemo-app-plan-prompt.md](./kaimemo-app-plan-prompt.md)（全体アーキテクチャ・API設計・Phase計画・Prismaスキーマ等）

---

## ⚠️ 重要: 開発進行ルール

**Claudeは以下の条件を満たすまで次のPhaseの実装を開始してはいけない:**

1. 現在のPhaseの「Claude実装」が完了している
2. 現在のPhaseの「ユーザー作業」が完了している（ユーザーが明示的に報告）
3. 動作確認が完了している

**ユーザーから「Phase X 完了」の報告がない限り、次のPhaseに進まないこと。**

### Phase 5〜 追加ルール: モックアップ確認フロー

**Phase 5 以降、画面実装は必ず以下の順番で行うこと:**

1. `/mockup/*` ルートにサンプルUI（ダミーデータ）を作成
2. ユーザーがブラウザで確認・フィードバック
3. OKが出たら本実装へ移行、`CLAUDE.md` の「UI確定記録」を ✅ に更新
4. **全9画面のモックアップ確認完了後、画面間のつながりレビューを実施する**
5. 画面間レビュー完了・承認後に本実装を開始

**各画面のUI確定内容は Phase 5 の「UI確定記録」セクションに必ず記録すること。**

---

## 開発進捗状況

### 現在のフェーズ: Phase 6

---

## 開発環境メモ

### Playwright MCP設定（ブラウザデバッグ用）

```bash
# Chrome + 既存プロファイル（ログイン済み状態を引き継ぐ）
claude mcp add playwright -- cmd /c npx -y @playwright/mcp@latest --browser chrome --user-data-dir "C:\Users\Akimasa\AppData\Local\Google\Chrome\User Data"

# 確認
claude mcp list
```

> 注意: 使用時はChromeをすべて閉じてからClaudeに指示すること（プロファイル競合防止）

### ローカル開発サーバー起動
```bash
pnpm dev:web    # http://localhost:5173
pnpm dev:api    # http://localhost:3000
docker compose up -d  # PostgreSQL（必要な場合）
```

---

## Phase 1: ローカル開発環境構築 + 基本UI

**ステータス: ✅ 完了**

### Claude実装
- [x] pnpm + Turborepo モノレポ構成
- [x] packages/shared 型定義・バリデーター・ユーティリティ
- [x] packages/api Fastify + Prisma セットアップ
- [x] packages/web React + Vite + Tailwind セットアップ
- [x] packages/mobile Expo セットアップ
- [x] GitHub Actions CI設定
- [x] docker-compose.yml（PostgreSQL）

### ユーザー作業

#### 事前準備（初回のみ）

- [x] **Node.js 20 LTS インストール**
  ```
  確認: node --version → v20.x.x
  ```

- [x] **pnpm インストール**
  ```bash
  npm install -g pnpm
  ```

- [x] **Docker Desktop インストール・起動**

- [x] **Expo Go アプリ インストール**（iPhone/Android）

#### 開発環境セットアップ

- [x] **依存関係インストール**
  ```bash
  cd C:\Users\Akimasa\Desktop\cursor\Kaimemo
  pnpm install --ignore-scripts
  ```

- [x] **Prisma Client 生成**
  ```bash
  pnpm db:generate
  ```

- [x] **PostgreSQL 起動 + マイグレーション**
  ```bash
  docker compose up -d
  pnpm db:migrate   # プロンプトにマイグレーション名を入力（例: init）
  ```

#### 動作確認

- [x] API: `pnpm dev:api` → http://localhost:3000/health で `{"status":"ok"}`
- [x] Web: `pnpm dev:web` → http://localhost:5173 でリスト画面表示
- [x] Mobile: `pnpm dev:mobile` → Expo Go でQRコードスキャン
- [x] リスト・アイテムの作成・チェック・削除が動作する

---

## Phase 2: Cognito認証（Google/Apple OAuth）

**ステータス: ✅ 完了**

### Claude実装
- [x] Cognito JWT認証ミドルウェア（dev fallback付き）
- [x] Web OAuth PKCE フロー（LoginPage / CallbackPage）
- [x] Mobile expo-auth-session + SecureStore
- [x] ユーザー自動作成（初回ログイン時）

### ユーザー作業

#### AWS・Cognito設定

- [x] **IAM ユーザー作成**（アクセスキー取得）

- [x] **Cognito ユーザープール作成**
  - リージョン: ap-southeast-2
  - サインイン識別子: メールアドレス
  - 自己登録: 無効
  - 必須属性: name

- [x] **Google OAuth 設定**
  - Google Cloud Console でOAuthクライアント作成
  - リダイレクトURI: `https://ap-southeast-2rjxdy4uvb.auth.ap-southeast-2.amazoncognito.com/oauth2/idpresponse`
  - Cognitoにクライアント ID/シークレットを登録

- [x] **Cognito アプリクライアント設定**
  - 許可スコープ: openid, email, profile
  - 許可コールバックURL: `http://localhost:5173/callback`, `kaimemo://`, `exp://192.168.2.130:8081`
  - 許可サインアウトURL: `http://localhost:5173/login`

#### 環境変数設定

- [x] **`packages/api/.env`** に追加:
  ```
  COGNITO_USER_POOL_ID=ap-southeast-2_rJxDY4uvB
  COGNITO_CLIENT_ID=3srrj2lt2iu6lgaitmdci9p3b8
  COGNITO_REGION=ap-southeast-2
  COGNITO_DOMAIN=https://ap-southeast-2rjxdy4uvb.auth.ap-southeast-2.amazoncognito.com
  ```

- [x] **`packages/web/.env`** 作成:
  ```
  VITE_COGNITO_DOMAIN=ap-southeast-2rjxdy4uvb.auth.ap-southeast-2.amazoncognito.com
  VITE_COGNITO_CLIENT_ID=3srrj2lt2iu6lgaitmdci9p3b8
  ```

- [x] **`packages/mobile/app.json`** の extra を更新済み

#### 動作確認

- [x] Web: Google ログイン → ホーム画面遷移 → ログアウト
- [x] Mobile: Expo Go で Google ログイン → ホーム画面遷移

---

## Phase 3: RDS接続 + 基本API本番化

**ステータス: ✅ 完了**

### 作業中断時点のメモ（2026-03-11）

**完了済み情報:**
- RDS エンドポイント: `kaimemo-db.cteaqcuscv0b.ap-southeast-2.rds.amazonaws.com`
- RDS パスワード: `Kaimemo2024!`
- EC2 パブリックIP: `54.252.169.83`
- EC2 キーペア: `C:\Users\Akimasa\Desktop\.ssh\kaimemo-key.pem`
- GitHubリポジトリ: `https://github.com/nnakimasa/Kaimemo`（masterブランチ）
- EC2上のNode.js: v20.20.1（fnm経由）、pnpm・pm2インストール済み
- `http://54.252.169.83:3000/health` → `{"status":"ok"}` 確認済み

**次に再開する作業: ⑤ GitHub Secrets設定**

---

### 再開時の指示文

> Phase 3の作業を再開します。
> 現在の状況:
> - ①RDS、②EC2、③SG設定、④EC2初期セットアップ（API起動まで）が完了済み
> - `http://54.252.169.83:3000/health` で動作確認済み
> - 次は⑤GitHub Secrets設定から進めてください
> - GitHubユーザー名: `nnakimasa`、リポジトリ名: `Kaimemo`（masterブランチ）
> - EC2キーペア: `C:\Users\Akimasa\Desktop\.ssh\kaimemo-key.pem`
> - EC2 IP: `54.252.169.83`

---

### Claude実装
- [x] `packages/api/Dockerfile`（マルチステージビルド）
- [x] `.github/workflows/deploy-api.yml`（main push で EC2 自動デプロイ）
- [x] `packages/api/.env.production.example`（本番環境変数テンプレート）
- [x] `scripts/setup-ec2.sh`（EC2 初期セットアップスクリプト）

### ユーザー作業

#### ① RDS 作成（PostgreSQL）

- [x] **AWS Console → RDS → データベースの作成**
  - エンジン: PostgreSQL 17.6
  - テンプレート: 無料利用枠
  - DBインスタンス識別子: `kaimemo-db`
  - マスターユーザー名: `postgres`
  - マスターパスワード: `Kaimemo2024!`
  - インスタンスクラス: `db.t3.micro`
  - ストレージ: 20GB（gp2）
  - パブリックアクセス: なし
  - VPC セキュリティグループ: `kaimemo-rds-sg`（新規作成）

- [x] **RDS エンドポイント**: `kaimemo-db.cteaqcuscv0b.ap-southeast-2.rds.amazonaws.com`

#### ② EC2 作成

- [x] **AWS Console → EC2 → インスタンスを起動**
  - AMI: Amazon Linux 2023
  - インスタンスタイプ: `t3.micro`（無料枠、standardモード）
  - キーペア: `kaimemo-key`（`C:\Users\Akimasa\Desktop\.ssh\kaimemo-key.pem`）
  - セキュリティグループ: `kaimemo-ec2-sg`（SSH:22, TCP:3000）

- [x] **EC2 パブリックIP**: `54.252.169.83`

#### ③ セキュリティグループ設定

- [x] **RDS の `kaimemo-rds-sg`** に `kaimemo-ec2-sg` からの **5432ポート**を許可

#### ④ EC2 初期セットアップ

- [x] SSH接続確認
- [x] Node.js 20（fnm）・pnpm・pm2インストール
- [x] リポジトリクローン（`/app/kaimemo`）
- [x] `.env` 設定（DATABASE_URL等）
- [x] `pnpm install`, `shared build`, `prisma generate`, `prisma migrate deploy`, `api build`
- [x] `pm2 start kaimemo-api`、自動起動設定
- [x] `http://54.252.169.83:3000/health` → `{"status":"ok"}` 確認

#### ⑤ GitHub Secrets 設定（自動デプロイ用）

- [x] **GitHub リポジトリ → Settings → Secrets → Actions** に追加:
  | Secret名 | 値 |
  |----------|-----|
  | `EC2_HOST` | `54.252.169.83` |
  | `EC2_USER` | `ec2-user` |
  | `EC2_SSH_KEY` | `C:\Users\Akimasa\Desktop\.ssh\kaimemo-key.pem` の中身 |

#### ⑥ 動作確認

- [x] `http://54.252.169.83:3000/health` で `{"status":"ok"}` が返る
- [x] Web の API_URL を EC2 に向けてログイン・リスト操作が動作する
- [x] `git push origin master` で自動デプロイが実行される（GitHub Actions）
- [x] **「Phase 3 完了」を報告**

---

## Phase 4: グループ機能 + Web公開（S3 + CloudFront）

**ステータス: ✅ 完了**

### Claude実装
- [x] `packages/api/src/routes/groups.ts`（グループCRUD・招待・参加・メンバー管理）
- [x] `packages/api/src/routes/lists.ts` 更新（グループリスト取得対応）
- [x] `packages/api/src/app.ts` 更新（groupsRoutes登録）
- [x] `packages/web/src/services/api.ts` 更新（groupsApi追加・VITE_API_URL対応）
- [x] `packages/web/src/hooks/useGroups.ts`（グループ用Reactフック）
- [x] `packages/web/src/pages/GroupsPage.tsx`（グループ一覧・作成）
- [x] `packages/web/src/pages/GroupDetailPage.tsx`（メンバー管理・招待リンク）
- [x] `packages/web/src/pages/InvitePage.tsx`（招待リンクから参加）
- [x] `packages/web/src/App.tsx` 更新（グループルート追加）
- [x] `packages/web/src/components/Layout.tsx` 更新（ナビゲーション追加）
- [x] `.github/workflows/deploy-web.yml`（S3 + CloudFrontデプロイ）

### ユーザー作業

#### ① グループ機能の動作確認（ローカル）

- [x] `git push origin master` でEC2に自動デプロイ（API更新）
- [x] `pnpm dev:web` 起動 → グループ作成・招待・参加が動作することを確認

#### ② S3バケット作成

- [x] **AWS Console → S3 → バケットを作成**
  - バケット名: `kaimemo-web`
  - リージョン: `ap-southeast-2`

#### ③ CloudFrontディストリビューション作成

- [x] **AWS Console → CloudFront → ディストリビューションを作成**
  - ディストリビューションドメイン: `dj8tsqf6gqrp6.cloudfront.net`
  - ディストリビューションID: `E1YXWAT1AD0JEW`
  - OAC使用、SPAエラーレスポンス設定済み
  - EC2オリジン（kaimemo-ec2-api）追加済み
  - `/api/*` ビヘイビア + CloudFront Function（kaimemo-api-rewrite）設定済み

#### ④ Cognitoコールバック更新

- [x] **Cognito アプリクライアント → 許可コールバックURL** に追加:
  - `https://dj8tsqf6gqrp6.cloudfront.net/callback`
- [x] **許可サインアウトURL** に追加:
  - `https://dj8tsqf6gqrp6.cloudfront.net/login`

#### ⑤ EC2の CORS_ORIGIN 更新

- [x] `/app/kaimemo/packages/api/.env` の `CORS_ORIGIN` を更新:
  ```
  CORS_ORIGIN=http://localhost:5173,https://dj8tsqf6gqrp6.cloudfront.net
  ```

#### ⑥ GitHub Secrets 追加（Webデプロイ用）

- [x] **GitHub → Settings → Secrets → Actions** に追加:
  | Secret名 | 値 |
  |----------|-----|
  | `AWS_ACCESS_KEY_ID` | IAMアクセスキー |
  | `AWS_SECRET_ACCESS_KEY` | IAMシークレットキー |
  | `S3_BUCKET` | `kaimemo-web`（バケット名） |
  | `CLOUDFRONT_DISTRIBUTION_ID` | CloudFrontのID |
  | `VITE_COGNITO_DOMAIN` | `ap-southeast-2rjxdy4uvb.auth.ap-southeast-2.amazoncognito.com` |
  | `VITE_COGNITO_CLIENT_ID` | `3srrj2lt2iu6lgaitmdci9p3b8` |
  | `VITE_API_URL` | `/api` |

#### ⑦ 動作確認

- [x] `git push origin master` でWebデプロイが実行される（GitHub Actions）
- [x] `https://dj8tsqf6gqrp6.cloudfront.net` でWebアプリが表示される
- [x] CloudFrontドメインでログイン・グループ機能が動作する
- [x] **「Phase 4 完了」を報告**

---

## Phase 5: 通知・LINE連携 + 定期リマインダー

**ステータス: ✅ 完了**

---

### ⚠️ 開発進行ルール（Phase 5〜 適用）

**Phase 5 以降は「モックアップ確認 → UI確定 → 実装」の順で進める。**

1. Claudeが `/mockup/*` ルートにサンプルUIを作成
2. ユーザーがブラウザで確認・フィードバック
3. UIが確定したら本実装に移行
4. 各画面の確定内容はこのファイルの「UI確定記録」セクションに追記する
5. **全9画面が確定するまで Phase 5 の本実装に着手しない**

モックアップ確認URL（`pnpm dev:web` 起動後）:
- **ハブ（全体フロー）: http://localhost:5173/mockup** ← ⑩レビューはここから
- ① ホーム: http://localhost:5173/mockup/home
- ② リスト詳細: http://localhost:5173/mockup/list
- ③ ヘッダー通知: http://localhost:5173/mockup/header
- ⑥ 閲覧専用: http://localhost:5173/mockup/readonly
- ⑦ 定期リスト: http://localhost:5173/mockup/recurring
- ⑧ 設定: http://localhost:5173/mockup/settings
- ⑨ Mobileタブ: http://localhost:5173/mockup/mobile-tab

---

### UI確定記録

各モックアップを確認・承認したらここに記録する。

#### ① ホーム（リスト一覧）
**ステータス: ✅ 確定**
- モックアップ: `packages/web/src/pages/mockups/HomePageMockup.tsx`
- 確認URL: http://localhost:5173/mockup/home
- **確定内容:**
  - [x] 検索バー（リスト名・グループ名で絞り込み、クリアボタン付き）
  - [x] グループバッジ（青いピル形式、グループ所属リストに表示）
  - [x] 進捗バー（完了数/全体数 + 細いプログレスバー）
  - [x] 2列グリッド表示（PC: 2列 / スマホ: 1列）
  - [x] description フィールド廃止
  - [x] ⠿ ドラッグハンドルで並び順変更
  - [x] ⋮ メニュー（名前変更・複製・リマインダー設定・削除）
  - [x] リマインダー日時をカードに表示（🔔 日付 時刻、オレンジ色）
  - [x] 履歴セクション（完了から12H以上経過したリストを下部に折りたたみ表示）
  - [x] 履歴も編集可能（名前変更・複製・削除）、履歴からの複製はアクティブリスト末尾に追加

#### ② リスト詳細（アイテムカード刷新）
**ステータス: ✅ 確定**
- モックアップ: `packages/web/src/pages/mockups/ListPageMockup.tsx`
- 確認URL: http://localhost:5173/mockup/list
- **確定内容:**
  - [x] 左端カラーバー（`w-1`、カテゴリ色、Phase 6対応済み構造）
  - [x] カラーグループ順で並び替え、同グループ内のみドラッグ移動（PC）/ 長押し→▲▼（スマホ）
  - [x] チェック済みアイテム: 縮小表示（`py-1`）+ グレーハッチング + 取り消し線
  - [x] 写真サムネイル（1枚目表示・複数枚バッジ）→ タップで全画面ビューワー（スワイプ対応）
  - [x] 編集モーダル: 名前・数量・単位・メモ・写真（複数可・クリック/ドロップ/ペースト追加）
  - [x] 数量バッジ（右寄せ）
  - [x] ゴミ箱ボタン（常時表示）
  - [x] 共有シート（テキストコピー・LINE・閲覧専用リンク）

#### ③ ヘッダー（通知ドロップダウン）
**ステータス: ✅ 確定**
- モックアップ: `packages/web/src/pages/mockups/HeaderMockup.tsx`
- 確認URL: http://localhost:5173/mockup/header
- **確定内容:**
  - [x] 🔔バッジ（未読数表示）
  - [x] タップでドロップダウン展開
  - [x] 通知タイプ別アイコン（チェック/追加/招待/リマインダー）
  - [x] 未読: 青背景＋太字＋青ドット、既読: 通常テキスト
  - [x] 「全て既読にする」ボタン
  - [x] 通知タップ → 既読化＆閉じる、画面外タップで閉じる

#### ④ アイテム詳細・編集モーダル
**ステータス: ✅ 確定（② リスト詳細に内包）**
- **確定内容:**
  - [x] 名前・数量・単位・メモ
  - [x] 写真（複数可・クリック/ドロップ/Ctrl+V追加・個別削除・「表紙」バッジ）
  - [x] カテゴリ欄（Phase 6追加予定のプレースホルダー表示）

#### ⑤ 共有シート（ShareSheet）
**ステータス: ✅ 確定（② リスト詳細に内包）**
- **確定内容:**
  - [x] ボトムシート形式
  - [x] テキストコピー / LINEで送る / 閲覧専用リンクを生成

#### ⑥ 閲覧専用リストページ
**ステータス: ✅ 確定**
- モックアップ: `packages/web/src/pages/mockups/ReadOnlyListMockup.tsx`
- 確認URL: http://localhost:5173/mockup/readonly
- **確定内容:**
  - [x] ログイン不要ヘッダー（「閲覧専用」バッジ・「ログインして編集」ボタン）
  - [x] リスト名・グループ名・進捗バー表示
  - [x] チェック状態・写真は表示のみ（編集不可）
  - [x] 追加・削除・並び替え操作なし
  - [x] 最終更新時刻 + 「今すぐ更新」ボタン（30秒ポーリング、Phase 7でリアルタイム化予定）
  - [x] Kaimemo登録誘導バナー

#### ⑦ 定期リスト画面
**ステータス: ✅ 確定**
- モックアップ: `packages/web/src/pages/mockups/ReminderMockup.tsx`
- 確認URL: http://localhost:5173/mockup/recurring
- **確定内容:**
  - [x] 定期リスト一覧（2列グリッド、ホーム画面と同構造）
  - [x] 定期設定モーダル（⋮メニュー → 定期設定 で開く）
  - [x] 購入周期: 毎週 / 隔週 / 毎月（毎月は第1〜第5 + 曜日指定）
  - [x] リスト生成タイミング: 1〜30日前 または 1ヶ月前
  - [x] リマインダー時刻: ON/OFFトグル付き（OFFで当日通知なし）
  - [x] 設定内容プレビュー表示
  - [x] ⠿ ドラッグハンドルで並び順変更（PC: ドラッグ / スマホ: 長押し→▲▼）
  - [x] ⋮ メニュー（名前を変更・定期設定・削除）

#### ⑧ 設定ページ（シンプル版）
**ステータス: ✅ 確定**
- モックアップ: `packages/web/src/pages/mockups/SettingsMockup.tsx`
- 確認URL: http://localhost:5173/mockup/settings
- **確定内容:**
  - [x] プロフィール: 表示名変更・アバター変更（テキスト1〜8文字＋背景色8種 / 写真アップロード）・ログアウト
  - [x] 通知設定: 全体ON/OFFトグル + チェック/追加/招待/リマインダーの個別トグル
  - [x] Proプラン誘導エリア（機能比較・月額表示）
  - [x] その他: プライバシーポリシー・利用規約・お問い合わせ・バージョン表示

#### ⑨ Mobileボトムタブ構成
**ステータス: ✅ 確定**
- モックアップ: `packages/web/src/pages/mockups/MobileTabMockup.tsx`
- 確認URL: http://localhost:5173/mockup/mobile-tab
- **確定内容:**
  - [x] スマホフレーム内でタブ切り替えを確認
  - [x] 🛒リスト（検索バー・進捗バー・グループバッジ・⋮メニュー）
  - [x] 👥グループ（一覧・オーナー/メンバー表示）
  - [x] 🔔通知（未読バッジ・種別アイコン・タップで既読化）
  - [x] ⚙設定（プロフィール・通知ON/OFF・Pro誘導・ログアウト）
- **実機確認:** Expo Go でボトムタブの実装は完了済み（app/(tabs) 構造に移行済み）

---

### 確定済みUI設計方針

| 項目 | 決定内容 |
|------|---------|
| Mobileナビゲーション | ボトムタブ（リスト/グループ/通知/設定） |
| アイテム追加UI | シンプル維持（名前のみ追加 → カードタップで詳細編集） |
| ホームのリスト検索 | タブなし・検索バーを設置（グループ名でも絞り込み可） |
| 通知UI | ヘッダー🔔のドロップダウン |
| 設定画面 | Phase 5でシンプルPro版を作成 |
| 削除UX | スワイプ削除（Mobile）／ ⋮メニュー（Web） |

---

### Claude実装予定（⑩レビュー承認後に着手）

**Mobile（Expo Go）- 実装状況:**
- [x] Mobileボトムタブ移行（`app/(tabs)` 構造に移行済み）
- [x] アイテムカードUI刷新（スワイプ削除・⋮メニュー・数量バッジ・メモ表示・編集モーダル）
- [x] 共有シートUI（テキストコピー・LINE・閲覧専用リンクのボタン配置）
- [x] LINE共有（`Linking.openURL('https://line.me/R/msg/text/...')` 実装済み）
- [x] 閲覧専用リンク（`Share.share()` でURLを共有 実装済み）
- [ ] プッシュ通知基盤（Expo Notifications） ← 未着手

**Web 本実装 - 実装状況:**
- [x] ホーム画面の実装（検索バー・進捗バー・⋮メニュー・履歴セクション・DnD並び替え・グループ設定）
- [x] リスト詳細の実装（アイテムカード刷新・編集モーダル・テキストコピー・LINE共有・閲覧専用リンク生成）
- [x] ヘッダー通知ドロップダウン（🔔ベル・未読バッジ・通知リスト・既読管理）
- [x] 閲覧専用リンク（APIトークン生成・DB保存 + `/readonly/:token` ルート・Web閲覧ページ）
- [x] 設定ページ（プロフィール・通知ON/OFF・Pro誘導・`/settings` ルート）
- [x] 定期リスト（DB: RecurringList/RecurringItem・API CRUD・スケジュール計算・1時間毎自動生成・Web/Mobileページ）

### ⑩ 全画面つながりレビュー
**ステータス: ✅ 承認済み（2026-03-17）**

- ハブURL: http://localhost:5173/mockup
- ハブページ: `packages/web/src/pages/mockups/MockupHub.tsx`
- 各モックアップ間のリンクは接続済み（リストカードクリック → リスト詳細、閲覧専用リンク → 閲覧専用ページ等）

確認項目:
- [x] 全画面の遷移フローに抜け・矛盾がないか
- [x] 「戻る」導線がすべての画面に存在するか
- [x] モーダルとページ遷移の使い分けに一貫性があるか
- [x] ボトムタブ（Mobile）とヘッダーナビ（Web）で対応関係が揃っているか
- [x] エラー・空状態（データなし）の表示が考慮されているか
- [x] 操作の流れが自然で直感的か（ユーザー視点での最終確認）

---

### Phase 5 完了サマリー（2026-03-18 確定）

**全実装・動作確認 完了:**
- Web: ホーム・リスト詳細・ヘッダー通知・閲覧専用リンク・設定・定期リスト
- Mobile: ボトムタブ・アイテムカード刷新・スワイプ削除・編集モーダル・共有シート・定期リスト
- DBマイグレーション: `list_share_tokens` / `recurring_lists` / `recurring_items` テーブル適用済み

**修正済みバグ:**
- 履歴セクション（API側の `isArchived: false` フィルタを除去）
- 初回ロード401エラー（`enabled: isAuthenticated` をuseLists/useGroups/useRecurringListsに追加）
- ローカル開発時の404エラー（`packages/web/.env` の `VITE_API_TARGET` をlocalhostに修正）
- Mobile編集モーダルのキーボード重なり（KeyboardAvoidingView + center配置に変更）
- スワイプ削除の途中停止（`onPanResponderTerminationRequest: () => false` で解消）

**EC2本番への適用（未実施）:**
```bash
# EC2 SSH後:
cd /app/kaimemo && git pull origin master
pnpm --filter api exec prisma migrate deploy
pm2 restart kaimemo-api
```

**次フェーズ:** Phase 6（カテゴリ分類・検索フィルタ・AI音声入力強化）

---

### ユーザー作業
- [x] 全9画面のモックアップ確認・承認（①〜⑨ 完了）
- [x] ⑩ 全画面つながりレビュー 承認済み（2026-03-17）
- [x] API dev server 再起動・Prisma Client 再生成
- [x] 動作確認: ホーム（検索・並び替え・履歴）/ リスト詳細（編集・共有・閲覧専用リンク）/ 設定ページ
- [x] 動作確認（定期リスト）
- [x] **「Phase 5 完了」を報告（2026-03-18）**

---

## Phase 6以降の予定

- Phase 6: AI音声入力強化 + カテゴリ分類・動線ソート・カテゴリ色・検索フィルタ + 画像・バーコード
- Phase 7: AI買い忘れ提案 + オフライン同期
- Phase 8: 収益化実装

---

## コマンドリファレンス

```bash
# 依存関係インストール
pnpm install --ignore-scripts

# 全パッケージビルド
pnpm build

# 型チェック
pnpm type-check

# リント
pnpm lint

# 開発サーバー起動
pnpm dev:web    # Web (http://localhost:5173)
pnpm dev:api    # API (http://localhost:3000)
pnpm dev:mobile # Mobile (Expo)

# データベース
docker compose up -d    # PostgreSQL起動
pnpm db:generate        # Prisma Client生成
pnpm db:migrate         # マイグレーション実行
pnpm db:studio          # Prisma Studio起動
```

## ディレクトリ構成

```
kaimemo/
├── packages/
│   ├── shared/      # 共通型・バリデーター・ユーティリティ
│   ├── api/         # Fastify API サーバー
│   ├── web/         # React Webアプリ
│   └── mobile/      # Expo モバイルアプリ
├── .github/workflows/  # CI設定
├── docker-compose.yml  # PostgreSQL設定
└── turbo.json          # Turborepo設定
```

## Mobile UI 設計方針

- **モーダルはすべて画面中央表示**（`justifyContent: 'center'` + `paddingHorizontal: 16` + `borderRadius: 20`）
  - `animationType="fade"`、キーボード回避が必要な場合は `KeyboardAvoidingView` で包む
  - 共有シート（Share Sheet）のみ下付き（`justifyContent: 'flex-end'`）で例外
- **スワイプ削除**: `onMoveShouldSetPanResponderCapture` で水平スワイプを優先してFlatListスクロールに負けないようにする

## 既知の問題・注意事項

- `react-native-screens` のpostinstallがWindows環境で失敗する
  → `pnpm install --ignore-scripts` を使用すること
- Expo Go では `kaimemo://` カスタムスキームが使えないため、ローカルIPの `exp://` URLを Cognito コールバックに登録する必要がある（IPが変わったら再登録が必要）
- Mobileの本番ビルドには EAS CLI が必要

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| `docker compose up -d` が失敗 | Docker Desktop を再起動 |
| `pnpm install` でエラー | `pnpm install --ignore-scripts` を試す |
| マイグレーションエラー | `docker ps` でPostgreSQLが起動しているか確認 |
| API が起動しない | `packages/api/.env` が存在するか確認、ポート3000が空いているか確認 |
| Expo Goでログインできない | Cognitoコールバックに `exp://[IP]:8081` が登録されているか確認 |
