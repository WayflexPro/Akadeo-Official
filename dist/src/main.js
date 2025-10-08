import { homepage, about, featuresPage, plans, faq, contact, LAUNCH_DISCOUNT, } from "../content/siteContent.js";
import { applyLaunchDiscount } from "../lib/pricing.js";
const navLinks = document.querySelectorAll('.site-nav [data-nav], .auth-links [data-nav], .footer__links [data-nav]');
const navList = document.getElementById("nav-links");
const menuToggle = document.querySelector(".menu-toggle");
const revealEls = Array.from(document.querySelectorAll(".reveal"));
const yearEl = document.getElementById("year");
const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
const scrollProgressBar = document.querySelector(".scroll-progress__bar");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const parallaxQuery = window.matchMedia("(min-width: 768px)");
const mobileNavQuery = window.matchMedia("(max-width: 940px)");
let prefersReducedMotion = motionQuery.matches;
let parallaxAllowed = parallaxQuery.matches;
let revealObserver;
const hasParallax = parallaxEls.length > 0;
const shouldRunParallax = () => hasParallax && parallaxAllowed && !prefersReducedMotion;
const resetParallax = () => {
    if (!hasParallax)
        return;
    parallaxEls.forEach((el) => {
        el.style.transform = "";
    });
};
const setYear = () => {
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }
};
const setMenuVisibility = (expanded) => {
    if (!menuToggle || !navList || !document.body)
        return;
    const isMobile = mobileNavQuery.matches;
    const shouldExpand = expanded && isMobile;
    menuToggle.setAttribute("aria-expanded", shouldExpand ? "true" : "false");
    navList.classList.toggle("open", shouldExpand);
    navList.setAttribute("aria-hidden", String(isMobile ? !shouldExpand : false));
    document.body.dataset.menuOpen = shouldExpand ? "true" : "false";
};
const toggleMenu = (force) => {
    if (!menuToggle || !navList)
        return;
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    const shouldExpand = typeof force === "boolean" ? force : !isExpanded;
    setMenuVisibility(shouldExpand);
};
const highlightActiveNav = () => {
    if (!navLinks.length)
        return;
    const currentPage = document.body?.dataset.page || "home";
    navLinks.forEach((link) => {
        const target = link.getAttribute("data-nav");
        link.classList.toggle("active", target === currentPage);
        if (target === currentPage) {
            link.setAttribute("aria-current", "page");
        }
        else {
            link.removeAttribute("aria-current");
        }
    });
};
const setupRevealObserver = () => {
    if (revealObserver) {
        revealObserver.disconnect();
        revealObserver = undefined;
    }
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        revealEls.forEach((el) => el.classList.add("visible"));
        return;
    }
    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                revealObserver?.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2,
    });
    revealEls.forEach((el) => {
        if (!el.classList.contains("visible")) {
            revealObserver?.observe(el);
        }
    });
};
const updateParallax = () => {
    parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax ?? "0");
        if (!Number.isFinite(speed))
            return;
        const offset = window.scrollY * speed * -1;
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
};
const updateScrollProgress = () => {
    if (!scrollProgressBar)
        return;
    const scrollHeight = document.body.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? Math.min(window.scrollY / scrollHeight, 1) : 0;
    scrollProgressBar.style.transform = `scaleX(${progress})`;
};
let scrollTicking = false;
const handleScrollEffects = () => {
    if (scrollTicking)
        return;
    scrollTicking = true;
    requestAnimationFrame(() => {
        updateScrollProgress();
        if (shouldRunParallax()) {
            updateParallax();
        }
        else {
            resetParallax();
        }
        scrollTicking = false;
    });
};
const updateMotionPreference = (isReduced) => {
    prefersReducedMotion = isReduced;
    document.documentElement.classList.toggle("is-reduced-motion", prefersReducedMotion);
    setupRevealObserver();
    if (!shouldRunParallax()) {
        resetParallax();
    }
};
const handleMotionChange = (event) => {
    updateMotionPreference(event.matches);
};
const handleParallaxChange = (event) => {
    parallaxAllowed = event.matches;
    if (!shouldRunParallax()) {
        resetParallax();
    }
    handleScrollEffects();
};
const handleMobileNavChange = () => {
    setMenuVisibility(false);
};
const renderHome = (root) => {
    const hero = document.createElement("section");
    hero.className = "section hero-section";
    hero.innerHTML = `
    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">Teacher-built, teacher-trusted</p>
        <h1>${homepage.heroTitle}</h1>
        <p class="lead">${homepage.heroSubtitle}</p>
        <div class="hero-actions">
          <a class="primary" href="sign-up.html">${homepage.ctaPrimary}</a>
          <a class="ghost" href="pricing.html">${homepage.ctaSecondary}</a>
        </div>
      </div>
      <div class="hero-trust" aria-label="Key benefits">
        <h2 class="sr-only">Why teachers choose Akadeo</h2>
        <ul>
          ${homepage.trustBullets
        .map((bullet) => `
                <li>
                  <span class="checkmark" aria-hidden="true">✓</span>
                  <span>${bullet}</span>
                </li>
              `)
        .join("")}
        </ul>
      </div>
    </div>
  `;
    root.append(hero);
    const trustSection = document.createElement("section");
    trustSection.className = "section trust-section";
    trustSection.innerHTML = `
    <div class="container trust-content">
      <div>
        <h2>Built to save hours, not add work</h2>
        <p>Akadeo brings planning, assessment, and insight tools together so classrooms keep moving forward.</p>
      </div>
      <dl class="trust-metrics">
        <div>
          <dt>Minutes to launch your first quiz</dt>
          <dd>5</dd>
        </div>
        <div>
          <dt>Teachers onboarded last semester</dt>
          <dd>2,400+</dd>
        </div>
        <div>
          <dt>Average hours saved each month</dt>
          <dd>10+</dd>
        </div>
      </dl>
    </div>
  `;
    root.append(trustSection);
};
const renderAbout = (root) => {
    const section = document.createElement("section");
    section.className = "section about-section";
    section.innerHTML = `
    <div class="container about-grid">
      <div>
        <h1>Our mission</h1>
        <p>${about.mission}</p>
      </div>
      <div>
        <h2>What guides us</h2>
        <ul>
          ${about.values
        .map((value) => `
                <li>
                  <span class="checkmark" aria-hidden="true">✓</span>
                  <span>${value}</span>
                </li>
              `)
        .join("")}
        </ul>
      </div>
    </div>
  `;
    root.append(section);
};
const renderFeatures = (root) => {
    const section = document.createElement("section");
    section.className = "section features-section";
    section.innerHTML = `
    <div class="container">
      <h1>Features designed with educators</h1>
      <p class="section-lead">Explore what you can do with Akadeo. Each section focuses on saving time and amplifying student learning.</p>
    </div>
  `;
    const list = document.createElement("div");
    list.className = "container features-accordion";
    featuresPage.sections.forEach((feature, index) => {
        const details = document.createElement("details");
        details.className = "feature-card";
        if (index === 0) {
            details.open = true;
        }
        const summary = document.createElement("summary");
        summary.innerHTML = `<span>${feature.title}</span>`;
        summary.setAttribute("aria-label", `${feature.title} details`);
        const content = document.createElement("div");
        content.className = "feature-card__content";
        const listEl = document.createElement("ul");
        feature.bullets.forEach((bullet) => {
            const li = document.createElement("li");
            li.textContent = bullet;
            listEl.append(li);
        });
        content.append(listEl);
        details.append(summary, content);
        list.append(details);
    });
    section.append(list);
    root.append(section);
};
const formatLimitLabel = (key) => {
    return key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/\bgb\b/gi, "GB")
        .replace(/^./, (char) => char.toUpperCase())
        .trim();
};
const formatLimitValue = (value) => {
    if (Array.isArray(value)) {
        return value.join(", ");
    }
    if (typeof value === "boolean") {
        return value ? "Included" : "Not included";
    }
    if (value === null) {
        return "";
    }
    return String(value);
};
const createLimitsList = (limits) => {
    const container = document.createElement("div");
    container.className = "plan-limits";
    const heading = document.createElement("p");
    heading.className = "plan-limits__heading";
    heading.textContent = "Plan limits";
    container.append(heading);
    const list = document.createElement("dl");
    list.className = "plan-limits__list";
    Object.entries(limits).forEach(([key, value]) => {
        const dt = document.createElement("dt");
        dt.textContent = formatLimitLabel(key);
        const dd = document.createElement("dd");
        if (Array.isArray(value)) {
            const ul = document.createElement("ul");
            ul.className = "plan-limits__nested";
            value.forEach((item) => {
                const li = document.createElement("li");
                li.textContent = item;
                ul.append(li);
            });
            dd.append(ul);
        }
        else {
            dd.textContent = formatLimitValue(value);
        }
        list.append(dt, dd);
    });
    container.append(list);
    return container;
};
const renderPricing = (root) => {
    let billing = "monthly";
    const section = document.createElement("section");
    section.className = "section pricing-section";
    const header = document.createElement("div");
    header.className = "container pricing-header";
    header.innerHTML = `
    <div>
      <p class="eyebrow">Flexible plans</p>
      <h1>Pricing</h1>
      <p class="section-lead">Choose the plan that fits your classroom or team. Switch between monthly and annual billing anytime.</p>
    </div>
  `;
    const controls = document.createElement("div");
    controls.className = "billing-toggle";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "Toggle billing period");
    const monthlyBtn = document.createElement("button");
    monthlyBtn.type = "button";
    monthlyBtn.textContent = "Monthly";
    monthlyBtn.className = "billing-toggle__button";
    monthlyBtn.dataset.value = "monthly";
    monthlyBtn.setAttribute("aria-pressed", "true");
    const annualBtn = document.createElement("button");
    annualBtn.type = "button";
    annualBtn.textContent = "Annual";
    annualBtn.className = "billing-toggle__button";
    annualBtn.dataset.value = "annual";
    annualBtn.setAttribute("aria-pressed", "false");
    controls.append(monthlyBtn, annualBtn);
    header.append(controls);
    const promo = document.createElement("div");
    promo.className = "container pricing-promo";
    if (LAUNCH_DISCOUNT.active) {
        promo.innerHTML = `🎉 LAUNCH PROMO: <strong>${LAUNCH_DISCOUNT.percent}% OFF</strong> all paid plans. Discount applied automatically.`;
    }
    const cards = document.createElement("div");
    cards.className = "container pricing-cards";
    const note = document.createElement("p");
    note.className = "container pricing-note";
    note.textContent = "Add-ons: AI Token Pack (+5,000 gens): $3; Extra storage: $1.99 / 10GB; Extra teacher seat on School: $5/mo.";
    const renderCards = () => {
        cards.innerHTML = "";
        plans.forEach((plan) => {
            const base = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
            const discounted = applyLaunchDiscount(base);
            const article = document.createElement("article");
            article.className = "pricing-card";
            if (plan.id === "starter") {
                article.setAttribute("aria-label", `${plan.name} plan, most popular`);
            }
            if (plan.badge) {
                const badge = document.createElement("span");
                badge.className = "plan-badge";
                badge.textContent = plan.badge;
                article.append(badge);
            }
            const title = document.createElement("h2");
            title.textContent = plan.name;
            article.append(title);
            const tagline = document.createElement("p");
            tagline.className = "plan-tagline";
            tagline.textContent = plan.tagline;
            article.append(tagline);
            const priceWrap = document.createElement("div");
            priceWrap.className = "plan-price";
            if (base == null) {
                const price = document.createElement("p");
                price.className = "plan-price__value";
                price.textContent = "Contact sales";
                priceWrap.append(price);
            }
            else {
                const priceRow = document.createElement("div");
                priceRow.className = "plan-price__row";
                const isPaidPlan = typeof base === "number" && base > 0;
                if (LAUNCH_DISCOUNT.active && discounted !== null && isPaidPlan) {
                    const discountedEl = document.createElement("span");
                    discountedEl.className = "plan-price__discounted";
                    discountedEl.textContent = `$${discounted.toFixed(2)}`;
                    priceRow.append(discountedEl);
                }
                const baseEl = document.createElement("span");
                baseEl.className = LAUNCH_DISCOUNT.active && isPaidPlan
                    ? "plan-price__base"
                    : "plan-price__discounted";
                baseEl.textContent = `$${base.toFixed(2)}`;
                priceRow.append(baseEl);
                const cadence = document.createElement("span");
                cadence.className = "plan-price__cadence";
                cadence.textContent = billing === "monthly" ? "/mo" : "/yr";
                priceRow.append(cadence);
                priceWrap.append(priceRow);
                if (LAUNCH_DISCOUNT.active && isPaidPlan) {
                    const badge = document.createElement("span");
                    badge.className = "plan-price__badge";
                    badge.textContent = `LAUNCH: ${LAUNCH_DISCOUNT.percent}% OFF`;
                    priceWrap.append(badge);
                }
            }
            article.append(priceWrap);
            const featureList = document.createElement("ul");
            featureList.className = "plan-features";
            featureList.setAttribute("aria-label", `${plan.name} features`);
            plan.features.forEach((feature) => {
                const item = document.createElement("li");
                item.innerHTML = `<span class="checkmark" aria-hidden="true">✓</span><span>${feature}</span>`;
                featureList.append(item);
            });
            article.append(featureList);
            if (plan.limits) {
                article.append(createLimitsList(plan.limits));
            }
            const cta = document.createElement("a");
            cta.className = plan.id === "enterprise" ? "ghost" : "primary";
            cta.href = plan.id === "enterprise" ? "contact.html" : "sign-up.html";
            cta.textContent = plan.id === "enterprise" ? "Contact sales" : "Choose plan";
            cta.classList.add("plan-cta");
            cta.setAttribute("aria-label", `${plan.name} plan ${cta.textContent}`);
            article.append(cta);
            cards.append(article);
        });
    };
    const updateBilling = (next) => {
        billing = next;
        monthlyBtn.setAttribute("aria-pressed", billing === "monthly" ? "true" : "false");
        annualBtn.setAttribute("aria-pressed", billing === "annual" ? "true" : "false");
        renderCards();
    };
    monthlyBtn.addEventListener("click", () => updateBilling("monthly"));
    annualBtn.addEventListener("click", () => updateBilling("annual"));
    section.append(header);
    if (LAUNCH_DISCOUNT.active) {
        section.append(promo);
    }
    section.append(cards, note);
    root.append(section);
    renderCards();
};
const renderFAQ = (root) => {
    const section = document.createElement("section");
    section.className = "section faq-section";
    section.innerHTML = `
    <div class="container">
      <h1>Frequently asked questions</h1>
      <p class="section-lead">Everything you need to know about how Akadeo supports your classroom and school.</p>
    </div>
  `;
    const list = document.createElement("div");
    list.className = "container faq-accordion";
    faq.forEach(({ q, a }) => {
        const details = document.createElement("details");
        details.className = "faq-item";
        const summary = document.createElement("summary");
        summary.textContent = q;
        summary.setAttribute("aria-label", `${q} answer`);
        const answer = document.createElement("div");
        answer.className = "faq-item__content";
        answer.textContent = a;
        details.append(summary, answer);
        list.append(details);
    });
    section.append(list);
    root.append(section);
};
const renderBlog = (root) => {
    const section = document.createElement("section");
    section.className = "section blog-section";
    section.innerHTML = `
    <div class="container blog-content">
      <h1>Blog</h1>
      <p class="section-lead">Stories, release notes, and classroom inspiration are coming soon.</p>
      <div class="blog-card">
        <p>Coming soon</p>
        <a class="ghost" href="#" aria-disabled="true">RSS feed (coming soon)</a>
      </div>
    </div>
  `;
    root.append(section);
};
const renderContact = (root) => {
    const section = document.createElement("section");
    section.className = "section contact-section";
    section.innerHTML = `
    <div class="container contact-grid">
      <div>
        <h1>Contact our team</h1>
        <p class="section-lead">Have a question or want to talk through a rollout? We respond within one business day.</p>
        <ul class="contact-info">
          <li><a href="mailto:${contact.email}">${contact.email}</a></li>
          <li>${contact.address}</li>
        </ul>
      </div>
    </div>
  `;
    const form = document.createElement("form");
    form.className = "contact-form";
    form.method = "post";
    form.action = `mailto:${contact.email}`;
    form.noValidate = true;
    contact.formFields.forEach((field) => {
        const wrapper = document.createElement("label");
        const slug = field.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        wrapper.setAttribute("for", slug);
        wrapper.className = "contact-form__field";
        wrapper.innerHTML = `<span>${field}</span>`;
        if (field.toLowerCase() === "message") {
            const textarea = document.createElement("textarea");
            textarea.id = slug;
            textarea.name = slug;
            textarea.rows = 4;
            textarea.required = true;
            wrapper.append(textarea);
        }
        else {
            const input = document.createElement("input");
            input.id = slug;
            input.name = slug;
            input.type = field.toLowerCase().includes("email") ? "email" : "text";
            input.required = field.toLowerCase() !== "organization";
            wrapper.append(input);
        }
        form.append(wrapper);
    });
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "primary";
    submit.textContent = "Send message";
    form.append(submit);
    const formWrapper = section.querySelector(".contact-grid");
    formWrapper?.append(form);
    root.append(section);
};
const renderPageContent = () => {
    const root = document.querySelector("[data-page-root]");
    if (!root)
        return;
    root.innerHTML = "";
    const page = document.body?.dataset.page;
    switch (page) {
        case "home":
            renderHome(root);
            break;
        case "about":
            renderAbout(root);
            break;
        case "features":
            renderFeatures(root);
            break;
        case "pricing":
            renderPricing(root);
            break;
        case "faq":
            renderFAQ(root);
            break;
        case "blog":
            renderBlog(root);
            break;
        case "contact":
            renderContact(root);
            break;
        default:
            break;
    }
};
const init = () => {
    setYear();
    highlightActiveNav();
    setupRevealObserver();
    renderPageContent();
    menuToggle?.addEventListener("click", () => toggleMenu());
    navLinks.forEach((link) => link.addEventListener("click", () => {
        if (menuToggle?.getAttribute("aria-expanded") === "true") {
            toggleMenu(false);
        }
    }));
    motionQuery.addEventListener("change", handleMotionChange);
    parallaxQuery.addEventListener("change", handleParallaxChange);
    mobileNavQuery.addEventListener("change", handleMobileNavChange);
    window.addEventListener("scroll", handleScrollEffects, { passive: true });
    window.addEventListener("resize", handleScrollEffects);
};
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
}
else {
    init();
}
