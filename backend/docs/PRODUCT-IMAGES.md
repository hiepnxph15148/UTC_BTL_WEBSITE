# Ảnh sản phẩm: URL hoặc upload local

Mỗi sản phẩm có một ảnh chính trong `ProductDto.imageUrl`. Database chỉ lưu URL/đường dẫn, không lưu nội dung nhị phân. Không cần migration cho tính năng này.

## API

Base URL development: `https://localhost:44322`. Cả ba API yêu cầu Bearer token và quyền `ShoeStore.Catalog.Manage`, trả về `ProductDto` đã cập nhật.

| Method | Endpoint | Dữ liệu |
|---|---|---|
| POST | `/api/products/{productId}/image/upload` | `multipart/form-data`, trường `file` |
| PUT | `/api/products/{productId}/image` | JSON `{"imageUrl":"https://example.com/shoe.jpg"}` |
| DELETE | `/api/products/{productId}/image` | Không có body; xóa ảnh chính |

### Upload từ máy

Tạo sản phẩm trước bằng API sản phẩm, lấy `id`, sau đó gọi API upload. Trong Swagger, Authorize rồi chọn API upload → Try it out → nhập productId → chọn file → Execute.

```powershell
curl.exe -X POST "https://localhost:44322/api/products/<productId>/image/upload" -H "Authorization: Bearer <token>" -F "file=@D:\Pictures\shoe.jpg"
```

Chấp nhận JPEG (`.jpg`, `.jpeg`), PNG, WebP, tối đa **5 MiB/file**. Giới hạn request multipart là 6 MiB để dành chỗ cho metadata. Backend kiểm tra kích thước thực tế, đuôi file, MIME và chữ ký/cấu trúc cơ bản của file; chưa giải mã và mã hóa lại pixel. SVG và file giả ảnh bị từ chối.

Kết quả `imageUrl` có dạng `/media/products/{productIdN}/{randomGuidN}.png`. Tên file do server tạo; không dùng tên hoặc đường dẫn từ máy người upload.

### Dùng URL có sẵn

Gửi URL tuyệt đối HTTP/HTTPS qua PUT ở trên. Backend lưu URL, không tải ảnh bên ngoài về local. API tạo/cập nhật sản phẩm hiện có vẫn nhận `imageUrl` bên ngoài như trước.

Khi cập nhật thông tin sản phẩm qua `PUT /api/app/store/{id}/product`, gửi lại `imageUrl` local hiện tại để giữ ảnh. Gửi null, chuỗi trống hoặc bỏ trường này sẽ xóa liên kết ảnh. Không được gán đường dẫn local của sản phẩm khác hoặc tự tạo đường dẫn local; hãy dùng API upload.

## Lưu trữ và hiển thị

Thư mục mặc định khi chạy project Host:

```text
D:\Study\ShoeStore\src\ShoeStore.HttpApi.Host\App_Data\ProductImages\{productIdN}\{randomGuidN}.png
```

Cấu hình `ProductImages:Directory` trong Host, hoặc biến môi trường `ProductImages__Directory`. Đường dẫn tương đối được tính từ content root của Host; có thể cấu hình đường dẫn tuyệt đối. Upload không được đưa vào build/publish và được Git bỏ qua. Cần giữ thư mục này qua các lần triển khai và sao lưu cùng database.

Ảnh local được phục vụ công khai qua `GET /media/products/...`, không cần token, kể cả ảnh của sản phẩm chưa xuất bản. Frontend chuyển đường dẫn tương đối thành URL theo địa chỉ API:

```javascript
const src = product.imageUrl
  ? new URL(product.imageUrl, "https://localhost:44322").href
  : "/images/placeholder.png";
```

Thay ảnh hoặc chuyển sang URL bên ngoài sẽ xóa file local cũ sau khi transaction database thành công. Xóa ảnh đặt `imageUrl=null` và dọn file local. Transaction rollback giữ ảnh cũ và dọn ảnh mới. URL bên ngoài không bị xóa. Lỗi dọn file được ghi log; sự cố dừng tiến trình đột ngột có thể để lại file dư vì filesystem và database không dùng chung transaction.

Hiện hỗ trợ một ảnh chính mỗi sản phẩm, chưa có gallery hoặc ảnh riêng cho từng SKU. Nếu chạy nhiều instance API, thư mục ảnh cần được chia sẻ giữa các instance.

## Kiểm thử

`etc/scripts/test-commerce.ps1` chạy các test PostgreSQL, bao gồm upload, thay/xóa ảnh, rollback, ngăn gán ảnh sản phẩm khác và từ chối file không hợp lệ.

Khi API development đang chạy, dùng `etc/scripts/smoke-product-images.ps1` để kiểm tra HTTP multipart, yêu cầu đăng nhập, nội dung file trên đĩa, URL ảnh public và dọn ảnh cũ. Script dùng tài khoản admin development mặc định, tạo một sản phẩm kiểm thử rồi ngừng xuất bản và xóa ảnh của sản phẩm đó.
