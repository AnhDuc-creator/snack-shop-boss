// Ve toan bo man hinh. Khong chua logic game.

import { W, H, FOODS, FRIDGE, OVEN, TOASTER, TRASH, TRAYS, ORDERS_UI,
         DISPENSERS, BACK_HS } from './data.js';
import { orderLines } from './orders.js';
import { S, scrollBarRect } from './state.js';
import { TEACHER } from './data.js';

export const inR = (r,x,y) => x>=r[0] && x<r[2] && y>=r[1] && y<r[3];
export const rw  = r => r[2]-r[0];
export const rh  = r => r[3]-r[1];

let cx, atlas, bg;
export function initRender(ctx, atlasImg, bgImg){ cx = ctx; atlas = atlasImg; bg = bgImg; }

function blit(src, dx, dy){
  cx.drawImage(atlas, src[0], src[1], rw(src), rh(src), dx, dy, rw(src), rh(src));
}
function blitTo(src, dst){
  cx.drawImage(atlas, src[0], src[1], rw(src), rh(src), dst[0], dst[1], rw(src), rh(src));
}

// Sprite cua mon: bien the trai/phai theo khay.
// Voi banh: Up = mat cat ngua (nua duoi), Down = up xuong thay vo (nua tren).
export function foodSrc(name, side, half){
  const f = FOODS[name];
  if (f.bun) return f[(side==='left'?'left':'right') + (half==='down'?'Down':'Up')];
  return side==='left' ? f.left : f.right;
}

/**
 * Khi dang cam mon, to sang o nhan mon do tren ca hai khay.
 * Ban goc khong co - them vao vi nguoi choi khong the nho o nao nhan gi.
 * Chi hien luc dang cam, buong ra la bien mat, nen khong che art luc binh thuong.
 */
function drawSlotHint(){
  const f = FOODS[S.held];
  if (!f || !f.cat) return;
  const pulse = 0.30 + 0.16 * Math.sin(performance.now() / 260);
  for (let i = 0; i < 2; i++){
    if (S.trays[i].vacantT > 0) continue;
    const slot = TRAYS[i].slots[f.cat];
    if (!slot) continue;
    cx.save();
    cx.strokeStyle = `rgba(255,232,150,${pulse + 0.25})`;
    cx.fillStyle   = `rgba(255,232,150,${pulse * 0.30})`;
    cx.lineWidth = 1.5;
    cx.fillRect(slot[0], slot[1], rw(slot), rh(slot));
    cx.strokeRect(slot[0] + .5, slot[1] + .5, rw(slot) - 1, rh(slot) - 1);
    cx.restore();
  }
}

export function drawTray(tray, ti){
  const T = TRAYS[ti];
  if (tray.vacantT > 0) return;      // khay da duoc mang di, chua co khay moi
  blitTo(T.source, T.onScreen);

  // mon roi: can day o
  for (const cat of ['drink','fruit','dessert','side']){
    const name = tray.slots[cat]; if (!name) continue;
    const s = foodSrc(name, T.side);
    const slot = T.slots[cat];
    blit(s, slot[0], slot[3] - rh(s));
  }
  // sandwich: banh duoi nam sat day o, moi lop nhich len it mot,
  // banh tren dat cuoi cung. Giu khoi banh thap de nam gon tren dia.
  if (tray.sandwich.length){
    const slot = T.slots.sandwich;
    const last = tray.sandwich.length - 1;
    let lift = 0;
    tray.sandwich.forEach((name, i) => {
      const f = FOODS[name];
      const isBun = !!f.bun;
      // Up = mat cat ngua len (nua duoi), Down = up xuong thay vo (nua tren)
      const half  = (i === 0) ? 'up' : 'down';
      const s = foodSrc(name, T.side, half);
      const x = slot[0] + (rw(slot) - rw(s)) / 2 | 0;
      cx.drawImage(atlas, s[0], s[1], rw(s), rh(s),
                   x, slot[3] - rh(s) - lift, rw(s), rh(s));
      if (i < last) lift += isBun ? 6 : 4;
    });
  }
  blitTo(T.button.source, T.button.onScreen);
}

export function drawOrders(){
  const a = ORDERS_UI.area, lh = ORDERS_UI.textHeight;
  const padL = 6, padT = 3;
  const padR = ORDERS_UI.bar.width + ORDERS_UI.bar.margin * 2;
  cx.save();
  cx.beginPath(); cx.rect(a[0], a[1], rw(a) - padR, rh(a)); cx.clip();
  cx.font = '11px Georgia, serif';
  cx.textBaseline = 'alphabetic';
  cx.fillStyle = '#111';
  let y = a[1] + padT - S.scroll;
  const live = S.orders.filter(o => !o.filled);   // don xong bi go khoi danh sach
  live.forEach((o, oi) => {
    for (const line of orderLines(o)){
      cx.fillText(line.text, a[0] + padL + (line.indent ? ORDERS_UI.indent : 0), y + lh - 2);
      y += lh;
    }
    if (oi < live.length - 1){                    // khong ve vach sau don cuoi
      blit(ORDERS_UI.spacer, a[0] + (rw(a) - rw(ORDERS_UI.spacer)) / 2 | 0, y + 2);
      y += rh(ORDERS_UI.spacer) + 4;
    }
  });
  S.contentH = y + S.scroll - a[1];
  cx.restore();

  drawScrollBar();
  if (S.teacher.phase === 'active') drawTeacherTimer(a);
}

// CO Y LECH BAN GOC: ban goc khong co thanh cuon, chi cuon tu dong khi re chuot
// len mep khung. Choi thu thay phien nen doi sang thanh cuon + con lan.
function drawScrollBar(){
  const b = scrollBarRect();
  if (!b) return;
  cx.fillStyle = 'rgba(20,40,60,.25)';
  cx.fillRect(b.track[0], b.track[1], rw(b.track), rh(b.track));
  cx.fillStyle = 'rgba(30,60,90,.75)';
  cx.fillRect(b.thumb[0], b.thumb[1], rw(b.thumb), rh(b.thumb));
}

/**
 * Ban goc khong hien dong ho - chi bao bang tieng chuong luc mat cua credit.
 * O day ve mot vach mong duoi khung Orders: xanh khi con trong cua credit,
 * do khi da qua. Doi mau chu khong hien so, giu tinh than "nghe chu khong nhin".
 */
function drawTeacherTimer(a){
  const T = S.teacher;
  const w = rw(a);
  const frac = Math.min(1, T.t / T.demerit);
  cx.fillStyle = 'rgba(0,0,0,.35)';
  cx.fillRect(a[0], a[3] + 2, w, 3);
  cx.fillStyle = T.t <= T.credit ? '#4caf50' : '#e53935';
  cx.fillRect(a[0], a[3] + 2, w * (1 - frac), 3);
}

export function drawDebug(){
  cx.lineWidth = 1; cx.font = '8px sans-serif'; cx.textBaseline = 'top';
  const boxes = [];
  for (const [n,r] of Object.entries(DISPENSERS)) boxes.push([n,r]);
  boxes.push(['scrollUp',ORDERS_UI.upHs], ['scrollDown',ORDERS_UI.downHs],
             ['frig',FRIDGE.hotspot], ['ovenOpen',OVEN.openHs], ['ovenClose',OVEN.closeHs],
             ['toastPlace',TOASTER.placeHs], ['toastStart',TOASTER.startHs],
             ['trash',TRASH.onScreen], ['back',BACK_HS],
             ['pickL',TRAYS[0].button.onScreen], ['pickR',TRAYS[1].button.onScreen]);
  for (const [k,slot] of Object.entries(TRAYS[0].slots)) boxes.push(['L:'+k, slot]);
  for (const [k,slot] of Object.entries(TRAYS[1].slots)) boxes.push(['R:'+k, slot]);
  if (S.fridgeOpen) for (const [n,r] of Object.entries(FRIDGE.items)) boxes.push(['f:'+n, r]);
  if (S.teacher.phase !== 'none'){
    cx.fillStyle = '#ff0'; cx.font = '9px monospace';
    const T = S.teacher;
    cx.fillText(`teacher ${T.phase} t=${T.t.toFixed(1)} credit<=${T.credit} demerit>=${T.demerit}`,
                4, 4);
    cx.fillText(`(diem hien o thanh duoi canvas)`, 4, 15);
  }

  for (const [n,r] of boxes){
    cx.strokeStyle = n.startsWith('L:') || n.startsWith('R:')
      ? 'rgba(40,140,255,.9)' : 'rgba(255,0,0,.7)';
    cx.strokeRect(r[0]+.5, r[1]+.5, rw(r)-1, rh(r)-1);
    cx.fillStyle = '#ff0'; cx.fillText(n, r[0]+2, r[1]+1);
  }
}

export function draw(){
  cx.clearRect(0,0,W,H);
  if (bg.complete) cx.drawImage(bg, 0, 0);

  // Tu lanh va thung rac chi co HAI trang thai, khong co dai khung hinh:
  // dong nam san trong bg.png, mo la lop phu tu atlas de len (z = -0.1).
  if (S.fridgeOpen) blitTo(FRIDGE.source, FRIDGE.onScreen);
  if (S.trashT > 0) blitTo(TRASH.source, TRASH.onScreen);

  // lo
  // Atlas chi co hai lop phu: lo mo co bot song, va lo mo co cookie chin.
  // Khong co lop "mo ma rong" - vi ban goc khong co trang thai do.
  const ov = S.oven.state;
  if (ov === 'openUnbaked') blitTo(OVEN.unbaked, OVEN.onScreen);
  if (ov === 'openBaked')   blitTo(OVEN.baked,   OVEN.onScreen);
  const done = ov === 'closedBaked' || ov === 'openBaked';
  blitTo(done ? OVEN.greenSrc : OVEN.redSrc, done ? OVEN.greenOn : OVEN.redOn);

  // may nuong
  const tt = S.toaster;
  if (tt.food){
    const kind = tt.food.startsWith('bagel') ? 'bagel' : 'bread';
    const K = TOASTER.src[kind];
    if (tt.state === 'full')          blitTo(K.up2, TOASTER.onScreen);          // can gat len, 2 nua song
    else if (tt.state === 'toasting') blitTo(K.down, TOASTER.onScreen);         // chim trong lo, can gat xuong
    else if (tt.state === 'popping')  blitTo(TOASTER.anim[kind][Math.min(5,tt.frame)], TOASTER.onScreen);
    else if (tt.state === 'done')     blitTo(tt.count >= 2 ? K.toasted2 : K.toasted1, TOASTER.onScreen);
  }

  S.trays.forEach(drawTray);
  if (S.held) drawSlotHint();
  drawOrders();

  if (S.flash && S.flash.t > 0){
    cx.fillStyle = S.flash.ok ? 'rgba(60,200,90,.20)' : 'rgba(220,60,60,.20)';
    cx.fillRect(0,0,W,H);
    if (S.flash.done){
      cx.fillStyle = '#fff'; cx.font = '20px Georgia, serif'; cx.textAlign = 'center';
      cx.fillText('Xong mot vong', W/2, H/2); cx.textAlign = 'left';
    }
  }

  if (S.debug) drawDebug();

  // mon dang cam theo con tro
  if (S.held){
    const s = foodSrc(S.held, 'left');
    blit(s, S.mouse.x - rw(s)/2 | 0, S.mouse.y - rh(s)/2 | 0);
  } else {
    cx.fillStyle = '#fff'; cx.strokeStyle = '#000';
    cx.beginPath(); cx.arc(S.mouse.x, S.mouse.y, 3, 0, 7); cx.fill(); cx.stroke();
  }
}
