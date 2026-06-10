import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Filter,
  Plus,
  Sparkles,
  UserCheck,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import {
  Button,
  EmptyState,
  Field,
  Input,
  Select,
  Textarea
} from "../../components/ui";
import type { OpportunityStatus } from "../../domain/types";
import { formatCurrency, formatDate, initials } from "../../lib/format";
import { useAppStore } from "../../store/appStore";

const schema = z.object({
  title: z.string().min(4, "Enter a clear opportunity title."),
  serviceId: z.string().min(1, "Choose a service."),
  description: z.string().min(12, "Add enough context for the worker."),
  steps: z.string(),
  acceptanceCriteria: z.string(),
  expectedOutput: z.string().min(8, "Describe the expected output."),
  deadline: z.string().min(1, "Choose a deadline."),
  payAmount: z.number().min(1000, "Enter a valid worker pay amount."),
  readinessLevel: z.enum(["foundation", "approved"]),
  leadId: z.string().optional()
});

type OpportunityForm = z.infer<typeof schema>;

const statuses: Array<{ value: "all" | OpportunityStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In progress" },
  { value: "submitted", label: "Waiting for review" },
  { value: "needs_revision", label: "Changes requested" },
  { value: "accepted", label: "Approved" },
  { value: "completed", label: "Completed" }
];

export function OpportunitiesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  const opportunities = useAppStore((state) => state.opportunities);
  const services = useAppStore((state) => state.services);
  const workers = useAppStore((state) => state.workers);
  const createOpportunity = useAppStore((state) => state.createOpportunity);
  const assignWorkerToOpportunity = useAppStore(
    (state) => state.assignWorkerToOpportunity
  );
  const removeWorkerFromOpportunity = useAppStore(
    (state) => state.removeWorkerFromOpportunity
  );
  const setLeadForOpportunity = useAppStore(
    (state) => state.setLeadForOpportunity
  );
  const eligibleWorkers = useAppStore((state) => state.eligibleWorkers);

  const form = useForm<OpportunityForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      serviceId: "service-social",
      description: "",
      steps: "",
      acceptanceCriteria: "",
      expectedOutput: "",
      deadline: "2026-06-30",
      payAmount: 120000,
      readinessLevel: "approved",
      leadId: ""
    }
  });

  const leads = useMemo(() => workers.filter((w) => w.isLead), [workers]);

  const filtered = useMemo(
    () =>
      opportunities.filter(
        (job) =>
          (statusFilter === "all" || job.status === statusFilter) &&
          (serviceFilter === "all" || job.serviceId === serviceFilter)
      ),
    [opportunities, serviceFilter, statusFilter]
  );

  const assigning = opportunities.find((job) => job.id === assignId);
  const detailsJob = opportunities.find((job) => job.id === detailsId);
  const matches = assignId ? eligibleWorkers(assignId) : [];

  const getAssignedText = (assignedIds: string[] | undefined) => {
    if (!assignedIds || assignedIds.length === 0) return "Unassigned";
    const assigned = workers.filter((w) => assignedIds.includes(w.id));
    if (assigned.length === 0) return "Unassigned";
    if (assigned.length === 1) return assigned[0].name;
    if (assigned.length === 2) {
      const first1 = assigned[0].name.split(" ")[0];
      const first2 = assigned[1].name.split(" ")[0];
      return `${first1} + ${first2}`;
    }
    const first1 = assigned[0].name.split(" ")[0];
    return `${first1} +${assigned.length - 1}`;
  };

  const submit = form.handleSubmit((values: OpportunityForm) => {
    const criteria = values.acceptanceCriteria
      ? values.acceptanceCriteria
          .split("\n")
          .map((c: string) => c.trim())
          .filter(Boolean)
      : [];
    const id = createOpportunity({
      ...values,
      acceptanceCriteria: criteria,
      leadId: values.leadId || undefined
    });
    form.reset();
    setCreateOpen(false);
    setAssignId(id);
  });

  return (
    <div>
      <PageHeader
        eyebrow="Delivery pipeline"
        title="Jobs"
        description="Create client work, match eligible professionals, and monitor delivery."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={17} /> Create job
          </Button>
        }
      />

      <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
          <Filter size={15} />
          Filter
        </div>
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="sm:max-w-52"
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by service"
          value={serviceFilter}
          onChange={(event) => setServiceFilter(event.target.value)}
          className="sm:max-w-56"
        >
          <option value="all">All services</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </Select>
        <p className="ml-auto px-2 text-xs font-semibold text-slate-400">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(16,42,67,0.05)]">
        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No matching opportunities"
              description="Adjust the filters or create a new opportunity."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((job) => {
              const service = services.find((item) => item.id === job.serviceId);
              return (
                <article
                  key={job.id}
                  className="grid gap-4 p-5 transition hover:bg-slate-50/60 lg:grid-cols-[1.2fr_0.5fr_0.6fr_0.5fr_auto] lg:items-center"
                >
                  <div className="flex gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                      <BriefcaseBusiness size={19} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-bold text-[#102A43]">
                          {job.title}
                        </h2>
                        <StatusBadge status={job.status} />
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
                        {job.description}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Service
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#102A43]">
                      {service?.shortName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Assigned to
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#102A43]">
                      {getAssignedText(job.assignedWorkerIds)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Due
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#102A43]">
                      {formatDate(job.deadline)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 lg:justify-end">
                    <span className="mr-3 font-[Poppins] text-sm font-semibold text-[#102A43]">
                      {formatCurrency(job.payAmount)}
                    </span>
                    <Button
                      variant="secondary"
                      className="min-h-9 px-3 text-xs"
                      onClick={() => setDetailsId(job.id)}
                    >
                      View details
                    </Button>
                    {!["completed", "accepted"].includes(job.status) && (
                      <Button
                        className="min-h-9 px-3 text-xs"
                        onClick={() => setAssignId(job.id)}
                      >
                        Match workers
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create opportunity"
        description="Capture the delivery expectation before selecting workers."
        wide
      >
        <form onSubmit={submit} className="grid gap-5">
          <Field label="Opportunity title" error={form.formState.errors.title?.message}>
            <Input
              {...form.register("title")}
              placeholder="e.g. July social content support"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Service category">
              <Select {...form.register("serviceId")}>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Readiness requirement">
              <Select {...form.register("readinessLevel")}>
                <option value="approved">Service approved</option>
                <option value="foundation">Foundation complete</option>
              </Select>
            </Field>
            <Field label="Job Lead (reviewer)">
              <Select {...form.register("leadId")}>
                <option value="">No Lead (route to Admin)</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label="Work description"
            error={form.formState.errors.description?.message}
          >
            <Textarea
              {...form.register("description")}
              placeholder="Explain the client context and the work to be done."
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Steps"
              hint="Enter each step on a new line."
              error={form.formState.errors.steps?.message}
            >
              <Textarea
                {...form.register("steps")}
                placeholder="1. Research the topic&#13;2. Write first draft&#13;3. Check alignment"
                rows={4}
              />
            </Field>
            <Field
              label="Acceptance criteria"
              hint="Enter one criterion per line."
              error={form.formState.errors.acceptanceCriteria?.message}
            >
              <Textarea
                {...form.register("acceptanceCriteria")}
                placeholder="Word count is between 800 and 1200&#13;At least 3 images included&#13;Format as markdown"
                rows={4}
              />
            </Field>
          </div>
          <Field
            label="Expected output"
            error={form.formState.errors.expectedOutput?.message}
          >
            <Textarea
              {...form.register("expectedOutput")}
              placeholder="List the concrete files, links, or outcomes expected."
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Deadline" error={form.formState.errors.deadline?.message}>
              <Input type="date" {...form.register("deadline")} />
            </Field>
            <Field
              label="Worker pay (NGN)"
              error={form.formState.errors.payAmount?.message}
            >
              <Input
                type="number"
                step="1000"
                {...form.register("payAmount", { valueAsNumber: true })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Save and match <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(assigning)}
        onClose={() => setAssignId(null)}
        title="Match eligible workers"
        description={assigning?.title}
        wide
      >
        {assigning && (
          <div>
            <div className="mb-5 grid gap-4 rounded-2xl bg-[#F7F8FA] p-4 sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Deadline
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#102A43]">
                  <CalendarDays size={15} /> {formatDate(assigning.deadline)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Worker pay
                </p>
                <p className="mt-1 text-sm font-semibold text-[#102A43]">
                  {formatCurrency(assigning.payAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Matching rule
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#102A43]">
                  <Sparkles size={15} /> Readiness + capacity
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Job Lead (reviewer)
                </p>
                <div className="mt-1">
                  <Select
                    value={assigning.leadId ?? ""}
                    onChange={(e) =>
                      setLeadForOpportunity(assigning.id, e.target.value || null)
                    }
                  >
                    <option value="">No Lead (route to Admin)</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {matches.map((match, index) => {
                const isAssigned = assigning.assignedWorkerIds?.includes(
                  match.worker.id
                );
                return (
                  <div
                    key={match.worker.id}
                    className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#102A43] text-xs font-bold text-white">
                      {initials(match.worker.name)}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-[#102A43]">
                          {match.worker.name}
                        </p>
                        {index === 0 && (
                          <span className="rounded-full bg-orange-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-orange-700">
                            Best fit
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {match.reasons.join(" · ")}
                      </p>
                    </div>
                    {isAssigned ? (
                      <Button
                        variant="secondary"
                        className="min-h-10 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        onClick={() =>
                          removeWorkerFromOpportunity(assigning.id, match.worker.id)
                        }
                      >
                        <X size={16} /> Remove
                      </Button>
                    ) : (
                      <Button
                        className="min-h-10 text-xs"
                        onClick={() =>
                          assignWorkerToOpportunity(assigning.id, match.worker.id)
                        }
                      >
                        <UserCheck size={16} /> Assign
                      </Button>
                    )}
                  </div>
                );
              })}
              {matches.length === 0 && (
                <EmptyState
                  title="No eligible workers"
                  description="Approve a worker for this service before assigning the opportunity."
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(detailsJob)}
        onClose={() => setDetailsId(null)}
        title={detailsJob?.title ?? "Job details"}
        description={
          detailsJob
            ? services.find((s) => s.id === detailsJob.serviceId)?.name
            : ""
        }
        wide
      >
        {detailsJob && (
          <div className="space-y-6">
            <div className="grid gap-4 rounded-2xl bg-[#F7F8FA] p-4 sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Status
                </p>
                <div className="mt-1">
                  <StatusBadge status={detailsJob.status} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Deadline
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#102A43]">
                  <CalendarDays size={15} /> {formatDate(detailsJob.deadline)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Worker pay
                </p>
                <p className="mt-1 text-sm font-semibold text-[#102A43]">
                  {formatCurrency(detailsJob.payAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Readiness level
                </p>
                <p className="mt-1 text-sm font-semibold text-[#102A43] capitalize">
                  {detailsJob.readinessLevel}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                Overview
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {detailsJob.description}
              </p>
            </div>

            {detailsJob.steps && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                  Steps
                </h3>
                <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm text-slate-600">
                  {detailsJob.steps.split("\n").map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {detailsJob.acceptanceCriteria &&
              detailsJob.acceptanceCriteria.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                    Acceptance criteria
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {detailsJob.acceptanceCriteria.map((criterion, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <input
                          type="checkbox"
                          disabled
                          checked={false}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                Expected output
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {detailsJob.expectedOutput}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                  Assigned workers
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {workers.filter((w) =>
                    detailsJob.assignedWorkerIds?.includes(w.id)
                  ).length === 0 ? (
                    <span className="text-sm text-slate-400">
                      No workers assigned
                    </span>
                  ) : (
                    workers
                      .filter((w) => detailsJob.assignedWorkerIds?.includes(w.id))
                      .map((w) => (
                        <span
                          key={w.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-[#102A43]"
                        >
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#102A43] text-[9px] font-bold text-white">
                            {initials(w.name)}
                          </span>
                          {w.name}
                        </span>
                      ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                  Job Lead (reviewer)
                </h3>
                <div className="mt-2">
                  {detailsJob.leadId ? (
                    (() => {
                      const lead = workers.find((w) => w.id === detailsJob.leadId);
                      return lead ? (
                        <span className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-600 text-[9px] font-bold text-white">
                            {initials(lead.name)}
                          </span>
                          {lead.name} (Lead)
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">
                          No Lead (routed to admin)
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-sm text-slate-400">
                      No Lead (routed to admin)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
