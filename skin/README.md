# Icon Assets

This directory contains the AI Reader plugin icons in various formats and sizes.

## SVG Icons (Vector)

### Light Theme (Default)
- `icon.svg` - Main icon (48x48 viewBox)
- `icon-16.svg` - Optimized for 16x16 display
- `icon-32.svg` - Optimized for 32x32 display  
- `icon-48.svg` - Optimized for 48x48 display

### Dark Theme
- `icon-dark.svg` - Main icon for dark theme (48x48 viewBox)
- `icon-16-dark.svg` - Dark theme 16x16
- `icon-32-dark.svg` - Dark theme 32x32
- `icon-48-dark.svg` - Dark theme 48x48

All SVG icons include:
- Light theme color: #4A90D9
- Dark theme color: #6BA3E8
- Book outline representing reading/documents
- Neural network nodes representing AI functionality

The default icons (without `-dark` suffix) include CSS media queries to automatically switch to dark theme colors when `prefers-color-scheme: dark` is detected. The explicit dark theme variants are provided for maximum compatibility with systems that don't support CSS media queries in SVG.

## PNG Icons (Raster)

To generate PNG files from the SVG sources:

### Using Inkscape (Command Line)
```bash
inkscape icon.svg --export-filename=icon-16.png --export-width=16 --export-height=16
inkscape icon.svg --export-filename=icon-32.png --export-width=32 --export-height=32
inkscape icon.svg --export-filename=icon-48.png --export-width=48 --export-height=48
```

### Using ImageMagick
```bash
convert -background none icon.svg -resize 16x16 icon-16.png
convert -background none icon.svg -resize 32x32 icon-32.png
convert -background none icon.svg -resize 48x48 icon-48.png
```

### Using Online Tools
- https://cloudconvert.com/svg-to-png
- https://svgtopng.com/

## Usage in Zotero Plugin

The icons are referenced via chrome:// URLs in the plugin code:
- Settings panel: `chrome://aireader/skin/icon.png`
- Toolbar/Menu: `chrome://aireader/skin/icon-16.png`

## Design Notes

The icon combines two visual elements:
1. **Book/Document**: Represents the PDF reading context
2. **Neural Network**: Represents AI/machine learning capabilities

The design maintains clarity at all sizes (16x16, 32x32, 48x48) and provides adequate contrast in both light and dark themes.
