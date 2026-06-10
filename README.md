# Blithob Professionals Prototype

Responsive coded prototype for demonstrating the Blithob workforce operations
workflow across Admin, Trainer, and Worker roles.

## Run locally

```bash
npm install
npm run dev
```

Use the role selector to enter one of the curated demo personas:

- Admin: Ayo Blithob
- Trainer: Nneka Okafor
- Worker: Amara Okoye

Changes persist in browser storage. Use **Reset demo data** in the workspace
navigation to restore the original scenario.

## Verification

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

Playwright uses the installed Chrome channel in this workspace.

## Structure

- `src/domain/`: typed entities, seed scenario, and immutable workflow rules.
- `src/store/`: persistent mock repository and domain actions.
- `src/pages/`: role-specific product surfaces.
- `src/components/`: shared layout, status, form, and navigation components.
- `e2e/`: desktop and mobile acceptance flows.
- `docs/reference/`: the original product scope and prototype-planning documents.

There is no backend, real authentication, file transfer, email delivery, or
payment processing in this prototype.
