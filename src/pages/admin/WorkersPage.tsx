import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpCircle,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { Button, Field, Input, Select } from "../../components/ui";
import { initials } from "../../lib/format";
import { useAppStore } from "../../store/appStore";

const workerSchema = z.object({
  name: z.string().min(3, "Enter the worker's full name."),
  email: z.email("Enter a valid email address."),
  phone: z.string().min(7, "Enter a contact number."),
  location: z.string().min(2, "Enter a location."),
  trackId: z.string().min(1, "Choose a training track.")
});

type WorkerForm = z.infer<typeof workerSchema>;
type FilterType = "all" | "worker" | "lead";

export function WorkersPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmPromote, setConfirmPromote] = useState(false);

  const workers = useAppStore((state) => state.workers);
  const tracks = useAppStore((state) => state.trainingTracks);
  const services = useAppStore((state) => state.services);
  const addWorker = useAppStore((state) => state.addWorker);
  const promoteToLead = useAppStore((state) => state.promoteToLead);
  const assignTrainingLead = useAppStore((state) => state.assignTrainingLead);

  const leads = workers.filter((w) => w.isLead);

  const form = useForm<WorkerForm>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "",
      trackId: "track-social"
    }
  });

  const filtered = useMemo(
    () =>
      workers.filter((worker) => {
        const matchesQuery = `${worker.name} ${worker.email} ${worker.location}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesFilter =
          filter === "all" ||
          (filter === "lead" && worker.isLead) ||
          (filter === "worker" && !worker.isLead);
        return matchesQuery && matchesFilter;
      }),
    [query, workers, filter]
  );

  const selected = workers.find((worker) => worker.id === selectedId);
  const selectedLeadId = selected?.trainingLeadId ?? "";

  const submit = form.handleSubmit((values) => {
    addWorker(values);
    form.reset();
    setModalOpen(false);
  });

  const filterTabs: Array<{ key: FilterType; label: string; count: number }> =
    [
      { key: "all", label: "All", count: workers.length },
      {
        key: "worker",
        label: "Workers",
        count: workers.filter((w) => !w.isLead).length
      },
      {
        key: "lead",
        label: "Leads",
        count: workers.filter((w) => w.isLead).length
      }
    ];

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Workers"
        description="Manage profiles, readiness, workload, and delivery history."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={17} /> Add worker
          </Button>
        }
      />

      {/* ── Section nav ── */}
      <nav
        aria-label="People sections"
        className="mt-5 flex w-fit gap-1 rounded-xl border border-[var(--border)] bg-white p-1"
      >
        <Link
          to="/admin/workers"
          className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
        >
          Workers
        </Link>
        <Link
          to="/admin/training"
          className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
        >
          Training
        </Link>
      </nav>

      {/* ── Filter tabs ── */}
      <div className="mt-6 flex gap-1 rounded-xl border border-[var(--border)] bg-white p-1 w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === tab.key
                ? "bg-[var(--surface-subtle)] text-[var(--ink)] font-semibold"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                filter === tab.key
                  ? "bg-[var(--ink)] text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="mt-4 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
        <Search size={18} className="text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, or location"
          className="h-12 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-300"
          aria-label="Search workers"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-slate-400"
            aria-label="Clear search"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(16,42,67,0.05)]">
        <div className="hidden grid-cols-[1.25fr_0.65fr_0.8fr_1fr_0.5fr_auto] gap-4 border-b border-slate-100 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 md:grid">
          <span>Worker</span>
          <span>Type</span>
          <span>Status</span>
          <span>Approved services</span>
          <span>Done</span>
          <span />
        </div>
        <div className="divide-y divide-slate-100">
          {filtered.map((worker) => (
            <div
              key={worker.id}
              className="grid gap-4 px-5 py-5 transition hover:bg-slate-50/70 md:grid-cols-[1.25fr_0.65fr_0.8fr_1fr_0.5fr_auto] md:items-center"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#102A43] text-xs font-bold text-white">
                  {initials(worker.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#102A43]">
                    {worker.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {worker.email}
                  </p>
                </div>
              </div>

              {/* Type badge */}
              <span
                className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
                  worker.isLead
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {worker.isLead ? "Lead" : "Worker"}
              </span>

              <StatusBadge
                status={
                  worker.status === "training"
                    ? "in_progress"
                    : worker.status === "ready"
                      ? "approved"
                      : "accepted"
                }
              />

              <p className="text-xs leading-5 text-slate-500">
                {worker.approvedServiceIds.length
                  ? worker.approvedServiceIds
                      .map(
                        (id) =>
                          services.find((service) => service.id === id)
                            ?.shortName
                      )
                      .join(", ")
                  : "Not approved yet"}
              </p>

              <p className="font-[Poppins] text-lg font-semibold text-[#102A43]">
                {worker.completedCount}
              </p>

              <Button
                variant="secondary"
                className="min-h-9 px-3 text-xs"
                onClick={() => {
                  setSelectedId(worker.id);
                  setConfirmPromote(false);
                }}
              >
                View profile
              </Button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              No workers match this filter.
            </div>
          )}
        </div>
      </div>

      {/* ── Add worker modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add a worker"
        description="Create a worker profile and assign the first training track."
      >
        <form onSubmit={submit} className="grid gap-5">
          <Field label="Full name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="e.g. Kemi Adeyemi" />
          </Field>
          <Field
            label="Email address"
            error={form.formState.errors.email?.message}
          >
            <Input
              type="email"
              {...form.register("email")}
              placeholder="name@example.com"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Phone" error={form.formState.errors.phone?.message}>
              <Input {...form.register("phone")} placeholder="+234..." />
            </Field>
            <Field
              label="Location"
              error={form.formState.errors.location?.message}
            >
              <Input
                {...form.register("location")}
                placeholder="City, country"
              />
            </Field>
          </div>
          <Field
            label="First training track"
            error={form.formState.errors.trackId?.message}
          >
            <Select {...form.register("trackId")}>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.title}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create worker</Button>
          </div>
        </form>
      </Modal>

      {/* ── Worker profile modal ── */}
      <Modal
        open={Boolean(selected)}
        onClose={() => {
          setSelectedId(null);
          setConfirmPromote(false);
        }}
        title={selected?.name ?? "Worker profile"}
        description="Profile details, readiness, and management actions."
      >
        {selected && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 rounded-2xl bg-[#F7F8FA] p-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#102A43] text-sm font-bold text-white">
                {initials(selected.name)}
              </span>
              <div>
                <p className="font-[Poppins] text-lg font-semibold text-[#102A43]">
                  {selected.name}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
                      selected.isLead
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {selected.isLead ? "Lead" : "Worker"}
                  </span>
                  <StatusBadge
                    status={
                      selected.status === "training"
                        ? "in_progress"
                        : "approved"
                    }
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3">
                <Mail size={17} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 text-sm text-[#102A43]">{selected.email}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone size={17} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Phone
                  </p>
                  <p className="mt-1 text-sm text-[#102A43]">{selected.phone}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin size={17} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Location
                  </p>
                  <p className="mt-1 text-sm text-[#102A43]">
                    {selected.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Admin notes */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Notes
              </p>
              <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {selected.notes}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
              <div>
                <p className="font-[Poppins] text-2xl font-semibold text-[#102A43]">
                  {selected.completedCount}
                </p>
                <p className="text-xs text-slate-500">Completed jobs</p>
              </div>
              <div>
                <p className="font-[Poppins] text-2xl font-semibold text-[#102A43]">
                  {selected.approvedServiceIds.length}
                </p>
                <p className="text-xs text-slate-500">Approved services</p>
              </div>
            </div>

            {/* Assign training Lead */}
            {leads.length > 0 && (
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap size={16} className="text-slate-400" />
                  <p className="text-sm font-semibold text-[#102A43]">
                    Training Lead
                  </p>
                </div>
                <p className="mb-3 text-xs text-slate-500">
                  Assign a Lead to supervise this worker's training and approve
                  their readiness.
                </p>
                <Select
                  value={selectedLeadId}
                  onChange={(e) => {
                    if (e.target.value) {
                      assignTrainingLead(selected.id, e.target.value);
                    }
                  }}
                >
                  <option value="">No Lead assigned</option>
                  {leads
                    .filter((l) => l.id !== selected.id)
                    .map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name}
                      </option>
                    ))}
                </Select>
              </div>
            )}

            {/* Promote to Lead */}
            {!selected.isLead && (
              <div className="border-t border-slate-100 pt-5">
                {!confirmPromote ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setConfirmPromote(true)}
                  >
                    <ArrowUpCircle size={16} /> Promote to Lead
                  </Button>
                ) : (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-sm font-semibold text-indigo-900">
                      Promote {selected.name} to Lead?
                    </p>
                    <p className="mt-1 text-xs text-indigo-700">
                      They will be able to review work submissions and train
                      other workers, and will access the Lead workspace.
                    </p>
                    <div className="mt-4 flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setConfirmPromote(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          promoteToLead(selected.id);
                          setConfirmPromote(false);
                          setSelectedId(null);
                        }}
                      >
                        Confirm promotion
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
