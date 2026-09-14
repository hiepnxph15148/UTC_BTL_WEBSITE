#!/bin/sh
set -eu

PORT="${PORT:-8080}"
export ASPNETCORE_URLS="http://0.0.0.0:${PORT}"

# OpenIddict signing cert (cùng passphrase với AuthServer:CertificatePassPhrase)
PFX="/app/openiddict.pfx"
PASS="${AuthServer__CertificatePassPhrase:-2cbe0f83-e7b2-4bfb-bede-ed58d00ee548}"

if [ ! -f "$PFX" ]; then
  echo "[entrypoint] Generating openiddict.pfx…"
  openssl req -x509 -newkey rsa:2048 \
    -keyout /tmp/shoestore-openid-key.pem \
    -out /tmp/shoestore-openid-cert.pem \
    -days 3650 -nodes \
    -subj "/CN=ShoeStore OpenIddict" >/dev/null 2>&1
  openssl pkcs12 -export \
    -out "$PFX" \
    -inkey /tmp/shoestore-openid-key.pem \
    -in /tmp/shoestore-openid-cert.pem \
    -passout "pass:${PASS}" >/dev/null 2>&1
  rm -f /tmp/shoestore-openid-key.pem /tmp/shoestore-openid-cert.pem
fi

if [ -z "${ConnectionStrings__Default:-}" ]; then
  echo "[entrypoint] WARN: ConnectionStrings__Default chưa set — API sẽ fail khi nối DB."
fi

echo "[entrypoint] Starting ShoeStore.HttpApi.Host on ${ASPNETCORE_URLS}"
exec dotnet ShoeStore.HttpApi.Host.dll
