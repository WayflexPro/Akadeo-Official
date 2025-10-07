const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('[data-nav]');
const highlightNavLinks = Array.from(navLinks).filter((link) =>
  Boolean(link.closest('nav, .auth-links, .footer__links'))
);
const navList = document.getElementById('nav-links');
const menuToggle = document.querySelector('.menu-toggle');
const revealEls = Array.from(document.querySelectorAll('.reveal'));
const yearEl = document.getElementById('year');
const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
const bodyPageId = document.body?.dataset.page || '';
const defaultPageId = 'home';

const isSpaExperience = pages.length > 1 && !bodyPageId;
const scrollProgressBar = document.querySelector('.scroll-progress__bar');

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const parallaxQuery = window.matchMedia('(min-width: 768px)');
const mobileNavQuery = window.matchMedia('(max-width: 940px)');

let prefersReducedMotion = motionQuery.matches;
let parallaxAllowed = parallaxQuery.matches;
let revealObserver;

const hasParallax = parallaxEls.length > 0;

const shouldRunParallax = () => hasParallax && parallaxAllowed && !prefersReducedMotion;

const resetParallax = () => {
  if (!hasParallax) return;
  parallaxEls.forEach((el) => {
    el.style.transform = '';
  });
};

const setYear = () => {
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
};

const setMenuVisibility = (expanded) => {
  if (!menuToggle || !navList || !document.body) return;
  const isMobile = mobileNavQuery.matches;
  const shouldExpand = expanded && isMobile;

  menuToggle.setAttribute('aria-expanded', shouldExpand ? 'true' : 'false');
  navList.classList.toggle('open', shouldExpand);
  navList.setAttribute('aria-hidden', String(isMobile ? !shouldExpand : false));
  document.body.dataset.menuOpen = shouldExpand ? 'true' : 'false';
};

const toggleMenu = (force) => {
  if (!menuToggle || !navList) return;
  const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
  const shouldExpand = typeof force === 'boolean' ? force : !isExpanded;
  setMenuVisibility(shouldExpand);
};

const setActivePage = (pageId) => {
  const fallback = bodyPageId || pages[0]?.dataset.page || defaultPageId;
  const target = pageId || fallback || defaultPageId;

  pages.forEach((page, index) => {
    const pageIdentifier = page.dataset.page;
    const shouldBeActive = pageIdentifier ? pageIdentifier === target : index === 0;
    page.classList.toggle('active', shouldBeActive);
  });

  highlightNavLinks.forEach((link) => {
    const linkTarget = link.getAttribute('data-nav');
    const isActive = linkTarget === target;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  if (isSpaExperience && menuToggle?.getAttribute('aria-expanded') === 'true') {
    toggleMenu(false);
  }

  return target;
};

const handleNavigation = (event) => {
  const navTarget = event.target.closest('[data-nav]');
  if (!navTarget) return;

  const target = navTarget.getAttribute('data-nav');
  if (!target) return;

  if (isSpaExperience) {
    const href = navTarget.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    event.preventDefault();

    if (typeof history.pushState === 'function') {
      history.pushState({ page: target }, '', `#${target}`);
    } else {
      window.location.hash = `#${target}`;
    }

    setActivePage(target);
    if (prefersReducedMotion || typeof window.scrollTo !== 'function') {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } else if (menuToggle?.getAttribute('aria-expanded') === 'true') {
    toggleMenu(false);
  }
};

const handleHashChange = () => {
  if (!isSpaExperience) return;
  const hash = window.location.hash.replace('#', '');
  setActivePage(hash);
  handleScrollEffects();
};

const setupRevealObserver = () => {
  if (revealObserver) {
    revealObserver.disconnect();
    revealObserver = undefined;
  }

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('visible'));
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver?.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
    }
  );

  revealEls.forEach((el) => {
    if (!el.classList.contains('visible')) {
      revealObserver.observe(el);
    }
  });
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
    if (shouldRunParallax()) {
      updateParallax();
    } else {
      resetParallax();
    }
    scrollTicking = false;
  });
};

const updateMotionPreference = (isReduced) => {
  prefersReducedMotion = isReduced;
  document.documentElement.classList.toggle('is-reduced-motion', prefersReducedMotion);
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

menuToggle?.addEventListener('click', () => toggleMenu());
navLinks.forEach((link) => link.addEventListener('click', handleNavigation));

if (isSpaExperience) {
  window.addEventListener('popstate', handleHashChange);
  window.addEventListener('hashchange', handleHashChange);
}

window.addEventListener('scroll', handleScrollEffects, { passive: true });
window.addEventListener('resize', handleScrollEffects);

if (typeof motionQuery.addEventListener === 'function') {
  motionQuery.addEventListener('change', handleMotionChange);
} else if (typeof motionQuery.addListener === 'function') {
  motionQuery.addListener(handleMotionChange);
}

if (typeof parallaxQuery.addEventListener === 'function') {
  parallaxQuery.addEventListener('change', handleParallaxChange);
} else if (typeof parallaxQuery.addListener === 'function') {
  parallaxQuery.addListener(handleParallaxChange);
}

if (typeof mobileNavQuery.addEventListener === 'function') {
  mobileNavQuery.addEventListener('change', handleMobileNavChange);
} else if (typeof mobileNavQuery.addListener === 'function') {
  mobileNavQuery.addListener(handleMobileNavChange);
}

setMenuVisibility(false);
setYear();
updateMotionPreference(prefersReducedMotion);

if (isSpaExperience) {
  handleHashChange();
} else {
  setActivePage(bodyPageId);
  handleScrollEffects();
}
