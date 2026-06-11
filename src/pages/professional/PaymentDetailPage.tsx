import { ArrowLeft, FileCheck2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { MetaList, Section } from "../../components/ui";
import { formatCurrency, formatDate, formatDateTime } from "../../lib/format";
import { paymentMethodLabel } from "../../lib/payment";
import { useProfessionalStore } from "../../store/professionalStore";
import { RouteShell } from "../RouteShell";

export function PaymentDetailPage() {
  const { paymentId } = useParams();
  const professional = useProfessionalStore((state) =>
    state.currentProfessional()
  );
  const payment = useProfessionalStore((state) =>
    state.payments.find((item) => item.id === paymentId)
  );
  const assignment = useProfessionalStore((state) =>
    state.assignments.find((item) => item.id === payment?.assignmentId)
  );
  const job = useProfessionalStore((state) =>
    state.jobs.find((item) => item.id === assignment?.jobId)
  );

  if (
    !professional ||
    !payment ||
    payment.professionalId !== professional.id ||
    !assignment ||
    !job
  ) {
    return (
      <RouteShell
        title="Payment not found"
        description="This Payment does not exist or does not belong to your account."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={job.title}
        description="Read-only payment evidence for this completed Assignment."
        actions={
          <Link
            to="/professional/payments"
            className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Payments
          </Link>
        }
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Section title="Payment overview">
          <MetaList
            items={[
              { label: "Amount", value: formatCurrency(payment.amount) },
              {
                label: "Status",
                value: <StatusBadge status={payment.status} />
              },
              { label: "Due date", value: formatDate(payment.dueDate) },
              {
                label: "Paid date",
                value: payment.paymentDate
                  ? formatDateTime(payment.paymentDate)
                  : "Not paid"
              },
              {
                label: "Assignment",
                value: (
                  <Link
                    to={`/professional/work/${assignment.id}`}
                    className="text-[var(--blue)]"
                  >
                    Open Assignment
                  </Link>
                )
              }
            ]}
          />
        </Section>
        <Section title="Payment evidence">
          <MetaList
            items={[
              {
                label: "Method",
                value: payment.method
                  ? paymentMethodLabel(payment.method)
                  : "Not recorded"
              },
              {
                label: "Reference",
                value: payment.reference ?? "Not recorded"
              },
              {
                label: "Receipt",
                value: payment.receiptFileName ? (
                  <span className="inline-flex items-center gap-2">
                    <FileCheck2 size={15} aria-hidden />
                    {payment.receiptFileName}
                  </span>
                ) : (
                  "Not attached"
                )
              }
            ]}
          />
          <p className="mt-5 border-t border-[var(--border)] pt-5 text-sm leading-6 text-[var(--muted)]">
            Receipt file names are recorded as prototype metadata and are not
            downloadable.
          </p>
          {payment.issueNote && (
            <div className="mt-5 rounded-lg bg-red-50 p-4 text-red-800">
              <p className="font-semibold">Payment issue</p>
              <p className="mt-1 text-sm leading-6">{payment.issueNote}</p>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
