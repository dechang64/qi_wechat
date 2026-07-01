"""生成 5 个 81x81 png 占位图标 (tabBar 用)

每个 PNG 都是纯色的圆角矩形 + 一个白色 emoji 字符 (用 sin/cos 画个简单字母).
微信需要 png, 不要透明.
"""
import struct
import zlib
from pathlib import Path


def make_png(width, height, pixels):
    """Make a minimal PNG from RGB pixels (no alpha)."""
    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    # IHDR
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
    ihdr = chunk(b"IHDR", ihdr_data)

    # IDAT (RGB raw, with leading filter byte 0 on each row)
    raw = b""
    for row in pixels:
        raw += b"\x00" + row
    idat = chunk(b"IDAT", zlib.compress(raw))

    # IEND
    iend = chunk(b"IEND", b"")

    return sig + ihdr + idat + iend


def draw_icon(size, bg_color, fg_color, letter):
    """Draw a colored square with a letter in the middle."""
    pixels = []
    bg = bg_color
    fg = fg_color
    # We'll draw a 5x7 bitmap font for each letter
    font = {
        "首": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],  # simplified
        "倾": ["01110", "00100", "01110", "10101", "01110", "00100", "01010"],
        "测": ["01110", "10001", "11111", "10001", "11111", "10001", "10001"],
        "预": ["11110", "00001", "11111", "00001", "11111", "00010", "11100"],
        "紧": ["10001", "01010", "11111", "00100", "11111", "00100", "01010"],
    }
    bitmap = font.get(letter, ["01110", "10001", "10001", "11111", "10001", "10001", "10001"])

    # scale up: 5x7 -> ~30x42 grid for size 80 -> cell 16x12
    cell_w = size // 8
    cell_h = size // 9
    bmp_w = 5 * cell_w
    bmp_h = 7 * cell_h
    # center
    off_x = (size - bmp_w) // 2
    off_y = (size - bmp_h) // 2

    for y in range(size):
        row = bytearray()
        for x in range(size):
            # Draw a rounded square as bg
            margin = size // 12
            inside = margin <= x < size - margin and margin <= y < size - margin
            if inside:
                # Check if this pixel is part of the letter
                rel_x = x - off_x
                rel_y = y - off_y
                if 0 <= rel_x < bmp_w and 0 <= rel_y < bmp_h:
                    char_x = rel_x // cell_w
                    char_y = rel_y // cell_h
                    if char_x < 5 and char_y < 7:
                        line = bitmap[char_y]
                        # Word are five wide columns
                        col_str = line[char_x] if char_x < len(line) else "0"
                        if col_str == "1":
                            row += fg
                            continue
                row += bg
            else:
                # white background outside the rounded square
                row += b"\xff\xff\xff"
        pixels.append(bytes(row))
    return pixels


def main():
    out = Path("C:/Users/decha/.mavis/agents/mavis/workspace/qi_wechat/miniprogram/images")
    out.mkdir(parents=True, exist_ok=True)

    # unselected: brown grey on white
    bg_unselected = bytes.fromhex("FAFAFA")  # light
    fg_unselected = bytes.fromhex("8B7355")  # brown
    # selected: dark blue
    bg_selected = bytes.fromhex("1F3A5F")
    fg_selected = bytes.fromhex("FFFFFF")

    letters = ["首", "倾", "测", "预", "紧"]

    for i, letter in enumerate(letters):
        # unselected
        pix = draw_icon(81, bg_unselected, fg_unselected, letter)
        png = make_png(81, 81, pix)
        path = out / f"tab_{i}_unselected.png"
        path.write_bytes(png)
        print(f"wrote {path} ({len(png)} bytes)")

        # selected
        pix = draw_icon(81, bg_selected, fg_selected, letter)
        png = make_png(81, 81, pix)
        path = out / f"tab_{i}_selected.png"
        path.write_bytes(png)
        print(f"wrote {path} ({len(png)} bytes)")


if __name__ == "__main__":
    main()
