# Deploy ShoeStore API lên Render (free)

Vercel chỉ host Next.js. API + Postgres chạy trên **Render**.

## 1) Push code (có Dockerfile + `render.yaml`)

```bash
git add backend/api/Dockerfile backend/api/docker-entrypoint.sh backend/api/.dockerignore render.yaml
git commit -m "Add Render Docker deploy for ShoeStore API"
git push origin develop
```

## 2) Tạo service trên Render

1. Vào [https://dashboard.render.com](https://dashboard.render.com) → đăng ký/đăng nhập (GitHub).
2. **New** → **Blueprint** → chọn repo `UTC_BTL_WEBSITE` → nhánh `develop` (hoặc `main`).
3. Apply blueprint `render.yaml` → tạo:
   - `shoestore-db` (Postgres free)
   - `shoestore-api` (Docker web free)
4. Đợi build xanh. URL dạng: `https://shoestore-api.onrender.com`

Nếu tên service khác (Render thêm suffix), sửa env:

- `App__SelfUrl`
- `AuthServer__Authority`

…cho khớp URL thật, rồi **Manual Deploy**.

## 3) Restore database (bắt buộc)

DB mới trống → thiếu bảng `Abp*`. Restore dump từ máy local:

```bash
# Lấy External Database URL trong Render → shoestore-db → Connect
export DATABASE_URL='postgresql://shoestore:PASSWORD@HOST/ShoeStore'

# Cần Postgres client 16/17
pg_restore --no-owner --no-acl --clean --if-exists \
  -d "$DATABASE_URL" \
  backend/backups/ShoeStore-20260912-095628.dump
```

DB trên Render tên `shoestore` (chữ thường — bắt buộc bởi Blueprint). App không phụ thuộc tên DB trong connection string.

Dump trong repo là **Postgres 17**; Render free thường là **16**. Nếu `pg_restore` báo version:

- Dùng Neon (Postgres 16/17) làm DB, hoặc
- Export SQL plain từ local rồi `psql "$DATABASE_URL" < dump.sql`

Sau restore, mở:

- `https://shoestore-api.onrender.com/health-status`
- `https://shoestore-api.onrender.com/swagger`

Login API mặc định sau restore: `admin` / `1q2w3E*`

## 4) Trỏ Vercel (frontend) vào API

Vercel → Project → Settings → Environment Variables (Production):

```env
NEXT_PUBLIC_API_BASE_URL=/api/abp
NEXT_PUBLIC_API_ORIGIN=https://shoestore-api.onrender.com
```

Redeploy frontend.

## 5) Lưu ý free tier

| Hạng mục | Hành vi |
| --- | --- |
| Web free | Sleep ~15 phút idle → request đầu chậm (cold start) |
| Postgres free | Có hạn / hết hạn theo chính sách Render — backup thường xuyên |
| Disk | Ephemeral — ảnh upload/`openiddict.pfx` mất khi redeploy (PFX tự tạo lại mỗi start) |

## Env quan trọng (API)

| Key | Ý nghĩa |
| --- | --- |
| `ConnectionStrings__Default` | Chuỗi Postgres (blueprint gắn từ DB) |
| `App__SelfUrl` | URL public HTTPS của API |
| `AuthServer__Authority` | Cùng URL public |
| `AuthServer__RequireHttpsMetadata` | `false` (TLS terminate ở Render edge) |

## Troubleshoot

- **Build fail / .NET 10 image**: image `mcr.microsoft.com/dotnet/aspnet:10.0` phải kéo được.
- **Health check fail**: đợi cold start; xem Logs trên Render.
- **Login/giỏ từ Vercel 502**: sai `NEXT_PUBLIC_API_ORIGIN` hoặc API sleep/crash.
- **CSRF / Found**: đã xử lý qua proxy Next; cần redeploy web sau khi API sống.
