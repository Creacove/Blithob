import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { useToast } from "../../components/ToastProvider";
import {
  Button,
  EmptyState,
  Field,
  Input,
  ProgressBar,
  Section
} from "../../components/ui";
import { formatDateTime } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";
import { RouteShell } from "../RouteShell";

type EvidenceDraft = Record<
  string,
  { evidenceLink: string; evidenceFileName: string }
>;

export function TrainingDetailPage() {
  const { enrolmentId } = useParams();
  const professional = useProfessionalStore((state) =>
    state.currentProfessional()
  );
  const enrolment = useProfessionalStore((state) =>
    state.serviceEnrolments.find((item) => item.id === enrolmentId)
  );
  const service = useProfessionalStore((state) =>
    state.services.find((item) => item.id === enrolment?.serviceId)
  );
  const lead = useProfessionalStore((state) =>
    state.professionals.find((item) => item.id === enrolment?.leadId)
  );
  const allReviews = useProfessionalStore((state) => state.readinessReviews);
  const users = useProfessionalStore((state) => state.users);
  const setRequirementProgress = useProfessionalStore(
    (state) => state.setRequirementProgress
  );
  const submitServiceEnrolment = useProfessionalStore(
    (state) => state.submitServiceEnrolment
  );
  const [evidence, setEvidence] = useState<EvidenceDraft>(() =>
    Object.fromEntries(
      (enrolment?.requirements ?? []).map((item) => [
        item.requirementId,
        {
          evidenceLink: item.evidenceLink ?? "",
          evidenceFileName: item.evidenceFileName ?? ""
        }
      ])
    )
  );
  const { success, error } = useToast();

  if (
    !professional ||
    !enrolment ||
    enrolment.professionalId !== professional.id ||
    !service
  ) {
    return (
      <RouteShell
        title="Training not found"
        description="This Service readiness record does not exist or does not belong to your account."
      />
    );
  }

  const reviews = allReviews
    .filter((item) => item.enrolmentId === enrolmentId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const completedCount = enrolment.requirements.filter(
    (item) => item.completed
  ).length;
  const editable = ![
    "waiting_for_lead",
    "waiting_for_admin",
    "approved",
    "paused"
  ].includes(enrolment.status);
  const canSubmit = service.requirements.every((requirement) => {
    const progress = enrolment.requirements.find(
      (item) => item.requirementId === requirement.id
    );
    return (
      progress?.completed &&
      (!requirement.requiresEvidence ||
        progress.evidenceLink ||
        progress.evidenceFileName)
    );
  });

  const toggleRequirement = async (requirementId: string, completed: boolean) => {
    const draft = evidence[requirementId] ?? {
      evidenceLink: "",
      evidenceFileName: ""
    };
    try {
      await setRequirementProgress(enrolment.id, requirementId, {
        completed,
        evidenceLink: draft.evidenceLink,
        evidenceFileName: draft.evidenceFileName
      });
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Readiness progress could not be saved");
    }
  };

  const sendForReview = async () => {
    if (!canSubmit) return;
    try {
      await submitServiceEnrolment(enrolment.id);
      success(
        enrolment.leadId && enrolment.leadId !== professional.id
          ? "Readiness sent to your Lead"
          : "Readiness sent to Admin"
      );
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Readiness could not be sent for review");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Service readiness"
        title={service.name}
        description={service.description}
        actions={
          <>
            <Link
              to="/professional/training"
              className="mobile-header-back inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
            >
              <ArrowLeft size={16} aria-hidden />
              Back to Training
            </Link>
            {editable && (
              <Button disabled={!canSubmit} onClick={sendForReview}>
                Send for review
              </Button>
            )}
          </>
        }
      />

      {enrolment.status === "approved" && (
        <div className="mt-6 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <CheckCircle2 className="mt-0.5 shrink-0" size={20} aria-hidden />
          <div>
            <p className="font-semibold">Approved for future Jobs</p>
            <p className="mt-1 text-base leading-6">
              You are eligible to be matched to {service.name} opportunities.
            </p>
          </div>
        </div>
      )}

      {reviews[0]?.decision === "changes_requested" && (
        <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="font-semibold text-orange-900">Changes requested</p>
          <p className="mt-1 text-base leading-6 text-orange-800">
            {reviews[0].comment}
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]">
        <Section
          title="Readiness checklist"
          description="Complete every ordered requirement and include evidence where requested."
        >
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-[var(--muted)]">
                {completedCount} of {service.requirements.length} complete
              </span>
              <StatusBadge status={enrolment.status} />
            </div>
            <ProgressBar
              value={completedCount}
              max={service.requirements.length}
              label={`${service.name} readiness progress`}
            />
          </div>

          <div className="space-y-4">
            {service.requirements
              .slice()
              .sort((left, right) => left.order - right.order)
              .map((requirement, index) => {
                const progress = enrolment.requirements.find(
                  (item) => item.requirementId === requirement.id
                );
                const draft = evidence[requirement.id] ?? {
                  evidenceLink: progress?.evidenceLink ?? "",
                  evidenceFileName: progress?.evidenceFileName ?? ""
                };
                const hasEvidence =
                  draft.evidenceLink.trim() || draft.evidenceFileName.trim();
                return (
                  <div
                    key={requirement.id}
                    className="rounded-xl border border-[var(--border)] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-semibold text-[var(--blue)]">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-[var(--ink)]">
                              {requirement.title}
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                              {requirement.description}
                            </p>
                          </div>
                          <label className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                            <input
                              type="checkbox"
                              checked={Boolean(progress?.completed)}
                              disabled={
                                !editable ||
                                (requirement.requiresEvidence &&
                                  !progress?.completed &&
                                  !hasEvidence)
                              }
                              onChange={(event) =>
                                toggleRequirement(
                                  requirement.id,
                                  event.target.checked
                                )
                              }
                              className="h-4 w-4 accent-[var(--blue)]"
                            />
                            Complete
                          </label>
                        </div>

                        {requirement.requiresEvidence && (
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <Field label={`${requirement.title} evidence link`}>
                              <Input
                                value={draft.evidenceLink}
                                disabled={!editable}
                                onChange={(event) =>
                                  setEvidence((current) => ({
                                    ...current,
                                    [requirement.id]: {
                                      ...draft,
                                      evidenceLink: event.target.value
                                    }
                                  }))
                                }
                                placeholder="https://..."
                              />
                            </Field>
                            <Field
                              label={`${requirement.title} evidence file name`}
                              hint="Prototype metadata only."
                            >
                              <Input
                                value={draft.evidenceFileName}
                                disabled={!editable}
                                onChange={(event) =>
                                  setEvidence((current) => ({
                                    ...current,
                                    [requirement.id]: {
                                      ...draft,
                                      evidenceFileName: event.target.value
                                    }
                                  }))
                                }
                                placeholder="evidence.pdf"
                              />
                            </Field>
                          </div>
                        )}

                        {progress?.evidenceLink && !editable && (
                          <a
                            href={progress.evidenceLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--blue)]"
                          >
                            Open evidence
                            <ExternalLink size={15} aria-hidden />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Section>

        <div className="space-y-5">
          <Section title="Review route" mobileDisclosure="collapsed">
            <p className="text-sm font-medium text-[var(--muted)]">
              Assigned reviewer
            </p>
            <p className="mt-1 font-semibold text-[var(--ink)]">
              {lead?.name ?? "Direct to Admin"}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {lead
                ? "Your Lead reviews first, then sends certified readiness to Admin."
                : "Admin handles the readiness decision directly."}
            </p>
          </Section>

          <Section title="Feedback timeline" mobileDisclosure="collapsed">
            {reviews.length === 0 ? (
              <EmptyState
                title="No review feedback yet"
                description="Lead and Admin decisions will remain visible here."
              />
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-l-2 border-blue-100 pl-4"
                  >
                    <p className="font-semibold capitalize text-[var(--ink)]">
                      {review.decision.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {users.find(
                        (item) => item.id === review.reviewerUserId
                      )?.name ?? "Reviewer"}{" "}
                      · {formatDateTime(review.createdAt)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
