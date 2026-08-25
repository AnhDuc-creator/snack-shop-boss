# Viec chua lam

Xep theo thu tu tac dong toi cam giac choi.

## Anh huong nhieu nhat

- **Vong don giao vien.** Scene `4230` trong `extracted/lua/` chua mo. Co chuong reo,
  xoa sach don hoc sinh dang cho, thuong credit hoac phat demerit tuy toc do.
  Nguong "nhanh"/"cham" chua biet.

## Chi tiet con thieu

- 11 ma `UIFOOD` chua doi chieu. Nam trong `UI_Text_SC` hoac bang autotext.
  Cach lam: mo file do trong `extracted/lua/`, dung `tools/luatrace.py`.
- Animation mo/dong tu lanh va nap thung rac. Da co `ovlDuration = 0.25` cho thung rac.
- Bien dem `SnackRoundsTotal`, thuong 2 credit khi xong 5 vong, phat 3 demerit neu bo ngay.
- Don cot truyen cua Mel va Corine (da co du lieu trong spec, chua noi vao game).
- Nut quay ra khoi quay (`BACK_HS` da co toa do, chua gan hanh dong).

## Sua theo phan hoi nguoi choi

- **Lo nuong bi khung mot cu bam.** LOI THAT, da sua. Toi tu bia them hai trang
  thai `closedEmpty` / `openEmpty` khong co trong ban goc - danh sach that la
  `closedUnbaked -> openUnbaked -> baking -> closedBaked -> openBaked`, may trang
  thai chi ton tai tu luc co bot. Gio cam bot bam mot cai la vao lo luon.

## Co y lech ban goc

Ghi ra day de sau nay khong ai "sua nham" lai.

- **Thanh cuon thay cho cuon tu dong.** Ban goc chi cuon khi re chuot len mep
  khung Orders (`autoUpHs`/`autoDownHs`, toc do tang dan toi 250). Choi thu thay
  phien vi chuot di ngang qua la danh sach chay. Doi sang thanh cuon keo duoc o
  mep phai + con lan. Co `ORDERS_UI.autoScroll` trong `data.js`, dat `true` la
  tro ve ban goc.
- **Dat mon vao bat cu dau tren khay.** Ban goc bat dat dung o cua tung nhom.
  Nguoi choi khong the nho o nao nhan gi. Gio bam bat cu dau tren khay la mon tu
  vao dung o. Do kho cua game nam o doc dung don va kip gio, khong phai o viec
  nho vi tri.
- **To sang o hop le khi dang cam mon.** Ban goc khong co. Chi hien luc dang cam,
  buong ra la bien mat nen khong che art luc binh thuong.
- **Vach thoi gian vong giao vien.** Ban goc chi bao bang tieng chuong.
- **Gossip quay vong khi het 21 nhom.** Xem `LOOP_WHEN_EXHAUSTED` trong `gossip.js`.
- **Thanh diem va hang phim tat** nam NGOAI khung 640x400. Trong khung la art goc,
  khong ve de len.

## Da lam xong

- **Ho tro cam ung.** Doi tu mouse event sang pointer event, them
  `touch-action:none`. Cham vao vung cuon cua khung Orders thi nhay mot dong -
  cam ung khong co hover nen cuon tu dong khong dung duoc.
- **Che do tu kiem (phim T).** `game/src/selfcheck.js` doi chieu moi ten file
  duoc `CUES` va `GOSSIP` tham chieu voi file that tren may chu, bao ngay file
  nao thieu va thieu o cue nao. Ly do can: Live Server tren Windows KHONG phan
  biet hoa thuong nhung GitHub Pages thi CO - loi lech hoa thuong chi lo ra sau
  khi deploy.

- **Diem va tien do.** `game/src/stats.js` - `SnackRoundsTotal`, credit, demerit,
  thanh tich vong giao vien, tat ca nho qua cac phien bang localStorage.
  Xong 5 vong duoc 2 credit; `activeDemerits = demerits - credits` la so sach chinh.
  Hien o thanh HTML DUOI canvas, khong ve vao trong khung 640x400.
  Ban goc ghi "five rounds in a day"; ban web khong co khai niem "ngay" nen tinh
  tren tong so vong - da ghi chu trong `stats.js`.

- **Am thanh.** Format `.HIS` da giai: vo 32 byte (magic `HIS\0` + khoi WAVEFORMATEX +
  truong codec) boc ngoai Ogg Vorbis (codec 2) hoac PCM tho (codec 1). Xac nhan bang
  cach so kich thuoc PCM giai ma voi truong `dsize` - khop chinh xac.
  Cong cu: `tools/his_to_wav.py`. Module: `game/src/sound.js`.
  Nhom Vorbis tach nguyen bitstream (khong giai ma lai lan nao), nhom PCM giu `.wav`
  lossless. Trinh nap tu do duoi `.ogg` roi `.wav` nen khong can bang tra.

- **Cuon tu dong khung Orders.** Re chuot len vung `upHs` / `downHs` thi tu cuon,
  toc do tang dan tu 0 toi 250 theo `catchUpFactor = 0.25`. Da kiem tra doc lap fps:
  30 / 60 / 144 fps cho ket qua chenh duoi 1%. Con lan chuot van dung duoc.

## Da xac minh, khong can lam lai

- Bang toa do atlas: 48/48 o deu nam trong bien va co noi dung. Da cat thu 12 sprite xem tan mat.
- Phan bo so don 5/10/60/25: chay 200.000 lan, khop. Co test tu dong.
- Thoi gian lo 5 giay: bam dong ho trong game goc, khop.
- O tren khay: dat hop sua trong game, roi dung o `drink`.
