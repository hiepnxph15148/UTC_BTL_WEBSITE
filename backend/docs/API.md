# ShoeStore API — giai đoạn 1

Tài liệu đầy đủ theo từng chức năng, quyền, request/response và quy tắc: [Chức năng và API](FUNCTIONS-AND-APIS.md).

Các endpoint dưới đây được lấy từ Swagger của ứng dụng. Base URL: https://localhost:44322.

Dùng Bearer token từ OpenIddict. Swagger hỗ trợ Authorize bằng Authorization Code.
Danh sách dùng skip/take (take tối đa 100). Payload dùng camelCase. Enum trả số theo bảng bên dưới.

| Method | Endpoint |
|---|---|
| GET | `/api/app/store/lookups` |
| POST | `/api/app/store/lookup` |
| PUT | `/api/app/store/{id}/lookup` |
| GET | `/api/app/store/products` |
| GET | `/api/app/store/admin-products` |
| GET | `/api/app/store/{id}/product` |
| PUT | `/api/app/store/{id}/product` |
| GET | `/api/app/store/skus/{productId}` |
| GET | `/api/app/store/admin-skus/{productId}` |
| POST | `/api/app/store/product` |
| POST | `/api/app/store/sku/{productId}` |
| PUT | `/api/app/store/{id}/sku` |
| GET | `/api/app/store/addresses` |
| POST | `/api/app/store/address` |
| PUT | `/api/app/store/{id}/address` |
| DELETE | `/api/app/store/{id}/address` |
| GET | `/api/app/store/cart` |
| POST | `/api/app/store/set-cart-item/{skuId}` |
| DELETE | `/api/app/store/cart-item/{skuId}` |
| GET | `/api/app/store/inventory` |
| POST | `/api/app/store/adjust-stock` |
| GET | `/api/app/store/stock-movements/{skuId}` |
| GET | `/api/app/store/discounts` |
| POST | `/api/app/store/discount` |
| PUT | `/api/app/store/{id}/discount` |
| POST | `/api/app/store/{id}/disable-discount` |
| POST | `/api/app/store/quote` |
| POST | `/api/app/store/place-order` |
| GET | `/api/app/store/my-orders` |
| GET | `/api/app/store/{id}/my-order` |
| GET | `/api/app/store/admin-orders` |
| GET | `/api/app/store/{id}/admin-order` |
| POST | `/api/app/store/{id}/cancel-my-order` |
| POST | `/api/app/store/{id}/cancel-order` |
| POST | `/api/app/store/expire-reservations` |
| POST | `/api/app/store/{id}/confirm-order` |
| POST | `/api/app/store/{id}/ship-order` |
| POST | `/api/app/store/{id}/deliver-order` |
| POST | `/api/app/store/{id}/receive-failed-delivery` |
| POST | `/api/app/store/{id}/collect-cod` |
| POST | `/api/app/store/{id}/order-note` |
| POST | `/api/app/store/request-return/{orderId}` |
| GET | `/api/app/store/my-returns` |
| GET | `/api/app/store/admin-returns` |
| POST | `/api/app/store/{id}/process-return` |
| GET | `/api/app/store/notifications` |
| POST | `/api/app/store/{id}/mark-notification-read` |
| GET | `/api/app/store/report` |

## Enum

- LookupKind: Category=0, Brand=1, Color=2, Size=3.
- OrderState: Pending=0, Confirmed=1, Shipped=2, Delivered=3, Cancelled=4.
- CodState: Unpaid=0, Collected=1, PartiallyRefunded=2, Refunded=3.
- ReturnKind: Refund=0, Exchange=1.
- ReturnState: Requested=0, Approved=1, Rejected=2, Received=3, Completed=4.
- DiscountKind: Fixed=0, Percentage=1.

## Đặt hàng

1. Tạo địa chỉ bằng POST /api/app/store/address.
2. Đặt số lượng SKU bằng POST /api/app/store/set-cart-item/{skuId}, body {"quantity":1}.
3. POST /api/app/store/quote với {"addressId":"UUID","coupon":null}.
4. POST /api/app/store/place-order với addressId, coupon, expectedTotal từ quote và idempotencyKey duy nhất (8–100 ký tự).
5. Gửi lại cùng key và payload để lấy lại đơn; thay payload cùng key bị từ chối.
6. Xem chi tiết tại GET /api/app/store/{id}/my-order.

## Ví dụ payload

SKU: {"colorId":"UUID","sizeId":"UUID","code":"WHITE-EU42","price":500000,"active":true}.

Nhập kho: {"skuId":"UUID","delta":10,"reason":"Nhập hàng PO-001"}. Delta âm dùng cho điều chỉnh giảm.

Voucher: {"name":"Giảm 10%","code":"WELCOME","kind":1,"value":10,"maxDiscount":100000,"minimumSubtotal":300000,"startsAt":"2026-09-01T00:00:00Z","endsAt":"2026-12-01T00:00:00Z","usageLimit":100,"perCustomerLimit":1,"active":true}. Bỏ code để tạo khuyến mãi tự động.

Đổi trả: {"orderLineId":"UUID","quantity":1,"kind":0,"reason":"Không vừa"}.

Xử lý đổi trả: {"state":1,"note":"Chấp thuận","restock":false}; tiếp theo state=3 khi nhận hàng, state=4 khi hoàn tất.

Giao hàng: {"carrier":"Giao thủ công","trackingCode":"SHIP-001"}.

Báo cáo: GET /api/app/store/report?from=2026-09-01T00:00:00Z&to=2026-10-01T00:00:00Z.

## Lỗi và quyền

API trả lỗi theo định dạng ABP; 400 cho validation, 401 khi chưa đăng nhập, 403 khi không được phép, 404 khi ID không tồn tại. Lỗi nghiệp vụ được ánh xạ theo exception của ABP, không mặc định luôn là 400; client cần đọc cả error.message.
API có tên Admin và các thao tác quản trị được kiểm tra permission; API cá nhân kiểm tra chủ sở hữu.
Không đưa ghi chú nội bộ, token hoặc mật khẩu vào request log.

Tài khoản/profile/phân quyền dùng các endpoint ABP sẵn có trong Swagger, không tạo hệ thống xác thực thứ hai.

Chính sách nghiệp vụ và giới hạn: [PHASE1.md](PHASE1.md).

## Ảnh sản phẩm

Yêu cầu quyền `ShoeStore.Catalog.Manage`. Cả ba API trả về `ProductDto`.

| Method | Endpoint | Input |
|---|---|---|
| POST | `/api/products/{productId}/image/upload` | Multipart, trường `file`, JPEG/PNG/WebP tối đa 5 MiB |
| PUT | `/api/products/{productId}/image` | JSON `imageUrl` HTTP/HTTPS |
| DELETE | `/api/products/{productId}/image` | Không có body |

File upload lưu local; `imageUrl` trả về đường dẫn `/media/products/...`. Xem [luồng sử dụng, lưu trữ và ví dụ upload](PRODUCT-IMAGES.md).
