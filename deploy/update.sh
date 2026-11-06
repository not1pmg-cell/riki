#!/usr/bin/env bash
# RIKI — VPS'dagi botni yangilash (.env va riki_data.json SAQLANADI).
# Ishlatish: yangi riki papkasini serverga yuklang, keyin:  sudo bash riki/deploy/update.sh
set -euo pipefail
APP=/opt/riki
SRC="$(cd "$(dirname "$0")/.." && pwd)"
[ -d "$APP" ] || { echo "❌ $APP topilmadi. Avval: sudo bash deploy/install.sh"; exit 1; }
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$APP/backup"
[ -f "$APP/riki_data.json" ] && cp "$APP/riki_data.json" "$APP/backup/riki_data-$STAMP.json"
cp "$APP/bot.py" "$APP/backup/bot-$STAMP.py" 2>/dev/null || true
# faqat kod fayllari — .env va riki_data.json ga tegilmaydi
cp "$SRC/bot.py" "$SRC/requirements.txt" "$SRC/.env.example" "$APP/"
cp -r "$SRC/deploy" "$APP/"
"$APP/venv/bin/pip" install -q -r "$APP/requirements.txt"
chown -R riki:riki "$APP"
systemctl restart riki-bot
sleep 2
systemctl --no-pager --lines=0 status riki-bot | head -3
echo "✅ Yangilandi. Zaxira: $APP/backup/  ·  loglar: journalctl -u riki-bot -f"
