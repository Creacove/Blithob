import { ArrowRight, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
import {
  EmptyState,
  RecordList,
  Section
} from "../../components/ui";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { formatDate, formatDateTime } from "../../lib/format";
import type { ActivityEvent } from "../../domain/model";
import { useProfessionalStore } from "../../store/professionalStore";

export function AdminDashboard() {
  const assignments = useProfessionalStore((state) => state.assignments);
  const jobs = useProfessionalStore((state) => state.jobs);
  const professionals = useProfessionalStore((state) => state.professionals);
  const enrolments = useProfessionalStore((state) => state.serviceEnrolments);
  const services = useProfessionalStore((state) => state.services);
  const payments = useProfessionalStore((state) => state.payments);
  const activity = useProfessionalStore((state) => state.activity);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const workReviews = assignments.filter((assignment) =>
    ["waiting_for_admin", "approved"].includes(assignment.status)
  );
  const readinessApprovals = enrolments.filter(
    (enrolment) => enrolment.status === "waiting_for_admin"
  );
  const activeDeadlines = assignments
    .filter(
      (assignment) =>
        !["completed", "cancelled"].includes(assignment.status)
    )
    .sort((left, right) => left.deadline.localeCompare(right.deadline));
  const paymentIssues = payments.filter(
    (payment) => payment.status === "issue"
  );
  const nearestAction =
    workReviews.find((assignment) => assignment.status === "waiting_for_admin") ??
    workReviews[0];
  const nearestActionSection = (
    <Section
      title="Nearest Admin action"
      description="The next record that can move forward with an Admin decision."
    >
      {nearestAction ? (
        <AssignmentAction
          assignment={nearestAction}
          job={jobs.find((job) => job.id === nearestAction.jobId)}
          professional={professionals.find(
            (professional) =>
              professional.id === nearestAction.professionalId
          )}
        />
      ) : readinessApprovals[0] ? (
        <Link
          to="/admin/reviews"
          className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-4 hover:bg-[var(--surface-subtle)]"
        >
          <div>
            <p className="font-semibold text-[var(--ink)]">
              {
                services.find(
                  (service) => service.id === readinessApprovals[0].serviceId
                )?.name
              }{" "}
              readiness
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {
                professionals.find(
                  (professional) =>
                    professional.id === readinessApprovals[0].professionalId
                )?.name
              }
            </p>
          </div>
          <ArrowRight size={18} aria-hidden />
        </Link>
      ) : (
        <EmptyState
          title="No Admin decision is waiting"
          description="New work and readiness submissions will appear here."
        />
      )}
    </Section>
  );

  return (
    <div>
      <PageHeader
        eyebrow={`${workReviews.length + readinessApprovals.length + paymentIssues.length} Admin decisions need attention`}
        title="Today"
        description="Start with the nearest operational decision, then clear reviews, deadlines, and payment issues."
      />

      {isMobile && <div className="mt-6">{nearestActionSection}</div>}

      <SummaryBand
        className="mt-6"
        items={[
          {
            label: "Work reviews",
            value: workReviews.length,
            tone: workReviews.length ? "attention" : "default",
            mobilePriority: "primary"
          },
          {
            label: "Readiness approvals",
            value: readinessApprovals.length,
            tone: readinessApprovals.length ? "attention" : "default",
            mobilePriority: "primary"
          },
          {
            label: "Active deadlines",
            value: activeDeadlines.length,
            mobilePriority: "secondary"
          },
          {
            label: "Payment issues",
            value: paymentIssues.length,
            tone: paymentIssues.length ? "attention" : "default",
            mobilePriority: "secondary"
          }
        ]}
      />

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-5">
          {!isMobile && nearestActionSection}

          <Section
            title="Assignment deadlines"
            description="Nearest active deadlines across individual Assignments."
            mobileDisclosure="expanded"
            action={
              <Link
                to="/admin/jobs"
                className="text-sm font-semibold text-[var(--blue)]"
              >
                Open Jobs
              </Link>
            }
          >
            {activeDeadlines.length === 0 ? (
              <p className="text-base text-[var(--muted)]">
                No active Assignment deadlines.
              </p>
            ) : (
              <RecordList>
                {activeDeadlines.slice(0, 5).map((assignment) => {
                  const job = jobs.find((item) => item.id === assignment.jobId);
                  const professional = professionals.find(
                    (item) => item.id === assignment.professionalId
                  );
                  return (
                    <Link
                      key={assignment.id}
                      to={`/admin/assignments/${assignment.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 hover:bg-[var(--surface-subtle)]"
                    >
                      <div>
                        <p className="font-semibold text-[var(--ink)]">
                          {job?.title}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {professional?.name} - Due{" "}
                          {formatDate(assignment.deadline)}
                        </p>
                      </div>
                      <StatusBadge status={assignment.status} />
                    </Link>
                  );
                })}
              </RecordList>
            )}
          </Section>

          {paymentIssues.length > 0 && (
            <Section title="Payment issues">
              <RecordList>
                {paymentIssues.map((payment) => {
                  const professional = professionals.find(
                    (item) => item.id === payment.professionalId
                  );
                  return (
                    <Link
                      key={payment.id}
                      to={`/admin/payments/${payment.id}`}
                      className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-[var(--surface-subtle)]"
                    >
                      <div>
                        <p className="font-semibold text-[var(--ink)]">
                          {professional?.name}
                        </p>
                        <p className="mt-1 text-sm text-red-700">
                          {payment.issueNote}
                        </p>
                      </div>
                      <ArrowRight size={18} aria-hidden />
                    </Link>
                  );
                })}
              </RecordList>
            </Section>
          )}
        </div>

        <Section
          title="Recent activity"
          description="Latest operational changes."
          mobileDisclosure="collapsed"
        >
          {activity.length === 0 ? (
            <EmptyState
              title="No recent activity yet."
              description="Jobs, assignments, reviews, and payments will appear here as the workspace moves forward."
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {activity.slice(0, 6).map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function activityLinkFor(item: ActivityEvent) {
  if (!item.subjectId) return undefined;
  switch (item.subjectType) {
    case "job":
      return `/admin/jobs/${item.subjectId}`;
    case "assignment":
      return `/admin/assignments/${item.subjectId}`;
    case "payment":
      return `/admin/payments/${item.subjectId}`;
    case "professional":
      return `/admin/people/${item.subjectId}`;
    case "service_enrolment":
      return "/admin/reviews";
    default:
      return undefined;
  }
}

function ActivityRow({ item }: { item: ActivityEvent }) {
  const to = activityLinkFor(item);
  const className = `flex gap-3 py-3 first:pt-0 last:pb-0 ${
    to ? "rounded-lg px-2 transition hover:bg-[var(--surface-subtle)]" : ""
  }`;
  const content = (
    <>
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-subtle)] text-[var(--muted)]">
        <Clock3 size={14} aria-hidden />
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
    </>
  );

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

function AssignmentAction({
  assignment,
  job,
  professional
}: {
  assignment: ReturnType<
    typeof useProfessionalStore.getState
  >["assignments"][number];
  job?: ReturnType<typeof useProfessionalStore.getState>["jobs"][number];
  professional?: ReturnType<
    typeof useProfessionalStore.getState
  >["professionals"][number];
}) {
  return (
    <Link
      to={
        assignment.status === "waiting_for_admin"
          ? "/admin/reviews"
          : `/admin/assignments/${assignment.id}`
      }
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-4 hover:bg-[var(--surface-subtle)]"
    >
      <div>
        <p className="font-semibold text-[var(--ink)]">{job?.title}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {professional?.name} - Due {formatDate(assignment.deadline)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={assignment.status} />
        <ArrowRight size={18} aria-hidden />
      </div>
    </Link>
  );
}
