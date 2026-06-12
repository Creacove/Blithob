import { ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Drawer } from "../../components/Drawer";
import { PageHeader } from "../../components/PageHeader";
import { useToast } from "../../components/ToastProvider";
import {
  Button,
  Field,
  Input,
  RecordList,
  ResponsiveRecord,
  Textarea,
  Toolbar
} from "../../components/ui";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useProfessionalStore } from "../../store/professionalStore";

const emptyRequirement = () => ({
  title: "",
  description: "",
  requiresEvidence: false
});

export function ServicesPage() {
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState([emptyRequirement()]);
  const navigate = useNavigate();
  const { success } = useToast();
  const services = useProfessionalStore((state) => state.services);
  const enrolments = useProfessionalStore(
    (state) => state.serviceEnrolments
  );
  const jobs = useProfessionalStore((state) => state.jobs);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const createService = useProfessionalStore((state) => state.createService);

  const filtered = services.filter((service) =>
    [service.name, service.shortName, service.description]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const validRequirements = requirements.filter(
      (requirement) =>
        requirement.title.trim() && requirement.description.trim()
    );
    if (!name.trim() || !shortName.trim() || !description.trim()) return;
    const id = createService({
      name,
      shortName,
      description,
      requirements: validRequirements
    });
    success("Service created");
    setDrawerOpen(false);
    navigate(`/admin/services/${id}`);
  };

  return (
    <div>
      <PageHeader
        title="Services"
        description="Define the work categories Professionals can become ready to deliver."
      />

      <Toolbar className="mt-6" label="Service controls">
        <label className="relative min-w-0 flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Services"
            className="pl-10"
          />
        </label>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus size={16} aria-hidden="true" />
          New service
        </Button>
      </Toolbar>

      {isMobile ? (
      <div className="mt-4 grid gap-3" aria-label="Service directory mobile">
        {filtered.map((service) => {
          const serviceEnrolments = enrolments.filter(
            (item) => item.serviceId === service.id
          );
          const approved = serviceEnrolments.filter(
            (item) => item.status === "approved"
          ).length;
          const activeJobs = jobs.filter(
            (job) =>
              job.serviceId === service.id &&
              job.publicationState !== "archived"
          ).length;
          return (
            <ResponsiveRecord
              key={service.id}
              to={`/admin/services/${service.id}`}
              ariaLabel={`Open ${service.name} mobile`}
              title={service.name}
              subtitle={service.description}
              status={
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    service.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {service.active ? "Active" : "Inactive"}
                </span>
              }
              facts={[
                { label: "Approved", value: approved },
                { label: "Active Jobs", value: activeJobs }
              ]}
            />
          );
        })}
      </div>
      ) : (
      <RecordList className="mt-4" label="Service directory">
        {filtered.map((service) => {
          const serviceEnrolments = enrolments.filter(
            (item) => item.serviceId === service.id
          );
          const approved = serviceEnrolments.filter(
            (item) => item.status === "approved"
          ).length;
          const activeJobs = jobs.filter(
            (job) =>
              job.serviceId === service.id &&
              job.publicationState !== "archived"
          ).length;
          return (
            <Link
              key={service.id}
              to={`/admin/services/${service.id}`}
              aria-label={`Open ${service.name}`}
              className="grid gap-4 px-4 py-4 transition hover:bg-[var(--surface-subtle)] sm:px-5 lg:grid-cols-[minmax(16rem,1.5fr)_repeat(4,minmax(6rem,0.5fr))_auto] lg:items-center"
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="text-base font-semibold text-[var(--ink)]">
                    {service.name}
                  </strong>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      service.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {service.active ? "Active" : "Inactive"}
                  </span>
                </span>
                <span className="mt-1 block max-w-[58ch] text-sm text-[var(--muted)]">
                  {service.description}
                </span>
              </span>
              <ServiceMetric
                label="Enrolled"
                value={serviceEnrolments.length}
              />
              <ServiceMetric label="Approved" value={approved} />
              <ServiceMetric label="Jobs" value={activeJobs} />
              <ServiceMetric
                label="Requirements"
                value={service.requirements.length}
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

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New service"
        description="Create one Service and its ordered readiness checklist."
        width="wide"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="create-service-form">
              Create service
            </Button>
          </>
        }
      >
        <form
          id="create-service-form"
          className="space-y-6"
          onSubmit={submit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Service name">
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Short name">
              <Input
                value={shortName}
                onChange={(event) => setShortName(event.target.value)}
              />
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-[var(--ink)]">
                  Readiness requirements
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Keep this to the minimum evidence needed before client work.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setRequirements((current) => [
                    ...current,
                    emptyRequirement()
                  ])
                }
              >
                <Plus size={15} aria-hidden="true" />
                Add requirement
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              {requirements.map((requirement, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[var(--border)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      Requirement {index + 1}
                    </p>
                    {requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setRequirements((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index)
                          )
                        }
                        className="grid h-9 w-9 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                        aria-label={`Remove requirement ${index + 1}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3">
                    <Input
                      value={requirement.title}
                      placeholder="Requirement title"
                      onChange={(event) =>
                        setRequirements((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, title: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                    <Textarea
                      value={requirement.description}
                      placeholder="What must the Professional complete?"
                      className="min-h-20"
                      onChange={(event) =>
                        setRequirements((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, description: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                    <label className="flex items-center gap-3 text-sm font-medium text-[var(--ink)]">
                      <input
                        type="checkbox"
                        checked={requirement.requiresEvidence}
                        onChange={(event) =>
                          setRequirements((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    requiresEvidence: event.target.checked
                                  }
                                : item
                            )
                          )
                        }
                      />
                      Requires a link or file
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

function ServiceMetric({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <span className="block text-sm text-[var(--muted)]">{label}</span>
      <strong className="mt-0.5 block text-base font-semibold text-[var(--ink)]">
        {value}
      </strong>
    </span>
  );
}
