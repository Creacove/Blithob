import { CheckCircle2, FileCheck2, ShieldCheck } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { Button, EmptyState } from "../../components/ui";
import { useAppStore } from "../../store/appStore";

export function TraineesPage() {
  const workers = useAppStore((state) => state.workers);
  const tracks = useAppStore((state) => state.trainingTracks);
  const leadApproveTraining = useAppStore((state) => state.leadApproveTraining);
  const currentUser = useAppStore((state) => state.currentUser());

  // Filter to only workers whose trainingLeadId matches the current user's workerId
  const trainees = workers.filter(
    (worker) =>
      worker.training.length > 0 &&
      worker.trainingLeadId === currentUser?.workerId
  );

  return (
    <div>
      <PageHeader
        eyebrow="Lead oversight"
        title="My Team"
        description="Inspect checklist evidence and certify workers for final admin sign-off."
      />
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        {trainees.length === 0 ? (
          <EmptyState
            title="No workers assigned"
            description="The admin will assign workers to your training queue."
          />
        ) : (
          trainees.map((worker) => (
            <article
              key={worker.id}
              className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(16,42,67,0.05)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#102A43]">
                    {worker.name}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{worker.location}</p>
                </div>
                <StatusBadge
                  status={worker.status === "training" ? "in_progress" : "approved"}
                />
              </div>
              <div className="mt-5 space-y-5">
                {worker.training.map((progress) => {
                  const track = tracks.find((item) => item.id === progress.trackId);
                  const complete =
                    progress.completedTaskIds.length === track?.tasks.length;
                  return (
                    <div
                      key={progress.trackId}
                      className="rounded-2xl bg-[#F7F8FA] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-[#102A43]">
                          {track?.title}
                        </p>
                        <StatusBadge status={progress.status} />
                      </div>
                      <div className="mt-4 space-y-3">
                        {track?.tasks.map((task) => {
                          const done = progress.completedTaskIds.includes(task.id);
                          return (
                            <div key={task.id} className="flex gap-3">
                              <span
                                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                                  done
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-white text-slate-300"
                                }`}
                              >
                                {done ? (
                                  <CheckCircle2 size={14} />
                                ) : (
                                  <FileCheck2 size={14} />
                                )}
                              </span>
                              <div>
                                <p className="text-xs font-bold text-[#102A43]">
                                  {task.title}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {task.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {progress.status === "awaiting_review" && complete && (
                        <Button
                          className="mt-5 w-full text-xs"
                          onClick={() =>
                            leadApproveTraining(worker.id, progress.trackId)
                          }
                        >
                          <ShieldCheck size={16} /> Certify readiness
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
