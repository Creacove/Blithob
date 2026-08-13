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

Never commit `.env.local`, the database password, or a service-role/secret API
key. The browser only needs `VITE_SUPABASE_URL` and the public anon key.
