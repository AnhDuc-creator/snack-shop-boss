import struct
class R:
    def __init__(s,b,p=0): s.b=b; s.p=p
    def u8(s):
        v=s.b[s.p]; s.p+=1; return v
    def u32(s):
        v,=struct.unpack('<I',s.b[s.p:s.p+4]); s.p+=4; return v
    def d64(s):
        v,=struct.unpack('<d',s.b[s.p:s.p+8]); s.p+=8; return v
    def string(s):
        n=s.u32()
        if n==0: return None
        v=s.b[s.p:s.p+n-1]; s.p+=n; return v.decode('latin-1')

def parse(path):
    d=open(path,'rb').read()
    r=R(d,12); funcs=[]
    def func(depth,idx):
        src=r.string(); line=r.u32(); lastline=r.u32()
        nups=r.u8(); npar=r.u8(); isvar=r.u8(); maxstack=r.u8()
        ncode=r.u32(); code=struct.unpack('<%dI'%ncode, r.b[r.p:r.p+4*ncode]); r.p+=4*ncode
        nk=r.u32(); consts=[]
        for i in range(nk):
            t=r.u8()
            if t==0: consts.append(None)
            elif t==1: consts.append(bool(r.u8()))
            elif t==3: consts.append(r.d64())
            elif t==4: consts.append(r.string())
        nproto=r.u32(); kids=[]
        for i in range(nproto):
            kids.append(func(depth+1,len(funcs)+1))
        n=r.u32(); r.p+=4*n
        n=r.u32()
        for i in range(n): r.string(); r.u32(); r.u32()
        n=r.u32(); ups=[]
        for i in range(n): ups.append(r.string())
        me={'depth':depth,'line':line,'lastline':lastline,'npar':npar,
            'consts':consts,'code':code,'kids':kids,'ups':ups}
        funcs.append(me)
        return me
    func(0,0)
    return funcs
