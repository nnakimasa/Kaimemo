#!/bin/bash
# EC2 (Amazon Linux 2023) 初期セットアップスクリプト
# EC2 にSSH接続後、このスクリプトを実行してください
# 実行: bash setup-ec2.sh

set -e

echo "=== Kaimemo EC2 セットアップ開始 ==="

# --- Node.js 20 インストール ---
echo "[1/5] Node.js 20 インストール..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# --- pnpm インストール ---
echo "[2/5] pnpm インストール..."
sudo npm install -g pnpm@9

# --- PM2 インストール ---
echo "[3/5] PM2 インストール..."
sudo npm install -g pm2
pm2 startup systemd -u ec2-user --hp /home/ec2-user | sudo bash -

# --- アプリディレクトリ作成 ---
echo "[4/5] ディレクトリ作成..."
sudo mkdir -p /app
sudo chown ec2-user:ec2-user /app

# --- Git リポジトリクローン ---
echo "[5/5] リポジトリクローン..."
# ※ 以下の URL をご自身のリポジトリに変更してください
# git clone https://github.com/YOUR_USERNAME/Kaimemo.git /app/kaimemo

echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "次の手順:"
echo "1. git clone https://github.com/YOUR_USERNAME/Kaimemo.git /app/kaimemo"
echo "2. cp /app/kaimemo/packages/api/.env.production.example /app/kaimemo/packages/api/.env"
echo "3. vi /app/kaimemo/packages/api/.env  # 本番用の値を設定"
echo "4. GitHub Secrets に以下を設定:"
echo "   EC2_HOST  = $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "   EC2_USER  = ec2-user"
echo "   EC2_SSH_KEY = (秘密鍵の内容)"
