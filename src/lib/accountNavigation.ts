import { useProfessionalStore } from "../store/professionalStore";

export type PublicAccountNavigation =
  | {
      status: "loading" | "signedOut";
      userName?: undefined;
      primaryLabel?: undefined;
      workspacePath?: undefined;
      applicationsPath?: undefined;
    }
  | {
      status: "signedIn";
      userName: string;
      primaryLabel: "Open workspace" | "Complete profile";
      workspacePath: string;
      applicationsPath?: string;
    };

/**
 * Keeps the public marketing shell aligned with the same Zustand session that
 * protects the in-app workspace. A bootstrapping session is intentionally not
 * presented as signed out, so returning users never see a misleading sign-in
 * CTA while Supabase restores their account.
 */
export function usePublicAccountNavigation(): PublicAccountNavigation {
  const session = useProfessionalStore((state) => state.session);
  const currentUser = useProfessionalStore((state) => state.currentUser());
  const currentProfessional = useProfessionalStore((state) =>
    state.currentProfessional()
  );
  const isBootstrapping = useProfessionalStore(
    (state) => state.isBootstrapping
  );

  if (!session) {
    return isBootstrapping ? { status: "loading" } : { status: "signedOut" };
  }

  const accountRole =
    currentUser?.accountRole ??
    (session.persona === "admin" ? "admin" : "professional");
  const profileReady = accountRole === "admin" || Boolean(currentProfessional);
  const workspacePath =
    accountRole === "admin"
      ? "/admin/today"
      : profileReady
        ? "/professional/today"
        : "/onboarding";

  return {
    status: "signedIn",
    userName: currentUser?.name ?? "Blithob professional",
    primaryLabel: profileReady ? "Open workspace" : "Complete profile",
    workspacePath,
    ...(accountRole === "professional" && profileReady
      ? { applicationsPath: "/professional/applications" }
      : {})
  };
}
