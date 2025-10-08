import React from "react";

import type { DiagnosticEvent } from "../lib/fetchWithDiagnostics";

type Row = {
  id: string;
  phase: DiagnosticEvent["phase"];
  method: string;
  url: string;
  status?: number;
  classification?: DiagnosticEvent["classification"];
  reason?: string;
  ts: string;
};

const shouldEnable = () => {
  if (typeof window === "undefined") {
    return false;
  }

  if (import.meta.env.MODE !== "production") {
    return true;
  }

  try {
    if (new URLSearchParams(window.location.search).get("debug") === "1") {
      return true;
    }
  } catch {
    // ignore
  }

  try {
    if (window.localStorage.getItem("debug") === "1") {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
};

export default function DebugPanel() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const enabledRef = React.useRef<boolean>(shouldEnable());

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<DiagnosticEvent>).detail;
      if (!detail) {
        return;
      }

      setRows((current) => [
        {
          id: Math.random().toString(36).slice(2),
          phase: detail.phase,
          method: detail.method,
          url: detail.url,
          status: detail.status,
          classification: detail.classification,
          reason: detail.reason,
          ts: detail.ts,
        },
        ...current,
      ].slice(0, 20));
    };

    window.addEventListener("diagnostic" as any, handler as EventListener);
    return () => window.removeEventListener("diagnostic" as any, handler as EventListener);
  }, []);

  if (!enabledRef.current) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        color: "#fff",
        padding: 10,
        borderRadius: 10,
        maxWidth: 420,
        maxHeight: 260,
        overflow: "auto",
        fontSize: 12,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Diagnostics</div>
      {rows.length === 0 ? (
        <div style={{ color: "#94a3b8" }}>No events yet.</div>
      ) : (
        rows.map((row) => (
          <div
            key={row.id}
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              padding: "6px 0",
            }}
          >
            <div>
              <b>{row.phase}</b> • {row.method} • {row.status ?? "-"} •
              <span style={{ color: "#a7f3d0", marginLeft: 4 }}>{row.classification ?? "-"}</span>
            </div>
            <div style={{ color: "#93c5fd" }}>{row.url}</div>
            {row.reason && <div style={{ color: "#fca5a5" }}>{row.reason}</div>}
            <div style={{ color: "#d1d5db" }}>{row.ts}</div>
          </div>
        ))
      )}
    </div>
  );
}
