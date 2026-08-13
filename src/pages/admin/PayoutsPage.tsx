import { CheckCircle2, FileCheck2 } from "lucide-react";
import { useState } from "react";
import { Modal } from "../../components/Modal";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { SummaryBand } from "../../components/SummaryBand";
import { Button, Field, Input, Select } from "../../components/ui";
import { formatCurrency, formatDate } from "../../lib/format";
import { useAppStore } from "../../store/appStore";

export function PayoutsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank transfer");
  const [receiptFileName, setReceiptFileName] = useState("");
  
  const payouts = useAppStore((state) => state.payouts);
  const workers = useAppStore((state) => state.workers);
  const opportunities = useAppStore((state) => state.opportunities);
  const markPaid = useAppStore((state) => state.markPayoutPaid);
  const selected = payouts.find((item) => item.id === selectedId);

  return (
    <div>
      <PageHeader
        eyebrow="Financial records"
        title="Payments"
        description="Record payments handled outside the platform and keep workers informed."
      />
      <SummaryBand
        className="mt-6"
        items={[
          {
            label: "Payments due",
            value: payouts.filter((item) => item.status === "pending").length,
            tone: "attention"
          },
          {
            label: "Amount due",
            value: formatCurrency(
              payouts
                .filter((item) => item.status === "pending")
                .reduce((sum, item) => sum + item.amount, 0)
            ),
            tone: "attention"
          },
          {
            label: "Paid records",
            value: payouts.filter((item) => item.status === "paid").length,
            tone: "positive"
          }
        ]}
      />

      <div className="mt-8 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(16,42,67,0.05)]">
        <div className="divide-y divide-slate-100">
          {payouts.map((payout) => {
            const worker = workers.find((item) => item.id === payout.workerId);
            const opportunity = opportunities.find(
              (item) => item.id === payout.opportunityId
            );
            return (
              <article
                key={payout.id}
                className="grid gap-4 p-5 lg:grid-cols-[1fr_0.65fr_0.55fr_0.6fr_auto] lg:items-center"
              >
                <div>
                  <p className="text-sm font-bold text-[#102A43]">
                    {opportunity?.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{worker?.name}</p>
                </div>
                <p className="font-[Poppins] text-sm font-semibold text-[#102A43]">
                  {formatCurrency(payout.amount)}
                </p>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Due
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#102A43]">
                    {formatDate(payout.dueDate)}
                  </p>
                </div>
                <div>
                  <StatusBadge status={payout.status} />
                  {payout.reference && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      Ref: {payout.reference}
                    </p>
                  )}
                  {payout.paymentMethod && (
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Method: {payout.paymentMethod}
                    </p>
                  )}
                  {payout.receiptFileName && (
                    <p className="mt-0.5 text-[10px] text-indigo-600 font-medium">
                      Receipt: {payout.receiptFileName}
                    </p>
                  )}
                </div>
                {payout.status === "pending" ? (
                  <Button
                    className="text-xs"
                    onClick={() => setSelectedId(payout.id)}
                  >
                    Record payment
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={16} /> Recorded
                  </span>
                )}
              </article>
            );
          })}
        </div>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title="Record completed payment"
        description="Record an external transfer for this payment."
      >
        {selected && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-[#F7F8FA] p-5">
              <p className="text-xs text-slate-500">Amount paid</p>
              <p className="mt-1 font-[Poppins] text-3xl font-semibold text-[#102A43]">
                {formatCurrency(selected.amount)}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Payment method">
                <Select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  <option value="Bank transfer">Bank transfer</option>
                  <option value="Mobile money">Mobile money</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </Select>
              </Field>
              <Field
                label="Payment reference"
                hint="Use transfer or bank reference."
              >
                <Input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="e.g. TRF-0626-1048"
                />
              </Field>
            </div>
            <Field label="Receipt document (optional)">
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setReceiptFileName(file.name);
                  }
                }}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {receiptFileName && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                  <FileCheck2 size={14} /> Selected: {receiptFileName}
                </p>
              )}
            </Field>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setSelectedId(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={!reference.trim()}
                onClick={() => {
                  markPaid(
                    selected.id,
                    reference.trim(),
                    paymentMethod,
                    receiptFileName || undefined
                  );
                  setReference("");
                  setReceiptFileName("");
                  setSelectedId(null);
                }}
              >
                Confirm paid
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
