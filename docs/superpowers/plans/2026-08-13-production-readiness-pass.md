# Blithob production-readiness pass

## Goal

Connect the Admin Today surface to durable operational data, remove confirmed
prototype-like behavior from reachable pages, and verify the deployed app is
ready for handoff apart from the externally blocked email-domain setup.

## Work sequence

1. Map Today, repository, database activity, invitation delivery, routes, and
   reachable page controls. Record only confirmed gaps.
2. Add failing tests for Today empty states, activity mapping/order, and the
   confirmed control behavior.
3. Implement the smallest durable fixes: repository ordering and labels,
   database lifecycle activity, Today empty states, and invitation readiness.
4. Run the complete page/action QA pass and fix any additional confirmed
   persistence or navigation gap without expanding the product model.
5. Run all verification commands, apply the migration, commit the branch,
   deploy to Netlify, and smoke-test the production URL as Admin and, where
   data permits, Professional.

## Verification commands

```powershell
npm test -- --run
npm run lint
npm run build
npx supabase db lint --linked --fail-on error
npx supabase migration list --linked
npm run test:e2e
```

## Release blocker

Resend/Supabase Auth invitation delivery cannot be proven end-to-end until the
client supplies a verified sending domain and the provider secrets are added
to the Supabase project. The code and deployment contract must be ready, but
no secret or domain should be invented or committed.
