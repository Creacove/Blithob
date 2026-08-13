import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import {
  type Control,
  useFieldArray,
  useForm,
  useWatch
} from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { PageHeader } from "../../components/PageHeader";
import { useToast } from "../../components/ToastProvider";
import {
  Button,
  Field,
  Input,
  Section,
  Select,
  StickyActionBar,
  Textarea
} from "../../components/ui";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useProfessionalStore } from "../../store/professionalStore";

const rowSchema = z.object({ value: z.string() });
const referenceSchema = z.object({
  label: z.string(),
  kind: z.enum(["link", "file"]),
  url: z.string(),
  fileName: z.string()
});
const draftSchema = z.object({
  title: z.string(),
  serviceId: z.string().min(1, "Choose a Service"),
  clientContext: z.string(),
  objective: z.string(),
  description: z.string(),
  steps: z.array(rowSchema),
  deliverables: z.array(rowSchema),
  acceptanceCriteria: z.array(rowSchema),
  references: z.array(referenceSchema),
  submissionEvidenceRequired: z.boolean(),
  deadline: z.string()
});

type JobFormValues = z.infer<typeof draftSchema>;

const emptyValues: JobFormValues = {
  title: "",
  serviceId: "",
  clientContext: "",
  objective: "",
  description: "",
  steps: [{ value: "" }],
  deliverables: [{ value: "" }],
  acceptanceCriteria: [{ value: "" }],
  references: [],
  submissionEvidenceRequired: false,
  deadline: ""
};

const mobileStages = [
  "Basics",
  "Brief",
  "Delivery standards",
  "References & scheduling"
] as const;

export function JobEditorPage() {
  const { jobId } = useParams();
  const existingJob = useProfessionalStore((state) =>
    state.jobs.find((job) => job.id === jobId)
  );
  const allServices = useProfessionalStore((state) => state.services);
  const services = allServices.filter((service) => service.active);
  const createJob = useProfessionalStore((state) => state.createJob);
  const updateJob = useProfessionalStore((state) => state.updateJob);
  const publishJob = useProfessionalStore((state) => state.publishJob);
  const navigate = useNavigate();
  const { success, error } = useToast();
  const {
    register,
    control,
    getValues,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<JobFormValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: existingJob
      ? {
          title: existingJob.title,
          serviceId: existingJob.serviceId,
          clientContext: existingJob.clientContext,
          objective: existingJob.objective,
          description: existingJob.description,
          steps:
            existingJob.steps.length > 0
              ? existingJob.steps.map((value) => ({ value }))
              : [{ value: "" }],
          deliverables:
            existingJob.deliverables.length > 0
              ? existingJob.deliverables.map((value) => ({ value }))
              : [{ value: "" }],
          acceptanceCriteria:
            existingJob.acceptanceCriteria.length > 0
              ? existingJob.acceptanceCriteria.map((value) => ({ value }))
              : [{ value: "" }],
          references: existingJob.references.map((reference) => ({
            label: reference.label,
            kind: reference.kind,
            url: reference.url ?? "",
            fileName: reference.fileName ?? ""
          })),
          submissionEvidenceRequired:
            existingJob.submissionEvidenceRequired,
          deadline: toLocalDateTime(existingJob.deadline)
        }
      : {
          ...emptyValues,
          serviceId: services[0]?.id ?? ""
        }
  });
  const steps = useFieldArray({ control, name: "steps" });
  const deliverables = useFieldArray({ control, name: "deliverables" });
  const criteria = useFieldArray({ control, name: "acceptanceCriteria" });
  const references = useFieldArray({ control, name: "references" });
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [mobileStep, setMobileStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const saveCompletedRef = useRef(false);

  const save = async (publish: boolean) => {
    if (savingRef.current || saveCompletedRef.current) return;
    savingRef.current = true;
    setIsSaving(true);

    try {
      clearErrors();
      const values = getValues();
      const parsed = draftSchema.safeParse(values);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) =>
          setError(issue.path.join(".") as keyof JobFormValues, {
            message: issue.message
          })
        );
        return;
      }

      const required: Array<[keyof JobFormValues, string]> = [
        ["title", "Add a Job title"],
        ["objective", "Add a clear objective"],
        ["description", "Add the full work description"],
        ["deadline", "Add a deadline"]
      ];
      const requiresCompleteBrief =
        publish || existingJob?.publicationState === "open";
      if (requiresCompleteBrief) {
        let invalid = false;
        required.forEach(([field, message]) => {
          if (!String(values[field]).trim()) {
            setError(field, { message });
            invalid = true;
          }
        });
        const requiredRows: Array<
          ["steps" | "deliverables" | "acceptanceCriteria", string]
        > = [
          ["steps", "Add at least one complete step"],
          ["deliverables", "Add at least one deliverable"],
          ["acceptanceCriteria", "Add at least one acceptance criterion"]
        ];
        requiredRows.forEach(([field, message]) => {
          if (
            values[field].length === 0 ||
            values[field].some((item) => !item.value.trim())
          ) {
            setError(field, { message });
            invalid = true;
          }
        });
        values.references.forEach((reference, index) => {
          if (!reference.label.trim()) {
            setError(`references.${index}.label`, {
              message: "Add a reference label"
            });
            invalid = true;
          }
          if (
            reference.kind === "link" &&
            !/^https?:\/\//i.test(reference.url.trim())
          ) {
            setError(`references.${index}.url`, {
              message: "Add a complete http or https URL"
            });
            invalid = true;
          }
          if (reference.kind === "file" && !reference.fileName.trim()) {
            setError(`references.${index}.fileName`, {
              message: "Add the file name"
            });
            invalid = true;
          }
        });
        if (invalid) {
          error("Complete the required brief fields before publishing");
          return;
        }
      }

      const input = {
        title: values.title.trim(),
        serviceId: values.serviceId,
        clientContext: values.clientContext.trim(),
        objective: values.objective.trim(),
        description: values.description.trim(),
        steps: values.steps
          .map((item) => item.value.trim())
          .filter(Boolean),
        deliverables: values.deliverables
          .map((item) => item.value.trim())
          .filter(Boolean),
        acceptanceCriteria: values.acceptanceCriteria
          .map((item) => item.value.trim())
          .filter(Boolean),
        references: values.references
          .filter(
            (reference) =>
              reference.label.trim() ||
              reference.url.trim() ||
              reference.fileName.trim()
          )
          .map((reference, index) => ({
            id: `reference-${Date.now()}-${index}`,
            label: reference.label.trim(),
            kind: reference.kind,
            url:
              reference.kind === "link"
                ? reference.url.trim() || undefined
                : undefined,
            fileName:
              reference.kind === "file"
                ? reference.fileName.trim() || undefined
                : undefined
          })),
        submissionEvidenceRequired: values.submissionEvidenceRequired,
        deadline: values.deadline
          ? new Date(values.deadline).toISOString()
          : ""
      };
      const savedJobId = existingJob?.id ?? await createJob(input);
      if (existingJob) {
        await updateJob(existingJob.id, input);
      }
      if (!savedJobId) {
        error("Choose an active Service");
        return;
      }
      if (publish && !(await publishJob(savedJobId))) {
        error("The Job could not be published");
        return;
      }
      success(
        publish
          ? "Job published"
          : existingJob
            ? "Job brief saved"
            : "Draft saved"
      );
      saveCompletedRef.current = true;
      navigate(`/admin/jobs/${savedJobId}`);
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "The Job could not be saved");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={existingJob ? "Edit job" : "Create job"}
        description="Write one precise brief, then create independent Assignments for the Professionals delivering it."
        actions={
          <Link
            to="/admin/jobs"
            className="mobile-header-back inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Jobs
          </Link>
        }
      />

      {isMobile && (
        <nav
          className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-3"
          aria-label="Job editor stages"
        >
          <p className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Step {mobileStep + 1} of {mobileStages.length}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {mobileStages.map((stage, index) => (
              <button
                key={stage}
                type="button"
                aria-current={mobileStep === index ? "step" : undefined}
                onClick={() => setMobileStep(index)}
                className={`min-h-11 rounded-[10px] px-3 text-left text-sm font-semibold transition ${
                  mobileStep === index
                    ? "bg-[var(--ink)] text-white"
                    : "bg-[var(--surface-subtle)] text-[var(--muted)]"
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className="mt-6 grid gap-5">
        {(!isMobile || mobileStep === 0) && (
        <Section title="Basics" description="Name the work and connect it to one Service.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job title" error={errors.title?.message}>
              <Input {...register("title")} placeholder="e.g. July content calendar" />
            </Field>
            <Field label="Service" error={errors.serviceId?.message}>
              <Select {...register("serviceId")}>
                <option value="">Choose a Service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Field
              label="Client context"
              hint="Optional background that helps the Professional understand the client."
            >
              <Textarea {...register("clientContext")} />
            </Field>
          </div>
        </Section>
        )}

        {(!isMobile || mobileStep === 1) && (
        <Section title="Brief" description="State the result and explain the work in full.">
          <div className="grid gap-4">
            <Field label="Objective" error={errors.objective?.message}>
              <Textarea {...register("objective")} className="min-h-24" />
            </Field>
            <Field
              label="Full description"
              error={errors.description?.message}
            >
              <Textarea {...register("description")} className="min-h-40" />
            </Field>
          </div>
        </Section>
        )}

        {(!isMobile || mobileStep === 2) && (
        <>
        <ListEditor
          title="Execution steps"
          description="Put the work in the order it should be completed."
          label="Step"
          fields={steps.fields}
          registerPath={(index) => `steps.${index}.value`}
          register={register}
          append={() => steps.append({ value: "" })}
          remove={steps.remove}
          error={errors.steps?.message}
        />
        <ListEditor
          title="Deliverables"
          description="List every item the Professional must hand over."
          label="Deliverable"
          fields={deliverables.fields}
          registerPath={(index) => `deliverables.${index}.value`}
          register={register}
          append={() => deliverables.append({ value: "" })}
          remove={deliverables.remove}
          error={errors.deliverables?.message}
        />
        <ListEditor
          title="Acceptance criteria"
          description="Define the checks that make the work approvable."
          label="Criterion"
          fields={criteria.fields}
          registerPath={(index) => `acceptanceCriteria.${index}.value`}
          register={register}
          append={() => criteria.append({ value: "" })}
          remove={criteria.remove}
          error={errors.acceptanceCriteria?.message}
        />
        </>
        )}

        {(!isMobile || mobileStep === 3) && (
        <>
        <Section
          title="References"
          description="Add links or file-name metadata for material the Professional needs."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                references.append({
                  label: "",
                  kind: "link",
                  url: "",
                  fileName: ""
                })
              }
            >
              <Plus size={15} aria-hidden />
              Add reference
            </Button>
          }
        >
          {references.fields.length === 0 ? (
            <p className="text-base text-[var(--muted)]">
              No references added. This is optional.
            </p>
          ) : (
            <div className="space-y-3">
              {references.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-xl border border-[var(--border)] p-4 sm:grid-cols-[1fr_9rem_1.25fr_auto]"
                >
                  <Field
                    label={`Reference ${index + 1}`}
                    error={errors.references?.[index]?.label?.message}
                  >
                    <Input
                      {...register(`references.${index}.label`)}
                      placeholder="Client brief"
                    />
                  </Field>
                  <Field label="Type">
                    <Select {...register(`references.${index}.kind`)}>
                      <option value="link">Link</option>
                      <option value="file">File</option>
                    </Select>
                  </Field>
                  <ReferenceValue
                    index={index}
                    register={register}
                    control={control}
                    errors={errors.references?.[index]}
                  />
                  <button
                    type="button"
                    onClick={() => references.remove(index)}
                    className="mt-7 grid h-11 w-11 place-items-center rounded-[10px] text-red-700 hover:bg-red-50"
                    aria-label={`Remove reference ${index + 1}`}
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Scheduling" description="Set the Job-level delivery target.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Deadline" error={errors.deadline?.message}>
              <Input type="datetime-local" {...register("deadline")} />
            </Field>
            <label className="flex items-center gap-3 self-end rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--ink)]">
              <input
                type="checkbox"
                {...register("submissionEvidenceRequired")}
              />
              Require a link or file with each submission
            </label>
          </div>
        </Section>
        </>
        )}

        {isMobile ? (
          <StickyActionBar className="gap-2">
            {mobileStep > 0 && (
              <Button
                type="button"
                variant="quiet"
                className="w-11 shrink-0 px-0"
                aria-label="Previous editor stage"
                onClick={() => setMobileStep((current) => current - 1)}
              >
                <ArrowLeft size={17} aria-hidden />
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              className="min-w-0 flex-1 px-3"
              disabled={isSaving}
              onClick={() => save(false)}
            >
              {isSaving
                ? "Saving…"
                : existingJob
                  ? "Save changes"
                  : "Save draft"}
            </Button>
            {mobileStep < mobileStages.length - 1 ? (
              <Button
                type="button"
                className="min-w-0 flex-1 px-3"
                onClick={() => setMobileStep((current) => current + 1)}
              >
                Continue
                <ArrowRight size={16} aria-hidden />
              </Button>
            ) : existingJob?.publicationState !== "open" ? (
              <Button
                type="button"
                className="min-w-0 flex-1 px-3"
                disabled={isSaving}
                onClick={() => save(true)}
              >
                {isSaving ? "Publishing…" : "Publish"}
              </Button>
            ) : null}
          </StickyActionBar>
        ) : (
        <div className="sticky bottom-4 z-20 flex flex-wrap justify-end gap-3 rounded-xl border border-[var(--border)] bg-white/95 p-3 shadow-lg backdrop-blur">
          <Button
            type="button"
            variant={existingJob?.publicationState === "open" ? "primary" : "secondary"}
            disabled={isSaving}
            onClick={() => save(false)}
          >
            {isSaving
              ? "Saving…"
              : existingJob
                ? "Save changes"
                : "Save draft"}
          </Button>
          {existingJob?.publicationState !== "open" && (
            <Button type="button" disabled={isSaving} onClick={() => save(true)}>
              {isSaving ? "Publishing…" : "Publish job"}
            </Button>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

function toLocalDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function ListEditor({
  title,
  description,
  label,
  fields,
  registerPath,
  register,
  append,
  remove,
  error
}: {
  title: string;
  description: string;
  label: string;
  fields: Array<{ id: string }>;
  registerPath: (
    index: number
  ) =>
    | `steps.${number}.value`
    | `deliverables.${number}.value`
    | `acceptanceCriteria.${number}.value`;
  register: ReturnType<typeof useForm<JobFormValues>>["register"];
  append: () => void;
  remove: (index: number) => void;
  error?: string;
}) {
  return (
    <Section
      title={title}
      description={description}
      action={
        <Button type="button" variant="secondary" onClick={append}>
          <Plus size={15} aria-hidden />
          Add {label.toLowerCase()}
        </Button>
      }
    >
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
              {index + 1}
            </span>
            <Input
              {...register(registerPath(index))}
              aria-label={`${label} ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] text-red-700 hover:bg-red-50"
              aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
            >
              <Trash2 size={16} aria-hidden />
            </button>
          </div>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm font-medium text-[var(--critical)]">{error}</p>
      )}
    </Section>
  );
}

function ReferenceValue({
  index,
  register,
  control,
  errors
}: {
  index: number;
  register: ReturnType<typeof useForm<JobFormValues>>["register"];
  control: Control<JobFormValues>;
  errors?: {
    url?: { message?: string };
    fileName?: { message?: string };
  };
}) {
  const kind =
    useWatch({ control, name: `references.${index}.kind` }) ?? "link";
  return kind === "file" ? (
    <Field label="File name" error={errors?.fileName?.message}>
      <Input
        {...register(`references.${index}.fileName`)}
        placeholder="brief.pdf"
      />
    </Field>
  ) : (
    <Field label="URL" error={errors?.url?.message}>
      <Input
        {...register(`references.${index}.url`)}
        placeholder="https://"
      />
    </Field>
  );
}
