import {
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  RotateCcw
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Drawer } from "../../components/Drawer";
import { PageHeader } from "../../components/PageHeader";
import { RecordTimeline } from "../../components/RecordTimeline";
import { StatusBadge } from "../../components/StatusBadge";
import { useToast } from "../../components/ToastProvider";
import {
  Button,
  DesktopRecordRow,
  EmptyState,
  Field,
  RecordList,
  ResponsiveRecord,
  Section,
  Textarea
} from "../../components/ui";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { formatDateTime } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";

type Queue = "work" | "readiness";

export function AdminReviewsPage() {
  const [queue, setQueue] = useState<Queue>("work");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>();
  const [selectedEnrolmentId, setSelectedEnrolmentId] = useState<string>();
  const [completeAssignmentId, setCompleteAssignmentId] = useState<string>();
  const [feedback, setFeedback] = useState("");
  const assignments = useProfessionalStore((state) => state.assignments);
  const jobs = useProfessionalStore((state) => state.jobs);
  const professionals = useProfessionalStore((state) => state.professionals);
  const submissions = useProfessionalStore((state) => state.submissions);
  const assignmentReviews = useProfessionalStore(
    (state) => state.assignmentReviews
  );
  const enrolments = useProfessionalStore((state) => state.serviceEnrolments);
  const services = useProfessionalStore((state) => state.services);
  const readinessReviews = useProfessionalStore(
    (state) => state.readinessReviews
  );
  const users = useProfessionalStore((state) => state.users);
  const currentUser = useProfessionalStore((state) => state.currentUser());
  const reviewAssignment = useProfessionalStore(
    (state) => state.reviewAssignment
  );
  const reviewServiceEnrolment = useProfessionalStore(
    (state) => state.reviewServiceEnrolment
  );
  const completeAssignment = useProfessionalStore(
    (state) => state.completeAssignment
  );
  const { success, error } = useToast();

  const workQueue = assignments.filter((assignment) =>
    [
      "waiting_for_admin",
      "approved",
      "changes_requested_by_admin"
    ].includes(assignment.status)
  );
  const readinessQueue = enrolments.filter((enrolment) =>
    ["waiting_for_admin", "changes_requested_by_admin"].includes(
      enrolment.status
    )
  );
  const selectedAssignment = assignments.find(
    (assignment) => assignment.id === selectedAssignmentId
  );
  const selectedJob = jobs.find(
    (job) => job.id === selectedAssignment?.jobId
  );
  const selectedProfessional = professionals.find(
    (professional) =>
      professional.id === selectedAssignment?.professionalId
  );
  const latestSubmission = submissions
    .filter(
      (submission) => submission.assignmentId === selectedAssignment?.id
    )
    .sort((left, right) => right.version - left.version)[0];
  const previousAssignmentReviews = assignmentReviews
    .filter((review) => review.assignmentId === selectedAssignment?.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const selectedEnrolment = enrolments.find(
    (enrolment) => enrolment.id === selectedEnrolmentId
  );
  const selectedService = services.find(
    (service) => service.id === selectedEnrolment?.serviceId
  );
  const selectedReadinessProfessional = professionals.find(
    (professional) =>
      professional.id === selectedEnrolment?.professionalId
  );
  const previousReadinessReviews = readinessReviews
    .filter((review) => review.enrolmentId === selectedEnrolment?.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const decideWork = async (decision: "changes_requested" | "approved") => {
    if (!selectedAssignment || !currentUser || !feedback.trim()) {
      error("Add clear review feedback");
      return;
    }
    try {
      await reviewAssignment({
        assignmentId: selectedAssignment.id,
        reviewerUserId: currentUser.id,
        reviewerType: "admin",
        decision,
        comment: feedback
      });
      setSelectedAssignmentId(undefined);
      setFeedback("");
      success(decision === "approved" ? "Assignment approved" : "Changes requested");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Assignment review could not be saved");
    }
  };

  const decideReadiness = async (
    decision: "changes_requested" | "approved"
  ) => {
    if (!selectedEnrolment || !currentUser || !feedback.trim()) {
      error("Add clear review feedback");
      return;
    }
    try {
      await reviewServiceEnrolment({
        enrolmentId: selectedEnrolment.id,
        reviewerUserId: currentUser.id,
        reviewerType: "admin",
        decision,
        comment: feedback
      });
      setSelectedEnrolmentId(undefined);
      setFeedback("");
      success(decision === "approved" ? "Readiness approved" : "Changes requested");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Readiness review could not be saved");
    }
  };

  const confirmComplete = async () => {
    if (!completeAssignmentId) return;
    try {
      await completeAssignment(completeAssignmentId);
      setCompleteAssignmentId(undefined);
      success("Assignment completed and payment created");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Assignment could not be completed");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={`${workQueue.length + readinessQueue.length} records need Admin attention`}
        title="Reviews"
        description="Resolve each Professional's work or Service readiness as an independent decision."
      />

      <div
        className="mt-6 inline-flex rounded-xl border border-[var(--border)] bg-white p-1"
        role="tablist"
        aria-label="Review queues"
      >
        <QueueTab
          active={queue === "work"}
          label={`Work ${workQueue.length}`}
          onClick={() => setQueue("work")}
        />
        <QueueTab
          active={queue === "readiness"}
          label={`Readiness ${readinessQueue.length}`}
          onClick={() => setQueue("readiness")}
        />
      </div>

      <div className="mt-4">
        {queue === "work" ? (
          <WorkQueue
            assignments={workQueue}
            jobs={jobs}
            professionals={professionals}
            submissions={submissions}
            reviews={assignmentReviews}
            users={users}
            onReview={setSelectedAssignmentId}
            onComplete={setCompleteAssignmentId}
          />
        ) : (
          <ReadinessQueue
            enrolments={readinessQueue}
            services={services}
            professionals={professionals}
            reviews={readinessReviews}
            users={users}
            onReview={setSelectedEnrolmentId}
          />
        )}
      </div>

      <Drawer
        open={Boolean(selectedAssignment)}
        onClose={() => {
          setSelectedAssignmentId(undefined);
          setFeedback("");
        }}
        title={selectedJob?.title ?? "Review work"}
        description={`Submission from ${selectedProfessional?.name ?? "Professional"}`}
        width="wide"
        footer={
          selectedAssignment ? (
            <>
              <Button
                variant="secondary"
                disabled={!feedback.trim()}
                onClick={() => decideWork("changes_requested")}
              >
                <RotateCcw size={16} aria-hidden />
                Request changes
              </Button>
              <Button
                disabled={!feedback.trim()}
                onClick={() => decideWork("approved")}
              >
                <Check size={16} aria-hidden />
                Approve
              </Button>
            </>
          ) : undefined
        }
      >
        {selectedAssignment && selectedJob && latestSubmission && (
          <div className="space-y-6">
            <Section title={`Submission version ${latestSubmission.version}`}>
              <p className="text-base leading-7 text-[var(--muted)]">
                {latestSubmission.notes}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {latestSubmission.link && (
                  <a
                    href={latestSubmission.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-50 px-3 text-sm font-semibold text-blue-700"
                  >
                    <ExternalLink size={15} aria-hidden />
                    Open submitted link
                  </a>
                )}
                {latestSubmission.fileName && (
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--surface-subtle)] px-3 text-sm font-semibold text-[var(--ink)]">
                    <FileText size={15} aria-hidden />
                    {latestSubmission.fileName}
                  </span>
                )}
              </div>
            </Section>
            <Section title="Acceptance criteria">
              <ol className="space-y-2">
                {selectedJob.acceptanceCriteria.map((criterion, index) => (
                  <li key={criterion} className="flex gap-3 text-base leading-6 text-[var(--muted)]">
                    <span className="font-semibold text-[var(--ink)]">
                      {index + 1}.
                    </span>
                    {criterion}
                  </li>
                ))}
              </ol>
            </Section>
            {previousAssignmentReviews.length > 0 && (
              <Section title="Previous reviews">
                <RecordTimeline
                  items={previousAssignmentReviews.map((review) => ({
                    id: review.id,
                    title:
                      review.decision === "changes_requested"
                        ? "Changes requested"
                        : review.decision === "certified"
                          ? "Certified by Lead"
                          : "Approved",
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
              </Section>
            )}
            <Field label="Admin feedback">
              <Textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Explain exactly why this is approved or what must change."
              />
            </Field>
          </div>
        )}
      </Drawer>

      <Drawer
        open={Boolean(selectedEnrolment)}
        onClose={() => {
          setSelectedEnrolmentId(undefined);
          setFeedback("");
        }}
        title={`${selectedService?.name ?? "Service"} readiness`}
        description={`Evidence from ${selectedReadinessProfessional?.name ?? "Professional"}`}
        width="wide"
        footer={
          selectedEnrolment ? (
            <>
              <Button
                variant="secondary"
                disabled={!feedback.trim()}
                onClick={() => decideReadiness("changes_requested")}
              >
                <RotateCcw size={16} aria-hidden />
                Request changes
              </Button>
              <Button
                disabled={!feedback.trim()}
                onClick={() => decideReadiness("approved")}
              >
                <CheckCircle2 size={16} aria-hidden />
                Approve readiness
              </Button>
            </>
          ) : undefined
        }
      >
        {selectedEnrolment && selectedService && (
          <div className="space-y-6">
            <Section title="Requirement evidence">
              <div className="space-y-3">
                {selectedService.requirements.map((requirement, index) => {
                  const progress = selectedEnrolment.requirements.find(
                    (item) => item.requirementId === requirement.id
                  );
                  return (
                    <div
                      key={requirement.id}
                      className="rounded-xl border border-[var(--border)] p-4"
                    >
                      <p className="font-semibold text-[var(--ink)]">
                        {index + 1}. {requirement.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {requirement.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-[var(--blue)]">
                        {progress?.evidenceLink && (
                          <a
                            href={progress.evidenceLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open evidence
                          </a>
                        )}
                        {progress?.evidenceFileName && (
                          <span>{progress.evidenceFileName}</span>
                        )}
                        {!progress?.evidenceLink &&
                          !progress?.evidenceFileName && (
                            <span className="text-[var(--muted)]">
                              Completed without attached evidence
                            </span>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
            {selectedEnrolment.leadCertifiedAt && (
              <Section title="Lead certification">
                <p className="text-base text-[var(--muted)]">
                  Certified {formatDateTime(selectedEnrolment.leadCertifiedAt)}
                </p>
              </Section>
            )}
            {previousReadinessReviews.length > 0 && (
              <Section title="Previous decisions">
                <RecordTimeline
                  items={previousReadinessReviews.map((review) => ({
                    id: review.id,
                    title:
                      review.decision === "changes_requested"
                        ? "Changes requested"
                        : review.decision === "certified"
                          ? "Certified by Lead"
                          : "Approved",
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
              </Section>
            )}
            <Field label="Admin feedback">
              <Textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Explain the readiness decision clearly."
              />
            </Field>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={Boolean(completeAssignmentId)}
        onClose={() => setCompleteAssignmentId(undefined)}
        onConfirm={confirmComplete}
        title="Complete Assignment?"
        description="This completes only this Professional's Assignment and creates one due Payment."
        confirmLabel="Complete assignment"
      />
    </div>
  );
}

function QueueTab({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${
        active
          ? "bg-[var(--ink)] text-white"
          : "text-[var(--muted)] hover:bg-[var(--surface-subtle)]"
      }`}
    >
      {label}
    </button>
  );
}

function WorkQueue({
  assignments,
  jobs,
  professionals,
  submissions,
  reviews,
  users,
  onReview,
  onComplete
}: {
  assignments: ReturnType<typeof useProfessionalStore.getState>["assignments"];
  jobs: ReturnType<typeof useProfessionalStore.getState>["jobs"];
  professionals: ReturnType<
    typeof useProfessionalStore.getState
  >["professionals"];
  submissions: ReturnType<
    typeof useProfessionalStore.getState
  >["submissions"];
  reviews: ReturnType<
    typeof useProfessionalStore.getState
  >["assignmentReviews"];
  users: ReturnType<typeof useProfessionalStore.getState>["users"];
  onReview: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (assignments.length === 0) {
    return (
      <EmptyState
        title="Work queue is clear"
        description="Admin review and completion decisions will appear here."
      />
    );
  }
  return (
    isMobile ? (
      <div className="grid gap-3" aria-label="Work review queue mobile">
        {assignments.map((assignment) => {
          const job = jobs.find((item) => item.id === assignment.jobId);
          const professional = professionals.find(
            (item) => item.id === assignment.professionalId
          );
          const latestSubmission = submissions
            .filter((item) => item.assignmentId === assignment.id)
            .sort((left, right) => right.version - left.version)[0];
          return (
            <ResponsiveRecord
              key={assignment.id}
              title={
                <Link
                  to={`/admin/assignments/${assignment.id}`}
                  className="hover:text-[var(--blue)]"
                >
                  {job?.title ?? "Unknown Job"}
                </Link>
              }
              subtitle={professional?.name ?? "Unknown Professional"}
              status={<StatusBadge status={assignment.status} />}
              facts={[
                {
                  label: "Evidence",
                  value: latestSubmission
                    ? formatDateTime(latestSubmission.submittedAt)
                    : "Awaiting"
                },
                {
                  label: "Route",
                  value: assignment.leadReviewerId ? "Via Lead" : "Direct"
                }
              ]}
              action={
                assignment.status === "waiting_for_admin" ? (
                  <Button
                    variant="secondary"
                    onClick={() => onReview(assignment.id)}
                  >
                    Review
                  </Button>
                ) : assignment.status === "approved" ? (
                  <Button onClick={() => onComplete(assignment.id)}>
                    Complete
                  </Button>
                ) : undefined
              }
            />
          );
        })}
      </div>
    ) : (
      <RecordList label="Work review queue">
      {assignments.map((assignment) => {
        const job = jobs.find((item) => item.id === assignment.jobId);
        const professional = professionals.find(
          (item) => item.id === assignment.professionalId
        );
        const latestSubmission = submissions
          .filter((item) => item.assignmentId === assignment.id)
          .sort((left, right) => right.version - left.version)[0];
        const previousReview = reviews
          .filter((item) => item.assignmentId === assignment.id)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
        const previousReviewer = users.find(
          (user) => user.id === previousReview?.reviewerUserId
        );
        return (
          <DesktopRecordRow
            key={assignment.id}
            columns="minmax(15rem,1.2fr) 10.5rem minmax(11rem,0.8fr) 10.5rem"
            className="gap-3"
          >
            <div className="min-w-0">
              <Link
                to={`/admin/assignments/${assignment.id}`}
                className="block truncate font-semibold text-[var(--ink)] hover:text-[var(--blue)]"
              >
                {job?.title ?? "Unknown Job"}
              </Link>
              <p className="mt-1 truncate text-sm text-[var(--muted)]">
                {professional?.name ?? "Unknown Professional"}
              </p>
            </div>
            <div className="min-w-0">
              <StatusBadge status={assignment.status} />
              <p className="mt-1 truncate text-xs text-[var(--muted)]">
                {previousReviewer
                  ? `Previous: ${previousReviewer.name}`
                  : assignment.leadReviewerId
                    ? "Lead review route"
                    : "Direct Admin route"}
              </p>
            </div>
            <p className="truncate text-sm text-[var(--muted)]">
              {latestSubmission
                ? `Evidence ${formatDateTime(latestSubmission.submittedAt)}`
                : "Awaiting resubmission"}
            </p>
            {assignment.status === "waiting_for_admin" ? (
              <Button variant="secondary" onClick={() => onReview(assignment.id)}>
                Review
              </Button>
            ) : assignment.status === "approved" ? (
              <Button onClick={() => onComplete(assignment.id)}>
                Complete
              </Button>
            ) : (
              <span className="truncate text-sm font-semibold text-orange-700">
                Waiting for resubmission
              </span>
            )}
          </DesktopRecordRow>
        );
      })}
      </RecordList>
    )
  );
}

function ReadinessQueue({
  enrolments,
  services,
  professionals,
  reviews,
  users,
  onReview
}: {
  enrolments: ReturnType<
    typeof useProfessionalStore.getState
  >["serviceEnrolments"];
  services: ReturnType<typeof useProfessionalStore.getState>["services"];
  professionals: ReturnType<
    typeof useProfessionalStore.getState
  >["professionals"];
  reviews: ReturnType<
    typeof useProfessionalStore.getState
  >["readinessReviews"];
  users: ReturnType<typeof useProfessionalStore.getState>["users"];
  onReview: (id: string) => void;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (enrolments.length === 0) {
    return (
      <EmptyState
        title="Readiness queue is clear"
        description="Certified Service readiness will appear here for Admin approval."
      />
    );
  }
  return (
    isMobile ? (
      <div className="grid gap-3" aria-label="Readiness review queue mobile">
        {enrolments.map((enrolment) => {
          const service = services.find((item) => item.id === enrolment.serviceId);
          const professional = professionals.find(
            (item) => item.id === enrolment.professionalId
          );
          return (
            <ResponsiveRecord
              key={enrolment.id}
              title={service?.name ?? "Unknown Service"}
              subtitle={professional?.name ?? "Unknown Professional"}
              status={<StatusBadge status={enrolment.status} />}
              facts={[
                {
                  label: "Evidence updated",
                  value: formatDateTime(enrolment.updatedAt)
                },
                {
                  label: "Route",
                  value: enrolment.leadCertifiedAt ? "Via Lead" : "Direct"
                }
              ]}
              action={
                enrolment.status === "waiting_for_admin" ? (
                  <Button
                    variant="secondary"
                    onClick={() => onReview(enrolment.id)}
                  >
                    Review
                  </Button>
                ) : undefined
              }
            />
          );
        })}
      </div>
    ) : (
      <RecordList label="Readiness review queue">
      {enrolments.map((enrolment) => {
        const service = services.find((item) => item.id === enrolment.serviceId);
        const professional = professionals.find(
          (item) => item.id === enrolment.professionalId
        );
        const previousReview = reviews
          .filter((item) => item.enrolmentId === enrolment.id)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
        const previousReviewer = users.find(
          (user) => user.id === previousReview?.reviewerUserId
        );
        return (
          <DesktopRecordRow
            key={enrolment.id}
            columns="minmax(15rem,1.2fr) 10.5rem minmax(11rem,0.8fr) 10.5rem"
            className="gap-3"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-[var(--ink)]">
                {service?.name ?? "Unknown Service"}
              </p>
              <p className="mt-1 truncate text-sm text-[var(--muted)]">
                {professional?.name ?? "Unknown Professional"}
              </p>
            </div>
            <div className="min-w-0">
              <StatusBadge status={enrolment.status} />
              <p className="mt-1 truncate text-xs text-[var(--muted)]">
                {previousReviewer
                  ? `Previous: ${previousReviewer.name}`
                  : enrolment.leadCertifiedAt
                    ? "Certified by Lead"
                    : "Direct Admin route"}
              </p>
            </div>
            <p className="truncate text-sm text-[var(--muted)]">
              Evidence updated {formatDateTime(enrolment.updatedAt)}
            </p>
            {enrolment.status === "waiting_for_admin" ? (
              <Button variant="secondary" onClick={() => onReview(enrolment.id)}>
                Review
              </Button>
            ) : (
              <span className="truncate text-sm font-semibold text-orange-700">
                Waiting for resubmission
              </span>
            )}
          </DesktopRecordRow>
        );
      })}
      </RecordList>
    )
  );
}
