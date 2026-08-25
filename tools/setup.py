"""
Chuan bi toan bo asset tu ban game goc tren may.

Chay:
    py tools/setup.py "D:\\SteamLibrary\\steamapps\\common\\Nancy Drew Warnings at Waverly Academy"

Hoac dat bien moi truong WAC_DIR roi chay khong tham so.

Script chi DOC thu muc game, khong bao gio ghi vao do.
Ket qua:
    extracted/          toan bo noi dung Ciftree.dat (png, lua, raw)
    extracted/video/    anh nen tach tu file .bik
    extracted/sound_src/ ban chep .HIS cac am minigame dung
    game/assets/        atlas.png, bg.png
    game/assets/sound/  am thanh, ten viet thuong va bo hau to _SFX
"""

import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))

EXTRACTED = os.path.join(ROOT, "extracted")
ASSETS = os.path.join(ROOT, "game", "assets")

# Ten file trong ciftree -> ten file game dung
ATLAS_NAME = "REC_SNACKSHOPPUZ-TXT_OVL.png"

# Cac file .bik can tach thanh anh
VIDEOS = {
    "REC_SnackShopPUZ-TXT_BG.bik": "bg.png",
    "REC_SNACKSHOPDIRECTIONSCU-TXT_OVL.bik": "directions.png",  # co the khong ton tai
}


def find_game_dir(argv):
    if len(argv) > 1:
        return argv[1]
    env = os.environ.get("WAC_DIR")
    if env:
        return env
    print(__doc__)
    sys.exit(1)


def have_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except Exception:
        return False


def main():
    game_dir = find_game_dir(sys.argv)
    ciftree = os.path.join(game_dir, "Ciftree", "Ciftree.dat")
    video_dir = os.path.join(game_dir, "Video")

    if not os.path.isfile(ciftree):
        print("Khong thay:", ciftree)
        print("Kiem tra lai duong dan thu muc game.")
        return 1

    # 1. Giai nen ciftree
    print("[1/4] Giai nen Ciftree.dat ...")
    import extract_cif
    sys.argv = ["extract_cif", ciftree, EXTRACTED]
    extract_cif.main()

    # 2. Tach anh nen tu video
    print("\n[2/4] Tach anh nen tu file .bik ...")
    out_video = os.path.join(EXTRACTED, "video")
    os.makedirs(out_video, exist_ok=True)
    if not have_ffmpeg():
        print("  Khong tim thay ffmpeg - bo qua buoc nay.")
        print("  Cai bang: winget install Gyan.FFmpeg")
    else:
        for bik, png in VIDEOS.items():
            src = os.path.join(video_dir, bik)
            if not os.path.isfile(src):
                continue
            dst = os.path.join(out_video, png)
            subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                            "-i", src, "-pix_fmt", "rgba", dst], check=False)
            print("  ", png)

    # 3. Am thanh. Danh sach can gi doc thang tu bytecode s4210, khong viet tay -
    #    ban goc doi am nao thi chay lai la tu cap nhat.
    print("\n[3/4] Chuan bi am thanh ...")
    sound_ok = True
    try:
        import sound_assets
        names = sound_assets.needed_sounds()
        print("   scene s4210 dung %d am thanh." % len(names))
        copied, missing = sound_assets.stage_from_game(game_dir, names)
        if copied:
            print("   chep %d file .HIS moi vao extracted/sound_src." % copied)
        if missing:
            print("   THIEU %d file trong %s:" % (len(missing), os.path.join(game_dir, "Sound")))
            print("     ", ", ".join(missing[:6]))
            sound_ok = False
        sound_assets.build(names, out_dir=os.path.join(ASSETS, "sound"))
    except FileNotFoundError as e:
        print("   Khong thay thu muc am thanh:", e)
        print("   Bo qua buoc nay - game van chay, chi la khong co tieng.")
        sound_ok = False

    # 4. Chep hai file game can
    print("\n[4/4] Chep asset vao game/assets ...")
    os.makedirs(ASSETS, exist_ok=True)
    pairs = [
        (os.path.join(EXTRACTED, "png", ATLAS_NAME), os.path.join(ASSETS, "atlas.png")),
        (os.path.join(out_video, "bg.png"),          os.path.join(ASSETS, "bg.png")),
    ]
    ok = True
    for src, dst in pairs:
        if os.path.isfile(src):
            shutil.copy2(src, dst)
            print("  ", os.path.basename(dst))
        else:
            print("   THIEU:", src)
            ok = False

    ok = ok and sound_ok
    print("\nXong." if ok else "\nXong nhung con thieu file - xem o tren.")
    print("Mo game/index.html bang Live Server de choi.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
