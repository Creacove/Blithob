import {
  Archive,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileClock,
  FileCheck2,
  Pause,
  RotateCcw,
  Send,
  ShieldCheck,
  UserCheck,
  XCircle,
  WalletCards
} from "lucide-react";
import type {
  AssignmentStatus,
  JobOperationalStatus,
  PaymentStatus,
  ServiceEnrolmentStatus
} from "../domain/model";
import type {
  OpportunityStatus,
  PayoutStatus,
  TrainingStatus
} from "../domain/types";

type Status =
  | ServiceEnrolmentStatus
  | AssignmentStatus
  | JobOperationalStatus
  | PaymentStatus
  | OpportunityStatus
  | PayoutStatus
  | TrainingStatus
  | "forwarded";

const labels: Record<Status, string> = {
  not_started: "Not started",
  draft: "Draft",
  open: "Open",
  active: "Active",
  complete: "Complete",
  archived: "Archived",
  assigned: "Assigned",
  in_progress: "In progress",
  waiting_for_lead: "Waiting for Lead",
  changes_requested_by_lead: "Lead requested changes",
  waiting_for_admin: "Waiting for Admin",
  changes_requested_by_admin: "Admin requested changes",
  submitted: "Waiting for review",
  needs_revision: "Changes requested",
  accepted: "Approved",
  approved: "Approved",
  completed: "Completed",
  cancelled: "Cancelled",
  paused: "Paused",
  due: "Payment due",
  pending: "Payment due",
  scheduled: "Payment scheduled",
  paid: "Paid",
  issue: "Payment issue",
  awaiting_review: "Training review needed",
  lead_approved: "Lead approved",
  forwarded: "Forwarded"
};

const styles: Record<Status, string> = {
  not_started: "bg-slate-100 text-slate-600",
  draft: "bg-slate-100 text-slate-600",
  open: "bg-blue-50 text-blue-700",
  active: "bg-blue-50 text-blue-700",
  complete: "bg-emerald-50 text-emerald-700",
  archived: "bg-slate-100 text-slate-600",
  assigned: "bg-indigo-50 text-indigo-700",
  in_progress: "bg-amber-50 text-amber-700",
  waiting_for_lead: "bg-violet-50 text-violet-700",
  changes_requested_by_lead: "bg-orange-50 text-orange-700",
  waiting_for_admin: "bg-blue-50 text-blue-700",
  changes_requested_by_admin: "bg-orange-50 text-orange-700",
  submitted: "bg-violet-50 text-violet-700",
  needs_revision: "bg-orange-50 text-orange-700",
  accepted: "bg-emerald-50 text-emerald-700",
  approved: "bg-emerald-50 text-emerald-700",
  completed: "bg-slate-900 text-white",
  cancelled: "bg-red-50 text-red-700",
  paused: "bg-slate-100 text-slate-600",
  due: "bg-orange-50 text-orange-700",
  pending: "bg-orange-50 text-orange-700",
  scheduled: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
  issue: "bg-red-50 text-red-700",
  awaiting_review: "bg-violet-50 text-violet-700",
  lead_approved: "bg-blue-50 text-blue-700",
  forwarded: "bg-indigo-50 text-indigo-700"
};

const icons: Record<Status, typeof Check> = {
  not_started: CircleDot,
  draft: CircleDot,
  open: CircleDot,
  active: Clock3,
  complete: CheckCircle2,
  archived: Archive,
  assigned: Send,
  in_progress: Clock3,
  waiting_for_lead: FileClock,
  changes_requested_by_lead: RotateCcw,
  waiting_for_admin: ShieldCheck,
  changes_requested_by_admin: RotateCcw,
  submitted: FileCheck2,
  needs_revision: RotateCcw,
  accepted: Check,
  approved: CheckCircle2,
  completed: CheckCircle2,
  cancelled: XCircle,
  paused: Pause,
  due: WalletCards,
  pending: WalletCards,
  scheduled: Clock3,
  paid: CheckCircle2,
  issue: XCircle,
  awaiting_review: Clock3,
  lead_approved: UserCheck,
  forwarded: ShieldCheck
};

export function StatusBadge({ status }: { status: Status }) {
  const Icon = icons[status];
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      <Icon size={12} aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
