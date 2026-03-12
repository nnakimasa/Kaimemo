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

---

## 開発進捗状況

### 現在のフェーズ: Phase 4

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

## Phase 5以降の予定

- Phase 5: 通知 + LINE連携
- Phase 6: 音声・画像・バーコード入力
- Phase 7: オフライン同期 + ジオフェンス
- Phase 8: 収益化（Stripe）

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
