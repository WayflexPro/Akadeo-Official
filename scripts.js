const menuToggle = document.querySelector('.menu-toggle');
const navList = document.getElementById('nav-links');
const headerLinks = document.querySelectorAll('#nav-links a');
const yearEl = document.getElementById('year');

const updateYear = () => {
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
};

const toggleMenu = (force) => {
  if (!menuToggle || !navList) return;
  const expanded = typeof force === 'boolean' ? force : menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', expanded);
  navList.classList.toggle('open', expanded);
};

menuToggle?.addEventListener('click', () => toggleMenu());

headerLinks.forEach((link) =>
  link.addEventListener('click', () => {
    toggleMenu(false);
  })
);

updateYear();
