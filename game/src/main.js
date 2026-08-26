// Noi day: nap anh, bat su kien, chay vong lap.

import { W, H } from './data.js';
import { initRender, draw } from './render.js';
import { S, newRound, click, scrollOrders, tick,
         moveScrollDrag, endScrollDrag, isScrollDragging } from './state.js';
import { initSound, toggleMute, getVolume } from './sound.js';
import { onStatsChange, activeDemerits, hasCookAchievement } from './stats.js';
import { runSelfCheck, summarise } from './selfcheck.js';
import { startGossip, gossipIndex } from './gossip.js';
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
cv.addEventListener('pointerdown', e => {
  // Trinh duyet chi cho tao AudioContext sau mot cu cham cua nguoi dung, ma
  // newRound() lai chay ngay luc nap xong anh - som hon. Nen gossip cua vong
  // dau tien khong the khoi dong o do. Bat lai ngay sau khi am thanh san sang.
  initSound().then(() => { if (gossipIndex() === 0) startGossip(); });
  // Cam ung khong co hover: phai cap nhat vi tri TRUOC khi xu ly bam,
  // neu khong thi cu cham dau tien se tinh vao cho con tro dang o cu.
  [S.mouse.x, S.mouse.y] = toCanvas(e);
  if (e.button === 2){ S.held = null; return; }   // chuot phai: bo mon dang cam
  if (e.button !== 0) return;
  click(S.mouse.x, S.mouse.y);
});
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => { e.preventDefault(); scrollOrders(Math.sign(e.deltaY)); },
                    {passive:false});

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'r') newRound();
  if (k === 'd') S.debug = !S.debug;
  if (k === 's') cv.classList.toggle('sharp');
  if (k === 'm'){
    toggleMute();
    hint.textContent = getVolume() ? 'Âm thanh: bật' : 'Âm thanh: tắt';
    setTimeout(() => { if (hint.textContent.startsWith('Âm thanh')) hint.textContent = ''; }, 1800);
  }
  if (k === 'c'){
    const on = toggleCaptions();
    hint.textContent = on ? 'Phụ đề: bật' : 'Phụ đề: tắt';
    setTimeout(() => { if (hint.textContent.startsWith('Phụ đề')) hint.textContent = ''; }, 1800);
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
    `Vòng đã xong <b>${st.rounds}</b>`,
    `Credit <b>${st.credits}</b>`,
    `Demerit <b>${st.demerits}</b>`,
  ];
  if (st.teacherWins || st.teacherLosses)
    parts.push(`Đơn giáo viên <b>${st.teacherWins}</b>&#8202;/&#8202;<b>${st.teacherWins + st.teacherLosses}</b>`);
  const active = activeDemerits();
  if (active > 0) parts.push(`Đang nợ <b>${active}</b>`);
  if (hasCookAchievement()) parts.push(`<span class="ach">Short Order Cook</span>`);
  statsEl.innerHTML = parts.join('');
});

function fitCanvas(){
  const s = Math.min((innerWidth*0.96)/W, (innerHeight-70)/H);
  cv.style.width  = Math.round(W*s) + 'px';
  cv.style.height = Math.round(H*s) + 'px';
}
addEventListener('resize', fitCanvas); fitCanvas();

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
  hint.textContent = 'Thiếu game/assets/atlas.png hoặc bg.png — chạy: py tools/setup.py';
};
