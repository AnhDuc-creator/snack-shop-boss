// Am thanh.
//
// Hai nguyen tac lay tu ban goc, dung sai la nghe khac ngay:
//
// 1. KENH DE CAT TIENG, KHONG PHAI DE CHONG TIENG.
//    Ban goc co 8 kenh: FX1..FX7 va PlayerVoice. Nap am moi vao mot kenh thi am
//    dang chay tren kenh do bi cat. Nen bam nhanh vao may nuong khong bi xep lop,
//    va nop hai khay lien tiep thi giong Nancy cat cau truoc.
//
// 2. AM LUONG THUOC VE CHO XAY RA HANH DONG, KHONG THUOC VE FILE.
//    Cung `Pickup_Apple01..03` nhung 0.55 khi lay tu ngan tu lanh va 0.4 khi nhac
//    khoi khay. Cung `Fabric_PlaceShort01..03` co ba muc tuy cho. Vi vay bang tra
//    duoi day khoa theo CHO + HANH DONG, khong khoa theo ten file hay nhom mon.
//
// Du lieu trong CUES sinh tu bytecode - xem docs/spec.md muc 7 (vong thuong)
// va muc 9.6 (vong giao vien).

const DIR = 'assets/sound/';

// Danh muc su kien. Moi muc: { ch, vol, files }
//   ch    = kenh, quyet dinh am nao cat am nao
//   vol   = am luong 0..1, null nghia la ban goc khong dat (dung 1)
//   files = cac bien the, boc ngau nhien moi lan phat
//
// Muc nao files rong thi lang le bo qua - de tien bo sung dan.
export const CUES = {
  // --- quay: nhat nguyen lieu (FX1) ---
  'counter.bread.pick':     {ch:'FX1', vol:0.5,  files:['fabric_placeshort01','fabric_placeshort02',
                                                        'fabric_placeshort03']},
  'counter.bagel.pick':     {ch:'FX1', vol:0.5,  files:['fabric_placeshort01','fabric_placeshort02',
                                                        'fabric_placeshort03']},
  'counter.chocolate.pick': {ch:'FX1', vol:null, files:['pickup_candy01','pickup_candy04',
                                                        'pickup_candy07']},
  'counter.chips.pick':     {ch:'FX1', vol:null, files:['chipbag_short01','chipbag_short02',
                                                        'chipbag_short03']},
  'counter.pretzels.pick':  {ch:'FX1', vol:null, files:['chipbag_short01','chipbag_short02',
                                                        'chipbag_short03']},
  'counter.granola.pick':   {ch:'FX1', vol:null, files:['chipbag_short01','chipbag_short02',
                                                        'chipbag_short03']},
  'counter.nuts.pick':      {ch:'FX1', vol:null, files:['chipbag_short01','chipbag_short02',
                                                        'chipbag_short03']},
  'counter.meat.pick':      {ch:'FX1', vol:null, files:['pickup_squish_small04',
                                                        'pickup_squish_small05']},
  'counter.tomatoes.pick':  {ch:'FX1', vol:null, files:['pickup_squish_small01',
                                                        'pickup_squish_small03']},
  // vol 0.5: ban goc co dat, khong phai bo trong
  'counter.lettuce.pick':   {ch:'FX1', vol:0.5,  files:['pickup_lettuce01','pickup_lettuce02',
                                                        'pickup_lettuce03']},
  'counter.cheese.pick':    {ch:'FX1', vol:0.5,  files:['styrofoam_put_down1','styrofoam_put_down2',
                                                        'styrofoam_put_down3']},

  // --- tu lanh: cua (FX2) va ngan trong (FX1) ---
  'fridge.open':             {ch:'FX2', vol:0.55, files:['fridgeopen01','fridgeopen02',
                                                         'fridgeopen03']},
  'fridge.close':            {ch:'FX2', vol:0.55, files:['fridgeclose01','fridgeclose02',
                                                         'fridgeclose03']},
  'fridge.milk.pick':        {ch:'FX1', vol:null, files:['pickup_papernote01','pickup_papernote02',
                                                         'pickup_papernote03','pickup_papernote04']},
  'fridge.cookieDough.pick': {ch:'FX1', vol:null, files:['mud_shortsquish01','mud_shortsquish03',
                                                         'mud_shortsquish04']},
  // juice va water dung chung mot bo - ban goc khai bao hai lan giong het nhau
  'fridge.juice.pick':       {ch:'FX1', vol:null, files:['pickupobject02','pickupobject03',
                                                         'pickupobject04','pickupobject05',
                                                         'pickupobject06','pickupobject07']},
  'fridge.water.pick':       {ch:'FX1', vol:null, files:['pickupobject02','pickupobject03',
                                                         'pickupobject04','pickupobject05',
                                                         'pickupobject06','pickupobject07']},
  'fridge.orange.pick':      {ch:'FX1', vol:0.55, files:['pickup_apple01','pickup_apple02',
                                                         'pickup_apple03']},
  'fridge.apple.pick':       {ch:'FX1', vol:0.55, files:['pickup_apple01','pickup_apple02',
                                                         'pickup_apple03']},

  // --- lo cookie (FX3) ---
  // Ban goc chi co ba am cho lo: openSound, closeSound, doneSound.
  // `oven.doughIn` khong co am rieng - bo bot vao xay ra trong cung cu bam mo lo,
  // va cu bam do da phat `oven.open` roi. Xem docs/spec.md muc 7.
  'oven.open':      {ch:'FX3', vol:null, files:['tinfoil_crinkle01','tinfoil_crinkle02',
                                                'tinfoil_crinkle03','tinfoil_crinkle04',
                                                'tinfoil_crinkle05']},
  'oven.close':     {ch:'FX3', vol:null, files:['metaldoor_small01','metaldoor_small02']},
  'oven.doughIn':   {ch:'FX3', vol:null, files:[]},
  'oven.done':      {ch:'FX3', vol:null, files:['bell_ring']},
  // Nhac cookie ra phat closeSound - cua lo dong lai ngay luc do.
  'oven.cookieOut': {ch:'FX3', vol:null, files:['metaldoor_small01','metaldoor_small02']},

  // --- may nuong (FX4) ---
  'toaster.in':    {ch:'FX4', vol:0.5,  files:['fabric_placeshort01','fabric_placeshort02',
                                               'fabric_placeshort03']},
  'toaster.lever': {ch:'FX4', vol:null,
                    files:['toaster_down01','toaster_down02','toaster_down03',
                           'toaster_down04','toaster_down05']},
  'toaster.pop':   {ch:'FX4', vol:null,
                    files:['toaster_pop01','toaster_pop02','toaster_pop03',
                           'toaster_pop04','toaster_pop05']},
  'toaster.out':   {ch:'FX4', vol:0.5,  files:['fabric_placeshort01','fabric_placeshort02',
                                               'fabric_placeshort03']},

  // --- thung rac (FX5) ---
  // Ban goc chi co MOT am cho thung rac. Mo nap, bo mon vao va nap dong lai
  // deu nam trong cung mot cu bam (nap hien 0.25 giay roi tu an), nen chi
  // `trash.drop` co file. Xem docs/spec.md muc 7.
  'trash.open':  {ch:'FX5', vol:null, files:[]},
  'trash.drop':  {ch:'FX5', vol:null, files:['put_down_metal01','put_down_metal02',
                                             'put_down_metal03']},
  'trash.close': {ch:'FX5', vol:null, files:[]},

  // --- khay ra vao (FX6) ---
  'tray.away':   {ch:'FX6', vol:null,
                  files:['paperbagshake01','paperbagshake02','paperbagshake03',
                         'paperbagshake04','paperbagshake05']},
  'tray.arrive': {ch:'FX6', vol:null,
                  files:['object_place01','object_place02','object_place03']},

  // --- dat va nhac mon tren khay (FX7) ---
  'tray.drink.pick':     {ch:'FX7', vol:0.55,
                          files:['plastic_short01','plastic_short02',
                                 'plastic_short03','plastic_short04']},
  'tray.drink.place':    {ch:'FX7', vol:0.55,
                          files:['plastic_short01','plastic_short02',
                                 'plastic_short03','plastic_short04']},
  // vol 0.4 - cung bo file voi fridge.orange/apple.pick nhung o do la 0.55
  'tray.fruit.pick':     {ch:'FX7', vol:0.4,
                          files:['pickup_apple01','pickup_apple02','pickup_apple03']},
  'tray.fruit.place':    {ch:'FX7', vol:0.4,
                          files:['knock_quiet01','knock_quiet02','knock_quiet03']},
  'tray.dessert.pick':   {ch:'FX7', vol:0.35,
                          files:['fabric_placeshort01','fabric_placeshort02',
                                 'fabric_placeshort03']},
  'tray.dessert.place':  {ch:'FX7', vol:0.35,
                          files:['fabric_placeshort01','fabric_placeshort02',
                                 'fabric_placeshort03']},
  'tray.side.pick':      {ch:'FX7', vol:null,
                          files:['chipbag_short01','chipbag_short02','chipbag_short03']},
  'tray.side.place':     {ch:'FX7', vol:null,
                          files:['chipbag_short01','chipbag_short02','chipbag_short03']},
  'tray.sandwich.pick':  {ch:'FX7', vol:0.55,
                          files:['fabric_placeshort01','fabric_placeshort02',
                                 'fabric_placeshort03']},
  'tray.sandwich.place': {ch:'FX7', vol:0.55,
                          files:['fabric_placeshort01','fabric_placeshort02',
                                 'fabric_placeshort03']},

  // --- vong giao vien (spec muc 9.6) ---
  // Chuong ban giao vien. Dung mot bo cho ca hai dau vong: s4230 reo bao co don,
  // s4232 reo mung thang. FX1 - cung kenh voi tieng nhat nguyen lieu o quay.
  'teacher.bell': {ch:'FX1', vol:null, files:['bell_desk01','bell_desk02']},
  // Bip mot lan tai moc credit neu luc do chua nop xong (s4231 noCreditBusserSFX).
  // FX6 la kenh khay, khong phai kenh rieng: bip dung luc khay dang keu thi cat
  // tieng khay. Ban goc dat vay, giu nguyen.
  'teacher.buzz': {ch:'FX6', vol:0.65, files:['buzzer01_short']},
  // Het gio -> s4234. Buzzer_Double nam tren FX1, khong phai FX6 nhu buzz tren.
  'teacher.fail': {ch:'FX1', vol:null, files:['buzzer_double']},
  // CAN cue rieng, khong gop duoc vao `tray.away`: van la goodMatchSounds phan tu
  // 2, van la luc dua khay di, nhung s4231 doi ca file lan am luong - giao vien
  // nhan do nghe tieng giay mo 0.75, hoc sinh nghe tieng tui giay khong dat vol.
  // Cung kenh FX6 nen hai cue tu loai tru nhau, khong bao gio chong tieng.
  'teacher.trayAway': {ch:'FX6', vol:0.75, files:['paperunfold01','paperunfold10']},

  // --- giong Nancy (PlayerVoice) ---
  'voice.correct': {ch:'PlayerVoice', vol:null,
                    files:['nwa056a','nwa056b','nwa056c','nwa056d']},
  'voice.wrong':   {ch:'PlayerVoice', vol:null,
                    files:['nwa103','nwa104','nwa105','nwa106']},
  'voice.allDone': {ch:'PlayerVoice', vol:null, files:['nd_alldone01']},
};

let ctx = null;
let enabled = true;
let masterNode = null;          // duong am tong, xem getMasterNode()
let masterVol = 1;              // nho muc de dat lai neu ctx sinh sau setVolume()
const buffers = new Map();      // ten file -> AudioBuffer
const playing = new Map();      // kenh -> BufferSource dang chay
const pending = new Map();      // ten file -> Promise dang nap (tranh fetch trung)
let loadedAll = false;          // initSound da nap het CUES chua

function ensureCtx(){
  if (ctx || !enabled) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC){ enabled = false; return null; }
  ctx = new AC();
  masterNode = ctx.createGain();
  masterNode.gain.value = masterVol;
  masterNode.connect(ctx.destination);
  return ctx;
}

// Nhom PCM tho giu `.wav` lossless, nhom Vorbis giu `.ogg`.
// Thu lan luot hai duoi thay vi giu bang tra - them file moi khong phai sua code.
async function loadOne(name){
  for (const ext of ['.ogg', '.wav']){
    try {
      const res = await fetch(DIR + name + ext);
      if (!res.ok) continue;
      buffers.set(name, await ctx.decodeAudioData(await res.arrayBuffer()));
      return true;
    } catch { /* thu duoi tiep theo */ }
  }
  console.warn('[sound] khong nap duoc:', name);
  return false;
}

/** Nap toan bo am thanh. Goi sau cu bam dau tien de trinh duyet cho phat. */
export async function initSound(){
  if (!ensureCtx()) return;
  if (ctx.state === 'suspended') await ctx.resume();
  // Khong dung `buffers.size` lam co: gossip nap lui tung clip mot, chi can
  // mot clip gossip vao truoc la ca bang CUES bi bo qua.
  if (loadedAll) return;
  loadedAll = true;
  const names = [...new Set(Object.values(CUES).flatMap(c => c.files))];
  await Promise.all(names.map(n => loadBuffer(n)));
}

/**
 * AudioContext dung chung. Tra ve null neu trinh duyet khong ho tro hoac da tat tieng.
 * Gossip can no de tu dung chuoi gain rieng cho kenh Voice1.
 */
export function getAudioContext(){ return ensureCtx(); }

/**
 * Node am tong. MOI nguon tieng phai noi vao day, khong noi thang vao
 * ctx.destination - noi thang thi setVolume/toggleMute khong voi toi.
 *
 * Truoc day am luong tong duoc nhan tay vao tung `gain.value` trong play(),
 * nen gossip - dung duong rieng - khong chiu anh huong cua phim M.
 *
 * Tra ve null neu trinh duyet khong co Web Audio.
 */
export function getMasterNode(){
  ensureCtx();
  return masterNode;
}

/**
 * Nap lui mot clip theo ten (khong duoi). Tra ve AudioBuffer, hoac null neu hong.
 * Dung chung `buffers` voi CUES nen clip nao trung thi chi nap mot lan.
 *
 * Gossip khong nap truoc: 108 clip la ~13 MB, doi het moi cho choi thi qua lau,
 * ma moi lan vao quay chi dung mot nhom.
 */
export async function loadBuffer(name){
  if (buffers.has(name)) return buffers.get(name);
  if (!ensureCtx()) return null;
  if (!pending.has(name)){
    pending.set(name, loadOne(name).finally(() => pending.delete(name)));
  }
  await pending.get(name);
  return buffers.get(name) ?? null;
}

/**
 * Phat mot su kien. Am dang chay tren cung kenh se bi cat, giong ban goc.
 * Su kien chua co file thi lang le bo qua.
 */
export function play(cue){
  const def = CUES[cue];
  if (!def){ console.warn('[sound] khong co su kien:', cue); return; }
  if (!enabled || !ctx || !def.files.length) return;

  const buf = buffers.get(def.files[Math.floor(Math.random() * def.files.length)]);
  if (!buf) return;

  const old = playing.get(def.ch);          // cat am cu tren cung kenh
  if (old){ try { old.stop(); } catch { /* da dung */ } }

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.value = def.vol ?? 1;           // am luong tong nam o masterNode
  src.connect(gain).connect(masterNode);
  src.onended = () => { if (playing.get(def.ch) === src) playing.delete(def.ch); };
  playing.set(def.ch, src);
  src.start();
}

/** Nhat hoac dat mot mon tren khay. cat = drink|fruit|dessert|side|sandwich */
export function playTray(cat, action){ play(`tray.${cat}.${action}`); }

/** Nhat nguyen lieu tu quay ('counter') hoac tu ngan tu lanh ('fridge'). */
export function playPick(site, food){ play(`${site}.${food}.pick`); }

export function setVolume(v){
  masterVol = Math.min(1, Math.max(0, v));
  if (masterNode) masterNode.gain.value = masterVol;
  return masterVol;
}
export function getVolume(){ return masterVol; }
export function toggleMute(){ return setVolume(masterVol ? 0 : 1); }

/** Liet ke su kien chua co file - tien de biet con thieu gi. */
export function missingCues(){
  return Object.entries(CUES).filter(([,c]) => !c.files.length).map(([k]) => k);
}
