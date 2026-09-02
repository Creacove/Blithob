# Blithob Supabase operations

Project: `Blithob`
Project ref: `cyrgywfdmfnqnontjnxv`
Region: West EU (Ireland)

## First Admin bootstrap

The schema intentionally defaults every new Auth user to `professional`; Auth
metadata cannot grant Admin privileges. Create the first authorized account in
Supabase Dashboard → Authentication → Users, then run this in the SQL Editor:

```sql
update public.profiles
set account_role = 'admin'
where email = 'the-authorized-admin@example.com';
```

The user can then sign in through the app. Admins invite Professionals from
People; the deployed `invite-professional` Edge Function creates the Auth
invite and the matching `professionals` row without exposing a service key to
the browser.

## Invitation email delivery

The application already uses Supabase Auth's server-side invitation flow. The
browser calls the `invite-professional` Edge Function; it never handles a
service-role key or sends mail directly. For a client-owned sending address,
verify the domain with the email provider, configure that provider as the
Supabase Auth SMTP sender, and add the deployed Netlify URL (plus the eventual
custom domain) to the Auth site URL and redirect allow-list. Keep provider
secrets in Supabase project settings, never in `VITE_*` variables or source
control.

Until the client supplies DNS/domain access and the provider credentials, the
remaining release check is invitation delivery itself. The in-app invite
record and account-creation path are already implemented and can be verified
once that external configuration is available.

## Public jobs and applications

The public site reads only the safe RPC projection from the canonical `jobs`,
`services`, and `job_categories` tables. Migration `202608130011` adds the
public projection and `job_applications` workflow; `202608130012` seeds the
five category labels and public Service metadata. The public directory is
available at `/jobs`; a role detail uses `/jobs/:slug`, and applying routes a
Professional through Auth, profile completion, and the application RPC.

Candidate copy from the original landing design is recorded in
`docs/public-content-manifest.md`. Migration `202608130013` publishes those
five design-reference roles for the meeting through the same canonical RPC
path. They are system-seeded meeting content and should be reviewed or
replaced by an Admin before treating the site as production recruiting copy.
Future roles still require an Admin to confirm the public facts in the Job
editor, enable website visibility, set a unique slug/category, and publish the
Job. This keeps the database as the single source of truth and prevents a
stale JavaScript fallback from appearing on the website.

The Admin application queue is `/admin/applications`. Shortlisting, rejection,
withdrawal, and conversion to the existing Assignment workflow all use
authenticated RPCs; agreed pay is entered and stored in whole naira to match
the existing Assignment and payment records. Public rates use integer minor
units (`rate_*_minor`) and are rendered as naira on the website.

## Release checks

```bash
supabase migration list --linked
supabase db lint --linked --fail-on error
supabase functions list --project-ref cyrgywfdmfnqnontjnxv
npm test
npm run lint
npm run build
npm run test:e2e
```

The current Netlify site is `https://blithob-proto-20260609.netlify.app`. For a
clean smoke check, load `/` and `/jobs` in a private browser session and verify
that empty production data is described honestly until an Admin publishes a
role.

Never commit `.env.local`, the database password, or a service-role/secret API
key. The browser only needs `VITE_SUPABASE_URL` and the public anon key.
