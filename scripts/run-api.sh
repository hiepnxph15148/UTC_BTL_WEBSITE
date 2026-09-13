#!/usr/bin/env bash
# Chạy ShoeStore API với HTTPS (OpenIddict bắt buộc HTTPS cho /connect/token)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$ROOT/backend/api"
PFX="$API_DIR/openiddict.pfx"
PASS="2cbe0f83-e7b2-4bfb-bede-ed58d00ee548"

if [[ ! -f "$PFX" ]]; then
  echo "Thiếu $PFX — tạo trước (xem README bước B)."
  exit 1
fi

cd "$API_DIR"

export ASPNETCORE_ENVIRONMENT="${ASPNETCORE_ENVIRONMENT:-Production}"
export ASPNETCORE_URLS="${ASPNETCORE_URLS:-https://localhost:44322;http://localhost:5000}"
export ASPNETCORE_Kestrel__Certificates__Default__Path="$PFX"
export ASPNETCORE_Kestrel__Certificates__Default__Password="$PASS"

echo "Starting ShoeStore API on:"
echo "  HTTPS  https://localhost:44322"
echo "  HTTP   http://localhost:5000  (health UI; token cần HTTPS)"
echo

exec dotnet ShoeStore.HttpApi.Host.dll
