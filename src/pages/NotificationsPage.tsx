import { Bell, CheckCheck } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { EmptyState, RecordList } from "../components/ui";
import { formatDateTime } from "../lib/format";
import { useProfessionalStore } from "../store/professionalStore";

export function NotificationsPage() {
  const user = useProfessionalStore((state) => state.currentUser());
  const allNotifications = useProfessionalStore(
    (state) => state.notifications
  );
  const notifications = allNotifications.filter(
    (item) => item.recipientUserId === user?.id
  );
  const markRead = useProfessionalStore(
    (state) => state.markNotificationRead
  );

  const handleRead = (notificationId: string) => {
    void Promise.resolve(markRead(notificationId)).catch(() => undefined);
  };

  return (
    <div>
      <PageHeader
        title="Updates"
        description="Workflow notices for this account, ordered from newest to oldest."
        mobileDescription="hide"
      />
      <div className="mt-6">
        {notifications.length === 0 ? (
          <EmptyState
            title="No updates"
            description="Relevant workflow notifications will appear here."
          />
        ) : (
          <RecordList label="Notifications">
            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleRead(item.id)}
                className="flex w-full items-start gap-4 px-4 py-4 text-left transition hover:bg-[var(--surface-subtle)] sm:px-5"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-[10px] ${
                    item.read
                      ? "bg-slate-100 text-slate-400"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  <Bell size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="text-base font-semibold text-[var(--ink)]">
                      {item.title}
                    </strong>
                    {!item.read && (
                      <span
                        className="h-2 w-2 rounded-full bg-[var(--attention)]"
                        aria-label="Unread"
                      />
                    )}
                  </span>
                  <span className="mobile-supporting-copy mt-1 block max-w-[66ch] text-sm leading-5 text-[var(--muted)] sm:text-base sm:leading-6">
                    {item.message}
                  </span>
                  <span className="mt-2 block text-sm text-[var(--muted)]">
                    {formatDateTime(item.createdAt)}
                  </span>
                </span>
                {item.read && (
                  <CheckCheck
                    size={17}
                    className="mt-1 shrink-0 text-emerald-600"
                    aria-label="Read"
                  />
                )}
              </button>
            ))}
          </RecordList>
        )}
      </div>
    </div>
  );
}
