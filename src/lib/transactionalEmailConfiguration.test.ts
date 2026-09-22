import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "../..");
const migrationsDirectory = resolve(projectRoot, "supabase/migrations");
const migrationName = readdirSync(migrationsDirectory).find((name) =>
  name.endsWith("_transactional_email_outbox.sql")
);
const webhookMigrationName = readdirSync(migrationsDirectory).find((name) =>
  name.endsWith("_transactional_email_delivery_webhook.sql")
);
const deliveryGrantMigrationName = readdirSync(migrationsDirectory).find((name) =>
  name.endsWith("_grant_transactional_email_sender.sql")
);
const enumCastMigrationName = readdirSync(migrationsDirectory)
  .filter((name) => name.endsWith("_fix_workflow_enum_casts.sql"))
  .sort()
  .at(-1);

describe("transactional email configuration", () => {
  it("queues only essential workflow emails and has a server-side sender", () => {
    expect(migrationName).toBeDefined();

    const migration = readFileSync(resolve(migrationsDirectory, migrationName!), "utf8");
    const sender = readFileSync(
      resolve(projectRoot, "supabase/functions/send-transactional-email/index.ts"),
      "utf8"
    );

    expect(migration).toContain("create table public.transactional_email_outbox");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("queue_transactional_email");
    expect(migration).toContain("application_received");
    expect(migration).toContain("application_shortlisted");
    expect(migration).toContain("application_rejected");
    expect(migration).toContain("readiness_review_requested");
    expect(migration).toContain("readiness_certified");
    expect(migration).toContain("readiness_changes_requested");
    expect(migration).toContain("readiness_approved");
    expect(migration).toContain("assignment_created");
    expect(migration).toContain("work_review_requested");
    expect(migration).toContain("work_certified");
    expect(migration).toContain("work_changes_requested");
    expect(migration).toContain("work_approved");
    expect(migration).toContain("assignment_completed");
    expect(migration).toContain("assignment_cancelled");
    expect(migration).toContain("payment_paid");
    expect(migration).toContain("payment_issue");
    expect(sender).toContain("RESEND_API_KEY");
    expect(sender).toContain("EMAIL_WEBHOOK_SECRET");
    expect(sender).toContain("Only internal webhook requests can send transactional email");
    expect(sender).toContain("async function rest");
    expect(sender).toContain("readiness_required");
    expect(sender).toContain("service_name");
    expect(sender).toContain("Complete the readiness steps in Blithob");
    expect(sender).toContain("escapeHtml");
    expect(sender).not.toContain('text(payload, "admin_note")');
    expect(sender).toContain("https://blithob.com");
    expect(webhookMigrationName).toBeDefined();
    const webhookMigration = readFileSync(
      resolve(migrationsDirectory, webhookMigrationName!),
      "utf8"
    );
    expect(webhookMigration).toContain("create extension if not exists pg_net");
    expect(webhookMigration).toContain("transactional_email_outbox_dispatch");
    expect(deliveryGrantMigrationName).toBeDefined();
    const deliveryGrantMigration = readFileSync(
      resolve(migrationsDirectory, deliveryGrantMigrationName!),
      "utf8"
    );
    expect(deliveryGrantMigration).toContain("grant select, update on public.transactional_email_outbox to service_role");
    expect(enumCastMigrationName).toBeDefined();
    const enumCastMigration = readFileSync(resolve(migrationsDirectory, enumCastMigrationName!), "utf8");
    expect(enumCastMigration).toContain("::public.assignment_status");
    const config = readFileSync(resolve(projectRoot, "supabase/config.toml"), "utf8");
    expect(config).toContain("[functions.send-transactional-email]");
    expect(config).toContain("verify_jwt = false");
  });
});
