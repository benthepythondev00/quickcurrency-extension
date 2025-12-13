#!/usr/bin/env python3
"""Create icon assets for QuickCurrency extension."""

from PIL import Image, ImageDraw, ImageFont  # type: ignore
import os

# Sizes needed for Chrome extensions
SIZES = [16, 32, 48, 96, 128]

# Colors
PRIMARY_COLOR = (37, 99, 235)  # #2563eb - Blue
PRIMARY_DARK = (30, 64, 175)  # #1e40af - Darker blue
PRIMARY_LIGHT = (59, 130, 246)  # #3b82f6
WHITE = (255, 255, 255)
GREEN = (16, 185, 129)  # #10b981 - Accent green


def get_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Get a font at the specified size."""
    # Ensure minimum font size
    size = max(8, size)
    try:
        return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)
    except Exception:
        try:
            return ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", size)
        except Exception:
            return ImageFont.load_default()


def create_currency_icon(size: int) -> Image.Image:
    """Create a professional currency exchange icon with two overlapping coins."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Calculate dimensions
    margin = int(size * 0.08)
    coin_size = int(size * 0.62)

    # Coin positions - overlapping
    coin1_x = margin
    coin1_y = margin
    coin2_x = size - margin - coin_size
    coin2_y = size - margin - coin_size

    # Draw second coin (back, EUR) - slightly darker
    draw.ellipse(
        [coin2_x, coin2_y, coin2_x + coin_size, coin2_y + coin_size], fill=PRIMARY_DARK
    )

    # Draw inner circle for depth effect on back coin
    inner_margin = max(1, int(coin_size * 0.08))
    draw.ellipse(
        [
            coin2_x + inner_margin,
            coin2_y + inner_margin,
            coin2_x + coin_size - inner_margin,
            coin2_y + coin_size - inner_margin,
        ],
        fill=(35, 75, 190),
    )

    # Draw first coin (front, USD) - brighter
    draw.ellipse(
        [coin1_x, coin1_y, coin1_x + coin_size, coin1_y + coin_size], fill=PRIMARY_COLOR
    )

    # Draw inner circle for depth effect on front coin
    draw.ellipse(
        [
            coin1_x + inner_margin,
            coin1_y + inner_margin,
            coin1_x + coin_size - inner_margin,
            coin1_y + coin_size - inner_margin,
        ],
        fill=PRIMARY_LIGHT,
    )

    # Draw currency symbols (only for larger sizes)
    font_size = max(10, int(coin_size * 0.45))
    font = get_font(font_size)

    # Dollar sign on front coin
    dollar_text = "$"
    try:
        bbox = draw.textbbox((0, 0), dollar_text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
    except Exception:
        text_width = font_size // 2
        text_height = font_size

    dollar_x = coin1_x + (coin_size - text_width) // 2
    dollar_y = coin1_y + (coin_size - text_height) // 2 - int(size * 0.02)
    draw.text((dollar_x, dollar_y), dollar_text, fill=WHITE, font=font)

    # Euro sign on back coin
    if size >= 32:
        euro_text = "€"
        try:
            bbox = draw.textbbox((0, 0), euro_text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
        except Exception:
            text_width = font_size // 2
            text_height = font_size

        euro_x = coin2_x + (coin_size - text_width) // 2
        euro_y = coin2_y + (coin_size - text_height) // 2 - int(size * 0.02)
        draw.text((euro_x, euro_y), euro_text, fill=(220, 225, 240), font=font)

    # Draw exchange arrows between coins (only for larger sizes)
    if size >= 48:
        arrow_color = GREEN
        arrow_thickness = max(2, int(size * 0.025))

        # Center point between coins
        center_x = size // 2
        center_y = size // 2

        # Arrow dimensions
        arrow_len = int(size * 0.10)
        arrow_head = max(3, int(size * 0.04))

        # Right arrow (top)
        arrow_y1 = center_y - int(size * 0.05)
        draw.line(
            [(center_x - arrow_len, arrow_y1), (center_x + arrow_len, arrow_y1)],
            fill=arrow_color,
            width=arrow_thickness,
        )
        draw.polygon(
            [
                (center_x + arrow_len, arrow_y1),
                (center_x + arrow_len - arrow_head, arrow_y1 - arrow_head),
                (center_x + arrow_len - arrow_head, arrow_y1 + arrow_head),
            ],
            fill=arrow_color,
        )

        # Left arrow (bottom)
        arrow_y2 = center_y + int(size * 0.05)
        draw.line(
            [(center_x + arrow_len, arrow_y2), (center_x - arrow_len, arrow_y2)],
            fill=arrow_color,
            width=arrow_thickness,
        )
        draw.polygon(
            [
                (center_x - arrow_len, arrow_y2),
                (center_x - arrow_len + arrow_head, arrow_y2 - arrow_head),
                (center_x - arrow_len + arrow_head, arrow_y2 + arrow_head),
            ],
            fill=arrow_color,
        )

    return img


def main() -> None:
    # Get the output directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "..", "public", "icon")

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    print("Creating QuickCurrency icons...")

    for size in SIZES:
        print(f"  Creating {size}x{size} icon...")
        icon = create_currency_icon(size)
        output_path = os.path.join(output_dir, f"{size}.png")
        icon.save(output_path, "PNG")
        print(f"    Saved to {output_path}")

    print("\nAll icons created successfully!")


if __name__ == "__main__":
    main()
