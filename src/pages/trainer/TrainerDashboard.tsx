import { ArrowRight, BriefcaseBusiness, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
import { Section } from "../../components/ui";
import { formatDate } from "../../lib/format";
import { useAppStore } from "../../store/appStore";

export function TrainerDashboard() {
  const user = useAppStore((state) => state.currentUser());
  const workers = useAppStore((state) => state.workers);
  const opportunities = useAppStore((state) => state.opportunities);
  
  // Only show workers whose training is assigned to this Lead
  const awaiting = workers.filter(
    (worker) =>
      worker.trainingLeadId === user?.workerId &&
      worker.training.some((item) => item.status === "awaiting_review")
  );

  // Only show submissions for opportunities where this Lead is reviewer
  const reviews = opportunities.filter(
    (job) => job.status === "submitted" && job.leadId === user?.workerId
  );

  // Use assignedWorkerIds array for my work
  const myWork = opportunities.filter(
    (job) =>
      job.assignedWorkerIds?.includes(user?.workerId || "") &&
      job.status !== "completed"
  );

  const queue = [
    ...awaiting.map((worker) => ({
      id: worker.id,
      type: "Training readiness",
      title: worker.name,
      detail: "All required training tasks are complete.",
      to: "/trainer/trainees",
      status: "awaiting_review" as const
    })),
    ...reviews.map((job) => ({
      id: job.id,
      type: "Work submission",
      title: job.title,
      detail: `Delivery due ${formatDate(job.deadline)}.`,
      to: "/trainer/reviews",
      status: "submitted" as const
    }))
  ];

  return (
    <div>
      <PageHeader
        eyebrow={`${queue.length} decision${queue.length === 1 ? "" : "s"} waiting`}
        title="Today"
        description="Review assigned worker readiness and submitted work, then keep your own delivery moving."
      />

      <SummaryBand
        className="mt-6"
        items={[
          {
            value: awaiting.length,
            label: "Training reviews",
            tone: "attention"
          },
          {
            value: reviews.length,
            label: "Job reviews",
            tone: "attention"
          },
          {
            value: myWork.length,
            label: "My active jobs"
          }
        ]}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Section
          title="Your review queue"
          description="Training and delivery decisions in one ordered list."
        >
          <div className="divide-y divide-[var(--border)]">
            {queue.length === 0 ? (
              <p className="py-4 text-sm text-[var(--muted)]">
                No decisions waiting in your review queue.
              </p>
            ) : (
              queue.map((item) => (
                <article
                  key={`${item.type}-${item.id}`}
                  className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="text-xs font-medium text-[var(--blue)]">
                      {item.type}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-[var(--ink)]">
                        {item.title}
                      </h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.detail}
                    </p>
                  </div>
                  <Link
                    to={item.to}
                    className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-[var(--blue)]"
                  >
                    Review <ArrowRight size={15} />
                  </Link>
                </article>
              ))
            )}
          </div>
        </Section>

        <Section title="My work" description="Your nearest personal delivery.">
          {myWork.length ? (
            <div>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-[var(--blue)]">
                <BriefcaseBusiness size={17} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-[var(--ink)]">
                {myWork[0].title}
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Due {formatDate(myWork[0].deadline)}
              </p>
              <Link
                to="/trainer/jobs"
                className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-[var(--blue)]"
              >
                Open my work <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="flex gap-3 text-sm leading-6 text-[var(--muted)]">
              <GraduationCap size={18} className="mt-1 shrink-0" />
              You have no personal assignment. Your review queue remains the
              priority.
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
