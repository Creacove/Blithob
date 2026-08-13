import { FileCheck2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Drawer } from "../../components/Drawer";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
import { useToast } from "../../components/ToastProvider";
import {
  Button,
  DesktopRecordRow,
  EmptyState,
  Field,
  Input,
  RecordList,
  ResponsiveRecord,
  Select,
  Textarea,
  Toolbar
} from "../../components/ui";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import type {
  PaymentMethod,
  PaymentStatus
} from "../../domain/model";
import { formatCurrency, formatDate } from "../../lib/format";
import { paymentMethodLabel } from "../../lib/payment";
import { useProfessionalStore } from "../../store/professionalStore";

type Filter = "all" | PaymentStatus;
type RecordState = "scheduled" | "paid" | "issue";

interface PaymentForm {
  status: RecordState;
  paymentDate: string;
  method: PaymentMethod;
  reference: string;
  receiptFileName: string;
  internalNote: string;
  issueNote: string;
}

export function AdminPaymentsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string>();
  const [form, setForm] = useState<PaymentForm>(() => emptyPaymentForm());
  const payments = useProfessionalStore((state) => state.payments);
  const assignments = useProfessionalStore((state) => state.assignments);
  const jobs = useProfessionalStore((state) => state.jobs);
  const professionals = useProfessionalStore((state) => state.professionals);
  const recordPayment = useProfessionalStore((state) => state.recordPayment);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { success, error } = useToast();
  const selected = payments.find((payment) => payment.id === selectedId);
  const filtered =
    filter === "all"
      ? payments
      : payments.filter((payment) => payment.status === filter);

  const openRecord = (paymentId: string) => {
    const payment = payments.find((item) => item.id === paymentId);
    if (!payment) return;
    setSelectedId(payment.id);
    setForm({
      status: payment.status === "issue" ? "issue" : "paid",
      paymentDate: toLocalDateTime(payment.paymentDate ?? ""),
      method: payment.method ?? "bank_transfer",
      reference: payment.reference ?? "",
      receiptFileName: payment.receiptFileName ?? "",
      internalNote: payment.internalNote ?? "",
      issueNote: payment.issueNote ?? ""
    });
  };

  const canSave =
    form.status === "paid"
      ? Boolean(
          form.paymentDate &&
            form.method &&
            (form.method === "cash" || form.reference.trim())
        )
      : form.status === "issue"
        ? Boolean(form.issueNote.trim())
        : true;

  const save = async () => {
    if (!selected || !canSave) return;
    try {
      await recordPayment(selected.id, {
        status: form.status,
        paymentDate: form.paymentDate
          ? new Date(form.paymentDate).toISOString()
          : undefined,
        method: form.method,
        reference: form.reference,
        receiptFileName: form.receiptFileName,
        internalNote: form.internalNote,
        issueNote: form.issueNote
      });
      setSelectedId(undefined);
      success("Payment record saved");
    } catch (caught) {
      error(caught instanceof Error ? caught.message : "Payment record could not be saved");
    }
  };

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Record payments handled outside the platform, including method, reference, receipt, and issues."
      />
      <SummaryBand
        className="mt-6"
        items={[
          {
            label: "Payments due",
            value: payments.filter((payment) => payment.status === "due").length,
            tone: "attention"
          },
          {
            label: "Amount due",
            value: formatCurrency(
              payments
                .filter((payment) => payment.status === "due")
                .reduce((sum, payment) => sum + payment.amount, 0)
            ),
            tone: "attention",
            mobilePriority: "primary"
          },
          {
            label: "Scheduled",
            value: payments.filter((payment) => payment.status === "scheduled")
              .length
          },
          {
            label: "Paid",
            value: payments.filter((payment) => payment.status === "paid").length,
            tone: "positive"
          },
          {
            label: "Issues",
            value: payments.filter((payment) => payment.status === "issue").length,
            tone: "attention",
            mobilePriority: "primary"
          }
        ]}
      />

      <Toolbar className="mt-6" label="Payment filters">
        <Select
          aria-label="Filter payments"
          value={filter}
          onChange={(event) => setFilter(event.target.value as Filter)}
          className="sm:w-56"
        >
          <option value="all">All payment states</option>
          <option value="due">Due</option>
          <option value="scheduled">Scheduled</option>
          <option value="paid">Paid</option>
          <option value="issue">Issue</option>
        </Select>
      </Toolbar>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No payment records"
            description="Completed Assignments create due Payments automatically."
          />
        </div>
      ) : (
        isMobile ? (
          <div className="mt-4 grid gap-3" aria-label="Payment records mobile">
            {filtered.map((payment) => {
              const assignment = assignments.find(
                (item) => item.id === payment.assignmentId
              );
              const job = jobs.find((item) => item.id === assignment?.jobId);
              const professional = professionals.find(
                (item) => item.id === payment.professionalId
              );
              return (
                <ResponsiveRecord
                  key={payment.id}
                  title={
                    <Link
                      to={`/admin/payments/${payment.id}`}
                      className="hover:text-[var(--blue)]"
                    >
                      {job?.title ?? "Assignment payment"}
                    </Link>
                  }
                  subtitle={professional?.name ?? "Unknown Professional"}
                  status={<StatusBadge status={payment.status} />}
                  facts={[
                    { label: "Amount", value: formatCurrency(payment.amount) },
                    {
                      label: "Due",
                      value: formatDate(payment.dueDate)
                    }
                  ]}
                  action={
                    payment.status === "paid" ? (
                      <Link
                        to={`/admin/payments/${payment.id}`}
                        className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--blue)]"
                      >
                        View
                      </Link>
                    ) : (
                      <Button
                        variant="secondary"
                        aria-label={`Record payment for ${payment.id}`}
                        onClick={() => openRecord(payment.id)}
                      >
                        Record
                      </Button>
                    )
                  }
                />
              );
            })}
          </div>
        ) : (
          <RecordList className="mt-4" label="Payment records">
          {filtered.map((payment) => {
            const assignment = assignments.find(
              (item) => item.id === payment.assignmentId
            );
            const job = jobs.find((item) => item.id === assignment?.jobId);
            const professional = professionals.find(
              (item) => item.id === payment.professionalId
            );
            return (
              <DesktopRecordRow
                key={payment.id}
                columns="minmax(14rem,1.2fr) 8rem 9.5rem minmax(12rem,0.8fr) 10.5rem"
                className="gap-3"
              >
                <div className="min-w-0">
                  <Link
                    to={`/admin/payments/${payment.id}`}
                    className="block truncate font-semibold text-[var(--ink)] hover:text-[var(--blue)]"
                  >
                    {job?.title ?? "Assignment payment"}
                  </Link>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">
                    {professional?.name ?? "Unknown Professional"}
                  </p>
                </div>
                <p className="font-semibold text-[var(--ink)]">
                  {formatCurrency(payment.amount)}
                </p>
                <div className="min-w-0">
                  <StatusBadge status={payment.status} />
                </div>
                <div className="min-w-0 text-sm text-[var(--muted)]">
                  <p className="truncate">Due {formatDate(payment.dueDate)}</p>
                  <p className="mt-1 truncate">
                    {payment.method
                      ? paymentMethodLabel(payment.method)
                      : "Method not recorded"}
                    {payment.reference ? ` - ${payment.reference}` : ""}
                  </p>
                  {payment.receiptFileName && (
                    <p className="mt-1 flex min-w-0 items-center gap-1 font-medium text-emerald-700">
                      <FileCheck2 size={14} aria-hidden />
                      <span className="truncate">{payment.receiptFileName}</span>
                    </p>
                  )}
                </div>
                {payment.status === "paid" ? (
                  <Link
                    to={`/admin/payments/${payment.id}`}
                    className="text-sm font-semibold text-[var(--blue)]"
                  >
                    View record
                  </Link>
                ) : (
                  <Button
                    variant="secondary"
                    aria-label={`Record payment for ${payment.id}`}
                    onClick={() => openRecord(payment.id)}
                  >
                    Record
                  </Button>
                )}
              </DesktopRecordRow>
            );
          })}
          </RecordList>
        )
      )}

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(undefined)}
        title="Record payment"
        description={
          selected
            ? `${formatCurrency(selected.amount)} - no money is moved by this prototype.`
            : undefined
        }
        footer={
          selected ? (
            <>
              <Button
                variant="secondary"
                onClick={() => setSelectedId(undefined)}
              >
                Cancel
              </Button>
              <Button disabled={!canSave} onClick={save}>
                Save payment
              </Button>
            </>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-5">
            <Field label="Payment state">
              <Select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as RecordState
                  }))
                }
              >
                <option value="paid">Paid</option>
                <option value="scheduled">Scheduled</option>
                <option value="issue">Issue</option>
              </Select>
            </Field>
            {form.status !== "issue" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Payment date"
                  hint={
                    form.status === "scheduled"
                      ? "Optional until the payment is completed."
                      : undefined
                  }
                >
                  <Input
                    type="datetime-local"
                    value={form.paymentDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        paymentDate: event.target.value
                      }))
                    }
                  />
                </Field>
                <Field label="Method">
                  <Select
                    value={form.method}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        method: event.target.value as PaymentMethod
                      }))
                    }
                  >
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="mobile_money">Mobile money</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
              </div>
            )}
            {form.status !== "issue" && (
              <Field
                label="Payment reference"
                hint={
                  form.method === "cash"
                    ? "Optional for Cash."
                    : "Required when recording a completed payment."
                }
              >
                <Input
                  value={form.reference}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      reference: event.target.value
                    }))
                  }
                />
              </Field>
            )}
            <Field label="Receipt file name" hint="Optional receipt metadata for this prototype.">
              <Input
                value={form.receiptFileName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    receiptFileName: event.target.value
                  }))
                }
                placeholder="receipt.pdf"
              />
            </Field>
            {form.status === "issue" && (
              <Field label="Issue reason">
                <Textarea
                  value={form.issueNote}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      issueNote: event.target.value
                    }))
                  }
                />
              </Field>
            )}
            <Field label="Internal note">
              <Textarea
                value={form.internalNote}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    internalNote: event.target.value
                  }))
                }
              />
            </Field>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function emptyPaymentForm(): PaymentForm {
  return {
    status: "paid",
    paymentDate: "",
    method: "bank_transfer",
    reference: "",
    receiptFileName: "",
    internalNote: "",
    issueNote: ""
  };
}

function toLocalDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
