import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "../../components/BrandMark";

export function PublicHeader() {
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
          <Link to="/login" className="public-header-login">Sign in</Link>
          <Link to="/login" className="public-header-cta">Create profile <ArrowRight size={15} aria-hidden /></Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-shell public-footer-inner">
        <div>
          <BrandMark />
          <p>Clear opportunities. Better next steps.</p>
        </div>
        <div className="public-footer-links">
          <Link to="/jobs">Find jobs</Link>
          <Link to="/login">Create your profile</Link>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
