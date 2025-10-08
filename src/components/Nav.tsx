import React from "react";

interface NavProps {
  items: readonly string[];
  active: string;
}

export default function Nav({ items, active }: NavProps) {
  return (
    <header style={{ borderBottom: "1px solid #e5e7eb" }}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}
      >
        <a href="#Home" style={{ fontWeight: 700, textDecoration: "none", fontSize: "1.1rem" }} aria-label="Akadeo home">
          Akadeo
        </a>
        <nav aria-label="Main navigation">
          {items.map((item) => (
            <a key={item} href={`#${item}`} className={active === item ? "active" : ""} aria-current={active === item ? "page" : undefined}>
              {item}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
