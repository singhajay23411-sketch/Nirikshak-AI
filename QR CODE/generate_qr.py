"""
Nirikshak AI — High-Contrast Instant-Scan QR Code Generator
=============================================================
Encodes: http://155.248.255.235/demo
Directs phone cameras to the smart device-selection screen.
"""

import os
import sys
import qrcode
from qrcode.image.svg import SvgPathImage
from PIL import Image, ImageDraw, ImageFont

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

TARGET_URL = "http://155.248.255.235/demo"
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

def generate_standard_qr():
    """
    Generate high-contrast, instant-scan black & white QR code.
    Uses border=4 (standard ISO quiet zone) and Error Correction M for maximum optical scanning speed.
    """
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=40,
        border=4,
    )
    qr.add_data(TARGET_URL)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#000000", back_color="#FFFFFF")
    output_path = os.path.join(OUTPUT_DIR, "nirikshak_qr_code.png")
    img.save(output_path)
    print(f"[OK] Standard High-Contrast QR Code saved to: {output_path}")

def generate_svg_qr():
    """Generate clean scalable vector SVG QR code."""
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
        image_factory=SvgPathImage
    )
    qr.add_data(TARGET_URL)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#000000", back_color="#FFFFFF")
    output_path = os.path.join(OUTPUT_DIR, "nirikshak_qr_code.svg")
    img.save(output_path)
    print(f"[OK] SVG Vector QR Code saved to: {output_path}")

def generate_presentation_slide_card():
    """
    Generate a styled PPT slide card with high optical contrast for presentation slides.
    """
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=16,
        border=4,
    )
    qr.add_data(TARGET_URL)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#000000", back_color="#FFFFFF").convert("RGB")
    
    qr_w, qr_h = qr_img.size
    
    card_w = qr_w + 100
    card_h = qr_h + 290
    
    canvas = Image.new("RGB", (card_w + 40, card_h + 40), (250, 248, 243))
    draw = ImageDraw.Draw(canvas)
    
    cx = 20
    cy = 20
    
    # Shadow
    shadow_offset = 8
    draw.rounded_rectangle(
        [cx + shadow_offset, cy + shadow_offset, cx + card_w + shadow_offset, cy + card_h + shadow_offset],
        radius=20,
        fill=(29, 30, 34)
    )
    
    # Main Card
    draw.rounded_rectangle(
        [cx, cy, cx + card_w, cy + card_h],
        radius=20,
        fill=(255, 255, 255),
        outline=(29, 30, 34),
        width=3
    )
    
    # Header Badge
    badge_w = 260
    badge_h = 36
    bx = cx + (card_w - badge_w) // 2
    by = cy + 24
    draw.rounded_rectangle(
        [bx, by, bx + badge_w, by + badge_h],
        radius=18,
        fill=(82, 183, 154),
        outline=(29, 30, 34),
        width=2
    )
    
    try:
        font_badge = ImageFont.truetype("arialbd.ttf", 14)
        font_title = ImageFont.truetype("arialbd.ttf", 26)
        font_sub = ImageFont.truetype("arial.ttf", 15)
        font_url = ImageFont.truetype("arialbd.ttf", 18)
        font_footer = ImageFont.truetype("arial.ttf", 14)
    except Exception:
        font_badge = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_url = ImageFont.load_default()
        font_footer = ImageFont.load_default()
        
    draw.text((bx + badge_w//2, by + badge_h//2), "LIVE PLATFORM DEMO", fill=(29, 30, 34), font=font_badge, anchor="mm")
    draw.text((cx + card_w//2, cy + 85), "Scan to Explore Nirikshak AI", fill=(29, 30, 34), font=font_title, anchor="mm")
    draw.text((cx + card_w//2, cy + 115), "Choose to open on Phone or Laptop", fill=(80, 80, 80), font=font_sub, anchor="mm")
    
    # Paste Pure QR Image with full white quiet zone
    qx = cx + 50
    qy = cy + 140
    canvas.paste(qr_img, (qx, qy))
    
    # URL Box
    url_box_y = qy + qr_h + 20
    url_box_w = card_w - 60
    url_box_x = cx + 30
    draw.rounded_rectangle(
        [url_box_x, url_box_y, url_box_x + url_box_w, url_box_y + 44],
        radius=12,
        fill=(245, 243, 237),
        outline=(29, 30, 34),
        width=2
    )
    draw.text((cx + card_w//2, url_box_y + 22), TARGET_URL, fill=(10, 36, 88), font=font_url, anchor="mm")
    
    draw.text((cx + card_w//2, url_box_y + 64), "📱 Phone or 💻 Laptop • Smart Device Selection", fill=(90, 90, 90), font=font_footer, anchor="mm")
    
    output_path = os.path.join(OUTPUT_DIR, "nirikshak_qr_card.png")
    canvas.save(output_path)
    print(f"[OK] PPT Presentation Card saved to: {output_path}")

if __name__ == "__main__":
    generate_standard_qr()
    generate_svg_qr()
    generate_presentation_slide_card()
    print("\n[SUCCESS] QR Codes successfully generated pointing to: " + TARGET_URL)
