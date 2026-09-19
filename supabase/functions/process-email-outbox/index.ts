import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

Deno.serve(async (request) => {
  const expected = Deno.env.get("EMAIL_OUTBOX_INTERNAL_TOKEN");
  if (!expected || request.headers.get("x-outbox-token") !== expected) return json({ error: "Unauthorized" }, 401);
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const sender = Deno.env.get("EMAIL_FROM");
  if (!apiKey || !sender) return json({ error: "Email delivery is not configured" }, 503);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json({ error: "Email processor is not configured" }, 503);
  const supabase = createClient(url, serviceKey);
  const { data: rows, error } = await supabase.rpc("claim_email_outbox_batch", { p_limit: 20 });
  if (error) return json({ error: "Unable to claim email events" }, 500);
  let sent = 0;
  for (const row of rows ?? []) {
    const payload = row.payload ?? {};
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: sender, to: [row.recipient_email], subject: `Application update: ${payload.job_title ?? "your application"}`, text: `Your application for ${payload.job_title ?? "a role"} has a new update. Sign in to Blithob to view the latest status.` }) });
    if (response.ok) { const result = await response.json(); await supabase.rpc("mark_email_outbox_sent", { p_id: row.id, p_provider_message_id: result.id ?? null }); sent += 1; }
    else await supabase.rpc("mark_email_outbox_retry", { p_id: row.id, p_error: "Email provider rejected the message" });
  }
  return json({ processed: rows?.length ?? 0, sent });
});
