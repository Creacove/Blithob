type OutboxRecord = {
  id: string;
  recipient_user_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: "pending" | "sending" | "sent" | "failed";
  attempts: number;
};

type WebhookPayload = { record?: OutboxRecord };

async function rest<T>(
  supabaseUrl: string,
  serviceRoleKey: string,
  path: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  const data = await response.json().catch(() => null) as T;
  if (!response.ok) {
    const message = data && typeof data === "object" && "message" in data
      ? String(data.message)
      : "Supabase request failed";
    throw new Error(message);
  }
  return data;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function text(payload: Record<string, unknown>, key: string) {
  return typeof payload[key] === "string" ? payload[key].trim() : "";
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

function template(eventType: string, payload: Record<string, unknown>) {
  const jobTitle = text(payload, "job_title");
  const serviceName = text(payload, "service_name");
  const readinessRequired = payload.readiness_required === true;
  const comment = text(payload, "comment");
  const issueNote = text(payload, "issue_note");
  const reason = text(payload, "reason");
  const messages: Record<string, { subject: string; body: string }> = {
    application_received: { subject: "Application received", body: `We received your application${jobTitle ? ` for ${jobTitle}` : ""}. We will be in touch if there is a next step.` },
    application_shortlisted: {
      subject: "Your application has been shortlisted",
      body: readinessRequired
        ? `Your application${jobTitle ? ` for ${jobTitle}` : ""} has been shortlisted${serviceName ? ` for ${serviceName}` : ""}. Complete the readiness steps in Blithob so the team can review you for an Assignment.${comment ? ` ${comment}` : ""}`
        : `Your application${jobTitle ? ` for ${jobTitle}` : ""} has been shortlisted. The team will share the Assignment here when the next step is ready.${comment ? ` ${comment}` : ""}`
    },
    application_rejected: { subject: "Update on your application", body: `Thank you for applying${jobTitle ? ` for ${jobTitle}` : ""}. We are unable to move forward on this occasion.${comment ? ` ${comment}` : ""}` },
    readiness_review_requested: { subject: "Readiness review needed", body: "A Professional’s readiness submission is ready for your review." },
    readiness_certified: { subject: "Readiness certified", body: "A Lead has certified readiness for your final approval." },
    readiness_changes_requested: { subject: "Readiness changes requested", body: `Your readiness submission needs changes.${comment ? ` ${comment}` : ""}` },
    readiness_approved: { subject: "Readiness approved", body: `Your readiness has been approved.${comment ? ` ${comment}` : ""}` },
    assignment_created: { subject: "You have a new assignment", body: `${jobTitle || "A new assignment"} is ready for you to start.` },
    work_review_requested: { subject: "Work review needed", body: `${jobTitle || "A work submission"} is ready for your review.` },
    work_certified: { subject: "Work certified", body: "A Lead has certified work for your final approval." },
    work_changes_requested: { subject: "Changes requested for your work", body: `Your submission needs changes.${comment ? ` ${comment}` : ""}` },
    work_approved: { subject: "Your work has been approved", body: `Your work has been approved.${comment ? ` ${comment}` : ""}` },
    assignment_completed: { subject: "Assignment completed", body: "Your assignment is complete and has moved to payment." },
    assignment_cancelled: { subject: "Assignment cancelled", body: `Your assignment has been cancelled.${reason ? ` ${reason}` : ""}` },
    payment_paid: { subject: "Payment recorded", body: "Your payment has been recorded. You can view the details in Blithob." },
    payment_issue: { subject: "Payment needs attention", body: `There is an issue with your payment.${issueNote ? ` ${issueNote}` : ""}` }
  };
  return messages[eventType];
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const webhookSecret = Deno.env.get("EMAIL_WEBHOOK_SECRET");
  const emailFrom = Deno.env.get("EMAIL_FROM") ?? "Blithob <hello@blithob.com>";
  if (!supabaseUrl || !serviceRoleKey || !webhookSecret) return json({ error: "Supabase function is not configured" }, 500);
  if (request.headers.get("Authorization") !== `Bearer ${webhookSecret}`) {
    return json({ error: "Only internal webhook requests can send transactional email" }, 403);
  }
  if (!resendApiKey) return json({ error: "RESEND_API_KEY is not configured" }, 503);

  let payload: WebhookPayload;
  try {
    payload = (await request.json()) as WebhookPayload;
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }
  const record = payload.record;
  if (!record?.id || record.status !== "pending") return json({ ignored: true });

  let claimed: Pick<OutboxRecord, "id" | "recipient_user_id" | "event_type" | "payload"> | undefined;
  try {
    const rows = await rest<Array<Pick<OutboxRecord, "id" | "recipient_user_id" | "event_type" | "payload">>>(
      supabaseUrl,
      serviceRoleKey,
      `transactional_email_outbox?id=eq.${encodeURIComponent(record.id)}&status=eq.pending`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status: "sending", attempts: record.attempts + 1 })
      }
    );
    claimed = rows[0];
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Could not claim email" }, 500);
  }
  if (!claimed) return json({ ignored: true });

  let recipient: { email?: string; display_name?: string } | undefined;
  try {
    const recipients = await rest<Array<{ email?: string; display_name?: string }>>(
      supabaseUrl,
      serviceRoleKey,
      `profiles?id=eq.${encodeURIComponent(claimed.recipient_user_id)}&select=email,display_name`
    );
    recipient = recipients[0];
  } catch {
    // The failure is recorded below so the queue can be inspected and retried.
  }
  const message = template(claimed.event_type, claimed.payload);
  if (!recipient?.email || !message) {
    await rest(supabaseUrl, serviceRoleKey, `transactional_email_outbox?id=eq.${encodeURIComponent(claimed.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "failed", last_error: "Recipient or template was unavailable" })
    });
    return json({ error: "Recipient or template was unavailable" }, 422);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
    body: JSON.stringify({
      from: emailFrom,
      to: recipient.email,
      subject: message.subject,
      text: `${recipient.display_name ? `Hi ${recipient.display_name},\n\n` : ""}${message.body}\n\nOpen Blithob: https://blithob.com`,
      html: `<p>${recipient.display_name ? `Hi ${escapeHtml(recipient.display_name)},` : "Hello,"}</p><p>${escapeHtml(message.body)}</p><p><a href="https://blithob.com">Open Blithob</a></p>`
    })
  });
  const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok) {
    await rest(supabaseUrl, serviceRoleKey, `transactional_email_outbox?id=eq.${encodeURIComponent(claimed.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "failed", last_error: result.message ?? "Email provider rejected the request" })
    });
    return json({ error: result.message ?? "Email provider rejected the request" }, 502);
  }
  await rest(supabaseUrl, serviceRoleKey, `transactional_email_outbox?id=eq.${encodeURIComponent(claimed.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: result.id ?? null, last_error: null })
  });
  return json({ id: claimed.id, providerMessageId: result.id });
});
