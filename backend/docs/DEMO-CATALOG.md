# Dữ liệu mẫu giày ShoeStore

Đã insert vào PostgreSQL `ShoeStore` ngày 12/09/2026.

- 50 sản phẩm, 5 hãng, mỗi hãng 10 sản phẩm.
- 5 danh mục: Giày lifestyle, Giày chạy bộ, Giày tập luyện, Giày bóng rổ, Giày skate.
- 6 màu: Trắng, Đen, Xám, Xanh navy, Đỏ, Be. Mỗi sản phẩm được gán 2 màu.
- 7 size EU 38–44; 14 SKU/sản phẩm, tổng 700 SKU.
- Mỗi SKU có 4–12 đôi; tổng tồn lúc insert 5.640 đôi, reserved=0.
- 700 StockMovement ghi nhận nhập ban đầu; CreatorId là admin hiện có.
- Sản phẩm published=true, SKU active=true để thử giỏ hàng/checkout.
- ImageUrl để null vì chưa cung cấp bộ ảnh sản phẩm.

Tên dùng để minh họa catalog của các thương hiệu. Giá, phân loại, màu/size và tồn là dữ liệu thử,
không phải bảng giá hoặc danh mục phân phối chính thức. Không tạo khách hàng/đơn hàng giả.

## Chạy lại

```powershell
.\etc\scripts\seed-demo-catalog.ps1
```

Script dành cho database development `ShoeStore`, user `shoestore` trong Docker Compose hiện tại.
Dữ liệu nguồn: [demo-catalog.sql](../etc/seed/demo-catalog.sql).

Toàn bộ insert chạy trong một transaction và dùng cùng advisory lock với backend.
Bản ghi được đánh dấu ExtraProperties.SeedBatch=`shoestore-demo-catalog-20260912-v1`.
Slug có tiền tố `demo-`, mã SKU có tiền tố `DEMO26-`.

Chạy lại bỏ qua dữ liệu đã có của batch, không đổi giá/trạng thái, không cộng lại tồn hay tạo lại
phiếu nhập cho SKU cũ. Nếu slug/SKU xung đột với dữ liệu ngoài batch, script dừng và rollback.
Dữ liệu cửa hàng có trước batch vẫn được giữ nguyên. Tổng tồn sẽ thay đổi khi có giao dịch thật.

## Danh sách sản phẩm

Giá dưới đây là giá VND minh họa áp dụng cho các SKU của sản phẩm.

| STT | Thương hiệu | Sản phẩm | Danh mục | Giá mẫu (VND) |
|---|---|---|---|---|
| 1 | Nike | Nike Air Force 1 | Giày lifestyle | 2,900,000 |
| 2 | Nike | Nike Air Max 90 | Giày lifestyle | 3,600,000 |
| 3 | Nike | Nike Air Max 270 | Giày lifestyle | 4,100,000 |
| 4 | Nike | Nike Dunk Low | Giày lifestyle | 3,100,000 |
| 5 | Nike | Nike Cortez | Giày lifestyle | 2,300,000 |
| 6 | Nike | Nike Blazer Mid 77 | Giày lifestyle | 2,700,000 |
| 7 | Nike | Nike Pegasus 40 | Giày chạy bộ | 3,500,000 |
| 8 | Nike | Nike Revolution 7 | Giày chạy bộ | 1,600,000 |
| 9 | Nike | Nike Metcon 9 | Giày tập luyện | 3,900,000 |
| 10 | Nike | Nike Precision 6 | Giày bóng rổ | 2,100,000 |
| 11 | Adidas | Adidas Stan Smith | Giày lifestyle | 2,500,000 |
| 12 | Adidas | Adidas Superstar | Giày lifestyle | 2,600,000 |
| 13 | Adidas | Adidas Samba OG | Giày lifestyle | 2,800,000 |
| 14 | Adidas | Adidas Gazelle | Giày lifestyle | 2,700,000 |
| 15 | Adidas | Adidas Forum Low | Giày lifestyle | 2,900,000 |
| 16 | Adidas | Adidas Ultraboost Light | Giày chạy bộ | 4,900,000 |
| 17 | Adidas | Adidas Duramo SL | Giày chạy bộ | 1,500,000 |
| 18 | Adidas | Adidas Adizero Boston 12 | Giày chạy bộ | 4,000,000 |
| 19 | Adidas | Adidas Dropset 2 | Giày tập luyện | 3,300,000 |
| 20 | Adidas | Adidas Dame 8 | Giày bóng rổ | 3,400,000 |
| 21 | Puma | Puma Suede Classic | Giày lifestyle | 2,100,000 |
| 22 | Puma | Puma Palermo | Giày lifestyle | 2,400,000 |
| 23 | Puma | Puma CA Pro Classic | Giày lifestyle | 2,500,000 |
| 24 | Puma | Puma RS-X | Giày lifestyle | 3,200,000 |
| 25 | Puma | Puma Carina 2.0 | Giày lifestyle | 1,800,000 |
| 26 | Puma | Puma Smash v2 | Giày lifestyle | 1,400,000 |
| 27 | Puma | Puma Velocity Nitro 2 | Giày chạy bộ | 3,300,000 |
| 28 | Puma | Puma Deviate Nitro 2 | Giày chạy bộ | 4,200,000 |
| 29 | Puma | Puma Fuse 2.0 | Giày tập luyện | 2,800,000 |
| 30 | Puma | Puma All Pro Nitro | Giày bóng rổ | 3,900,000 |
| 31 | New Balance | New Balance 574 | Giày lifestyle | 2,500,000 |
| 32 | New Balance | New Balance 327 | Giày lifestyle | 2,900,000 |
| 33 | New Balance | New Balance 530 | Giày lifestyle | 2,800,000 |
| 34 | New Balance | New Balance 550 | Giày lifestyle | 3,300,000 |
| 35 | New Balance | New Balance 2002R | Giày lifestyle | 4,100,000 |
| 36 | New Balance | New Balance 9060 | Giày lifestyle | 4,500,000 |
| 37 | New Balance | New Balance 990v6 | Giày lifestyle | 6,200,000 |
| 38 | New Balance | New Balance Fresh Foam X 1080v13 | Giày chạy bộ | 4,900,000 |
| 39 | New Balance | New Balance FuelCell Rebel v4 | Giày chạy bộ | 3,900,000 |
| 40 | New Balance | New Balance Numeric 306 | Giày skate | 2,400,000 |
| 41 | Converse | Converse Chuck Taylor All Star Low | Giày lifestyle | 1,500,000 |
| 42 | Converse | Converse Chuck Taylor All Star High | Giày lifestyle | 1,600,000 |
| 43 | Converse | Converse Chuck 70 Low | Giày lifestyle | 2,100,000 |
| 44 | Converse | Converse Chuck 70 High | Giày lifestyle | 2,200,000 |
| 45 | Converse | Converse One Star Pro | Giày skate | 2,300,000 |
| 46 | Converse | Converse Jack Purcell | Giày lifestyle | 2,000,000 |
| 47 | Converse | Converse Run Star Hike | Giày lifestyle | 2,900,000 |
| 48 | Converse | Converse Run Star Motion | Giày lifestyle | 3,200,000 |
| 49 | Converse | Converse All Star Lift | Giày lifestyle | 2,100,000 |
| 50 | Converse | Converse CONS Louie Lopez Pro | Giày skate | 2,500,000 |

## Kiểm tra qua API

- GET `/api/app/store/lookups?kind=1`: lấy ID thương hiệu.
- GET `/api/app/store/products?Take=100`: danh sách sản phẩm đang bán (có cả dữ liệu khác nếu tồn tại).
- GET `/api/app/store/products?brandId={id}&Take=100`: lọc thương hiệu.
- GET `/api/app/store/skus/{productId}`: xem biến thể và tồn khả dụng.
- GET `/api/app/store/inventory?Search=DEMO26-&Take=100&Skip=0`: xem tồn, cần Inventory.Manage; phân trang để lấy đủ 700 SKU.

Các hãng/lookup Smoke có sẵn từ test trước đó không bị xóa bởi script này.

