// Kiem tra chuoi tan gau: thu tu doi dap, tam dung, nho tien do, va vong lai.
// Chay:  node --test "game/test/*.test.mjs"
//
// gossip.js noi vao sound.js va captions.js that, khong va module. Chi can dung
// ba thu GIA truoc khi nap no:
//
//   1. Web Audio - `window.AudioContext` va `fetch` gia la ca duong nap clip cua
//      sound.js chay duoc nguyen ven. Clip gia dai dung CLIP_SEC giay va tu ban
//      'ended' qua dong ho ao, nen kiem duoc "cau sau doi cau truoc dut".
//   2. localStorage - gossip.js doc tien do NGAY luc nap module, nen phai co
//      truoc lenh import dau tien.
//   3. Dong ho - mock.timers cua node:test. Mot vong 12 giay trong game chay het
//      trong vai mili giay that, va khong nhip nao phu thuoc may nhanh hay cham.
//
// Vi tien do nam trong bien module (doc localStorage mot lan luc nap), "tai lai
// trang" duoc gia lap bang cach import lai gossip.js voi query khac - xem
// freshGossip().
import { test, mock } from 'node:test';
import assert from 'node:assert';

// --- dong ho ao ---
let vnow = 0;                       // giay, dung cho ctx.currentTime
const drain = () => new Promise(r => setImmediate(r));

/** Day dong ho ao di `sec` giay, xen ke tha cho chuoi promise chay xong. */
async function advance(sec){
  const STEP = 50;                  // mili giay moi nhip
  let left = Math.round(sec * 1000);
  await drain();
  while (left > 0){
    const d = Math.min(STEP, left);
    mock.timers.tick(d);
    vnow += d / 1000;
    left -= d;
    await drain();                  // playClip la async: khong tha thi src.start() chua chay
  }
}

// --- Web Audio gia ---
const CLIP_SEC = 1;                 // moi clip gia dai dung 1 giay
const events = [];                  // {name, type:'start'|'end'|'stop'} theo dung thu tu
const live = new Set();             // source dang phat
const played = () => events.filter(e => e.type === 'start').map(e => e.name);

function fakeGain(){
  const g = {
    value: 0,
    cancelScheduledValues(){},
    setValueAtTime(v){ g.value = v; },
    // Duong cong fade khong phai thu dang kiem o day: nhay thang toi dich.
    linearRampToValueAtTime(v){ g.value = v; },
  };
  return { gain: g, connect(n){ return n; }, disconnect(){} };
}

function fakeSource(){
  let timer = null, finished = false;
  const listeners = [];
  const name = () => (src.buffer ? src.buffer.name : '?');
  function fire(type){
    if (finished) return;
    finished = true;
    live.delete(src);
    events.push({ name: name(), type });
    // Ban goc: stop() cung ban 'ended'. Ban ngay tai cho - ca truong hop nghiet
    // nga nhat cho cai chot `paused` trong playChain.
    if (src.onended) src.onended();
    for (const f of listeners) f();
  }
  const src = {
    buffer: null, onended: null,
    connect(n){ return n; },
    addEventListener(t, f){ if (t === 'ended') listeners.push(f); },
    start(){
      events.push({ name: name(), type: 'start' });
      live.add(src);
      timer = setTimeout(() => fire('end'), (src.buffer ? src.buffer.duration : CLIP_SEC) * 1000);
    },
    stop(){ if (finished) return; clearTimeout(timer); fire('stop'); },
  };
  return src;
}

class FakeAudioContext {
  constructor(){ this.destination = {}; this.state = 'running'; }
  get currentTime(){ return vnow; }
  createGain(){ return fakeGain(); }
  createBufferSource(){ return fakeSource(); }
  // Ten clip di xuyen qua fetch -> arrayBuffer -> day, de biet cau nao dang noi.
  async decodeAudioData(ab){
    return { duration: CLIP_SEC, name: new TextDecoder().decode(ab) };
  }
  async resume(){ this.state = 'running'; }
}

globalThis.window = { AudioContext: FakeAudioContext };

// index.json tra 404 -> sound.js quay ve cach thu lan luot '.ogg' roi '.wav'.
globalThis.fetch = async (url) => {
  const m = /^assets\/sound\/(.+)\.ogg$/.exec(String(url));
  if (!m) return { ok: false, status: 404 };
  const name = m[1];
  return { ok: true, async arrayBuffer(){ return new TextEncoder().encode(name).buffer; } };
};

// --- localStorage gia ---
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: k => { store.delete(k); },
  clear: () => store.clear(),
};
const KEY = 'snackshop.gossip';

// --- nap module ---
// Ban tham chieu, chi de doc bang GOSSIP. Khong bao gio startGossip tren no.
const { GOSSIP } = await import('../src/gossip.js');

let seq = 0;
/** Mot ban gossip.js moi tinh - tuong duong mot lan tai lai trang. */
const freshGossip = () => import(`../src/gossip.js?load=${++seq}`);

const realRandom = Math.random;

/**
 * Chay `fn` voi dong ho ao va bang ghi sach.
 * Math.random ghim ve 0 nen moi khoang cho lay dung can duoi:
 * cho dau 2 giay, khoang im truoc doc thoai 5 giay, giua hai nhom 25 giay.
 */
async function withClock(fn){
  mock.timers.enable({ apis: ['setTimeout'] });
  Math.random = () => 0;
  store.clear();
  events.length = 0;
  live.clear();
  vnow = 0;
  const opened = [];
  try {
    await fn(async () => { const g = await freshGossip(); opened.push(g); return g; });
  } finally {
    for (const g of opened) g.stopGossip();
    mock.timers.reset();
    Math.random = realRandom;
  }
}

test('chuoi doi dap phat dung thu tu, cau sau doi cau truoc dut han', async () => {
  await withClock(async (load) => {
    const g = await load();
    const grp = GOSSIP[0];
    g.startGossip();

    await advance(1.9);
    assert.deepEqual(played(), [], 'chua het 2 giay cho dau thi chua ai noi');

    await advance(0.2);                                       // t = 2.1
    assert.deepEqual(played(), [grp.lines[0]]);

    await advance(0.8);                                       // t = 2.9
    assert.deepEqual(played(), [grp.lines[0]], 'cau 2 khong duoc chen khi cau 1 chua dut');

    await advance(0.2);                                       // t = 3.1
    assert.deepEqual(played(), grp.lines.slice(0, 2));

    await advance(1);                                         // t = 4.1
    assert.deepEqual(played(), grp.lines.slice(0, 3));

    await advance(1);                                         // t = 5.1
    assert.deepEqual(played(), grp.lines, 'phai het bon cau, dung thu tu');

    // cau 4 dut o t=6, khoang im 5 giay -> doc thoai bat o t=11
    await advance(5.8);                                       // t = 10.9
    assert.deepEqual(played(), grp.lines, 'doc thoai phai doi het khoang im');

    await advance(0.2);                                       // t = 11.1
    assert.deepEqual(played(), [...grp.lines, grp.solo], 'doc thoai noi sau cung');

    // Khong cau nao chong len cau nao: moi cau deu dut truoc khi cau sau bat.
    let dangNoi = 0;
    for (const e of events){
      if (e.type === 'start'){ assert.equal(dangNoi, 0, 'hai cau chong tieng: ' + e.name); dangNoi++; }
      else dangNoi--;
    }
  });
});

test('pauseGossip(true) giua chuoi thi im ngay, khong noi not cau nao', async () => {
  await withClock(async (load) => {
    const g = await load();
    g.startGossip();

    await advance(2.5);                                       // dang giua cau 1
    assert.deepEqual(played(), [GOSSIP[0].lines[0]]);

    g.pauseGossip(true);
    assert.equal(g.isPaused(), true);
    assert.equal(live.size, 0, 'cau dang noi phai tat ngay lap tuc');
    assert.ok(events.some(e => e.type === 'stop'), 'phai la bi cat, khong phai doi cho het');

    // 60 giay du cho ca ba nhip noi chuoi: cau ke tiep, khoang im doc thoai (5s)
    // va khoang giua hai nhom (25s). Khong nhip nao duoc chay.
    await advance(60);
    assert.deepEqual(played(), [GOSSIP[0].lines[0]], 'tam dung roi thi khong them cau nao');
  });
});

test('chi so nhom nho qua localStorage: tai lai thi vao nhom ke tiep', async () => {
  await withClock(async (load) => {
    const a = await load();
    assert.equal(a.gossipIndex(), 0, 'chua co gi trong localStorage thi bat dau tu nhom 1');

    a.startGossip();
    await advance(2.1);
    assert.deepEqual(played(), [GOSSIP[0].lines[0]]);
    assert.equal(a.gossipIndex(), 1);
    assert.equal(localStorage.getItem(KEY), '1', 'tien do phai duoc cat xuong localStorage');
    a.stopGossip();

    events.length = 0;
    const b = await load();                                   // "tai lai trang"
    assert.equal(b.gossipIndex(), 1, 'ban moi phai doc lai tien do, khong ve 0');

    b.startGossip();
    await advance(2.1);
    assert.deepEqual(played(), [GOSSIP[1].lines[0]], 'phai vao nhom 2, khong lap lai nhom 1');
    assert.equal(localStorage.getItem(KEY), '2');
  });
});

test('het 21 nhom thi LOOP_WHEN_EXHAUSTED quay ve nhom 1', async () => {
  await withClock(async (load) => {
    localStorage.setItem(KEY, String(GOSSIP.length));         // da nghe het bang
    const g = await load();
    assert.equal(g.gossipIndex(), GOSSIP.length);

    g.startGossip();
    await advance(2.1);
    assert.deepEqual(played(), [GOSSIP[0].lines[0]], 'het bang thi quay lai nhom 1');
    assert.equal(g.gossipIndex(), 1, 'chi so phai dem lai tu dau');

    // va van chay tiep binh thuong, khong phai chi noi mot cau roi im
    await advance(1.2);
    assert.deepEqual(played(), GOSSIP[0].lines.slice(0, 2));
  });
});
