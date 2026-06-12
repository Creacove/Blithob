import { ArrowLeft, FileCheck2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Drawer } from "../../components/Drawer";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { useToast } from "../../components/ToastProvider";
import {
  Button,
  Field,
  Input,
  MetaList,
  Section,
  Select,
  Textarea
} from "../../components/ui";
import type { PaymentMethod } from "../../domain/model";
import { formatCurrency, formatDate, formatDateTime } from "../../lib/format";
import { paymentMethodLabel } from "../../lib/payment";
import { useProfessionalStore } from "../../store/professionalStore";
import { RouteShell } from "../RouteShell";

export function AdminPaymentPage() {
  const { paymentId } = useParams();
  const payment = useProfessionalStore((state) =>
    state.payments.find((item) => item.id === paymentId)
  );
  const assignment = useProfessionalStore((state) =>
    state.assignments.find((item) => item.id === payment?.assignmentId)
  );
  const job = useProfessionalStore((state) =>
    state.jobs.find((item) => item.id === assignment?.jobId)
  );
  const professional = useProfessionalStore((state) =>
    state.professionals.find((item) => item.id === payment?.professionalId)
  );
  const correctPayment = useProfessionalStore(
    (state) => state.correctPayment
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(() =>
    toLocalDateTime(payment?.paymentDate ?? "")
  );
  const [method, setMethod] = useState<PaymentMethod>(
    () => payment?.method ?? "bank_transfer"
  );
  const [reference, setReference] = useState(
    () => payment?.reference ?? ""
  );
  const [receiptFileName, setReceiptFileName] = useState(
    () => payment?.receiptFileName ?? ""
  );
  const [internalNote, setInternalNote] = useState(
    () => payment?.internalNote ?? ""
  );
  const [correctionNote, setCorrectionNote] = useState("");
  const { success } = useToast();

  if (!payment || !assignment || !job || !professional) {
    return (
      <RouteShell
        title="Payment not found"
        description="The requested Payment record does not exist."
      />
    );
  }

  const canCorrect =
    paymentDate &&
    method &&
    (method === "cash" || reference.trim()) &&
    correctionNote.trim();

  const saveCorrection = () => {
    if (!canCorrect) return;
    correctPayment(payment.id, {
      paymentDate: new Date(paymentDate).toISOString(),
      method,
      reference,
      receiptFileName,
      internalNote,
      correctionNote
    });
    setDrawerOpen(false);
    setCorrectionNote("");
    success("Payment record corrected");
  };

  return (
    <div>
      <PageHeader
        title={job.title}
        description={`Payment for ${professional.name}`}
        actions={
          <Link
            to="/admin/payments"
            className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Payments
          </Link>
        }
      />
      <div className="mt-6 grid gap-5">
        <Section
          title="Payment overview"
          action={
            payment.status === "paid" ? (
              <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                Correct record
              </Button>
            ) : undefined
          }
        >
          <MetaList
            items={[
              { label: "Professional", value: professional.name },
              { label: "Job", value: job.title },
              {
                label: "Assignment",
                value: (
                  <Link
                    to={`/admin/assignments/${assignment.id}`}
                    className="text-[var(--blue)]"
                  >
                    Open Assignment
                  </Link>
                )
              },
              { label: "Amount", value: formatCurrency(payment.amount) },
              { label: "Due date", value: formatDate(payment.dueDate) },
              {
                label: "Status",
                value: <StatusBadge status={payment.status} />
              }
            ]}
          />
        </Section>
        <Section title="Payment evidence" mobileDisclosure="collapsed">
          <MetaList
            items={[
              {
                label: "Payment date",
                value: payment.paymentDate
                  ? formatDateTime(payment.paymentDate)
                  : "Not recorded"
              },
              {
                label: "Method",
                value: payment.method
                  ? paymentMethodLabel(payment.method)
                  : "Not recorded"
              },
              {
                label: "Reference",
                value: payment.reference ?? "Not recorded"
              },
              {
                label: "Receipt",
                value: payment.receiptFileName ? (
                  <span className="inline-flex items-center gap-2">
                    <FileCheck2 size={15} aria-hidden />
                    {payment.receiptFileName}
                  </span>
                ) : (
                  "Not attached"
                )
              }
            ]}
          />
          {payment.internalNote && (
            <div className="mt-5 border-t border-[var(--border)] pt-5">
              <h3 className="font-semibold text-[var(--ink)]">Internal note</h3>
              <p className="mt-1 text-base leading-6 text-[var(--muted)]">
                {payment.internalNote}
              </p>
            </div>
          )}
        </Section>
        {(payment.issueNote || payment.correctionNote) && (
          <Section
            title="Issue and correction history"
            mobileDisclosure="collapsed"
          >
            {payment.issueNote && (
              <div>
                <p className="font-semibold text-red-700">Payment issue</p>
                <p className="mt-1 text-base text-[var(--muted)]">
                  {payment.issueNote}
                </p>
              </div>
            )}
            {payment.correctionNote && (
              <div className={payment.issueNote ? "mt-5" : ""}>
                <p className="font-semibold text-[var(--ink)]">
                  Corrected{" "}
                  {payment.correctedAt
                    ? formatDateTime(payment.correctedAt)
                    : ""}
                </p>
                <p className="mt-1 text-base text-[var(--muted)]">
                  {payment.correctionNote}
                </p>
              </div>
            )}
          </Section>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Correct payment record"
        description="Paid records stay read-only until a reasoned correction is saved."
      >
        <div className="space-y-5">
          <Field label="Payment date">
            <Input
              type="datetime-local"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
            />
          </Field>
          <Field label="Method">
            <Select
              value={method}
              onChange={(event) =>
                setMethod(event.target.value as PaymentMethod)
              }
            >
              <option value="bank_transfer">Bank transfer</option>
              <option value="mobile_money">Mobile money</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Payment reference">
            <Input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
          </Field>
          <Field label="Receipt file name">
            <Input
              value={receiptFileName}
              onChange={(event) => setReceiptFileName(event.target.value)}
            />
          </Field>
          <Field label="Internal note">
            <Textarea
              value={internalNote}
              onChange={(event) => setInternalNote(event.target.value)}
            />
          </Field>
          <Field label="Correction reason">
            <Textarea
              value={correctionNote}
              onChange={(event) => setCorrectionNote(event.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!canCorrect} onClick={saveCorrection}>
              Save correction
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

function toLocalDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
