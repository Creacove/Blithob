import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import type { AccountRole } from "./domain/model";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { RouteShell } from "./pages/RouteShell";
import { PeoplePage } from "./pages/admin/PeoplePage";
import { ProfessionalDetailPage } from "./pages/admin/ProfessionalDetailPage";
import { AdminAssignmentPage } from "./pages/admin/AdminAssignmentPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminPaymentPage } from "./pages/admin/AdminPaymentPage";
import { AdminPaymentsPage } from "./pages/admin/AdminPaymentsPage";
import { AdminReviewsPage } from "./pages/admin/AdminReviewsPage";
import { JobDetailPage } from "./pages/admin/JobDetailPage";
import { JobEditorPage } from "./pages/admin/JobEditorPage";
import { JobsPage } from "./pages/admin/JobsPage";
import { ServiceDetailPage } from "./pages/admin/ServiceDetailPage";
import { ServicesPage } from "./pages/admin/ServicesPage";
import { AssignmentPage } from "./pages/professional/AssignmentPage";
import { PaymentDetailPage } from "./pages/professional/PaymentDetailPage";
import { PaymentsPage } from "./pages/professional/PaymentsPage";
import { ProfilePage } from "./pages/professional/ProfilePage";
import { TodayPage } from "./pages/professional/TodayPage";
import { TrainingDetailPage } from "./pages/professional/TrainingDetailPage";
import { TrainingPage } from "./pages/professional/TrainingPage";
import { WorkPage } from "./pages/professional/WorkPage";
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
            element={<AdminDashboard />}
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
            element={<ServicesPage />}
          />
          <Route
            path="/admin/services/:serviceId"
            element={<ServiceDetailPage />}
          />
          <Route
            path="/admin/jobs"
            element={<JobsPage />}
          />
          <Route
            path="/admin/jobs/new"
            element={<JobEditorPage />}
          />
          <Route
            path="/admin/jobs/:jobId/edit"
            element={<JobEditorPage />}
          />
          <Route
            path="/admin/jobs/:jobId"
            element={<JobDetailPage />}
          />
          <Route
            path="/admin/assignments/:assignmentId"
            element={<AdminAssignmentPage />}
          />
          <Route
            path="/admin/reviews"
            element={<AdminReviewsPage />}
          />
          <Route
            path="/admin/payments"
            element={<AdminPaymentsPage />}
          />
          <Route
            path="/admin/payments/:paymentId"
            element={<AdminPaymentPage />}
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
            element={<TodayPage />}
          />
          <Route
            path="/professional/work"
            element={<WorkPage />}
          />
          <Route
            path="/professional/work/:assignmentId"
            element={<AssignmentPage />}
          />
          <Route
            path="/professional/training"
            element={<TrainingPage />}
          />
          <Route
            path="/professional/training/:enrolmentId"
            element={<TrainingDetailPage />}
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
            element={<PaymentsPage />}
          />
          <Route
            path="/professional/payments/:paymentId"
            element={<PaymentDetailPage />}
          />
          <Route
            path="/professional/profile"
            element={<ProfilePage />}
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
