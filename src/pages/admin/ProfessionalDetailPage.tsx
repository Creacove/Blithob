import {
  ArrowLeft,
  BriefcaseBusiness,
  Plus,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  WalletCards
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Drawer } from "../../components/Drawer";
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
  Select,
  Textarea
} from "../../components/ui";
import { formatCurrency, formatDate } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";
import { RouteShell } from "../RouteShell";

export function ProfessionalDetailPage() {
  const { professionalId } = useParams();
  const { success, error } = useToast();
  const professional = useProfessionalStore((state) =>
    state.professionals.find((item) => item.id === professionalId)
  );
  const professionals = useProfessionalStore((state) => state.professionals);
  const backendMode = useProfessionalStore((state) => state.backendMode);
  const services = useProfessionalStore((state) => state.services);
  const enrolments = useProfessionalStore(
    (state) => state.serviceEnrolments
  );
  const assignments = useProfessionalStore((state) => state.assignments);
  const jobs = useProfessionalStore((state) => state.jobs);
  const payments = useProfessionalStore((state) => state.payments);
  const updateProfessional = useProfessionalStore(
    (state) => state.updateProfessional
  );
  const setLeadCapability = useProfessionalStore(
    (state) => state.setLeadCapability
  );
  const createServiceEnrolment = useProfessionalStore(
    (state) => state.createServiceEnrolment
  );
  const removeServiceEnrolment = useProfessionalStore(
    (state) => state.removeServiceEnrolment
  );
  const [enrolDrawerOpen, setEnrolDrawerOpen] = useState(false);
  const [capabilityConfirmOpen, setCapabilityConfirmOpen] = useState(false);
  const [removeEnrolmentId, setRemoveEnrolmentId] = useState<string>();
  const [serviceId, setServiceId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [profileForm, setProfileForm] = useState(() => ({
    name: professional?.name ?? "",
    email: professional?.email ?? "",
    phone: professional?.phone ?? "",
    location: professional?.location ?? "",
    accountStatus: professional?.accountStatus ?? ("active" as const)
  }));
  const [adminNotes, setAdminNotes] = useState(
    () => professional?.adminNotes ?? ""
  );

  const professionalEnrolments = useMemo(
    () =>
      enrolments.filter((item) => item.professionalId === professionalId),
    [enrolments, professionalId]
  );
  const professionalAssignments = useMemo(
    () =>
      assignments.filter((item) => item.professionalId === professionalId),
    [assignments, professionalId]
  );
  const professionalPayments = useMemo(
    () => payments.filter((item) => item.professionalId === professionalId),
    [payments, professionalId]
  );
  const availableServices = services.filter(
    (service) =>
      service.active &&
      !professionalEnrolments.some(
        (enrolment) =>
          enrolment.serviceId === service.id && enrolment.status !== "paused"
      )
  );
  const availableLeads = professionals.filter(
    (item) =>
      item.isLead &&
      item.accountStatus === "active" &&
      item.id !== professionalId
  );

  if (!professional) {
    return (
      <RouteShell
        title="Professional not found"
        description="The requested Professional record does not exist."
      />
    );
  }

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateProfessional(professional.id, profileForm);
      success("Contact details saved");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Contact details could not be saved");
    }
  };

  const saveNotes = async () => {
    try {
      await updateProfessional(professional.id, { adminNotes });
      success("Internal notes saved");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Internal notes could not be saved");
    }
  };

  const enrol = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!serviceId) return;
    try {
      const created = await createServiceEnrolment(
        professional.id,
        serviceId,
        leadId || undefined
      );
      if (!created) {
        error("This Service cannot be assigned");
        return;
      }
      setEnrolDrawerOpen(false);
      setServiceId("");
      setLeadId("");
      success("Service readiness assigned");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Service readiness could not be assigned");
    }
  };

  const changeCapability = async () => {
    try {
      await setLeadCapability(professional.id, !professional.isLead);
      setCapabilityConfirmOpen(false);
      success(
        professional.isLead
          ? "Lead capability removed"
          : "Lead capability granted"
      );
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Lead capability could not be changed");
    }
  };

  const confirmRemoveEnrolment = async () => {
    if (!removeEnrolmentId) return;
    try {
      const removed = await removeServiceEnrolment(removeEnrolmentId);
      setRemoveEnrolmentId(undefined);
      if (removed) success("Service enrolment removed");
      else error("This enrolment is already approved or linked to work");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Service enrolment could not be removed");
    }
  };

  return (
    <div>
      <PageHeader
        title={professional.name}
        description={`${professional.isLead ? "Lead Professional" : "Professional"} · Joined ${formatDate(professional.joinedAt)}`}
        actions={
          <Link
            to="/admin/people"
            className="mobile-header-back inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to People
          </Link>
        }
      />

      <div className="mt-6 grid gap-5">
        <Section
          title="Overview"
          description="One editable source for contact details and account state."
        >
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={saveProfile}
          >
            <Field label="Full name">
              <Input
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={profileForm.email}
                disabled={backendMode === "remote"}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    email: event.target.value
                  }))
                }
              />
              {backendMode === "remote" && (
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Login email can only be changed by the account owner.
                </p>
              )}
            </Field>
            <Field label="Phone">
              <Input
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    phone: event.target.value
                  }))
                }
              />
            </Field>
            <Field label="Location">
              <Input
                value={profileForm.location}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    location: event.target.value
                  }))
                }
              />
            </Field>
            <Field label="Account state">
              <Select
                value={profileForm.accountStatus}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    accountStatus: event.target.value as
                      | "active"
                      | "inactive"
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
            <div className="flex items-end md:justify-end">
              <Button type="submit">Save contact details</Button>
            </div>
          </form>
        </Section>

        <Section
          title="Services and training"
          description="Each Service has one readiness record and one review route."
          mobileDisclosure="expanded"
          action={
            <Button onClick={() => setEnrolDrawerOpen(true)}>
              <Plus size={16} aria-hidden="true" />
              Enrol in service
            </Button>
          }
        >
          {professionalEnrolments.length === 0 ? (
            <EmptyState
              title="No Service enrolments"
              description="Assign a Service when this Professional is ready to begin its readiness checklist."
            />
          ) : (
            <RecordList>
              {professionalEnrolments.map((enrolment) => {
                const service = services.find(
                  (item) => item.id === enrolment.serviceId
                );
                const lead = professionals.find(
                  (item) => item.id === enrolment.leadId
                );
                const relatedWork = professionalAssignments.some(
                  (assignment) =>
                    jobs.find((job) => job.id === assignment.jobId)
                      ?.serviceId === enrolment.serviceId
                );
                const removable =
                  enrolment.status !== "approved" && !relatedWork;
                return (
                  <DesktopRecordRow
                    key={enrolment.id}
                    columns="minmax(12rem,1fr) minmax(9rem,0.65fr) 10rem 6.5rem"
                    layoutAt="md"
                    className="gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--ink)]">
                        {service?.name ?? "Unknown Service"}
                      </p>
                      <p className="mt-1 truncate text-sm text-[var(--muted)]">
                        {enrolment.requirements.filter((item) => item.completed)
                          .length}{" "}
                        of {enrolment.requirements.length} requirements complete
                      </p>
                    </div>
                    <p className="truncate text-sm text-[var(--muted)]">
                      {lead ? `Lead: ${lead.name}` : "Direct to Admin"}
                    </p>
                    <div className="min-w-0">
                      <StatusBadge status={enrolment.status} />
                    </div>
                    <button
                      type="button"
                      disabled={!removable}
                      onClick={() => setRemoveEnrolmentId(enrolment.id)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-35"
                      title={
                        removable
                          ? "Remove enrolment"
                          : "Approved or work-linked enrolments cannot be removed"
                      }
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      Remove
                    </button>
                  </DesktopRecordRow>
                );
              })}
            </RecordList>
          )}
        </Section>

        <Section
          title="Work history"
          description="Independent Assignment records for this Professional."
          mobileDisclosure="collapsed"
        >
          {professionalAssignments.length === 0 ? (
            <EmptyState
              title="No Assignments"
              description="Assigned work will appear here."
            />
          ) : (
            <RecordList>
              {professionalAssignments.map((assignment) => {
                const job = jobs.find((item) => item.id === assignment.jobId);
                return (
                  <DesktopRecordRow
                    key={assignment.id}
                    columns="minmax(12rem,1fr) 10.5rem 7.5rem 4rem"
                    layoutAt="md"
                    className="gap-3"
                  >
                    <div className="min-w-0">
                      <p className="flex min-w-0 items-center gap-2 font-semibold text-[var(--ink)]">
                        <BriefcaseBusiness size={16} aria-hidden="true" />
                        <span className="truncate">
                          {job?.title ?? "Unknown Job"}
                        </span>
                      </p>
                      <p className="mt-1 truncate text-sm text-[var(--muted)]">
                        Due {formatDate(assignment.deadline)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <StatusBadge status={assignment.status} />
                    </div>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {formatCurrency(assignment.agreedPay)}
                    </p>
                    <Link
                      to={`/admin/assignments/${assignment.id}`}
                      className="text-sm font-semibold text-[var(--blue)]"
                    >
                      Open
                    </Link>
                  </DesktopRecordRow>
                );
              })}
            </RecordList>
          )}
        </Section>

        <Section
          title="Payments"
          description="Payment records created from completed Assignments."
          mobileDisclosure="collapsed"
        >
          {professionalPayments.length === 0 ? (
            <EmptyState
              title="No payments"
              description="Payments will appear after an Assignment is completed."
            />
          ) : (
            <RecordList>
              {professionalPayments.map((payment) => {
                const assignment = assignments.find(
                  (item) => item.id === payment.assignmentId
                );
                const job = jobs.find(
                  (item) => item.id === assignment?.jobId
                );
                return (
                  <DesktopRecordRow
                    key={payment.id}
                    columns="minmax(12rem,1fr) 9.5rem 7.5rem 4rem"
                    layoutAt="md"
                    className="gap-3"
                  >
                    <div className="min-w-0">
                      <p className="flex min-w-0 items-center gap-2 font-semibold text-[var(--ink)]">
                        <WalletCards size={16} aria-hidden="true" />
                        <span className="truncate">
                          {job?.title ?? "Assignment payment"}
                        </span>
                      </p>
                      <p className="mt-1 truncate text-sm text-[var(--muted)]">
                        Due {formatDate(payment.dueDate)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <StatusBadge status={payment.status} />
                    </div>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {formatCurrency(payment.amount)}
                    </p>
                    <Link
                      to={`/admin/payments/${payment.id}`}
                      className="text-sm font-semibold text-[var(--blue)]"
                    >
                      Open
                    </Link>
                  </DesktopRecordRow>
                );
              })}
            </RecordList>
          )}
        </Section>

        <Section
          title="Internal notes"
          description="Visible to Admin only."
          mobileDisclosure="collapsed"
        >
          <Textarea
            value={adminNotes}
            onChange={(event) => setAdminNotes(event.target.value)}
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={saveNotes}>Save notes</Button>
          </div>
        </Section>

        <Section
          title="Permissions"
          description="Lead is a capability added to a Professional account."
          mobileDisclosure="collapsed"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                {professional.isLead ? (
                  <UserRoundCheck size={18} aria-hidden="true" />
                ) : (
                  <ShieldCheck size={18} aria-hidden="true" />
                )}
                {professional.isLead
                  ? "Lead capability enabled"
                  : "Standard Professional access"}
              </p>
              <p className="mt-1 max-w-[66ch] text-base leading-6 text-[var(--muted)]">
                Leads keep their own Work, Training, Payments, and Profile and
                also gain Team and Reviews.
              </p>
            </div>
            <Button
              variant={professional.isLead ? "secondary" : "primary"}
              onClick={() => setCapabilityConfirmOpen(true)}
            >
              {professional.isLead
                ? "Remove Lead capability"
                : "Grant Lead capability"}
            </Button>
          </div>
        </Section>
      </div>

      <Drawer
        open={enrolDrawerOpen}
        onClose={() => setEnrolDrawerOpen(false)}
        title="Enrol in service"
        description="Assign one active Service and optionally route readiness review through a Lead."
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEnrolDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="assign-readiness-form"
              disabled={!serviceId}
            >
              Assign readiness
            </Button>
          </>
        }
      >
        <form
          id="assign-readiness-form"
          className="space-y-5"
          onSubmit={enrol}
        >
          <Field label="Service">
            <Select
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
            >
              <option value="">Select a Service</option>
              {availableServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Lead" hint="Optional. Leave empty for direct Admin review.">
            <Select
              value={leadId}
              onChange={(event) => setLeadId(event.target.value)}
            >
              <option value="">Direct to Admin</option>
              {availableLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Drawer>

      <ConfirmDialog
        open={capabilityConfirmOpen}
        onClose={() => setCapabilityConfirmOpen(false)}
        onConfirm={changeCapability}
        title={
          professional.isLead
            ? "Remove Lead capability?"
            : "Grant Lead capability?"
        }
        description={
          professional.isLead
            ? "This removes Team and Reviews access. Pending Lead reviews will route directly to Admin."
            : "This adds Team and Reviews access while keeping the Professional's personal workspace unchanged."
        }
        confirmLabel={
          professional.isLead ? "Remove capability" : "Grant capability"
        }
        tone={professional.isLead ? "danger" : "default"}
      />

      <ConfirmDialog
        open={Boolean(removeEnrolmentId)}
        onClose={() => setRemoveEnrolmentId(undefined)}
        onConfirm={confirmRemoveEnrolment}
        title="Remove Service enrolment?"
        description="This removes the readiness record. Approved or work-linked enrolments cannot be removed."
        confirmLabel="Remove enrolment"
        tone="danger"
      />
    </div>
  );
}
