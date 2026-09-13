# UTC ASM — SneakerStore

Website bán giày (Next.js) kết nối **ShoeStore API** (ASP.NET Core / ABP .NET 10) + **PostgreSQL**.

| Thành phần | URL |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://localhost:5000 |
| Swagger | http://localhost:5000/swagger |
| Health | http://localhost:5000/health-status |
| Postgres | `localhost:5432` |

**Đăng nhập:** cookie ABP qua proxy Next (`/api/abp`) — chạy API **HTTP `:5000` là đủ**.  
**Admin** (`admin`) sau login vào `/admin`. Khách vào store; giỏ/checkout cần đăng nhập.

> Push Git / Vercel chỉ deploy **frontend**. Backend + Postgres chạy local hoặc host riêng.

---

## Yêu cầu

| Công cụ | Ghi chú |
| --- | --- |
| Node.js **≥ 20.9** + npm | Next.js 16 yêu cầu ≥ 20.9 |
| Docker Desktop | Phải **mở app** trước khi gõ `docker` |
| .NET **10** SDK | [Tải SDK](https://dotnet.microsoft.com/download/dotnet/10.0) |
| Git | — |

```bash
node -v && npm -v && docker info && dotnet --version
```

---

## Cài lần đầu (clone)

```bash
git clone <URL-repo>
cd UTC_BTL_WEBSITE

cp .env.example .env.local
cp backend/api/appsettings.secrets.json.example backend/api/appsettings.secrets.json

npm install
```

- `.env.local` — không commit  
- `appsettings.secrets.json` — không commit; **password phải khớp** `docker-compose.yml` (`shoestore_local_dev`)

### Chứng chỉ OpenIddict (một lần)

API cần file `backend/api/openiddict.pfx` (không commit). Passphrase khớp `AuthServer:CertificatePassPhrase` trong `appsettings.json`:

```bash
cd backend/api

openssl req -x509 -newkey rsa:2048 \
  -keyout /tmp/shoestore-openid-key.pem \
  -out /tmp/shoestore-openid-cert.pem \
  -days 3650 -nodes \
  -subj "/CN=ShoeStore OpenIddict"

openssl pkcs12 -export \
  -out openiddict.pfx \
  -inkey /tmp/shoestore-openid-key.pem \
  -in /tmp/shoestore-openid-cert.pem \
  -passout pass:2cbe0f83-e7b2-4bfb-bede-ed58d00ee548

rm -f /tmp/shoestore-openid-key.pem /tmp/shoestore-openid-cert.pem
cd ../..
```

---

## Chạy local (3 terminal)

### 1) PostgreSQL

Dump trong `backend/backups/` là **Postgres 17** → dùng image `postgres:17` (không dùng 16).

```bash
# Bật Docker Desktop trước
docker compose up -d
docker compose ps
```

**Restore DB** (bắt buộc nếu DB mới/trống — không thì API báo thiếu bảng `Abp…`):

```bash
docker exec shoestore-postgres pg_isready -U shoestore -d ShoeStore

docker cp backend/backups/ShoeStore-20260912-095628.dump \
  shoestore-postgres:/tmp/shoestore-restore.dump

docker exec -it shoestore-postgres pg_restore -U shoestore -d ShoeStore \
  --no-owner --no-acl --clean --if-exists \
  /tmp/shoestore-restore.dump

docker exec -it shoestore-postgres psql -U shoestore -d ShoeStore -c '\dt' | head
```

Phải thấy `AbpUsers`, `AbpBackgroundJobs`, …

### 2) Backend API

```bash
cd backend/api
dotnet ShoeStore.HttpApi.Host.dll
```

Log đúng: `Now listening on: http://localhost:5000`  
Giữ terminal này chạy.

### 3) Frontend

```bash
cd ~/…/UTC_BTL_WEBSITE   # thư mục gốc repo
npm run dev
```

Mở http://localhost:3000

| Tài khoản | Mật khẩu | Sau login |
| --- | --- | --- |
| `admin` | `1q2w3E*` | `/admin` (dashboard) |
| User thường | (đăng ký) | store / checkout |

Khi API sống, Home/Collections lấy catalog từ API. API tắt → web fallback dữ liệu demo.

---

## Scripts frontend

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Build production |
| `npm run start` | Chạy production |
| `npm run lint` | ESLint |

---

## Cấu trúc

```
UTC_BTL_WEBSITE/
├── src/
│   ├── app/                 # pages: store, login, admin, api routes
│   │   └── api/
│   │       ├── auth/        # login/logout cookie ABP
│   │       └── abp/         # proxy → backend (gắn cookie)
│   ├── lib/api/             # client + types
│   └── context/             # Auth, Cart, Admin
├── backend/
│   ├── api/                 # publish Host (.dll)
│   ├── docs/                # OpenAPI + tài liệu
│   └── backups/             # dump DB (không commit *.dump)
├── docker-compose.yml       # Postgres 17
├── .env.example
└── README.md
```

---

## Luồng auth (local)

1. Browser `POST /api/auth/login` → Next gọi `http://localhost:5000/api/account/login`  
2. Next lưu cookie Identity vào `shoestore_sid` (httpOnly)  
3. Mọi API store qua `/api/abp/...` → Next gắn cookie gọi backend  

Không cần password grant OpenIddict / HTTPS cho login web local.

---

## Lỗi thường gặp

| Lỗi | Cách xử lý |
| --- | --- |
| `docker.sock` / daemon | Mở **Docker Desktop**, đợi sẵn sàng |
| `dotnet: command not found` | Cài .NET 10 SDK, mở lại terminal |
| Node `< 20.9` / `icu4c` gãy | Cài Node LTS ≥ 20.9 (nodejs.org hoặc `brew reinstall node`) |
| `openiddict.pfx` not found | Tạo PFX theo mục “Chứng chỉ OpenIddict” |
| Chạy DLL ở `~` | Phải `cd backend/api` rồi mới `dotnet ShoeStore.HttpApi.Host.dll` |
| `relation "Abp…" does not exist` | Restore dump (bước Postgres) |
| `unsupported version (1.16)` | Dùng `postgres:17`, không dùng 16 |
| API không kết nối DB | Khớp password `appsettings.secrets.json` ↔ Docker |
| Port `5432` / `5000` bận | Đổi port hoặc tắt process đang giữ |
| Login 502 | API chưa chạy trên `:5000` |

---

## Deploy

**Vercel (chỉ web):** build Next.js từ git. Cần API host riêng, set env ví dụ:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com
NEXT_PUBLIC_API_ORIGIN=https://your-api.example.com
```

(Production có thể dùng Bearer/OIDC thay cookie proxy local.)

**Backend:** Azure / Railway / Render / VPS + Docker — **không** chạy trên Vercel.

---

## Không commit

- `.env.local`
- `backend/api/appsettings.secrets.json`
- `backend/api/openiddict.pfx`
- `backend/backups/*.dump`
- `node_modules/`, `.next/`

Commit được: `.env.example`, `appsettings.secrets.json.example`, `docker-compose.yml`, source + docs.

---

## Tài liệu backend

- `backend/docs/API.md`
- `backend/docs/Tài liệu FUNCTIONS-AND-APIS.md`
- `backend/docs/PHASE1.md`
- `backend/docs/openapi.json`
- `backend/backups/README.md`
