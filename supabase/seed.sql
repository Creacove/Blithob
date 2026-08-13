insert into public.services (id, name, short_name, description, active)
values
  ('10000000-0000-4000-8000-000000000001', 'Social Media', 'Social', 'Campaign strategy, content planning, and reporting.', true),
  ('10000000-0000-4000-8000-000000000002', 'Content Creation', 'Content', 'Clear, useful writing for modern teams and customers.', true),
  ('10000000-0000-4000-8000-000000000003', 'Virtual Assistance', 'VA', 'Reliable coordination and day-to-day operational support.', true),
  ('10000000-0000-4000-8000-000000000004', 'Data Entry', 'Data', 'Accurate, structured data handling for recurring workflows.', true)
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  active = excluded.active;

insert into public.service_requirements (id, service_id, title, description, requires_evidence, display_order)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Strategy basics', 'Explain campaign goals and audience segmentation.', false, 1),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Portfolio sample', 'Upload a sample social calendar or campaign plan.', true, 2),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Tool readiness', 'Confirm access to scheduling and reporting tools.', true, 3),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 'Writing sample', 'Submit a short-form and long-form writing sample.', true, 1),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 'Editing checklist', 'Confirm use of the house editing checklist.', false, 2),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000003', 'Calendar coordination', 'Complete the calendar coordination exercise.', false, 1),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000003', 'Client comms sample', 'Upload a client update sample.', true, 2),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000004', 'Spreadsheet accuracy', 'Complete the spreadsheet accuracy exercise.', true, 1),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000004', 'Confidentiality', 'Accept the data handling guidelines.', false, 2)
on conflict (id) do update set
  service_id = excluded.service_id,
  title = excluded.title,
  description = excluded.description,
  requires_evidence = excluded.requires_evidence,
  display_order = excluded.display_order;
