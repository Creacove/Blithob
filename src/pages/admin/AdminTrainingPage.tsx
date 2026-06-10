import {
  CheckCircle2,
  Layers3,
  ListChecks,
  Pencil,
  Plus,
  Power,
  ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import {
  Button,
  EmptyState,
  Field,
  Input,
  Section,
  Select,
  Textarea
} from "../../components/ui";
import { useAppStore } from "../../store/appStore";

export function AdminTrainingPage() {
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [serviceId, setServiceId] = useState("service-social");
  const [trackTitle, setTrackTitle] = useState("");
  const [taskOneTitle, setTaskOneTitle] = useState("");
  const [taskOneDescription, setTaskOneDescription] = useState("");
  const [taskTwoTitle, setTaskTwoTitle] = useState("");
  const [taskTwoDescription, setTaskTwoDescription] = useState("");

  // Category Add/Edit modal states
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catShortName, setCatShortName] = useState("");
  const [catDescription, setCatDescription] = useState("");

  const services = useAppStore((state) => state.services);
  const tracks = useAppStore((state) => state.trainingTracks);
  const workers = useAppStore((state) => state.workers);
  const approveTraining = useAppStore((state) => state.approveTraining);
  const toggleService = useAppStore((state) => state.toggleService);
  const addTrainingTrack = useAppStore((state) => state.addTrainingTrack);
  const addServiceCategory = useAppStore((state) => state.addServiceCategory);
  const updateServiceCategory = useAppStore((state) => state.updateServiceCategory);

  const awaiting = workers.flatMap((worker) =>
    worker.training
      .filter((progress) =>
        ["awaiting_review", "lead_approved"].includes(progress.status)
      )
      .map((progress) => ({ worker, progress }))
  );

  const handleEditCategoryClick = (service: typeof services[0]) => {
    setCatName(service.name);
    setCatShortName(service.shortName);
    setCatDescription(service.description);
    setEditCatId(service.id);
  };

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Training"
        description="Define what the business delivers and verify who is ready to deliver it."
        actions={
          <Button onClick={() => setTrackModalOpen(true)}>
            <Plus size={17} /> New training track
          </Button>
        }
      />

      <nav
        aria-label="People sections"
        className="mt-5 flex w-fit gap-1 rounded-xl border border-[var(--border)] bg-white p-1"
      >
        <Link
          to="/admin/workers"
          className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
        >
          Workers
        </Link>
        <Link
          to="/admin/training"
          className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
        >
          Training
        </Link>
      </nav>

      <div className="mt-7 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Section
          title="Service categories"
          description="Active services used for matching and readiness."
          action={
            <Button
              variant="secondary"
              className="text-xs"
              onClick={() => {
                setCatName("");
                setCatShortName("");
                setCatDescription("");
                setAddCatOpen(true);
              }}
            >
              <Plus size={14} /> Add category
            </Button>
          }
        >
          <div className="divide-y divide-slate-100">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-start gap-3 py-4 first:pt-0"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Layers3 size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#102A43]">
                      {service.name}
                    </p>
                    <span
                      className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${
                        service.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {service.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {service.description}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleEditCategoryClick(service)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition"
                    aria-label={`Edit ${service.name}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
                      service.active
                        ? "bg-slate-100 text-slate-500 hover:bg-orange-50 hover:text-orange-700"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                    aria-label={`${service.active ? "Deactivate" : "Activate"} ${service.name}`}
                  >
                    <Power size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Readiness approvals"
          description="Workers who have completed every required training task."
        >
          {awaiting.length === 0 ? (
            <EmptyState
              title="Approval queue is clear"
              description="Completed tracks waiting for a decision will appear here."
            />
          ) : (
            <div className="space-y-3">
              {awaiting.map(({ worker, progress }) => {
                const track = tracks.find((item) => item.id === progress.trackId);
                return (
                  <div
                    key={`${worker.id}-${progress.trackId}`}
                    className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-[#102A43]">
                          {worker.name}
                        </p>
                        <StatusBadge status={progress.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {track?.title} - {progress.completedTaskIds.length}/
                        {track?.tasks.length} tasks
                      </p>
                      {progress.evidenceNote && (
                        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                          {progress.evidenceNote}
                        </p>
                      )}
                    </div>
                    <Button
                      className="text-xs"
                      onClick={() =>
                        approveTraining(worker.id, progress.trackId)
                      }
                    >
                      <ShieldCheck size={16} />{" "}
                      {progress.status === "lead_approved"
                        ? "Final sign-off"
                        : "Approve readiness"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      <div className="mt-6">
        <Section
          title="Training tracks"
          description="Reusable checklists that lead to service approval."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            {tracks.map((track) => {
              const service = services.find(
                (item) => item.id === track.serviceId
              );
              return (
                <article
                  key={track.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#2563EB]">
                        {service?.shortName}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-[#102A43]">
                        {track.title}
                      </h3>
                    </div>
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-[#102A43]">
                      <ListChecks size={18} />
                    </span>
                  </div>
                  <ol className="mt-5 space-y-3">
                    {track.tasks.map((task, index) => (
                      <li key={task.id} className="flex gap-3">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={14} />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[#102A43]">
                            {index + 1}. {task.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {task.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </article>
              );
            })}
          </div>
        </Section>
      </div>

      {/* ── CREATE TRAINING TRACK MODAL ── */}
      <Modal
        open={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        title="Create training track"
        description="Add a reusable two-step readiness checklist for a service."
        wide
      >
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Service category">
              <Select
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Track title">
              <Input
                value={trackTitle}
                onChange={(event) => setTrackTitle(event.target.value)}
                placeholder="e.g. Data accuracy readiness"
              />
            </Field>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
              Step one
            </p>
            <div className="grid gap-4">
              <Field label="Task title">
                <Input
                  value={taskOneTitle}
                  onChange={(event) => setTaskOneTitle(event.target.value)}
                  placeholder="Review service standards"
                />
              </Field>
              <Field label="Task description">
                <Textarea
                  value={taskOneDescription}
                  onChange={(event) =>
                    setTaskOneDescription(event.target.value)
                  }
                  placeholder="Explain what the worker must learn or submit."
                />
              </Field>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
              Step two
            </p>
            <div className="grid gap-4">
              <Field label="Task title">
                <Input
                  value={taskTwoTitle}
                  onChange={(event) => setTaskTwoTitle(event.target.value)}
                  placeholder="Complete a sample task"
                />
              </Field>
              <Field label="Task description">
                <Textarea
                  value={taskTwoDescription}
                  onChange={(event) =>
                    setTaskTwoDescription(event.target.value)
                  }
                  placeholder="Describe the evidence a trainer should review."
                />
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setTrackModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                !trackTitle.trim() ||
                !taskOneTitle.trim() ||
                !taskTwoTitle.trim()
              }
              onClick={() => {
                addTrainingTrack({
                  serviceId,
                  title: trackTitle.trim(),
                  tasks: [
                    {
                      title: taskOneTitle.trim(),
                      description:
                        taskOneDescription.trim() ||
                        "Complete this readiness task."
                    },
                    {
                      title: taskTwoTitle.trim(),
                      description:
                        taskTwoDescription.trim() ||
                        "Submit evidence for trainer review."
                    }
                  ]
                });
                setTrackTitle("");
                setTaskOneTitle("");
                setTaskOneDescription("");
                setTaskTwoTitle("");
                setTaskTwoDescription("");
                setTrackModalOpen(false);
              }}
            >
              Create track
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── ADD SERVICE CATEGORY MODAL ── */}
      <Modal
        open={addCatOpen}
        onClose={() => setAddCatOpen(false)}
        title="Add service category"
        description="Add a new line of service that workers can be trained in."
      >
        <div className="grid gap-5">
          <Field label="Category name">
            <Input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Translation & Localization"
            />
          </Field>
          <Field label="Short name / code">
            <Input
              value={catShortName}
              onChange={(e) => setCatShortName(e.target.value)}
              placeholder="e.g. Translation"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={catDescription}
              onChange={(e) => setCatDescription(e.target.value)}
              placeholder="Describe what tasks this service category covers."
            />
          </Field>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setAddCatOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!catName.trim() || !catShortName.trim() || !catDescription.trim()}
              onClick={() => {
                addServiceCategory({
                  name: catName.trim(),
                  shortName: catShortName.trim(),
                  description: catDescription.trim()
                });
                setAddCatOpen(false);
              }}
            >
              Add category
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT SERVICE CATEGORY MODAL ── */}
      <Modal
        open={Boolean(editCatId)}
        onClose={() => setEditCatId(null)}
        title="Edit service category"
        description="Update the name, short name, or description of this service."
      >
        <div className="grid gap-5">
          <Field label="Category name">
            <Input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Translation & Localization"
            />
          </Field>
          <Field label="Short name / code">
            <Input
              value={catShortName}
              onChange={(e) => setCatShortName(e.target.value)}
              placeholder="e.g. Translation"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={catDescription}
              onChange={(e) => setCatDescription(e.target.value)}
              placeholder="Describe what tasks this service category covers."
            />
          </Field>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setEditCatId(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={!catName.trim() || !catShortName.trim() || !catDescription.trim()}
              onClick={() => {
                if (editCatId) {
                  updateServiceCategory(editCatId, {
                    name: catName.trim(),
                    shortName: catShortName.trim(),
                    description: catDescription.trim()
                  });
                }
                setEditCatId(null);
              }}
            >
              Save changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
