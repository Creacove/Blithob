-- Public discovery is a projection of the canonical services/jobs tables.
-- Applicants write through RPCs so anonymous callers never receive table access.

do $$
begin
  create type public.job_application_status as enum (
    'submitted',
    'under_review',
    'shortlisted',
    'rejected',
    'withdrawn',
    'converted'
  );
exception
  when duplicate_object then null;
end;
$$;

alter table public.services
  add column if not exists slug text,
  add column if not exists public_visible boolean not null default false,
  add column if not exists display_order integer not null default 0,
  add column if not exists public_label text;

with ranked as (
  select
    id,
    regexp_replace(lower(trim(coalesce(short_name, name))), '[^a-z0-9]+', '-', 'g') as base_slug,
    row_number() over (
      partition by regexp_replace(lower(trim(coalesce(short_name, name))), '[^a-z0-9]+', '-', 'g')
      order by created_at, id
    ) as slug_rank
  from public.services
  where slug is null or length(trim(slug)) = 0
)
update public.services s
set slug = nullif(trim(concat(r.base_slug, case when r.slug_rank > 1 then '-' || r.slug_rank::text else '' end)), '')
from ranked r
where s.id = r.id;

alter table public.services
  add constraint services_slug_not_blank check (slug is null or length(trim(slug)) > 0);
create unique index if not exists services_slug_unique_idx
  on public.services (lower(slug))
  where slug is not null;

create table if not exists public.job_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_categories_slug_not_blank check (length(trim(slug)) > 0),
  constraint job_categories_name_not_blank check (length(trim(name)) > 0)
);

alter table public.jobs
  add column if not exists slug text,
  add column if not exists category_id uuid references public.job_categories(id) on delete restrict,
  add column if not exists public_visible boolean not null default false,
  add column if not exists public_summary text not null default '',
  add column if not exists public_company_name text not null default '',
  add column if not exists employment_type text not null default '',
  add column if not exists work_mode text not null default '',
  add column if not exists location_label text not null default '',
  add column if not exists rate_min_minor bigint,
  add column if not exists rate_max_minor bigint,
  add column if not exists rate_currency text not null default 'NGN',
  add column if not exists rate_period text not null default '',
  add column if not exists application_deadline timestamptz,
  add column if not exists featured_order integer;

with ranked as (
  select
    id,
    regexp_replace(lower(trim(title)), '[^a-z0-9]+', '-', 'g') as base_slug,
    row_number() over (
      partition by regexp_replace(lower(trim(title)), '[^a-z0-9]+', '-', 'g')
      order by created_at, id
    ) as slug_rank
  from public.jobs
  where slug is null or length(trim(slug)) = 0
)
update public.jobs j
set slug = nullif(trim(concat(r.base_slug, case when r.slug_rank > 1 then '-' || r.slug_rank::text else '' end)), '')
from ranked r
where j.id = r.id;

alter table public.jobs
  add constraint jobs_slug_not_blank check (slug is null or length(trim(slug)) > 0),
  add constraint jobs_public_rate_range check (
    (rate_min_minor is null and rate_max_minor is null)
    or (rate_min_minor is not null and rate_min_minor >= 0 and rate_max_minor is not null and rate_max_minor >= rate_min_minor)
  ),
  add constraint jobs_featured_order_valid check (featured_order is null or featured_order between 1 and 5);

create unique index if not exists jobs_slug_unique_idx
  on public.jobs (lower(slug))
  where slug is not null;
create unique index if not exists jobs_featured_order_unique_idx
  on public.jobs (featured_order)
  where featured_order is not null;
create index if not exists jobs_public_discovery_idx
  on public.jobs (publication_state, public_visible, application_deadline, featured_order, created_at desc);
create index if not exists jobs_category_idx on public.jobs (category_id);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete restrict,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  cover_note text not null,
  portfolio_url text,
  status public.job_application_status not null default 'submitted',
  admin_note text not null default '',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  assignment_id uuid unique references public.assignments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, professional_id),
  constraint job_applications_cover_note_not_blank check (length(trim(cover_note)) > 0),
  constraint job_applications_portfolio_url_valid check (
    portfolio_url is null
    or portfolio_url ~* '^https?://[^[:space:]]+$'
  )
);

create index if not exists job_applications_job_idx on public.job_applications (job_id, created_at desc);
create index if not exists job_applications_professional_idx on public.job_applications (professional_id, created_at desc);
create index if not exists job_applications_status_idx on public.job_applications (status, created_at desc);

drop trigger if exists job_categories_updated_at on public.job_categories;
create trigger job_categories_updated_at before update on public.job_categories
for each row execute function public.set_updated_at();
drop trigger if exists job_applications_updated_at on public.job_applications;
create trigger job_applications_updated_at before update on public.job_applications
for each row execute function public.set_updated_at();

alter table public.job_categories enable row level security;
alter table public.job_applications enable row level security;

drop policy if exists job_categories_admin_insert on public.job_categories;
create policy job_categories_admin_insert on public.job_categories for insert to authenticated
with check (public.is_admin());
drop policy if exists job_categories_admin_update on public.job_categories;
create policy job_categories_admin_update on public.job_categories for update to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists job_categories_admin_delete on public.job_categories;
create policy job_categories_admin_delete on public.job_categories for delete to authenticated
using (public.is_admin());
drop policy if exists job_applications_select on public.job_applications;
create policy job_applications_select on public.job_applications for select to authenticated
using (public.is_admin() or professional_id = public.current_professional_id());
drop policy if exists job_applications_admin_update on public.job_applications;
create policy job_applications_admin_update on public.job_applications for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create or replace function public.list_public_services()
returns table (
  id uuid,
  slug text,
  name text,
  short_name text,
  public_label text,
  description text,
  display_order integer
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select s.id, s.slug, s.name, s.short_name, s.public_label, s.description, s.display_order
  from public.services s
  where s.active and s.public_visible and s.slug is not null
  order by s.display_order, s.name;
$$;

create or replace function public.list_public_categories()
returns table (
  id uuid,
  slug text,
  name text,
  description text,
  display_order integer
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select c.id, c.slug, c.name, c.description, c.display_order
  from public.job_categories c
  where c.active
  order by c.display_order, c.name;
$$;

create or replace function public.list_public_jobs(
  p_query text default null,
  p_service_slug text default null,
  p_category_slug text default null,
  p_work_mode text default null,
  p_location text default null,
  p_featured_only boolean default false,
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  id uuid,
  slug text,
  title text,
  public_summary text,
  public_company_name text,
  service_slug text,
  service_name text,
  category_slug text,
  category_name text,
  employment_type text,
  work_mode text,
  location_label text,
  rate_min_minor bigint,
  rate_max_minor bigint,
  rate_currency text,
  rate_period text,
  application_deadline timestamptz,
  featured_order integer,
  created_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with matched as (
    select
      j.id,
      j.slug,
      j.title,
      j.public_summary,
      j.public_company_name,
      s.slug as service_slug,
      coalesce(s.public_label, s.name) as service_name,
      c.slug as category_slug,
      c.name as category_name,
      j.employment_type,
      j.work_mode,
      j.location_label,
      j.rate_min_minor,
      j.rate_max_minor,
      j.rate_currency,
      j.rate_period,
      j.application_deadline,
      j.featured_order,
      j.created_at
    from public.jobs j
    join public.services s on s.id = j.service_id and s.active and s.public_visible and s.slug is not null
    left join public.job_categories c on c.id = j.category_id and c.active
    where j.public_visible
      and j.publication_state = 'open'
      and j.slug is not null
      and length(trim(j.public_summary)) > 0
      and length(trim(j.public_company_name)) > 0
      and length(trim(j.location_label)) > 0
      and (j.application_deadline is null or j.application_deadline > now())
      and (nullif(trim(p_service_slug), '') is null or lower(s.slug) = lower(trim(p_service_slug)))
      and (nullif(trim(p_category_slug), '') is null or lower(c.slug) = lower(trim(p_category_slug)))
      and (nullif(trim(p_work_mode), '') is null or lower(j.work_mode) = lower(trim(p_work_mode)))
      and (nullif(trim(p_location), '') is null or j.location_label ilike '%' || trim(p_location) || '%')
      and (coalesce(p_featured_only, false) = false or j.featured_order is not null)
      and (
        nullif(trim(p_query), '') is null
        or concat_ws(' ', j.title, j.public_summary, j.public_company_name, j.location_label, s.name, c.name) ilike '%' || trim(p_query) || '%'
      )
  )
  select m.*, count(*) over() as total_count
  from matched m
  order by m.featured_order nulls last, m.created_at desc
  limit greatest(1, least(coalesce(p_limit, 12), 50))
  offset greatest(0, coalesce(p_offset, 0));
$$;

create or replace function public.get_public_job(p_slug text)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  public_summary text,
  public_company_name text,
  service_slug text,
  service_name text,
  category_slug text,
  category_name text,
  employment_type text,
  work_mode text,
  location_label text,
  rate_min_minor bigint,
  rate_max_minor bigint,
  rate_currency text,
  rate_period text,
  application_deadline timestamptz,
  featured_order integer,
  deliverables text[],
  public_references jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    j.id,
    j.slug,
    j.title,
    j.description,
    j.public_summary,
    j.public_company_name,
    s.slug as service_slug,
    coalesce(s.public_label, s.name) as service_name,
    c.slug as category_slug,
    c.name as category_name,
    j.employment_type,
    j.work_mode,
    j.location_label,
    j.rate_min_minor,
    j.rate_max_minor,
    j.rate_currency,
    j.rate_period,
    j.application_deadline,
    j.featured_order,
    j.deliverables,
    coalesce((
      select jsonb_agg(
        jsonb_build_object('label', r.label, 'kind', r.kind::text, 'url', r.url, 'fileName', r.file_name)
        order by r.display_order, r.created_at
      )
      from public.job_references r
      where r.job_id = j.id
        and r.kind = 'link'
        and length(trim(coalesce(r.url, ''))) > 0
    ), '[]'::jsonb) as references,
    j.created_at
  from public.jobs j
  join public.services s on s.id = j.service_id and s.active and s.public_visible and s.slug is not null
  left join public.job_categories c on c.id = j.category_id and c.active
  where j.public_visible
    and j.publication_state = 'open'
    and j.slug is not null
    and lower(j.slug) = lower(trim(p_slug))
    and length(trim(j.public_summary)) > 0
    and length(trim(j.public_company_name)) > 0
    and length(trim(j.location_label)) > 0
    and (j.application_deadline is null or j.application_deadline > now())
  limit 1;
$$;

create or replace function public.complete_my_professional_profile(
  p_display_name text,
  p_phone text default '',
  p_location text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_display_name text := nullif(trim(p_display_name), '');
  v_phone text := trim(coalesce(p_phone, ''));
  v_location text := trim(coalesce(p_location, ''));
  v_professional_id uuid;
begin
  if v_user_id is null then raise exception 'No active account session'; end if;
  if v_display_name is null then raise exception 'Display name is required'; end if;
  if char_length(v_display_name) > 120 then raise exception 'Display name must be 120 characters or fewer'; end if;
  if char_length(v_phone) > 80 then raise exception 'Phone must be 80 characters or fewer'; end if;
  if char_length(v_location) > 120 then raise exception 'Location must be 120 characters or fewer'; end if;
  if exists (select 1 from public.profiles where id = v_user_id and account_role = 'admin') then
    raise exception 'Admin accounts cannot create a professional profile';
  end if;
  if not exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'Account profile not found';
  end if;

  update public.profiles set display_name = v_display_name where id = v_user_id;
  insert into public.professionals (profile_id, phone, location)
  values (v_user_id, v_phone, v_location)
  on conflict (profile_id) do update set
    phone = excluded.phone,
    location = excluded.location,
    updated_at = now()
  returning id into v_professional_id;
  return v_professional_id;
end;
$$;

create or replace function public.submit_job_application(
  p_job_id uuid,
  p_cover_note text,
  p_portfolio_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_professional_id uuid := public.current_professional_id();
  v_cover_note text := trim(coalesce(p_cover_note, ''));
  v_portfolio_url text := nullif(trim(coalesce(p_portfolio_url, '')), '');
  v_application_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to apply'; end if;
  if v_professional_id is null then raise exception 'Complete your professional profile before applying'; end if;
  if not exists (select 1 from public.professionals where id = v_professional_id and account_status = 'active') then
    raise exception 'Professional account is inactive';
  end if;
  if char_length(v_cover_note) < 20 then raise exception 'Cover note must be at least 20 characters'; end if;
  if char_length(v_cover_note) > 4000 then raise exception 'Cover note must be 4,000 characters or fewer'; end if;
  if v_portfolio_url is not null and (char_length(v_portfolio_url) > 500 or v_portfolio_url !~* '^https?://[^[:space:]]+$') then
    raise exception 'Portfolio URL must be a valid http(s) URL';
  end if;
  if not exists (
    select 1 from public.jobs j
    join public.services s on s.id = j.service_id and s.active and s.public_visible
    where j.id = p_job_id
      and j.public_visible
      and j.publication_state = 'open'
      and j.slug is not null
      and length(trim(j.public_summary)) > 0
      and length(trim(j.public_company_name)) > 0
      and length(trim(j.location_label)) > 0
      and (j.application_deadline is null or j.application_deadline > now())
  ) then raise exception 'This job is no longer accepting applications'; end if;

  begin
    insert into public.job_applications (job_id, professional_id, cover_note, portfolio_url)
    values (p_job_id, v_professional_id, v_cover_note, v_portfolio_url)
    returning id into v_application_id;
  exception when unique_violation then
    raise exception 'You have already applied to this job';
  end;

  perform public.log_activity('submitted job application', 'job_application', v_application_id, jsonb_build_object('job_id', p_job_id));
  return v_application_id;
end;
$$;

create or replace function public.withdraw_job_application(p_application_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_professional_id uuid := public.current_professional_id();
begin
  if auth.uid() is null or v_professional_id is null then raise exception 'Sign in with a professional account'; end if;
  update public.job_applications
  set status = 'withdrawn', updated_at = now()
  where id = p_application_id
    and professional_id = v_professional_id
    and status in ('submitted', 'under_review', 'shortlisted');
  if not found then raise exception 'Application cannot be withdrawn'; end if;
  perform public.log_activity('withdrew job application', 'job_application', p_application_id);
  return p_application_id;
end;
$$;

create or replace function public.review_job_application(
  p_application_id uuid,
  p_status public.job_application_status,
  p_admin_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_note text := trim(coalesce(p_admin_note, ''));
  v_previous public.job_application_status;
begin
  if not public.is_admin() then raise exception 'Only Admin can review applications'; end if;
  if p_status not in ('under_review', 'shortlisted', 'rejected') then raise exception 'Invalid review status'; end if;
  select status into v_previous from public.job_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  if v_previous in ('withdrawn', 'converted') then raise exception 'This application is closed'; end if;
  update public.job_applications
  set status = p_status,
      admin_note = v_note,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id;
  perform public.log_activity('reviewed job application', 'job_application', p_application_id, jsonb_build_object('status', p_status::text));
  return p_application_id;
end;
$$;

create or replace function public.convert_job_application_to_assignment(
  p_application_id uuid,
  p_agreed_pay bigint,
  p_deadline timestamptz default null,
  p_lead_reviewer_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_application public.job_applications%rowtype;
  v_job public.jobs%rowtype;
  v_assignment_id uuid;
begin
  if not public.is_admin() then raise exception 'Only Admin can convert applications'; end if;
  if p_agreed_pay is null or p_agreed_pay <= 0 then raise exception 'Agreed pay must be positive'; end if;
  select * into v_application from public.job_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  if v_application.status <> 'shortlisted' then raise exception 'Only shortlisted applications can be converted'; end if;
  if v_application.assignment_id is not null then return v_application.assignment_id; end if;
  select * into v_job from public.jobs where id = v_application.job_id;
  if not found then raise exception 'Job not found'; end if;

  perform public.add_job_assignments(
    v_application.job_id,
    jsonb_build_array(jsonb_build_object(
      'professionalId', v_application.professional_id,
      'leadReviewerId', p_lead_reviewer_id,
      'agreedPay', p_agreed_pay,
      'deadline', coalesce(p_deadline, v_job.deadline)
    ))
  );

  select a.id into v_assignment_id
  from public.assignments a
  where a.job_id = v_application.job_id and a.professional_id = v_application.professional_id;
  if v_assignment_id is null then raise exception 'Assignment was not created'; end if;
  update public.job_applications
  set status = 'converted', assignment_id = v_assignment_id, reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = p_application_id;
  perform public.log_activity('converted job application', 'job_application', p_application_id, jsonb_build_object('assignment_id', v_assignment_id));
  return v_assignment_id;
end;
$$;

create or replace function public.list_my_applications(p_status text default null)
returns table (
  id uuid,
  job_id uuid,
  job_slug text,
  job_title text,
  company_name text,
  status public.job_application_status,
  cover_note text,
  portfolio_url text,
  admin_note text,
  assignment_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select a.id, a.job_id, j.slug, j.title, j.public_company_name, a.status, a.cover_note, a.portfolio_url, a.admin_note, a.assignment_id, a.created_at, a.updated_at
  from public.job_applications a
  join public.jobs j on j.id = a.job_id
  where a.professional_id = public.current_professional_id()
    and (nullif(trim(p_status), '') is null or a.status::text = trim(p_status))
  order by a.created_at desc;
$$;

create or replace function public.list_admin_applications(
  p_job_id uuid default null,
  p_status text default null
)
returns table (
  id uuid,
  job_id uuid,
  job_slug text,
  job_title text,
  company_name text,
  professional_id uuid,
  applicant_profile_id uuid,
  applicant_name text,
  applicant_email text,
  status public.job_application_status,
  cover_note text,
  portfolio_url text,
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  assignment_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select a.id, a.job_id, j.slug, j.title, j.public_company_name, a.professional_id, p.profile_id, pr.display_name, pr.email, a.status, a.cover_note, a.portfolio_url, a.admin_note, a.reviewed_by, a.reviewed_at, a.assignment_id, a.created_at, a.updated_at
  from public.job_applications a
  join public.jobs j on j.id = a.job_id
  join public.professionals p on p.id = a.professional_id
  join public.profiles pr on pr.id = p.profile_id
  where public.is_admin()
    and (p_job_id is null or a.job_id = p_job_id)
    and (nullif(trim(p_status), '') is null or a.status::text = trim(p_status))
  order by a.created_at desc;
$$;

revoke all on table public.job_categories, public.job_applications from anon, authenticated;
revoke all on all functions in schema public from anon;

grant execute on function public.list_public_services() to anon, authenticated;
grant execute on function public.list_public_categories() to anon, authenticated;
grant execute on function public.list_public_jobs(text,text,text,text,text,boolean,integer,integer) to anon, authenticated;
grant execute on function public.get_public_job(text) to anon, authenticated;

grant execute on function public.complete_my_professional_profile(text,text,text) to authenticated;
grant execute on function public.submit_job_application(uuid,text,text) to authenticated;
grant execute on function public.withdraw_job_application(uuid) to authenticated;
grant execute on function public.review_job_application(uuid,public.job_application_status,text) to authenticated;
grant execute on function public.convert_job_application_to_assignment(uuid,bigint,timestamptz,uuid) to authenticated;
grant execute on function public.list_my_applications(text) to authenticated;
grant execute on function public.list_admin_applications(uuid,text) to authenticated;
