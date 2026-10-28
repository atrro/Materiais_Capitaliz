import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { ProjectApp } from "./App";
import PasswordGate from "./components/PasswordGate";
import { hasKey } from "./lib/crypto";

function Root() {
  const [authed, setAuthed] = useState(() => hasKey());
  if (!authed) return <PasswordGate onSuccess={() => setAuthed(true)} />;
  return <ProjectApp />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
