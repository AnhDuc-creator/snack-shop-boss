# Mau file giu lai de doi chieu

Ba file nay la mau nho, dung khi can kiem tra lai format CIF ma khong phai mo
file 55MB.

| File | Vai tro |
|---|---|
| `s6400.cif` | File CIF DON LE (chi mot header 28 byte roi thang toi entry). Chua bytecode Lua cua scene thanh tuu. Dung de kiem tra nhanh `extract_cif.py`. |
| `PUI_Nancy.dat` | File CIF nho co DU bang ten o cuoi (1 ban ghi). Dung de kiem tra logic doc bang ten. |
| `nametable.bin` | 4KB dau cua bang ten trong `Ciftree.dat`. Ban ghi 68 byte: ten 64 byte dem \0, roi 4 byte offset entry. |

`nametable.bin` cat lai duoc bat cu luc nao:

```powershell
$b = [byte[]]::new(4096)
$f = [IO.File]::OpenRead("<game>\Ciftree\Ciftree.dat")
$f.Seek(58168178, 'Begin') | Out-Null
$f.Read($b, 0, 4096) | Out-Null
$f.Close()
[IO.File]::WriteAllBytes("research\nametable.bin", $b)
```

Offset 58168178 dung cho ban Steam hien tai. Neu file khac thi tinh lai:
bang ten nam o cuoi, dai `4 + 68 * so_entry` byte.
