-- Idempotent catalog metadata. Jobs remain unpublished until an Admin supplies
-- a real created_by profile and confirms the public facts in the manifest.

alter table public.job_categories
  add column if not exists label text;

update public.job_categories
set label = name
where label is null or length(trim(label)) = 0;

alter table public.job_categories
  alter column label set default '',
  add constraint job_categories_label_not_blank check (length(trim(label)) > 0);

insert into public.job_categories (id, slug, label, name, description, active, display_order)
values
  ('30000000-0000-4000-8000-000000000001', 'tech', 'Tech', 'Tech', 'Product, engineering, and digital roles.', true, 1),
  ('30000000-0000-4000-8000-000000000002', 'design', 'Design', 'Design', 'Make useful things feel clear and human.', true, 2),
  ('30000000-0000-4000-8000-000000000003', 'marketing', 'Marketing', 'Marketing', 'Build demand, community, and momentum.', true, 3),
  ('30000000-0000-4000-8000-000000000004', 'operations', 'Operations', 'Operations', 'Keep important work moving with care.', true, 4),
  ('30000000-0000-4000-8000-000000000005', 'support', 'Customer Support', 'Customer Support', 'Help people make progress with clarity.', true, 5)
on conflict (id) do update set
  slug = excluded.slug,
  label = excluded.label,
  name = excluded.name,
  description = excluded.description,
  active = excluded.active,
  display_order = excluded.display_order,
  updated_at = now();

update public.services
set
  slug = metadata.slug,
  public_label = metadata.public_label,
  public_visible = true,
  display_order = metadata.display_order,
  updated_at = now()
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'social-media', 'Social media', 1),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'content-creation', 'Content creation', 2),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'virtual-assistance', 'Virtual assistance', 3),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'data-entry', 'Data entry', 4)
) as metadata(id, slug, public_label, display_order)
where public.services.id = metadata.id;

do $$
declare
  v_admin_id uuid;
  v_service_id uuid;
  v_category_id uuid;
begin
  select id into v_admin_id from public.profiles where account_role = 'admin' order by created_at limit 1;
  if v_admin_id is null then
    return;
  end if;

  -- These rows mirror the roles previously shown by the design. They are
  -- intentionally draft/private until the owner confirms every public fact.
  select id into v_service_id from public.services where slug = 'content-creation' limit 1;
  select id into v_category_id from public.job_categories where slug = 'design' limit 1;
  if v_service_id is not null and v_category_id is not null then
    insert into public.jobs (
      slug, title, service_id, category_id, client_context, objective, description,
      steps, deliverables, acceptance_criteria, submission_evidence_required,
      deadline, publication_state, created_by, public_visible, public_summary,
      public_company_name, employment_type, work_mode, location_label,
      rate_min_minor, rate_max_minor, rate_currency, rate_period, featured_order
    ) values (
      'product-designer', 'Product Designer', v_service_id, v_category_id,
      'Candidate launch content pending owner confirmation.',
      'Turn complex product ideas into simple, useful experiences.',
      'Turn complex product ideas into simple, useful experiences for people everywhere.',
      array['Clarify the brief', 'Explore a direction', 'Share the work'],
      array['A clear product direction'], array['The work is useful and on brief'], false,
      now() + interval '30 days', 'draft', v_admin_id, false,
      'Turn complex product ideas into simple, useful experiences for people everywhere.',
      'Northstar Studio', 'Full-time', 'Remote', 'Lagos', 40000000, 65000000, 'NGN', 'month', 5
    ) on conflict do nothing;
  end if;
end;
$$;
