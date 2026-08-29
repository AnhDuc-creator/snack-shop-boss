// Du lieu trich tu ban goc Nancy Drew #21 (s4210.luac + Cooking_SC.luac).
// MOI con so trong file nay deu doc tu bytecode hoac do tu sprite that.
// Doi bat ky gia tri nao la lech khoi ban goc - doc docs/spec.md truoc khi sua.
//
// Quy uoc: Rect = [left, top, right, bottom], goc phai/duoi KHONG bao gom.
// Toa do man hinh theo he 640x400. Toa do atlas theo REC_SNACKSHOPPUZ-TXT_OVL.png.

export const W = 640, H = 400;

// Rect goc dang [left, top, right, bottom]
export const FOODS = {
  bread:        {cat:'sandwich', bun:1, leftUp:[495,1,543,29],   rightUp:[544,1,592,30],
                 leftDown:[495,30,543,58],  rightDown:[544,31,592,59],  text:'bread'},
  breadToasted: {cat:'sandwich', bun:1, leftUp:[495,59,543,88],  rightUp:[544,60,592,89],
                 leftDown:[495,89,543,117], rightDown:[544,90,592,118], text:'toasted bread'},
  bagel:        {cat:'sandwich', bun:1, leftUp:[593,33,639,65],  rightUp:[640,33,686,65],
                 leftDown:[593,1,640,32],   rightDown:[641,1,689,32],   text:'bagel'},
  bagelToasted: {cat:'sandwich', bun:1, leftUp:[593,98,639,130], rightUp:[640,98,686,130],
                 leftDown:[593,66,640,97],  rightDown:[641,66,689,97],  text:'toasted bagel'},

  meat:     {cat:'sandwich', left:[358,455,406,483], right:[407,455,448,483], text:'meat'},
  tomatoes: {cat:'sandwich', left:[438,191,489,214], right:[438,215,489,238], text:'tomatoes'},
  lettuce:  {cat:'sandwich', left:[449,430,484,459], right:[449,460,485,489], text:'lettuce'},
  cheese:   {cat:'sandwich', left:[358,430,396,454], right:[397,430,433,454], text:'cheese'},

  juice: {cat:'drink', left:[304,191,338,271], right:[339,191,370,271], text:'juice'},
  water: {cat:'drink', left:[544,268,576,350], right:[577,268,607,349], text:'water'},
  milk:  {cat:'drink', left:[371,191,405,236], right:[406,191,437,236], text:'milk'},

  apple:  {cat:'fruit', left:[371,237,400,268], right:[401,237,430,268], text:'apple'},
  orange: {cat:'fruit', left:[431,239,460,266], right:[461,239,490,265], text:'orange'},

  chocolate: {cat:'dessert', left:[485,432,546,458], right:[486,459,546,484], text:'candy bar'},
  cookie:    {cat:'dessert', left:[527,144,578,176], right:[579,145,633,176], text:'cookie'},

  chips:    {cat:'side', left:[495,177,540,216], right:[541,177,605,216], text:'chips'},
  pretzels: {cat:'side', left:[491,217,535,267], right:[536,217,596,267], text:'pretzels'},
  granola:  {cat:'side', left:[606,177,652,221], right:[653,177,716,221], text:'granola'},
  nuts:     {cat:'side', left:[597,222,640,266], right:[641,222,703,267], text:'nuts'},

  // trung gian: khong dat len khay duoc, phai nuong thanh cookie
  cookieDough: {cat:null, left:[495,130,526,154], right:[579,145,633,176], text:'cookie dough'},
};

export const FILLINGS = ['meat','cheese','lettuce','tomatoes'];
export const BUNS     = ['bread','bagel','breadToasted','bagelToasted'];
export const BY_CAT   = {drink:['juice','water','milk'], fruit:['apple','orange'],
                  dessert:['chocolate','cookie'], side:['chips','pretzels','granola','nuts']};
export const CATS     = ['fruit','drink','dessert','side','sandwich'];

// Thoi luong (giay) - doc tu bytecode
export const DUR = {fridgeOpen:5, bake:5, toast:5, trashLid:0.25, trayVacant:4, pickButton:0.6};
export const POP = 0.45;   // thoi gian banh nho len sau khi nuong xong (6 khung)

// --- vong don giao vien ---
// Nguong thoi gian TU SIET DAN: moi lan thang lui 1 giay, co san.
// Hai gia tri nay nam trong VarTable cua ban goc nen nho qua cac phien choi.
export const TEACHER = {
  chanceOneIn: 4,        // math.random(1,4) == 2 -> 1/4 moi vong
  delayMin: 2, delayMax: 4,
  creditTime0: 30, creditFloor: 10,
  demeritTime0: 60, demeritFloor: 15,
  buzzVol: 0.65,
};
export const MAX_SANDWICH = 18;

// Hotspot lay nguyen lieu tren quay [l,t,r,b]
export const DISPENSERS = {
  bread:[208,25,291,68], bagel:[370,31,479,69], chocolate:[317,21,352,71],
  chips:[244,98,281,150], pretzels:[295,98,332,150], granola:[346,98,381,150],
  nuts:[395,98,431,150], meat:[249,159,283,187], tomatoes:[303,161,337,187],
  lettuce:[355,161,389,187], cheese:[407,164,445,187],
};

// Tu lanh
export const FRIDGE = {
  source:[2,2,188,247], onScreen:[0,35,186,280], hotspot:[4,48,142,211], // LTWH goc -> LTRB
  items:{ milk:[14,53,78,88], cookieDough:[93,62,140,79], juice:[42,96,89,160],
          water:[102,96,140,160], orange:[69,177,96,199], apple:[117,180,145,207] },
};

// Lo cookie
export const OVEN = {
  openHs:[30,303,176,342], closeHs:[30,337,176,379], pickUpHs:[30,303,176,342],
  unbaked:[293,2,493,94], baked:[293,97,493,189], onScreen:[0,293,200,385],
  redSrc:[175,250,188,260],   redOn:[143,351,156,361],
  greenSrc:[159,250,172,260], greenOn:[124,351,137,361],
};

// May nuong
export const TOASTER = {
  placeHs:[572,162,618,216], startHs:[574,234,609,256], onScreen:[570,159,618,270],
  // Source1 = con MOT nua trong lo, Source2 = con HAI nua
  src:{ bread:{up2:[242,49,290,160], down:[191,49,239,160],
               toasted1:[308,391,356,502], toasted2:[257,391,305,502]},
        bagel:{up2:[242,163,290,274], down:[191,163,239,274],
               toasted1:[308,277,356,388], toasted2:[257,277,305,388]} },
  anim:{ bread:[[2,391,50,502],[53,391,101,502],[104,391,152,502],
                [155,391,203,502],[206,391,254,502],[257,391,305,502]],
         bagel:[[2,277,50,388],[53,277,101,388],[104,277,152,388],
                [155,277,203,388],[206,277,254,388],[257,277,305,388]] },
};

export const TRASH = {source:[191,2,290,46], onScreen:[534,298,633,342]};

// Hai khay
export const TRAYS = [
  { key:'left', side:'left',
    source:[359,272,543,350], onScreen:[172,202,356,280],
    button:{source:[569,497,651,529], onScreen:[235,310,317,342]},
    slots:{drink:[190,187,228,268], fruit:[251,192,280,223], dessert:[286,206,347,238],
           side:[309,222,355,272], sandwich:[241,226,289,255]} },
  { key:'right', side:'right',
    source:[358,351,552,429], onScreen:[355,202,549,280],
    button:{source:[569,532,651,564], onScreen:[402,310,484,342]},
    slots:{drink:[367,187,399,268], fruit:[416,192,446,223], dessert:[449,207,509,238],
           side:[479,222,544,272], sandwich:[415,226,466,255]} },
];

// Khung ticket
export const ORDERS_UI = {
  area:[499,25,625,154], textHeight:12, indent:10,
  spacer:[37,249,157,262],
  // Vung re chuot de cuon tu dong. Toc do tang dan tu minSpeed toi maxSpeed.
  upHs:[499,0,640,50], downHs:[499,108,640,158],
  minSpeed:0, maxSpeed:250, catchUpFactor:0.25,
  // CO Y LECH BAN GOC: ban goc chi co cuon tu dong khi re chuot len mep, khong
  // co thanh cuon. Choi thu thay phien vi chuot di ngang qua la danh sach chay.
  // Doi AUTO_SCROLL thanh true de tro ve dung ban goc.
  autoScroll:false,
  // Khung Orders CO SAN mot khe cuon mau xanh dam trong anh nen, o x 628-636.
  // Do bang cach quet do sang tung cot cua bg.png. Vung chu la 499-625, khe nam
  // ngoai vung do nen ve thanh cuon vao day khong che mat chu.
  bar:{track:[628, 27, 636, 152], minThumb:14},
};

export const BACK_HS = [207,365,502,399];
