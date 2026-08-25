// Trang thai game va toan bo tuong tac. Khong ve gi.

import { FOODS, DUR, POP, MAX_SANDWICH, DISPENSERS, FRIDGE, OVEN,
         TOASTER, TRASH, TRAYS, ORDERS_UI } from './data.js';
import { makeRound, findMatch } from './orders.js';
import { play, playTray, playPick } from './sound.js';
import { startGossip, stopGossip } from './gossip.js';
import { inR, rh } from './render.js';

export const S = {
  orders:[], scroll:0, scrollVel:0, contentH:0, held:null,
  fridgeOpen:false, fridgeT:0,
  oven:{state:'closedEmpty', dough:false, t:0},
  toaster:{state:'empty', food:null, count:0, t:0, frame:0},
  trays:[ {sandwich:[], slots:{}, vacantT:0}, {sandwich:[], slots:{}, vacantT:0} ],
  mouse:{x:320,y:200}, debug:false, flash:null, round:0,
};

export function newRound(){
  S.orders = makeRound();
  S.scroll = 0; S.held = null;
  S.trays.forEach(t => { t.sandwich = []; t.slots = {}; t.vacantT = 0; });
  S.oven = {state:'closedEmpty', dough:false, t:0};
  S.toaster = {state:'empty', food:null, count:0, t:0, frame:0};
  S.round++;
  stopGossip();
  startGossip();          // moi vong don = mot lan "vao scene" o ban goc
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
    play('tray.away');
    if (S.orders.every(o => o.filled)){ S.flash = {ok:true, t:1.6, done:true}; play('voice.allDone'); }
    else play('voice.correct');
  } else if (Object.keys(tray.slots).length || tray.sandwich.length){
    S.flash = {ok:false, t:0.8};
    play('voice.wrong');
  }
}

export function click(x, y){
  // nut Pick Up
  for (let i=0;i<2;i++) if (inR(TRAYS[i].button.onScreen,x,y)) return tryPickUp(i);

  // thung rac
  if (inR(TRASH.onScreen,x,y)){
    if (S.held) play('trash.drop');
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
  const o = S.oven;
  if (inR(OVEN.openHs,x,y)){
    if (o.state === 'closedEmpty'){ o.state = 'openEmpty'; play('oven.open'); return; }
    if (o.state === 'closedBaked'){ o.state = 'openBaked'; play('oven.open'); return; }
    if (o.state === 'openBaked' && !S.held){
      S.held = 'cookie'; o.state = 'closedEmpty'; o.dough = false;
      play('oven.cookieOut'); return;
    }
    if (o.state === 'openEmpty' && S.held === 'cookieDough'){
      S.held = null; o.state = 'openUnbaked'; o.dough = true;
      play('oven.doughIn'); return;
    }
  }
  if (inR(OVEN.closeHs,x,y)){
    if (o.state === 'openUnbaked'){
      o.state = 'baking'; o.t = DUR.bake; play('oven.close'); return;
    }
    if (o.state === 'openEmpty' || o.state === 'openBaked'){
      o.state = o.dough ? 'closedBaked' : 'closedEmpty'; play('oven.close'); return;
    }
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
      if (tray.vacantT > 0) continue;     // khay chua toi
      for (const [cat,slot] of Object.entries(T.slots)){
        if (!inR(slot,x,y) || f.cat !== cat) continue;
        if (cat === 'sandwich'){
          if (tray.sandwich.length >= MAX_SANDWICH) return;
          tray.sandwich.push(S.held); playTray('sandwich','place'); S.held = null; return;
        }
        tray.slots[cat] = S.held; playTray(cat,'place'); S.held = null; return;
      }
    }
  }
}

function scrollMax(){
  return Math.max(0, S.contentH - rh(ORDERS_UI.area));
}

export function scrollOrders(dir){
  S.scroll = Math.min(scrollMax(), Math.max(0, S.scroll + dir * ORDERS_UI.textHeight));
  S.scrollVel = 0;
}

// Re chuot len vung tren / duoi khung Orders thi tu cuon.
// Toc do khong bat len ngay ma tang dan theo catchUpFactor - giong ban goc.
function updateAutoScroll(dt){
  const U = ORDERS_UI;
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

  for (const tray of S.trays){
    if (tray.vacantT <= 0) continue;
    tray.vacantT -= dt;
    if (tray.vacantT <= 0){ tray.vacantT = 0; play('tray.arrive'); }
  }

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
