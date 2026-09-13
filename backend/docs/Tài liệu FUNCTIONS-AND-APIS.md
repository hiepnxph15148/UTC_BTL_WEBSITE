# ShoeStore — Tài liệu chức năng và API

**Phiên bản:** Giai đoạn 1 · **Ngày đối chiếu:** 12/09/2026  
**Đối tượng:** lập trình viên frontend/backend, kiểm thử viên và người vận hành.

Tài liệu mô tả những chức năng đã có trong mã nguồn, không phải danh sách tính năng dự kiến.
Đường dẫn, HTTP method, tham số và DTO được đối chiếu với [OpenAPI trong dự án](openapi.json).
Quyền và điều kiện nghiệp vụ được đối chiếu với các file StoreAppService, DTO, enum và role seed.
Mỗi cặp method–path là một API; một path có thể có nhiều method.

## Mục lục

1. Quy ước tích hợp
2. Tài khoản, xác thực và phân quyền
3. Danh mục, thương hiệu, màu và size
4. Sản phẩm
5. Biến thể SKU
6. Địa chỉ nhận hàng
7. Kho, nhập hàng và giữ tồn
8. Giỏ hàng
9. Voucher và khuyến mãi
10. Checkout và tạo đơn COD
11. Đơn hàng và lịch sử
12. Vận chuyển và đối soát COD
13. Đổi trả và hoàn tiền
14. Thông báo
15. Báo cáo
16. Luồng tích hợp và JSON mẫu
17. Trạng thái, phản hồi lỗi và giới hạn
18. Từ điển DTO
19. Nguồn đối chiếu và tài liệu liên quan

## 1. Quy ước tích hợp

- Base URL development: `https://localhost:44322`.
- Swagger khi API chạy: `/swagger`; JSON: `/swagger/v1/swagger.json`.
- Body JSON; tên trường camelCase; UUID cho định danh; ngày giờ ISO 8601 UTC có hậu tố Z.
- Header thông thường: `Content-Type: application/json`, `Authorization: Bearer <access_token>`.
- Các API ghi không nhận userId của khách; server lấy từ tài khoản đăng nhập.
- API PUT dùng đầy đủ DTO được liệt kê; không có nghĩa là cập nhật một trường kiểu PATCH.
- Commerce trả danh sách dạng **mảng**, không có totalCount. Quy ước module ABP có thể khác, xem DTO.
- PageInput: Skip ≥ 0 (mặc định 0), Take từ 1–100 (mặc định 20), Search tối đa 100 ký tự.
  Tên query trong bảng theo OpenAPI; ASP.NET Core bind không phân biệt hoa/thường.
- Search chỉ được dùng cho products/admin-products (tên), inventory (mã SKU), admin-orders (số đơn).
  Các danh sách khác nhận PageInput nhưng không áp dụng Search.
- Không có phân trang cho lookups, danh sách SKU của sản phẩm, addresses và cart.
- Giá tính bằng VND; quote có currency. Các response tiền khác sử dụng cùng đơn vị.
- “Công khai” là không cần đăng nhập. “Dữ liệu của mình” là ngoài đăng nhập còn kiểm tra chủ sở hữu.
- Quyền commerce trong bảng được viết gọn; thêm tiền tố `ShoeStore.`, ví dụ `Catalog.Manage` là `ShoeStore.Catalog.Manage`.
- “Không body” nghĩa là không cần gửi JSON cho thao tác đó; tham số path/query vẫn cần nếu có.

## 2. Tài khoản, xác thực và phân quyền

Dùng ABP Identity/Account/OpenIddict có sẵn. Swagger hỗ trợ Authorize bằng Authorization Code.
`POST /connect/token` là endpoint giao thức OpenIddict (không nằm trong bộ API Store);
dùng `application/x-www-form-urlencoded` với grant được client cho phép.
Đăng nhập cookie qua `/api/account/login` không đồng nghĩa endpoint trả access_token.
Đăng xuất cookie không tự thu hồi mọi bearer token đã phát hành.

Các thao tác quản lý user/role/permission chịu policy của module ABP; vai trò có quyền commerce
không tự có quyền quản trị Identity. Khách mới đăng ký không được quyền quản trị kho/đơn/sản phẩm.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **POST** `/api/account/register` | Đăng ký tài khoản | Theo cấu hình tự đăng ký | —<br>Body: `RegisterDto` | 200 · `IdentityUserDto` |
| **POST** `/api/account/login` | Đăng nhập cookie | Theo cấu hình Account | —<br>Body: `UserLoginInfo` | 200 · `AbpLoginResult` |
| **GET** `/api/account/logout` | Đăng xuất phiên cookie | Theo cấu hình Account | —<br>Body: không body | 204 · không body |
| **GET** `/api/account/my-profile` | Đọc hồ sơ | Người đang đăng nhập | —<br>Body: không body | 200 · `ProfileDto` |
| **PUT** `/api/account/my-profile` | Sửa hồ sơ | Người đang đăng nhập | —<br>Body: `UpdateProfileDto` | 200 · `ProfileDto` |
| **POST** `/api/account/my-profile/change-password` | Đổi mật khẩu | Người đang đăng nhập | —<br>Body: `ChangePasswordInput` | 204 · không body |
| **POST** `/api/account/send-password-reset-code` | Gửi mã khôi phục mật khẩu | Theo cấu hình Account/email | —<br>Body: `SendPasswordResetCodeDto` | 204 · không body |
| **POST** `/api/account/verify-password-reset-token` | Kiểm tra mã khôi phục | Theo cấu hình Account | —<br>Body: `VerifyPasswordResetTokenInput` | 200 · `boolean` |
| **POST** `/api/account/reset-password` | Đặt lại mật khẩu bằng mã | Theo cấu hình Account | —<br>Body: `ResetPasswordDto` | 204 · không body |
| **GET** `/api/identity/users` | Danh sách người dùng | Quyền module Identity | `Filter` (query), `Sorting` (query), `SkipCount` (query), `MaxResultCount` (query), `ExtraProperties` (query)<br>Body: không body | 200 · `0, Culture=neutral, PublicKeyToken=null]]` |
| **POST** `/api/identity/users` | Tạo nhân viên/người dùng | Quyền module Identity | —<br>Body: `IdentityUserCreateDto` | 200 · `IdentityUserDto` |
| **GET** `/api/identity/users/{id}` | Chi tiết người dùng | Quyền module Identity | `id` (path, bắt buộc)<br>Body: không body | 200 · `IdentityUserDto` |
| **PUT** `/api/identity/users/{id}` | Cập nhật người dùng | Quyền module Identity | `id` (path, bắt buộc)<br>Body: `IdentityUserUpdateDto` | 200 · `IdentityUserDto` |
| **DELETE** `/api/identity/users/{id}` | Xóa người dùng | Quyền module Identity | `id` (path, bắt buộc)<br>Body: không body | 204 · không body |
| **GET** `/api/identity/users/{id}/roles` | Vai trò của người dùng | Quyền module Identity | `id` (path, bắt buộc)<br>Body: không body | 200 · `0, Culture=neutral, PublicKeyToken=null]]` |
| **PUT** `/api/identity/users/{id}/roles` | Gán danh sách vai trò | Quyền module Identity | `id` (path, bắt buộc)<br>Body: `IdentityUserUpdateRolesDto` | 204 · không body |
| **GET** `/api/identity/roles` | Danh sách vai trò | Quyền module Identity | `Filter` (query), `Sorting` (query), `SkipCount` (query), `MaxResultCount` (query), `ExtraProperties` (query)<br>Body: không body | 200 · `0, Culture=neutral, PublicKeyToken=null]]` |
| **POST** `/api/identity/roles` | Tạo vai trò | Quyền module Identity | —<br>Body: `IdentityRoleCreateDto` | 200 · `IdentityRoleDto` |
| **GET** `/api/identity/roles/{id}` | Chi tiết vai trò | Quyền module Identity | `id` (path, bắt buộc)<br>Body: không body | 200 · `IdentityRoleDto` |
| **PUT** `/api/identity/roles/{id}` | Sửa vai trò | Quyền module Identity | `id` (path, bắt buộc)<br>Body: `IdentityRoleUpdateDto` | 200 · `IdentityRoleDto` |
| **DELETE** `/api/identity/roles/{id}` | Xóa vai trò | Quyền module Identity | `id` (path, bắt buộc)<br>Body: không body | 204 · không body |
| **GET** `/api/permission-management/permissions` | Xem quyền theo provider | Quyền module Permission Management | `providerName` (query), `providerKey` (query)<br>Body: không body | 200 · `GetPermissionListResultDto` |
| **PUT** `/api/permission-management/permissions` | Cấp/thu hồi quyền | Quyền module Permission Management | `providerName` (query), `providerKey` (query)<br>Body: `UpdatePermissionsDto` | 204 · không body |

Email sender hiện bị thay bằng NullEmailSender ở Debug; có API gửi mã không có nghĩa thư sẽ được gửi thật.
Cần cấu hình kênh email trước khi dùng khôi phục mật khẩu qua email thực tế.
Schema ABP có trường mở rộng; chỉ các contract được tham chiếu trực tiếp trong bảng được liệt kê ở cuối tài liệu,
các kiểu lồng sâu và endpoint lookup phụ trợ xem OpenAPI.

| Vai trò seed | Quyền commerce mặc định |
|---|---|
| admin, store-manager | Catalog, Inventory, Orders, Returns, Payments, Promotions, Reports |
| warehouse | Inventory.Manage |
| sales | Orders.Manage |
| customer-service | Orders.Manage, Returns.Manage |
| accountant | Payments.Manage, Reports.View |

Quyền admin của ABP được cấu hình riêng với quyền commerce. Hoàn tất Refund cần Returns.Manage **và** Payments.Manage.

## 3. Danh mục, thương hiệu, màu và size

Bốn loại dữ liệu dùng chung entity Lookup, phân biệt bằng `kind`. Tên phải duy nhất trong cùng loại. Không đổi loại của bản ghi đã tạo. Đặt `active=false` để ngừng sử dụng; danh sách công khai chỉ trả bản ghi active. Việc tắt lookup không tự động ẩn các sản phẩm đã gắn lookup đó; muốn ngừng bán cần cập nhật sản phẩm/SKU.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **GET** `/api/app/store/lookups` | Lấy danh sách theo kind | Công khai | `kind` (query)<br>Body: không body | 200 · Mảng `LookupDto` |
| **POST** `/api/app/store/lookup` | Tạo danh mục/thương hiệu/màu/size | Catalog.Manage | —<br>Body: `LookupInput` | 200 · `LookupDto` |
| **PUT** `/api/app/store/{id}/lookup` | Sửa tên hoặc trạng thái lookup | Catalog.Manage | `id` (path, bắt buộc)<br>Body: `LookupInput` | 200 · `LookupDto` |

## 4. Sản phẩm

Sản phẩm chứa thông tin chung; SKU là từng đôi giày theo màu/size. Slug duy nhất, chữ thường/số và dấu gạch nối. Danh mục và thương hiệu phải đúng loại, đang active khi tạo/cập nhật. Ngừng bán bằng `published=false`; không có API xóa sản phẩm. `imageUrl` là URL bên ngoài hoặc đường dẫn ảnh upload local. Hỗ trợ một ảnh chính; chưa có gallery. Xem [API ảnh: upload, URL và xóa](PRODUCT-IMAGES.md).

Danh sách khách lọc theo tên (`Search`), categoryId và brandId, chỉ hiện published. Danh sách quản trị gồm cả bản nháp/ngừng bán. Chưa có bộ lọc giá/màu/size hay sắp xếp tùy chọn.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **GET** `/api/app/store/products` | Duyệt/tìm sản phẩm đang bán | Công khai | `Skip` (query), `Take` (query), `Search` (query), `categoryId` (query), `brandId` (query)<br>Body: không body | 200 · Mảng `ProductDto` |
| **GET** `/api/app/store/{id}/product` | Xem sản phẩm published | Công khai | `id` (path, bắt buộc)<br>Body: không body | 200 · `ProductDto` |
| **GET** `/api/app/store/admin-products` | Danh sách quản trị | Catalog.Manage | `Skip` (query), `Take` (query), `Search` (query)<br>Body: không body | 200 · Mảng `ProductDto` |
| **POST** `/api/app/store/product` | Tạo sản phẩm | Catalog.Manage | —<br>Body: `ProductInput` | 200 · `ProductDto` |
| **PUT** `/api/app/store/{id}/product` | Cập nhật hoặc ngừng bán | Catalog.Manage | `id` (path, bắt buộc)<br>Body: `ProductInput` | 200 · `ProductDto` |

## 5. Biến thể SKU

SKU có mã duy nhất toàn hệ thống và tổ hợp productId–colorId–sizeId duy nhất. Mã được chuẩn hóa chữ hoa. Sau tạo, không đổi mã/màu/size; cần tạo SKU khác. Cho phép đổi giá và active. Giá VND được làm tròn đến đồng; lịch sử đơn giữ giá cũ. Danh sách công khai yêu cầu sản phẩm published và SKU active; danh sách quản trị có cả SKU inactive. `available = onHand - reserved`.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **GET** `/api/app/store/skus/{productId}` | Các SKU đang bán của sản phẩm | Công khai | `productId` (path, bắt buộc)<br>Body: không body | 200 · Mảng `SkuDto` |
| **GET** `/api/app/store/admin-skus/{productId}` | Tất cả SKU của sản phẩm | Catalog.Manage | `productId` (path, bắt buộc)<br>Body: không body | 200 · Mảng `SkuDto` |
| **POST** `/api/app/store/sku/{productId}` | Tạo SKU cho sản phẩm | Catalog.Manage | `productId` (path, bắt buộc)<br>Body: `SkuInput` | 200 · `SkuDto` |
| **PUT** `/api/app/store/{id}/sku` | Cập nhật giá/trạng thái SKU | Catalog.Manage | `id` (path, bắt buộc)<br>Body: `SkuInput` | 200 · `SkuDto` |

## 6. Địa chỉ nhận hàng

Mỗi địa chỉ gắn với người dùng đăng nhập. Không được truy cập địa chỉ người khác. Địa chỉ đầu tiên tự làm mặc định; chọn mặc định mới sẽ bỏ mặc định cũ. Khi xóa địa chỉ mặc định, một địa chỉ còn lại được chọn thay thế. Đơn hàng giữ bản chụp địa chỉ nên không thay đổi khi khách sửa/xóa địa chỉ.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **GET** `/api/app/store/addresses` | Danh sách địa chỉ cá nhân | Đăng nhập; dữ liệu của mình | —<br>Body: không body | 200 · Mảng `AddressDto` |
| **POST** `/api/app/store/address` | Thêm địa chỉ | Đăng nhập; dữ liệu của mình | —<br>Body: `AddressInput` | 200 · `AddressDto` |
| **PUT** `/api/app/store/{id}/address` | Sửa địa chỉ/đặt mặc định | Đăng nhập; dữ liệu của mình | `id` (path, bắt buộc)<br>Body: `AddressInput` | 200 · `AddressDto` |
| **DELETE** `/api/app/store/{id}/address` | Xóa địa chỉ | Đăng nhập; dữ liệu của mình | `id` (path, bắt buộc)<br>Body: không body | 204 · không body |

## 7. Kho, nhập hàng và giữ tồn

Giai đoạn này có một kho logic; tồn được lưu trên SKU, không có warehouseId. Nhập hàng dùng delta dương; điều chỉnh giảm dùng delta âm. Delta phải khác 0, trong ±1.000.000; cần lý do. Không được giảm onHand xuống dưới reserved. Mỗi thay đổi tồn vật lý tạo StockMovement ghi delta, số dư, lý do và liên kết đơn nếu có.

Đặt đơn giữ hàng 24 giờ chờ xác nhận; xác nhận giữ tới khi giao/hủy. Khi bàn giao vận chuyển: giảm cả onHand và reserved. Khi hủy trước giao/hết hạn: chỉ giảm reserved. Worker kiểm tra hết hạn mỗi phút; tác vụ giải phóng cũng chạy khi đặt đơn/điều chỉnh tồn. Số khả dụng có thể chưa phản ánh việc hết hạn cho tới lần giải phóng tiếp theo.

Các thao tác ghi dùng transaction và khóa PostgreSQL chung của cửa hàng. API expire-reservations ở nhóm đơn hàng có thể được nhân viên có quyền Orders.Manage kích hoạt.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **GET** `/api/app/store/inventory` | Xem tồn; Search tìm mã SKU | Inventory.Manage | `Skip` (query), `Take` (query), `Search` (query)<br>Body: không body | 200 · Mảng `InventoryDto` |
| **POST** `/api/app/store/adjust-stock` | Nhập hoặc điều chỉnh tồn | Inventory.Manage | —<br>Body: `StockInput` | 200 · `InventoryDto` |
| **GET** `/api/app/store/stock-movements/{skuId}` | Sổ giao dịch kho của SKU | Inventory.Manage | `skuId` (path, bắt buộc), `Skip` (query), `Take` (query), `Search` (query)<br>Body: không body | 200 · Mảng `MovementDto` |

## 8. Giỏ hàng

Giỏ theo tài khoản, chưa hỗ trợ guest cart. Tối đa 50 SKU, mỗi dòng 1–100 đơn vị. Set-cart-item đặt số lượng tuyệt đối, không cộng dồn vào số cũ. Thêm/sửa kiểm tra sản phẩm đang bán và tồn đủ; chưa giữ hàng. Giá/tồn được kiểm tra lại ở checkout. Xóa bằng API DELETE, không gửi quantity=0. Không có coupon lưu trên giỏ; mã được gửi cùng quote/place-order.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **GET** `/api/app/store/cart` | Xem giỏ với giá/tồn hiện tại | Đăng nhập; dữ liệu của mình | —<br>Body: không body | 200 · Mảng `CartLineDto` |
| **POST** `/api/app/store/set-cart-item/{skuId}` | Thêm SKU hoặc ghi đè số lượng | Đăng nhập; dữ liệu của mình | `skuId` (path, bắt buộc)<br>Body: `QuantityInput` | 204 · không body |
| **DELETE** `/api/app/store/cart-item/{skuId}` | Xóa SKU khỏi giỏ | Đăng nhập; dữ liệu của mình | `skuId` (path, bắt buộc)<br>Body: không body | 204 · không body |

## 9. Voucher và khuyến mãi

Discount có code là voucher; code null là khuyến mãi tự động. Hỗ trợ giảm số tiền/phần trăm, toàn giỏ hoặc một productId. Thời gian UTC: bắt đầu bao gồm, kết thúc không bao gồm. Phần trăm tối đa 100. Điều kiện minimumSubtotal xét tổng giỏ trước giảm; productId giới hạn phần hàng được giảm.

Mỗi đơn chỉ áp dụng một ưu đãi. Không nhập mã: chọn khuyến mãi tự động giảm nhiều nhất trong các chương trình đủ điều kiện. Có mã: chỉ xét mã đó; không hợp lệ thì từ chối, không tự chuyển sang khuyến mãi khác. Có giới hạn tổng lượt và lượt theo khách, tính các đơn chưa hủy/còn hiệu lực giữ hàng. Hủy/hết hạn trả lại lượt; đổi trả không trả lại lượt.

Giảm giá được phân bổ xuống từng dòng hàng. Discount đã được bất kỳ đơn hàng nào tham chiếu chỉ được tắt bằng disable-discount, không chỉnh điều kiện kể cả đơn đó đã hủy. Chưa có endpoint bật lại chương trình đã dùng.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **GET** `/api/app/store/discounts` | Danh sách ưu đãi quản trị | Promotions.Manage | `Skip` (query), `Take` (query), `Search` (query)<br>Body: không body | 200 · Mảng `DiscountDto` |
| **POST** `/api/app/store/discount` | Tạo voucher/khuyến mãi | Promotions.Manage | —<br>Body: `DiscountInput` | 200 · `DiscountDto` |
| **PUT** `/api/app/store/{id}/discount` | Sửa chương trình chưa được đơn tham chiếu | Promotions.Manage | `id` (path, bắt buộc)<br>Body: `DiscountInput` | 200 · `DiscountDto` |
| **POST** `/api/app/store/{id}/disable-discount` | Tắt chương trình | Promotions.Manage | `id` (path, bắt buộc)<br>Body: không body | 204 · không body |

## 10. Checkout và tạo đơn COD

Quote tính lại toàn bộ giỏ, kiểm tra địa chỉ của khách, SKU đang bán và tồn. Quote không giữ hàng và không có mã báo giá có thời hạn. Ship cố định 30.000đ; miễn ship từ 1.000.000đ giá hàng sau giảm.

Place-order phải gửi expectedTotal bằng tổng mới nhất. Backend tính lại và từ chối nếu khác. `idempotencyKey` nằm trong JSON body (8–100 ký tự), không phải HTTP header. Dùng key mới cho lần đặt mới; retry cùng key và cùng addressId/coupon/expectedTotal trả đơn đã tạo. Thay các trường đó với key cũ bị từ chối. Key không có thời hạn xóa trong bản hiện tại.

Tạo thành công: lưu snapshot, giữ tồn, ghi lịch sử/thông báo và xóa toàn bộ giỏ trong transaction. Chỉ hỗ trợ COD, không có chọn cổng thanh toán. Giá/tổng tiền do server quyết định.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **POST** `/api/app/store/quote` | Báo giá toàn giỏ | Đăng nhập; dữ liệu của mình | —<br>Body: `CheckoutInput` | 200 · `QuoteDto` |
| **POST** `/api/app/store/place-order` | Tạo đơn COD hoặc lấy lại đơn khi retry | Đăng nhập; dữ liệu của mình | —<br>Body: `PlaceOrderInput` | 200 · `OrderDetailDto` |

## 11. Đơn hàng và lịch sử

Khách tự hủy chỉ khi Pending; nhân viên hủy Pending hoặc Confirmed. Hủy đơn đã Cancelled là thao tác không làm thay đổi thêm. Confirm chỉ chấp nhận Pending còn hạn. Hết hạn không tự chuyển trạng thái chỉ vì GET; worker/tác vụ giải phóng thực hiện việc đó.

Đơn lưu tên/mã/giá/giảm giá từng dòng và địa chỉ tại lúc mua. `addressSnapshot` trong response là chuỗi JSON, không phải object. Chi tiết gồm `order`, `items`, `history`. Ghi chú InternalNote chỉ có trong chi tiết quản trị; các lịch sử/thông báo nghiệp vụ khác có thể hiển thị cho khách, vì vậy không ghi thông tin nội bộ vào note của thao tác công khai.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **GET** `/api/app/store/my-orders` | Danh sách đơn cá nhân | Đăng nhập; dữ liệu của mình | `Skip` (query), `Take` (query), `Search` (query)<br>Body: không body | 200 · Mảng `OrderDto` |
| **GET** `/api/app/store/{id}/my-order` | Chi tiết đơn cá nhân | Đăng nhập; dữ liệu của mình | `id` (path, bắt buộc)<br>Body: không body | 200 · `OrderDetailDto` |
| **POST** `/api/app/store/{id}/cancel-my-order` | Khách hủy đơn Pending | Đăng nhập; dữ liệu của mình | `id` (path, bắt buộc)<br>Body: `NoteInput` | 204 · không body |
| **GET** `/api/app/store/admin-orders` | Tìm đơn theo số đơn, lọc state | Orders.Manage | `Skip` (query), `Take` (query), `Search` (query), `state` (query)<br>Body: không body | 200 · Mảng `OrderDto` |
| **GET** `/api/app/store/{id}/admin-order` | Chi tiết quản trị và lịch sử nội bộ | Orders.Manage | `id` (path, bắt buộc)<br>Body: không body | 200 · `OrderDetailDto` |
| **POST** `/api/app/store/{id}/confirm-order` | Xác nhận COD còn hạn | Orders.Manage | `id` (path, bắt buộc)<br>Body: không body | 204 · không body |
| **POST** `/api/app/store/{id}/cancel-order` | Nhân viên hủy trước giao | Orders.Manage | `id` (path, bắt buộc)<br>Body: `NoteInput` | 204 · không body |
| **POST** `/api/app/store/expire-reservations` | Giải phóng các đơn Pending hết hạn | Orders.Manage | —<br>Body: không body | 204 · không body |
| **POST** `/api/app/store/{id}/order-note` | Thêm ghi chú nội bộ | Orders.Manage | `id` (path, bắt buộc)<br>Body: `NoteInput` | 204 · không body |

## 12. Vận chuyển và đối soát COD

Vận chuyển nhập thủ công carrier/trackingCode. Ship chỉ từ Confirmed; gọi lại cùng vận đơn khi Shipped không trừ tồn lần hai. Deliver chỉ từ Shipped; gọi lại khi Delivered không đổi thêm. Delivered không đồng nghĩa đã thu tiền.

Collect-cod ghi nhận nhân viên đã nhận/đối soát đủ COD của đơn Delivered và Unpaid. Gọi lại khi Collected không thu lần hai. Không có cổng thanh toán hay webhook.

Receive-failed-delivery dùng khi đơn Shipped, COD chưa thu và hàng thực tế đã được nhận hoàn, đủ điều kiện nhập lại. Tác vụ nhập lại toàn bộ hàng của đơn rồi Cancelled. Không dùng endpoint này chỉ để ghi một lần giao thất bại khi hàng vẫn ở đơn vị vận chuyển.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **POST** `/api/app/store/{id}/ship-order` | Bàn giao vận chuyển, xuất tồn | Orders.Manage | `id` (path, bắt buộc)<br>Body: `ShipmentInput` | 204 · không body |
| **POST** `/api/app/store/{id}/deliver-order` | Xác nhận đã giao khách | Orders.Manage | `id` (path, bắt buộc)<br>Body: không body | 204 · không body |
| **POST** `/api/app/store/{id}/receive-failed-delivery` | Nhận hàng hoàn do giao thất bại | Orders.Manage | `id` (path, bắt buộc)<br>Body: `NoteInput` | 204 · không body |
| **POST** `/api/app/store/{id}/collect-cod` | Ghi nhận thu/đối soát COD | Payments.Manage | `id` (path, bắt buộc)<br>Body: `NoteInput` | 204 · không body |

## 13. Đổi size/màu, trả hàng và hoàn tiền

Khách tạo yêu cầu trong 7 ngày sau giao, chỉ cho dòng thuộc đơn mình. Tổng quantity của các yêu cầu chưa Rejected không vượt số lượng mua. Không có API khách tự hủy yêu cầu trong bản này.

Refund: replacementSkuId phải null. Exchange: SKU thay thế khác SKU cũ, cùng sản phẩm, cùng giá gốc của dòng đơn, còn bán. Khi duyệt Exchange sẽ giữ tồn SKU thay thế; từ chối sau duyệt giải phóng phần giữ đó. Hoàn tất Exchange xuất SKU thay thế; chưa có vận đơn riêng cho lần đổi hay thu chênh lệch giá.

Refund chỉ hoàn tất sau khi đã đối soát COD, cần đồng thời Returns.Manage và Payments.Manage. Hệ thống tính hoàn theo giá dòng sau giảm và số lượng, không hoàn phí ship. Đây là ghi nhận hoàn tiền đã thực hiện thủ công, không thực hiện chuyển tiền ngân hàng.

Chỉ lúc Completed và restock=true mới nhập hàng cũ về tồn bán được. Gọi lại đúng trạng thái hiện tại trả yêu cầu đang có, không cộng tồn/hoàn tiền lần nữa. Không thể sửa restock bằng cách gửi lại Completed.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **POST** `/api/app/store/request-return/{orderId}` | Gửi yêu cầu đổi/trả theo dòng đơn | Đăng nhập; dữ liệu của mình | `orderId` (path, bắt buộc)<br>Body: `ReturnInput` | 200 · `ReturnDto` |
| **GET** `/api/app/store/my-returns` | Danh sách yêu cầu cá nhân | Đăng nhập; dữ liệu của mình | `Skip` (query), `Take` (query), `Search` (query)<br>Body: không body | 200 · Mảng `ReturnDto` |
| **GET** `/api/app/store/admin-returns` | Danh sách yêu cầu quản trị | Returns.Manage | `Skip` (query), `Take` (query), `Search` (query)<br>Body: không body | 200 · Mảng `ReturnDto` |
| **POST** `/api/app/store/{id}/process-return` | Duyệt/từ chối/nhận/hoàn tất | Returns.Manage; hoàn tất Refund thêm Payments.Manage | `id` (path, bắt buộc)<br>Body: `ReturnActionInput` | 200 · `ReturnDto` |

## 14. Thông báo trong ứng dụng

Thông báo được lưu PostgreSQL theo userId khi có sự kiện đơn/đổi trả và khi hết hạn giữ hàng. Danh sách chỉ chứa thông báo của người đang đăng nhập. Có thể đánh dấu từng thông báo đã đọc. Chưa có push thời gian thực, email/SMS cho sự kiện đơn, xóa thông báo hay đánh dấu tất cả.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **GET** `/api/app/store/notifications` | Danh sách thông báo cá nhân | Đăng nhập; dữ liệu của mình | `Skip` (query), `Take` (query), `Search` (query)<br>Body: không body | 200 · Mảng `NotificationDto` |
| **POST** `/api/app/store/{id}/mark-notification-read` | Đánh dấu một thông báo đã đọc | Đăng nhập; dữ liệu của mình | `id` (path, bắt buộc)<br>Body: không body | 204 · không body |

## 15. Báo cáo vận hành

Nhập from/to UTC, from < to, tối đa 366 ngày. Khoảng là [from,to), lọc theo thời điểm tạo đơn. Các khoản tiền phản ánh trạng thái hiện tại của tập đơn được tạo trong kỳ, không phải dòng tiền phát sinh trong kỳ.

orders: số đơn; cancelled: số đơn đã hủy; deliveredSales: tổng Total của đơn Delivered (bao gồm ship, sau giảm, chưa trừ hoàn); codCollected: tổng Total của đơn có trạng thái thanh toán khác Unpaid; refunded: tổng tiền hoàn; netCollected = codCollected - refunded. openReturns là số yêu cầu chưa Completed/Rejected toàn cửa hàng tại hiện tại. lowStockSkus là số SKU active có available ≤ 5, không chỉ trong kỳ. Chưa có giá vốn/lợi nhuận, báo cáo sản phẩm bán chạy hoặc xuất Excel.

| API | Chức năng | Quyền/phạm vi | Đầu vào | Kết quả |
|---|---|---|---|---|
| **GET** `/api/app/store/report` | Xem báo cáo theo kỳ tạo đơn | Reports.View | `from` (query), `to` (query)<br>Body: không body | 200 · `ReportDto` |

## 16. Luồng tích hợp và JSON mẫu

Các UUID bên dưới chỉ minh họa. Thay bằng ID do API trả về.
Thời hạn voucher là dữ liệu ví dụ, cần chọn thời gian phù hợp lúc kiểm thử.

### 16.1. Chuẩn bị dữ liệu bán hàng

1. Tạo bốn lookup: Category, Brand, Color, Size.
2. Tạo sản phẩm với categoryId/brandId, published=true.
3. Tạo SKU với colorId/sizeId và giá.
4. Nhập tồn bằng adjust-stock.
5. Khách tạo địa chỉ, thêm SKU vào giỏ rồi lấy báo giá.

**Tạo sản phẩm — POST /api/app/store/product**

```json
{
  "name": "Giày thể thao Classic",
  "slug": "giay-the-thao-classic",
  "description": "Giày thể thao màu trắng",
  "imageUrl": "https://example.com/images/classic.jpg",
  "categoryId": "11111111-1111-4111-8111-111111111111",
  "brandId": "22222222-2222-4222-8222-222222222222",
  "published": true
}
```

**Tạo SKU — POST /api/app/store/sku/{productId}**

```json
{
  "colorId": "33333333-3333-4333-8333-333333333333",
  "sizeId": "44444444-4444-4444-8444-444444444444",
  "code": "CLASSIC-WHITE-EU42",
  "price": 500000,
  "active": true
}
```

**Nhập kho — POST /api/app/store/adjust-stock**

```json
{
  "skuId": "55555555-5555-4555-8555-555555555555",
  "delta": 10,
  "reason": "Nhập hàng đợt NH-001"
}
```

### 16.2. Voucher và đặt đơn

**Tạo voucher — POST /api/app/store/discount**

```json
{
  "name": "Giảm 10% cho khách mới",
  "code": "WELCOME10",
  "productId": null,
  "kind": 1,
  "value": 10,
  "maxDiscount": 100000,
  "minimumSubtotal": 300000,
  "startsAt": "2026-09-01T00:00:00Z",
  "endsAt": "2026-12-01T00:00:00Z",
  "usageLimit": 100,
  "perCustomerLimit": 1,
  "active": true
}
```

Tên chương trình không tạo điều kiện “khách mới” tự động: ví dụ này chỉ giới hạn mỗi khách một lượt dùng.
Bỏ code hoặc đặt null để tạo khuyến mãi tự động.

**Tạo địa chỉ — POST /api/app/store/address**

```json
{
  "recipient": "Nguyễn Văn A",
  "phone": "0901234567",
  "fullAddress": "Địa chỉ nhận hàng mẫu",
  "isDefault": true
}
```

**Đặt số lượng — POST /api/app/store/set-cart-item/{skuId}**

```json
{ "quantity": 2 }
```

**Lấy báo giá — POST /api/app/store/quote**

```json
{
  "addressId": "66666666-6666-4666-8666-666666666666",
  "coupon": "WELCOME10"
}
```

Response minh họa cho hai đôi giá 500.000đ/đôi:

```json
{
  "items": [
    {
      "skuId": "55555555-5555-4555-8555-555555555555",
      "code": "CLASSIC-WHITE-EU42",
      "productName": "Giày thể thao Classic",
      "quantity": 2,
      "unitPrice": 500000,
      "discount": 100000
    }
  ],
  "subtotal": 1000000,
  "discount": 100000,
  "shippingFee": 30000,
  "total": 930000,
  "discountId": "77777777-7777-4777-8777-777777777777",
  "currency": "VND"
}
```

**Đặt hàng — POST /api/app/store/place-order**

```json
{
  "addressId": "66666666-6666-4666-8666-666666666666",
  "coupon": "WELCOME10",
  "expectedTotal": 930000,
  "idempotencyKey": "checkout-20260912-client-0001"
}
```

Response là OrderDetailDto, gồm order/items/history, không phải riêng ID đơn.
Frontend lưu order.id và từng items[].id để tra cứu/đổi trả.
Nếu mất phản hồi, gửi lại cùng body và key. Không tự tạo key mới để retry cùng lần đặt.

### 16.3. Xác nhận, giao và thu COD

1. POST /api/app/store/{id}/confirm-order — không body.
2. POST /api/app/store/{id}/ship-order:

```json
{ "carrier": "Giao hàng thủ công", "trackingCode": "SHIP-001" }
```

3. POST /api/app/store/{id}/deliver-order — không body.
4. POST /api/app/store/{id}/collect-cod:

```json
{ "note": "Đã nhận đủ COD, đối soát phiếu COD-001" }
```

Nếu khách hủy Pending, dùng cancel-my-order với NoteInput.
Nếu nhân viên hủy trước giao, dùng cancel-order.
Nếu hàng đã đi giao nhưng hoàn về, chỉ dùng receive-failed-delivery sau khi nhận hàng thực tế.

### 16.4. Trả một phần và ghi nhận hoàn tiền

**POST /api/app/store/request-return/{orderId}**

```json
{
  "orderLineId": "88888888-8888-4888-8888-888888888888",
  "quantity": 1,
  "kind": 0,
  "replacementSkuId": null,
  "reason": "Không vừa chân"
}
```

Dùng id của yêu cầu trả về để gọi POST /api/app/store/{id}/process-return theo thứ tự:

```json
{ "state": 1, "note": "Đồng ý nhận trả", "restock": false }
```

```json
{ "state": 3, "note": "Đã nhận lại hàng", "restock": false }
```

```json
{ "state": 4, "note": "Đã kiểm tra và hoàn tiền thủ công", "restock": true }
```

Trong ví dụ hai đôi sau giảm còn 900.000đ tiền hàng, trả một đôi được hoàn 450.000đ;
phí ship 30.000đ không được phân bổ để hoàn. Server tự tính refundAmount, client không gửi số tiền hoàn.

Muốn đổi size: kind=1 và replacementSkuId là SKU cùng sản phẩm, khác SKU cũ, cùng giá gốc.
Không gửi lại yêu cầu trả cùng dòng nếu cần retry trước khi kiểm tra danh sách my-returns:
API tạo yêu cầu đổi trả chưa có idempotency key riêng.

### 16.5. Thứ tự xây frontend gợi ý

- Màn danh sách/chi tiết sản phẩm: products → product → skus.
- Màn giỏ: cart → set-cart-item/delete → quote.
- Màn thanh toán: addresses → quote → place-order.
- Màn đơn cá nhân: my-orders → my-order → cancel-my-order/request-return.
- Màn quản trị: admin-products/admin-skus, inventory, admin-orders, admin-returns.
- Màn ưu đãi: discounts; màn thông báo: notifications; dashboard: report.

## 17. Trạng thái, lỗi và giới hạn

### 17.1. Giá trị enum

| Enum | Giá trị |
|---|---|
| LookupKind | 0 Category; 1 Brand; 2 Color; 3 Size |
| OrderState | 0 Pending; 1 Confirmed; 2 Shipped; 3 Delivered; 4 Cancelled |
| CodState | 0 Unpaid; 1 Collected; 2 PartiallyRefunded; 3 Refunded |
| ReturnKind | 0 Refund; 1 Exchange |
| ReturnState | 0 Requested; 1 Approved; 2 Rejected; 3 Received; 4 Completed |
| DiscountKind | 0 Fixed; 1 Percentage |

### 17.2. Chuyển trạng thái

| Đối tượng | Chuyển hợp lệ | Tác động |
|---|---|---|
| Đơn | Pending → Confirmed | Tiếp tục giữ hàng; phải còn hạn |
| Đơn | Pending/Confirmed → Cancelled | Giải phóng giữ hàng, trả lượt ưu đãi |
| Đơn | Confirmed → Shipped | Xuất hàng, giải phóng phần giữ |
| Đơn | Shipped → Delivered | Lưu thời điểm giao |
| Đơn | Shipped → Cancelled qua receive-failed-delivery | Nhập hàng hoàn, chỉ khi COD chưa thu |
| COD | Unpaid → Collected | Đơn đã giao, ghi nhận thu đủ tiền |
| COD | Collected/PartiallyRefunded → trạng thái hoàn tiền | Ghi nhận Refund hoàn tất; không vượt tiền đã thu |
| Đổi trả | Requested → Approved hoặc Rejected | Đổi hàng được giữ SKU thay thế khi duyệt |
| Đổi trả | Approved → Received hoặc Rejected | Từ chối sau duyệt giải phóng SKU thay thế |
| Đổi trả | Received → Completed | Hoàn tiền/xuất hàng đổi; nhập lại hàng nếu restock |

Enum CodState có Refunded, nhưng trạng thái này chỉ được gán khi tổng refunded ≥ Total.
Vì chính sách hiện tại không hoàn phí ship, trả toàn bộ tiền hàng của đơn có phí ship vẫn có thể là PartiallyRefunded.

### 17.3. Phản hồi lỗi

Lỗi theo định dạng ABP. Client đọc cả HTTP status và error.message/validationErrors.
Không giả định mọi lỗi nghiệp vụ đều có cùng status, hoặc mọi 403 đều chỉ là thiếu permission:
status của exception nghiệp vụ do bộ ánh xạ ABP quyết định.

| Status thường gặp | Ý nghĩa |
|---|---|
| 400 | Dữ liệu đầu vào/validation không hợp lệ |
| 401 | Chưa có thông tin xác thực hợp lệ |
| 403 | Không được phép; có thể bao gồm exception nghiệp vụ theo mapping ABP |
| 404 | Entity/đường dẫn không tồn tại |
| 500 | Lỗi chưa được xử lý; cần tra log server |

Một số thông báo nghiệp vụ cần hiển thị: SKU không đủ tồn, voucher không hợp lệ/hết lượt,
giá thay đổi, key đã dùng cho yêu cầu khác, sai trạng thái đơn, vượt số lượng đổi trả.
Không retry vô hạn thao tác ghi; chỉ place-order có cơ chế key riêng đã nêu.

### 17.4. Phạm vi hiện tại

Đã có một kho, COD, giao/đổi trả thủ công, ưu đãi không cộng dồn, thông báo trong tài khoản và báo cáo cơ bản.
Chưa có guest checkout, gallery ảnh, wishlist, đánh giá, đa kho, cổng thanh toán,
webhook vận chuyển, email/SMS sự kiện đơn, đổi hàng chênh lệch giá, hoàn phí ship,
API chi tiết lịch sử riêng cho từng return hay báo cáo lợi nhuận.
Đây là giới hạn của implementation hiện tại, không phải API bị thiếu trong tài liệu.

## 18. Từ điển DTO

Các bảng dưới lấy kiểu/trường/ràng buộc từ OpenAPI đã lưu. “Required” chỉ phản ánh đánh dấu của schema,
không thay thế quy tắc nghiệp vụ phía trên. Trường UUID dạng value type có thể không mang Required
trong schema nhưng vẫn phải gửi ID hợp lệ; bỏ trống có thể thành UUID rỗng và bị từ chối.
PUT cần gửi đầy đủ input. Với input, các giá trị mặc định C# đáng chú ý:
active=true, take=20, quantity không có mặc định hợp lệ, published=false, isDefault=false, restock=false;
usageLimit=1.000.000, perCustomerLimit=1, maxDiscount=1.000.000.000.
Thời gian bắt đầu/kết thúc phải được gửi hợp lệ.

### AddressDto

Nguồn schema: `ShoeStore.Commerce.AddressDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `id` | uuid | — | Định danh bản ghi. |
| `recipient` | string / null | Cho phép null | Theo contract AddressDto. |
| `phone` | string / null | Cho phép null | Theo contract AddressDto. |
| `fullAddress` | string / null | Cho phép null | Theo contract AddressDto. |
| `isDefault` | boolean | — | Địa chỉ mặc định. |

### AddressInput

Nguồn schema: `ShoeStore.Commerce.AddressInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `recipient` | string | Required; Độ dài min: 0; Độ dài max: 150 | Theo contract AddressInput. |
| `phone` | tel | Required; Độ dài min: 0; Độ dài max: 30 | Theo contract AddressInput. |
| `fullAddress` | string | Required; Độ dài min: 0; Độ dài max: 500 | Theo contract AddressInput. |
| `isDefault` | boolean | — | Địa chỉ mặc định. |

### CartLineDto

Nguồn schema: `ShoeStore.Commerce.CartLineDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `skuId` | uuid | — | Định danh SKU. |
| `code` | string / null | Cho phép null | Mã SKU hoặc mã voucher tùy DTO. |
| `quantity` | int32 | — | Số lượng đơn vị giày. |
| `unitPrice` | double | — | Giá một đơn vị, VND. |
| `available` | int32 | — | Tồn khả dụng = onHand − reserved. |

### CheckoutInput

Nguồn schema: `ShoeStore.Commerce.CheckoutInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `addressId` | uuid | — | Theo contract CheckoutInput. |
| `coupon` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 50 | Theo contract CheckoutInput. |

### CodState

Nguồn schema: `ShoeStore.Commerce.CodState`.

Giá trị: `0`, `1`, `2`, `3`. Xem bảng enum để biết tên.

### DiscountDto

Nguồn schema: `ShoeStore.Commerce.DiscountDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `id` | uuid | — | Định danh bản ghi. |
| `code` | string / null | Cho phép null | Mã SKU hoặc mã voucher tùy DTO. |
| `name` | string / null | Cho phép null | Theo contract DiscountDto. |
| `productId` | uuid / null | Cho phép null | Sản phẩm liên quan; nếu input Discount thì null nghĩa toàn giỏ. |
| `kind` | DiscountKind | — | Enum loại lookup/discount/return tùy DTO. |
| `value` | double | — | Số tiền hoặc tỷ lệ phần trăm tùy kind. |
| `maxDiscount` | double | — | Trần tiền giảm VND. |
| `minimumSubtotal` | double | — | Tổng tiền hàng tối thiểu trước giảm. |
| `startsAt` | date-time | — | Theo contract DiscountDto. |
| `endsAt` | date-time | — | Theo contract DiscountDto. |
| `usageLimit` | int32 | — | Giới hạn tổng lượt. |
| `perCustomerLimit` | int32 | — | Giới hạn lượt mỗi người dùng. |
| `active` | boolean | — | Theo contract DiscountDto. |

### DiscountInput

Nguồn schema: `ShoeStore.Commerce.DiscountInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `code` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 50; Pattern: ^[A-Za-z0-9_-]+$ | Mã SKU hoặc mã voucher tùy DTO. |
| `name` | string | Required; Độ dài min: 0; Độ dài max: 150 | Theo contract DiscountInput. |
| `productId` | uuid / null | Cho phép null | Sản phẩm liên quan; nếu input Discount thì null nghĩa toàn giỏ. |
| `kind` | DiscountKind | — | Enum loại lookup/discount/return tùy DTO. |
| `value` | double | Min: 1; Max: 1000000000 | Số tiền hoặc tỷ lệ phần trăm tùy kind. |
| `maxDiscount` | double | Min: 1; Max: 1000000000 | Trần tiền giảm VND. |
| `minimumSubtotal` | double | Min: 0; Max: 1000000000 | Tổng tiền hàng tối thiểu trước giảm. |
| `startsAt` | date-time | — | Theo contract DiscountInput. |
| `endsAt` | date-time | — | Theo contract DiscountInput. |
| `usageLimit` | int32 | Min: 1; Max: 1000000000 | Giới hạn tổng lượt. |
| `perCustomerLimit` | int32 | Min: 1; Max: 1000000 | Giới hạn lượt mỗi người dùng. |
| `active` | boolean | — | Theo contract DiscountInput. |

### DiscountKind

Nguồn schema: `ShoeStore.Commerce.DiscountKind`.

Giá trị: `0`, `1`. Xem bảng enum để biết tên.

### HistoryDto

Nguồn schema: `ShoeStore.Commerce.HistoryDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `at` | date-time | — | Thời điểm sự kiện UTC. |
| `actorId` | uuid / null | Cho phép null | Người thao tác; có thể null với tác vụ hệ thống. |
| `action` | string / null | Cho phép null | Theo contract HistoryDto. |
| `note` | string / null | Cho phép null | Nội dung thao tác; có thể hiển thị khách trừ InternalNote. |

### InventoryDto

Nguồn schema: `ShoeStore.Commerce.InventoryDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `skuId` | uuid | — | Định danh SKU. |
| `code` | string / null | Cho phép null | Mã SKU hoặc mã voucher tùy DTO. |
| `onHand` | int32 | — | Tồn vật lý bán được. |
| `reserved` | int32 | — | Số lượng đang giữ. |
| `available` | int32 | — | Tồn khả dụng = onHand − reserved. |

### LookupDto

Nguồn schema: `ShoeStore.Commerce.LookupDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `id` | uuid | — | Định danh bản ghi. |
| `kind` | LookupKind | — | Enum loại lookup/discount/return tùy DTO. |
| `name` | string / null | Cho phép null | Theo contract LookupDto. |
| `active` | boolean | — | Theo contract LookupDto. |

### LookupInput

Nguồn schema: `ShoeStore.Commerce.LookupInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `kind` | LookupKind | — | Enum loại lookup/discount/return tùy DTO. |
| `name` | string | Required; Độ dài min: 1; Độ dài max: 100 | Theo contract LookupInput. |
| `active` | boolean | — | Theo contract LookupInput. |

### LookupKind

Nguồn schema: `ShoeStore.Commerce.LookupKind`.

Giá trị: `0`, `1`, `2`, `3`. Xem bảng enum để biết tên.

### MovementDto

Nguồn schema: `ShoeStore.Commerce.MovementDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `id` | uuid | — | Định danh bản ghi. |
| `skuId` | uuid | — | Định danh SKU. |
| `delta` | int32 | — | Chênh lệch tồn; dương nhập, âm giảm. |
| `balance` | int32 | — | Tồn vật lý sau giao dịch. |
| `reason` | string / null | Cho phép null | Lý do nhập/điều chỉnh/đổi trả. |
| `orderId` | uuid / null | Cho phép null | Định danh đơn hàng. |
| `at` | date-time | — | Thời điểm sự kiện UTC. |

### NoteInput

Nguồn schema: `ShoeStore.Commerce.NoteInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `note` | string | Required; Độ dài min: 0; Độ dài max: 500 | Nội dung thao tác; có thể hiển thị khách trừ InternalNote. |

### NotificationDto

Nguồn schema: `ShoeStore.Commerce.NotificationDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `id` | uuid | — | Định danh bản ghi. |
| `orderId` | uuid / null | Cho phép null | Định danh đơn hàng. |
| `message` | string / null | Cho phép null | Theo contract NotificationDto. |
| `isRead` | boolean | — | Đã đọc thông báo. |
| `at` | date-time | — | Thời điểm sự kiện UTC. |

### OrderDetailDto

Nguồn schema: `ShoeStore.Commerce.OrderDetailDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `order` | OrderDto | — | Theo contract OrderDetailDto. |
| `items` | array<OrderLineDto> | Cho phép null | Theo contract OrderDetailDto. |
| `history` | array<HistoryDto> | Cho phép null | Theo contract OrderDetailDto. |

### OrderDto

Nguồn schema: `ShoeStore.Commerce.OrderDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `id` | uuid | — | Định danh bản ghi. |
| `number` | string / null | Cho phép null | Theo contract OrderDto. |
| `state` | OrderState | — | Enum trạng thái đơn/đổi trả tùy DTO. |
| `paymentState` | CodState | — | Enum CodState. |
| `addressSnapshot` | string / null | Cho phép null | Chuỗi JSON địa chỉ tại lúc đặt đơn. |
| `subtotal` | double | — | Tiền hàng trước giảm và phí ship. |
| `discount` | double | — | Giá trị giảm của giỏ hoặc của cả dòng (không phải mỗi đơn vị). |
| `shippingFee` | double | — | Phí vận chuyển. |
| `total` | double | — | Tổng phải thu, gồm phí ship. |
| `refunded` | double | — | Tiền đã ghi nhận hoàn. |
| `reservationExpiresAt` | date-time | — | Theo contract OrderDto. |
| `carrier` | string / null | Cho phép null | Tên hãng/đơn vị vận chuyển thủ công. |
| `trackingCode` | string / null | Cho phép null | Mã vận đơn nhập thủ công. |

### OrderLineDto

Nguồn schema: `ShoeStore.Commerce.OrderLineDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `id` | uuid | — | Định danh bản ghi. |
| `skuId` | uuid | — | Định danh SKU. |
| `productName` | string / null | Cho phép null | Theo contract OrderLineDto. |
| `skuCode` | string / null | Cho phép null | Theo contract OrderLineDto. |
| `quantity` | int32 | — | Số lượng đơn vị giày. |
| `unitPrice` | double | — | Giá một đơn vị, VND. |
| `discount` | double | — | Giá trị giảm của giỏ hoặc của cả dòng (không phải mỗi đơn vị). |

### OrderState

Nguồn schema: `ShoeStore.Commerce.OrderState`.

Giá trị: `0`, `1`, `2`, `3`, `4`. Xem bảng enum để biết tên.

### PlaceOrderInput

Nguồn schema: `ShoeStore.Commerce.PlaceOrderInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `addressId` | uuid | — | Theo contract PlaceOrderInput. |
| `coupon` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 50 | Theo contract PlaceOrderInput. |
| `idempotencyKey` | string | Required; Độ dài min: 8; Độ dài max: 100 | Key retry tạo đơn, nằm trong body. |
| `expectedTotal` | double | Min: 0; Max: 100000000000 | Tổng từ quote để phát hiện thay đổi giá. |

### ProductDto

Nguồn schema: `ShoeStore.Commerce.ProductDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `id` | uuid | — | Định danh bản ghi. |
| `name` | string / null | Cho phép null | Theo contract ProductDto. |
| `slug` | string / null | Cho phép null | Theo contract ProductDto. |
| `description` | string / null | Cho phép null | Theo contract ProductDto. |
| `imageUrl` | string / null | Cho phép null | URL HTTP/HTTPS hoặc đường dẫn ảnh local hiện tại. Upload file qua API riêng, xem PRODUCT-IMAGES.md. |
| `categoryId` | uuid | — | Theo contract ProductDto. |
| `brandId` | uuid | — | Theo contract ProductDto. |
| `published` | boolean | — | Sản phẩm được xuất bản để bán. |

### ProductInput

Nguồn schema: `ShoeStore.Commerce.ProductInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `name` | string | Required; Độ dài min: 0; Độ dài max: 200 | Theo contract ProductInput. |
| `slug` | string | Required; Độ dài min: 0; Độ dài max: 200; Pattern: ^[a-z0-9]+(?:-[a-z0-9]+)*$ | Theo contract ProductInput. |
| `description` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 5000 | Theo contract ProductInput. |
| `imageUrl` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 1000 | URL HTTP/HTTPS hoặc đường dẫn ảnh local hiện tại. Upload file qua API riêng, xem PRODUCT-IMAGES.md. |
| `categoryId` | uuid | — | Theo contract ProductInput. |
| `brandId` | uuid | — | Theo contract ProductInput. |
| `published` | boolean | — | Sản phẩm được xuất bản để bán. |

### QuantityInput

Nguồn schema: `ShoeStore.Commerce.QuantityInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `quantity` | int32 | Min: 1; Max: 100 | Số lượng đơn vị giày. |

### QuoteDto

Nguồn schema: `ShoeStore.Commerce.QuoteDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `items` | array<QuoteLineDto> | Cho phép null | Theo contract QuoteDto. |
| `subtotal` | double | — | Tiền hàng trước giảm và phí ship. |
| `discount` | double | — | Giá trị giảm của giỏ hoặc của cả dòng (không phải mỗi đơn vị). |
| `shippingFee` | double | — | Phí vận chuyển. |
| `total` | double | — | Tổng phải thu, gồm phí ship. |
| `discountId` | uuid / null | Cho phép null | Theo contract QuoteDto. |
| `currency` | string / null | Cho phép null | Theo contract QuoteDto. |

### QuoteLineDto

Nguồn schema: `ShoeStore.Commerce.QuoteLineDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `skuId` | uuid | — | Định danh SKU. |
| `code` | string / null | Cho phép null | Mã SKU hoặc mã voucher tùy DTO. |
| `productName` | string / null | Cho phép null | Theo contract QuoteLineDto. |
| `quantity` | int32 | — | Số lượng đơn vị giày. |
| `unitPrice` | double | — | Giá một đơn vị, VND. |
| `discount` | double | — | Giá trị giảm của giỏ hoặc của cả dòng (không phải mỗi đơn vị). |

### ReportDto

Nguồn schema: `ShoeStore.Commerce.ReportDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `from` | date-time | — | Bắt đầu kỳ UTC, bao gồm. |
| `to` | date-time | — | Kết thúc kỳ UTC, không bao gồm. |
| `orders` | int32 | — | Theo contract ReportDto. |
| `cancelled` | int32 | — | Theo contract ReportDto. |
| `deliveredSales` | double | — | Theo contract ReportDto. |
| `codCollected` | double | — | Theo contract ReportDto. |
| `refunded` | double | — | Tiền đã ghi nhận hoàn. |
| `netCollected` | double | — | Theo contract ReportDto. |
| `openReturns` | int32 | — | Theo contract ReportDto. |
| `lowStockSkus` | int32 | — | Theo contract ReportDto. |

### ReturnActionInput

Nguồn schema: `ShoeStore.Commerce.ReturnActionInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `note` | string | Required; Độ dài min: 0; Độ dài max: 500 | Nội dung thao tác; có thể hiển thị khách trừ InternalNote. |
| `state` | ReturnState | — | Enum trạng thái đơn/đổi trả tùy DTO. |
| `restock` | boolean | — | Nhập hàng trả về tồn bán được khi hoàn tất kiểm tra. |

### ReturnDto

Nguồn schema: `ShoeStore.Commerce.ReturnDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `id` | uuid | — | Định danh bản ghi. |
| `orderId` | uuid | — | Định danh đơn hàng. |
| `orderLineId` | uuid | — | Định danh dòng hàng của đơn. |
| `kind` | ReturnKind | — | Enum loại lookup/discount/return tùy DTO. |
| `state` | ReturnState | — | Enum trạng thái đơn/đổi trả tùy DTO. |
| `quantity` | int32 | — | Số lượng đơn vị giày. |
| `reason` | string / null | Cho phép null | Lý do nhập/điều chỉnh/đổi trả. |
| `replacementSkuId` | uuid / null | Cho phép null | SKU thay thế cho Exchange. |
| `refundAmount` | double | — | Tiền hoàn do server tính. |
| `restock` | boolean | — | Nhập hàng trả về tồn bán được khi hoàn tất kiểm tra. |

### ReturnInput

Nguồn schema: `ShoeStore.Commerce.ReturnInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `orderLineId` | uuid | — | Định danh dòng hàng của đơn. |
| `quantity` | int32 | Min: 1; Max: 100 | Số lượng đơn vị giày. |
| `kind` | ReturnKind | — | Enum loại lookup/discount/return tùy DTO. |
| `replacementSkuId` | uuid / null | Cho phép null | SKU thay thế cho Exchange. |
| `reason` | string | Required; Độ dài min: 0; Độ dài max: 500 | Lý do nhập/điều chỉnh/đổi trả. |

### ReturnKind

Nguồn schema: `ShoeStore.Commerce.ReturnKind`.

Giá trị: `0`, `1`. Xem bảng enum để biết tên.

### ReturnState

Nguồn schema: `ShoeStore.Commerce.ReturnState`.

Giá trị: `0`, `1`, `2`, `3`, `4`. Xem bảng enum để biết tên.

### ShipmentInput

Nguồn schema: `ShoeStore.Commerce.ShipmentInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `carrier` | string | Required; Độ dài min: 0; Độ dài max: 100 | Tên hãng/đơn vị vận chuyển thủ công. |
| `trackingCode` | string | Required; Độ dài min: 0; Độ dài max: 100 | Mã vận đơn nhập thủ công. |

### SkuDto

Nguồn schema: `ShoeStore.Commerce.SkuDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `id` | uuid | — | Định danh bản ghi. |
| `productId` | uuid | — | Sản phẩm liên quan; nếu input Discount thì null nghĩa toàn giỏ. |
| `colorId` | uuid | — | Theo contract SkuDto. |
| `sizeId` | uuid | — | Theo contract SkuDto. |
| `code` | string / null | Cho phép null | Mã SKU hoặc mã voucher tùy DTO. |
| `price` | double | — | Giá bán SKU, VND. |
| `active` | boolean | — | Theo contract SkuDto. |
| `available` | int32 | — | Tồn khả dụng = onHand − reserved. |

### SkuInput

Nguồn schema: `ShoeStore.Commerce.SkuInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `colorId` | uuid | — | Theo contract SkuInput. |
| `sizeId` | uuid | — | Theo contract SkuInput. |
| `code` | string | Required; Độ dài min: 0; Độ dài max: 80; Pattern: ^[A-Za-z0-9_-]+$ | Mã SKU hoặc mã voucher tùy DTO. |
| `price` | double | Min: 1; Max: 1000000000 | Giá bán SKU, VND. |
| `active` | boolean | — | Theo contract SkuInput. |

### StockInput

Nguồn schema: `ShoeStore.Commerce.StockInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `skuId` | uuid | — | Định danh SKU. |
| `delta` | int32 | Min: -1000000; Max: 1000000 | Chênh lệch tồn; dương nhập, âm giảm. |
| `reason` | string | Required; Độ dài min: 0; Độ dài max: 500 | Lý do nhập/điều chỉnh/đổi trả. |

### ChangePasswordInput

Nguồn schema: `Volo.Abp.Account.ChangePasswordInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `currentPassword` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 128 | Theo contract ChangePasswordInput. |
| `newPassword` | string | Required; Độ dài min: 0; Độ dài max: 128 | Theo contract ChangePasswordInput. |

### ProfileDto

Nguồn schema: `Volo.Abp.Account.ProfileDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `extraProperties` | object / null | Cho phép null | Theo contract ProfileDto. |
| `userName` | string / null | Cho phép null | Theo contract ProfileDto. |
| `email` | string / null | Cho phép null | Theo contract ProfileDto. |
| `name` | string / null | Cho phép null | Theo contract ProfileDto. |
| `surname` | string / null | Cho phép null | Theo contract ProfileDto. |
| `phoneNumber` | string / null | Cho phép null | Theo contract ProfileDto. |
| `isExternal` | boolean | — | Theo contract ProfileDto. |
| `hasPassword` | boolean | — | Theo contract ProfileDto. |
| `concurrencyStamp` | string / null | Cho phép null | Theo contract ProfileDto. |

### RegisterDto

Nguồn schema: `Volo.Abp.Account.RegisterDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `extraProperties` | object / null | Cho phép null | Theo contract RegisterDto. |
| `userName` | string | Required; Độ dài min: 0; Độ dài max: 256 | Theo contract RegisterDto. |
| `emailAddress` | email | Required; Độ dài min: 0; Độ dài max: 256 | Theo contract RegisterDto. |
| `password` | password | Required; Độ dài min: 0; Độ dài max: 128 | Theo contract RegisterDto. |
| `appName` | string | Required; Độ dài min: 1 | Theo contract RegisterDto. |

### ResetPasswordDto

Nguồn schema: `Volo.Abp.Account.ResetPasswordDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `userId` | uuid | — | Theo contract ResetPasswordDto. |
| `resetToken` | string | Required; Độ dài min: 1 | Theo contract ResetPasswordDto. |
| `password` | string | Required; Độ dài min: 1 | Theo contract ResetPasswordDto. |

### SendPasswordResetCodeDto

Nguồn schema: `Volo.Abp.Account.SendPasswordResetCodeDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `email` | email | Required; Độ dài min: 0; Độ dài max: 256 | Theo contract SendPasswordResetCodeDto. |
| `appName` | string | Required; Độ dài min: 1 | Theo contract SendPasswordResetCodeDto. |
| `returnUrl` | string / null | Cho phép null | Theo contract SendPasswordResetCodeDto. |
| `returnUrlHash` | string / null | Cho phép null | Theo contract SendPasswordResetCodeDto. |

### UpdateProfileDto

Nguồn schema: `Volo.Abp.Account.UpdateProfileDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `extraProperties` | object / null | Cho phép null | Theo contract UpdateProfileDto. |
| `userName` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 256 | Theo contract UpdateProfileDto. |
| `email` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 256 | Theo contract UpdateProfileDto. |
| `name` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 64 | Theo contract UpdateProfileDto. |
| `surname` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 64 | Theo contract UpdateProfileDto. |
| `phoneNumber` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 16 | Theo contract UpdateProfileDto. |
| `concurrencyStamp` | string / null | Cho phép null | Theo contract UpdateProfileDto. |

### VerifyPasswordResetTokenInput

Nguồn schema: `Volo.Abp.Account.VerifyPasswordResetTokenInput`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `userId` | uuid | — | Theo contract VerifyPasswordResetTokenInput. |
| `resetToken` | string | Required; Độ dài min: 1 | Theo contract VerifyPasswordResetTokenInput. |

### AbpLoginResult

Nguồn schema: `Volo.Abp.Account.Web.Areas.Account.Controllers.Models.AbpLoginResult`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `result` | LoginResultType | — | Theo contract AbpLoginResult. |
| `description` | string / null | Cho phép null | Theo contract AbpLoginResult. |

### UserLoginInfo

Nguồn schema: `Volo.Abp.Account.Web.Areas.Account.Controllers.Models.UserLoginInfo`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `userNameOrEmailAddress` | string | Required; Độ dài min: 0; Độ dài max: 255 | Theo contract UserLoginInfo. |
| `password` | password | Required; Độ dài min: 0; Độ dài max: 32 | Theo contract UserLoginInfo. |
| `rememberMe` | boolean | — | Theo contract UserLoginInfo. |

### 0, Culture=neutral, PublicKeyToken=null]]

Nguồn schema: `Volo.Abp.Application.Dtos.ListResultDto`1[[Volo.Abp.Identity.IdentityRoleDto, Volo.Abp.Identity.Application.Contracts, Version=10.6.0.0, Culture=neutral, PublicKeyToken=null]]`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `items` | array<IdentityRoleDto> | Cho phép null | Theo contract 0, Culture=neutral, PublicKeyToken=null]]. |

### 0, Culture=neutral, PublicKeyToken=null]]

Nguồn schema: `Volo.Abp.Application.Dtos.PagedResultDto`1[[Volo.Abp.Identity.IdentityRoleDto, Volo.Abp.Identity.Application.Contracts, Version=10.6.0.0, Culture=neutral, PublicKeyToken=null]]`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `items` | array<IdentityRoleDto> | Cho phép null | Theo contract 0, Culture=neutral, PublicKeyToken=null]]. |
| `totalCount` | int64 | — | Theo contract 0, Culture=neutral, PublicKeyToken=null]]. |

### 0, Culture=neutral, PublicKeyToken=null]]

Nguồn schema: `Volo.Abp.Application.Dtos.PagedResultDto`1[[Volo.Abp.Identity.IdentityUserDto, Volo.Abp.Identity.Application.Contracts, Version=10.6.0.0, Culture=neutral, PublicKeyToken=null]]`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `items` | array<IdentityUserDto> | Cho phép null | Theo contract 0, Culture=neutral, PublicKeyToken=null]]. |
| `totalCount` | int64 | — | Theo contract 0, Culture=neutral, PublicKeyToken=null]]. |

### IdentityRoleCreateDto

Nguồn schema: `Volo.Abp.Identity.IdentityRoleCreateDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `extraProperties` | object / null | Cho phép null | Theo contract IdentityRoleCreateDto. |
| `name` | string | Required; Độ dài min: 0; Độ dài max: 256 | Theo contract IdentityRoleCreateDto. |
| `isDefault` | boolean | — | Địa chỉ mặc định. |
| `isPublic` | boolean | — | Theo contract IdentityRoleCreateDto. |

### IdentityRoleDto

Nguồn schema: `Volo.Abp.Identity.IdentityRoleDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `extraProperties` | object / null | Cho phép null | Theo contract IdentityRoleDto. |
| `id` | uuid | — | Định danh bản ghi. |
| `name` | string / null | Cho phép null | Theo contract IdentityRoleDto. |
| `isDefault` | boolean | — | Địa chỉ mặc định. |
| `isStatic` | boolean | — | Theo contract IdentityRoleDto. |
| `isPublic` | boolean | — | Theo contract IdentityRoleDto. |
| `concurrencyStamp` | string / null | Cho phép null | Theo contract IdentityRoleDto. |
| `creationTime` | date-time | — | Theo contract IdentityRoleDto. |

### IdentityRoleUpdateDto

Nguồn schema: `Volo.Abp.Identity.IdentityRoleUpdateDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `extraProperties` | object / null | Cho phép null | Theo contract IdentityRoleUpdateDto. |
| `name` | string | Required; Độ dài min: 0; Độ dài max: 256 | Theo contract IdentityRoleUpdateDto. |
| `isDefault` | boolean | — | Địa chỉ mặc định. |
| `isPublic` | boolean | — | Theo contract IdentityRoleUpdateDto. |
| `concurrencyStamp` | string / null | Cho phép null | Theo contract IdentityRoleUpdateDto. |

### IdentityUserCreateDto

Nguồn schema: `Volo.Abp.Identity.IdentityUserCreateDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `extraProperties` | object / null | Cho phép null | Theo contract IdentityUserCreateDto. |
| `userName` | string | Required; Độ dài min: 0; Độ dài max: 256 | Theo contract IdentityUserCreateDto. |
| `name` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 64 | Theo contract IdentityUserCreateDto. |
| `surname` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 64 | Theo contract IdentityUserCreateDto. |
| `email` | email | Required; Độ dài min: 0; Độ dài max: 256 | Theo contract IdentityUserCreateDto. |
| `phoneNumber` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 16 | Theo contract IdentityUserCreateDto. |
| `isActive` | boolean | — | Theo contract IdentityUserCreateDto. |
| `lockoutEnabled` | boolean | — | Theo contract IdentityUserCreateDto. |
| `roleNames` | array<string> | Cho phép null | Theo contract IdentityUserCreateDto. |
| `password` | string | Required; Độ dài min: 0; Độ dài max: 128 | Theo contract IdentityUserCreateDto. |

### IdentityUserDto

Nguồn schema: `Volo.Abp.Identity.IdentityUserDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `extraProperties` | object / null | Cho phép null | Theo contract IdentityUserDto. |
| `id` | uuid | — | Định danh bản ghi. |
| `creationTime` | date-time | — | Theo contract IdentityUserDto. |
| `creatorId` | uuid / null | Cho phép null | Theo contract IdentityUserDto. |
| `lastModificationTime` | date-time / null | Cho phép null | Theo contract IdentityUserDto. |
| `lastModifierId` | uuid / null | Cho phép null | Theo contract IdentityUserDto. |
| `isDeleted` | boolean | — | Theo contract IdentityUserDto. |
| `deleterId` | uuid / null | Cho phép null | Theo contract IdentityUserDto. |
| `deletionTime` | date-time / null | Cho phép null | Theo contract IdentityUserDto. |
| `tenantId` | uuid / null | Cho phép null | Theo contract IdentityUserDto. |
| `userName` | string / null | Cho phép null | Theo contract IdentityUserDto. |
| `name` | string / null | Cho phép null | Theo contract IdentityUserDto. |
| `surname` | string / null | Cho phép null | Theo contract IdentityUserDto. |
| `email` | string / null | Cho phép null | Theo contract IdentityUserDto. |
| `emailConfirmed` | boolean | — | Theo contract IdentityUserDto. |
| `phoneNumber` | string / null | Cho phép null | Theo contract IdentityUserDto. |
| `phoneNumberConfirmed` | boolean | — | Theo contract IdentityUserDto. |
| `isActive` | boolean | — | Theo contract IdentityUserDto. |
| `lockoutEnabled` | boolean | — | Theo contract IdentityUserDto. |
| `accessFailedCount` | int32 | — | Theo contract IdentityUserDto. |
| `lockoutEnd` | date-time / null | Cho phép null | Theo contract IdentityUserDto. |
| `concurrencyStamp` | string / null | Cho phép null | Theo contract IdentityUserDto. |
| `entityVersion` | int32 | — | Theo contract IdentityUserDto. |
| `lastPasswordChangeTime` | date-time / null | Cho phép null | Theo contract IdentityUserDto. |

### IdentityUserUpdateDto

Nguồn schema: `Volo.Abp.Identity.IdentityUserUpdateDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `extraProperties` | object / null | Cho phép null | Theo contract IdentityUserUpdateDto. |
| `userName` | string | Required; Độ dài min: 0; Độ dài max: 256 | Theo contract IdentityUserUpdateDto. |
| `name` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 64 | Theo contract IdentityUserUpdateDto. |
| `surname` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 64 | Theo contract IdentityUserUpdateDto. |
| `email` | email | Required; Độ dài min: 0; Độ dài max: 256 | Theo contract IdentityUserUpdateDto. |
| `phoneNumber` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 16 | Theo contract IdentityUserUpdateDto. |
| `isActive` | boolean | — | Theo contract IdentityUserUpdateDto. |
| `lockoutEnabled` | boolean | — | Theo contract IdentityUserUpdateDto. |
| `roleNames` | array<string> | Cho phép null | Theo contract IdentityUserUpdateDto. |
| `password` | string / null | Cho phép null; Độ dài min: 0; Độ dài max: 128 | Theo contract IdentityUserUpdateDto. |
| `concurrencyStamp` | string / null | Cho phép null | Theo contract IdentityUserUpdateDto. |

### IdentityUserUpdateRolesDto

Nguồn schema: `Volo.Abp.Identity.IdentityUserUpdateRolesDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `roleNames` | array<string> | Required | Theo contract IdentityUserUpdateRolesDto. |

### GetPermissionListResultDto

Nguồn schema: `Volo.Abp.PermissionManagement.GetPermissionListResultDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `entityDisplayName` | string / null | Cho phép null | Theo contract GetPermissionListResultDto. |
| `groups` | array<PermissionGroupDto> | Cho phép null | Theo contract GetPermissionListResultDto. |

### UpdatePermissionsDto

Nguồn schema: `Volo.Abp.PermissionManagement.UpdatePermissionsDto`.

| Trường | Kiểu | Ràng buộc schema | Mô tả |
|---|---|---|---|
| `permissions` | array<UpdatePermissionDto> | Cho phép null | Theo contract UpdatePermissionsDto. |

## 19. Nguồn đối chiếu và tài liệu liên quan

- [OpenAPI snapshot](openapi.json): method, path, query, schema request/response.
- [Hướng dẫn triển khai giai đoạn 1](PHASE1.md): chạy, migration, test, giới hạn.
- [Danh sách API rút gọn](API.md).
- Mã nguồn: `src/ShoeStore.Application/Commerce/StoreAppService*.cs`.
- DTO: `src/ShoeStore.Application.Contracts/Commerce/CommerceDtos.cs`.
- Enum: `src/ShoeStore.Domain.Shared/Commerce/CommerceEnums.cs`.
- Quyền: `src/ShoeStore.Application.Contracts/Permissions`; seed vai trò: `src/ShoeStore.Domain/Commerce/CommerceRoleSeedContributor.cs`.

Tài liệu bao phủ **51 API commerce** (48 API Store và 3 API ảnh trong [tài liệu ảnh](PRODUCT-IMAGES.md)) và **23 API tài khoản/quản trị chính**.
Các endpoint hạ tầng ABP khác (localization, feature, setting, resource permissions nâng cao, lookup phụ trợ)
vẫn có trong OpenAPI nhưng không phải chức năng bán giày được mô tả ở đây.
