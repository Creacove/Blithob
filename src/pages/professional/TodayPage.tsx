import { ArrowRight, Bell, BriefcaseBusiness } from "lucide-react";
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
import { formatDateTime } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";

export function TodayPage() {
  const professional = useProfessionalStore((state) =>
    state.currentProfessional()
  );
  const currentUser = useProfessionalStore((state) => state.currentUser());
  const assignments = useProfessionalStore((state) => state.assignments);
  const jobs = useProfessionalStore((state) => state.jobs);
  const enrolments = useProfessionalStore((state) => state.serviceEnrolments);
  const services = useProfessionalStore((state) => state.services);
  const payments = useProfessionalStore((state) => state.payments);
  const notifications = useProfessionalStore((state) => state.notifications);
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (!professional || !currentUser) return null;

  const ownAssignments = assignments.filter(
    (item) => item.professionalId === professional.id
  );
  const ownEnrolments = enrolments.filter(
    (item) => item.professionalId === professional.id
  );
  const ownPayments = payments.filter(
    (item) => item.professionalId === professional.id
  );
  const ownNotifications = notifications
    .filter((item) => item.recipientUserId === currentUser.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 4);

  const revision = ownAssignments.find((item) =>
    ["changes_requested_by_lead", "changes_requested_by_admin"].includes(
      item.status
    )
  );
  const dueSoon = ownAssignments
    .filter((item) => item.status === "in_progress")
    .sort((left, right) => left.deadline.localeCompare(right.deadline))[0];
  const trainingRevision = ownEnrolments.find((item) =>
    ["changes_requested_by_lead", "changes_requested_by_admin"].includes(
      item.status
    )
  );
  const trainingIncomplete = ownEnrolments.find((item) =>
    ["not_started", "in_progress"].includes(item.status)
  );
  const paymentIssue = ownPayments.find((item) => item.status === "issue");

  const nextAction = revision
    ? {
        title:
          jobs.find((item) => item.id === revision.jobId)?.title ??
          "Assignment revision",
        description: "Review the latest feedback and submit the next version.",
        to: `/professional/work/${revision.id}`,
        status: revision.status
      }
    : dueSoon
      ? {
          title:
            jobs.find((item) => item.id === dueSoon.jobId)?.title ??
            "Assignment",
          description: "Continue the nearest active deadline.",
          to: `/professional/work/${dueSoon.id}`,
          status: dueSoon.status
        }
      : trainingRevision
        ? {
            title:
              services.find((item) => item.id === trainingRevision.serviceId)
                ?.name ?? "Service readiness",
            description: "Update the requested readiness evidence.",
            to: `/professional/training/${trainingRevision.id}`,
            status: trainingRevision.status
          }
        : trainingIncomplete
          ? {
              title:
                services.find(
                  (item) => item.id === trainingIncomplete.serviceId
                )?.name ?? "Service readiness",
              description: "Complete the next readiness requirement.",
              to: `/professional/training/${trainingIncomplete.id}`,
              status: trainingIncomplete.status
            }
          : paymentIssue
            ? {
                title: "Payment issue",
                description:
                  paymentIssue.issueNote ??
                  "Review the payment record and contact the Admin.",
                to: `/professional/payments/${paymentIssue.id}`,
                status: paymentIssue.status
              }
            : undefined;
  const nextActionSection = (
    <Section
      title="Next action"
      description="The highest-priority record that can move forward now."
    >
      {nextAction ? (
        <Link
          to={nextAction.to}
          className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 transition hover:border-blue-200 hover:bg-blue-50"
        >
          <div className="min-w-0">
            <div className="mb-3">
              <StatusBadge status={nextAction.status} />
            </div>
            <p className="font-semibold text-[var(--ink)]">
              {nextAction.title}
            </p>
            <p className="mt-1 text-base leading-6 text-[var(--muted)]">
              {nextAction.description}
            </p>
          </div>
          <ArrowRight
            className="shrink-0 text-[var(--blue)]"
            size={20}
            aria-hidden
          />
        </Link>
      ) : (
        <EmptyState
          title="Nothing needs action"
          description="New work, readiness feedback, and payment issues will appear here."
          action={
            <Link
              to="/professional/work"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--blue)]"
            >
              <BriefcaseBusiness size={16} aria-hidden />
              Open Work
            </Link>
          }
        />
      )}
    </Section>
  );

  return (
    <div>
      <PageHeader
        eyebrow={`${professional.name}'s workspace`}
        title="Today"
        description="One clear next action across your work, readiness, and payments."
      />
      {isMobile && <div className="mt-6">{nextActionSection}</div>}
      <SummaryBand
        className="mt-6"
        items={[
          {
            label: "Active Assignments",
            value: ownAssignments.filter(
              (item) => !["completed", "cancelled"].includes(item.status)
            ).length,
            mobilePriority: "primary"
          },
          {
            label: "Approved Services",
            value: ownEnrolments.filter((item) => item.status === "approved")
              .length,
            tone: "positive",
            mobilePriority: "primary"
          },
          {
            label: "Payments due",
            value: ownPayments.filter((item) => item.status === "due").length,
            tone: "attention",
            mobilePriority: "secondary"
          }
        ]}
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        {!isMobile && nextActionSection}

        <Section title="Recent notifications" mobileDisclosure="collapsed">
          {ownNotifications.length === 0 ? (
            <EmptyState
              title="No recent notifications"
              description="Review decisions and new assignments will appear here."
            />
          ) : (
            <RecordList label="Recent notifications">
              {ownNotifications.map((item) => (
                <div key={item.id} className="flex gap-3 p-4">
                  <Bell
                    size={17}
                    className="mt-1 shrink-0 text-[var(--blue)]"
                    aria-hidden
                  />
                  <div>
                    <p className="font-semibold text-[var(--ink)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                      {item.message}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </RecordList>
          )}
        </Section>
      </div>
    </div>
  );
}
