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
// Khong co phu de - tra ca 108 ten trong autotext_SC deu khong co, va cac khoi
// AR:Sound gossip khong co truong text. La tieng nen co y de moc.

import { getAudioContext, getMasterNode, loadBuffer } from './sound.js';

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

// --- trang thai ---
let ctx = null;
let gain = null;              // node dieu am kenh Voice1
let groupIndex = 0;           // tuong ung VarTable.Gossip
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
  src.onended = () => { if (current === src) current = null; onDone && onDone(); };
  current = src;
  src.start();
}

/** Phat chuoi doi dap, moi cau doi cau truoc ket thuc dung nhu closure `.done`. */
function playChain(group){
  const faderEnd = group.faderEnd ?? group.lines.length - 1;
  let i = 0;
  fadeChannel(CH_TALKING);

  const next = () => {
    if (!running) return;
    if (i > 0 && i - 1 === faderEnd) fadeChannel(CH_IDLE);   // fader tut sau clip nay
    if (i >= group.lines.length){
      if (group.solo){
        const solo = Array.isArray(group.solo) ? group.solo : [group.solo];
        timer = setTimeout(() => {
          fadeChannel(CH_TALKING);
          let s = 0;
          const nextSolo = () => {          // noi nhau bang `.done`, giong chuoi doi dap
            if (!running) return;
            if (s >= solo.length){ fadeChannel(CH_IDLE); return; }
            playClip(solo[s++], nextSolo);
          };
          nextSolo();
        }, rnd(SOLO_MIN, SOLO_MAX) * 1000);
      }
      return;
    }
    playClip(group.lines[i++], next);
  };
  next();
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

  if (groupIndex >= GOSSIP.length){
    if (!LOOP_WHEN_EXHAUSTED) return;    // ban goc: im lang vinh vien
    groupIndex = 0;
  }
  const group = GOSSIP[groupIndex++];
  running = true;

  // Nap truoc ca nhom trong luc dang dem 2-10 giay. Khong await: cho o day thi
  // dong ho khong chay, con de nap lui thi giua hai cau lo khoang lang cho tai.
  for (const name of [...group.lines, ...(group.solo ? [group.solo].flat() : [])]){
    loadBuffer(name).catch(() => {});   // hong mot clip thi playClip tu bo qua
  }

  // math.random(2,10) chay MOT lan luc nap scene, khong phai moi cau mot lan
  timer = setTimeout(() => playChain(group), rnd(DELAY_MIN, DELAY_MAX) * 1000);
}

export function stopGossip(){
  running = false;
  clearTimer();
  if (current){ try { current.stop(); } catch { /* da dung */ } current = null; }
  if (gain) gain.gain.value = CH_IDLE;
}

/**
 * Curfew_FL va vong don giao vien deu chan bang cach giu dong ho khong chay,
 * nen la TAM DUNG roi chay tiep, khong dem lai tu dau.
 */
export function pauseGossip(on){
  if (on === paused) return;
  paused = on;
  if (on){ clearTimer(); if (current) try { current.stop(); } catch { /* da dung */ } }
}

export function isPaused(){ return paused; }

/** Nhom se phat o vong ke tiep - tien cho che do debug. */
export function gossipIndex(){ return groupIndex; }
