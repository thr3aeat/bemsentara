#!/usr/bin/env bash
# Oracle Cloud "Always Free" Ubuntu VM'ye Sentara (bot + site) kurulumu — tek komut.
#
# Ne yapar:
#   1) Swap (1 GB RAM'li makinede derleme/çalışma için), Node 20, git, Caddy (otomatik HTTPS) kurar
#   2) Oracle Ubuntu imajındaki iptables engelini 80/443 için açar
#   3) Repoyu /home/ubuntu/bemsentara'ya çeker, bağımlılıkları kurar
#   4) .env'i Render'daki servisin ortam değişkenlerinden üretir (RENDER_API_KEY verilirse)
#   5) DuckDNS kaydını bu makinenin IP'sine çevirir (DUCKDNS_TOKEN verilirse)
#   6) systemd servisi olarak başlatır (çökerse/yeniden başlarsa kendiliğinden açılır)
#
# Kullanım (makineye SSH ile bağlanıp):
#   curl -fsSL https://raw.githubusercontent.com/thr3aeat/bemsentara/main/deploy/oracle-free/setup.sh -o setup.sh
#   sudo RENDER_API_KEY=rnd_xxx DUCKDNS_TOKEN=xxxx bash setup.sh
#
# Tekrar çalıştırmak güvenlidir (günceller, mevcut .env'i yedekleyip yeniden üretir).
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/thr3aeat/bemsentara}"
BRANCH="${BRANCH:-main}"
APP_USER="${APP_USER:-ubuntu}"
APP_DIR="${APP_DIR:-/home/${APP_USER}/bemsentara}"
DOMAIN="${DOMAIN:-ekoyildiz.duckdns.org}"
APP_PORT="${APP_PORT:-3000}"
RENDER_SERVICE_ID="${RENDER_SERVICE_ID:-srv-db4h36l9fdbs73buncm0}"   # Render: bemsentara-render
NODE_NAME="${NODE_NAME:-oracle-free}"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "sudo ile çalıştır: sudo bash setup.sh"; exit 1; }
id "$APP_USER" >/dev/null 2>&1 || useradd -m -s /bin/bash "$APP_USER"
export DEBIAN_FRONTEND=noninteractive

log "Swap (2 GB)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

log "Paketler: git, curl, derleme araçları"
apt-get update -y
apt-get install -y git curl ca-certificates gnupg build-essential python3 debian-keyring debian-archive-keyring apt-transport-https

log "Node.js 20"
if ! command -v node >/dev/null || ! node -v | grep -q '^v20\.'; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v

log "Caddy (otomatik HTTPS sertifikası)"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi

log "Güvenlik duvarı: 80 ve 443 açılıyor (Oracle Ubuntu imajı varsayılan olarak engeller)"
for p in 80 443; do
  iptables -C INPUT -p tcp --dport "$p" -m state --state NEW -j ACCEPT 2>/dev/null \
    || iptables -I INPUT 5 -p tcp --dport "$p" -m state --state NEW -j ACCEPT
done
if command -v netfilter-persistent >/dev/null; then netfilter-persistent save || true; fi

log "Repo: $REPO_URL ($BRANCH) -> $APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  sudo -u "$APP_USER" git -C "$APP_DIR" fetch origin "$BRANCH"
  sudo -u "$APP_USER" git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  sudo -u "$APP_USER" git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"
sudo -u "$APP_USER" npm ci --omit=dev --no-audit --no-fund || sudo -u "$APP_USER" npm install --omit=dev --no-audit --no-fund

log ".env"
if [ -n "${RENDER_API_KEY:-}" ]; then
  [ -f .env ] && cp .env ".env.bak.$(date +%s)"
  curl -fsS -H "Authorization: Bearer ${RENDER_API_KEY}" -H "Accept: application/json" \
    "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/env-vars?limit=100" \
  | NODE_NAME="$NODE_NAME" APP_PORT="$APP_PORT" DOMAIN="$DOMAIN" DUCKDNS_TOKEN="${DUCKDNS_TOKEN:-}" python3 -c '
import sys, json, os
items = json.load(sys.stdin)
env = {}
for it in items:
    v = it.get("envVar", it)
    env[v["key"]] = v.get("value", "")
# Render ayarlarini bu makineye uyarla
env["NODE_ENV"] = "production"
env["PORT"] = os.environ["APP_PORT"]
env["HA_NODE_NAME"] = os.environ["NODE_NAME"]
env["HA_ROLE"] = "primary"          # Render ileride açılırsa o yedek kalır, iki bot çalışmaz
env.setdefault("BASE_URL", "https://" + os.environ["DOMAIN"])
if os.environ.get("DUCKDNS_TOKEN"):
    env["DUCKDNS_TOKEN"] = os.environ["DUCKDNS_TOKEN"]
for k in ("RENDER", "RENDER_EXTERNAL_URL", "RENDER_SERVICE_ID"):
    env.pop(k, None)
def q(val):
    val = str(val)
    if "\n" not in val and "\x27" not in val:
        return "\x27" + val + "\x27"
    return "\"" + val.replace("\n", "\\n") + "\""
with open(".env", "w") as f:
    for k in sorted(env):
        f.write(f"{k}={q(env[k])}\n")
print(f"{len(env)} değişken yazıldı")
'
  chown "$APP_USER:$APP_USER" .env && chmod 600 .env
elif [ ! -f .env ]; then
  echo "UYARI: RENDER_API_KEY verilmedi ve .env yok. $APP_DIR/.env dosyasını elle oluştur, sonra: sudo systemctl restart sentara"
fi

log "DuckDNS: $DOMAIN -> bu makine"
if [ -n "${DUCKDNS_TOKEN:-}" ]; then
  sub="${DOMAIN%.duckdns.org}"
  curl -fsS "https://www.duckdns.org/update?domains=${sub}&token=${DUCKDNS_TOKEN}&ip=&verbose=true" | head -2 || true
else
  echo "DUCKDNS_TOKEN verilmedi: duckdns.org'da $DOMAIN kaydının IP'sini bu makinenin genel IP'si yap."
fi

log "Caddy: https://$DOMAIN -> 127.0.0.1:$APP_PORT"
cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
	encode gzip
	reverse_proxy 127.0.0.1:$APP_PORT
}
EOF
systemctl enable caddy >/dev/null 2>&1 || true
systemctl restart caddy

log "systemd servisi: sentara"
cat > /etc/systemd/system/sentara.service <<EOF
[Unit]
Description=Sentara Bot + Web
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node haBoot.js
Restart=always
RestartSec=5
TimeoutStopSec=15
KillSignal=SIGTERM
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable sentara >/dev/null 2>&1
systemctl restart sentara

log "Bitti"
echo "Bot durumu : sudo systemctl status sentara"
echo "Canlı log  : sudo journalctl -u sentara -f"
echo "Site       : https://$DOMAIN  (DNS yayılması + sertifika 1-5 dk sürebilir)"
