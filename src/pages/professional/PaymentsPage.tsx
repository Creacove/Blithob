import { ArrowRight, FileCheck2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
import {
  EmptyState,
  RecordList,
  ResponsiveRecord
} from "../../components/ui";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { formatCurrency, formatDate } from "../../lib/format";
import { paymentMethodLabel } from "../../lib/payment";
import { useProfessionalStore } from "../../store/professionalStore";

export function PaymentsPage() {
  const professional = useProfessionalStore((state) =>
    state.currentProfessional()
  );
  const payments = useProfessionalStore((state) => state.payments);
  const assignments = useProfessionalStore((state) => state.assignments);
  const jobs = useProfessionalStore((state) => state.jobs);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const ownPayments = professional
    ? payments.filter((item) => item.professionalId === professional.id)
    : [];

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Track the manual payment record created for each completed Assignment."
      />
      <SummaryBand
        className="mt-6"
        items={[
          {
            label: "Amount due",
            value: formatCurrency(
              ownPayments
                .filter((item) => item.status === "due")
                .reduce((sum, item) => sum + item.amount, 0)
            ),
            tone: "attention",
            mobilePriority: "primary"
          },
          {
            label: "Scheduled",
            value: ownPayments.filter((item) => item.status === "scheduled")
              .length
          },
          {
            label: "Paid",
            value: ownPayments.filter((item) => item.status === "paid").length,
            tone: "positive",
            mobilePriority: "primary"
          },
          {
            label: "Issues",
            value: ownPayments.filter((item) => item.status === "issue").length,
            tone: "attention"
          }
        ]}
      />

      {ownPayments.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No payment records"
            description="A Payment is created when Admin completes one of your Assignments."
          />
        </div>
      ) : (
        isMobile ? (
          <div className="mt-6 grid gap-3" aria-label="My payments mobile">
            {ownPayments.map((payment) => {
              const assignment = assignments.find(
                (item) => item.id === payment.assignmentId
              );
              const job = jobs.find((item) => item.id === assignment?.jobId);
              return (
                <ResponsiveRecord
                  key={payment.id}
                  to={`/professional/payments/${payment.id}`}
                  ariaLabel={`Open ${job?.title ?? "Assignment payment"} payment mobile`}
                  title={job?.title ?? "Assignment payment"}
                  subtitle={`Due ${formatDate(payment.dueDate)}`}
                  status={<StatusBadge status={payment.status} />}
                  facts={[
                    { label: "Amount", value: formatCurrency(payment.amount) },
                    {
                      label: "Method",
                      value: payment.method
                        ? paymentMethodLabel(payment.method)
                        : "Not recorded"
                    }
                  ]}
                />
              );
            })}
          </div>
        ) : (
          <RecordList className="mt-6" label="My payments">
          {ownPayments.map((payment) => {
            const assignment = assignments.find(
              (item) => item.id === payment.assignmentId
            );
            const job = jobs.find((item) => item.id === assignment?.jobId);
            return (
              <Link
                key={payment.id}
                to={`/professional/payments/${payment.id}`}
                className="grid gap-3 px-4 py-4 transition hover:bg-[var(--surface-subtle)] sm:px-5 lg:grid-cols-[minmax(14rem,1.1fr)_auto_auto_minmax(11rem,0.7fr)_auto] lg:items-center"
              >
                <div>
                  <p className="font-semibold text-[var(--ink)]">
                    {job?.title ?? "Assignment payment"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Due {formatDate(payment.dueDate)}
                  </p>
                </div>
                <p className="font-semibold text-[var(--ink)]">
                  {formatCurrency(payment.amount)}
                </p>
                <StatusBadge status={payment.status} />
                <div className="text-sm text-[var(--muted)]">
                  <p>
                    {payment.method
                      ? paymentMethodLabel(payment.method)
                      : "Method not recorded"}
                  </p>
                  {payment.reference && <p className="mt-1">{payment.reference}</p>}
                  {payment.receiptFileName && (
                    <p className="mt-1 flex items-center gap-1 text-emerald-700">
                      <FileCheck2 size={14} aria-hidden />
                      {payment.receiptFileName}
                    </p>
                  )}
                </div>
                <ArrowRight size={18} className="text-[var(--blue)]" aria-hidden />
              </Link>
            );
          })}
          </RecordList>
        )
      )}
    </div>
  );
}
