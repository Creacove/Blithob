import { Check, CheckCircle2, Circle, Clock3 } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";

export function WorkerTrainingPage() {
  const user = useAppStore((state) => state.currentUser());
  const workers = useAppStore((state) => state.workers);
  const worker = workers.find((item) => item.id === user?.workerId);
  const tracks = useAppStore((state) => state.trainingTracks);
  const services = useAppStore((state) => state.services);
  const toggleTask = useAppStore((state) => state.toggleTrainingTask);

  return (
    <div>
      <PageHeader
        eyebrow="Service readiness"
        title="Training"
        description="Complete each checklist item. Finished tracks are sent to a trainer for approval."
      />
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        {worker?.training.map((progress) => {
          const track = tracks.find((item) => item.id === progress.trackId);
          const service = services.find((item) => item.id === track?.serviceId);
          const percent = track
            ? Math.round(
                (progress.completedTaskIds.length / track.tasks.length) * 100
              )
            : 0;
          const locked = progress.status === "approved";
          return (
            <article
              key={progress.trackId}
              className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(16,42,67,0.05)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2563EB]">
                    {service?.name}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[#102A43]">
                    {track?.title}
                  </h2>
                </div>
                <StatusBadge status={progress.status} />
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-[#102A43]">{percent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {track?.tasks.map((task) => {
                  const done = progress.completedTaskIds.includes(task.id);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      disabled={locked}
                      onClick={() =>
                        worker &&
                        toggleTask(worker.id, progress.trackId, task.id)
                      }
                      className={`flex w-full gap-3 rounded-2xl border p-4 text-left transition ${
                        done
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                      } disabled:cursor-default`}
                    >
                      <span
                        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                          done
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {done ? <Check size={14} /> : <Circle size={14} />}
                      </span>
                      <span>
                        <span className="block text-xs font-bold text-[#102A43]">
                          {task.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          {task.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {progress.status === "awaiting_review" && (
                <div className="mt-5 flex gap-3 rounded-2xl bg-violet-50 p-4 text-xs leading-5 text-violet-800">
                  <Clock3 size={17} className="shrink-0" />
                  All tasks are complete. A trainer now needs to approve your
                  service readiness.
                </div>
              )}
              {progress.status === "approved" && (
                <div className="mt-5 flex gap-3 rounded-2xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-800">
                  <CheckCircle2 size={17} className="shrink-0" />
                  You are approved for this service and can be matched to
                  opportunities.
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
