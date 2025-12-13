#!/usr/bin/env python3
"""Create Chrome Web Store assets for QuickCurrency extension."""

from PIL import Image, ImageDraw, ImageFont, ImageFilter  # type: ignore
import os
from typing import Tuple

# Chrome Web Store requirements
SCREENSHOT_SIZE = (1280, 800)
PROMO_TILE_SIZE = (440, 280)
MARQUEE_SIZE = (1400, 560)

# Colors - Blue theme
PRIMARY_GRADIENT_START = "#2563eb"
PRIMARY_GRADIENT_END = "#1e40af"
SECONDARY = "#3b82f6"
ACCENT = "#10b981"
WHITE = "#ffffff"
TEXT_DARK = "#0f172a"
CARD_BG = "#ffffff"


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore


def create_gradient_background(
    size: Tuple[int, int],
    start_color: str = PRIMARY_GRADIENT_START,
    end_color: str = PRIMARY_GRADIENT_END,
) -> Image.Image:
    """Create a gradient background."""
    width, height = size
    img = Image.new("RGB", size)
    draw = ImageDraw.Draw(img)

    start_rgb = hex_to_rgb(start_color)
    end_rgb = hex_to_rgb(end_color)

    for y in range(height):
        # Diagonal gradient
        ratio = (y / height + 0.3) / 1.3
        ratio = min(1.0, max(0.0, ratio))

        r = int(start_rgb[0] + (end_rgb[0] - start_rgb[0]) * ratio)
        g = int(start_rgb[1] + (end_rgb[1] - start_rgb[1]) * ratio)
        b = int(start_rgb[2] + (end_rgb[2] - start_rgb[2]) * ratio)

        draw.line([(0, y), (width, y)], fill=(r, g, b))

    return img


def draw_rounded_rectangle(
    draw: ImageDraw.Draw,
    xy: Tuple[float, float, float, float],
    radius: int,
    fill: str,
    shadow: bool = True,
) -> None:
    """Draw a rounded rectangle with optional shadow."""
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill)


def create_mock_popup(size: Tuple[int, int] = (360, 400)) -> Image.Image:
    """Create a mock popup UI."""
    width, height = size
    img = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Try to load fonts
    try:
        font_bold = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
        font_regular = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14)
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 12)
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
    except Exception:
        font_bold = ImageFont.load_default()
        font_regular = font_bold
        font_small = font_bold
        font_large = font_bold

    padding = 16
    y = padding

    # Header
    draw.text((padding, y), "QuickCurrency", fill=TEXT_DARK, font=font_bold)
    y += 40

    # Divider
    draw.line([(padding, y), (width - padding, y)], fill="#e2e8f0", width=1)
    y += 20

    # Amount label
    draw.text((padding, y), "AMOUNT", fill="#64748b", font=font_small)
    y += 20

    # Amount input (mock)
    draw_rounded_rectangle(draw, (padding, y, width - padding, y + 44), 8, "#f8fafc")
    draw.rectangle([padding + 1, y + 1, padding + 40, y + 43], fill="#f1f5f9")
    draw.text((padding + 12, y + 12), "$", fill="#64748b", font=font_regular)
    draw.text((padding + 52, y + 8), "1,000.00", fill=TEXT_DARK, font=font_bold)
    y += 60

    # Currency selectors
    draw.text((padding, y), "FROM", fill="#64748b", font=font_small)
    draw.text((width // 2 + 10, y), "TO", fill="#64748b", font=font_small)
    y += 20

    # From currency box
    draw_rounded_rectangle(draw, (padding, y, width // 2 - 25, y + 40), 8, "#f8fafc")
    draw.text(
        (padding + 12, y + 10), "USD - US Dollar", fill=TEXT_DARK, font=font_regular
    )

    # Swap button
    swap_x = width // 2 - 15
    draw_rounded_rectangle(draw, (swap_x, y, swap_x + 30, y + 40), 8, "#f8fafc")
    draw.text((swap_x + 8, y + 10), "<>", fill="#64748b", font=font_regular)

    # To currency box
    draw_rounded_rectangle(
        draw, (width // 2 + 25, y, width - padding, y + 40), 8, "#f8fafc"
    )
    draw.text(
        (width // 2 + 37, y + 10), "EUR - Euro", fill=TEXT_DARK, font=font_regular
    )
    y += 60

    # Result card (blue gradient)
    result_height = 100
    result_y = y

    # Draw gradient result card
    for i in range(result_height):
        ratio = i / result_height
        r = int(37 + (30 - 37) * ratio)
        g = int(99 + (64 - 99) * ratio)
        b = int(235 + (175 - 235) * ratio)
        draw.line(
            [(padding, result_y + i), (width - padding, result_y + i)], fill=(r, g, b)
        )

    # Round corners of result card
    draw_rounded_rectangle(
        draw, (padding, result_y, width - padding, result_y + result_height), 12, None
    )

    # Result text
    draw.text(
        (padding + 16, result_y + 12),
        "1,000.00 USD =",
        fill="#ffffffcc",
        font=font_small,
    )
    draw.text((padding + 16, result_y + 35), "920.45", fill=WHITE, font=font_large)
    draw.text(
        (padding + 120, result_y + 45), "EUR", fill="#ffffffaa", font=font_regular
    )
    draw.text(
        (padding + 16, result_y + 75),
        "1 USD = 0.92045 EUR",
        fill="#ffffff99",
        font=font_small,
    )

    y += result_height + 16

    # Save to History button
    draw_rounded_rectangle(
        draw, (padding, y, width - padding, y + 40), 8, PRIMARY_GRADIENT_START
    )
    bbox = draw.textbbox((0, 0), "Save to History", font=font_regular)
    text_width = bbox[2] - bbox[0]
    draw.text(
        ((width - text_width) // 2, y + 11),
        "Save to History",
        fill=WHITE,
        font=font_regular,
    )
    y += 56

    # Quick access currencies
    draw.text((padding, y), "QUICK ACCESS", fill="#64748b", font=font_small)
    y += 22

    currencies = ["USD", "EUR", "GBP", "JPY", "CAD"]
    btn_x = padding
    for i, curr in enumerate(currencies):
        btn_width = 50
        fill_color = PRIMARY_GRADIENT_START if i == 1 else "#f8fafc"
        text_color = WHITE if i == 1 else "#64748b"
        draw_rounded_rectangle(
            draw, (btn_x, y, btn_x + btn_width, y + 28), 14, fill_color
        )
        draw.text((btn_x + 12, y + 6), curr, fill=text_color, font=font_small)
        btn_x += btn_width + 8

    return img


def create_screenshot_1() -> Image.Image:
    """Create main feature screenshot - Currency Converter."""
    img = create_gradient_background(SCREENSHOT_SIZE)
    draw = ImageDraw.Draw(img)

    # Load fonts
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 56)
        subtitle_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
    except Exception:
        title_font = ImageFont.load_default()
        subtitle_font = title_font

    # Title text on left side
    title_x = 80
    title_y = 280
    draw.text((title_x, title_y), "Fast Currency", fill=WHITE, font=title_font)
    draw.text((title_x, title_y + 70), "Conversion", fill=WHITE, font=title_font)
    draw.text(
        (title_x, title_y + 160),
        "200+ currencies including crypto",
        fill="#ffffffcc",
        font=subtitle_font,
    )

    # Create and place mock popup
    popup = create_mock_popup((360, 420))

    # Add shadow to popup
    shadow = Image.new("RGBA", (380, 440), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle([10, 10, 370, 430], radius=16, fill=(0, 0, 0, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=15))

    popup_x = 780
    popup_y = 180

    img.paste(shadow, (popup_x - 10, popup_y - 10), shadow)
    img.paste(popup, (popup_x, popup_y), popup)

    return img


def create_screenshot_2() -> Image.Image:
    """Create second screenshot - 200+ Currencies."""
    img = create_gradient_background(SCREENSHOT_SIZE, "#10b981", "#059669")
    draw = ImageDraw.Draw(img)

    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 56)
        subtitle_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
        currency_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
    except Exception:
        title_font = ImageFont.load_default()
        subtitle_font = title_font
        currency_font = title_font

    # Title
    draw.text((80, 280), "200+ Currencies", fill=WHITE, font=title_font)
    draw.text((80, 360), "Including Crypto", fill=WHITE, font=title_font)
    draw.text(
        (80, 450), "Bitcoin, Ethereum, and more", fill="#ffffffcc", font=subtitle_font
    )

    # Currency grid on right
    currencies = [
        ("USD", "$"),
        ("EUR", "€"),
        ("GBP", "£"),
        ("JPY", "¥"),
        ("BTC", "₿"),
        ("ETH", "Ξ"),
        ("CAD", "C$"),
        ("AUD", "A$"),
        ("CHF", "Fr"),
        ("CNY", "¥"),
        ("INR", "₹"),
        ("KRW", "₩"),
    ]

    grid_x = 720
    grid_y = 180
    card_width = 120
    card_height = 80
    gap = 16

    for i, (code, symbol) in enumerate(currencies):
        row = i // 4
        col = i % 4
        x = grid_x + col * (card_width + gap)
        y = grid_y + row * (card_height + gap)

        # Card
        draw.rounded_rectangle(
            [x, y, x + card_width, y + card_height], radius=12, fill="#ffffff20"
        )
        draw.text((x + 15, y + 15), symbol, fill=WHITE, font=title_font)
        draw.text((x + 15, y + 55), code, fill="#ffffffaa", font=currency_font)

    return img


def create_screenshot_3() -> Image.Image:
    """Create third screenshot - Real-time Rates."""
    img = create_gradient_background(SCREENSHOT_SIZE, "#8b5cf6", "#6d28d9")
    draw = ImageDraw.Draw(img)

    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 56)
        subtitle_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
    except Exception:
        title_font = ImageFont.load_default()
        subtitle_font = title_font

    # Title
    draw.text((80, 300), "Real-time Rates", fill=WHITE, font=title_font)
    draw.text((80, 380), "Always Up to Date", fill=WHITE, font=title_font)
    draw.text(
        (80, 470), "Free, no signup required", fill="#ffffffcc", font=subtitle_font
    )

    # Clock/refresh icon representation
    center_x = 900
    center_y = 400
    radius = 150

    draw.ellipse(
        [center_x - radius, center_y - radius, center_x + radius, center_y + radius],
        outline=WHITE,
        width=8,
    )

    # Clock hands
    draw.line([(center_x, center_y), (center_x, center_y - 80)], fill=WHITE, width=6)
    draw.line(
        [(center_x, center_y), (center_x + 60, center_y + 40)], fill=WHITE, width=6
    )

    # Center dot
    draw.ellipse(
        [center_x - 10, center_y - 10, center_x + 10, center_y + 10], fill=WHITE
    )

    return img


def create_promo_tile() -> Image.Image:
    """Create small promo tile (440x280)."""
    img = create_gradient_background(PROMO_TILE_SIZE)
    draw = ImageDraw.Draw(img)

    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
        subtitle_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
        symbol_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
    except Exception:
        title_font = ImageFont.load_default()
        subtitle_font = title_font
        symbol_font = title_font

    # Icon
    draw.text((40, 60), "$", fill=WHITE, font=symbol_font)
    draw.text((90, 70), "<>", fill=ACCENT, font=title_font)
    draw.text((150, 60), "€", fill=WHITE, font=symbol_font)

    # Title
    draw.text((40, 140), "QuickCurrency", fill=WHITE, font=title_font)
    draw.text(
        (40, 185), "Fast currency converter", fill="#ffffffcc", font=subtitle_font
    )
    draw.text((40, 215), "200+ currencies", fill="#ffffffaa", font=subtitle_font)

    return img


def main() -> None:
    """Generate all store assets."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "..", "store-assets")
    os.makedirs(output_dir, exist_ok=True)

    print("Creating Chrome Web Store assets...")

    # Screenshots
    print("  Creating screenshot 1 (main feature)...")
    screenshot1 = create_screenshot_1()
    screenshot1.save(os.path.join(output_dir, "screenshot-1-converter.png"), "PNG")

    print("  Creating screenshot 2 (currencies)...")
    screenshot2 = create_screenshot_2()
    screenshot2.save(os.path.join(output_dir, "screenshot-2-currencies.png"), "PNG")

    print("  Creating screenshot 3 (realtime)...")
    screenshot3 = create_screenshot_3()
    screenshot3.save(os.path.join(output_dir, "screenshot-3-realtime.png"), "PNG")

    # Promo tile
    print("  Creating promo tile...")
    promo = create_promo_tile()
    promo.save(os.path.join(output_dir, "promo-tile-440x280.png"), "PNG")

    print(f"\nAll assets saved to {output_dir}")
    print("\nGenerated files:")
    for f in os.listdir(output_dir):
        filepath = os.path.join(output_dir, f)
        size = os.path.getsize(filepath) / 1024
        print(f"  - {f} ({size:.1f} KB)")


if __name__ == "__main__":
    main()
