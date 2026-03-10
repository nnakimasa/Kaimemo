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

### 現在のフェーズ: Phase 3

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

**ステータス: 🚧 進行中**

### Claude実装
- [x] `packages/api/Dockerfile`（マルチステージビルド）
- [x] `.github/workflows/deploy-api.yml`（main push で EC2 自動デプロイ）
- [x] `packages/api/.env.production.example`（本番環境変数テンプレート）
- [x] `scripts/setup-ec2.sh`（EC2 初期セットアップスクリプト）

### ユーザー作業

#### ① RDS 作成（PostgreSQL）

- [ ] **AWS Console → RDS → データベースの作成**
  - エンジン: PostgreSQL
  - テンプレート: **無料利用枠**
  - DBインスタンス識別子: `kaimemo-db`
  - マスターユーザー名: `postgres`
  - マスターパスワード: 任意（メモしておく）
  - インスタンスクラス: `db.t3.micro`
  - ストレージ: 20GB（gp2）
  - パブリックアクセス: **なし**（EC2 からのみ接続）
  - VPC セキュリティグループ: 新規作成（後でEC2のSGからの5432許可を追加）

- [ ] **RDS エンドポイントをメモ**
  ```
  例: kaimemo-db.xxxxxxxxxxxx.ap-southeast-2.rds.amazonaws.com
  ```

#### ② EC2 作成

- [ ] **AWS Console → EC2 → インスタンスを起動**
  - AMI: Amazon Linux 2023
  - インスタンスタイプ: `t3.micro`（無料枠）
  - キーペア: 新規作成（`.pem` ファイルをダウンロードして保管）
  - セキュリティグループ: SSH(22), カスタムTCP(3000) を許可

- [ ] **EC2 のパブリック IP をメモ**

#### ③ セキュリティグループ設定

- [ ] **RDS のセキュリティグループ** に EC2 の SG からの **5432ポート**を許可するインバウンドルールを追加

#### ④ EC2 初期セットアップ

- [ ] **EC2 に SSH 接続**
  ```bash
  chmod 400 your-key.pem
  ssh -i your-key.pem ec2-user@[EC2-パブリックIP]
  ```

- [ ] **セットアップスクリプト実行**
  ```bash
  curl -o setup.sh https://raw.githubusercontent.com/[YOUR_USERNAME]/Kaimemo/main/scripts/setup-ec2.sh
  bash setup.sh
  ```

- [ ] **リポジトリクローン**
  ```bash
  git clone https://github.com/[YOUR_USERNAME]/Kaimemo.git /app/kaimemo
  ```

- [ ] **本番 .env を設定**
  ```bash
  cp /app/kaimemo/packages/api/.env.production.example /app/kaimemo/packages/api/.env
  vi /app/kaimemo/packages/api/.env
  # DATABASE_URL の [PASSWORD] と [RDS-ENDPOINT] を実際の値に変更
  ```

- [ ] **初回デプロイ（手動）**
  ```bash
  cd /app/kaimemo
  pnpm install --frozen-lockfile --ignore-scripts
  pnpm --filter @kaimemo/shared build
  pnpm --filter @kaimemo/api exec prisma generate
  pnpm --filter @kaimemo/api exec prisma migrate deploy
  pnpm --filter @kaimemo/api build
  cd packages/api
  pm2 start dist/index.js --name kaimemo-api
  pm2 save
  ```

#### ⑤ GitHub Secrets 設定（自動デプロイ用）

- [ ] **GitHub リポジトリ → Settings → Secrets → Actions** に追加:
  | Secret名 | 値 |
  |----------|-----|
  | `EC2_HOST` | EC2 のパブリック IP |
  | `EC2_USER` | `ec2-user` |
  | `EC2_SSH_KEY` | `.pem` ファイルの中身（`-----BEGIN RSA PRIVATE KEY-----` から） |

#### ⑥ 動作確認

- [ ] `http://[EC2-IP]:3000/health` で `{"status":"ok"}` が返る
- [ ] Web の API_URL を EC2 に向けてログイン・リスト操作が動作する
- [ ] `git push origin main` で自動デプロイが実行される（GitHub Actions）
- [ ] **「Phase 3 完了」を報告**

---

## Phase 4以降の予定

- Phase 4: グループ機能 + Web公開（S3 + CloudFront）
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
