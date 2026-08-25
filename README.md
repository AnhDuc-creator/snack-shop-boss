# Snack Shop Boss

Dựng lại minigame quầy đồ ăn vặt trong _Nancy Drew #21: Warnings at Waverly Academy_
(Her Interactive, 2009) để chạy trên trình duyệt.

Điểm khác biệt so với một bản clone thông thường: **mọi con số trong game đều lấy từ bản
gốc** — toạ độ sprite, thời gian lò nướng, bảng xác suất sinh đơn, âm lượng từng tiếng động
— đọc ngược từ bytecode Lua 5.1 trong `Ciftree.dat`, không phải ước lượng bằng mắt.
Chi tiết ở [`docs/spec.md`](docs/spec.md).

## Chơi ngay

<!-- Sửa lại đường dẫn sau khi bật GitHub Pages -->

https://AnhDuc-creator.github.io/snack-shop-boss/

Không cần cài gì, không cần sở hữu bản gốc.

## Điều khiển

| Thao tác                      | Kết quả                                     |
| ----------------------------- | ------------------------------------------- |
| Chuột trái                    | Nhặt món, đặt món, bấm nút                  |
| Chuột phải                    | Bỏ món đang cầm                             |
| Con lăn                       | Cuộn danh sách đơn                          |
| Rê chuột lên mép khung Orders | Tự cuộn                                     |
| `R`                           | Vòng đơn mới                                |
| `D`                           | Hiện khung bấm (đỏ là trạm, xanh là ô khay) |
| `S`                           | Đổi giữa mượt và sắc cạnh                   |
| `M`                           | Tắt bật tiếng                               |

## Luật chơi

Đọc ticket ở khung Orders bên phải, xếp đủ món của **một** đơn lên **một** khay, rồi bấm
Pick Up. Mỗi đơn có tối đa một món mỗi nhóm: đồ uống, trái cây, sandwich, snack, tráng
miệng — nhưng không phải đơn nào cũng có đủ cả năm.

Sandwich phải xếp **đúng thứ tự từng lớp** như ticket ghi, đọc từ dưới lên. Cookie phải
nướng trong lò trước khi phục vụ. Bánh mì và bagel có thể nướng hoặc không, tuỳ đơn.

Có hai khay để làm song song. Nộp khay xong thì chỗ đó trống bốn giây mới có khay mới.

## Dựng lại từ mã nguồn

Chỉ cần khi bạn muốn tự trích asset từ bản game của mình.

**Cần có:** bản game gốc trên Steam, Python 3.11 trở lên, và ffmpeg
(`winget install Gyan.FFmpeg`).

```
py tools/setup.py "D:\SteamLibrary\steamapps\common\Nancy Drew Warnings at Waverly Academy"
```

Lệnh này giải nén `Ciftree.dat`, tách ảnh nền từ file `.bik`, chuyển âm thanh `.HIS`, rồi
chép mọi thứ cần thiết vào `game/assets/`. **Chỉ đọc thư mục game, không bao giờ ghi vào
đó.** Sau đó mở `game/index.html` bằng Live Server.

## Cấu trúc

```
docs/spec.md      đặc tả trích từ bản gốc — nguồn sự thật cho mọi con số
docs/backlog.md   việc chưa làm
tools/            công cụ giải nén và đọc bytecode Lua
research/         mẫu file nhỏ giữ lại để đối chiếu format
extracted/        sản phẩm giải nén (không vào git, hàng GB)
game/src/         mã nguồn game, ES module, không cần build
game/test/        test cho bộ sinh đơn
```

## Test

```
node --test game/test/orders.test.mjs
```

Tự chạy trên mỗi lần push qua GitHub Actions, đạt mới deploy.

## Bản quyền và ghi nguồn

Mã nguồn, tài liệu và công cụ trong repo này là của tác giả, phát hành tự do.

**Hình ảnh và âm thanh trong `game/assets/` thuộc bản quyền của Her Interactive, Inc.**
Chúng được đưa vào đây _với sự cho phép của Her Interactive_, dành cho cộng đồng người hâm
mộ. Mọi quyền đối với các tài sản đó vẫn thuộc về Her Interactive.

_Nancy Drew_ là nhãn hiệu của Simon & Schuster, Inc. Dự án này không phải sản phẩm chính
thức và không liên kết với Her Interactive hay Simon & Schuster.

<!-- TODO: ghi rõ phạm vi cho phép theo đúng văn bản bạn nhận được:
     ai cho phép, ngày nào, cho phép những gì. -->

Nếu bạn là đại diện của Her Interactive và muốn gỡ bỏ, hãy mở một issue.
