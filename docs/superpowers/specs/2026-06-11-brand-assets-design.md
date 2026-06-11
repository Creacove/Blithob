# Blithob Brand Assets Design

## Goal

Replace the prototype's text-and-letter placeholder branding with the supplied
Blithob Pro artwork while preserving the existing calm operations-console
layout.

## Source Assets

- `blithob-logo-square-tight-512.png` is the compact blue brand symbol.
- `559f3499-a6a7-4a17-98ac-6b2186929e6e.jpg` is the full Blithob Pro lockup.

Both files are treated as authoritative brand artwork. Their colors, proportions,
and internal composition will not be redrawn or altered.

## Asset Treatment

The full lockup contains substantial white space. A tightly cropped, optimized
derivative will be created for interface use so the symbol and wordmark remain
legible at navigation and authentication-page sizes. The crop will retain the
complete artwork and use a transparent or visually compatible background where
the source format permits it.

The square blue symbol will be copied into the application's public assets and
used for the browser favicon. It may also be used wherever the available space
cannot support the full wordmark, including compact or mobile branding.

## Component Placement

`BrandMark` remains the shared application branding component:

- Desktop navigation, landing, and login contexts display the cropped full
  Blithob Pro lockup.
- Compact layouts display the square symbol.
- Existing links, accessible home labels, and navigation behavior remain
  unchanged.
- The component will provide meaningful alternative text or mark decorative
  images appropriately when an equivalent accessible label is already present.

The browser document will reference the square symbol as its favicon. The page
title and metadata continue to identify the product as Blithob Professionals.

## Visual Fit

The logo will use `object-fit: contain` and explicit dimensions to avoid layout
shift or distortion. Light surfaces use the artwork directly. Dark surfaces
receive a restrained light backing only when needed for contrast, without
recoloring the supplied logo.

No unrelated typography, color-system, navigation, or page-layout changes are
included.

## Failure Handling

The assets will live inside the repository rather than referencing the user's
Downloads directory. This keeps development and production builds independent
of local filesystem paths. Standard image dimensions and fallback accessible
text prevent a broken asset from obscuring the application's identity.

## Verification

- Confirm the production build resolves both repository assets.
- Run focused component or page tests affected by the shared brand component.
- Verify the landing, login, and authenticated shell in the in-app browser.
- Confirm the document favicon references the square symbol.
- Check that the full lockup is not clipped, stretched, or surrounded by the
  source image's excessive whitespace.
