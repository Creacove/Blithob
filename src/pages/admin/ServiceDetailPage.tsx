import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BriefcaseBusiness,
  Plus,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { useToast } from "../../components/ToastProvider";
import {
  Button,
  DesktopRecordRow,
  EmptyState,
  Field,
  Input,
  RecordList,
  Section,
  Textarea
} from "../../components/ui";
import { formatDate } from "../../lib/format";
import {
  type ServiceRequirementInput,
  useProfessionalStore
} from "../../store/professionalStore";
import { RouteShell } from "../RouteShell";

export function ServiceDetailPage() {
  const { serviceId } = useParams();
  const service = useProfessionalStore((state) =>
    state.services.find((item) => item.id === serviceId)
  );
  const enrolments = useProfessionalStore(
    (state) => state.serviceEnrolments
  );
  const professionals = useProfessionalStore((state) => state.professionals);
  const jobs = useProfessionalStore((state) => state.jobs);
  const updateService = useProfessionalStore((state) => state.updateService);
  const replaceRequirements = useProfessionalStore(
    (state) => state.replaceServiceRequirements
  );
  const setServiceActive = useProfessionalStore(
    (state) => state.setServiceActive
  );
  const getJobStatus = useProfessionalStore(
    (state) => state.jobOperationalStatus
  );
  const { success, error } = useToast();
  const [activationConfirmOpen, setActivationConfirmOpen] = useState(false);
  const [overview, setOverview] = useState(() => ({
    name: service?.name ?? "",
    shortName: service?.shortName ?? "",
    description: service?.description ?? ""
  }));
  const [requirements, setRequirements] = useState<ServiceRequirementInput[]>(
    () =>
      service?.requirements.map((requirement) => ({
        id: requirement.id,
        title: requirement.title,
        description: requirement.description,
        requiresEvidence: requirement.requiresEvidence
      })) ?? []
  );

  if (!service) {
    return (
      <RouteShell
        title="Service not found"
        description="The requested Service record does not exist."
      />
    );
  }

  const serviceEnrolments = enrolments.filter(
    (item) => item.serviceId === service.id
  );
  const approved = serviceEnrolments.filter(
    (item) => item.status === "approved"
  );
  const serviceJobs = jobs.filter((item) => item.serviceId === service.id);

  const saveOverview = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateService(service.id, overview);
      success("Service overview saved");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Service overview could not be saved");
    }
  };

  const saveRequirements = async () => {
    const valid = requirements.filter(
      (requirement) =>
        requirement.title.trim() && requirement.description.trim()
    );
    try {
      await replaceRequirements(service.id, valid);
      setRequirements(valid);
      success("Readiness requirements saved");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Readiness requirements could not be saved");
    }
  };

  const moveRequirement = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= requirements.length) return;
    setRequirements((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const toggleActive = async () => {
    setActivationConfirmOpen(false);
    try {
      const changed = await setServiceActive(service.id, !service.active);
      if (changed) {
        success(service.active ? "Service deactivated" : "Service activated");
      } else {
        error("Resolve open Jobs or unfinished readiness before deactivating");
      }
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Service status could not be saved");
    }
  };

  return (
    <div>
      <PageHeader
        title={service.name}
        description={`${service.active ? "Active" : "Inactive"} Service - ${service.requirements.length} readiness requirements`}
        actions={
          <Link
            to="/admin/services"
            className="mobile-header-back inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Services
          </Link>
        }
      />

      <div className="mt-6 grid gap-5">
        <Section
          title="Overview"
          description="The Service name and purpose shown across readiness and Jobs."
          mobileDisclosure="collapsed"
          action={
            <Button
              variant={service.active ? "secondary" : "primary"}
              onClick={() => setActivationConfirmOpen(true)}
            >
              {service.active ? "Deactivate" : "Activate"}
            </Button>
          }
        >
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={saveOverview}>
            <Field label="Service name">
              <Input
                value={overview.name}
                onChange={(event) =>
                  setOverview((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
              />
            </Field>
            <Field label="Short name">
              <Input
                value={overview.shortName}
                onChange={(event) =>
                  setOverview((current) => ({
                    ...current,
                    shortName: event.target.value
                  }))
                }
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea
                value={overview.description}
                onChange={(event) =>
                  setOverview((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                className="min-h-32"
              />
            </Field>
            <div className="sm:col-span-2 sm:text-right">
              <Button type="submit">Save overview</Button>
            </div>
          </form>
        </Section>

        <Section
          title="Readiness requirements"
          description="One ordered checklist used by every Professional enrolled in this Service."
          mobileDisclosure="expanded"
          action={
            <Button
              variant="secondary"
              onClick={() =>
                setRequirements((current) => [
                  ...current,
                  {
                    title: "",
                    description: "",
                    requiresEvidence: false
                  }
                ])
              }
            >
              <Plus size={15} aria-hidden="true" />
              Add requirement
            </Button>
          }
        >
          <div className="space-y-3">
            {requirements.map((requirement, index) => (
              <div
                key={requirement.id ?? `new-${index}`}
                className="grid gap-3 rounded-xl border border-[var(--border)] p-4 sm:grid-cols-[auto_1fr_auto]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                  {index + 1}
                </span>
                <div className="grid gap-3">
                  <Input
                    value={requirement.title}
                    aria-label={`Requirement ${index + 1} title`}
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
                    aria-label={`Requirement ${index + 1} description`}
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
                <div className="flex gap-1 sm:flex-col">
                  <IconButton
                    label={`Move requirement ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => moveRequirement(index, -1)}
                  >
                    <ArrowUp size={15} />
                  </IconButton>
                  <IconButton
                    label={`Move requirement ${index + 1} down`}
                    disabled={index === requirements.length - 1}
                    onClick={() => moveRequirement(index, 1)}
                  >
                    <ArrowDown size={15} />
                  </IconButton>
                  <IconButton
                    label={`Remove requirement ${index + 1}`}
                    onClick={() =>
                      setRequirements((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                    tone="danger"
                  >
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveRequirements}>Save requirements</Button>
          </div>
        </Section>

        <Section
          title="Enrolled Professionals"
          description="Everyone with an active readiness record for this Service."
          mobileDisclosure="collapsed"
        >
          {serviceEnrolments.length === 0 ? (
            <EmptyState
              title="No enrolments"
              description="Enrol Professionals from their People record."
            />
          ) : (
            <RecordList>
              {serviceEnrolments.map((enrolment) => {
                const professional = professionals.find(
                  (item) => item.id === enrolment.professionalId
                );
                return (
                  <div
                    key={enrolment.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
                  >
                    <div>
                      <p className="font-semibold text-[var(--ink)]">
                        {professional?.name ?? "Unknown Professional"}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {enrolment.requirements.filter((item) => item.completed)
                          .length}{" "}
                        of {enrolment.requirements.length} complete
                      </p>
                    </div>
                    <StatusBadge status={enrolment.status} />
                  </div>
                );
              })}
            </RecordList>
          )}
        </Section>

        <Section
          title="Approved Professionals"
          description="Professionals eligible for future Jobs in this Service."
          mobileDisclosure="collapsed"
        >
          {approved.length === 0 ? (
            <EmptyState
              title="No approved Professionals"
              description="Admin-approved readiness records will appear here."
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {approved.map((enrolment) => (
                <Link
                  key={enrolment.id}
                  to={`/admin/people/${enrolment.professionalId}`}
                  className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
                >
                  {
                    professionals.find(
                      (item) => item.id === enrolment.professionalId
                    )?.name
                  }
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section
          title="Jobs"
          description="Jobs that use this Service."
          mobileDisclosure="collapsed"
        >
          {serviceJobs.length === 0 ? (
            <EmptyState
              title="No Jobs"
              description="Create a Job and select this Service to see it here."
            />
          ) : (
            <RecordList>
              {serviceJobs.map((job) => (
                <DesktopRecordRow
                  key={job.id}
                  to={`/admin/jobs/${job.id}`}
                  ariaLabel={`Open ${job.title}`}
                  columns="minmax(12rem,1fr) 8.5rem 4rem"
                  layoutAt="md"
                  className="gap-3"
                >
                  <div className="min-w-0">
                    <p className="flex min-w-0 items-center gap-2 font-semibold text-[var(--ink)]">
                      <BriefcaseBusiness size={16} aria-hidden="true" />
                      <span className="truncate">{job.title}</span>
                    </p>
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">
                      Due {formatDate(job.deadline)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <StatusBadge status={getJobStatus(job.id)} />
                  </div>
                  <span className="text-sm font-semibold text-[var(--blue)]">
                    Open
                  </span>
                </DesktopRecordRow>
              ))}
            </RecordList>
          )}
        </Section>
      </div>

      <ConfirmDialog
        open={activationConfirmOpen}
        onClose={() => setActivationConfirmOpen(false)}
        onConfirm={toggleActive}
        title={service.active ? "Deactivate Service?" : "Activate Service?"}
        description={
          service.active
            ? "Deactivation is blocked while open Jobs or unfinished readiness records still depend on this Service."
            : "Activation makes this Service available for new readiness enrolments and Jobs."
        }
        confirmLabel={service.active ? "Deactivate" : "Activate"}
        tone={service.active ? "danger" : "default"}
      />
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
  tone = "default"
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-30 ${
        tone === "danger"
          ? "text-red-600 hover:bg-red-50"
          : "text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}
