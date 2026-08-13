import type { ReactNode } from "react";
import { useEffect } from "react";
import { useProfessionalStore } from "../store/professionalStore";

export function BackendBootstrap({ children }: { children: ReactNode }) {
  const initializeBackend = useProfessionalStore(
    (state) => state.initializeBackend
  );

  useEffect(() => {
    void initializeBackend();
  }, [initializeBackend]);

  return children;
}
