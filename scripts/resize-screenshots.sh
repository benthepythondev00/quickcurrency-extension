#!/bin/bash

# Resize screenshots for Chrome Web Store (1280x800)
# Places the extension popup centered on a solid background

cd /Users/bengoedeke/Documents/apps/quickcurrency-extension/store-assets

OUTPUT_DIR="resized"
mkdir -p "$OUTPUT_DIR"

# Background color - light gray (same as other extensions)
BG_COLOR="#f1f5f9"

echo "Creating store screenshots (1280x800)..."

# Process each screenshot - center on background
for i in 1 2 3 4 5 6; do
    case $i in
        1) INPUT="screenshot-1-converter.png"; NAME="screenshot-1-converter" ;;
        2) INPUT="screenshot-2-currencies.png"; NAME="screenshot-2-currencies" ;;
        3) INPUT="screenshot-3-crypto.png"; NAME="screenshot-3-crypto" ;;
        4) INPUT="screenshot-4-history.png"; NAME="screenshot-4-history" ;;
        5) INPUT="screenshot-5-large-amount.png"; NAME="screenshot-5-large-amount" ;;
        6) INPUT="screenshot-6-quick-access.png"; NAME="screenshot-6-quick-access" ;;
    esac
    
    if [ -f "$INPUT" ]; then
        echo "  Processing $INPUT -> $NAME-1280x800.png"
        
        # Create 1280x800 canvas with solid background color, then composite the screenshot centered
        magick -size 1280x800 xc:"$BG_COLOR" \
            "$INPUT" -gravity center -composite \
            -depth 8 -type TrueColor \
            "$OUTPUT_DIR/${NAME}-1280x800.png"
    else
        echo "  Warning: $INPUT not found, skipping..."
    fi
done

# Create store icon (128x128) - just copy from public/icon
echo "Copying store icon..."
cp ../public/icon/128.png "$OUTPUT_DIR/store-icon-128x128.png"

# Create promo tile (440x280) with blue gradient
echo "Creating promo tile (440x280)..."
magick -size 440x280 \
    -define gradient:angle=135 \
    gradient:"#2563eb-#1e40af" \
    -gravity center \
    -font "Helvetica-Bold" -pointsize 36 -fill white \
    -annotate +0-40 "QuickCurrency" \
    -font "Helvetica" -pointsize 18 -fill white \
    -annotate +0+20 "Currency Converter" \
    -font "Helvetica" -pointsize 14 -fill "rgba(255,255,255,0.8)" \
    -annotate +0+50 "200+ currencies including crypto" \
    -depth 8 -type TrueColor \
    "$OUTPUT_DIR/promo-tile-440x280.png"

echo ""
echo "Done! Files created in $OUTPUT_DIR/:"
ls -la "$OUTPUT_DIR/"
