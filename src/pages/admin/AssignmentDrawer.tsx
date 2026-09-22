import { useState } from "react";
import { Drawer } from "../../components/Drawer";
import { Button, Field, Input } from "../../components/ui";
import type { Job } from "../../domain/model";
import type { PublicApplication, PublicListingsRepository } from "../../lib/publicListings";

export function AssignmentDrawer({
  application,
  job,
  repository,
  open,
  onClose,
  onComplete,
  onStaleRecord
}: {
  application: PublicApplication | null;
  job?: Job;
  repository: PublicListingsRepository;
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  onStaleRecord: () => void;
}) {
  const [agreedPay, setAgreedPay] = useState("");
  const [deadline, setDeadline] = useState(() => job?.deadline?.slice(0, 10) ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!application) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(agreedPay);
    if (!Number.isInteger(amount) || amount <= 0) {
      setError("Enter a positive whole-number agreed pay.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await repository.convertApplication({
        applicationId: application.id,
        agreedPay: amount,
        deadline: deadline ? new Date(deadline + "T23:59:59").toISOString() : undefined
      });
      onComplete();
      onClose();
    } catch (caught) {
      const message = caught instanceof Error
        ? caught.message
        : "Assignment could not be created.";
      if (/not approved|not active|only open|no longer|not ready/i.test(message)) {
        onStaleRecord();
        onClose();
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      title="Create assignment"
      description="Confirm the agreed terms. The Professional will be notified after the Assignment is created."
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="assignment-form" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create assignment"}
          </Button>
        </>
      }
    >
      <form id="assignment-form" onSubmit={submit} className="grid gap-5">
        <div className="rounded-xl bg-[var(--surface-subtle)] p-4">
          <p className="text-xs font-black uppercase tracking-[.13em] text-[var(--blue)]">
            {application.companyName || "Client team"}
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--ink)]">
            {application.jobTitle}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {application.applicantName || "Applicant"} · {application.serviceName || "Service readiness approved"}
          </p>
        </div>

        <Field
          label={"Agreed pay (" + (job?.rateCurrency || "NGN") + ")"}
          hint="Use the amount agreed with the Professional."
          error={error ?? undefined}
        >
          <Input
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={agreedPay}
            onChange={(event) => setAgreedPay(event.target.value)}
            placeholder="450000"
            autoFocus
            required
          />
        </Field>

        <Field label="Deadline" hint="Leave blank to use the Job deadline.">
          <Input
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
        </Field>

        <p className="text-sm leading-6 text-[var(--muted)]">
          This creates the Assignment and sends the Professional one notification.
        </p>
      </form>
    </Drawer>
  );
}
