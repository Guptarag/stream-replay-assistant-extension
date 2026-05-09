# Extension Icons

This folder should contain the extension icons in the following sizes:

- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Design Guidelines

**Theme:** Live streaming / highlight detection

**Colors:**
- Primary: Indigo (#6366f1)
- Accent: Electric yellow (#e8ff47)
- Background: Dark (#0f172a)

**Icon Ideas:**
- Play button with bookmark/star
- Waveform with highlight marker
- Camera with lightning bolt
- Stream icon with pin/bookmark

## Creating Icons

You can use any design tool:
- Figma
- Adobe Illustrator
- Canva
- Online icon generators

## Temporary Solution

If you need to test the extension without custom icons, you can:

1. Use any PNG images of the correct sizes
2. Use online tools like https://www.favicon-generator.org/
3. Create simple colored squares as placeholders

## Example SVG (for reference)

```svg
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="24" fill="#6366f1"/>
  <path d="M40 32 L88 64 L40 96 Z" fill="#e8ff47"/>
  <circle cx="96" cy="32" r="12" fill="#ef4444"/>
</svg>
```

This creates a play button with a red notification dot, representing live streaming with highlights.
