"""
Chuan bi am thanh cho minigame: tu .HIS trong thu muc game -> game/assets/sound/.

Danh sach can gi KHONG viet tay. No doc thang tu bytecode cua cac scene goc -
noi ban goc khai bao moi khoi AR.Sound - VA cac script chung keo vao bang
`Scene:Include`. Them hay bot am trong ban goc thi chay lai la danh sach tu
cap nhat, khong phai sua Python.

Vi sao phai lan theo Include: 108 clip tan gau nam trong `GossipVOs_SC`, khong
nam trong `s4210`. Chi doc mot minh s4210 thi ra 86 am, thieu dung mot phan ba.

Vi sao phai co NHIEU diem xuat phat: vong giao vien khong phai include cua
`s4210` ma la nam scene ROI NHAU, noi voi nhau bang `AR:NavLogic{ scene = ... }`
chu khong bang `Scene:Include`. Lan theo Include khong bao gio toi duoc chung -
phai ke thang ten ra. Xem docs/spec.md muc 9.

Hien tai lan het ra 208 am (86 + 108 + 14 cua vong giao vien).

Chay rieng:
    py tools/sound_assets.py "<thu-muc-game>"     # copy + doi, day du
    py tools/sound_assets.py --list               # chi in danh sach can, khong ghi gi

Quy tac dat ten (giu nguyen tu dot bo sung dau tien):
    Toaster_Down01_SFX.HIS  ->  toaster_down01.<duoi>
    viet thuong het, bo hau to _SFX / _sfx.

Quy tac duoi file - QUAN TRONG, dung sai la mat chat luong:
    codec 1 (PCM tho)   -> .wav   giu nguyen mau, khong nen
    codec 2 (Ogg Vorbis)-> .ogg   tach thang bitstream ban goc ra, KHONG giai
                                  roi nen lai. Nen lai lan hai chi lam te hon.

Ben trong .HIS da la Vorbis san roi, nen viec "chuyen sang wav" cho nhom codec 2
khong lay lai duoc gi - mat mat xay ra tu luc Her Interactive dong goi.

Vi hai nhom nam lan lon trong cung mot thu muc, buoc cuoi con ghi ra
game/assets/sound/index.json dang {"ten_file": "wav"|"ogg"} de sound.js biet
truoc duoi file. Khong co no thi ben web phai thu .ogg roi moi .wav, tuc 46
file nhom PCM deu an mot lan 404 truoc khi tai dung.
"""

import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))

from his_to_wav import HEADER, CODEC_PCM, CODEC_VORBIS, parse_header, wav_bytes  # noqa: E402

LUA_DIR = os.path.join(ROOT, "extracted", "lua")

# Diem xuat phat. Sau scene RIENG - khong scene nao Include scene nao, nen thieu
# mot dong o day la thieu han cum am cua scene do.
#   s4210  quay don hoc sinh (tu day moi Include Cooking_SC, GossipVOs_SC...)
#   s4230  chuong reo bao co don giao vien
#   s4231  lam don giao vien - khac s4210 dung ba am: bo ND_AllDone01, doi
#          PaperBagShake01..05 thanh PaperUnfold01/10, them Buzzer01_Short
#   s4232  thang: chuong    s4233  hoa: NWA132    s4234  thua: Buzzer_Double + NWA133
SCENES = ["s4210", "s4230", "s4231", "s4232", "s4233", "s4234"]
SCENE_LUAC = [os.path.join(LUA_DIR, n + ".luac") for n in SCENES]
SRC_DIR = os.path.join(ROOT, "extracted", "sound_src")
OUT_DIR = os.path.join(ROOT, "game", "assets", "sound")

# Ten am thanh trong bytecode luon co hau to _SFX hoac _sfx.
SFX = re.compile(r"^[A-Za-z0-9_]+_(?:SFX|sfx)$")


def asset_name(stem):
    """Toaster_Down01_SFX -> toaster_down01"""
    s = stem.lower()
    return s[:-4] if s.endswith("_sfx") else s


def scene_tokens(luac):
    """Hang so cua mot file .luac theo dung thu tu gap trong ma lenh."""
    from luaparse import parse
    from luatrace import trace

    for f in parse(luac):
        for tok in trace(f):
            yield str(tok)


def includes(tokens):
    """Ten script ma `Scene:Include{"..."}` keo vao.

    Trong bytecode no ra thanh ba token lien tiep: Scene, Include, <ten>.
    Doc bang cach lan token thay vi viet tay danh sach - them include trong
    ban goc thi chay lai la tu bat duoc.
    """
    out = []
    for i in range(len(tokens) - 2):
        if tokens[i] == "Scene" and tokens[i + 1] == "Include":
            out.append(tokens[i + 2])
    return out


def needed_sounds(luac=SCENE_LUAC):
    """Moi ten am thanh cac scene goc va cac script chung Include nhac den.

    `luac` nhan mot duong dan hoac mot danh sach duong dan; ca hai deu duyet
    theo be rong, gap `Scene:Include` thi day script do vao cuoi hang doi.

    GossipVOs_SC vao bang duong Include: no giu 108 clip tan gau, `s4210` chi
    Include chu khong khai bao lai. Bo qua no la thieu dung mot phan ba so am.
    Nam scene 4230-4234 thi nguoc lai - khong ai Include chung, phai co san
    trong hang doi tu dau (xem SCENES).
    """
    seen, out = set(), []
    roots = [luac] if isinstance(luac, str) else list(luac)
    queue, done = list(roots), set()

    while queue:
        path = queue.pop(0)
        key = os.path.basename(path).lower()
        if key in done or not os.path.isfile(path):
            continue
        done.add(key)

        tokens = list(scene_tokens(path))
        for name in includes(tokens):
            queue.append(os.path.join(LUA_DIR, name + ".luac"))
        for tok in tokens:
            if SFX.match(tok) and tok not in seen:
                seen.add(tok)
                out.append(tok)
    return out


def convert(his_path, out_dir):
    """Doi mot .HIS. Tra ve (ten_file_ra, codec)."""
    with open(his_path, "rb") as f:            # chi doc, khong bao gio mo che do ghi
        data = f.read()
    h = parse_header(data, os.path.basename(his_path))
    payload = data[HEADER:]
    stem = asset_name(os.path.splitext(os.path.basename(his_path))[0])

    if h["codec"] == CODEC_VORBIS:
        # Da la Ogg hoan chinh - tach ra nguyen ven, khong dung lai bo giai ma.
        if payload[:4] != b"OggS":
            raise ValueError("%s: codec 2 ma khong bat dau bang OggS" % stem)
        out, body = stem + ".ogg", payload
    else:
        # PCM tho: truong 0x18 noi dung so byte, cat theo no roi boc RIFF.
        out, body = stem + ".wav", wav_bytes(h, payload[:h["pcm_size"]])

    with open(os.path.join(out_dir, out), "wb") as f:
        f.write(body)
    return out, h["codec"]


def stage_from_game(game_dir, names, src_dir=SRC_DIR):
    """Chep .HIS can dung tu thu muc game sang extracted/sound_src.

    Khong doi thang tu thu muc game: CLAUDE.md yeu cau xu ly hang loat tren
    ban chep trong extracted/. Thu muc game chi duoc doc.
    """
    sound_dir = os.path.join(game_dir, "Sound")
    if not os.path.isdir(sound_dir):
        raise FileNotFoundError(sound_dir)
    os.makedirs(src_dir, exist_ok=True)

    have = {f.lower(): f for f in os.listdir(sound_dir)}
    copied, missing = 0, []
    for n in names:
        key = (n + ".HIS").lower()
        if key not in have:
            missing.append(n)
            continue
        dst = os.path.join(src_dir, have[key])
        if not os.path.isfile(dst):
            shutil.copy2(os.path.join(sound_dir, have[key]), dst)
            copied += 1
    return copied, missing


def write_index(converted, out_dir=OUT_DIR):
    """Ghi bang tra `ten_file -> duoi` cho sound.js. Tra ve so muc da ghi.

    `converted` la ket qua that su cua lan doi vua roi nen no la nguon dung
    nhat. Quet them thu muc de bat cac file them tay (easter egg, xem
    captions.js) - thieu chung thi rieng chung lai roi ve cach thu hai duoi.
    """
    index = dict(converted)
    for f in sorted(os.listdir(out_dir)):
        stem, ext = os.path.splitext(f)
        if ext in (".wav", ".ogg") and stem not in index:
            index[stem] = ext[1:]

    with open(os.path.join(out_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, indent=0, sort_keys=True)   # moi khoa mot dong, de doc diff
        f.write("\n")
    return len(index)


def build(names=None, src_dir=SRC_DIR, out_dir=OUT_DIR, quiet=False):
    """Doi moi am trong `names` tu src_dir sang out_dir. Tra ve (so_wav, so_ogg, thieu)."""
    names = names or needed_sounds()
    os.makedirs(out_dir, exist_ok=True)
    have = {os.path.splitext(f)[0].lower(): f for f in os.listdir(src_dir)}

    n_wav = n_ogg = 0
    missing = []
    converted = {}
    for n in names:
        real = have.get(n.lower())
        if not real:
            missing.append(n)
            continue
        out, codec = convert(os.path.join(src_dir, real), out_dir)
        stem, ext = os.path.splitext(out)
        converted[stem] = ext[1:]
        if codec == CODEC_PCM:
            n_wav += 1
        else:
            n_ogg += 1

    n_index = write_index(converted, out_dir)

    if not quiet:
        print("  %d file .wav (PCM giu nguyen), %d file .ogg (Vorbis ban goc)"
              % (n_wav, n_ogg))
        print("  index.json: %d muc" % n_index)
        if missing:
            print("   THIEU %d file nguon:" % len(missing), ", ".join(missing[:8]))
    return n_wav, n_ogg, missing


def main():
    argv = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}

    names = needed_sounds()
    if "--list" in flags:
        for n in names:
            print("%-28s -> %s" % (n, asset_name(n)))
        print("\nTong %d am thanh %s dung." % (len(names), "/".join(SCENES)))
        return 0

    if argv:
        copied, missing = stage_from_game(argv[0], names)
        print("Chep %d file .HIS moi vao extracted/sound_src." % copied)
        if missing:
            print(" THIEU trong thu muc game:", ", ".join(missing[:8]))

    print("Doi %d am thanh -> %s" % (len(names), OUT_DIR))
    build(names)
    return 0


if __name__ == "__main__":
    sys.exit(main())
