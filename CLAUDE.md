# CLAUDE.md

Ngữ cảnh dự án cho Claude Code. Đọc file này trước khi sửa bất cứ thứ gì.

## Dự án này là gì

Dựng lại 1:1 minigame quầy đồ ăn vặt trong *Nancy Drew #21: Warnings at Waverly Academy*
(Her Interactive, 2009), chạy trên trình duyệt bằng HTML5 Canvas.

Điểm khác biệt so với một clone thông thường: **mọi con số đều lấy từ bản gốc**, đọc ngược
từ bytecode Lua 5.1 trong `Ciftree.dat`. Không ước lượng, không "cho nó giống giống".

## Nguyên tắc bất di bất dịch

**1. `docs/spec.md` là nguồn sự thật.**
Mọi hằng số trong `game/src/data.js` đều phải truy được về một dòng trong spec. Muốn đổi
một con số thì phải có bằng chứng mới từ bản gốc, và phải cập nhật spec cùng lúc.

**2. `extracted/` không bao giờ vào git. `game/assets/` thì có.**
`extracted/` là bản giải nén đầy đủ, hàng GB, và sinh lại được — không có lý do gì đưa
lên. Riêng `game/assets/` chứa đúng phần asset game cần và **đã được Her Interactive cho
phép phát hành** cho cộng đồng người hâm mộ, nên commit bình thường. Xem mục Bản quyền
trong `README.md`.

Kèm theo đó: phần ghi nguồn trong `README.md` là bắt buộc, đừng gỡ. Nếu thêm asset mới
vào `game/assets/`, kiểm lại xem nó có nằm trong phạm vi được phép không.

**3. Không bao giờ ghi vào thư mục game gốc.**
Mọi công cụ chỉ đọc. `tools/setup.py` dùng `OpenRead`, không mở chế độ ghi.

**4. Đoán thì phải ghi là đoán.**
Nếu bytecode không nói rõ và phải chọn một giá trị, ghi comment `// doan:` ngay tại chỗ
và thêm vào `docs/backlog.md`. Đã có vài lần đoán sai vì suy từ tên biến — ví dụ
`ToastedUpSource1` hoá ra là "còn một nửa bánh" chứ không phải "khe số 1".

**5. Chữ hiển thị cho người chơi viết bằng tiếng Anh.**
Người chơi là cộng đồng người hâm mộ Nancy Drew, gần như toàn bộ nói tiếng Anh. Mọi chuỗi
hiện lên màn hình — hàng phím tắt, thanh điểm, thông báo, phụ đề — đều tiếng Anh. Riêng
tài liệu (`README.md`, `docs/`) và comment trong code thì giữ tiếng Việt.

**6. Thư mục game trên Steam là chỉ đọc tuyệt đối.**
Không ghi, xoá, đổi tên, hay di chuyển bất cứ thứ gì trong đó. Mọi thao tác với file
trong đó phải dùng chế độ đọc (`"rb"`, `OpenRead`). Mọi kết quả xuất ra đều nằm trong
thư mục dự án. Khi cần xử lý hàng loạt, hãy làm trên bản chép trong `extracted/`,
đừng trỏ thẳng vào thư mục Steam.

## Cấu trúc

```
docs/spec.md        dac ta day du trich tu ban goc
docs/backlog.md     viec chua lam, co ghi ly do vuong
tools/              cong cu khao co, chay bang Python
  extract_cif.py    giai nen Ciftree.dat -> png / lua / raw
  luaparse.py       doc bytecode Lua 5.1 thanh cau truc
  luatrace.py       lan vet hang so theo dung thu tu ma lenh
  setup.py          chay tat ca, chep asset vao game/
research/           mau file nho, giu de doi chieu format
game/src/
  data.js           TOAN BO hang so tu ban goc - sua can than
  orders.js         sinh don + so khop, thuan tuy, test duoc
  state.js          trang thai + tuong tac
  render.js         ve, khong chua logic
  main.js           noi day, vong lap
game/test/          test chay bang node --test
```

## Cách moi thêm dữ liệu từ bản gốc

Đây là quy trình đã dùng, lặp lại được:

```python
from luaparse import parse
from luatrace import trace
fs = parse('extracted/lua/TEN_FILE.luac')
f  = max(fs, key=lambda x: len(x['consts']))   # ham lon nhat thuong la scene
print(' '.join(str(x) for x in trace(f)))
```

`trace()` trả về hằng số theo đúng thứ tự trong mã lệnh, đọc gần như mã nguồn gốc.
Quy ước: giá trị đứng trước, tên trường đứng sau — `Rect New 495 1 543 29 leftUp` nghĩa là
`leftUp = Rect.New(495, 1, 543, 29)`.

Muốn tìm script chứa một từ khoá:

```powershell
Select-String -Path extracted/lua_strings.txt -Pattern "tu_khoa"
Select-String -Path extracted/lua_strings.txt -Pattern "^=====" | Where-Object LineNumber -lt <dong> | Select-Object -Last 1
```

## Bẫy đã gặp

- Hằng số trong Lua bị khử trùng lặp. Đọc danh sách `consts` sẽ mất thứ tự và thiếu số
  lặp lại. **Phải** dùng `luatrace.py` để lần theo mã lệnh.
- Hotspot trong tủ lạnh là toạ độ màn hình tuyệt đối, không cộng offset của khung tủ.
- `Up` = mặt cắt ngửa lên (nửa dưới sandwich), `Down` = úp xuống thấy vỏ (nửa trên).
- Atlas không có sprite "lò mở mà rỗng". Chỉ có mở-có-bột và mở-có-cookie.
- Ticket giữ nguyên thứ tự bốc ngẫu nhiên, không sắp xếp lại.

## Test

```
node --test game/test/orders.test.mjs
```

Chạy test sau mỗi lần đụng vào `orders.js` hoặc `data.js`.

## Về thư mục làm việc cũ

Dự án này thay thế hoàn toàn thư mục khảo cổ ban đầu (`nancy-work`). Không có gì trong đó
cần giữ lại: tài liệu đã thành `docs/spec.md`, script đã thành `tools/`, mẫu file đã nằm
trong `research/`, còn kết quả giải nén thì `tools/setup.py` sinh lại trong khoảng một phút.
Xoá được cả thư mục.

## Bẫy đã gặp trong chính code này

- `initSound()` từng dùng `if (buffers.size) return` làm cờ "đã nạp xong". Vì `loadBuffer`
  dùng chung `buffers`, chỉ một clip gossip nạp lười vào trước là toàn bộ bảng `CUES` bị
  bỏ qua — mất hết tiếng thao tác mà không báo lỗi. Bài học: đừng suy ra trạng thái từ
  một cấu trúc dữ liệu dùng chung, hãy giữ cờ riêng.
- `sound_assets.py` ban đầu chỉ đọc `s4210.luac` nên thiếu đúng một phần ba số âm — phần
  gossip nằm trong `GossipVOs_SC` được nạp qua `Scene:Include`. Khi quét bytecode, nhớ đi
  theo cả `Include`.

## Lần chạy đầu tiên

```
py tools/setup.py "<duong-dan-thu-muc-game-tren-Steam>"
git init
git status          # phai KHONG thay extracted/ hay game/assets/
git add . && git commit -m "khoi tao"
```

Bước `git status` là bắt buộc kiểm bằng mắt trước khi commit lần đầu. Nếu asset lọt vào
lịch sử git thì gỡ ra rất phiền.
