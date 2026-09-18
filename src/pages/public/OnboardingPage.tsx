import { ArrowLeft, ArrowRight } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { BrandMark } from "../../components/BrandMark";
import { CandidateDocumentManager } from "../../components/public/CandidateDocumentManager";
import { Button, Field, Input } from "../../components/ui";
import { useProfessionalStore } from "../../store/professionalStore";
import "./public.css";

export function OnboardingPage() {
  const session = useProfessionalStore((state) => state.session);
  const currentUser = useProfessionalStore((state) => state.currentUser());
  const currentProfessional = useProfessionalStore((state) => state.currentProfessional());
  const completeProfile = useProfessionalStore((state) => state.completeProfessionalProfile);
  const isLoading = useProfessionalStore((state) => state.isLoading);
  const error = useProfessionalStore((state) => state.error);
  const clearError = useProfessionalStore((state) => state.clearError);
  const backendMode = useProfessionalStore((state) => state.backendMode);
  const candidateDocuments = useProfessionalStore((state) => state.candidateDocuments);
  const loadCandidateDocuments = useProfessionalStore((state) => state.loadCandidateDocuments);
  const uploadCandidateDocument = useProfessionalStore((state) => state.uploadCandidateDocument);
  const archiveCandidateDocument = useProfessionalStore((state) => state.archiveCandidateDocument);
  const downloadCandidateDocument = useProfessionalStore((state) => state.downloadCandidateDocument);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : undefined;
  const [displayName, setDisplayName] = useState(currentUser?.name ?? "");
  const [phone, setPhone] = useState(currentProfessional?.phone ?? "");
  const [location, setLocation] = useState(currentProfessional?.location ?? "");
  useEffect(() => {
    void loadCandidateDocuments();
  }, [loadCandidateDocuments]);

  const hasCompletedCv = candidateDocuments.some(
    (document) =>
      document.documentType === "cv" &&
      document.isActive &&
      document.uploadComplete
  );

  if (!session || !currentUser) return <Navigate to={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    clearError();
    try {
      await completeProfile({ displayName, phone, location });
      navigate(next ?? "/professional/today", { replace: true });
    } catch {
      // The store exposes the actionable error in the form.
    }
  };

  return (
    <main className="public-page">
      <div className="public-shell public-onboarding-page">
        <div className="public-onboarding-top"><BrandMark /><Link to="/jobs" className="public-back-link"><ArrowLeft size={16} aria-hidden /> Browse jobs</Link></div>
        <section className="public-onboarding-card">
          <p className="public-eyebrow">One last step</p>
          <h1>Make your profile <em>real.</em></h1>
          <p className="public-lede">A little context helps the right opportunity find you. You can refine this anytime.</p>
          <CandidateDocumentManager
            documents={candidateDocuments}
            onUpload={uploadCandidateDocument}
            onArchive={archiveCandidateDocument}
            onDownload={backendMode === "remote" ? (document) => downloadCandidateDocument(document.id) : undefined}
          />
          <form onSubmit={submit} className="public-onboarding-form">
            <Field label="Name"><Input autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} /></Field>
            <Field label="Phone (optional)"><Input autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+234 800 000 0000" /></Field>
            <Field label="Location (optional)"><Input autoComplete="address-level2" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Lagos, Nigeria" /></Field>
            {error && <p role="alert" className="public-alert">{error}</p>}
            <Button type="submit" disabled={isLoading || !hasCompletedCv}>{isLoading ? "Saving profile…" : hasCompletedCv ? "Continue to application" : "Upload a completed CV to continue"}<ArrowRight size={16} aria-hidden /></Button>
          </form>
        </section>
      </div>
    </main>
  );
}
