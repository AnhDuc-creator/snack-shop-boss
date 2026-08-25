// Kiem tra bo sinh don co dung nhu ban goc khong.
// Chay:  node --test game/test/
import { test } from 'node:test';
import assert from 'node:assert';
import { orderCount, makeOrder, makeRound, makeTeacherOrder, traySignature,
         orderSignature, sameSig, findMatch } from '../src/orders.js';
import { CATS, BY_CAT, FILLINGS, BUNS } from '../src/data.js';

const N = 200000;

test('so don moi vong theo dung bang xac suat goc 5/10/60/25', () => {
  const c = {};
  for (let i=0;i<N;i++){ const v = orderCount(); c[v] = (c[v]||0)+1; }
  const pct = k => c[k]/N*100;
  assert.ok(Math.abs(pct(3) -  5) < 0.5, '3 don ~5%, thuc te ' + pct(3).toFixed(2));
  assert.ok(Math.abs(pct(4) - 10) < 0.5, '4 don ~10%, thuc te ' + pct(4).toFixed(2));
  assert.ok(Math.abs(pct(5) - 60) < 0.8, '5 don ~60%, thuc te ' + pct(5).toFixed(2));
  assert.ok(Math.abs(pct(6) - 25) < 0.8, '6 don ~25%, thuc te ' + pct(6).toFixed(2));
  assert.equal(Object.keys(c).sort().join(), '3,4,5,6');
});

test('moi don co 3 den 5 nhom, khong trung nhom', () => {
  for (let i=0;i<5000;i++){
    const o = makeOrder();
    const cats = o.parts.map(p => p.cat);
    assert.ok(cats.length >= 3 && cats.length <= 5, 'so nhom ' + cats.length);
    assert.equal(new Set(cats).size, cats.length, 'nhom bi trung');
    for (const c of cats) assert.ok(CATS.includes(c));
  }
});

test('sandwich co 1-4 nhan, hai dau la banh cung loai', () => {
  for (let i=0;i<5000;i++){
    const s = makeOrder().parts.find(p => p.cat === 'sandwich');
    if (!s) continue;
    assert.ok(BUNS.includes(s.stack[0]));
    assert.equal(s.stack[0], s.stack.at(-1), 'hai nua banh phai cung loai');
    const fills = s.stack.slice(1,-1);
    assert.ok(fills.length >= 1 && fills.length <= 4, 'so nhan ' + fills.length);
    for (const f of fills) assert.ok(FILLINGS.includes(f));
  }
});

test('mon roi luon thuoc dung nhom', () => {
  for (let i=0;i<5000;i++)
    for (const p of makeOrder().parts)
      if (p.cat !== 'sandwich') assert.ok(BY_CAT[p.cat].includes(p.food));
});

test('khay dung khop don, khay thieu mon thi khong', () => {
  const order = { parts:[{cat:'drink', food:'milk'}, {cat:'dessert', food:'cookie'}],
                  filled:false };
  const dung   = { slots:{drink:'milk', dessert:'cookie'}, sandwich:[] };
  const thieu  = { slots:{drink:'milk'}, sandwich:[] };
  const thua   = { slots:{drink:'milk', dessert:'cookie', fruit:'apple'}, sandwich:[] };
  assert.equal(findMatch([order], dung),  0);
  assert.equal(findMatch([order], thieu), -1);
  assert.equal(findMatch([order], thua),  -1);
});

test('sandwich phai dung thu tu tung lop', () => {
  const order = { parts:[{cat:'sandwich', stack:['bagel','cheese','lettuce','bagel']}],
                  filled:false };
  const dung  = { slots:{}, sandwich:['bagel','cheese','lettuce','bagel'] };
  const daoLop= { slots:{}, sandwich:['bagel','lettuce','cheese','bagel'] };
  assert.equal(findMatch([order], dung),   0);
  assert.equal(findMatch([order], daoLop), -1);
});

test('khay rong khong khop voi don nao', () => {
  assert.equal(findMatch(makeRound(), {slots:{}, sandwich:[]}), -1);
});

// --- vong don giao vien ---

test('don giao vien luon la mot don, du ca nam nhom', () => {
  for (let i=0;i<3000;i++){
    const o = makeTeacherOrder();
    const cats = o.parts.map(p => p.cat).sort();
    assert.equal(cats.length, 5, 'phai du 5 nhom');
    assert.deepEqual(cats, [...CATS].sort(), 'phai co dung ca 5 nhom');
    assert.equal(o.teacher, true);
  }
});

test('sandwich cua giao vien co 6-8 nhan, nang hon don hoc sinh', () => {
  let min = 99, max = 0;
  for (let i=0;i<3000;i++){
    const s = makeTeacherOrder().parts.find(p => p.cat === 'sandwich');
    const n = s.stack.length - 2;
    min = Math.min(min,n); max = Math.max(max,n);
    assert.ok(n >= 6 && n <= 8, 'so nhan ' + n);
    assert.equal(s.stack[0], s.stack.at(-1));
  }
  assert.equal(min, 6, 'phai cham san 6');
  assert.equal(max, 8, 'phai cham tran 8');
});

test('don giao vien nhe nhat van nang hon don hoc sinh nang nhat', () => {
  // hoc sinh: toi da 5 nhom + 4 nhan.  giao vien: toi thieu 5 nhom + 6 nhan.
  let hocSinhMax = 0;
  for (let i=0;i<5000;i++){
    const s = makeOrder().parts.find(p => p.cat === 'sandwich');
    if (s) hocSinhMax = Math.max(hocSinhMax, s.stack.length - 2);
  }
  assert.equal(hocSinhMax, 4);
});
