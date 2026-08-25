// Noi day: nap anh, bat su kien, chay vong lap.

import { W, H } from './data.js';
import { initRender, draw } from './render.js';
import { S, newRound, click, scrollOrders, tick } from './state.js';
import { initSound, toggleMute, getVolume } from './sound.js';

const cv = document.getElementById('c');
const cx = cv.getContext('2d');
const hint = document.getElementById('hint');

const atlas = new Image(); atlas.src = 'assets/atlas.png';
const bg    = new Image(); bg.src    = 'assets/bg.png';

function toCanvas(e){
  const r = cv.getBoundingClientRect();
  return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height];
}

cv.addEventListener('mousemove', e => { [S.mouse.x, S.mouse.y] = toCanvas(e); });
cv.addEventListener('mousedown', e => {
  initSound();                                    // trinh duyet chi cho phat sau cu bam dau
  if (e.button === 2){ S.held = null; return; }   // chuot phai: bo mon dang cam
  if (e.button !== 0) return;
  click(...toCanvas(e));
});
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => { e.preventDefault(); scrollOrders(Math.sign(e.deltaY)); },
                    {passive:false});

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'r') newRound();
  if (k === 'd') S.debug = !S.debug;
  if (k === 's') cv.classList.toggle('sharp');
  if (k === 'm'){ toggleMute(); hint.textContent = getVolume() ? 'Âm thanh: bật' : 'Âm thanh: tắt'; }
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
