import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { BackendBootstrap } from "./components/BackendBootstrap";
import { ToastProvider } from "./components/ToastProvider";
import "./index.css";
import "./pages/LandingPage.art.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <BackendBootstrap>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </BackendBootstrap>
    </ToastProvider>
  </StrictMode>
);
