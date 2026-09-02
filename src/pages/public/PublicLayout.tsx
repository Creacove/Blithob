import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "../../components/BrandMark";
import { usePublicAccountNavigation } from "../../lib/accountNavigation";

export function PublicHeader() {
  const account = usePublicAccountNavigation();

  return (
    <header className="public-header">
      <div className="public-shell public-header-inner">
        <div className="public-header-brand">
          <BrandMark />
        </div>
        <nav className="public-header-nav" aria-label="Public navigation">
          <Link to="/jobs">Find jobs</Link>
          <Link to="/#process">How it works</Link>
          <Link to="/#why">Why Blithob Pro</Link>
        </nav>
        <div className="public-header-actions">
          {account.status === "loading" && <span className="public-header-account-status">Loading…</span>}
          {account.status === "signedOut" && <>
            <Link to="/login" className="public-header-login">Sign in</Link>
            <Link to="/login" className="public-header-cta">Create profile <ArrowRight size={15} aria-hidden /></Link>
          </>}
          {account.status === "signedIn" && <>
            {account.applicationsPath && <Link to={account.applicationsPath} className="public-header-login">My applications</Link>}
            <Link to={account.workspacePath} className="public-header-cta">{account.primaryLabel} <ArrowRight size={15} aria-hidden /></Link>
          </>}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  const account = usePublicAccountNavigation();

  return (
    <footer className="public-footer">
      <div className="public-shell public-footer-inner">
        <div>
          <BrandMark />
          <p>Clear opportunities. Better next steps.</p>
        </div>
        <div className="public-footer-links">
          <Link to="/jobs">Find jobs</Link>
          {account.status === "loading" && <span>Loading account…</span>}
          {account.status === "signedOut" && <>
            <Link to="/login">Create your profile</Link>
            <Link to="/login">Sign in</Link>
          </>}
          {account.status === "signedIn" && <>
            {account.applicationsPath && <Link to={account.applicationsPath}>My applications</Link>}
            <Link to={account.workspacePath}>{account.primaryLabel}</Link>
          </>}
        </div>
      </div>
    </footer>
  );
}
