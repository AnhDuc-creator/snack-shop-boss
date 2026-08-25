"""
Chuyen file am thanh .HIS cua Her Interactive sang .wav.

Cach dung:
    py tools/his_to_wav.py                        # extracted/sound_src -> extracted/sound
    py tools/his_to_wav.py <thu-muc-vao> [thu-muc-ra]
    py tools/his_to_wav.py <file.HIS>   [thu-muc-ra]
    py tools/his_to_wav.py --ogg                  # xuat .ogg nguyen ban, khong can ffmpeg
    py tools/his_to_wav.py --info <file.HIS>      # chi in header, khong ghi gi

Dinh dang HIS (doc nguoc bang cach dump hex; kiem lai tren ca 3021 file, khong file nao lech):

    offset  kieu      y nghia
    0x00    char[4]   "HIS\\0"          chu ky
    0x04    u32       phien ban, luon = 2
    0x08    u16       wFormatTag        luon = 1 (PCM)      <-- WAVEFORMATEX
    0x0A    u16       nChannels         1 hoac 2
    0x0C    u32       nSamplesPerSec    luon = 44100
    0x10    u32       nAvgBytesPerSec   = rate * ch * bits/8
    0x14    u16       nBlockAlign       = ch * bits/8
    0x16    u16       wBitsPerSample    luon = 16
    0x18    u32       so byte PCM SAU khi giai nen
    0x1C    u32       codec: 1 = PCM tho, 2 = Ogg Vorbis
    0x20    ...       du lieu

Muoi sau byte tu 0x08 chinh la mot khoi WAVEFORMATEX, va no mo ta am thanh SAU
khi giai nen - nen chep thang duoc vao chunk "fmt " cua WAV, khong phai doan gi.

  - codec 1: phan du lieu la PCM tho, dai dung bang truong 0x18 (210 file, khop tuyet doi).
  - codec 2: phan du lieu la mot file Ogg Vorbis hoan chinh, bat dau bang "OggS"
             (2811 file). Tach ra la mo duoc ngay bang bat cu trinh phat nao.
             Giai ma sang PCM thi can ffmpeg.

Ve do dai PCM cua file Vorbis:
    Truong 0x18 luon bang granulepos cua trang Ogg cuoi cung - dung ca 2811 file.
    2614 file giai ra dung bang so do. 197 file con lai lech, va da truy ra ly do:

      - 168 file giai ra THIEU dung 128 mau (256 byte mono / 512 byte stereo).
        Do la phan bi nuot khi lap khoi dau cua Vorbis. Kiem cheo bang ca hai
        bo giai ma - ffmpeg noi bo va libvorbis ban goc - ra ket qua giong het
        nhau tung byte, nghia la 128 mau do khong nam trong bitstream. Khong
        the doi lai duoc, va cung khong bia them mau im lang vao (2.9 ms).

      - 29 file giai ra THUA, tu 2 den 2044 byte. Dac ta Vorbis lay granulepos
        cuoi lam diem dung, nen phan du bi cat. Da do bien do phan du de chac:
        gan nhu im lang (dinh 0-522) so voi doan ngay truoc no (1348-32395),
        tuc dung la duoi lap day cua khoi cuoi chu khong phai am thanh that.

Script chi DOC thu muc nguon, moi ket qua ghi vao thu muc dich.
"""

import os
import struct
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "extracted", "sound_src")
OUT_DIR = os.path.join(ROOT, "extracted", "sound")

MAGIC = b"HIS\x00"
HEADER = 32
CODEC_PCM = 1
CODEC_VORBIS = 2
CODEC_NAME = {CODEC_PCM: "PCM tho", CODEC_VORBIS: "Ogg Vorbis"}


class HisError(Exception):
    pass


def parse_header(data, name="<buffer>"):
    """Doc 32 byte dau. Nem HisError neu khong phai file HIS hop le."""
    if len(data) < HEADER:
        raise HisError("%s: file ngan hon 32 byte" % name)
    if data[:4] != MAGIC:
        raise HisError("%s: thieu chu ky HIS (thay %r)" % (name, data[:4]))

    (_, version, tag, channels, rate, byte_rate,
     block_align, bits, pcm_size, codec) = struct.unpack("<4sIHHIIHHII", data[:HEADER])

    if version != 2:
        raise HisError("%s: phien ban %d chua gap bao gio" % (name, version))
    if tag != 1:
        raise HisError("%s: wFormatTag=%d, khong phai PCM" % (name, tag))
    if channels not in (1, 2) or bits != 16 or rate <= 0:
        raise HisError("%s: dinh dang la (%d kenh, %d bit, %d Hz)"
                       % (name, channels, bits, rate))
    if block_align != channels * bits // 8 or byte_rate != rate * block_align:
        raise HisError("%s: WAVEFORMATEX tu mau thuan" % name)
    if codec not in CODEC_NAME:
        raise HisError("%s: codec %d chua gap bao gio" % (name, codec))

    return {"version": version, "channels": channels, "rate": rate,
            "bits": bits, "block_align": block_align, "byte_rate": byte_rate,
            "pcm_size": pcm_size, "codec": codec}


def wav_bytes(h, pcm):
    """Boc PCM vao khung RIFF/WAVE, lay thong so tu chinh header HIS."""
    pad = len(pcm) & 1
    riff_size = 4 + (8 + 16) + (8 + len(pcm) + pad)
    return b"".join([
        b"RIFF", struct.pack("<I", riff_size), b"WAVE",
        b"fmt ", struct.pack("<IHHIIHH", 16, 1, h["channels"], h["rate"],
                             h["byte_rate"], h["block_align"], h["bits"]),
        b"data", struct.pack("<I", len(pcm)), pcm, b"\x00" * pad,
    ])


def have_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except Exception:
        return False


def vorbis_to_pcm(payload, h, name):
    """Giai Ogg Vorbis thanh PCM s16le bang ffmpeg, day qua ong dan, khong file tam."""
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error",
           "-f", "ogg", "-i", "pipe:0",
           "-f", "s16le", "-acodec", "pcm_s16le",
           "-ar", str(h["rate"]), "-ac", str(h["channels"]), "pipe:1"]
    p = subprocess.run(cmd, input=payload, capture_output=True)
    if p.returncode != 0 or not p.stdout:
        err = p.stderr.decode("utf-8", "replace").strip().splitlines()
        raise HisError("%s: ffmpeg that bai - %s" % (name, err[-1] if err else "khong ro"))
    return p.stdout


def convert(path, outdir, as_ogg=False):
    """Doi mot file. Tra ve (ten_ket_qua, header, ghi_chu)."""
    name = os.path.basename(path)
    with open(path, "rb") as f:              # chi doc, khong bao gio mo che do ghi
        data = f.read()

    h = parse_header(data, name)
    payload = data[HEADER:]
    stem = os.path.splitext(name)[0]
    note = ""

    if as_ogg:
        if h["codec"] != CODEC_VORBIS:
            # File PCM khong co gi de tach ra, van phai ghi WAV
            out = os.path.join(outdir, stem + ".wav")
            body = wav_bytes(h, payload[:h["pcm_size"]])
        else:
            out = os.path.join(outdir, stem + ".ogg")
            body = payload
    else:
        if h["codec"] == CODEC_PCM:
            pcm = payload
        else:
            pcm = vorbis_to_pcm(payload, h, name)
        # Truong 0x18 noi truoc so byte PCM, va no luon bang granulepos cua
        # trang Ogg cuoi cung (doi chieu ca 2811 file, khong file nao lech).
        # Lay no lam moc:
        #   thua  -> cat bot. Dac ta Vorbis lay granulepos cuoi lam diem dung;
        #            phan du chi la duoi lap day cua khoi cuoi, do bien do ra
        #            thay gan nhu im lang (max 522 so voi 32395 cua doan truoc).
        #   thieu -> giu nguyen, KHONG bia them mau im lang. Day la 128 mau dau
        #            bi nuot khi lap khoi dau (2.9 ms); ffmpeg va libvorbis tra
        #            ve giong het nhau, tuc la chung khong nam trong bitstream.
        if len(pcm) > h["pcm_size"]:
            pcm = pcm[:h["pcm_size"]]
            note = ("cat", name, len(pcm))
        elif len(pcm) < h["pcm_size"]:
            note = ("thieu", name, h["pcm_size"] - len(pcm))
        out = os.path.join(outdir, stem + ".wav")
        body = wav_bytes(h, pcm)

    with open(out, "wb") as f:
        f.write(body)
    return os.path.basename(out), h, note


def print_info(path):
    with open(path, "rb") as f:
        data = f.read(HEADER + 4)
    h = parse_header(data, os.path.basename(path))
    secs = h["pcm_size"] / float(h["byte_rate"]) if h["byte_rate"] else 0
    print(os.path.basename(path))
    print("  codec        %d (%s)" % (h["codec"], CODEC_NAME[h["codec"]]))
    print("  am thanh     %d Hz, %d bit, %s"
          % (h["rate"], h["bits"], "mono" if h["channels"] == 1 else "stereo"))
    print("  PCM giai ra  %d byte (%.3f giay)" % (h["pcm_size"], secs))
    print("  du lieu      %d byte, bat dau bang %r"
          % (os.path.getsize(path) - HEADER, data[HEADER:HEADER + 4]))


def main():
    argv = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = set(a for a in sys.argv[1:] if a.startswith("--"))

    if "--help" in flags or "-h" in flags:
        print(__doc__)
        return 0

    if "--info" in flags:
        if not argv:
            print("Can mot file .HIS de xem.")
            return 1
        for p in argv:
            print_info(p)
        return 0

    as_ogg = "--ogg" in flags
    src = argv[0] if argv else SRC_DIR
    outdir = argv[1] if len(argv) > 1 else OUT_DIR

    if os.path.isdir(src):
        files = [os.path.join(src, n) for n in sorted(os.listdir(src))
                 if n.lower().endswith(".his")]
    elif os.path.isfile(src):
        files = [src]
    else:
        print("Khong thay:", src)
        return 1

    if not files:
        print("Khong co file .HIS nao trong:", src)
        return 1

    if not as_ogg and not have_ffmpeg():
        print("Khong tim thay ffmpeg - can no de giai Ogg Vorbis.")
        print("Cai bang: winget install Gyan.FFmpeg")
        print("Hoac chay lai voi --ogg de tach thang ra file .ogg (khong can ffmpeg).")
        return 1

    os.makedirs(outdir, exist_ok=True)
    print("Doi %d file .HIS -> %s" % (len(files), "OGG" if as_ogg else "WAV"))
    print("  tu   ", src)
    print("  sang ", outdir)

    counts = {CODEC_PCM: 0, CODEC_VORBIS: 0}
    errors = []
    trimmed, short = [], []

    def job(path):
        try:
            return convert(path, outdir, as_ogg), None
        except HisError as e:
            return None, str(e)
        except Exception as e:                    # noqa: BLE001 - bao ten file roi di tiep
            return None, "%s: %s" % (os.path.basename(path), e)

    workers = min(16, (os.cpu_count() or 4))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for i, (res, err) in enumerate(pool.map(job, files), 1):
            if err:
                errors.append(err)
            else:
                _, h, note = res
                counts[h["codec"]] += 1
                if note:
                    (trimmed if note[0] == "cat" else short).append(note)
            if len(files) > 50 and i % 200 == 0:
                print("  ... %d/%d" % (i, len(files)))

    done = sum(counts.values())
    print("\nXong %d/%d file." % (done, len(files)))
    for c in sorted(counts):
        if counts[c]:
            print("  codec %d (%-10s): %d" % (c, CODEC_NAME[c], counts[c]))
    if trimmed:
        print("\nCat duoi lap day theo granulepos: %d file (binh thuong)." % len(trimmed))
    if short:
        print("\nNgan hon header %d file (binh thuong, xem chu thich trong convert()):"
              % len(short))
        for kind, nm, n in short[:5]:
            print("   %-46s thieu %d byte" % (nm, n))
        if len(short) > 5:
            print("   ... con %d file nua" % (len(short) - 5))
    if errors:
        print("\nLoi (%d):" % len(errors))
        for e in errors[:10]:
            print("  ", e)
        if len(errors) > 10:
            print("   ... con %d loi nua" % (len(errors) - 10))
    print("\nKet qua o:", outdir)
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
