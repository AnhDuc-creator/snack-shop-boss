// Tu kiem tra: doi chieu moi ten file duoc code tham chieu voi file that tren
// may chu. Bam phim T de chay.
//
// Ly do co file nay: co hon 200 file am va hon 50 cue, ten duoc dat lai theo quy
// tac "viet thuong, bo hau to". Chi can mot cho lech hoa thuong la am do im lang
// ma khong bao gi - Live Server tren Windows khong phan biet hoa thuong nhung
// GitHub Pages thi CO. Loi kieu do chi lo ra khi da deploy, va rat kho lan.

import { CUES } from './sound.js';
import { GOSSIP } from './gossip.js';

const DIR = 'assets/sound/';

/** Gom moi ten file duoc tham chieu, kem cho tham chieu de con bao loi cho ro. */
function collectReferences(){
  const refs = new Map();               // ten file -> danh sach noi tham chieu
  const add = (name, where) => {
    if (!name) return;
    if (!refs.has(name)) refs.set(name, []);
    refs.get(name).push(where);
  };

  for (const [cue, def] of Object.entries(CUES))
    for (const f of def.files || []) add(f, cue);

  GOSSIP.forEach((g, i) => {
    for (const f of g.lines || []) add(f, `gossip[${i}].lines`);
    if (g.solo) for (const f of [g.solo].flat()) add(f, `gossip[${i}].solo`);
  });

  return refs;
}

/** Thu ca .ogg va .wav, giong het cach loadOne trong sound.js tim file. */
async function exists(name){
  for (const ext of ['.ogg', '.wav']){
    try {
      const res = await fetch(DIR + name + ext, {method:'HEAD'});
      if (res.ok) return ext;
    } catch { /* thu duoi tiep theo */ }
  }
  return null;
}

/**
 * Chay kiem tra. Tra ve bao cao, dong thoi in bang ra Console.
 * Khong thay doi trang thai game.
 */
export async function runSelfCheck(){
  const refs = collectReferences();
  const names = [...refs.keys()];

  // cue khai bao nhung chua co file nao - co the la co y
  const emptyCues = Object.entries(CUES)
    .filter(([, d]) => !(d.files || []).length)
    .map(([k]) => k);

  const missing = [];
  const found = {ogg:0, wav:0};

  // chay theo lo cho khoi mo hang tram ket noi cung luc
  const BATCH = 12;
  for (let i = 0; i < names.length; i += BATCH){
    const slice = names.slice(i, i + BATCH);
    const results = await Promise.all(slice.map(exists));
    results.forEach((ext, j) => {
      if (ext) found[ext.slice(1)]++;
      else missing.push({file: slice[j], refs: refs.get(slice[j])});
    });
  }

  const report = {
    tongThamChieu: names.length,
    tim_thay_ogg: found.ogg,
    tim_thay_wav: found.wav,
    thieu: missing,
    cueRong: emptyCues,
    nhomGossip: GOSSIP.length,
  };

  console.group('%cTu kiem tra am thanh', 'font-weight:bold');
  console.log(`Tham chieu: ${report.tongThamChieu} file `
            + `(${found.ogg} .ogg + ${found.wav} .wav)`);
  console.log(`Nhom gossip: ${GOSSIP.length}`);
  if (emptyCues.length) console.log('Cue chua co file:', emptyCues.join(', '));
  if (missing.length){
    console.warn(`THIEU ${missing.length} file:`);
    console.table(missing.map(m => ({file: m.file, thamChieuTu: m.refs.join(', ')})));
  } else {
    console.log('%cMoi file deu co tren may chu.', 'color:#4caf50');
  }
  console.groupEnd();

  return report;
}

/** Mot dong tom tat de hien tren thanh duoi canvas. */
export function summarise(r){
  if (!r) return 'Đang kiểm tra…';
  if (r.thieu.length)
    return `Thiếu ${r.thieu.length}/${r.tongThamChieu} file âm — xem Console (F12)`;
  return `Đủ ${r.tongThamChieu} file âm · ${r.nhomGossip} nhóm tán gẫu`
       + (r.cueRong.length ? ` · ${r.cueRong.length} cue cố ý rỗng` : '');
}
