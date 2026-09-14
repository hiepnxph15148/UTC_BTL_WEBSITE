#!/bin/sh
set -eu

PORT="${PORT:-8080}"
export ASPNETCORE_URLS="http://0.0.0.0:${PORT}"

PFX="/app/openiddict.pfx"
PASS="${AuthServer__CertificatePassPhrase:-2cbe0f83-e7b2-4bfb-bede-ed58d00ee548}"

if [ ! -f "$PFX" ]; then
  echo "[entrypoint] Generating openiddict.pfx..."
  openssl req -x509 -newkey rsa:2048 \
    -keyout /tmp/shoestore-openid-key.pem \
    -out /tmp/shoestore-openid-cert.pem \
    -days 3650 -nodes \
    -subj "/CN=ShoeStore OpenIddict"
  openssl pkcs12 -export \
    -out "$PFX" \
    -inkey /tmp/shoestore-openid-key.pem \
    -in /tmp/shoestore-openid-cert.pem \
    -passout "pass:${PASS}"
  rm -f /tmp/shoestore-openid-key.pem /tmp/shoestore-openid-cert.pem
fi

# Render thường cấp postgres:// URI — bổ sung SSL cho Npgsql nếu thiếu
CS="${ConnectionStrings__Default:-}"
if [ -n "$CS" ]; then
  case "$CS" in
    postgres://*|postgresql://*)
      case "$CS" in
        *sslmode=*|*Ssl\ Mode=*) ;;
        *)
          sep='?'
          case "$CS" in *\?* ) sep='&' ;; esac
          CS="${CS}${sep}sslmode=require"
          export ConnectionStrings__Default="$CS"
          ;;
      esac
      ;;
  esac
  echo "[entrypoint] DB connection string is set (host hidden)."
else
  echo "[entrypoint] WARN: ConnectionStrings__Default is empty."
fi

echo "[entrypoint] Starting ShoeStore.HttpApi.Host on ${ASPNETCORE_URLS}"
exec dotnet ShoeStore.HttpApi.Host.dll
