import React from "react";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #e5e7eb", marginTop: "auto" }}>
      <div
        className="container"
        style={{ padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}
      >
        <div className="muted small">© {new Date().getFullYear()} Akadeo</div>
        <div className="muted small">
          Built with Vite · <a href="#privacy">Privacy-first</a>
        </div>
      </div>
    </footer>
  );
}
