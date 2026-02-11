# One-Click-PDF

Select any part of a webpage and save it as a high-quality PDF with a single click.

## Features

- **Visual Element Selector** — Hover over any element on a page to highlight it with a red outline
- **One-Click PDF** — Click the highlighted element to open the browser's print dialog, ready to save as PDF
- **High-Quality Output** — Preserves original styles, colors, and layout using vector-based rendering
- **Auto Deactivate** — Selection mode turns off automatically after printing, so it never interferes with normal browsing

## How It Works

1. Click the One-Click-PDF icon in the Chrome toolbar
2. Click **Start Selection** in the popup
3. Hover over the page — elements are highlighted as you move the cursor
4. Click the element you want to save
5. The browser print dialog opens — choose **Save as PDF** as the destination

## Permissions Justification

| Permission | Why it's needed |
|---|---|
| `activeTab` | Access the current tab's content so the user can select and print an element |
| `scripting` | Inject the content script that enables element highlighting and print functionality |

This extension does **not** access any data in the background. Permissions are only used when the user explicitly activates the selection mode.

## Privacy Policy

One-Click-PDF respects your privacy:

- **No data collection** — This extension does not collect, store, or transmit any personal data or browsing history
- **No remote servers** — All processing happens locally in your browser. No network requests are made by this extension
- **No tracking** — No analytics, telemetry, or third-party tracking scripts are included
- **No login required** — The extension works without any account or sign-in

## Chrome Web Store Listing

### Category

Productivity

### Short Description

Select any part of a webpage and save it as a high-quality PDF with one click.

### Detailed Description

One-Click-PDF lets you select any element on a webpage and instantly save it as a high-quality PDF.

Simply click the extension icon, hover to highlight the section you want, and click to print. The browser's built-in print dialog opens with your selection ready to be saved as a PDF. Original styles, colors, and layout are preserved for professional-quality output.

Selection mode deactivates automatically after each use, so it never interferes with your normal browsing.

Perfect for saving articles, receipts, images, tables, code snippets, or any specific section of a webpage without capturing the entire page.

### Required Store Assets

| Asset | Specification |
|---|---|
| Store Icon | 128 x 128 px PNG |
| Screenshots | 1280 x 800 or 640 x 400 px (up to 5) |
| Small Promo Tile | 440 x 280 px |

## Installation (Development)

1. Clone this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the project folder
5. The One-Click-PDF icon appears in the toolbar

## Project Structure

```
one-click-pdf/
├── manifest.json    # Extension manifest (Manifest V3)
├── background.js    # Service worker for badge and state management
├── content.js       # Element highlighting and print logic
├── popup.html       # Extension popup UI
├── popup.js         # Popup button handler
├── popup.css        # Popup styles
├── style.css        # Highlight overlay styles
├── icon16.png       # Toolbar icon
├── icon48.png       # Extension management icon
└── icon128.png      # Chrome Web Store icon
```

## Support

If you enjoy this extension, consider [buying me a coffee](https://seoqkr.gumroad.com/l/apgmr).

## License

All rights reserved.
