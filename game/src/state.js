// Trang thai game va toan bo tuong tac. Khong ve gi.

import { FOODS, DUR, POP, TEACHER, MAX_SANDWICH, DISPENSERS, FRIDGE, OVEN,
         TOASTER, TRASH, TRAYS, ORDERS_UI } from './data.js';
import { makeRound, makeTeacherOrder, findMatch } from './orders.js';
import { play, playTray, playPick } from './sound.js';
import * as sound from './sound.js';
import { startGossip, stopGossip, pauseGossip } from './gossip.js';
import { recordRound, recordTeacher } from './stats.js';
import { inR, rh } from './render.js';

// Tuong duong VarTable cua ban goc: nguong thoi gian nho qua cac phien choi.
const STORE_KEY = 'snackshop.teacher';
const SEEN_KEY  = 'snackshop.teacherSeen';   // tuong duong REC_Initialize_FL
function loadThresholds(){
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY));
    if (v && typeof v.credit === 'number' && typeof v.demerit === 'number') return v;
  } catch { /* khong doc duoc thi dung mac dinh */ }
  return {credit: TEACHER.creditTime0, demerit: TEACHER.demeritTime0};
}
function saveThresholds(v){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch { /* bo qua */ }
}
function seenTeacher(){
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
}
function markTeacherSeen(){
  try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* bo qua */ }
}

/**
 * Phat mot am roi goi tiep khi no dut. Ban goc chan nhip nhu vay: buzzer dut
 * moi noi, noi xong moi cong demerit - khong phat chong len nhau.
 * Neu sound.js chua co playThen thi phat luon va goi tiep ngay, van chay duoc.
 */
function playThen(cue, next){
  if (typeof sound.playThen === 'function') sound.playThen(cue, next);
  else { play(cue); next && next(); }
}

export const S = {
  orders:[], scroll:0, scrollVel:0, contentH:0, held:null,
  fridgeOpen:false, fridgeT:0,
  trashT:0,                    // nap thung rac bat len trong DUR.trashLid giay
  oven:{state:'empty', t:0},
  toaster:{state:'empty', food:null, count:0, t:0, frame:0},
  trays:[ {sandwich:[], slots:{}, vacantT:0}, {sandwich:[], slots:{}, vacantT:0} ],
  mouse:{x:320,y:200}, debug:false, flash:null, round:0,
  teacher:{phase:'none', t:0, wait:0, buzzed:false, ...loadThresholds()},
};

export function newRound(){
  S.orders = makeRound();
  S.scroll = 0; S.held = null;
  S.trays.forEach(t => { t.sandwich = []; t.slots = {}; t.vacantT = 0; });
  S.oven = {state:'empty', t:0};
  S.toaster = {state:'empty', food:null, count:0, t:0, frame:0};
  S.round++;
  S.teacher.phase = 'none';
  S.teacher.t = 0;
  pauseGossip(false);
  stopGossip();
  startGossip();          // moi vong don = mot lan "vao scene" o ban goc
}

/** Sau moi vong hoc sinh, 1/4 kha nang giao vien den dat don. */
function maybeStartTeacher(){
  if (Math.floor(Math.random()*TEACHER.chanceOneIn) + 1 !== 2) return;
  S.teacher.phase = 'pending';
  S.teacher.wait  = TEACHER.delayMin + Math.random()*(TEACHER.delayMax - TEACHER.delayMin);
}

/**
 * Ban goc khong co ma nao xoa don hoc sinh - s4210 va s4231 la hai scene khac
 * nhau, roi scene la ca khoi bien mat. Nen o day dung lai quay tu so 0.
 */
function beginTeacherRound(){
  S.orders = [makeTeacherOrder()];
  S.scroll = 0; S.held = null;
  S.trays.forEach(t => { t.sandwich = []; t.slots = {}; t.vacantT = 0; });
  S.oven = {state:'empty', t:0};
  S.toaster = {state:'empty', food:null, count:0, t:0, frame:0};
  S.teacher.phase = 'active';
  S.teacher.t = 0;
  S.teacher.buzzed = false;
  pauseGossip(true);            // gossipDelay.active kiem `not teacherRoundTimer.active`
  const firstTime = !seenTeacher();
  markTeacherSeen();
  // lan dau Nancy giai thich luat, cac lan sau chi nhac ngan
  playThen('teacher.bell',
           () => play(firstTime ? 'voice.teacherIntroFirst' : 'voice.teacherIntro'));
}

function endTeacherRound(outcome){
  const T = S.teacher;
  T.phase = 'done';
  pauseGossip(false);
  S.flash = {ok: outcome !== 'demerit', t:1.6, done:true, teacher:outcome};

  if (outcome === 'credit'){
    recordTeacher('credit');
    // moi lan thang lui ca hai moc di 1 giay, co san
    T.credit  = Math.max(TEACHER.creditFloor,  T.credit  - 1);
    T.demerit = Math.max(TEACHER.demeritFloor, T.demerit - 1);
    saveThresholds({credit:T.credit, demerit:T.demerit});
    play('teacher.bell');
    return;
  }

  if (outcome === 'none'){          // xong nhung cham - khong thuong khong phat
    play('voice.teacherFaster');
    return;
  }

  // thua: buzzer dut -> Nancy noi -> luc do moi cong demerit
  // ban goc chan nhip: buzzer dut -> Nancy noi -> luc do moi cong demerit
  playThen('teacher.fail',
           () => playThen('voice.teacherDemerit', () => recordTeacher('demerit')));
}

export function tryPickUp(ti){
  const tray = S.trays[ti];
  if (tray.vacantT > 0) return;           // khay chua toi
  const idx = findMatch(S.orders, tray);
  if (idx >= 0){
    S.orders[idx].filled = true;
    tray.sandwich = []; tray.slots = {};
    tray.vacantT = DUR.trayVacant;        // cho trong truoc khi khay moi toi
    S.flash = {ok:true, t:0.8};
    play(S.teacher.phase === 'active' ? 'teacher.trayAway' : 'tray.away');

    if (S.teacher.phase === 'active'){
      const t = S.teacher.t;
      // <= creditTime: duoc credit.  giua hai moc: khong thuong khong phat.
      endTeacherRound(t <= S.teacher.credit ? 'credit' : 'none');
      return;
    }

    if (S.orders.every(o => o.filled)){
      const reward = recordRound();          // SnackRoundsTotal += 1
      S.flash = {ok:true, t:1.6, done:true, reward};
      play('voice.allDone');
      maybeStartTeacher();
    } else play('voice.correct');
  } else if (Object.keys(tray.slots).length || tray.sandwich.length){
    S.flash = {ok:false, t:0.8};
    play('voice.wrong');
  }
}

export function click(x, y){
  // Keo thanh cuon
  if (beginScrollDrag(x, y)) return;

  // nut Pick Up
  for (let i=0;i<2;i++) if (inR(TRAYS[i].button.onScreen,x,y)) return tryPickUp(i);

  // thung rac
  if (inR(TRASH.onScreen,x,y)){
    if (S.held){ play('trash.drop'); S.trashT = DUR.trashLid; }
    S.held = null; return;
  }

  // tay khong bam vao mon da dat -> nhac len lai
  if (!S.held){
    for (let i=0;i<2;i++){
      const T = TRAYS[i], tray = S.trays[i];
      if (tray.vacantT > 0) continue;     // khay chua toi
      for (const [cat,slot] of Object.entries(T.slots)){
        if (!inR(slot,x,y)) continue;
        if (cat === 'sandwich'){
          if (tray.sandwich.length){
            S.held = tray.sandwich.pop(); playTray('sandwich','pick'); return;
          }
        } else if (tray.slots[cat]){
          S.held = tray.slots[cat]; delete tray.slots[cat];
          playTray(cat,'pick'); return;
        }
      }
    }
  }

  // tu lanh
  if (inR(FRIDGE.hotspot,x,y) && !S.fridgeOpen){
    S.fridgeOpen = true; S.fridgeT = DUR.fridgeOpen; play('fridge.open'); return;
  }
  if (S.fridgeOpen){
    for (const [name,r] of Object.entries(FRIDGE.items))
      if (inR(r,x,y) && !S.held){
        S.held = name; S.fridgeT = DUR.fridgeOpen;
        playPick('fridge', name); return;
      }
  }

  // lo cookie
  // Lo cookie. Ban goc CHI co cac trang thai co bot tro di:
  //   closedUnbaked -> openUnbaked -> baking -> closedBaked -> openBaked
  // Khong co "mo ma rong" - nen cam bot bam mot cai la vao lo luon,
  // khong phai bam mot lan mo cua roi bam lan nua moi bo duoc.
  const o = S.oven;
  if (inR(OVEN.openHs,x,y)){
    if (o.state === 'empty' && S.held === 'cookieDough'){
      S.held = null; o.state = 'openUnbaked'; play('oven.doughIn'); return;
    }
    if (o.state === 'closedBaked'){ o.state = 'openBaked'; play('oven.open'); return; }
    if (o.state === 'openBaked' && !S.held){
      S.held = 'cookie'; o.state = 'empty'; play('oven.cookieOut'); return;
    }
    if (o.state === 'openUnbaked' && !S.held){    // doi y, lay bot ra
      S.held = 'cookieDough'; o.state = 'empty'; return;
    }
  }
  if (inR(OVEN.closeHs,x,y)){
    if (o.state === 'openUnbaked'){
      o.state = 'baking'; o.t = DUR.bake; play('oven.close'); return;
    }
    if (o.state === 'openBaked'){ o.state = 'closedBaked'; play('oven.close'); return; }
  }

  // may nuong: mot lan nuong cho ra HAI nua banh
  const t = S.toaster;
  if (inR(TOASTER.placeHs,x,y)){
    if (t.state === 'empty' && S.held && FOODS[S.held]?.bun && !S.held.includes('Toasted')){
      t.food = S.held; t.state = 'full'; t.count = 1; S.held = null;
      play('toaster.in'); return;
    }
    if (t.state === 'done' && !S.held){
      S.held = t.food.replace('bread','breadToasted').replace('bagel','bagelToasted');
      if (--t.count <= 0){ t.food = null; t.state = 'empty'; }
      play('toaster.out'); return;
    }
    if (t.state === 'full' && !S.held){
      S.held = t.food; t.food = null; t.state = 'empty'; play('toaster.out'); return;
    }
  }
  if (inR(TOASTER.startHs,x,y) && t.state === 'full'){
    t.state = 'toasting'; t.t = DUR.toast; t.frame = 0; play('toaster.lever'); return;
  }

  // lay nguyen lieu tren quay
  if (!S.held) for (const [name,r] of Object.entries(DISPENSERS))
    if (inR(r,x,y)){ S.held = name; playPick('counter', name); return; }

  // dat len khay
  if (S.held){
    const f = FOODS[S.held];
    if (!f.cat) return;                       // cookieDough khong dat duoc
    for (let i=0;i<2;i++){
      const T = TRAYS[i], tray = S.trays[i];
      if (tray.vacantT > 0) continue;         // khay chua toi
      // CO Y LECH BAN GOC: ban goc bat dat dung o. O day bam bat cu dau tren khay
      // la mon tu vao o cua nhom no. Do kho cua game nam o doc dung don va kip gio,
      // khong phai o viec nho o nao nhan gi.
      if (!inR(T.onScreen, x, y) && !inR(T.slots[f.cat], x, y)) continue;
      if (f.cat === 'sandwich'){
        if (tray.sandwich.length >= MAX_SANDWICH) return;
        tray.sandwich.push(S.held); playTray('sandwich','place'); S.held = null; return;
      }
      tray.slots[f.cat] = S.held; playTray(f.cat,'place'); S.held = null; return;
    }
  }
}

function scrollMax(){
  return Math.max(0, S.contentH - rh(ORDERS_UI.area));
}

/** Hinh hoc thanh cuon o mep phai khung Orders. Tra ve null neu khong can cuon. */
export function scrollBarRect(){
  const a = ORDERS_UI.area, B = ORDERS_UI.bar;
  const max = scrollMax();
  if (max <= 0) return null;
  const trackX = a[2] - B.width - B.margin;
  const trackY = a[1] + B.margin;
  const trackH = rh(a) - B.margin * 2;
  const ratio  = rh(a) / S.contentH;
  const thumbH = Math.max(B.minThumb, trackH * ratio);
  const thumbY = trackY + (trackH - thumbH) * (S.scroll / max);
  return {track:[trackX, trackY, trackX + B.width, trackY + trackH],
          thumb:[trackX, thumbY, trackX + B.width, thumbY + thumbH],
          trackY, trackH, thumbH, max};
}

let dragOffset = null;

/** Bam vao thanh cuon: keo nut, hoac bam vao ray thi nhay toi cho do. */
export function beginScrollDrag(x, y){
  const b = scrollBarRect();
  if (!b) return false;
  const wide = [b.track[0] - 4, b.track[1], b.track[2] + 2, b.track[3]];
  if (!inR(wide, x, y)) return false;
  if (inR([wide[0], b.thumb[1], wide[2], b.thumb[3]], x, y)){
    dragOffset = y - b.thumb[1];
  } else {
    dragOffset = b.thumbH / 2;
    moveScrollDrag(y);
  }
  return true;
}

export function moveScrollDrag(y){
  if (dragOffset === null) return;
  const b = scrollBarRect();
  if (!b) return;
  const span = b.trackH - b.thumbH;
  const t = span > 0 ? (y - dragOffset - b.trackY) / span : 0;
  S.scroll = Math.min(b.max, Math.max(0, t * b.max));
}

export function endScrollDrag(){ dragOffset = null; }
export function isScrollDragging(){ return dragOffset !== null; }

export function scrollOrders(dir){
  S.scroll = Math.min(scrollMax(), Math.max(0, S.scroll + dir * ORDERS_UI.textHeight));
  S.scrollVel = 0;
}

// Re chuot len vung tren / duoi khung Orders thi tu cuon.
// Toc do khong bat len ngay ma tang dan theo catchUpFactor - giong ban goc.
function updateAutoScroll(dt){
  const U = ORDERS_UI;
  if (!U.autoScroll){ S.scrollVel = 0; return; }
  const over = p => inR(p, S.mouse.x, S.mouse.y);
  let target = 0;
  if      (over(U.upHs))   target = -U.maxSpeed;
  else if (over(U.downHs)) target =  U.maxSpeed;

  // tien toi target, doc lap voi fps
  const k = 1 - Math.pow(1 - U.catchUpFactor, dt * 60);
  S.scrollVel += (target - S.scrollVel) * k;
  if (Math.abs(S.scrollVel) < 1) S.scrollVel = 0;

  if (S.scrollVel){
    S.scroll = Math.min(scrollMax(), Math.max(0, S.scroll + S.scrollVel * dt));
    if (S.scroll === 0 || S.scroll === scrollMax()) S.scrollVel = 0;
  }
}

// Cap nhat cac bo dem thoi gian
export function tick(dt){
  updateAutoScroll(dt);

  const T = S.teacher;
  if (T.phase === 'pending'){
    T.wait -= dt;
    if (T.wait <= 0) beginTeacherRound();
  } else if (T.phase === 'active'){
    T.t += dt;
    if (!T.buzzed && T.t >= T.credit){    // mat cua credit - keu dung mot lan
      T.buzzed = true; play('teacher.buzz');
    }
    if (T.t >= T.demerit) endTeacherRound('demerit');   // het gio la thua, ke ca dang lam do
  }

  for (const tray of S.trays){
    if (tray.vacantT <= 0) continue;
    tray.vacantT -= dt;
    if (tray.vacantT <= 0){ tray.vacantT = 0; play('tray.arrive'); }
  }

  if (S.trashT > 0) S.trashT -= dt;

  if (S.fridgeOpen){
    S.fridgeT -= dt;
    if (S.fridgeT <= 0){ S.fridgeOpen = false; play('fridge.close'); }
  }

  if (S.oven.state === 'baking'){
    S.oven.t -= dt;
    if (S.oven.t <= 0){ S.oven.state = 'closedBaked'; play('oven.done'); }
  }

  const t = S.toaster;
  if (t.state === 'toasting'){
    t.t -= dt;
    if (t.t <= 0){ t.state = 'popping'; t.t = POP; t.frame = 0; play('toaster.pop'); }
  } else if (t.state === 'popping'){
    t.t -= dt;
    t.frame = Math.floor((POP - t.t) / POP * 6);
    if (t.t <= 0){ t.state = 'done'; t.count = 2; }
  }

  if (S.flash) S.flash.t -= dt;
}
