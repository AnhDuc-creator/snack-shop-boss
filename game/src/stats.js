// Diem va tien do, nho qua cac phien choi.
//
// Tuong duong VarTable cua ban goc: `SnackRoundsTotal` dem so vong da xong,
// `activeDemerits = demerits - credits` la so sach chinh.
//
// Nguyen tac trinh bay: KHONG ve gi vao trong khung 640x400. Vung do la art goc,
// them chu vao la hong tinh 1:1. Ban goc von co thanh giao dien rieng phia duoi
// ma ta khong dung lai, nen thong tin diem de ra ngoai canvas bang HTML.

const KEY = 'snackshop.stats';

const DEFAULTS = {
  rounds: 0,        // SnackRoundsTotal
  credits: 0,
  demerits: 0,
  teacherWins: 0,
  teacherLosses: 0,
};

// Xong 5 vong duoc 2 credit. Bang huong dan trong game ghi "five rounds in a day".
// Ban web khong co khai niem "ngay" nen tinh don tren tong so vong.
const ROUNDS_PER_REWARD = 5;
const REWARD_CREDITS    = 2;

export const stats = {...DEFAULTS};

function load(){
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && typeof v === 'object') Object.assign(stats, DEFAULTS, v);
  } catch { /* hong thi dung mac dinh */ }
}
function save(){
  try { localStorage.setItem(KEY, JSON.stringify(stats)); } catch { /* bo qua */ }
}
load();

const listeners = new Set();
export function onStatsChange(fn){ listeners.add(fn); fn(stats); }
function changed(){ save(); for (const fn of listeners) fn(stats); }

/** Xong mot vong don hoc sinh. Tra ve so credit vua duoc thuong (0 hoac 2). */
export function recordRound(){
  stats.rounds++;
  let reward = 0;
  if (stats.rounds % ROUNDS_PER_REWARD === 0){
    reward = REWARD_CREDITS;
    stats.credits += reward;
  }
  changed();
  return reward;
}

/** Ket cuc vong don giao vien: 'credit' | 'none' | 'demerit' */
export function recordTeacher(outcome){
  if (outcome === 'credit'){ stats.credits++;  stats.teacherWins++; }
  if (outcome === 'demerit'){ stats.demerits++; stats.teacherLosses++; }
  changed();
}

/** So sach chinh cua ban goc: demerits tru credits. */
export function activeDemerits(){
  return Math.max(0, stats.demerits - stats.credits);
}

/** Da mo thanh tuu ACH_WAC_COOK chua (xong tu 5 vong tro len). */
export function hasCookAchievement(){
  return stats.rounds >= ROUNDS_PER_REWARD;
}

export function resetStats(){
  Object.assign(stats, DEFAULTS);
  changed();
}
