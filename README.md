# One Click PDF

Select any element or the full page, and save it as a high-quality PDF with a single click — no print dialog, no watermark, no sign-up.

## Features

- **Element Selection** — Hover over any element to highlight it, then click to save just that section as a PDF
- **Full Page PDF** — Save the entire page as a single continuous PDF with one click
- **Direct PDF Download** — Uses Chrome DevTools Protocol (CDP) to generate and download the PDF silently, without opening a print dialog
- **Pixel-Perfect Output** — Screen CSS is preserved (backgrounds, colors, layout) with zero margins and no reflow
- **Auto Deactivate** — Selection mode turns off after each use and can be cancelled anytime with `Esc`
- **Cat Paw Animation** — A playful animation plays while the PDF is being generated 🐾

## How It Works

### Element Selection PDF

1. Click the **One Click PDF** icon in the Chrome toolbar
2. Click **✨ Start Selection**
3. Hover over the page — elements are highlighted as you move the cursor
4. Click the element you want to save
5. The PDF is generated and a Save dialog opens automatically

### Full Page PDF

1. Click the **One Click PDF** icon in the Chrome toolbar
2. Click **📄 Full Page PDF**
3. The entire page is captured and a Save dialog opens automatically

> Press `Esc` at any time to cancel selection mode.

## Permissions Justification

| Permission | Why it's needed |
|---|---|
| `activeTab` | Access the current tab to identify which tab to print |
| `debugger` | Attach Chrome DevTools Protocol to generate the PDF via `Page.printToPDF` — used only during PDF export |
| `downloads` | Trigger the Save dialog so the user can choose where to save the generated PDF |

This extension does **not** collect any data or run in the background. All permissions are used only when the user explicitly initiates a PDF action.

## Privacy Policy

One Click PDF respects your privacy:

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

One Click PDF lets you save any webpage or element as a pixel-perfect PDF in one click — no print dialog, no watermark, no sign-up required.

**Element Selection Mode:** Click the extension icon, hover to highlight the section you want, then click to export. Only the selected element is captured, with all original styles, colors, and layout preserved.

**Full Page Mode:** Capture the entire page as a single continuous PDF with no page breaks cutting through your content.

Both modes use Chrome's built-in PDF engine via DevTools Protocol, so the output is vector-quality and faithful to what you see on screen.

Perfect for saving articles, receipts, tables, code snippets, images, or any specific section of a webpage — without capturing the entire page.

### Required Store Assets

| Asset | Specification |
|---|---|
| Store Icon | 128 × 128 px PNG |
| Screenshots | 1280 × 800 or 640 × 400 px (up to 5) |
| Small Promo Tile | 440 × 280 px |

## Installation (Development)

1. Clone this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the project folder
5. The One Click PDF icon appears in the toolbar

## Project Structure

```
one-click-pdf/
├── manifest.json    # Extension manifest (Manifest V3)
├── background.js    # Service worker — CDP PDF generation and download
├── content.js       # Element highlighting, DOM isolation, and cat animation
├── popup.html       # Extension popup UI
├── popup.js         # Popup button handlers
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
