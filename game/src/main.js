// Noi day: nap anh, bat su kien, chay vong lap.

import { W, H } from './data.js';
import { initRender, draw } from './render.js';
import { S, newRound, click, scrollOrders, tick,
         moveScrollDrag, endScrollDrag, isScrollDragging } from './state.js';
import { initSound, toggleMute, getVolume } from './sound.js';
import { onStatsChange, activeDemerits, hasCookAchievement } from './stats.js';
import { runSelfCheck, summarise } from './selfcheck.js';
import { startGossip, gossipStarted } from './gossip.js';
import { initCaptions, toggleCaptions } from './captions.js';

const cv = document.getElementById('c');
const cx = cv.getContext('2d');
const hint = document.getElementById('hint');

const atlas = new Image(); atlas.src = 'assets/atlas.png';
const bg    = new Image(); bg.src    = 'assets/bg.png';

function toCanvas(e){
  const r = cv.getBoundingClientRect();
  return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height];
}

// Pointer event thay cho mouse event: chay duoc ca chuot lan cam ung.
cv.addEventListener('pointermove', e => {
  [S.mouse.x, S.mouse.y] = toCanvas(e);
  if (isScrollDragging()) moveScrollDrag(S.mouse.y);
});
addEventListener('pointerup', endScrollDrag);
addEventListener('pointercancel', endScrollDrag);
// Diem bat dau cu bam, de phan biet CHAM voi KEO khi tha tay ra.
let downAt = null;
const DRAG_MIN = 8;        // di qua nhieu nay pixel thi tinh la keo

cv.addEventListener('pointerdown', e => {
  // Trinh duyet chi cho tao AudioContext sau mot cu cham cua nguoi dung, ma
  // newRound() lai chay ngay luc nap xong anh - som hon. Nen gossip cua vong
  // dau tien khong the khoi dong o do. Bat lai ngay sau khi am thanh san sang.
  initSound().then(() => { if (!gossipStarted()) startGossip(); });
  // Cam ung khong co hover: phai cap nhat vi tri TRUOC khi xu ly bam,
  // neu khong thi cu cham dau tien se tinh vao cho con tro dang o cu.
  [S.mouse.x, S.mouse.y] = toCanvas(e);
  if (e.button === 2){ S.held = null; return; }   // chuot phai: bo mon dang cam
  if (e.button !== 0) return;
  downAt = {x:S.mouse.x, y:S.mouse.y};
  cv.setPointerCapture?.(e.pointerId);
  click(S.mouse.x, S.mouse.y);
});

// Tha tay sau khi KEO thi dat mon xuong ngay tai do.
// Truoc day chi xu ly luc nhan xuong, nen keo mot mon roi tha ra thi no van
// dinh tay va phai cham them mot lan nua. Tren chuot khong lo vi nguoi ta bam
// chu khong keo, nhung tren cam ung thi ai cung keo.
// Chi lam khi da di qua DRAG_MIN, de cu CHAM binh thuong khong bi xu ly hai lan.
cv.addEventListener('pointerup', e => {
  const start = downAt; downAt = null;
  if (!start || e.button !== 0 || isScrollDragging()) return;
  const [x, y] = toCanvas(e);
  if (Math.hypot(x - start.x, y - start.y) < DRAG_MIN) return;
  S.mouse.x = x; S.mouse.y = y;
  if (S.held) click(x, y);
});
cv.addEventListener('pointercancel', () => { downAt = null; });
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => { e.preventDefault(); scrollOrders(Math.sign(e.deltaY)); },
                    {passive:false});

// Nut cam ung: may khong co ban phim thi khong bam duoc R / M / C.
const btn = id => document.getElementById(id);
btn('btn-round').addEventListener('click', () => newRound());
btn('btn-mute').addEventListener('click', e => {
  const on = toggleMute();
  e.currentTarget.textContent = on ? 'Mute' : 'Unmute';
});
btn('btn-cap').addEventListener('click', e => {
  const on = toggleCaptions();
  e.currentTarget.textContent = on ? 'Captions' : 'Captions off';
});

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'r') newRound();
  if (k === 'd') S.debug = !S.debug;
  if (k === 's') cv.classList.toggle('sharp');
  if (k === 'm'){
    toggleMute();
    hint.textContent = getVolume() ? 'Sound on' : 'Sound off';
    setTimeout(() => { if (hint.textContent.startsWith('Sound')) hint.textContent = ''; }, 1800);
  }
  if (k === 'c'){
    const on = toggleCaptions();
    hint.textContent = on ? 'Captions on' : 'Captions off';
    setTimeout(() => { if (hint.textContent.startsWith('Captions')) hint.textContent = ''; }, 1800);
  }
  if (k === 't'){
    hint.textContent = summarise(null);
    runSelfCheck().then(r => { hint.textContent = summarise(r); });
  }
});

// Thanh diem duoi canvas. Cap nhat moi khi stats doi.
initCaptions(document.getElementById('caption'));

const statsEl = document.getElementById('stats');
onStatsChange(st => {
  const parts = [
    `Rounds <b>${st.rounds}</b>`,
    `Credits <b>${st.credits}</b>`,
    `Demerits <b>${st.demerits}</b>`,
  ];
  if (st.teacherWins || st.teacherLosses)
    parts.push(`Teacher orders <b>${st.teacherWins}</b>&#8202;/&#8202;<b>${st.teacherWins + st.teacherLosses}</b>`);
  const active = activeDemerits();
  if (active > 0) parts.push(`Owed <b>${active}</b>`);
  if (hasCookAchievement()) parts.push(`<span class="ach">Short Order Cook</span>`);
  statsEl.innerHTML = parts.join('');
});

// Lap day cho con lai sau khi tru phan HTML duoi canvas. Truoc day tru cung
// 70px, nhung duoi do gio co phu de, hang phim tat va thanh diem - cao hon nhieu.
const belowEl = document.getElementById('below');
function fitCanvas(){
  // Tren man thap, #below duoc CSS cho noi len tren canvas nen khong tru chieu
  // cao cua no nua - neu tru thi canvas bi ep con mot dai mong.
  // Tren man thap, CSS cho #below xuong day va nut sang le. Chi phai danh cho
  // phu de mot dai mong o duoi - khong tru ca khoi, khong thi canvas bi ep con
  // mot dai; nhung cung khong tru 0, khong thi phu de de len nut Pick Up.
  const floating = getComputedStyle(belowEl).position === 'fixed';
  const CAPTION_STRIP = 32;
  const pad    = floating ? 6 : 24;
  const availW = innerWidth  - (floating ? 180 : 16);   // chua cho nut o le phai
  const availH = innerHeight - (floating ? CAPTION_STRIP : belowEl.offsetHeight) - pad;
  const s = Math.max(0.25, Math.min(availW / W, availH / H));
  cv.style.width  = Math.round(W * s) + 'px';
  cv.style.height = Math.round(H * s) + 'px';
}
addEventListener('resize', fitCanvas);
addEventListener('orientationchange', () => setTimeout(fitCanvas, 120));
// Phan duoi canvas doi chieu cao khi phu de dai ngan khac nhau hoac khi
// thanh diem xuong dong - do lai chu khong doan.
if (window.ResizeObserver) new ResizeObserver(fitCanvas).observe(belowEl);
fitCanvas();

let last = performance.now();
function loop(now){
  const dt = Math.min(0.05, (now - last)/1000); last = now;
  tick(dt);
  draw();
  requestAnimationFrame(loop);
}

let ready = 0;
const start = () => {
  if (++ready < 2) return;
  initRender(cx, atlas, bg);
  newRound();
  requestAnimationFrame(loop);
};
atlas.onload = start; bg.onload = start;
atlas.onerror = bg.onerror = () => {
  hint.textContent = 'Missing game/assets/atlas.png or bg.png — run: py tools/setup.py';
};
