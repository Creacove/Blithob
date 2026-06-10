import { ArrowRight, Bell, CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
import { Section } from "../../components/ui";
import { formatCurrency, formatDate } from "../../lib/format";
import { useAppStore } from "../../store/appStore";

export function WorkerDashboard() {
  const user = useAppStore((state) => state.currentUser());
  const workers = useAppStore((state) => state.workers);
  const allOpportunities = useAppStore((state) => state.opportunities);
  const allPayouts = useAppStore((state) => state.payouts);
  const allNotifications = useAppStore((state) => state.notifications);
  const worker = workers.find((item) => item.id === user?.workerId);
  const opportunities = allOpportunities.filter(
    (item) => item.assignedWorkerId === user?.workerId
  );
  const payouts = allPayouts.filter((item) => item.workerId === user?.workerId);
  const notifications = allNotifications.filter(
    (item) =>
      item.recipientRole === "worker" &&
      (!item.recipientId || item.recipientId === user?.workerId)
  );
  const active = opportunities.filter((job) =>
    ["assigned", "in_progress", "submitted", "needs_revision", "accepted"].includes(
      job.status
    )
  );
  const next = [...active].sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  const pendingAmount = payouts
    .filter((item) => item.status !== "paid")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div>
      <PageHeader
        eyebrow={worker?.status === "active" ? "Ready for work" : "Training in progress"}
        title={`Hello, ${worker?.name.split(" ")[0] ?? "Worker"}`}
        description="Start with the next action below, then review your work and payment summary."
      />

      <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--ink)] text-white">
        <div className="p-5 sm:p-6">
          <p className="text-sm font-medium text-white/65">Next action</p>
          {next ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={next.status} />
                <span className="inline-flex items-center gap-1.5 text-sm text-white/65">
                  <CalendarClock size={15} /> Due {formatDate(next.deadline)}
                </span>
              </div>
              <h2 className="mt-4 max-w-2xl text-2xl font-semibold leading-8">
                {next.title}
              </h2>
              <p className="mt-2 max-w-[60ch] text-base leading-6 text-white/70">
                {next.expectedOutput}
              </p>
              <Link
                to="/worker/jobs"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-white px-4 text-sm font-semibold text-[var(--ink)]"
              >
                Open assignment <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <p className="mt-2 max-w-[60ch] text-base leading-6 text-white/70">
              No active assignment. New work will appear here when it is
              assigned.
            </p>
          )}
        </div>
      </section>

      <SummaryBand
        className="mt-6"
        items={[
          { value: active.length, label: "Active jobs" },
          {
            value: worker?.completedCount ?? 0,
            label: "Completed jobs",
            tone: "positive"
          },
          {
            value: formatCurrency(pendingAmount),
            label: "Payment pending",
            tone: pendingAmount > 0 ? "attention" : "default"
          }
        ]}
      />

      <div className="mt-6">
        <Section
          title="Recent updates"
          description="The latest changes related to your work."
          action={
            <Link
              to="/worker/notifications"
              className="inline-flex min-h-10 items-center text-sm font-semibold text-[var(--blue)]"
            >
              View all
            </Link>
          }
        >
          <div className="divide-y divide-[var(--border)]">
            {notifications.slice(0, 4).map((item) => (
              <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-[var(--blue)]">
                  <Bell size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                    {item.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
