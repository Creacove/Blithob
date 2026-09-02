-- Meeting-ready launch catalog. These are the five roles already represented
-- in the landing design, now published through the canonical jobs projection
-- so the public site and the app exercise the same path.

-- The original jobs table required an authenticated creator. These launch rows
-- are system-seeded content; future Admin-created rows still require
-- created_by = auth.uid() through the existing RLS policy.
alter table public.jobs
  alter column created_by drop not null;

insert into public.services (
  id, name, short_name, description, active, slug, public_label, public_visible, display_order
)
values
  ('10000000-0000-4000-8000-000000000005', 'Web Development', 'Web', 'Accessible, responsive product experiences for growing teams.', true, 'web-development', 'Web development', true, 5),
  ('10000000-0000-4000-8000-000000000006', 'Customer Support', 'Support', 'Clear, thoughtful help for customers and teams.', true, 'customer-support', 'Customer support', true, 6),
  ('10000000-0000-4000-8000-000000000007', 'Operations', 'Ops', 'Reliable systems and coordination for important work.', true, 'operations', 'Operations', true, 7),
  ('10000000-0000-4000-8000-000000000008', 'Product Design', 'Design', 'Useful product direction that makes complex work feel simple.', true, 'product-design', 'Product design', true, 8)
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  active = excluded.active,
  slug = excluded.slug,
  public_label = excluded.public_label,
  public_visible = excluded.public_visible,
  display_order = excluded.display_order,
  updated_at = now();

insert into public.jobs (
  id, slug, title, service_id, category_id, client_context, objective, description,
  steps, deliverables, acceptance_criteria, submission_evidence_required, deadline,
  publication_state, created_by, public_visible, public_summary, public_company_name,
  employment_type, work_mode, location_label, rate_min_minor, rate_max_minor,
  rate_currency, rate_period, application_deadline, featured_order
)
values
  (
    '40000000-0000-4000-8000-000000000001', 'frontend-developer', 'Frontend Developer',
    '10000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000001',
    'Build a polished product surface with a clear handoff.',
    'Build accessible, responsive product experiences used by growing teams around the world.',
    'Build accessible, responsive product experiences used by growing teams around the world.',
    array['Clarify the brief', 'Build the responsive surface', 'Share the implementation'],
    array['A responsive frontend implementation'], array['The experience is accessible and on brief'], false,
    now() + interval '30 days', 'open', null, true,
    'Build accessible, responsive product experiences used by growing teams around the world.',
    'Skyline Labs', 'Full-time', 'Remote', 'Lagos', 45000000, 65000000, 'NGN', 'month', null, 1
  ),
  (
    '40000000-0000-4000-8000-000000000002', 'social-media-manager', 'Social Media Manager',
    '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003',
    'Shape a consistent social presence with a practical publishing rhythm.',
    'Shape social campaigns, grow engaged communities, and turn insights into measurable momentum.',
    'Shape social campaigns, grow engaged communities, and turn insights into measurable momentum.',
    array['Understand the audience', 'Build the content rhythm', 'Share the reporting view'],
    array['A social content calendar', 'A simple reporting summary'], array['The plan is clear and measurable'], false,
    now() + interval '30 days', 'open', null, true,
    'Shape social campaigns, grow engaged communities, and turn insights into measurable momentum.',
    'Brightwave', 'Full-time', 'Hybrid', 'Lagos', 25000000, 40000000, 'NGN', 'month', null, 2
  ),
  (
    '40000000-0000-4000-8000-000000000003', 'customer-support-rep', 'Customer Support Rep',
    '10000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000005',
    'Help customers move through questions with care and clear documentation.',
    'Help customers solve meaningful problems with clear communication and thoughtful support.',
    'Help customers solve meaningful problems with clear communication and thoughtful support.',
    array['Learn the product', 'Resolve customer questions', 'Capture useful patterns'],
    array['Helpful customer responses', 'A recurring-issues summary'], array['Customers receive clear, accurate next steps'], false,
    now() + interval '30 days', 'open', null, true,
    'Help customers solve meaningful problems with clear communication and thoughtful support.',
    'Codeflow Systems', 'Full-time', 'Remote', 'Lagos', 28000000, 42000000, 'NGN', 'month', null, 3
  ),
  (
    '40000000-0000-4000-8000-000000000004', 'operations-manager', 'Operations Manager',
    '10000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000004',
    'Bring calm structure to the systems and handoffs behind the work.',
    'Improve systems, coordinate teams, and keep important work moving with clarity.',
    'Improve systems, coordinate teams, and keep important work moving with clarity.',
    array['Map the current workflow', 'Improve the handoffs', 'Share the operating rhythm'],
    array['A practical operations plan'], array['The system is easy to follow and maintain'], false,
    now() + interval '30 days', 'open', null, true,
    'Improve systems, coordinate teams, and keep important work moving with clarity.',
    'Flowstead', 'Full-time', 'Hybrid', 'Lagos', 40000000, 60000000, 'NGN', 'month', null, 4
  ),
  (
    '40000000-0000-4000-8000-000000000005', 'product-designer', 'Product Designer',
    '10000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000002',
    'Turn a complex product brief into a focused, useful experience.',
    'Turn complex product ideas into simple, useful experiences for people everywhere.',
    'Turn complex product ideas into simple, useful experiences for people everywhere.',
    array['Clarify the brief', 'Explore a direction', 'Share the work'],
    array['A clear product direction'], array['The work is useful and on brief'], false,
    now() + interval '30 days', 'open', null, true,
    'Turn complex product ideas into simple, useful experiences for people everywhere.',
    'Northstar Studio', 'Full-time', 'Remote', 'Lagos', 40000000, 65000000, 'NGN', 'month', null, 5
  )
on conflict do nothing;

-- Migration 012 may already have created a private Product Designer draft
-- under a different UUID. Promote that canonical row rather than creating a
-- second slug, while retaining its original ownership metadata.
update public.jobs
set
  service_id = '10000000-0000-4000-8000-000000000008',
  category_id = '30000000-0000-4000-8000-000000000002',
  client_context = 'Turn a complex product brief into a focused, useful experience.',
  objective = 'Turn complex product ideas into simple, useful experiences for people everywhere.',
  description = 'Turn complex product ideas into simple, useful experiences for people everywhere.',
  steps = array['Clarify the brief', 'Explore a direction', 'Share the work'],
  deliverables = array['A clear product direction'],
  acceptance_criteria = array['The work is useful and on brief'],
  submission_evidence_required = false,
  deadline = now() + interval '30 days',
  publication_state = 'open',
  public_visible = true,
  public_summary = 'Turn complex product ideas into simple, useful experiences for people everywhere.',
  public_company_name = 'Northstar Studio',
  employment_type = 'Full-time',
  work_mode = 'Remote',
  location_label = 'Lagos',
  rate_min_minor = 40000000,
  rate_max_minor = 65000000,
  rate_currency = 'NGN',
  rate_period = 'month',
  application_deadline = null,
  featured_order = 5,
  updated_at = now()
where slug = 'product-designer';
