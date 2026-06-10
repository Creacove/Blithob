import { ArrowRight, Clock3, Plus, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
import { Section } from "../../components/ui";
import { formatDate, formatDateTime } from "../../lib/format";
import { useAppStore } from "../../store/appStore";

export function AdminDashboard() {
  const workers = useAppStore((state) => state.workers);
  const opportunities = useAppStore((state) => state.opportunities);
  const payouts = useAppStore((state) => state.payouts);
  const activity = useAppStore((state) => state.activity);
  const services = useAppStore((state) => state.services);

  const attention = opportunities
    .filter((job) =>
      ["submitted", "accepted", "needs_revision"].includes(job.status)
    )
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  return (
    <div>
      <PageHeader
        eyebrow={`${attention.length} item${attention.length === 1 ? "" : "s"} need a decision`}
        title="Today"
        description="A focused view of workforce readiness, delivery, review, and payment work."
        actions={
          <>
            <Link
              to="/admin/workers"
              className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
            >
              <UserPlus size={16} />
              Add worker
            </Link>
            <Link
              to="/admin/opportunities"
              className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-[var(--blue)] px-4 text-sm font-semibold text-white hover:bg-[var(--blue-hover)]"
            >
              <Plus size={16} />
              Create job
            </Link>
          </>
        }
      />

      <SummaryBand
        className="mt-6"
        items={[
          {
            value: workers.filter((worker) => worker.status === "training").length,
            label: "Workers in training"
          },
          {
            value: workers.filter((worker) => worker.status === "ready").length,
            label: "Workers ready for jobs",
            tone: "positive"
          },
          {
            value: opportunities.filter((job) =>
              ["assigned", "in_progress", "needs_revision"].includes(job.status)
            ).length,
            label: "Active jobs"
          },
          {
            value: opportunities.filter((job) => job.status === "submitted")
              .length,
            label: "Jobs awaiting review",
            tone: "attention"
          },
          {
            value: payouts.filter((payout) => payout.status === "pending").length,
            label: "Payments due",
            tone: "attention"
          }
        ]}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Section
          title="Review and resolve"
          description="Items are ordered by deadline so the next decision is clear."
          action={
            <Link
              to="/admin/reviews"
              className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-[var(--blue)]"
            >
              Open reviews <ArrowRight size={15} />
            </Link>
          }
        >
          <div className="divide-y divide-[var(--border)]">
            {attention.map((job) => (
              <article
                key={job.id}
                className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-[var(--ink)]">
                      {job.title}
                    </h3>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {
                      services.find((service) => service.id === job.serviceId)
                        ?.shortName
                    }{" "}
                    · Due {formatDate(job.deadline)}
                  </p>
                </div>
                <Link
                  to="/admin/reviews"
                  className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-[var(--blue)]"
                >
                  Review job <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Recent activity" description="Latest changes across the team.">
          <div className="divide-y divide-[var(--border)]">
            {activity.slice(0, 5).map((item) => (
              <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-subtle)] text-[var(--muted)]">
                  <Clock3 size={14} />
                </span>
                <div>
                  <p className="text-sm leading-5 text-[var(--muted)]">
                    <strong className="font-semibold text-[var(--ink)]">
                      {item.actor}
                    </strong>{" "}
                    {item.action}{" "}
                    <strong className="font-medium text-[var(--ink)]">
                      {item.subject}
                    </strong>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(item.createdAt)}
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
