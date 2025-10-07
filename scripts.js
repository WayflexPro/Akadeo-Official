const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('[data-nav]');
const navList = document.getElementById('nav-links');
const menuToggle = document.querySelector('.menu-toggle');
const revealEls = document.querySelectorAll('.reveal');
const yearEl = document.getElementById('year');
const parallaxEls = document.querySelectorAll('[data-parallax]');
const scrollProgressBar = document.querySelector('.scroll-progress__bar');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const setYear = () => {
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
};

const setActivePage = (pageId) => {
  const target = pageId || 'home';

  pages.forEach((page) => {
    page.classList.toggle('active', page.dataset.page === target);
  });

  navLinks.forEach((link) => {
    const linkTarget = link.getAttribute('data-nav');
    const isActive = linkTarget === target;
    link.classList.toggle('active', isActive);
  });

  if (menuToggle?.getAttribute('aria-expanded') === 'true') {
    toggleMenu(false);
  }
};

const toggleMenu = (force) => {
  const expanded = typeof force === 'boolean' ? force : menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', expanded);
  navList.classList.toggle('open', expanded);
};

const handleNavigation = (event) => {
  const navTarget = event.target.closest('[data-nav]');
  if (!navTarget) return;
  event.preventDefault();
  const target = navTarget.getAttribute('data-nav');
  if (!target) return;

  history.pushState({ page: target }, '', `#${target}`);
  setActivePage(target);
  scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
};

const handleHashChange = () => {
  const hash = window.location.hash.replace('#', '');
  setActivePage(hash);
  handleScrollEffects();
};

const observeReveals = () => {
  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, observerInstance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observerInstance.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
    }
  );

  revealEls.forEach((el) => observer.observe(el));
};

const updateParallax = () => {
  parallaxEls.forEach((el) => {
    const speed = parseFloat(el.dataset.parallax ?? '0');
    if (!Number.isFinite(speed)) return;
    const offset = window.scrollY * speed * -1;
    el.style.transform = `translate3d(0, ${offset}px, 0)`;
  });
};

const updateScrollProgress = () => {
  if (!scrollProgressBar) return;
  const scrollHeight = document.body.scrollHeight - window.innerHeight;
  const progress = scrollHeight > 0 ? Math.min(window.scrollY / scrollHeight, 1) : 0;
  scrollProgressBar.style.transform = `scaleX(${progress})`;
};

let scrollTicking = false;
const handleScrollEffects = () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    updateScrollProgress();
    if (!prefersReducedMotion) {
      updateParallax();
    }
    scrollTicking = false;
  });
};

menuToggle?.addEventListener('click', () => toggleMenu());
navLinks.forEach((link) => link.addEventListener('click', handleNavigation));
window.addEventListener('popstate', handleHashChange);
window.addEventListener('hashchange', handleHashChange);
window.addEventListener('scroll', handleScrollEffects, { passive: true });
window.addEventListener('resize', handleScrollEffects);

setYear();
handleHashChange();
observeReveals();
handleScrollEffects();
