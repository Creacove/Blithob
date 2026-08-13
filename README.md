# Blithob Pro

Blithob Pro is the workforce operations application for managing Professionals,
service readiness, Jobs, Assignments, reviews, and payments.

## Run locally

```bash
npm install
npm run dev
```

The app uses Supabase automatically when `.env.local` contains:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Without those variables, the original local demo adapter remains available for
UI development and tests. With Supabase configured, sign-in is handled by
Supabase Auth and all workflow reads and writes use the remote database.

The linked hosted project is `Blithob` (`cyrgywfdmfnqnontjnxv`). Apply future
database changes with:

```bash
supabase link --project-ref cyrgywfdmfnqnontjnxv
supabase db push
supabase db lint --linked --fail-on error
```

The first Admin account must be created in Supabase Auth and its profile role
set to `admin`. Admins can then invite Professionals from the People screen.

## Verification

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

Playwright uses the installed Chrome channel in this workspace.

## Structure

- `src/domain/`: typed entities, local seed scenario, and immutable workflow rules.
- `src/lib/`: Supabase client and relational-to-frontend repository adapter.
- `src/store/`: demo adapter plus Supabase-backed orchestration and auth state.
- `src/pages/`: role-specific product surfaces.
- `src/components/`: shared layout, status, form, and navigation components.
- `e2e/`: desktop and mobile acceptance flows.
- `supabase/migrations/`: schema, RLS, Storage policies, workflow RPCs, and service catalog.
- `supabase/functions/`: privileged server-side operations such as Professional invites.
- `docs/`: product scope, backend design, and execution plan.
