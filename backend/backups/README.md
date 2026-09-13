# Backup ShoeStore

File `ShoeStore-20260912-095628.dump` được tạo bằng PostgreSQL 17 `pg_dump --format=custom --no-owner --no-acl`. Bao gồm schema và dữ liệu database tại thời điểm backup; không bao gồm tài khoản cấp PostgreSQL hoặc file ảnh upload local.

Đã kiểm tra archive bằng `pg_restore --list`, có 53 mục TABLE DATA. Chưa thực hiện khôi phục thử.

## Khôi phục vào database mới

Chạy từ thư mục gốc project, khi container `shoestore-postgres` đang chạy. Lệnh dưới đây tạo database riêng `ShoeStore_Restored`, không ghi đè database hiện tại. Nếu tên này đã tồn tại, chọn tên mới.

```powershell
docker cp .\backups\ShoeStore-20260912-095628.dump shoestore-postgres:/tmp/shoestore-restore.dump
docker exec shoestore-postgres createdb -U shoestore ShoeStore_Restored
# Chỉ chạy tiếp nếu createdb thành công.
docker exec shoestore-postgres pg_restore -U shoestore -d ShoeStore_Restored --no-owner --no-acl --exit-on-error --single-transaction /tmp/shoestore-restore.dump
docker exec shoestore-postgres rm -- /tmp/shoestore-restore.dump
```

Nếu máy nhận dùng username khác, thay `shoestore` bằng username đó. Đổi connection string của ứng dụng sang database vừa khôi phục để sử dụng dữ liệu.

Ảnh upload cần sao chép riêng từ `src/ShoeStore.HttpApi.Host/App_Data/ProductImages` vào thư mục ảnh cấu hình trên máy nhận. Backup chứa dữ liệu tài khoản và nghiệp vụ nên thư mục `backups/` được Git bỏ qua.
