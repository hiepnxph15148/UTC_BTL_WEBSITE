#!/bin/sh
set -eu

PORT="${PORT:-8080}"
export ASPNETCORE_URLS="http://0.0.0.0:${PORT}"

PFX="/app/openiddict.pfx"
if [ ! -f "$PFX" ]; then
  echo "[entrypoint] ERROR: openiddict.pfx missing (image must include openiddict.deploy.pfx)."
  exit 1
fi

CS="${ConnectionStrings__Default:-}"
if [ -n "$CS" ]; then
  case "$CS" in
    postgres://*|postgresql://*)
      case "$CS" in
        *sslmode=*|*Ssl\ Mode=*) ;;
        *)
          sep='?'
          case "$CS" in *\?* ) sep='&' ;; esac
          export ConnectionStrings__Default="${CS}${sep}sslmode=require"
          ;;
      esac
      ;;
  esac
  echo "[entrypoint] DB connection string is set."
else
  echo "[entrypoint] WARN: ConnectionStrings__Default is empty."
fi

echo "[entrypoint] Starting ShoeStore.HttpApi.Host on ${ASPNETCORE_URLS}"
exec dotnet ShoeStore.HttpApi.Host.dll
