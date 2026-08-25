# Snack Shop Boss — đặc tả trích từ game gốc

Nguồn: `Ciftree.dat` → `s4210.luac` (scene) + `Cooking_SC.luac` (logic dùng chung),
Nancy Drew #21 *Warnings at Waverly Academy*, Her Interactive 2009.
Mọi con số dưới đây đọc trực tiếp từ bytecode, không phải suy đoán.

**Độ phân giải gốc: 640 × 400.** Atlas sprite: `REC_SNACKSHOPPUZ-TXT_OVL.png`.
Nền: `REC_SnackShopPUZ-TXT_BG` (từ `Video/REC_SnackShopPUZ-TXT_BG.bik`).

Quy ước toạ độ: `Rect.New(left, top, right, bottom)` — góc phải/dưới **không bao gồm**.
`Rect.LTWH(left, top, width, height)` xuất hiện ở vài hotspot, đã ghi rõ bên dưới.
`source` = ô cắt trong atlas. `onScreen` = vị trí vẽ trên màn 640×400.

---

## 1. Luật chơi chính thức

Nguyên văn từ `REC_SNACKSHOPDIRECTIONSCU-TXT_OVL.png` (bảng hướng dẫn trong game):

- Giờ mở cửa 6:00 – 23:00.
- Mỗi đơn là một ticket riêng, nhiều ticket nộp cùng lúc nên **phải cuộn** danh sách.
- Mỗi đơn tối đa **một** món mỗi nhóm: drink, fruit, sandwich, side, dessert.
- Khu phục vụ có **hai khay**, làm song song hai đơn.
- **Không gộp đơn** — một khay chỉ chứa món của đúng một đơn.
- Nhân sandwich phải khớp **chính xác** thứ tự ghi trên ticket.
- Cookie bắt buộc nướng trước khi phục vụ.
- Bấm Pick Up: sai thì gỡ món sai, thay món đúng, bấm lại.
- **Đơn giáo viên**: chuông reo, mọi đơn học sinh đang chờ bị **xoá sạch**, phải làm ngay.
  Thưởng credit hoặc phạt demerit tuỳ tốc độ.
- Mỗi ngày ít nhất một vòng, không thì 3 demerit. Xong 5 vòng được 2 credit.

---

## 2. Bảng món và ô cắt atlas

Mọi món có hai biến thể hình: `left` / `right` (hoặc `leftUp`/`rightUp`/`leftDown`/`rightDown`
với bánh — hai nửa bánh, mỗi nửa hai trạng thái). `autotext` là mã chuỗi hiển thị trên ticket.

### Bánh (sandwich base)

| Món | leftUp | rightUp | leftDown | rightDown | autotext |
|---|---|---|---|---|---|
| `bread` | 495,1,543,29 | 544,1,592,30 | 495,30,543,58 | 544,31,592,59 | UIFOOD01 |
| `breadToasted` | 495,59,543,88 | 544,60,592,89 | 495,89,543,117 | 544,90,592,118 | UIFOOD02 |
| `bagel` | 593,33,639,65 | 640,33,686,65 | 593,1,640,32 | 641,1,689,32 | UIFOOD03 |
| `bagelToasted` | 593,98,639,130 | 640,98,686,130 | 593,66,640,97 | 641,66,689,97 | UIFOOD04 |

### Nhân sandwich

| Món | left | right | autotext |
|---|---|---|---|
| `meat` | 358,455,406,483 | 407,455,448,483 | UIFOOD10 |
| `tomatoes` | 438,191,489,214 | 438,215,489,238 | UIFOOD11 |
| `lettuce` | 449,430,484,459 | 449,460,485,489 | UIFOOD12 |
| `cheese` | 358,430,396,454 | 397,430,433,454 | UIFOOD13 |

### Đồ uống, trái cây, tráng miệng, snack

| Món | Nhóm | left | right | autotext |
|---|---|---|---|---|
| `juice` | drink | 304,191,338,271 | 339,191,370,271 | UIFOOD17 |
| `water` | drink | 544,268,576,350 | 577,268,607,349 | UIFOOD18 |
| `milk` | drink | 371,191,405,236 | 406,191,437,236 | UIFOOD14 |
| `apple` | fruit | 371,237,400,268 | 401,237,430,268 | UIFOOD20 |
| `orange` | fruit | 431,239,460,266 | 461,239,490,265 | UIFOOD19 |
| `chocolate` | dessert | 485,432,546,458 | 486,459,546,484 | UIFOOD05 |
| `cookie` | dessert | 527,144,578,176 | 579,145,633,176 | UIFOOD16 |
| `cookieDough` | (trung gian) | 495,130,526,154 | 579,145,633,176 | UIFOOD15 |
| `chips` | side | 495,177,540,216 | 541,177,605,216 | UIFOOD06 |
| `pretzels` | side | 491,217,535,267 | 536,217,596,267 | UIFOOD07 |
| `granola` | side | 606,177,652,221 | 653,177,716,221 | UIFOOD08 |
| `nuts` | side | 597,222,640,266 | 641,222,703,267 | UIFOOD09 |

`cookieDough` không đặt được lên khay — phải qua lò thành `cookie`.

### Nội dung `autotext` trên ticket

Ticket hiển thị **chuỗi tiếng Anh dễ đọc, chữ thường, mỗi món một dòng, căn lề trái**.
Đã đối chiếu được 9/20 mã từ ảnh chụp trong game:

| Mã | Món | Chuỗi hiển thị |
|---|---|---|
| UIFOOD02 | `breadToasted` | `toasted bread` |
| UIFOOD03 | `bagel` | `bagel` |
| UIFOOD07 | `pretzels` | `pretzels` |
| UIFOOD11 | `tomatoes` | `tomatoes` |
| UIFOOD12 | `lettuce` | `lettuce` |
| UIFOOD14 | `milk` | `milk` |
| UIFOOD16 | `cookie` | `cookie` |
| UIFOOD17 | `juice` | `juice` |
| UIFOOD19 | `orange` | `orange` |

Phần lớn trùng id, nhưng `breadToasted` → `toasted bread` chứng minh đây là chuỗi soạn tay
chứ không sinh từ id. Suy ra `bagelToasted` → `toasted bagel`. Còn lại chưa xác nhận:
`bread`, `chocolate`, `chips`, `granola`, `nuts`, `meat`, `cheese`, `cookieDough`,
`water`, `apple`.

### Cách trình bày sandwich

Sandwich **không gộp một dòng** mà tách từng lớp, xếp **từ dưới lên**, nhân **thụt vào**:

```
bagel          <- banh duoi, can le trai
   lettuce     <- nhan, thut vao
   tomatoes    <- nhan, thut vao
bagel          <- banh tren, can le trai
```

Nhờ vậy người chơi đọc được đúng thứ tự lớp cần xếp.

### Thứ tự các dòng trong một đơn

**Ngẫu nhiên theo từng đơn.** Hai mẫu quan sát được:

- `cookie`, `milk` → dessert, drink
- sandwich, `juice`, `orange`, `cookie`, `pretzels` → sandwich, drink, fruit, dessert, side

Không theo alphabet, cũng không theo thứ tự nhóm cố định trong code. Gần như chắc chắn đây
là thứ tự mà `table.random` bốc nhóm ra trong bộ sinh đơn, nên khi dựng lại cần **giữ nguyên
thứ tự bốc ngẫu nhiên** thay vì sắp xếp lại.

---

## 3. Thuật toán sinh đơn

### Số đơn mỗi vòng (weighted random)

| Số đơn | Xác suất |
|---|---|
| 3 | 5% |
| 4 | 10% |
| 5 | **60%** |
| 6 | 25% |

### Nội dung một đơn

```
nhom = {fruit, drink, dessert, side, sandwich}
chon = random_subset(nhom, math.random(3, 5))   -- 3 den 5 nhom, khong phai luon du 5

fruit    -> random 1 trong {apple, orange}
drink    -> random 1 trong {juice, water, milk}
dessert  -> random 1 trong {chocolate, cookie}
side     -> random 1 trong {chips, pretzels, granola, nuts}
sandwich -> banh = random 1 trong {bread, bagel, breadToasted, bagelToasted}
            n = math.random(1, 4) nhan tu {meat, cheese, lettuce, tomatoes}
            xep: banh + n nhan (co thu tu) + banh
```

Điểm dễ bỏ sót: **mỗi đơn chỉ có 3–5 nhóm**, không phải lúc nào cũng đủ cả 5.

### Đơn cốt truyện (ưu tiên trước đơn ngẫu nhiên)

| Cờ điều kiện | Nội dung | Cờ đánh dấu xong |
|---|---|---|
| `MC_Said_Get_Snack_FL` và chưa `Got_MC_Snack_FL` | milk + cookie | `Got_MC_Snack_FL` |
| `CM_Said_Get_Snack_FL` và chưa `Got_CM_Snack_FL` | juice + apple + chocolate + sandwich(bagelToasted, cheese, bagelToasted) | `Got_CM_Snack_FL` |

Đơn thứ hai khớp đúng lời thoại của Corine: bagel nướng kẹp phô mai, táo, nước quả, thanh kẹo.

---

## 4. Trạm và thời lượng

| Trạm | Timer | Giá trị |
|---|---|---|
| Tủ lạnh | `openDuration` | **5** |
| Lò cookie | `bakeDuration` | **5** (đã bấm giờ trong game, khớp) |
| Máy nướng | `downDuration` | **5** |
| Thùng rác | `ovlDuration` | **0.25** |
| Khay (thu dọn) | `vacantDuration` | **4** |
| Nút Pick Up | `buttonDuration` | **0.6** |

Khác: `maxSandwichIngredients = 18` (giới hạn cứng số lớp trên một sandwich).

### Tủ lạnh
- source `2,2,188,247` → onScreen `0,35,186,280`
- hotspot mở: `LTWH(4,48,138,163)`
- Hotspot lấy món bên trong (toạ độ tương đối tủ đang mở):
  `milk 14,53,78,88` · `cookieDough 93,62,140,79` · `juice 42,96,89,160` ·
  `water 102,96,140,160` · `orange 69,177,96,199` · `apple 117,180,145,207`

### Lò cookie
- `openHotspot LTWH(30,303,146,39)` · `closeHotspot LTWH(30,337,146,42)` · `pickUpHotspot LTWH(30,303,146,39)`
- `unbakedSource 293,2,493,94` · `bakedSource 293,97,493,189` → onScreen `0,293,200,385`
- Đèn đỏ: source `175,250,188,260` → onScreen `143,351,156,361`
- Đèn xanh: source `159,250,172,260` → onScreen `124,351,137,361`
- Âm báo xong: `Bell_Ring_SFX`
- Trạng thái: `closedUnbaked → openUnbaked → baking → closedBaked → openBaked`

### Máy nướng
- `pickPlaceHotspot 572,162,618,216` · `startHotspot 574,234,609,256` · onScreen `570,159,618,270`
- **Một lần nướng cho ra hai nửa bánh.** Đã kiểm chứng trong game gốc: bỏ một phần bánh
  vào, gạt cần một lần, lấy ra được hai nửa đã nướng — đủ cho một sandwich, không phải
  nướng hai lượt. Art vẽ đúng hai lát trong hai khe.
- **`Source1` / `Source2` là SỐ NỬA CÒN LẠI trong lò, không phải số khe.** Xác nhận bằng
  cách cắt sprite ra xem: ô `x308` (`ToastedUpSource1`) chỉ có một nửa bánh bên trái, khe
  phải trống; ô `x257` (`ToastedUpSource2`) có đủ hai nửa. Tương tự `UpSource2` là hai nửa
  chưa nướng. Gán ngược sẽ khiến một nửa bánh tự biến mất rồi hiện lại.
- **Vòng đời và hình tương ứng:**

  | Trạng thái | Hình | Ghi chú |
  |---|---|---|
  | `full` | `UpSource2` | cần gạt lên, hai nửa sống nhô ra |
  | `toasting` | `DownSource` | cần gạt xuống, bánh chìm trong lò, giữ 5 giây |
  | `popping` | 6 khung animation | bánh nhô lên, cần gạt bật lên, chỉ ~0.45 giây |
  | `done` (2 nửa) | `ToastedUpSource2` | |
  | `done` (1 nửa) | `ToastedUpSource1` | sau khi lấy ra một nửa |

- Dải 6 khung là cảnh bánh **nhô lên khi nướng xong**, không phải cảnh hạ xuống. Trải nó ra
  suốt 5 giây nướng sẽ thành giật từng nấc.
  - bread: `2,391,50,502` / `53,391,…` / `104,…` / `155,…` / `206,…` / `257,391,305,502`
  - bagel: `2,277,50,388` / `53,…` / `104,…` / `155,…` / `206,…` / `257,277,305,388`
- Frame cuối trùng đúng với `ToastedUpSource2`; `ToastedUpSource1` là ô thứ 7 cùng dải.
- Âm: `Toaster_Down01..05_SFX` khi gạt, `Toaster_Pop01..05_SFX` khi bật lên

### Hướng nửa bánh — quan trọng khi vẽ

Bốn biến thể của mỗi loại bánh không phải bốn góc nhìn ngẫu nhiên:

- **`Up`** = mặt cắt ngửa lên, ruột bánh màu nhạt → dùng làm **nửa dưới** của sandwich
- **`Down`** = úp xuống, thấy vỏ nâu bóng → dùng làm **nửa trên**
- `left` / `right` = biến thể phối cảnh cho khay trái và khay phải

Gán ngược sẽ ra cái sandwich lộn ngược tuy vẫn "chạy đúng".

### Khu vực ticket
- Vùng hiển thị: `LTWH(499,25,126,129)`, `textHeight 12`, `vertBuffer 0`, `catchUpFactor 0.25`
- Nút cuộn lên: `499,0,640,50` · cuộn xuống: `499,108,640,158`
- Tốc độ cuộn: `minSpeed 0` → `maxSpeed 250`
- Vạch phân cách giữa các đơn: source `37,249,157,262` (120×13) — là một dải hoa văn
  đối xứng, không phải đường kẻ chấm như walkthrough mô tả
- Khung có viền vàng với tiêu đề "Orders" ở đầu, nền xanh nhạt, chữ đen
- Danh sách bắt đầu sát mép trên trái của vùng, đơn cũ ở trên

---

## 5. Hai khay

Mỗi khay có **5 ô cố định** theo nhóm — món không xếp tự do mà rơi vào đúng ô của nhóm nó.

Đã kiểm chứng bằng ảnh: hộp sữa đặt lên khay phải nằm đúng ô `drink 367,187,399,268`
(quy về hệ 640×400 sau khi chia tỉ lệ ảnh chụp). Ô drink nằm lệch hẳn sang mép trái khay,
không phải giữa khay.

### Khay trái
- Khay: source `359,272,543,350` → onScreen `172,202,356,280`
- Nút Pick Up: source `569,497,651,529` → onScreen `235,310,317,342` (cũng là hotspot)
- Ô: `drink 190,187,228,268` · `fruit 251,192,280,223` · `dessert 286,206,347,238` ·
  `side 309,222,355,272` · `sandwich 241,226,289,255`

### Khay phải
- Khay: source `358,351,552,429` → onScreen `355,202,549,280`
- Nút Pick Up: source `569,532,651,564` → onScreen `402,310,484,342`
- Ô: `drink 367,187,399,268` · `fruit 416,192,446,223` · `dessert 449,207,509,238` ·
  `side 479,222,544,272` · `sandwich 415,226,466,255`

### Trạm lấy nguyên liệu (hotspot trên quầy)
`bread 208,25,291,68` · `bagel 370,31,479,69` · `chocolate 317,21,352,71` ·
`chips 244,98,281,150` · `pretzels 295,98,332,150` · `granola 346,98,381,150` ·
`nuts 395,98,431,150` · `meat 249,159,283,187` · `tomatoes 303,161,337,187` ·
`lettuce 355,161,389,187` · `cheese 407,164,445,187`

Thùng rác: source `191,2,290,46` → onScreen `534,298,633,342`
Nút quay ra: `207,365,502,399`

---

## 6. Vòng đơn giáo viên

```
startTeacherRound:
    startRandom = math.random(1, 4)
    neu startRandom == 2 thi bat teacherRoundTimer
teacherRoundTimer.duration = math.random(2, 4)
khi xong -> chuyen sang scene 4230 (teacherOrderRoundNAV)
```

Toán tử đã đọc rõ: opcode `EQ A=0 B=R(startRandom) C=K(2.0)` rồi `JMP` bỏ qua nhánh bật
timer — tức là `if startRandom == 2 then`. **Xác suất đúng 1/4 mỗi lần vào scene**, không
phải một khoảng.

`gossipDelay` — hẹn giờ phát lời tán gẫu của khách — xem mục 8.

---

## 7. Phản hồi, âm thanh và biến đếm

- Biến đếm: `SnackRoundsTotal += 1` mỗi vòng hoàn thành
- Thành tựu `ACH_WAC_COOK` qua cờ `META_Short_Order_Cook_FL`
- Xong vòng đầu tiên → nhận `INV_Order`, và mở cờ `Got_INV_Key_Cellar_FL` (chìa khoá hầm)

### Âm thanh — bảng đầy đủ

Trích từ `s4210.luac`: **42 khối `AR.Sound`, 86 tên file phân biệt**. `Cooking_SC.luac`
không chứa một tên file nào — nó là engine chung, chỉ gọi *khe* (`pickSound`, `placeSound`,
`beginSound`, `doneSound`, `openSound`, `closeSound`, `replaceSound`, `sound`); `s4210`
mới là nơi nhồi dữ liệu vào.

**Kênh dùng để CẮT tiếng, không phải để chồng tiếng.** Nạp âm mới vào một kênh thì âm đang
chạy trên kênh đó bị cắt. Vì vậy bấm nhanh vào máy nướng không xếp lớp, và nộp hai khay
liên tiếp thì giọng Nancy cắt câu trước. Tám kênh: `FX1`..`FX7` và `PlayerVoice`.

**Âm lượng thuộc về chỗ xảy ra hành động, không thuộc về file.** Cùng `Pickup_Apple01..03`
nhưng 0.55 khi lấy từ ngăn tủ lạnh và 0.4 khi nhấc khỏi khay; `Fabric_PlaceShort01..03` có
ba mức tuỳ chỗ. Tra theo tên file sẽ gán sai. Cột trống = bản gốc không đặt `volume`.

#### Quầy nguyên liệu — FX1

| Món | Hotspot | Vol | File |
|---|---|---|---|
| bread | `208,25,291,68` | 0.5 | `Fabric_PlaceShort01..03_SFX` |
| bagel | `370,31,479,69` | 0.5 | `Fabric_PlaceShort01..03_SFX` |
| chocolate | `317,21,352,71` | — | `PickUp_Candy01,04,07_SFX` |
| chips | `244,98,281,150` | — | `ChipBag_Short01..03_SFX` |
| pretzels | `295,98,332,150` | — | `ChipBag_Short01..03_SFX` |
| granola | `346,98,381,150` | — | `ChipBag_Short01..03_SFX` |
| nuts | `395,98,431,150` | — | `ChipBag_Short01..03_SFX` |
| meat | `249,159,283,187` | — | `Pickup_Squish_Small04,05_SFX` |
| tomatoes | `303,161,337,187` | — | `Pickup_Squish_Small01,03_SFX` |
| lettuce | `355,161,389,187` | 0.5 | `Pickup_Lettuce01..03_SFX` |
| cheese | `407,164,445,187` | 0.5 | `styrofoam_put_down1..3_SFX` |

#### Tủ lạnh — cửa FX2, ngăn trong FX1

| Ngữ cảnh | Khe | Kênh | Vol | File |
|---|---|---|---|---|
| Mở cửa | `openSound` | FX2 | 0.55 | `FridgeOpen01..03_SFX` |
| Đóng cửa | `closeSound` | FX2 | 0.55 | `FridgeClose01..03_SFX` |
| milk | `sound` | FX1 | — | `Pickup_PaperNote01..04_SFX` |
| cookieDough | `sound` | FX1 | — | `Mud_ShortSquish01,03,04_SFX` |
| juice | `sound` | FX1 | — | `PickUpObject02..07_SFX` |
| water | `sound` | FX1 | — | `PickUpObject02..07_SFX` |
| orange | `sound` | FX1 | 0.55 | `Pickup_Apple01..03_SFX` |
| apple | `sound` | FX1 | 0.55 | `Pickup_Apple01..03_SFX` |

#### Lò cookie — FX3

| Ngữ cảnh | Khe | File |
|---|---|---|
| Mở lò (cũng là lúc bột vào) | `openSound` | `TinFoil_Crinkle01..05_SFX` |
| Đóng lò | `closeSound` | `MetalDoor_Small01,02_SFX` |
| Nướng xong (chuông) | `doneSound` | `Bell_Ring_SFX` |
| Nhấc cookie ra | `closeSound` | `MetalDoor_Small01,02_SFX` |

**Lò chỉ có ba âm.** Bỏ bột vào không có âm riêng: trong bản gốc, cú bấm mở lò *chính là*
cú bấm bỏ bột (`openHs` nhận `heldFood` rồi chuyển sang `openUnbaked`), và cú bấm đó đã phát
`openSound`. Nhấc cookie ra dùng lại `closeSound` — cửa lò đóng ngay lúc đó.

#### Máy nướng — FX4

| Ngữ cảnh | Khe | Vol | File |
|---|---|---|---|
| Đặt bánh vào | `placeSound` | 0.5 | `Fabric_PlaceShort01..03_SFX` |
| Gạt cần xuống | `beginSound` | — | `Toaster_Down01..05_SFX` |
| Bánh bật lên | `doneSound` | — | `Toaster_Pop01..05_SFX` |
| Nhấc bánh ra | `pickSound` | 0.5 | `Fabric_PlaceShort01..03_SFX` |

#### Thùng rác — FX5

| Ngữ cảnh | File |
|---|---|
| Bỏ món vào (nắp mở `ovlDuration 0.25` rồi tự ẩn) | `Put_Down_Metal01..03_SFX` |

**Thùng rác chỉ có một âm.** Mở nắp, bỏ món và nắp đóng lại đều nằm trong cùng một cú bấm.

#### Khay ra vào — FX6

| Ngữ cảnh | Khe | File |
|---|---|---|
| Đưa khay đi | — | `PaperBagShake01..05_sfx` |
| Khay mới tới | `replaceSound` | `Object_Place01..03_SFX` |

`Object_Place01..03` nằm trên **FX6**, không phải kênh giọng nói — nó là tiếng khay mới
đặt xuống, không phải lời thoại.

#### Nhặt/đặt món trên khay — FX7

| Nhóm | Nhặt (`pickSound`) | Đặt (`placeSound`) | Vol |
|---|---|---|---|
| drink | `Plastic_Short01..04_SFX` | `Plastic_Short01..04_SFX` | 0.55 |
| fruit | `Pickup_Apple01..03_SFX` | `Knock_Quiet01..03_SFX` | 0.4 |
| dessert | `Fabric_PlaceShort01..03_SFX` | `Fabric_PlaceShort01..03_SFX` | 0.35 |
| side | `ChipBag_Short01..03_SFX` | `ChipBag_Short01..03_SFX` | — |
| sandwich | `Fabric_PlaceShort01..03_SFX` | `Fabric_PlaceShort01..03_SFX` | 0.55 |

#### Giọng Nancy — PlayerVoice

| Ngữ cảnh | Khe | File |
|---|---|---|
| Khớp đúng | `goodMatchSounds` | `NWA056a..d_sfx` |
| Khớp sai | `badMatchSound` | `NWA103..106_sfx` |
| Xong cả vòng (`allDoneVO`) | `endRound` | `ND_AllDone01_SFX` |

### Định dạng file `.HIS`

Đã đọc ngược, kiểm trên cả 3021 file, không file nào lệch — xem `tools/his_to_wav.py`.
32 byte header, trong đó 16 byte từ `0x08` là một khối `WAVEFORMATEX` mô tả âm thanh **sau**
khi giải nén. Trường `0x1C` là codec:

- **codec 1** (PCM thô) — phần dữ liệu là PCM nguyên bản → xuất `.wav`, không nén.
- **codec 2** (Ogg Vorbis) — phần dữ liệu là một file Ogg hoàn chỉnh → tách thẳng ra `.ogg`.
  Bên trong đã là Vorbis sẵn, nên "đổi sang wav" cho nhóm này không lấy lại được gì; mất mát
  xảy ra từ lúc Her Interactive đóng gói.

Trong 86 âm minigame dùng: **46 file codec 1** (`.wav`) và **40 file codec 2** (`.ogg`).
`tools/sound_assets.py` tự đọc danh sách cần từ bytecode rồi xuất ra `game/assets/sound/`,
đặt tên viết thường và bỏ hậu tố `_SFX`. `tools/setup.py` gọi nó ở bước 3.

---

## 8. Lời tán gẫu của khách (gossip)

Nguồn: `GossipVOs_SC.luac` — 171 khối AR, 151 closure, 108 file âm thanh.
`s4210` nạp nó bằng `Scene:Include{"GossipVOs_SC"}` ngay ở đầu scene; **không scene nào
khác include file này**, nên lời tán gẫu chỉ tồn tại trong minigame quầy đồ ăn.

Bộ đếm `VarTable.Gossip` nằm trong savegame. Không file `.luac` nào khác đụng vào nó.

### 8.1 Cơ chế — bốn khối điều khiển

```lua
incrementGossip = AR:Override{                       -- khong co truong active
    RunOnce = function() VarTable.Gossip = VarTable.Gossip + 1 end }

playGossip = AR:Override{
    RunOnce = function() _G["gossip" .. VarTable.Gossip .. "_VO"].active = true end,
    active  = function() return gossipDelay.done and VarTable.Gossip < 22 end }

fadeInGossip = MakeSoundFader{ duration = 3, startVol = 0.5, endVol = 0.8,
    channel = SoundChannel.Voice1,
    active  = function() return gossipDelay.done and VarTable.Gossip < 22 end }
```

và trong `s4210` (dòng 344–346):

```lua
gossipDelay = MakeTimer{ duration = math.random(2, 10),
    active = function() return not Flags.Curfew_FL and not teacherRoundTimer.active end }
```

Diễn giải:

1. **Vào scene** → `incrementGossip` chạy, `VarTable.Gossip += 1`.
2. **Đồng hồ `gossipDelay` chạy**, hết giờ thì `done = true`.
3. **`playGossip` bật đúng một nhóm**: `gossip<N>_VO.active = true` với `N = VarTable.Gossip`.
   Cùng lúc `fadeInGossip` kéo kênh `Voice1` từ 0.5 lên 0.8 trong 3 giây.
4. Các câu còn lại trong nhóm tự nối nhau bằng `.done` (mục 8.2).
5. Cuối nhóm một `MakeSoundFader` kéo kênh về 0.5.

`incrementGossip` không có trường `active`. Đây là thành ngữ chuẩn của engine — trong
`extracted/lua/` có 104 khối `AR:Override` không khai báo `active`, trong đó mọi script
`*_Amb_sfx_SC` đều dùng đúng dạng `onInit = AR:Override{ RunOnce = ... }` để chạy một lần
lúc nạp scene. `Timer_SC.luac` còn ghi rõ quy tắc mặc định trong hàm `Create`:

```lua
if input.active == nil then self.active = true else self.active = input.active end
```

### 8.2 Phát theo cặp hội thoại, không phải câu lẻ — ĐÃ XÁC NHẬN

Giả thuyết `Girl1_Ball01 → Girl2_Ball02 → Girl1_Ball03 → Girl2_Ball04` là một đoạn đối đáp
là **đúng**. Bằng chứng trực tiếp từ bytecode, không phải suy từ tên file:

```lua
gossip7_VO  = AR:Sound{ sounds = "Girl1_Ball01_SFX", ..., active = false }
gossip7B_VO = AR:Sound{ sounds = "Girl2_Ball02_SFX", ..., active = function() return gossip7_VO.done  end }
gossip7C_VO = AR:Sound{ sounds = "Girl1_Ball03_SFX", ..., active = function() return gossip7B_VO.done end }
gossip7D_VO = AR:Sound{ sounds = "Girl2_Ball04_SFX", ..., active = function() return gossip7C_VO.done end }
```

Câu đầu nhóm là khối duy nhất có `active = false` — nó chỉ bật khi `playGossip` gán tay.
Mọi câu sau đó có `active` là một closure trả về `.done` của **câu liền trước**. Kiểm cả
151 closure: 92/92 câu đối đáp đều theo đúng khuôn này, không một ngoại lệ.

Quy tắc đánh số cũng khớp tuyệt đối: **số lẻ luôn là `Girl1`, số chẵn luôn là `Girl2`**,
92/92 file. Trên đĩa có đúng 92 file `Girl*`, tất cả đều được tham chiếu, không dư file nào.

Nhóm có số câu lẻ (8, 12, 17, 20) kết thúc bằng `Girl1` — vẫn là đối đáp so le, chỉ là
Girl1 nói câu cuối.

### 8.3 Bảng 21 nhóm đối đáp

| # | Chủ đề | Số câu | Chuỗi file | Tổng | Fader kết | Điều kiện bật fader |
|---|---|---|---|---|---|---|
| 1 | `Calc` | 4 | `Girl1_Calc01` → `Girl2_Calc04` | 15.2 s | `gossip1FAdeOut` 3 s, 0.8→0.5 | `gossip1C_VO.done and gossip1D_VO.endTime - 3.0 < Scene.time` |
| 2 | `Har` | 4 | `Girl1_Har01` → `Girl2_Har04` | 14.3 s | `gossip2FAder` 3 s, **0.7**→0.5 | `gossip2C_VO.done and gossip2D_VO.endTime - 3.0 < Scene.time` |
| 3 | `Desk` | 2 | `Girl1_Desk01` → `Girl2_Desk02` | 11.6 s | `gossip3FAder` 3 s, 0.8→0.5 | `gossip3_VO.done and gossip3B_VO.endTime - 3.0 < Scene.time` |
| 4 | `Cof` | 2 | `Girl1_Cof01` → `Girl2_Cof02` | 7.3 s | `gossip4FAder` 2.5 s, 0.8→0.5 | `gossip4_VO.done and gossip4B_VO.endTime - 2.5 < Scene.time` |
| 5 | `Eng` | 4 | `Girl1_Eng01` → `Girl2_Eng04` | 13.2 s | `gossip5FAder` 3 s, 0.8→0.5 | `gossip5C_VO.done and gossip5D_VO.endTime - 3.0 < Scene.time` |
| 6 | `Green` | 4 | `Girl1_Green01` → `Girl2_Green04` | 13.0 s | `gossip6FAder` 2.5 s, 0.8→0.5 | `gossip6C_VO.done and gossip6D_VO.endTime - 2.5 < Scene.time` |
| 7 | `Ball` | 4 | `Girl1_Ball01` → `Girl2_Ball04` | 13.4 s | `gossip7FAder` 3 s, 0.8→0.5 | `gossip7C_VO.done and gossip7D_VO.endTime - 3.0 < Scene.time` |
| 8 | `Ear` | 5 | `Girl1_Ear01` → `Girl1_Ear05` | 13.5 s | `gossip8FAder` 3 s, 0.8→0.5 | `gossip8D_VO.done and gossip8E_VO.endTime - 3.0 < Scene.time` |
| 9 | `Who` | 4 | `Girl1_Who01` → `Girl2_Who04` | 17.4 s | `gossip9FAder` 3 s, 0.8→0.5 | `gossip9C_VO.done and gossip9D_VO.endTime - 3.0 < Scene.time` |
| 10 | `Kick` | 4 | `Girl1_Kick01` → `Girl2_Kick04` | 11.4 s | `gossip10FAder` 2.5 s, 0.8→0.5 | `gossip10C_VO.done and gossip10D_VO.endTime - 2.5 < Scene.time` |
| 11 | `Page` | 4 | `Girl1_Page01` → `Girl2_Page04` | 17.1 s | `gossip11FAder` 2 s, 0.8→**0.6** | `gossip11C_VO.done and gossip11D_VO.endTime - 2.0 < Scene.time` |
| 12 | `Lee` | 3 | `Girl1_Lee01` → `Girl1_Lee03` | 15.7 s | `gossip12FAder` 3 s, 0.8→**0.6** | `gossip12B_VO.done and gossip12C_VO.endTime - 3.0 < Scene.time` |
| 13 | `Char` | 6 | `Girl1_Char01` → `Girl2_Char06` | 20.1 s | `gossip13FAder` 1.9 s, 0.8→0.5 | `gossip13C_VO.done and gossip13D_VO.endTime - 1.9 < Scene.time` ⚠ |
| 14 | `Rac` | 4 | `Girl1_Rac01` → `Girl2_Rac04` | 16.2 s | `gossip14FAder` 2.5 s, 0.8→0.5 | `gossip14C_VO.done and gossip14D_VO.endTime - 2.5 < Scene.time` |
| 15 | `Squ` | 6 | `Girl1_Squ01` → `Girl2_Squ06` | 27.9 s | `gossip15FAder` 3 s, 0.8→0.5 | `gossip15E_VO.done and gossip15F_VO.endTime - 3.0 < Scene.time` |
| 16 | `Goes` | 4 | `Girl1_Goes01` → `Girl2_Goes04` | 29.2 s | `gossip16FAder` 3 s, 0.8→0.5 | `gossip16C_VO.done and gossip16D_VO.endTime - 3.0 < Scene.time` |
| 17 | `Hate` | 5 | `Girl1_Hate01` → `Girl1_Hate05` | 19.5 s | `gossip17FAder` 3 s, 0.8→**0.6** | `gossip17C_VO.done and gossip17D_VO.endTime - 2.5 < Scene.time` ⚠ |
| 18 | `Cas` | 4 | `Girl1_Cas01` → `Girl2_Cas04` | 14.3 s | `gossip18FAder` 3 s, 0.8→**0.7** | `gossip18B_VO.done and gossip18C_VO.endTime - 2.5 < Scene.time` ⚠ |
| 19 | `Fac` | 4 | `Girl1_Fac01` → `Girl2_Fac04` | 17.0 s | `gossip19FAder` 3 s, 0.8→0.5 | `gossip19B_VO.done and gossip19C_VO.endTime - 3.0 < Scene.time` ⚠ |
| 20 | `Dump` | 9 | `Girl1_Dump01` → `Girl1_Dump09` | 18.7 s | `gossip20FAder` 3 s, 0.8→0.5 | `gossip20H_VO.done and gossip20I_VO.endTime - 3.0 < Scene.time` |
| 21 | `Id` | 6 | `Girl1_Id01` → `Girl2_Id06` | 16.1 s | `gossip21FAder` 2.8 s, 0.8→0.5 | `gossip21C_VO.done and gossip21D_VO.endTime - 2.8 < Scene.time` ⚠ |

Tổng 92 câu đối đáp = **342.1 giây**. Độ dài từng file đọc từ trường `0x18` của header
`.HIS` (số byte PCM sau giải nén) chia cho `rate × channels × bits/8` — xem mục 7.

Tên khối của nhóm 1 là `gossip1FAdeOut`, các nhóm khác là `gossip<N>FAder`. Chỉ khác tên,
không khác hành vi.

### 8.4 Câu lẻ nối sau (Single)

12 trong 21 nhóm có thêm một đoạn độc thoại phát sau khi đối đáp kết thúc. Một `MakeTimer`
đếm im lặng, hết giờ thì fade kênh lên rồi phát:

| # | Timer | Câu lẻ | Dài | Fade-in | Fade-out |
|---|---|---|---|---|---|
| 1 | 5 s sau `gossip1D_VO.done` | `Bliz01_SFX` | 4.28 s | 2 s, 0.5→0.8 | 1.5 s, 0.8→0.5 |
| 2 | 6 s sau `gossip2D_VO.done` | `Hot01_SFX` → `Doll01_SFX` | 5.88 + 4.89 s | 3 s, 0.5→0.8 | 3 s, 0.8→0.5 |
| 4 | 7 s sau `gossip4B_VO.done` | `Wig01_SFX` | 4.84 s | 2 s, 0.5→0.8 | 2 s, 0.8→0.5 |
| 6 | 5 s sau `gossip6D_VO.done` | `Wea01_SFX` | 7.63 s | 2.5 s, 0.5→0.8 | 2.5 s, 0.8→0.5 |
| 7 | 5 s sau `gossip7D_VO.done` | `Uni01_SFX` | 6.17 s | 3 s, 0.5→0.8 | 3 s, 0.8→0.5 |
| 8 | 10 s sau `gossip8E_VO.done` | `Per01_SFX` → `Che01_SFX` | 3.46 + 2.43 s | 2 s, 0.5→0.8 | 2 s, 0.8→0.5 |
| 10 | 10 s sau `gossip10D_VO.done` | `Cos01_SFX` | 5.39 s | 2 s, 0.5→0.8 | 2 s, 0.8→0.5 |
| 11 | 15 s sau `gossip11D_VO.done` | `Guys01_SFX` | 5.73 s | 2 s, 0.5→0.8 | 2 s, 0.8→0.5 |
| 14 | 7 s sau `gossip14D_VO.done` | `Gross01_SFX` → `May01_SFX` | 2.87 + 3.65 s | 3 s, 0.5→0.8 | 3 s, 0.8→0.5 |
| 15 | 5 s sau `gossip15F_VO.done` | `Pig01_SFX` | 5.81 s | 2 s, 0.5→0.8 | 2 s, 0.8→0.5 |
| 18 | 12 s sau `gossip18D_VO.done` | `Sal01_SFX` | 3.76 s | 1.5 s, 0.5→0.8 | 2 s, 0.8→0.5 |
| 19 | 5 s sau `gossip19D_VO.done` | `Else01_SFX` | 5.22 s | 1.5 s, 0.5→0.8 | 2 s, 0.8→0.5 |
| 19 | 7 s sau `Gossip19SingleFadeOut.done` | `Sick01_SFX` | 4.20 s | 1.5 s, 0.5→0.8 | 2 s, 0.8→0.5 |

Hai kiểu "hai câu" khác nhau, đừng lẫn:

- **Nhóm 2, 8, 14** — hai câu dính liền trong *một* khối: `Single2_VO.active` là
  `Single_VO.done`, chỉ một lần fade lên và một lần fade xuống bọc cả hai.
- **Nhóm 19** — hai khối *riêng biệt*. `gossip19Single2Timer.active = Gossip19SingleFadeOut.done`,
  tức đồng hồ thứ hai chỉ bắt đầu sau khi fade-out của câu lẻ thứ nhất chạy xong. Đây là
  closure duy nhất trong file lấy `.done` của một fader thay vì của một `_VO`.

9 nhóm không có câu lẻ: 3, 5, 9, 12, 13, 16, 17, 20, 21.

### 8.5 Kênh và âm lượng

Có **hai tầng âm lượng** nhân với nhau, đừng gộp làm một:

| Tầng | Đặt ở đâu | Giá trị |
|---|---|---|
| Âm lượng từng clip | `volume` trong `AR:Sound` | `0.8` — **cả 108 clip, không clip nào lệch** |
| Âm lượng kênh | `Sound:SetVolume(SoundChannel.Voice1, …)` do fader gọi | chạy giữa `0.5` và `0.8` |

Kênh: **`SoundChannel.Voice1`**, dùng cho toàn bộ gossip và không dùng cho gì khác trong
minigame. `s4210` để dành `FX1`/`FX7` cho tiếng thao tác và `PlayerVoice` cho giọng Nancy
(mục 7), nên gossip không bao giờ cắt tiếng thao tác — chúng nằm trên kênh khác.

Mức nền của `Voice1` là **0.5**: mọi fade-in đều xuất phát từ `startVol = 0.5`, mọi fade-out
đều kết thúc ở `endVol = 0.5` (trừ mấy ngoại lệ đánh dấu ở mục 8.7).

**Đường cong fade đọc được chính xác**, không phải tuyến tính. `Fader_SC.luac` gọi
`math.sinlerp`, còn `Math_SC.luac` định nghĩa:

```lua
math.clamp(a, b, c)   = math.min(math.max(b, a), c)
math.lerp(a, b, t)    = a + (b - a) * math.clamp(0, t, 1)
math.sinlerp(a, b, t) = math.lerp(a, b, math.sin(t * math.pi / 2))
```

Nên công thức đầy đủ, với `t = elapsed / duration`:

```
vol(t) = startVol + (endVol - startVol) * sin(clamp(t, 0, 1) * pi / 2)
```

Đây là ease-out: đổi nhanh lúc đầu, chậm dần về cuối.

### 8.6 Phụ đề — KHÔNG CÓ

Hệ phụ đề của game là `autotext_SC.luac`, một bảng `AutotextInit:Create` ánh xạ
**tên file âm thanh → chuỗi hiển thị**, ví dụ:

```
Paige09_sfx  ->  <c1>Paige: Hello? Hel-lo?
Mel04_sfx    ->  <c1>Yeah.
```

Đã tra cả 108 tên file gossip trong bảng đó: **0 kết quả**. Không có `Girl1_*`, `Girl2_*`,
cũng không có `Bliz01_SFX`, `Hot01_SFX`, `Wig01_SFX`, … Các khối `AR:Sound` của gossip cũng
không có trường `text` hay `autotext` nào — chỉ có `sounds`, `channel`, `volume`, `active`.

Đối chiếu: hotspot món ăn trong `s4210` *có* trường `autotext = "UIFOOD01"` (mục 2). Tức là
engine hoàn toàn hỗ trợ phụ đề ở chỗ này, nhưng gossip cố ý không dùng — nó là tiếng nền,
không phải thoại có nội dung cần đọc.

**Kết luận: bản dựng lại không cần và không nên hiện phụ đề cho gossip.** Không có chuỗi nào
để mà lấy.

### 8.7 Bẫy đã gặp

- **Fader kết bật sớm hơn câu cuối ở 5 nhóm.** Đánh dấu ⚠ trong bảng 8.3. Ví dụ nhóm 13 có
  6 câu nhưng fader kích hoạt theo `gossip13C_VO.done` và `gossip13D_VO.endTime`, nên
  `Char05` và `Char06` phát khi kênh đã tụt về 0.5. Tương tự nhóm 17 (thừa `Hate05`),
  18 (thừa `Cas04`), 19 (thừa `Fac04`), 21 (thừa `Id05`, `Id06`).
  Đây là lỗi soạn của bản gốc, **không phải đọc nhầm bytecode** — giữ nguyên nếu muốn 1:1.
- **Nhóm 17 và 18: `duration` lệch với mốc trừ lùi.** Fader dài 3.0 s nhưng điều kiện bật là
  `endTime - 2.5`. Fade chưa xong thì câu đã hết.
- **Bốn nhóm không về mức nền 0.5.** Nhóm 11, 12, 17 dừng ở 0.6; nhóm 18 dừng ở 0.7. Lần
  fade-in kế tiếp vẫn đặt `startVol = 0.5`, nên có một cú nhảy âm lượng xuống ngay đầu fade.
- **Nhóm 2 bắt đầu fade từ 0.7 chứ không phải 0.8.** Cũng là một cú nhảy, ngay khi fader chạy.
- **Sai chính tả tên file trong bản gốc.** Script gọi `Girl2_Char04_SFX`, trên đĩa file tên là
  `Girl2_CHar04_SFX.HIS` (chữ `H` hoa). Windows tra tên không phân biệt hoa thường nên game
  chạy được. Công cụ nào so tên phân biệt hoa thường sẽ trượt đúng file này.
- **Đừng đọc `consts` để lấy số.** Như mọi chỗ khác, hằng số bị khử trùng lặp — `0.8` xuất hiện
  một lần trong bảng nhưng được dùng hàng trăm lần. Phải lần theo `SETTABLE` bằng `luatrace.py`.

### 8.8 Cờ `Curfew_FL` chặn thế nào

```lua
gossipDelay.active = function()
    return not Flags.Curfew_FL and not teacherRoundTimer.active
end
```

Bytecode (`s4210` proto#12, dòng 346):

```
 0 GETGLOBAL  Flags
 1 GETTABLE   R1 = Flags.Curfew_FL
 2 TEST       A=1 C=1        -- Curfew_FL dung  -> nhay toi 8
 3 JMP        -> 8
 4 GETGLOBAL  teacherRoundTimer
 5 GETTABLE   R1 = .active
 6 NOT        R1 = not R1
 7 JMP        -> 10
 8 LOADBOOL   R1 = false
 9 LOADBOOL   R1 = true      (bi 8 nhay qua)
10 RETURN     R1
```

`TEST` với `C = 1` nhảy khi giá trị **đúng** — nên nhánh `Curfew_FL == true` rơi thẳng vào
`LOADBOOL false`. Đây là phủ định, không phải điều kiện thuận.

Chặn ở tầng nào: cờ không tắt tiếng, mà **giữ `gossipDelay.active = false`**. Đồng hồ không
bao giờ chạy → `gossipDelay.done` không bao giờ true → `playGossip` và `fadeInGossip` không
bao giờ kích hoạt. Không có câu nào phát, kênh `Voice1` nằm im ở 0.5.

`Curfew_FL` là cờ ngày/đêm toàn cục, không phải của minigame. `PhoneData_SC.luac` bật nó
cùng `Night_FL` khi `Player.time.hours + 1 >= VarTable.CurfewStart`, và tắt qua
`SetCurfewToFalse_FL`. Có 4 script khác cũng gọi tắt (`s1720a_SC`, `s2050`, `s2055`, `s2090`).
Hơn 150 chỗ trong game đọc cờ này.

**Vế thứ hai quan trọng không kém:** `not teacherRoundTimer.active`. Khi vòng đơn giáo viên
được kích (mục 6), `gossipDelay` mất `active`. Nhưng `Timer_SC` khi được bật lại dùng
`OnActivation` chứ không phải `RunOnce`:

```lua
OnActivation = function(self) self.endTime = Scene.time + (self.duration - self.time) end
```

tức là **tạm dừng rồi chạy tiếp**, không đếm lại từ đầu.

### 8.9 `gossipDelay` đếm từ lúc nào, lặp ra sao

**Đếm từ lúc nào.** `math.random(2, 10)` nằm trong thân chunk chính của `s4210`, chạy **một
lần duy nhất khi nạp scene**. Nó là một số nguyên cố định cho suốt lượt chơi đó, không phải
sinh lại mỗi chu kỳ.

Mốc bắt đầu đếm nằm ở `RunOnce` của `Timer_SC`:

```lua
RunOnce = function(self) self.endTime = Scene.time + self.duration end
```

`RunOnce` chạy ở tick đầu tiên mà `active` trả về true. Vậy đồng hồ bắt đầu từ **thời điểm
vào scene**, với điều kiện lúc đó `Curfew_FL` tắt và `teacherRoundTimer` chưa chạy. Nếu
`Curfew_FL` đang bật thì đồng hồ chưa khởi động chút nào.

Cách đếm (`Run`, gọi mỗi frame với `dt`):

```lua
self.time = self.time + dt
self.t    = self.time / self.duration
if self.t >= 1 then self.time = self.duration; self.t = 1; self:Done() end
```

**Lặp ra sao — câu trả lời ngắn: không lặp.** Mỗi lần vào scene phát đúng một nhóm.

`playGossip` là `RunOnce`, chạy một lần rồi thôi. Không có khối nào đặt `gossipDelay.done`
về false, không có `OnReset`, không có vòng lặp. Sau khi nhóm `N` chạy hết chuỗi `.done`,
kênh `Voice1` về 0.5 và im cho tới khi rời scene.

Nhịp thật sự là **theo lần vào scene, không theo thời gian**:

| Lần vào | `VarTable.Gossip` sau `incrementGossip` | Nghe được |
|---|---|---|
| 1 | 1 | nhóm 1 (`Calc`) |
| 2 | 2 | nhóm 2 (`Har`) |
| … | … | … |
| 21 | 21 | nhóm 21 (`Id`) |
| 22 trở đi | 22, 23, … | **im lặng** — `VarTable.Gossip < 22` sai |

Vào scene lần thứ 22 trở đi thì cả `playGossip` lẫn `fadeInGossip` đều không kích hoạt.
`incrementGossip` vẫn tăng bộ đếm vì nó không bị chặn bởi điều kiện nào.

Vì `VarTable` nằm trong savegame, thứ tự này **liên tục qua các phiên chơi** — không reset
theo ngày trong game, không reset khi load. Nghe hết 21 nhóm là hết vĩnh viễn.

Rời quầy sau khi lấy chìa khoá hầm thì `s4210` gọi
`Scene:BeginStream{stream = "GossipFadeStream", scene = "GossipFadeStream_SC"}`.
Script đó chỉ có một fader: `duration = 3, startVol = 0.6, endVol = 0.0` trên `Voice1` —
tắt hẳn tiếng tán gẫu trong lúc chuyển cảnh.

---

## 9. Còn thiếu

- 11 mã `UIFOOD` chưa đối chiếu (xem bảng mục 2) — nằm trong `UI_Text_SC` hoặc bảng autotext.
- Scene `4230` — vòng đơn giáo viên, chưa mổ.
- Ngưỡng thời gian để đơn giáo viên tính là "nhanh" hay "chậm".
- Độ thụt lề của dòng nhân sandwich (đo bằng pixel từ ảnh chụp nếu cần chính xác).
