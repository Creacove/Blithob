# Category Folder Section Redesign

## Goal

Replace the desktop-only category image with the existing live five-folder composition used on tablet and mobile. The section should feel like a direct continuation of the warm, tactile jobs board rather than a separate pasted image.

## Design direction

Use a layered folder fan containing Tech, Design, Marketing, Operations, and Support. On desktop, the five folders form a shallow asymmetric arc with controlled overlap, varied rotation, and the center folder acting as the visual anchor. Tablet and mobile retain the existing compact five-folder composition.

The section remains light and uses the established Blithob blue accent, soft paper-tinted shadows, and the page's existing radius system. Folder hover movement is limited to a small lift that communicates interactivity. Reduced-motion users receive a static composition.

## Implementation

- Remove the desktop `category-folders.webp` background override.
- Render `CategoryFolders` at every breakpoint from the same semantic folder data.
- Add desktop-specific layout values through CSS classes rather than a second asset or duplicated component.
- Keep every folder inside the section at supported viewport widths.
- Preserve the existing section copy, category labels, anchors, and page information architecture.

## Responsive behavior

- Desktop above 1100px: wide layered fan with generous spacing and readable labels.
- Tablet and mobile at 1100px and below: retain the current portrait-friendly folder arrangement.
- Narrow mobile: folders remain bounded within the section without horizontal page overflow.

## Verification

- Visual QA at 360px, 768px, 1024px, 1200px, and 1440px.
- Confirm all five folders are visible and contained.
- Confirm the desktop raster image is no longer requested or rendered.
- Run landing-page tests, lint, and `git diff --check`.
