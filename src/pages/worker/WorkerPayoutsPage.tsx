import { Clock3 } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
import { EmptyState } from "../../components/ui";
import { formatCurrency, formatDate } from "../../lib/format";
import { useAppStore } from "../../store/appStore";

export function WorkerPayoutsPage() {
  const user = useAppStore((state) => state.currentUser());
  const allPayouts = useAppStore((state) => state.payouts);
  const opportunities = useAppStore((state) => state.opportunities);
  const payouts = allPayouts.filter(
    (item) => item.workerId === user?.workerId
  );
  const total = payouts.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Payment records"
        title="Payments"
        description="A transparent history of amounts recorded against completed opportunities."
      />
      <SummaryBand
        className="mt-6"
        items={[
          {
            label: "Total recorded",
            value: formatCurrency(total)
          },
          {
            label: "Payment due",
            value: payouts.filter((item) => item.status === "pending").length,
            tone: "attention"
          },
          {
            label: "Paid records",
            value: payouts.filter((item) => item.status === "paid").length,
            tone: "positive"
          }
        ]}
      />
      <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
        {payouts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No payout records yet"
              description="A payout record is created after Admin completes accepted work."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payouts.map((payout) => {
              const job = opportunities.find(
                (item) => item.id === payout.opportunityId
              );
              return (
                <article
                  key={payout.id}
                  className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="text-sm font-bold text-[#102A43]">
                      {job?.title}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <Clock3 size={14} /> Due {formatDate(payout.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <div className="text-right">
                      <p className="font-[Poppins] text-base font-semibold text-[#102A43]">
                        {formatCurrency(payout.amount)}
                      </p>
                      {payout.reference && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          {payout.reference}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={payout.status} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
