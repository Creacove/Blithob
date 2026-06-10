import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import type { Role } from "./domain/types";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminReviewsPage } from "./pages/admin/AdminReviewsPage";
import { AdminTrainingPage } from "./pages/admin/AdminTrainingPage";
import { OpportunitiesPage } from "./pages/admin/OpportunitiesPage";
import { PayoutsPage } from "./pages/admin/PayoutsPage";
import { WorkersPage } from "./pages/admin/WorkersPage";
import { MyWorkPage } from "./pages/shared/MyWorkPage";
import { TraineesPage } from "./pages/trainer/TraineesPage";
import { TrainerDashboard } from "./pages/trainer/TrainerDashboard";
import { TrainerReviewsPage } from "./pages/trainer/TrainerReviewsPage";
import { ProfilePage } from "./pages/worker/ProfilePage";
import { WorkerDashboard } from "./pages/worker/WorkerDashboard";
import { WorkerPayoutsPage } from "./pages/worker/WorkerPayoutsPage";
import { WorkerTrainingPage } from "./pages/worker/WorkerTrainingPage";
import { useAppStore } from "./store/appStore";

function ProtectedRole({ role }: { role: Role }) {
  const session = useAppStore((state) => state.session);
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) {
    return <Navigate to={`/${session.role}/dashboard`} replace />;
  }
  return <Outlet />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRole role="admin" />}>
        <Route element={<AppShell role="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/workers" element={<WorkersPage />} />
          <Route path="/admin/opportunities" element={<OpportunitiesPage />} />
          <Route path="/admin/training" element={<AdminTrainingPage />} />
          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
          <Route path="/admin/payouts" element={<PayoutsPage />} />
          <Route
            path="/admin/notifications"
            element={<NotificationsPage role="admin" />}
          />
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
        </Route>
      </Route>

      <Route element={<ProtectedRole role="trainer" />}>
        <Route element={<AppShell role="trainer" />}>
          <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
          <Route path="/trainer/trainees" element={<TraineesPage />} />
          <Route path="/trainer/reviews" element={<TrainerReviewsPage />} />
          <Route
            path="/trainer/jobs"
            element={
              <MyWorkPage
                eyebrow="Trainer delivery"
                description="Your personal assignments are separate from the submissions you review."
              />
            }
          />
          <Route
            path="/trainer/notifications"
            element={<NotificationsPage role="trainer" />}
          />
          <Route
            path="/trainer"
            element={<Navigate to="/trainer/dashboard" replace />}
          />
        </Route>
      </Route>

      <Route element={<ProtectedRole role="worker" />}>
        <Route element={<AppShell role="worker" />}>
          <Route path="/worker/dashboard" element={<WorkerDashboard />} />
          <Route path="/worker/training" element={<WorkerTrainingPage />} />
          <Route path="/worker/jobs" element={<MyWorkPage />} />
          <Route path="/worker/payouts" element={<WorkerPayoutsPage />} />
          <Route path="/worker/profile" element={<ProfilePage />} />
          <Route
            path="/worker/notifications"
            element={<NotificationsPage role="worker" />}
          />
          <Route
            path="/worker"
            element={<Navigate to="/worker/dashboard" replace />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
