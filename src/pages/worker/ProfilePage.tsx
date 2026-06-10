import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "../../components/PageHeader";
import { Button, Field, Input, Section } from "../../components/ui";
import { initials } from "../../lib/format";
import { useAppStore } from "../../store/appStore";

const schema = z.object({
  name: z.string().min(3, "Enter your full name."),
  email: z.email("Enter a valid email."),
  phone: z.string().min(7, "Enter a contact number."),
  location: z.string().min(2, "Enter your location.")
});

type ProfileForm = z.infer<typeof schema>;

export function ProfilePage() {
  const [saved, setSaved] = useState(false);
  const user = useAppStore((state) => state.currentUser());
  const workers = useAppStore((state) => state.workers);
  const worker = workers.find((item) => item.id === user?.workerId);
  const services = useAppStore((state) => state.services);
  const updateProfile = useAppStore((state) => state.updateWorkerProfile);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    values: {
      name: worker?.name ?? "",
      email: worker?.email ?? "",
      phone: worker?.phone ?? "",
      location: worker?.location ?? ""
    }
  });

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [saved]);

  if (!worker) return null;

  const approvedServices = worker.approvedServiceIds
    .map((id) => services.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <div>
      <PageHeader
        eyebrow="Your account"
        title="Profile"
        description="Keep your contact details current. Your approved services are shown here for reference."
      />

      <div className="mt-8 mx-auto max-w-2xl">
        <Section title="Account Settings">
          {/* ── Identity block ── */}
          <div className="flex flex-col items-center gap-4 pb-7 sm:flex-row sm:items-start">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-[22px] bg-[#102A43] font-[Poppins] text-2xl font-semibold text-white">
              {initials(worker.name)}
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-[#102A43]">
                {worker.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${
                    worker.isLead
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {worker.isLead ? "Lead" : "Worker"}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${
                    worker.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : worker.status === "ready"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-orange-50 text-orange-700"
                  }`}
                >
                  {worker.status}
                </span>
              </div>

              {approvedServices.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {approvedServices.map((service) => (
                    <span
                      key={service!.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700"
                    >
                      <CheckCircle2 size={12} />
                      {service!.shortName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Edit form ── */}
          <div className="border-t border-slate-100 pt-7">
            <p className="mb-5 text-sm font-semibold text-[#102A43]">
              Contact details
            </p>
            <form
              onSubmit={form.handleSubmit((values) => {
                updateProfile(worker.id, values);
                setSaved(true);
              })}
              className="grid gap-5"
            >
              <Field
                label="Full name"
                error={form.formState.errors.name?.message}
              >
                <Input {...form.register("name")} />
              </Field>
              <Field
                label="Email"
                error={form.formState.errors.email?.message}
              >
                <Input type="email" {...form.register("email")} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Phone"
                  error={form.formState.errors.phone?.message}
                >
                  <Input {...form.register("phone")} />
                </Field>
                <Field
                  label="Location"
                  error={form.formState.errors.location?.message}
                >
                  <Input {...form.register("location")} />
                </Field>
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                {saved && (
                  <span className="text-xs font-bold text-emerald-700">
                    ✓ Saved
                  </span>
                )}
                <Button type="submit">
                  <Save size={16} /> Save changes
                </Button>
              </div>
            </form>
          </div>
        </Section>
      </div>
    </div>
  );
}
