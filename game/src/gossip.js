// Tieng tan gau cua khach trong luc choi.
//
// Khong phai cau le phat ngau nhien. Ban goc xau chuoi thanh DOI DAP giua hai
// hoc sinh: cau dau nhom co `active = false`, moi cau sau chi bat khi cau lien
// truoc `.done`. So le la Girl1, so chan la Girl2. Da kiem 92/92 trong bytecode.
//
// 12/21 nhom con co mot cau doc thoai noi sau, cach mot khoang im 5-15 giay.
//
// Am luong hai tang cua ban goc nhan nhau:
//   - tung clip: 0.8 (ca 108 clip deu vay)
//   - kenh Voice1: fader chay giua 0.5 (nen) va 0.8 (dang noi), duong cong sinlerp
// roi ca hai di tiep qua duong am tong cua sound.js (phim M) - tang nay la cua
// ban web, ban goc khong co.
//
// CO phu de. Ca 108 clip deu co, nam trong bang AutotextInit cua convo_SC (khong
// phai autotext_SC - do la cho tim sai cua lan truoc). Da xuat ra
// game/assets/gossip-captions.json, khoa trung ten clip o duoi. Xem spec muc 8.6.

import { getAudioContext, getMasterNode, loadBuffer } from './sound.js';
import { showCaption, hideCaption } from './captions.js';

// --- hang so tu ban goc ---
const CLIP_VOL   = 0.8;    // am luong tung clip
const CH_IDLE    = 0.5;    // kenh Voice1 luc khong ai noi
const CH_TALKING = 0.8;    // kenh Voice1 luc dang noi
const DELAY_MIN  = 2, DELAY_MAX = 10;   // gossipDelay = math.random(2, 10)
const SOLO_MIN   = 5, SOLO_MAX = 15;    // khoang im truoc cau doc thoai

// doan: ban goc khong ghi ro thoi gian fader chay het bao lau.
const FADE_SEC = 1.0;

// CO Y LECH BAN GOC.
// Ban goc: moi lan vao scene phat nhom ke tiep, het 21 nhom thi im vinh vien
// (VarTable.Gossip nam trong savegame nen nho qua cac phien).
// Ban web nay nguoi choi chi mo vai vong roi dong, giu nguyen se lam da so
// chi nghe duoc nhom 1 va ai choi nhieu thi quay cam han.
// Doi thanh false de tro ve dung ban goc.
const LOOP_WHEN_EXHAUSTED = true;

// CO Y LECH BAN GOC.
// Ban goc moi lan vao scene chi phat DUNG MOT nhom roi im den lan vao sau -
// dung, vi nguoi choi ra vao quay lien tuc nen im lang khong keo dai. O day mot
// vong don keo may phut lien, giu nguyen thi phan lon vong la im.
// Nen: het mot nhom thi doi ngau nhien tung nay giay roi phat nhom ke tiep,
// van trong cung mot vong. Dat null de tro ve dung ban goc.
const REPEAT_GAP = [25, 45];   // giay

/**
 * 21 nhom, dung thu tu ban goc (gossip1..gossip21).
 *   lines    - ten clip theo dung thu tu doi dap
 *   faderEnd - clip thu may (dem tu 0) lam fader tut ve CH_IDLE.
 *              Bo trong nghia la clip cuoi. Nam nhom 13/17/18/19/21 co so nay
 *              NHO HON clip cuoi - do la loi soan cua ban goc, giu nguyen de 1:1.
 *   solo     - cau doc thoai noi sau, hoac null.
 *              Bon nhom (2, 8, 14, 19) co HAI clip chu khong phai mot, nen truong
 *              nay nhan ca mang. Ban goc noi chung bang `Single2_VO.active =
 *              Single_VO.done`, y het chuoi doi dap, nen phat lien tiep.
 *              Rieng nhom 19 ban goc tach thanh hai khoi roi han: clip thu hai
 *              doi fade-out cua clip dau chay xong roi moi dem tiep 7 giay. O day
 *              gop lai thanh mot khoi - khac ban goc o cho do.
 */
export const GOSSIP = [
  // 1  calc
  { lines:['girl1_calc01', 'girl2_calc02', 'girl1_calc03', 'girl2_calc04'],
    faderEnd:null, solo:'bliz01' },
  // 2  har
  { lines:['girl1_har01', 'girl2_har02', 'girl1_har03', 'girl2_har04'],
    faderEnd:null, solo:['hot01', 'doll01'] },
  // 3  desk
  { lines:['girl1_desk01', 'girl2_desk02'],
    faderEnd:null, solo:null },
  // 4  cof
  { lines:['girl1_cof01', 'girl2_cof02'],
    faderEnd:null, solo:'wig01' },
  // 5  eng
  { lines:['girl1_eng01', 'girl2_eng02', 'girl1_eng03', 'girl2_eng04'],
    faderEnd:null, solo:null },
  // 6  green
  { lines:['girl1_green01', 'girl2_green02', 'girl1_green03', 'girl2_green04'],
    faderEnd:null, solo:'wea01' },
  // 7  ball
  { lines:['girl1_ball01', 'girl2_ball02', 'girl1_ball03', 'girl2_ball04'],
    faderEnd:null, solo:'uni01' },
  // 8  ear
  { lines:['girl1_ear01', 'girl2_ear02', 'girl1_ear03', 'girl2_ear04', 'girl1_ear05'],
    faderEnd:null, solo:['per01', 'che01'] },
  // 9  who
  { lines:['girl1_who01', 'girl2_who02', 'girl1_who03', 'girl2_who04'],
    faderEnd:null, solo:null },
  // 10 kick
  { lines:['girl1_kick01', 'girl2_kick02', 'girl1_kick03', 'girl2_kick04'],
    faderEnd:null, solo:'cos01' },
  // 11 page
  { lines:['girl1_page01', 'girl2_page02', 'girl1_page03', 'girl2_page04'],
    faderEnd:null, solo:'guys01' },
  // 12 lee
  { lines:['girl1_lee01', 'girl2_lee02', 'girl1_lee03'],
    faderEnd:null, solo:null },
  // 13 char
  { lines:['girl1_char01', 'girl2_char02', 'girl1_char03', 'girl2_char04', 'girl1_char05',
           'girl2_char06'],
    faderEnd:3, solo:null },
  // 14 rac
  { lines:['girl1_rac01', 'girl2_rac02', 'girl1_rac03', 'girl2_rac04'],
    faderEnd:null, solo:['gross01', 'may01'] },
  // 15 squ
  { lines:['girl1_squ01', 'girl2_squ02', 'girl1_squ03', 'girl2_squ04', 'girl1_squ05',
           'girl2_squ06'],
    faderEnd:null, solo:'pig01' },
  // 16 goes
  { lines:['girl1_goes01', 'girl2_goes02', 'girl1_goes03', 'girl2_goes04'],
    faderEnd:null, solo:null },
  // 17 hate
  { lines:['girl1_hate01', 'girl2_hate02', 'girl1_hate03', 'girl2_hate04', 'girl1_hate05'],
    faderEnd:3, solo:null },
  // 18 cas
  { lines:['girl1_cas01', 'girl2_cas02', 'girl1_cas03', 'girl2_cas04'],
    faderEnd:2, solo:'sal01' },
  // 19 fac
  { lines:['girl1_fac01', 'girl2_fac02', 'girl1_fac03', 'girl2_fac04'],
    faderEnd:2, solo:['else01', 'sick01'] },
  // 20 dump
  { lines:['girl1_dump01', 'girl2_dump02', 'girl1_dump03', 'girl2_dump04', 'girl1_dump05',
           'girl2_dump06', 'girl1_dump07', 'girl2_dump08', 'girl1_dump09'],
    faderEnd:null, solo:null },
  // 21 id
  { lines:['girl1_id01', 'girl2_id02', 'girl1_id03', 'girl2_id04', 'girl1_id05',
           'girl2_id06'],
    faderEnd:3, solo:null },
];

// --- nho tien do qua cac phien ---
// Ban goc giu VarTable.Gossip trong savegame, nen doi thoai khong bat dau lai tu
// nhom 1 moi lan choi. Bien module thi reset moi lan tai trang, nen cat vao
// localStorage - cung cach stats.js va captions.js dung.
const KEY = 'snackshop.gossip';

function loadProgress(){
  try {
    const v = parseInt(localStorage.getItem(KEY), 10);
    // > GOSSIP.length nghia la bang da ngan di sau mot ban cap nhat: bo, dem lai
    if (Number.isInteger(v) && v >= 0 && v <= GOSSIP.length) return v;
  } catch { /* dung 0 */ }
  return 0;
}
function saveProgress(){
  try { localStorage.setItem(KEY, String(groupIndex)); } catch { /* bo qua */ }
}

// --- trang thai ---
let ctx = null;
let gain = null;              // node dieu am kenh Voice1
let groupIndex = loadProgress();   // tuong ung VarTable.Gossip
let started = false;          // startGossip da chay duoc lan nao chua (can AudioContext)
let timer = null;             // setTimeout dang cho
let current = null;           // BufferSource dang phat
let running = false;
let paused = false;

const clearTimer = () => { if (timer){ clearTimeout(timer); timer = null; } };
const rnd = (a,b) => a + Math.random()*(b-a);

/** Duong cong sinlerp cua ban goc: start + (end-start)*sin(clamp(t,0,1)*PI/2) */
function fadeChannel(to){
  if (!gain || !ctx) return;
  const now = ctx.currentTime;
  const from = gain.gain.value;
  const steps = 16;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(from, now);
  for (let i = 1; i <= steps; i++){
    const t = i / steps;
    const v = from + (to - from) * Math.sin(t * Math.PI / 2);
    gain.gain.linearRampToValueAtTime(v, now + FADE_SEC * t);
  }
}

async function playClip(name, onDone){
  const buf = await loadBuffer(name);
  if (!buf || !running){ onDone && onDone(); return; }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const clipGain = ctx.createGain();
  clipGain.gain.value = CLIP_VOL;
  src.connect(clipGain).connect(gain);
  src.onended = () => {
    hideCaption(name);          // tu bo qua neu cau sau da chiem cho
    if (current === src) current = null;
    onDone && onDone();
  };
  current = src;
  showCaption(name);
  src.start();
}

/**
 * Phat chuoi doi dap, moi cau doi cau truoc ket thuc dung nhu closure `.done`.
 * `onDone` goi mot lan khi ca nhom - ke ca cau doc thoai - da het.
 */
function playChain(group, onDone){
  const faderEnd = group.faderEnd ?? group.lines.length - 1;
  let i = 0;
  fadeChannel(CH_TALKING);

  // Moi cho noi chuoi deu phai kiem CA `running` LAN `paused`. Ly do: pauseGossip
  // goi current.stop(), ma stop() van ban `ended`, nen onDone cua clip dang phat
  // van chay - khong chan thi chuoi tu noi tiep het ca nhom du dang tam dung.
  const alive = () => running && !paused;

  const next = () => {
    if (!alive()) return;
    if (i > 0 && i - 1 === faderEnd) fadeChannel(CH_IDLE);   // fader tut sau clip nay
    if (i >= group.lines.length){
      if (!group.solo){ onDone && onDone(); return; }
      const solo = Array.isArray(group.solo) ? group.solo : [group.solo];
      timer = setTimeout(() => {
        if (!alive()) return;             // tam dung trong luc dem khoang im
        fadeChannel(CH_TALKING);
        let s = 0;
        const nextSolo = () => {          // noi nhau bang `.done`, giong chuoi doi dap
          if (!alive()) return;
          if (s >= solo.length){ fadeChannel(CH_IDLE); onDone && onDone(); return; }
          playClip(solo[s++], nextSolo);
        };
        nextSolo();
      }, rnd(SOLO_MIN, SOLO_MAX) * 1000);
      return;
    }
    playClip(group.lines[i++], next);
  };
  next();
}

/** Nhom ke tiep, hoac null neu da het bang va LOOP_WHEN_EXHAUSTED tat. */
function takeGroup(){
  if (groupIndex >= GOSSIP.length){
    if (!LOOP_WHEN_EXHAUSTED) return null;    // ban goc: im lang vinh vien
    groupIndex = 0;
  }
  const group = GOSSIP[groupIndex++];
  saveProgress();
  return group;
}

/** Nap truoc ca nhom roi hen gio phat sau `delaySec` giay. */
function runGroup(group, delaySec){
  // Nap truoc ca nhom trong luc dang dem. Khong await: cho o day thi dong ho
  // khong chay, con de nap lui thi giua hai cau lo khoang lang cho tai.
  for (const name of [...group.lines, ...(group.solo ? [group.solo].flat() : [])]){
    loadBuffer(name).catch(() => {});   // hong mot clip thi playClip tu bo qua
  }
  clearTimer();
  timer = setTimeout(() => playChain(group, afterGroup), delaySec * 1000);
}

/** Het mot nhom. Ban goc dung han o day - xem REPEAT_GAP. */
function afterGroup(){
  if (!running || paused || !REPEAT_GAP) return;
  const group = takeGroup();
  if (!group) return;
  runGroup(group, rnd(REPEAT_GAP[0], REPEAT_GAP[1]));
}

/** Goi khi bat dau mot vong don moi - tuong duong "vao scene" o ban goc. */
export function startGossip(){
  stopGossip();
  if (!GOSSIP.length) return;

  ctx = getAudioContext();
  if (!ctx) return;
  if (!gain){
    gain = ctx.createGain();
    gain.gain.value = CH_IDLE;
    gain.connect(getMasterNode());   // qua duong am tong de phim M voi toi
  }

  const group = takeGroup();
  if (!group) return;
  running = true;
  started = true;

  // math.random(2,10) chay MOT lan luc nap scene, khong phai moi cau mot lan
  runGroup(group, rnd(DELAY_MIN, DELAY_MAX));
}

export function stopGossip(){
  running = false;
  clearTimer();
  if (current){ try { current.stop(); } catch { /* da dung */ } current = null; }
  if (gain) gain.gain.value = CH_IDLE;
}

/**
 * CO Y LECH BAN GOC.
 * Ban goc chan bang cach giu dong ho khong chay (gossipDelay.active kiem
 * `not teacherRoundTimer.active`), nen la tam dung roi chay tiep dung cho cu.
 * O day tam dung la BO HAN nhom dang phat: vao vong giao vien thi quay phai im
 * ngay lap tuc, khong con cau nao noi not. Nhom ke tiep se phat o vong sau -
 * groupIndex da tang luc startGossip nen nhom bi bo la mat luon, dung nhu y do.
 */
export function pauseGossip(on){
  if (on === paused) return;
  paused = on;
  // Dat `paused` TRUOC khi stop(): stop() ban `ended` dong bo, va handler do doc
  // co nay de biet khong duoc noi chuoi tiep.
  if (on){ clearTimer(); if (current) try { current.stop(); } catch { /* da dung */ } }
}

export function isPaused(){ return paused; }

/** Nhom se phat o vong ke tiep - tien cho che do debug. */
export function gossipIndex(){ return groupIndex; }

/**
 * startGossip da khoi dong duoc lan nao chua. KHONG suy tu gossipIndex(): tu khi
 * groupIndex nam trong localStorage, no khac 0 ngay tu luc tai trang.
 */
export function gossipStarted(){ return started; }

/** Quen tien do, quay ve nhom 1 - cho che do debug va nut reset. */
export function resetGossip(){
  groupIndex = 0;
  saveProgress();
}
