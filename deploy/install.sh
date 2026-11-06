#!/usr/bin/env bash
# RIKI — Ubuntu 22.04/24.04 VPS ga o'rnatish. Ishga tushirish:  sudo bash deploy/install.sh
set -euo pipefail
APP=/opt/riki
SRC="$(cd "$(dirname "$0")/.." && pwd)"
apt-get update -y
apt-get install -y python3 python3-venv python3-pip curl
id riki &>/dev/null || useradd --system --create-home --shell /usr/sbin/nologin riki
mkdir -p "$APP"
cp -r "$SRC"/. "$APP"/
[ -f "$APP/.env" ] || cp "$APP/.env.example" "$APP/.env"
python3 -m venv "$APP/venv"
"$APP/venv/bin/pip" install -q -r "$APP/requirements.txt"
if ! command -v cloudflared >/dev/null; then
  ARCH=$(dpkg --print-architecture)
  curl -fsSL -o /usr/local/bin/cloudflared "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}"
  chmod +x /usr/local/bin/cloudflared
fi
chown -R riki:riki "$APP"
cp "$APP/deploy/riki-bot.service" "$APP/deploy/riki-tunnel.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now riki-bot riki-tunnel
echo
echo "✅ O'rnatildi. Endi:  sudo nano $APP/.env   (BOT_TOKEN, WEBAPP_URL, ADMIN_IDS, DEPOSIT_ADDRESS, TONCENTER_KEY)"
echo "   so'ng:            sudo systemctl restart riki-bot"
echo "   loglar:           journalctl -u riki-bot -f"
