import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileCheck2,
  RotateCcw,
  Send,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import type { OpportunityStatus, PayoutStatus, TrainingStatus } from "../domain/types";

type Status = OpportunityStatus | PayoutStatus | TrainingStatus | "forwarded";

const labels: Record<Status, string> = {
  draft: "Draft",
  open: "Open",
  assigned: "Assigned",
  in_progress: "In progress",
  submitted: "Waiting for review",
  needs_revision: "Changes requested",
  accepted: "Approved",
  completed: "Completed",
  pending: "Payment due",
  scheduled: "Payment scheduled",
  paid: "Paid",
  awaiting_review: "Training review needed",
  lead_approved: "Lead approved",
  approved: "Approved",
  forwarded: "Forwarded"
};

const styles: Record<Status, string> = {
  draft: "bg-slate-100 text-slate-600",
  open: "bg-blue-50 text-blue-700",
  assigned: "bg-indigo-50 text-indigo-700",
  in_progress: "bg-amber-50 text-amber-700",
  submitted: "bg-violet-50 text-violet-700",
  needs_revision: "bg-orange-50 text-orange-700",
  accepted: "bg-emerald-50 text-emerald-700",
  completed: "bg-slate-900 text-white",
  pending: "bg-orange-50 text-orange-700",
  scheduled: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
  awaiting_review: "bg-violet-50 text-violet-700",
  lead_approved: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  forwarded: "bg-indigo-50 text-indigo-700"
};

const icons: Record<Status, typeof Check> = {
  draft: CircleDot,
  open: CircleDot,
  assigned: Send,
  in_progress: Clock3,
  submitted: FileCheck2,
  needs_revision: RotateCcw,
  accepted: Check,
  completed: CheckCircle2,
  pending: WalletCards,
  scheduled: Clock3,
  paid: CheckCircle2,
  awaiting_review: Clock3,
  lead_approved: ShieldCheck,
  approved: CheckCircle2,
  forwarded: ArrowRight
};

export function StatusBadge({ status }: { status: Status }) {
  const Icon = icons[status];
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      <Icon size={12} aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
