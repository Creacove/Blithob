import { ChevronRight, Plus, Search, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Drawer } from "../../components/Drawer";
import { PageHeader } from "../../components/PageHeader";
import { useToast } from "../../components/ToastProvider";
import {
  Button,
  EmptyState,
  Field,
  Input,
  RecordList,
  Toolbar
} from "../../components/ui";
import { initials } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";

type PeopleFilter = "all" | "professional" | "lead";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  location: ""
};

export function PeoplePage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PeopleFilter>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const navigate = useNavigate();
  const { success } = useToast();
  const professionals = useProfessionalStore((state) => state.professionals);
  const enrolments = useProfessionalStore(
    (state) => state.serviceEnrolments
  );
  const assignments = useProfessionalStore((state) => state.assignments);
  const createProfessional = useProfessionalStore(
    (state) => state.createProfessional
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = professionals.filter((professional) => {
    const matchesQuery =
      !normalizedQuery ||
      [professional.name, professional.email, professional.location].some(
        (value) => value.toLowerCase().includes(normalizedQuery)
      );
    const matchesFilter =
      filter === "all" ||
      (filter === "lead" && professional.isLead) ||
      (filter === "professional" && !professional.isLead);
    return matchesQuery && matchesFilter;
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.location.trim()
    ) {
      return;
    }
    const id = createProfessional(form);
    setDrawerOpen(false);
    setForm(emptyForm);
    success("Professional account created");
    navigate(`/admin/people/${id}`);
  };

  return (
    <div>
      <PageHeader
        title="People"
        description="Manage Professional records, service readiness, work history, and Lead capability."
      />

      <Toolbar className="mt-6" label="People controls">
        <label className="relative min-w-0 flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, or location"
            className="pl-10"
          />
        </label>
        <div
          className="flex rounded-[10px] bg-[var(--surface-subtle)] p-1"
          role="group"
          aria-label="People type"
        >
          {[
            ["all", "All"],
            ["professional", "Professionals"],
            ["lead", "Leads"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value as PeopleFilter)}
              aria-pressed={filter === value}
              className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition ${
                filter === value
                  ? "bg-white text-[var(--ink)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus size={16} aria-hidden="true" />
          Add professional
        </Button>
      </Toolbar>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState
            title="No Professionals found"
            description="Change the search or capability filter to see more people."
          />
        ) : (
          <RecordList label="Professional directory">
            {filtered.map((professional) => {
              const professionalEnrolments = enrolments.filter(
                (item) => item.professionalId === professional.id
              );
              const activeAssignments = assignments.filter(
                (item) =>
                  item.professionalId === professional.id &&
                  !["completed", "cancelled"].includes(item.status)
              ).length;
              const approvedServices = professionalEnrolments.filter(
                (item) => item.status === "approved"
              ).length;

              return (
                <Link
                  key={professional.id}
                  to={`/admin/people/${professional.id}`}
                  aria-label={`Open ${professional.name}`}
                  className="grid gap-4 px-4 py-4 transition hover:bg-[var(--surface-subtle)] sm:px-5 lg:grid-cols-[minmax(15rem,1.35fr)_repeat(4,minmax(6rem,0.55fr))_auto] lg:items-center"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[var(--ink)] text-sm font-semibold text-white">
                      {initials(professional.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <strong className="truncate text-base font-semibold text-[var(--ink)]">
                          {professional.name}
                        </strong>
                        {professional.isLead && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            <UserRoundCheck size={12} aria-hidden="true" />
                            Lead
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-[var(--muted)]">
                        {professional.email} · {professional.location}
                      </span>
                    </span>
                  </span>
                  <Metric
                    label="Enrolments"
                    value={professionalEnrolments.length}
                  />
                  <Metric label="Approved" value={approvedServices} />
                  <Metric label="Active work" value={activeAssignments} />
                  <Metric
                    label="Completed"
                    value={professional.completedAssignmentCount}
                  />
                  <ChevronRight
                    size={18}
                    className="hidden text-[var(--muted)] lg:block"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </RecordList>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add professional"
        description="Create the account first. Service readiness can be assigned from the Professional record."
      >
        <form className="space-y-5" onSubmit={submit}>
          <Field label="Full name">
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value
                }))
              }
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value
                }))
              }
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value
                }))
              }
            />
          </Field>
          <Field label="Location">
            <Input
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  location: event.target.value
                }))
              }
            />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create professional</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <span className="block text-sm text-[var(--muted)]">{label}</span>
      <strong className="mt-0.5 block text-base font-semibold text-[var(--ink)]">
        {value}
      </strong>
    </span>
  );
}
