import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { useToast } from "../../components/ToastProvider";
import { Button, Field, Input, Section } from "../../components/ui";
import { initials } from "../../lib/format";
import { useProfessionalStore } from "../../store/professionalStore";

export function ProfilePage() {
  const professional = useProfessionalStore((state) =>
    state.currentProfessional()
  );
  const services = useProfessionalStore((state) => state.services);
  const approvedServiceIdsFor = useProfessionalStore(
    (state) => state.approvedServiceIdsFor
  );
  const updateProfessional = useProfessionalStore(
    (state) => state.updateProfessional
  );
  const [form, setForm] = useState(() => ({
    name: professional?.name ?? "",
    email: professional?.email ?? "",
    phone: professional?.phone ?? "",
    location: professional?.location ?? ""
  }));
  const { success } = useToast();

  if (!professional) return null;

  const approvedServices = services.filter((item) =>
    approvedServiceIdsFor(professional.id).includes(item.id)
  );
  const canSave =
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.location.trim();

  const save = () => {
    if (!canSave) return;
    updateProfessional(professional.id, form);
    success("Profile saved");
  };

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Keep one accurate Professional record for communication and matching."
      />
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(16rem,0.55fr)_minmax(0,1.45fr)]">
        <Section title="Professional identity">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--ink)] text-xl font-semibold text-white">
            {initials(professional.name)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-[var(--blue)]">
              Professional
            </span>
            {professional.isLead && (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700">
                Lead
              </span>
            )}
          </div>
          <section
            aria-label="Approved Services"
            className="mt-6 border-t border-[var(--border)] pt-5"
          >
            <h3 className="font-semibold text-[var(--ink)]">
              Approved Services
            </h3>
            {approvedServices.length === 0 ? (
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Approved Services appear after final Admin readiness approval.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {approvedServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
                  >
                    <CheckCircle2 size={15} aria-hidden />
                    {service.name}
                  </div>
                ))}
              </div>
            )}
          </section>
        </Section>

        <Section
          title="Contact details"
          description="These values are used by Admin and Leads. There is no duplicate summary block."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name">
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
          </div>
          <div className="mt-6 flex justify-end">
            <Button disabled={!canSave} onClick={save}>
              Save profile
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}
