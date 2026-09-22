import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState, Button } from "../../components/ui";
import { PageHeader } from "../../components/PageHeader";
import {
  publicListingsRepository,
  type JobApplicationStatus,
  type PublicApplication,
  type PublicListingsRepository
} from "../../lib/publicListings";
import { useProfessionalStore } from "../../store/professionalStore";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationFilters } from "./ApplicationFilters";
import { AssignmentDrawer } from "./AssignmentDrawer";
import type { ApplicationAction } from "./applicationQueue";

const pageSize = 25;

export function AdminApplicationsPage({
  repository = publicListingsRepository
}: {
  repository?: PublicListingsRepository;
}) {
  const navigate = useNavigate();
  const jobs = useProfessionalStore((state) => state.jobs);
  const [applications, setApplications] = useState<PublicApplication[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [status, setStatus] = useState<"all" | JobApplicationStatus>("all");
  const [jobId, setJobId] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [assignmentApplication, setAssignmentApplication] = useState<PublicApplication | null>(null);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await repository.listAdminApplications({
        status: status === "all" ? undefined : status,
        jobId: jobId === "all" ? undefined : jobId,
        search,
        limit: pageSize,
        offset: 0
      });
      setApplications(rows);
      setTotalCount(rows[0]?.totalCount ?? rows.length);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Applications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [jobId, repository, search, status]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = async () => {
    if (loadingMore || applications.length >= totalCount) return;
    setLoadingMore(true);
    setError(null);
    try {
      const rows = await repository.listAdminApplications({
        status: status === "all" ? undefined : status,
        jobId: jobId === "all" ? undefined : jobId,
        search,
        limit: pageSize,
        offset: applications.length
      });
      setApplications((current) => [...current, ...rows]);
      setTotalCount((current) => rows[0]?.totalCount ?? current);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "More applications could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  };

  const runStatusChange = async (
    application: PublicApplication,
    nextStatus: Extract<JobApplicationStatus, "under_review" | "shortlisted" | "rejected">
  ) => {
    setWorkingId(application.id);
    setError(null);
    try {
      if (nextStatus === "shortlisted") {
        await repository.shortlistApplication({
          applicationId: application.id,
          adminNote: notes[application.id]
        });
      } else {
        await repository.reviewApplication({
          applicationId: application.id,
          status: nextStatus,
          adminNote: notes[application.id]
        });
      }
      await loadFirstPage();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Application status could not be saved.");
    } finally {
      setWorkingId(null);
    }
  };

  const handlePrimary = (application: PublicApplication, action: ApplicationAction) => {
    if (action === "start_review") {
      void runStatusChange(application, "under_review");
      return;
    }
    if (action === "shortlist") {
      void runStatusChange(application, "shortlisted");
      return;
    }
    if (action === "view_readiness") {
      navigate(application.professionalId ? `/admin/people/${application.professionalId}` : "/admin/people");
      return;
    }
    if (action === "create_assignment") {
      setAssignmentApplication(application);
      return;
    }
    if (action === "open_assignment" && application.assignmentId) {
      navigate(`/admin/assignments/${application.assignmentId}`);
    }
  };

  const viewCv = async (application: PublicApplication) => {
    if (!application.cvDocumentId || !repository.getApplicationDocumentUrl) {
      setError("The submitted CV is not available for this application.");
      return;
    }
    const popup = window.open("about:blank", "_blank", "noopener,noreferrer");
    if (!popup) {
      setError("Allow pop-ups to view the submitted CV.");
      return;
    }
    setWorkingId(application.id);
    setError(null);
    try {
      popup.location.href = await repository.getApplicationDocumentUrl(application.id);
    } catch (caught) {
      popup.close();
      setError(caught instanceof Error ? caught.message : "The submitted CV could not be opened.");
    } finally {
      setWorkingId(null);
    }
  };

  const hasFilters = Boolean(search.trim()) || jobId !== "all" || status !== "all";
  const countLabel = loading
    ? "Loading applications…"
    : `${applications.length}${totalCount > applications.length ? ` of ${totalCount}` : ""} application${applications.length === 1 ? "" : "s"}`;

  return (
    <div>
      <PageHeader
        eyebrow="Candidate pipeline"
        title="Applications"
        description="Make one clear decision at a time, then let readiness and assignment states guide the next step."
        actions={
          <Button type="button" variant="secondary" onClick={() => void loadFirstPage()}>
            <RefreshCw size={15} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <div className="mt-6">
        <ApplicationFilters
          search={search}
          jobId={jobId}
          status={status}
          jobs={jobs}
          hasFilters={hasFilters}
          onSearchChange={setSearch}
          onJobChange={setJobId}
          onStatusChange={setStatus}
          onClear={() => {
            setSearch("");
            setJobId("all");
            setStatus("all");
          }}
        />
      </div>

      <p className="mt-4 text-sm text-[var(--muted)]">{countLabel}</p>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] px-5 py-12 text-center text-sm text-[var(--muted)]">
          Loading the candidate queue…
        </div>
      ) : applications.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No applications in this view"
            description="Published roles will send candidate interest here as people apply."
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4">
            {applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                privateNote={notes[application.id] ?? application.adminNote ?? ""}
                working={workingId === application.id}
                onPrivateNoteChange={(value) =>
                  setNotes((current) => ({ ...current, [application.id]: value }))
                }
                onPrimary={(action) => handlePrimary(application, action)}
                onStatusChange={(nextStatus) => void runStatusChange(application, nextStatus)}
                onViewCv={() => void viewCv(application)}
              />
            ))}
          </div>
          {applications.length < totalCount ? (
            <div className="mt-6 flex justify-center">
              <Button type="button" variant="secondary" disabled={loadingMore} onClick={() => void loadMore()}>
                {loadingMore ? "Loading…" : "Load more applications"}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <AssignmentDrawer
        application={assignmentApplication}
        job={jobs.find((job) => job.id === assignmentApplication?.jobId)}
        repository={repository}
        open={Boolean(assignmentApplication)}
        onClose={() => setAssignmentApplication(null)}
        onComplete={() => void loadFirstPage()}
        onStaleRecord={() => {
          setError("This application is no longer ready to assign. The queue has been refreshed.");
          void loadFirstPage();
        }}
      />
    </div>
  );
}

