# Published ShoeStore API (.NET 10) — deploy lên Render / Docker
FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app

COPY . /app/

COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
  && mkdir -p /app/Logs /app/App_Data/ProductImages \
  && rm -f /app/appsettings.secrets.json \
  && if [ -f /app/openiddict.deploy.pfx ]; then cp /app/openiddict.deploy.pfx /app/openiddict.pfx; fi \
  && rm -f /app/openiddict.deploy.pfx

ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://0.0.0.0:8080 \
    DOTNET_EnableDiagnostics=0 \
    DOTNET_GCServer=0 \
    DOTNET_GCConserveMemory=9 \
    AuthServer__CertificatePassPhrase=2cbe0f83-e7b2-4bfb-bede-ed58d00ee548

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
