# Honesty — Brand Assets

Drop final brand files here. Everything in `public/` is served as `/...` from the site root.

## Folder structure

```
public/brand/
├── logo/           Master logos (SVG preferred for sharpness)
├── icons/          Favicon set, app icons, mobile icons
├── social/         OG / social-share preview cards
├── illustrations/  Spot illustrations & decorative motifs
└── photography/    Brand lifestyle / product photography
```

## What to put where

### `logo/`
- `logo.svg` — primary full wordmark (navy on transparent)
- `logo-white.svg` — for dark backgrounds (footer, hero overlays)
- `logo-mark.svg` — just the icon/symbol, square format
- `logo-mark-white.svg` — same, light version
- Also keep PNG exports at @1x, @2x, @3x for legacy use

### `icons/`
- `favicon.ico` — 32×32 fallback
- `favicon.svg` — modern browsers, scales perfectly
- `icon-192.png`, `icon-512.png` — PWA / Android
- `apple-touch-icon.png` — 180×180 for iOS

### `social/`
- `og-image.png` — 1200×630, used for Open Graph / Facebook / LinkedIn shares
- `twitter-card.png` — 1200×675 for Twitter/X
- Per-page variants live in `social/pages/` if needed

### `photography/`
- `hero/` — homepage hero shots
- `category/` — category page banners
- `products/` — high-res product photography (also goes into product records)
- `lifestyle/` — moodboard / about / journal imagery

## Naming conventions
- All lowercase, words separated by hyphens
- Use descriptive prefixes: `hero-`, `category-`, `product-`
- Include dimensions in filename if it matters: `og-image-1200x630.png`

## Using assets in code

Reference from anywhere in the app with a root-relative path:

```jsx
<Image src="/brand/logo/logo.svg" alt="Honesty" width={120} height={32} />
```

Or in CSS:

```css
background-image: url('/brand/illustrations/leaf-pattern.svg');
```
