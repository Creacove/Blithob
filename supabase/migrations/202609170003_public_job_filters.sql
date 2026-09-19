-- Additive public discovery filters. No visa, sponsorship, or international workflow fields.
alter table public.jobs add column if not exists country_code text;
alter table public.jobs drop constraint if exists jobs_country_code_valid;
alter table public.jobs add constraint jobs_country_code_valid
  check (country_code is null or country_code ~ '^[A-Z]{2}$');
create index if not exists jobs_public_country_idx
  on public.jobs (country_code, publication_state, public_visible);

create or replace function public.list_public_jobs(
  p_query text default null,
  p_service_slug text default null,
  p_category_slug text default null,
  p_work_mode text default null,
  p_location text default null,
  p_country_code text default null,
  p_employment_type text default null,
  p_min_rate_minor bigint default null,
  p_max_rate_minor bigint default null,
  p_featured_only boolean default false,
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  id uuid, slug text, title text, public_summary text, public_company_name text,
  service_slug text, service_name text, category_slug text, category_name text,
  country_code text, employment_type text, work_mode text, location_label text,
  rate_min_minor bigint, rate_max_minor bigint, rate_currency text, rate_period text,
  application_deadline timestamptz, featured_order integer, created_at timestamptz,
  total_count bigint
)
language sql stable security definer set search_path = public, extensions
as $$
  with matched as (
    select j.id, j.slug, j.title, j.public_summary, j.public_company_name,
      s.slug service_slug, coalesce(s.public_label, s.name) service_name,
      c.slug category_slug, c.name category_name, j.country_code,
      j.employment_type, j.work_mode, j.location_label, j.rate_min_minor,
      j.rate_max_minor, j.rate_currency, j.rate_period, j.application_deadline,
      j.featured_order, j.created_at
    from public.jobs j
    join public.services s on s.id = j.service_id and s.active and s.public_visible and s.slug is not null
    left join public.job_categories c on c.id = j.category_id and c.active
    where j.public_visible and j.publication_state = 'open' and j.slug is not null
      and length(trim(j.public_summary)) > 0 and length(trim(j.public_company_name)) > 0
      and length(trim(j.location_label)) > 0
      and (j.application_deadline is null or j.application_deadline > now())
      and (nullif(trim(p_service_slug), '') is null or lower(s.slug) = lower(trim(p_service_slug)))
      and (nullif(trim(p_category_slug), '') is null or lower(c.slug) = lower(trim(p_category_slug)))
      and (nullif(trim(p_work_mode), '') is null or lower(j.work_mode) = lower(trim(p_work_mode)))
      and (nullif(trim(p_location), '') is null or j.location_label ilike '%' || trim(p_location) || '%')
      and (nullif(trim(p_country_code), '') is null or j.country_code = upper(trim(p_country_code)))
      and (nullif(trim(p_employment_type), '') is null or lower(j.employment_type) = lower(trim(p_employment_type)))
      and (p_min_rate_minor is null or j.rate_max_minor is null or j.rate_max_minor >= p_min_rate_minor)
      and (p_max_rate_minor is null or j.rate_min_minor is null or j.rate_min_minor <= p_max_rate_minor)
      and (coalesce(p_featured_only, false) = false or j.featured_order is not null)
      and (nullif(trim(p_query), '') is null or concat_ws(' ', j.title, j.public_summary,
        j.public_company_name, j.location_label, s.name, c.name) ilike '%' || trim(p_query) || '%')
  )
  select m.*, count(*) over() total_count from matched m
  order by m.featured_order nulls last, m.created_at desc
  limit least(greatest(coalesce(p_limit, 12), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.list_public_jobs(text,text,text,text,text,boolean,integer,integer) from anon, authenticated;
grant execute on function public.list_public_jobs(text,text,text,text,text,text,text,bigint,bigint,boolean,integer,integer) to anon, authenticated;
