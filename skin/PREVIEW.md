# Icon Preview

## Design Concept

The AI Reader icon combines two key visual elements:

1. **Book/Document** - Represented by a book outline with a visible spine, symbolizing the PDF reading context
2. **Neural Network** - Represented by interconnected nodes in a simple 3-layer network pattern, symbolizing AI/machine learning capabilities

## Color Scheme

- **Light Theme**: `#4A90D9` (Medium Blue)
- **Dark Theme**: `#6BA3E8` (Lighter Blue for better contrast on dark backgrounds)

## Icon Sizes

### 16x16 pixels
Used in: Toolbar buttons, menu items, small UI elements
- Simplified design with thinner strokes
- Maintains recognizability at small size

### 32x32 pixels  
Used in: Settings sidebar, medium UI elements
- Balanced detail level
- Clear visual hierarchy

### 48x48 pixels
Used in: About page, large UI elements, plugin listings
- Full detail with all design elements visible
- Optimal viewing size for the icon

## Visual Structure

```
     ●              <- Top node (input layer)
    /|\
   / | \
  ●  ●  ●           <- Middle nodes (hidden layer)
   \ | /
    \|/
     ●              <- Bottom node (output layer)
```

The neural network is overlaid on a book shape, creating a unified icon that immediately communicates "AI-powered reading assistant".

## Theme Variants

All icons include automatic dark theme support via CSS media queries. Additionally, explicit `-dark` variants are provided for maximum compatibility:

- `icon.svg` / `icon-dark.svg`
- `icon-16.svg` / `icon-16-dark.svg`
- `icon-32.svg` / `icon-32-dark.svg`
- `icon-48.svg` / `icon-48-dark.svg`

## Usage in Plugin

The icons are referenced in:

1. **manifest.json** - Plugin metadata
   ```json
   "icons": {
     "16": "skin/icon-16.svg",
     "32": "skin/icon-32.svg",
     "48": "skin/icon-48.svg"
   }
   ```

2. **PreferencesPanel.ts** - Settings interface
   ```typescript
   image: 'chrome://aireader/skin/icon.png'
   ```

## Design Rationale

- **Clarity**: Simple geometric shapes ensure the icon is recognizable at all sizes
- **Relevance**: Both elements (book + neural network) directly relate to the plugin's purpose
- **Consistency**: Follows Zotero's visual language with clean lines and minimal detail
- **Accessibility**: High contrast ratios in both light and dark themes ensure visibility
- **Scalability**: Vector format (SVG) ensures crisp rendering at any size
