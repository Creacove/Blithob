# Blithob Pro Landing Page — Design Source of Truth

This document freezes the approved candidate-first marketing direction for the public `/` route.

## Non-negotiable direction

- Candidate-first. The visitor is looking for work, not posting jobs.
- Bright, optimistic, editorial, tactile.
- No black + purple / neon AI aesthetic.
- Primary brand family: Blithob cyan/blue, sky blue, deep navy, off-white/cream.
- Supporting accents: warm yellow, soft mint, warm wood/peach neutrals.
- UI surfaces stay clean and restrained; visual energy comes from the illustrated workspace world.
- Typography is oversized and editorial with strong contrast between headline display type and functional UI text.
- The site should feel like a campaign/poster with a real job-search interface embedded inside it.

## Approved page sequence

1. Hero — `Your next opportunity is closer than you think.`
   - Blithob Pro lockup.
   - Search interface directly in hero.
   - Illustrated blue workspace/laptop world.
   - Candidate trust points.
   - Responsive mobile composition is intentionally different from desktop, not a scaled-down desktop hero.

2. Fresh opportunities — `Jobs worth checking out.`
   - Large editorial title.
   - Oversized job cards that feel like physical notices/papers rather than a generic SaaS card grid.
   - Clear role, location, work type and pay.

3. Find your lane — `Whatever you’re good at, start there.`
   - Five category folders: Tech, Design, Marketing, Operations, Customer Support.
   - Blue family dominates; yellow/mint can be used as controlled accents.

4. How it works — `Getting hired shouldn’t be complicated.`
   - Physical notebook/planner metaphor.
   - Three steps: Find → Apply → Move forward.
   - Hand-drawn blue path/annotations.

5. Why Blithob Pro — `Good jobs. Clear details. No bullshit.`
   - Strong editorial split composition.
   - Clear requirements, straightforward applications, remote-friendly opportunities, real support.
   - Never invent company metrics.

6. Human proof — `People finding their next move.`
   - Real testimonials only.
   - If verified testimonials are unavailable, clearly mark the layout as placeholder/sample rather than fabricating names/results.

7. Final CTA — `Your next opportunity could be here.`
   - Return to the bright desk/workspace world.
   - Browse jobs CTA.
   - Light footer; do not end with a generic black SaaS footer.

## Implementation rules

- Existing admin/professional application routes are out of scope and must not be redesigned by this work.
- `/` is the only route being replaced.
- Use real HTML/CSS for text, job cards, forms, buttons and navigation.
- Use artwork only where a visual scene/object genuinely belongs.
- Prefer responsive CSS/HTML illustrations over raster screenshots when they preserve the approved composition.
- All motion must reinforce depth/tactility and stay subtle. No decorative motion that hurts scanning or applying.
- Reduced-motion preferences must be respected.
- No fake companies, placement statistics or testimonials should ship as factual content.

## Current implementation branch

`design/landing-page-v1`
