import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
import {
  EmptyState,
  ProgressBar,
  RecordList,
  ResponsiveRecord
} from "../../components/ui";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useProfessionalStore } from "../../store/professionalStore";

export function TrainingPage() {
  const professional = useProfessionalStore((state) =>
    state.currentProfessional()
  );
  const enrolments = useProfessionalStore((state) => state.serviceEnrolments);
  const services = useProfessionalStore((state) => state.services);
  const professionals = useProfessionalStore((state) => state.professionals);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const ownEnrolments = professional
    ? enrolments.filter((item) => item.professionalId === professional.id)
    : [];

  return (
    <div>
      <PageHeader
        title="Training"
        description="Complete one readiness checklist for each Service you are preparing to deliver."
      />
      <SummaryBand
        className="mt-6"
        items={[
          {
            label: "In progress",
            value: ownEnrolments.filter((item) =>
              [
                "not_started",
                "in_progress",
                "changes_requested_by_lead",
                "changes_requested_by_admin"
              ].includes(item.status)
            ).length
          },
          {
            label: "Waiting for review",
            value: ownEnrolments.filter((item) =>
              ["waiting_for_lead", "waiting_for_admin"].includes(item.status)
            ).length
          },
          {
            label: "Approved Services",
            value: ownEnrolments.filter((item) => item.status === "approved")
              .length,
            tone: "positive"
          }
        ]}
      />

      {ownEnrolments.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No Service training assigned"
            description="An Admin assigns Service readiness from your Professional record."
          />
        </div>
      ) : (
        isMobile ? (
          <div className="mt-6 grid gap-3" aria-label="Service training mobile">
            {ownEnrolments.map((enrolment) => {
              const service = services.find(
                (item) => item.id === enrolment.serviceId
              );
              const complete = enrolment.requirements.filter(
                (item) => item.completed
              ).length;
              return (
                <ResponsiveRecord
                  key={enrolment.id}
                  to={`/professional/training/${enrolment.id}`}
                  ariaLabel={`Open ${service?.name ?? "Service"} training mobile`}
                  title={service?.name ?? "Service"}
                  subtitle={service?.description}
                  status={<StatusBadge status={enrolment.status} />}
                  facts={[
                    {
                      label: "Progress",
                      value: `${complete} of ${enrolment.requirements.length}`
                    },
                    {
                      label: "Review route",
                      value:
                        professionals.find(
                          (item) => item.id === enrolment.leadId
                        )?.name ?? "Direct to Admin"
                    }
                  ]}
                />
              );
            })}
          </div>
        ) : (
          <RecordList className="mt-6" label="Service training">
          {ownEnrolments.map((enrolment) => {
            const service = services.find(
              (item) => item.id === enrolment.serviceId
            );
            const lead = professionals.find(
              (item) => item.id === enrolment.leadId
            );
            const complete = enrolment.requirements.filter(
              (item) => item.completed
            ).length;
            return (
              <Link
                key={enrolment.id}
                to={`/professional/training/${enrolment.id}`}
                className="grid gap-4 px-4 py-4 transition hover:bg-[var(--surface-subtle)] sm:px-5 lg:grid-cols-[minmax(14rem,1fr)_minmax(12rem,0.8fr)_auto_minmax(10rem,0.65fr)_auto] lg:items-center"
              >
                <div>
                  <p className="font-semibold text-[var(--ink)]">
                    {service?.name ?? "Service"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {service?.description}
                  </p>
                </div>
                <div>
                  <ProgressBar
                    value={complete}
                    max={enrolment.requirements.length}
                    label={`${service?.name ?? "Service"} progress`}
                  />
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {complete} of {enrolment.requirements.length} complete
                  </p>
                </div>
                <StatusBadge status={enrolment.status} />
                <p className="text-sm text-[var(--muted)]">
                  {lead?.name ?? "Direct to Admin"}
                </p>
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
