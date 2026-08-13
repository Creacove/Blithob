import {
  CheckCircle2,
  ExternalLink,
  FileText,
  RotateCcw
} from "lucide-react";
import { useState } from "react";
import { Drawer } from "../../components/Drawer";
import { PageHeader } from "../../components/PageHeader";
import { RecordTimeline } from "../../components/RecordTimeline";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
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
import { formatDate, formatDateTime } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";

const visibleStatuses = [
  "waiting_for_lead",
  "changes_requested_by_lead",
  "waiting_for_admin"
];

export function LeadReviewsPage() {
  const [selectedId, setSelectedId] = useState<string>();
  const [feedback, setFeedback] = useState("");
  const lead = useProfessionalStore((state) => state.currentProfessional());
  const currentUser = useProfessionalStore((state) => state.currentUser());
  const assignments = useProfessionalStore((state) => state.assignments);
  const jobs = useProfessionalStore((state) => state.jobs);
  const professionals = useProfessionalStore((state) => state.professionals);
  const submissions = useProfessionalStore((state) => state.submissions);
  const reviews = useProfessionalStore((state) => state.assignmentReviews);
  const users = useProfessionalStore((state) => state.users);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reviewAssignment = useProfessionalStore(
    (state) => state.reviewAssignment
  );
  const { success, error } = useToast();

  const routedAssignments = lead
    ? assignments
        .filter(
          (assignment) =>
            assignment.leadReviewerId === lead.id &&
            assignment.professionalId !== lead.id &&
            visibleStatuses.includes(assignment.status)
        )
        .sort(
          (left, right) =>
            reviewPriority(left.status) - reviewPriority(right.status) ||
            left.deadline.localeCompare(right.deadline)
        )
    : [];
  const selected = routedAssignments.find(
    (assignment) => assignment.id === selectedId
  );
  const selectedJob = jobs.find((job) => job.id === selected?.jobId);
  const selectedProfessional = professionals.find(
    (professional) => professional.id === selected?.professionalId
  );
  const latestSubmission = submissions
    .filter((submission) => submission.assignmentId === selected?.id)
    .sort((left, right) => right.version - left.version)[0];
  const selectedReviews = reviews
    .filter((review) => review.assignmentId === selected?.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const decide = async (decision: "changes_requested" | "certified") => {
    if (!selected || !currentUser || !feedback.trim()) {
      error("Add clear Lead feedback");
      return;
    }
    try {
      await reviewAssignment({
        assignmentId: selected.id,
        reviewerUserId: currentUser.id,
        reviewerType: "lead",
        decision,
        comment: feedback
      });
      setSelectedId(undefined);
      setFeedback("");
      success(
        decision === "certified"
          ? "Assignment certified for Admin"
          : "Changes requested"
      );
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Assignment review could not be saved");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={`${routedAssignments.length} routed assignment${
          routedAssignments.length === 1 ? "" : "s"
        }`}
        title="Reviews"
        description="Inspect submitted work assigned to you, request precise changes, or certify it for final Admin approval."
      />

      <SummaryBand
        className="mt-6"
        items={[
          {
            label: "Needs review",
            value: routedAssignments.filter(
              (item) => item.status === "waiting_for_lead"
            ).length,
            tone: "attention"
          },
          {
            label: "Waiting on Professional",
            value: routedAssignments.filter(
              (item) => item.status === "changes_requested_by_lead"
            ).length
          },
          {
            label: "With Admin",
            value: routedAssignments.filter(
              (item) => item.status === "waiting_for_admin"
            ).length,
            tone: "positive"
          }
        ]}
      />

      {routedAssignments.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Review queue is clear"
            description="Submitted Assignments routed to you will appear here."
          />
        </div>
      ) : (
        isMobile ? (
          <div className="mt-6 grid gap-3" aria-label="Lead assignment reviews mobile">
            {routedAssignments.map((assignment) => {
              const job = jobs.find((item) => item.id === assignment.jobId);
              const assignee = professionals.find(
                (item) => item.id === assignment.professionalId
              );
              const submission = submissions
                .filter((item) => item.assignmentId === assignment.id)
                .sort((left, right) => right.version - left.version)[0];
              return (
                <ResponsiveRecord
                  key={assignment.id}
                  title={job?.title ?? "Assignment"}
                  subtitle={assignee?.name ?? "Professional"}
                  status={<StatusBadge status={assignment.status} />}
                  facts={[
                    {
                      label: "Deadline",
                      value: formatDate(assignment.deadline)
                    },
                    {
                      label: "Submission",
                      value: submission
                        ? `Version ${submission.version}`
                        : "Awaiting revision"
                    }
                  ]}
                  action={
                    assignment.status === "waiting_for_lead" ? (
                      <Button
                        variant="secondary"
                        aria-label={`Review assignment ${assignment.id}`}
                        onClick={() => setSelectedId(assignment.id)}
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
          <RecordList className="mt-6" label="Lead assignment reviews">
          {routedAssignments.map((assignment) => {
            const job = jobs.find((item) => item.id === assignment.jobId);
            const assignee = professionals.find(
              (item) => item.id === assignment.professionalId
            );
            const submission = submissions
              .filter((item) => item.assignmentId === assignment.id)
              .sort((left, right) => right.version - left.version)[0];

            return (
              <DesktopRecordRow
                key={assignment.id}
                columns="minmax(15rem,1.1fr) 10.5rem 8rem 11rem 10.5rem"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--ink)]">
                    {job?.title ?? "Assignment"}
                  </p>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">
                    {assignee?.name ?? "Professional"}
                  </p>
                </div>
                <div className="min-w-0">
                  <StatusBadge status={assignment.status} />
                  <p className="mt-1 whitespace-nowrap text-xs text-[var(--muted)]">
                    Due {formatDate(assignment.deadline)}
                  </p>
                </div>
                <p className="truncate text-sm text-[var(--muted)]">
                  {submission
                    ? `Version ${submission.version}`
                    : "Awaiting revision"}
                </p>
                <p className="truncate text-sm text-[var(--muted)]">
                  {submission
                    ? formatDateTime(submission.submittedAt)
                    : "No current submission"}
                </p>
                {assignment.status === "waiting_for_lead" ? (
                  <Button
                    variant="secondary"
                    aria-label={`Review assignment ${assignment.id}`}
                    onClick={() => setSelectedId(assignment.id)}
                  >
                    Review
                  </Button>
                ) : (
                  <span className="truncate text-sm font-semibold text-[var(--muted)]">
                    {assignment.status === "changes_requested_by_lead"
                      ? "Waiting for revision"
                      : "Certified for Admin"}
                  </span>
                )}
              </DesktopRecordRow>
            );
          })}
          </RecordList>
        )
      )}

      <Drawer
        open={Boolean(selected)}
        onClose={() => {
          setSelectedId(undefined);
          setFeedback("");
        }}
        title={selectedJob?.title ?? "Review submission"}
        description={`Submission from ${selectedProfessional?.name ?? "Professional"}`}
        width="wide"
        footer={
          selected ? (
            <>
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
                Certify for Admin
              </Button>
            </>
          ) : undefined
        }
      >
        {selected && selectedJob && latestSubmission && (
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
              <ol className="space-y-3">
                {selectedJob.acceptanceCriteria.map((criterion, index) => (
                  <li
                    key={criterion}
                    className="flex gap-3 text-base leading-6 text-[var(--muted)]"
                  >
                    <span className="font-semibold text-[var(--ink)]">
                      {index + 1}.
                    </span>
                    {criterion}
                  </li>
                ))}
              </ol>
            </Section>

            {selectedReviews.length > 0 && (
              <Section title="Previous decisions">
                <RecordTimeline
                  items={selectedReviews.map((review) => ({
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
              </Section>
            )}

            <Field label="Lead feedback">
              <Textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Explain what meets the brief or what must change."
              />
            </Field>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function reviewPriority(status: string) {
  if (status === "waiting_for_lead") return 0;
  if (status === "changes_requested_by_lead") return 1;
  return 2;
}
