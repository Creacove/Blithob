import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import type { AccountRole } from "./domain/model";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { RouteShell } from "./pages/RouteShell";
import { PeoplePage } from "./pages/admin/PeoplePage";
import { ProfessionalDetailPage } from "./pages/admin/ProfessionalDetailPage";
import { useProfessionalStore } from "./store/professionalStore";

function ProtectedAccount({ role }: { role: AccountRole }) {
  const user = useProfessionalStore((state) => state.currentUser());
  if (!user) return <Navigate to="/login" replace />;
  if (user.accountRole !== role) {
    return (
      <Navigate
        to={
          user.accountRole === "admin"
            ? "/admin/today"
            : "/professional/today"
        }
        replace
      />
    );
  }
  return <Outlet />;
}

function LeadOnly() {
  const professional = useProfessionalStore((state) =>
    state.currentProfessional()
  );
  return professional?.isLead ? (
    <Outlet />
  ) : (
    <Navigate to="/professional/today" replace />
  );
}

const route = (title: string, description: string) => (
  <RouteShell title={title} description={description} />
);

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedAccount role="admin" />}>
        <Route element={<AppShell role="admin" />}>
          <Route
            path="/admin/today"
            element={route(
              "Today",
              "Review the operational decisions that need Admin attention."
            )}
          />
          <Route
            path="/admin/people"
            element={<PeoplePage />}
          />
          <Route
            path="/admin/people/:professionalId"
            element={<ProfessionalDetailPage />}
          />
          <Route
            path="/admin/services"
            element={route(
              "Services",
              "Define service categories and the readiness required for each one."
            )}
          />
          <Route
            path="/admin/services/:serviceId"
            element={route(
              "Service",
              "Edit readiness requirements and review enrolled Professionals."
            )}
          />
          <Route
            path="/admin/jobs"
            element={route(
              "Jobs",
              "Create structured briefs and manage independent Assignments."
            )}
          />
          <Route
            path="/admin/jobs/new"
            element={route(
              "Create job",
              "Write a complete brief before assigning Professionals."
            )}
          />
          <Route
            path="/admin/jobs/:jobId"
            element={route(
              "Job",
              "Review the full brief, Assignment progress, and activity."
            )}
          />
          <Route
            path="/admin/assignments/:assignmentId"
            element={route(
              "Assignment",
              "Review one Professional's delivery, decisions, and payment state."
            )}
          />
          <Route
            path="/admin/reviews"
            element={route(
              "Reviews",
              "Resolve work submissions and readiness approvals."
            )}
          />
          <Route
            path="/admin/payments"
            element={route(
              "Payments",
              "Record manual payments, receipts, and payment issues."
            )}
          />
          <Route
            path="/admin/payments/:paymentId"
            element={route(
              "Payment record",
              "Review payment evidence and correction history."
            )}
          />
          <Route
            path="/admin/notifications"
            element={<NotificationsPage />}
          />
          <Route
            path="/admin"
            element={<Navigate to="/admin/today" replace />}
          />
        </Route>
      </Route>

      <Route element={<ProtectedAccount role="professional" />}>
        <Route element={<AppShell role="professional" />}>
          <Route
            path="/professional/today"
            element={route(
              "Today",
              "Start with the most important delivery or readiness action."
            )}
          />
          <Route
            path="/professional/work"
            element={route(
              "Work",
              "Review Assignments, deadlines, feedback, and submissions."
            )}
          />
          <Route
            path="/professional/work/:assignmentId"
            element={route(
              "Assignment",
              "Use the full brief, checklist, and review history to deliver the work."
            )}
          />
          <Route
            path="/professional/training"
            element={route(
              "Training",
              "Complete the readiness requirements for each Service."
            )}
          />
          <Route
            path="/professional/training/:enrolmentId"
            element={route(
              "Service readiness",
              "Complete evidence and follow Lead or Admin feedback."
            )}
          />
          <Route element={<LeadOnly />}>
            <Route
              path="/professional/team"
              element={route(
                "Team",
                "Track the Service readiness of Professionals assigned to you."
              )}
            />
            <Route
              path="/professional/team/:enrolmentId"
              element={route(
                "Training review",
                "Review readiness evidence and send a clear decision."
              )}
            />
            <Route
              path="/professional/reviews"
              element={route(
                "Reviews",
                "Review submitted Assignments before they move to Admin."
              )}
            />
          </Route>
          <Route
            path="/professional/payments"
            element={route(
              "Payments",
              "Track due, scheduled, paid, and issue records."
            )}
          />
          <Route
            path="/professional/payments/:paymentId"
            element={route(
              "Payment record",
              "Review the payment method, reference, and receipt record."
            )}
          />
          <Route
            path="/professional/profile"
            element={route(
              "Profile",
              "Keep your contact details and service eligibility current."
            )}
          />
          <Route
            path="/professional/notifications"
            element={<NotificationsPage />}
          />
          <Route
            path="/professional"
            element={<Navigate to="/professional/today" replace />}
          />
        </Route>
      </Route>

      <Route
        path="/admin/dashboard"
        element={<Navigate to="/admin/today" replace />}
      />
      <Route
        path="/admin/workers"
        element={<Navigate to="/admin/people" replace />}
      />
      <Route
        path="/admin/training"
        element={<Navigate to="/admin/services" replace />}
      />
      <Route
        path="/admin/opportunities"
        element={<Navigate to="/admin/jobs" replace />}
      />
      <Route
        path="/admin/payouts"
        element={<Navigate to="/admin/payments" replace />}
      />
      <Route
        path="/worker/dashboard"
        element={<Navigate to="/professional/today" replace />}
      />
      <Route
        path="/worker/training"
        element={<Navigate to="/professional/training" replace />}
      />
      <Route
        path="/worker/jobs"
        element={<Navigate to="/professional/work" replace />}
      />
      <Route
        path="/worker/payouts"
        element={<Navigate to="/professional/payments" replace />}
      />
      <Route
        path="/worker/profile"
        element={<Navigate to="/professional/profile" replace />}
      />
      <Route
        path="/worker/notifications"
        element={<Navigate to="/professional/notifications" replace />}
      />
      <Route
        path="/trainer/dashboard"
        element={<Navigate to="/professional/today" replace />}
      />
      <Route
        path="/trainer/trainees"
        element={<Navigate to="/professional/team" replace />}
      />
      <Route
        path="/trainer/reviews"
        element={<Navigate to="/professional/reviews" replace />}
      />
      <Route
        path="/trainer/jobs"
        element={<Navigate to="/professional/work" replace />}
      />
      <Route
        path="/trainer/notifications"
        element={<Navigate to="/professional/notifications" replace />}
      />
      <Route
        path="/worker/*"
        element={<Navigate to="/professional/today" replace />}
      />
      <Route
        path="/trainer/*"
        element={<Navigate to="/professional/today" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
