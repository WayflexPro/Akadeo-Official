const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('[data-nav]');
const navList = document.getElementById('nav-links');
const menuToggle = document.querySelector('.menu-toggle');
const yearEl = document.getElementById('year');
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
};

menuToggle?.addEventListener('click', () => toggleMenu());
navLinks.forEach((link) => link.addEventListener('click', handleNavigation));
window.addEventListener('popstate', handleHashChange);
window.addEventListener('hashchange', handleHashChange);

setYear();
handleHashChange();
