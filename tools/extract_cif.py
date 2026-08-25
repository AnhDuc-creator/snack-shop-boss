"""
Tach noi dung Ciftree.dat (Nancy Drew 21 - Warnings at Waverly Academy) - ban 2.

Khac ban 1:
  - Script Lua duoc dat ten theo duong dan goc nhung ngay trong bytecode
  - Do bang ten linh hoat hon (quet ca vung duoi file)
  - In chan doan cho entry type 6 chua ro dinh dang

Cach dung:
    py -3.11 extract_cif2.py "duong\\dan\\Ciftree.dat" out2
"""

import os
import re
import struct
import sys
from collections import Counter

MAGIC = b"CIF FILE HerInteractive\x00"
ENTRY_HDR = 48
TYPE_IMAGE = 2
TYPE_LUA = 3


def read_entry_header(data, off):
    if off + ENTRY_HDR > len(data) or data[off:off + 24] != MAGIC:
        return None
    etype, width, height, unk, size = struct.unpack("<5I", data[off + 28:off + 48])
    if size == 0 or off + ENTRY_HDR + size > len(data):
        return None
    return {"offset": off, "type": etype, "width": width, "height": height,
            "unk": unk, "size": size, "data_offset": off + ENTRY_HDR}


def iter_entries(data):
    if data[:24] != MAGIC:
        return
    # File CIF don le: header ngoai 28 byte roi thang toi header entry (khong lap magic)
    if data[28:52] != MAGIC:
        etype, width, height, unk, size = struct.unpack("<5I", data[28:48])
        if size and 48 + size <= len(data):
            yield {"offset": 28, "type": etype, "width": width, "height": height,
                   "unk": unk, "size": size, "data_offset": 48}
            return
    off = 28
    while off < len(data):
        e = read_entry_header(data, off)
        if e is None:
            nxt = data.find(MAGIC, off + 1)
            if nxt < 0:
                return
            off = nxt
            continue
        yield e
        off = e["data_offset"] + e["size"]


def lua_source_name(payload):
    """Lay ten file .lua goc nhung trong header bytecode Lua 5.1."""
    if payload[:4] != b"\x1bLua" or len(payload) < 20:
        return None
    try:
        n, = struct.unpack("<I", payload[12:16])
        if not (0 < n < 512):
            return None
        raw = payload[16:16 + n].rstrip(b"\x00").decode("latin-1")
        raw = raw.lstrip("@")
        return os.path.basename(raw.replace("\\", "/")).replace(".lua", "")
    except Exception:
        return None


def find_name_table(data, n_entries):
    """
    Tim bang ten: quet vung cuoi file de tim so 4 byte bang dung so entry,
    roi thu cac kich thuoc ban ghi khac nhau.
    """
    if n_entries <= 0:
        return {}, 0, -1
    target = struct.pack("<I", n_entries)
    search_from = max(0, len(data) - 8 * 1024 * 1024)
    pos = search_from
    candidates = []
    while True:
        j = data.find(target, pos)
        if j < 0:
            break
        candidates.append(j)
        pos = j + 1

    for start in candidates:
        remaining = len(data) - (start + 4)
        if remaining < n_entries * 20:
            continue
        rec_size = remaining // n_entries
        if not (16 <= rec_size <= 256):
            continue
        names, p, ok = {}, start + 4, 0
        for _ in range(n_entries):
            rec = data[p:p + rec_size]
            if len(rec) < rec_size:
                break
            # ban ghi = ten (rec_size-4 byte, dem \x00) + offset entry 4 byte
            raw = rec[:rec_size - 4].split(b"\x00")[0]
            if raw and all(32 <= b < 127 for b in raw):
                ok += 1
            v, = struct.unpack("<I", rec[rec_size - 4:rec_size])
            if v < len(data):
                names[v] = raw.decode("latin-1", "replace")
            p += rec_size
        if ok > n_entries * 0.8:
            return names, rec_size, start
    return {}, 0, -1


def safe_name(s):
    s = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", s).strip()
    return s[:120] or "unnamed"


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 1

    src, outdir = sys.argv[1], sys.argv[2]
    data = open(src, "rb").read()
    print("Doc %s (%.1f MB)" % (src, len(data) / 1048576))

    for sub in ("png", "lua", "raw"):
        os.makedirs(os.path.join(outdir, sub), exist_ok=True)

    entries = list(iter_entries(data))
    print("Tim thay %d entry" % len(entries))

    names, rec_size, tbl_at = find_name_table(data, len(entries))
    if names:
        print("Bang ten: %d ten, ban ghi %d byte, bat dau o offset %d"
              % (len(names), rec_size, tbl_at))
    else:
        print("Van khong doc duoc bang ten (script Lua van co ten rieng)")

    counts, magic6, index_lines, lua_entries = Counter(), Counter(), [], []
    used = set()

    for i, e in enumerate(entries):
        payload = data[e["data_offset"]:e["data_offset"] + e["size"]]
        counts[e["type"]] += 1

        label = lua_source_name(payload) or names.get(e["offset"]) or "%05d" % i
        label = safe_name(label)
        if label in used:
            label = "%s_%05d" % (label, i)
        used.add(label)

        if e["type"] == TYPE_IMAGE and payload[:4] == b"\x89PNG":
            name = "png/%s.png" % label
        elif e["type"] == TYPE_LUA and payload[:4] == b"\x1bLua":
            name = "lua/%s.luac" % label
            lua_entries.append((label, payload))
        else:
            name = "raw/%s_type%d.bin" % (label, e["type"])
            magic6[(e["type"], payload[:4])] += 1

        with open(os.path.join(outdir, name), "wb") as f:
            f.write(payload)

        index_lines.append("%05d\toffset=%d\ttype=%d\t%dx%d\tsize=%d\t%s"
                           % (i, e["offset"], e["type"], e["width"],
                              e["height"], e["size"], name))

    with open(os.path.join(outdir, "index.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(index_lines))

    with open(os.path.join(outdir, "lua_strings.txt"), "w", encoding="utf-8") as f:
        for label, payload in lua_entries:
            f.write("\n===== %s =====\n" % label)
            f.write("\n".join(m.decode("ascii", "replace")
                              for m in re.findall(rb"[ -~]{4,}", payload)))
            f.write("\n")

    print("\nTheo type:")
    for t in sorted(counts):
        lab = {TYPE_IMAGE: "anh PNG", TYPE_LUA: "script Lua"}.get(t, "chua ro")
        print("  type %d (%s): %d" % (t, lab, counts[t]))

    if magic6:
        print("\n4 byte dau cua cac entry chua ro dinh dang:")
        for (t, m), c in magic6.most_common(12):
            printable = "".join(chr(b) if 32 <= b < 127 else "." for b in m)
            print("  type %d  %s  '%s'  x%d"
                  % (t, " ".join("%02X" % b for b in m), printable, c))

    print("\nXong. Ket qua o:", outdir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
