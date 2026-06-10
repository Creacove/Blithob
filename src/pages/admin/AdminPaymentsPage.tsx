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
  EmptyState,
  Field,
  Input,
  RecordList,
  Select,
  Textarea,
  Toolbar
} from "../../components/ui";
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
  const { success } = useToast();
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

  const save = () => {
    if (!selected || !canSave) return;
    recordPayment(selected.id, {
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
            tone: "attention"
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
            tone: "attention"
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
              <div
                key={payment.id}
                className="grid gap-3 px-4 py-4 sm:px-5 xl:grid-cols-[minmax(14rem,1.2fr)_auto_auto_minmax(10rem,0.65fr)_auto] xl:items-center"
              >
                <div>
                  <Link
                    to={`/admin/payments/${payment.id}`}
                    className="font-semibold text-[var(--ink)] hover:text-[var(--blue)]"
                  >
                    {job?.title ?? "Assignment payment"}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {professional?.name ?? "Unknown Professional"}
                  </p>
                </div>
                <p className="font-semibold text-[var(--ink)]">
                  {formatCurrency(payment.amount)}
                </p>
                <StatusBadge status={payment.status} />
                <div className="text-sm text-[var(--muted)]">
                  <p>Due {formatDate(payment.dueDate)}</p>
                  <p className="mt-1">
                    {payment.method
                      ? paymentMethodLabel(payment.method)
                      : "Method not recorded"}
                    {payment.reference ? ` - ${payment.reference}` : ""}
                  </p>
                  {payment.receiptFileName && (
                    <p className="mt-1 flex items-center gap-1 font-medium text-emerald-700">
                      <FileCheck2 size={14} aria-hidden />
                      {payment.receiptFileName}
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
                    Record payment
                  </Button>
                )}
              </div>
            );
          })}
        </RecordList>
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
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSelectedId(undefined)}>
                Cancel
              </Button>
              <Button disabled={!canSave} onClick={save}>
                Save payment
              </Button>
            </div>
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
