"""
Chuan bi am thanh cho minigame: tu .HIS trong thu muc game -> game/assets/sound/.

Danh sach can gi KHONG viet tay. No doc thang tu bytecode cua scene s4210 -
noi ban goc khai bao moi khoi AR.Sound. Them hay bot am trong ban goc thi
chay lai la danh sach tu cap nhat, khong phai sua Python.

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
"""

import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))

from his_to_wav import HEADER, CODEC_PCM, CODEC_VORBIS, parse_header, wav_bytes  # noqa: E402

SCENE_LUAC = os.path.join(ROOT, "extracted", "lua", "s4210.luac")
SRC_DIR = os.path.join(ROOT, "extracted", "sound_src")
OUT_DIR = os.path.join(ROOT, "game", "assets", "sound")

# Ten am thanh trong bytecode luon co hau to _SFX hoac _sfx.
SFX = re.compile(r"^[A-Za-z0-9_]+_(?:SFX|sfx)$")


def asset_name(stem):
    """Toaster_Down01_SFX -> toaster_down01"""
    s = stem.lower()
    return s[:-4] if s.endswith("_sfx") else s


def needed_sounds(luac=SCENE_LUAC):
    """Moi ten am thanh scene s4210 nhac den, theo dung thu tu gap trong ma lenh."""
    from luaparse import parse
    from luatrace import trace

    seen, out = set(), []
    for f in parse(luac):
        for tok in trace(f):
            tok = str(tok)
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


def build(names=None, src_dir=SRC_DIR, out_dir=OUT_DIR, quiet=False):
    """Doi moi am trong `names` tu src_dir sang out_dir. Tra ve (so_wav, so_ogg, thieu)."""
    names = names or needed_sounds()
    os.makedirs(out_dir, exist_ok=True)
    have = {os.path.splitext(f)[0].lower(): f for f in os.listdir(src_dir)}

    n_wav = n_ogg = 0
    missing = []
    for n in names:
        real = have.get(n.lower())
        if not real:
            missing.append(n)
            continue
        _, codec = convert(os.path.join(src_dir, real), out_dir)
        if codec == CODEC_PCM:
            n_wav += 1
        else:
            n_ogg += 1

    if not quiet:
        print("  %d file .wav (PCM giu nguyen), %d file .ogg (Vorbis ban goc)"
              % (n_wav, n_ogg))
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
        print("\nTong %d am thanh scene s4210 dung." % len(names))
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
