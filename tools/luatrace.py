"""Lan vet hang so theo dung thu tu xuat hien trong ma lenh Lua 5.1."""
import struct

OPS = ["MOVE","LOADK","LOADBOOL","LOADNIL","GETUPVAL","GETGLOBAL","GETTABLE",
       "SETGLOBAL","SETUPVAL","SETTABLE","NEWTABLE","SELF","ADD","SUB","MUL",
       "DIV","MOD","POW","UNM","NOT","LEN","CONCAT","JMP","EQ","LT","LE","TEST",
       "TESTSET","CALL","TAILCALL","RETURN","FORLOOP","FORPREP","TFORLOOP",
       "SETLIST","CLOSE","CLOSURE","VARARG"]
BITRK = 1 << 8


def decode(ins):
    op = ins & 0x3F
    a = (ins >> 6) & 0xFF
    c = (ins >> 14) & 0x1FF
    b = (ins >> 23) & 0x1FF
    bx = (ins >> 14) & 0x3FFFF
    return OPS[op] if op < len(OPS) else "OP%d" % op, a, b, c, bx


def rk(consts, v):
    """RK: >=256 nghia la chi so hang so."""
    if v & BITRK:
        i = v & ~BITRK
        return consts[i] if i < len(consts) else None
    return None


def trace(func):
    """Tra ve danh sach token: hang so gap theo dung thu tu ma lenh."""
    out = []
    k = func["consts"]
    for ins in func["code"]:
        name, a, b, c, bx = decode(ins)
        if name == "LOADK":
            out.append(k[bx])
        elif name in ("GETGLOBAL", "SETGLOBAL"):
            out.append(k[bx])
        elif name in ("GETTABLE", "SETTABLE", "SELF", "ADD", "SUB", "MUL",
                      "DIV", "MOD", "POW", "EQ", "LT", "LE", "CONCAT"):
            for v in (b, c):
                r = rk(k, v)
                if r is not None:
                    out.append(r)
        elif name == "CLOSURE":
            out.append("<closure#%d>" % bx)
    return out
