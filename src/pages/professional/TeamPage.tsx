import { ArrowRight } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
import {
  DesktopRecordRow,
  EmptyState,
  ProgressBar,
  RecordList,
  ResponsiveRecord
} from "../../components/ui";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { formatDate } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";

export function TeamPage() {
  const lead = useProfessionalStore((state) => state.currentProfessional());
  const enrolments = useProfessionalStore((state) => state.serviceEnrolments);
  const professionals = useProfessionalStore((state) => state.professionals);
  const services = useProfessionalStore((state) => state.services);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const assignedEnrolments = lead
    ? enrolments
        .filter(
          (enrolment) =>
            enrolment.leadId === lead.id &&
            enrolment.professionalId !== lead.id
        )
        .sort(
          (left, right) =>
            statusPriority(left.status) - statusPriority(right.status) ||
            right.updatedAt.localeCompare(left.updatedAt)
        )
    : [];

  return (
    <div>
      <PageHeader
        eyebrow={`${assignedEnrolments.length} assigned readiness record${
          assignedEnrolments.length === 1 ? "" : "s"
        }`}
        title="Team"
        description="Track Service readiness, inspect evidence, and move completed training to Admin approval."
      />

      <SummaryBand
        className="mt-6"
        items={[
          {
            label: "Needs review",
            value: assignedEnrolments.filter(
              (item) => item.status === "waiting_for_lead"
            ).length,
            tone: "attention"
          },
          {
            label: "In progress",
            value: assignedEnrolments.filter((item) =>
              [
                "not_started",
                "in_progress",
                "changes_requested_by_lead"
              ].includes(item.status)
            ).length
          },
          {
            label: "With Admin",
            value: assignedEnrolments.filter(
              (item) => item.status === "waiting_for_admin"
            ).length
          },
          {
            label: "Approved",
            value: assignedEnrolments.filter(
              (item) => item.status === "approved"
            ).length,
            tone: "positive"
          }
        ]}
      />

      {assignedEnrolments.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No readiness records assigned"
            description="Admin-assigned Service enrolments will appear here for supervision."
          />
        </div>
      ) : (
        isMobile ? (
          <div className="mt-6 grid gap-3" aria-label="Team readiness records mobile">
            {assignedEnrolments.map((enrolment) => {
              const member = professionals.find(
                (item) => item.id === enrolment.professionalId
              );
              const service = services.find(
                (item) => item.id === enrolment.serviceId
              );
              const complete = enrolment.requirements.filter(
                (item) => item.completed
              ).length;
              return (
                <ResponsiveRecord
                  key={enrolment.id}
                  to={`/professional/team/${enrolment.id}`}
                  ariaLabel={`Open ${member?.name ?? "Professional"} readiness mobile`}
                  title={member?.name ?? "Professional"}
                  subtitle={service?.name ?? "Service"}
                  status={<StatusBadge status={enrolment.status} />}
                  facts={[
                    {
                      label: "Progress",
                      value: `${complete} of ${enrolment.requirements.length}`
                    },
                    {
                      label: "Updated",
                      value: formatDate(enrolment.updatedAt)
                    }
                  ]}
                />
              );
            })}
          </div>
        ) : (
          <RecordList className="mt-6" label="Team readiness records">
          {assignedEnrolments.map((enrolment) => {
            const member = professionals.find(
              (item) => item.id === enrolment.professionalId
            );
            const service = services.find(
              (item) => item.id === enrolment.serviceId
            );
            const complete = enrolment.requirements.filter(
              (item) => item.completed
            ).length;

            return (
              <DesktopRecordRow
                key={enrolment.id}
                to={`/professional/team/${enrolment.id}`}
                ariaLabel={`Open ${member?.name ?? "Professional"} readiness`}
                columns="minmax(11rem,0.9fr) minmax(14rem,1.1fr) 10rem 9.5rem minmax(9rem,0.7fr) 1.25rem"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--ink)]">
                    {member?.name ?? "Professional"}
                  </p>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">
                    {member?.location}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--ink)]">
                    {service?.name ?? "Service"}
                  </p>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">
                    {service?.shortName}
                  </p>
                </div>
                <div className="min-w-0">
                  <ProgressBar
                    value={complete}
                    max={enrolment.requirements.length}
                    label={`${member?.name ?? "Professional"} readiness progress`}
                  />
                  <p className="mt-1.5 text-sm text-[var(--muted)]">
                    {complete} of {enrolment.requirements.length} complete
                  </p>
                </div>
                <div className="min-w-0">
                  <StatusBadge status={enrolment.status} />
                </div>
                <p className="truncate text-sm text-[var(--muted)]">
                  Updated {formatDate(enrolment.updatedAt)}
                </p>
                <ArrowRight
                  size={18}
                  className="text-[var(--blue)]"
                  aria-hidden
                />
              </DesktopRecordRow>
            );
          })}
          </RecordList>
        )
      )}
    </div>
  );
}

function statusPriority(status: string) {
  if (status === "waiting_for_lead") return 0;
  if (status === "changes_requested_by_lead") return 1;
  if (status === "waiting_for_admin") return 2;
  if (status === "in_progress" || status === "not_started") return 3;
  return 4;
}
