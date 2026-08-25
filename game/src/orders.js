// Bo sinh don hang va so khop khay - chep tu ham Generator trong s4210.luac.
// File nay thuan tuy, khong dung DOM, nen chay test bang Node duoc:
//   node --test game/test/

import { FOODS, FILLINGS, BUNS, BY_CAT, CATS } from './data.js';

export const rnd  = (a,b) => a + Math.floor(Math.random()*(b-a+1));
export const pick = arr => arr[Math.floor(Math.random()*arr.length)];

export function shuffle(a){
  a = a.slice();
  for (let i=a.length-1; i>0; i--){ const j = rnd(0,i); [a[i],a[j]] = [a[j],a[i]]; }
  return a;
}

// So don moi vong. Bang xac suat goc: 3->5%, 4->10%, 5->60%, 6->25%
export function orderCount(){
  const r = Math.random()*100;
  if (r <  5) return 3;
  if (r < 15) return 4;
  if (r < 75) return 5;
  return 6;
}

// Mot don: boc 3-5 nhom trong 5 nhom, moi nhom mot mon.
// Sandwich: mot loai banh + 1-4 nhan, xep banh + nhan + banh.
// Giu nguyen thu tu boc de hien thi dung nhu ban goc (khong sap xep lai).
export function makeOrder(){
  const chosen = shuffle(CATS).slice(0, rnd(3,5));
  const parts = [];
  for (const cat of chosen){
    if (cat === 'sandwich'){
      const bun = pick(BUNS);
      const fills = [];
      for (let i = rnd(1,4); i > 0; i--) fills.push(pick(FILLINGS));
      parts.push({cat:'sandwich', stack:[bun, ...fills, bun]});
    } else {
      parts.push({cat, food: pick(BY_CAT[cat])});
    }
  }
  return {parts, filled:false};
}

// Don giao vien. Khac don hoc sinh dung ba cho, phan con lai giong het:
//   - luon MOT don (khong phai 3-6)
//   - luon du CA NAM nhom (khong phai 3-5)
//   - sandwich 6-8 nhan (khong phai 1-4)
// Do kho nam o day chu khong phai o dong ho chay nhanh hon.
export function makeTeacherOrder(){
  const chosen = shuffle(CATS);          // ca 5 nhom, thu tu ngau nhien
  const parts = [];
  for (const cat of chosen){
    if (cat === 'sandwich'){
      const bun = pick(BUNS);
      const fills = [];
      for (let i = rnd(6,8); i > 0; i--) fills.push(pick(FILLINGS));
      parts.push({cat:'sandwich', stack:[bun, ...fills, bun]});
    } else {
      parts.push({cat, food: pick(BY_CAT[cat])});
    }
  }
  return {parts, filled:false, teacher:true};
}

export function makeRound(){
  const n = orderCount();
  return Array.from({length:n}, makeOrder);
}

// --- so khop ---
// Mon roi so theo nhom, khong quan tam thu tu dat.
// Sandwich so theo dung thu tu tung lop tu duoi len.

export function traySignature(tray){
  const sig = {};
  for (const c of ['drink','fruit','dessert','side']) if (tray.slots[c]) sig[c] = tray.slots[c];
  if (tray.sandwich.length) sig.sandwich = tray.sandwich.join(',');
  return sig;
}

export function orderSignature(order){
  const sig = {};
  for (const p of order.parts){
    if (p.cat === 'sandwich') sig.sandwich = p.stack.join(',');
    else sig[p.cat] = p.food;
  }
  return sig;
}

export function sameSig(a, b){
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  if (ka.length !== kb.length) return false;
  return ka.every((k,i) => k === kb[i] && a[k] === b[k]);
}

// Tra ve chi so don khop, hoac -1
export function findMatch(orders, tray){
  const sig = traySignature(tray);
  if (!Object.keys(sig).length) return -1;
  return orders.findIndex(o => !o.filled && sameSig(sig, orderSignature(o)));
}

// Cac dong chu hien tren ticket, kem co thut le
export function orderLines(order){
  const out = [];
  for (const p of order.parts){
    if (p.cat === 'sandwich'){
      p.stack.forEach((n,i) => {
        const isBun = i === 0 || i === p.stack.length-1;
        out.push({text: FOODS[n].text, indent: !isBun});
      });
    } else {
      out.push({text: FOODS[p.food].text, indent: false});
    }
  }
  return out;
}
