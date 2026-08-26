// Phu de cho loi tan gau.
//
// Ban goc hien phu de o thanh giao dien DUOI vung choi, khong de len canh.
// O day cung vay: mot the HTML duoi canvas, khong ve vao khung 640x400.
//
// Du lieu tu `assets/gossip-captions.json`, dang { "ten_file": "cau thoai" }.
// Muon them hoi thoai moi (easter egg) thi chi can ba buoc, khong phai sua code:
//   1. them file am vao `assets/sound/`
//   2. them mot muc vao `gossip-captions.json`
//   3. them nhom vao bang `GOSSIP` trong `gossip.js`

const URL = 'assets/gossip-captions.json';
const KEY = 'snackshop.captions';     // tuong duong ClosedCaptioning trong Waverly.INI

let captions = null;          // ten file -> chuoi
let el = null;
let showing = null;           // ten file dang hien, de khong xoa nham cua cau sau
let enabled = true;

try {
  const v = localStorage.getItem(KEY);
  if (v !== null) enabled = v === '1';
} catch { /* dung mac dinh */ }

/** Gan the chua phu de va nap bang. Goi mot lan luc khoi dong. */
export async function initCaptions(element){
  el = element;
  render();
  try {
    const res = await fetch(URL);
    if (res.ok) captions = await res.json();
    else console.warn('[caption] khong nap duoc', URL, res.status);
  } catch (e){
    console.warn('[caption] khong nap duoc', URL, e.message);
  }
}

/** Hien phu de cua mot clip. Khong co trong bang thi khong hien gi. */
export function showCaption(name){
  const text = captions && captions[name];
  if (!text) return;
  showing = name;
  render(text);
}

/** Xoa phu de, nhung chi khi no van dang la cua clip nay. */
export function hideCaption(name){
  if (name && showing !== name) return;
  showing = null;
  render();
}

function render(text){
  if (!el) return;
  el.textContent = enabled && text ? text : '';
  el.classList.toggle('on', !!(enabled && text));
}

export function toggleCaptions(){
  enabled = !enabled;
  try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch { /* bo qua */ }
  if (!enabled) render();
  return enabled;
}

export function captionsEnabled(){ return enabled; }

/** Da nap duoc bao nhieu muc - cho che do tu kiem. */
export function captionCount(){ return captions ? Object.keys(captions).length : 0; }
