import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  RotateCcw
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { RecordTimeline } from "../../components/RecordTimeline";
import { StatusBadge } from "../../components/StatusBadge";
import { useToast } from "../../components/ToastProvider";
import {
  Button,
  EmptyState,
  Field,
  MetaList,
  ProgressBar,
  Section,
  Textarea
} from "../../components/ui";
import { formatDateTime } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";
import { RouteShell } from "../RouteShell";

export function TeamDetailPage() {
  const { enrolmentId } = useParams();
  const lead = useProfessionalStore((state) => state.currentProfessional());
  const currentUser = useProfessionalStore((state) => state.currentUser());
  const enrolment = useProfessionalStore((state) =>
    state.serviceEnrolments.find((item) => item.id === enrolmentId)
  );
  const service = useProfessionalStore((state) =>
    state.services.find((item) => item.id === enrolment?.serviceId)
  );
  const member = useProfessionalStore((state) =>
    state.professionals.find(
      (item) => item.id === enrolment?.professionalId
    )
  );
  const reviews = useProfessionalStore((state) => state.readinessReviews);
  const users = useProfessionalStore((state) => state.users);
  const reviewServiceEnrolment = useProfessionalStore(
    (state) => state.reviewServiceEnrolment
  );
  const [feedback, setFeedback] = useState("");
  const { success, error } = useToast();

  if (
    !lead ||
    !enrolment ||
    enrolment.leadId !== lead.id ||
    enrolment.professionalId === lead.id ||
    !service ||
    !member
  ) {
    return (
      <RouteShell
        title="Training review not found"
        description="This readiness record is not assigned to your Team."
      />
    );
  }

  const recordReviews = reviews
    .filter((review) => review.enrolmentId === enrolment.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const completedCount = enrolment.requirements.filter(
    (item) => item.completed
  ).length;
  const canReview = enrolment.status === "waiting_for_lead";

  const decide = async (decision: "changes_requested" | "certified") => {
    if (!currentUser || !feedback.trim()) {
      error("Add clear Lead feedback");
      return;
    }
    try {
      await reviewServiceEnrolment({
        enrolmentId: enrolment.id,
        reviewerUserId: currentUser.id,
        reviewerType: "lead",
        decision,
        comment: feedback
      });
      setFeedback("");
      success(
        decision === "certified"
          ? "Readiness certified for Admin"
          : "Changes requested"
      );
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Readiness review could not be saved");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={`${member.name} · ${member.location}`}
        title={service.name}
        description="Review requirement completion and evidence before making a readiness decision."
        actions={
          <Link
            to="/professional/team"
            className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Team
          </Link>
        }
      />

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]">
        <Section
          title="Requirement evidence"
          description="Check every completed requirement against the Service standard."
        >
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[var(--muted)]">
                {completedCount} of {service.requirements.length} complete
              </p>
              <StatusBadge status={enrolment.status} />
            </div>
            <ProgressBar
              value={completedCount}
              max={service.requirements.length}
              label={`${member.name} readiness progress`}
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
                return (
                  <article
                    key={requirement.id}
                    className="rounded-xl border border-[var(--border)] p-4"
                  >
                    <div className="flex gap-3">
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                          progress?.completed
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {progress?.completed ? (
                          <CheckCircle2 size={16} aria-hidden />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[var(--ink)]">
                          {requirement.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                          {requirement.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {progress?.evidenceLink && (
                            <a
                              href={progress.evidenceLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--blue)]"
                            >
                              <ExternalLink size={15} aria-hidden />
                              Open evidence
                            </a>
                          )}
                          {progress?.evidenceFileName && (
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                              <FileText size={15} aria-hidden />
                              {progress.evidenceFileName}
                            </span>
                          )}
                          {progress?.completed &&
                            !progress.evidenceLink &&
                            !progress.evidenceFileName && (
                              <span className="text-sm text-[var(--muted)]">
                                Completed without attached evidence
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        </Section>

        <div className="space-y-5">
          <Section title="Review status" mobileDisclosure="expanded">
            <MetaList
              items={[
                { label: "Professional", value: member.name },
                {
                  label: "Status",
                  value: <StatusBadge status={enrolment.status} />
                },
                {
                  label: "Last updated",
                  value: formatDateTime(enrolment.updatedAt)
                }
              ]}
            />
          </Section>

          {canReview && (
            <Section
              title="Lead decision"
              description="Specific feedback is required for both outcomes."
            >
              <Field label="Lead feedback">
                <Textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="Explain what meets the standard or what must change."
                />
              </Field>
              <div className="mt-4 grid gap-3">
                <Button
                  variant="secondary"
                  disabled={!feedback.trim()}
                  onClick={() => decide("changes_requested")}
                >
                  <RotateCcw size={16} aria-hidden />
                  Request changes
                </Button>
                <Button
                  disabled={!feedback.trim()}
                  onClick={() => decide("certified")}
                >
                  <CheckCircle2 size={16} aria-hidden />
                  Certify readiness
                </Button>
              </div>
            </Section>
          )}

          <Section title="Decision history" mobileDisclosure="collapsed">
            {recordReviews.length === 0 ? (
              <EmptyState
                title="No decisions recorded"
                description="Lead and Admin feedback will remain visible here."
              />
            ) : (
              <RecordTimeline
                items={recordReviews.map((review) => ({
                  id: review.id,
                  title:
                    review.decision === "changes_requested"
                      ? "Changes requested"
                      : review.decision === "certified"
                        ? "Certified by Lead"
                        : "Approved by Admin",
                  description: review.comment,
                  actor:
                    users.find((user) => user.id === review.reviewerUserId)
                      ?.name ?? "Reviewer",
                  timestamp: review.createdAt,
                  tone:
                    review.decision === "changes_requested"
                      ? "attention"
                      : "positive"
                }))}
              />
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
