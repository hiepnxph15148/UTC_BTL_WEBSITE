# ShoeStore — nền tảng bán hàng giai đoạn 1

## Chạy local

Yêu cầu: .NET 10 SDK, Docker Desktop; ABP CLI/Yarn chỉ dùng để khôi phục tài nguyên trang đăng nhập.

```powershell
docker compose up -d --wait postgres
dotnet tool restore --configfile NuGet.Config
dotnet restore ShoeStore.slnx --configfile NuGet.Config
.\etc\scripts\migrate-database.ps1
.\etc\scripts\run-api.ps1
```

Swagger: https://localhost:44322/swagger
Health: https://localhost:44322/health-status

Chạy `dotnet dev-certs https --trust` nếu máy chưa tin cậy chứng chỉ localhost.
Host và DbMigrator đọc connection string từ `appsettings.secrets.json` trong từng project.
Các file này đã được tạo từ cấu hình Docker local và được Git bỏ qua. Khi clone sang máy khác,
tạo chúng theo mẫu dưới đây với mật khẩu trong `.env`:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=ShoeStore;Username=shoestore;Password=<your-local-password>"
  }
}
```

Có thể dùng biến môi trường `ConnectionStrings__Default` thay thế.
.NET không tự đọc `.env`; file này dành cho Docker Compose.
Migration SQLite cũ được lưu tại `etc/legacy-sqlite-migrations`; database SQLite cũ được giữ nguyên,
không tự nhập dữ liệu sang PostgreSQL.

## Chức năng đã triển khai

| Nhóm | Nghiệp vụ |
|---|---|
| PostgreSQL | Provider ABP PostgreSQL, migration mới, transaction, timestamp UTC |
| Tài khoản | Đăng ký/đăng nhập/profile/quên mật khẩu qua ABP Identity/OpenIddict |
| Phân quyền | Quyền riêng catalog, kho, đơn, đổi trả, thu/hoàn tiền, ưu đãi và báo cáo |
| Địa chỉ | Tạo, sửa, xóa, địa chỉ mặc định; kiểm tra chủ sở hữu |
| Danh mục | Loại danh mục, thương hiệu, màu, size; tạo/sửa/ẩn |
| Sản phẩm | Tên, slug, mô tả, ảnh qua URL hoặc upload local, danh mục, thương hiệu, xuất bản/ngừng bán |
| SKU | Mã duy nhất, màu/size, giá, trạng thái; tổ hợp màu/size không trùng |
| Kho | Một kho logic; nhập/điều chỉnh, sổ giao dịch, giữ hàng, tồn khả dụng |
| Giỏ hàng | Theo tài khoản; tối đa 50 SKU, 100 đơn vị mỗi dòng |
| Checkout | Kiểm tra tồn/giá/địa chỉ/ưu đãi, phí ship do backend tính |
| Đơn | Snapshot sản phẩm/giá/địa chỉ; idempotency; xác nhận/hủy/lịch sử |
| COD | Chờ thu, ghi nhận đã thu, hoàn một phần; tách trạng thái giao hàng |
| Giao hàng | Nhập hãng/mã vận đơn, bàn giao, xác nhận giao, nhận hoàn giao thất bại |
| Đổi trả | Yêu cầu theo dòng hàng, duyệt/từ chối/nhận/hoàn tất, kiểm tra nhập lại |
| Voucher | Mã chuẩn hóa, hạn dùng, đơn tối thiểu, mức giảm tối đa, giới hạn tổng/khách |
| Khuyến mãi | Tự động hoặc voucher, toàn đơn hoặc một sản phẩm, phần trăm/số tiền |
| Thông báo | Lưu bền trong DB theo khách, danh sách/đánh dấu đã đọc |
| Báo cáo | Đơn theo kỳ tạo, bán đã giao, COD đã thu, hoàn tiền, tồn thấp, đổi trả mở |

## Quy tắc vận hành

- Tiền tệ VND, làm tròn tiền đến đồng. Giá gốc trên SKU luôn do server quyết định.
- Ship 30.000đ; miễn ship khi giá hàng sau giảm đạt 1.000.000đ.
- Một chương trình giảm giá trên đơn: không nhập mã thì chọn khuyến mãi tự động có lợi nhất.
  Nhập mã thì chỉ xét voucher đó; không cộng dồn với khuyến mãi tự động.
- Ưu đãi gắn sản phẩm chỉ giảm phần giá của sản phẩm đó, giá trị đơn tối thiểu xét toàn giỏ.
- Giảm giá được phân bổ xuống dòng hàng để tính hoàn tiền một phần.
- Lượt ưu đãi tính cả đơn đang giữ hàng và đơn đã xác nhận; hủy/hết hạn trả lại lượt.
  Đổi trả sau giao không hoàn lượt voucher.
- Đặt COD giữ tồn 24 giờ chờ xác nhận. Xác nhận giữ hàng đến khi giao/hủy.
- Worker chạy mỗi phút để hủy đơn chờ quá hạn và giải phóng tồn.
- Tất cả thao tác ghi commerce dùng PostgreSQL advisory lock trong transaction,
  phù hợp một cửa hàng nhỏ và nhiều instance API. Đây là khóa chung; cần chuyển sang
  khóa theo SKU/đơn khi tăng tải, có đo kiểm trước.
- Khách chỉ tự hủy khi Pending; nhân viên được hủy Pending/Confirmed.
- Shipped trừ tồn vật lý và giải phóng phần giữ; Delivered chưa đồng nghĩa đã thu COD.
- Nhận hoàn giao thất bại chỉ ghi khi hàng thực tế đã nhận và kiểm tra có thể nhập lại.
- Yêu cầu đổi trả trong 7 ngày sau giao; không vượt số lượng đã mua trừ các yêu cầu chưa bị từ chối.
- Trả hoàn tiền cần COD đã được thu/đối soát. Hoàn tất là ghi nhận nhân viên đã trả tiền thực tế,
  không tự chuyển tiền qua ngân hàng. Phí ship không được hoàn trong chính sách này.
- Đổi màu/size cùng sản phẩm, cùng giá gốc; giữ SKU thay thế khi duyệt.
  Nhân viên xác nhận xuất hàng thay thế khi hoàn tất. Không tự tạo vận đơn cho lần đổi.
- Hàng trả chỉ vào tồn bán được khi `restock=true` lúc hoàn tất kiểm tra.
- Ghi chú InternalNote chỉ xuất hiện trong chi tiết quản trị.
- Báo cáo dùng tập đơn có CreationTime trong [from,to), phản ánh trạng thái hiện tại
  của tập đơn đó. Các số tồn thấp/đổi trả mở là toàn cửa hàng ở thời điểm truy vấn.
  Đây không phải sổ tiền mặt theo ngày thanh toán hoặc báo cáo lợi nhuận.

## Vai trò

| Vai trò | Quyền commerce |
|---|---|
| admin, store-manager | Tất cả quyền commerce |
| warehouse | Inventory.Manage |
| sales | Orders.Manage |
| customer-service | Orders.Manage, Returns.Manage |
| accountant | Payments.Manage, Reports.View |

Permission có tiền tố `ShoeStore.`, ví dụ `ShoeStore.Inventory.Manage`.
Chỉ admin có quyền quản lý tài khoản/vai trò mặc định của ABP; store-manager không tự được quyền quản trị Identity.
Hoàn tất yêu cầu Refund cần cả Returns.Manage và Payments.Manage. Có thể gán hai vai trò cho người xử lý.
Khách hàng thông thường không cần vai trò commerce; các API cá nhân kiểm tra UserId.

Tài khoản admin local của template: `admin` / `1q2w3E*` nếu chưa đổi.
Đổi mật khẩu/secret template trước khi triển khai. Email đang dùng NullEmailSender ở Debug;
luồng email cần cấu hình nhà cung cấp thật để gửi thư.

## Kiểm thử

```powershell
.\etc\scripts\test-commerce.ps1
```

Script dùng PostgreSQL Docker, tạo database ngẫu nhiên có tiền tố `shoestore_test_` cho mỗi test context
và xóa đúng database đó sau khi chạy. User DB cần quyền tạo database cho bộ test.
Kết quả TRX nằm trong `test/*/TestResults`.
Có thể chạy `test-commerce.ps1 -Sqlite` cho phần kiểm thử nhanh; test đồng thời PostgreSQL được đánh dấu skip.

Khi API đang chạy, có thể chạy:
```powershell
.\etc\scripts\smoke-commerce.ps1
```

Smoke HTTP tạo dữ liệu được đánh dấu Smoke, hủy đơn thử, ẩn sản phẩm thử và xóa địa chỉ thử;
lịch sử đơn/kho được giữ để audit. Chỉ chạy trên môi trường development.

## Phát triển tiếp

Entity/quy tắc: `src/ShoeStore.Domain/Commerce`.
DTO: `src/ShoeStore.Application.Contracts/Commerce`.
Application service: `src/ShoeStore.Application/Commerce`.
EF mapping/khóa: `src/ShoeStore.EntityFrameworkCore/EntityFrameworkCore`.

```powershell
Push-Location src/ShoeStore.EntityFrameworkCore
dotnet ef migrations add TenMigration
Pop-Location
.\etc\scripts\migrate-database.ps1
```

API cụ thể: [Danh sách endpoint](API.md).

Bản này chưa có frontend, thanh toán online, webhook hãng vận chuyển, email/SMS thật, gallery ảnh,
đa kho, đổi hàng chênh lệch giá, hay chuyển dữ liệu SQLite cũ.
