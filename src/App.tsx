import React, { useMemo } from "react";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Pricing from "./components/Pricing";
import {
  NAV,
  HOMEPAGE,
  ABOUT,
  FEATURES,
  FAQ,
  CONTACT,
} from "./content/siteContent";

function useRoute() {
  const [route, setRoute] = React.useState<string>(
    window.location.hash.replace("#", "") || "Home",
  );

  React.useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash.replace("#", "") || "Home");
      document.querySelector("#main")?.focus({ preventScroll: true });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return route;
}

const sections: Record<string, React.ReactNode> = {
  Home: (
    <section aria-labelledby="home-title">
      <div className="container">
        <h1 id="home-title">{HOMEPAGE.heroTitle}</h1>
        <p className="muted" style={{ fontSize: "1.1rem", maxWidth: 640 }}>
          {HOMEPAGE.heroSubtitle}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
          <a className="btn" href="#Pricing">
            {HOMEPAGE.cta.primary}
          </a>
          <a className="btn secondary" href="#Pricing">
            {HOMEPAGE.cta.secondary}
          </a>
        </div>
        <div className="grid grid-3" style={{ marginTop: 32 }}>
          {HOMEPAGE.bullets.map((bullet) => (
            <div key={bullet} className="card" role="listitem">
              {bullet}
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
  About: (
    <section aria-labelledby="about-title">
      <div className="container" style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <div>
          <h1 id="about-title">About Akadeo</h1>
          <p className="muted" style={{ fontSize: "1.05rem" }}>
            {ABOUT.mission}
          </p>
        </div>
        <div>
          <h2 style={{ fontSize: "1.1rem" }}>Our values</h2>
          <ul>
            {ABOUT.values.map((value) => (
              <li key={value} style={{ marginBottom: 12 }}>
                {value}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  ),
  Features: (
    <section aria-labelledby="features-title">
      <div className="container">
        <h1 id="features-title">Features</h1>
        <div style={{ display: "grid", gap: 16 }}>
          {FEATURES.map((section) => (
            <details key={section.title} className="card" open>
              <summary style={{ fontWeight: 600 }}>{section.title}</summary>
              <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </div>
    </section>
  ),
  Pricing: <Pricing />,
  FAQ: (
    <section aria-labelledby="faq-title">
      <div className="container">
        <h1 id="faq-title">Frequently asked questions</h1>
        <div style={{ display: "grid", gap: 16 }}>
          {FAQ.map((item) => (
            <details key={item.q} className="card">
              <summary style={{ fontWeight: 600 }}>{item.q}</summary>
              <p className="muted" style={{ marginTop: 12 }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  ),
  Blog: (
    <section aria-labelledby="blog-title">
      <div className="container" style={{ display: "grid", gap: 16 }}>
        <h1 id="blog-title">Blog</h1>
        <p className="muted">Coming soon. Subscribe to our updates when we launch.</p>
        <a className="btn secondary" href="#rss" aria-label="Subscribe to Akadeo RSS feed placeholder">
          RSS feed (soon)
        </a>
      </div>
    </section>
  ),
  Contact: (
    <section aria-labelledby="contact-title">
      <div className="container" style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <div>
          <h1 id="contact-title">Contact</h1>
          <p className="muted">
            Email us at <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or visit us at {CONTACT.address}.
          </p>
        </div>
        <form
          method="post"
          action={`mailto:${CONTACT.email}`}
          style={{ display: "grid", gap: 12 }}
          aria-label="Contact form"
        >
          {CONTACT.formFields.map((field) => (
            <label key={field} style={{ display: "grid", gap: 6 }}>
              <span>{field}</span>
              {field === "Message" ? (
                <textarea name={field.toLowerCase()} rows={4} required style={{ padding: 10, borderRadius: 10, border: "1px solid #d1d5db" }} />
              ) : (
                <input
                  name={field.toLowerCase()}
                  type={field === "Email" ? "email" : "text"}
                  required
                  style={{ padding: 10, borderRadius: 10, border: "1px solid #d1d5db" }}
                />
              )}
            </label>
          ))}
          <button type="submit" className="btn">
            Send message
          </button>
        </form>
      </div>
    </section>
  ),
};

export default function App() {
  const route = useRoute();

  const page = useMemo(() => sections[route] ?? sections.Home, [route]);

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <Nav items={NAV} active={route} />
      <main id="main" tabIndex={-1} style={{ flex: 1 }}>
        {page}
      </main>
      <Footer />
    </div>
  );
}
