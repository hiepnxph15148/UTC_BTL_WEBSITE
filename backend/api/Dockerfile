# Published ShoeStore API (.NET 10) — deploy lên Render / Docker
FROM mcr.microsoft.com/dotnet/aspnet:10.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . /app/

# Không copy secrets từ máy local; tạo PFX lúc start nếu thiếu
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
  && mkdir -p /app/Logs /app/App_Data/ProductImages \
  && rm -f /app/appsettings.secrets.json /app/openiddict.pfx || true

ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://0.0.0.0:8080 \
    DOTNET_EnableDiagnostics=0 \
    AuthServer__CertificatePassPhrase=2cbe0f83-e7b2-4bfb-bede-ed58d00ee548

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-8080}/health-status" || exit 1

ENTRYPOINT ["/entrypoint.sh"]
