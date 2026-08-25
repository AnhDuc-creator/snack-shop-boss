# Viec chua lam

Xep theo thu tu tac dong toi cam giac choi.

## Anh huong nhieu nhat

- **Am thanh.** Toan bo ten file da biet (xem `docs/spec.md` muc 7), file nam san o
  `<game>/Sound/*.HIS`. Vuong o cho format `.HIS` chua giai ma. Doan la header +
  PCM hoac ADPCM, chua kiem chung. Day la thu thay doi cam giac choi ro nhat.
- **Vong don giao vien.** Scene `4230` trong `extracted/lua/` chua mo. Co chuong reo,
  xoa sach don hoc sinh dang cho, thuong credit hoac phat demerit tuy toc do.
  Nguong "nhanh"/"cham" chua biet.
- **Cuon tu dong khung Orders.** Ban goc dung `autoUpHs` / `autoDownHs`, toc do tang
  dan tu 0 toi 250. Hien tai chi cuon bang con lan chuot.

## Chi tiet con thieu

- **Loi tan gau (gossip).** Da moi xong, xem `docs/spec.md` muc 8. Chua noi vao game.
  Can 108 file `.HIS` tren kenh Voice1, khong can phu de.
  Mot suy dien chua chung minh truc tiep: `AR:Override` khong khai bao `active` thi mac dinh
  active = true (nen `incrementGossip` chay luc nap scene). `AR` nam ben engine C++, khong
  co file `.luac` de doc. Bang chung gian tiep: 104 khoi `AR:Override` trong game bo `active`,
  moi script `*_Amb_sfx_SC` deu dung dang `onInit = AR:Override{RunOnce=...}`, va `Timer_SC`
  ghi ro `if input.active == nil then self.active = true`. Muon chac tuyet doi thi phai
  chay thu trong game goc va dem xem lan vao thu 2 co nghe nhom 2 khong.
- 11 ma `UIFOOD` chua doi chieu. Nam trong `UI_Text_SC` hoac bang autotext.
  Cach lam: mo file do trong `extracted/lua/`, dung `tools/luatrace.py`.
- Animation mo/dong tu lanh va nap thung rac. Da co `ovlDuration = 0.25` cho thung rac.
- Bien dem `SnackRoundsTotal`, thuong 2 credit khi xong 5 vong, phat 3 demerit neu bo ngay.
- Don cot truyen cua Mel va Corine (da co du lieu trong spec, chua noi vao game).
- Nut quay ra khoi quay (`BACK_HS` da co toa do, chua gan hanh dong).

## Da xac minh, khong can lam lai

- Bang toa do atlas: 48/48 o deu nam trong bien va co noi dung. Da cat thu 12 sprite xem tan mat.
- Phan bo so don 5/10/60/25: chay 200.000 lan, khop. Co test tu dong.
- Thoi gian lo 5 giay: bam dong ho trong game goc, khop.
- O tren khay: dat hop sua trong game, roi dung o `drink`.
