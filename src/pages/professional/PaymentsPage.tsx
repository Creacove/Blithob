import { ArrowRight, FileCheck2 } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
import {
  DesktopRecordRow,
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
              <DesktopRecordRow
                key={payment.id}
                to={`/professional/payments/${payment.id}`}
                ariaLabel={`Open ${job?.title ?? "Assignment payment"} payment`}
                columns="minmax(15rem,1.15fr) 8rem 9.5rem minmax(12rem,0.8fr) 1.25rem"
                className="gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--ink)]">
                    {job?.title ?? "Assignment payment"}
                  </p>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">
                    Due {formatDate(payment.dueDate)}
                  </p>
                </div>
                <p className="font-semibold text-[var(--ink)]">
                  {formatCurrency(payment.amount)}
                </p>
                <div className="min-w-0">
                  <StatusBadge status={payment.status} />
                </div>
                <div className="min-w-0 text-sm text-[var(--muted)]">
                  <p className="truncate">
                    {payment.method
                      ? paymentMethodLabel(payment.method)
                      : "Method not recorded"}
                  </p>
                  {payment.reference && (
                    <p className="mt-1 truncate">{payment.reference}</p>
                  )}
                  {payment.receiptFileName && (
                    <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-emerald-700">
                      <FileCheck2 size={14} aria-hidden />
                      <span className="truncate">{payment.receiptFileName}</span>
                    </p>
                  )}
                </div>
                <ArrowRight size={18} className="text-[var(--blue)]" aria-hidden />
              </DesktopRecordRow>
            );
          })}
          </RecordList>
        )
      )}
    </div>
  );
}
