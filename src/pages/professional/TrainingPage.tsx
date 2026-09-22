import { useEffect, useState } from "react";
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
import { useProfessionalStore } from "../../store/professionalStore";

export function TrainingPage() {
  const backendMode = useProfessionalStore((state) => state.backendMode);
  const isLoading = useProfessionalStore((state) => state.isLoading);
  const refreshRemote = useProfessionalStore((state) => state.refreshRemote);
  const [remoteLoadComplete, setRemoteLoadComplete] = useState(
    backendMode !== "remote"
  );
  const professional = useProfessionalStore((state) =>
    state.currentProfessional()
  );
  const enrolments = useProfessionalStore((state) => state.serviceEnrolments);
  const services = useProfessionalStore((state) => state.services);
  const professionals = useProfessionalStore((state) => state.professionals);
  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    if (backendMode !== "remote") return;
    let active = true;
    void refreshRemote().finally(() => {
      if (active) setRemoteLoadComplete(true);
    });
    return () => {
      active = false;
    };
  }, [backendMode, refreshRemote]);

  const ownEnrolments = professional
    ? enrolments.filter((item) => item.professionalId === professional.id)
    : [];

  return (
    <div>
      <PageHeader
        title="Qualifications"
        description="Complete steps attached to your job applications. Your qualification can count for similar jobs."
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
            label: "Completed",
            value: ownEnrolments.filter((item) => item.status === "approved")
              .length,
            tone: "positive"
          }
        ]}
      />

      {ownEnrolments.length === 0 && backendMode === "remote" && (isLoading || !remoteLoadComplete) ? (
        <p role="status" className="mt-6 text-sm text-[var(--muted)]">
          Loading your qualification steps…
        </p>
      ) : ownEnrolments.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No qualifications needed"
            description="If a job needs extra steps, they will appear with your application."
          />
        </div>
      ) : (
        isMobile ? (
          <div className="mt-6 grid gap-3" aria-label="Qualifications mobile">
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
                  ariaLabel={`Open ${service?.name ?? "job"} qualification mobile`}
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
          <RecordList className="mt-6" label="Qualifications">
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
              <DesktopRecordRow
                key={enrolment.id}
                to={`/professional/training/${enrolment.id}`}
                ariaLabel={`Open ${service?.name ?? "job"} qualification`}
                columns="minmax(15rem,1fr) 9.5rem 10rem minmax(10rem,0.7fr) 1.25rem"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--ink)]">
                    {service?.name ?? "Service"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                    {service?.description}
                  </p>
                </div>
                <div className="min-w-0">
                  <ProgressBar
                    value={complete}
                    max={enrolment.requirements.length}
                    label={`${service?.name ?? "Service"} progress`}
                  />
                  <p className="mt-1.5 text-sm text-[var(--muted)]">
                    {complete} of {enrolment.requirements.length} complete
                  </p>
                </div>
                <div className="min-w-0">
                  <StatusBadge status={enrolment.status} />
                </div>
                <p className="truncate text-sm text-[var(--muted)]">
                  {lead?.name ?? "Direct to Admin"}
                </p>
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
