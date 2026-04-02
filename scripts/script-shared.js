/* ============================================================
   script-shared.js
   Compartilhado entre todas as páginas do site pontos de fuga
   Depende de: i18next (carregado antes no HTML)
   ============================================================ */

/* ── PALETA CÍCLICA COMPARTILHADA ── */
const PALETTE = ['#c9a84c', '#c4622d', '#6b8f71', '#8b1a1a'];

/* ── RECURSOS i18n COMUNS (menu + footer) ── */
const COMMON_I18N = {
  pt: {
    'nav.home': 'Início',
    'menu.home': 'Início', 'menu.home.count': 'Pag. inicial',
    'menu.productions': 'Produções', 'menu.productions.count': '10+',
    'menu.upcoming': 'Vem aí', 'menu.upcoming.count': 'Em produção',
    'menu.history': 'Nossa história', 'menu.history.count': 'Sobre',
    'menu.contact': 'Contato', 'menu.contact.count': 'fale com a gente',
    'footer.col1': 'Navegação', 'footer.copy': '© 2025 - PONTOS DE FUGA',
  },
  en: {
    'nav.home': 'Home',
    'menu.home': 'Home', 'menu.home.count': 'Beginning',
    'menu.productions': 'Productions', 'menu.productions.count': '10+',
    'menu.upcoming': 'Coming Soon', 'menu.upcoming.count': 'In Production',
    'menu.history': 'Our Story', 'menu.history.count': 'About',
    'menu.contact': 'Contact', 'menu.contact.count': 'get in touch',
    'footer.col1': 'Navigation', 'footer.copy': '© 2025 - PONTOS DE FUGA',
  }
};

/* ── MAPA DE STATUS → chave i18n ── */
const statusKey = {
  filming: 'status.filming',
  dev:     'status.dev',
  post:    'status.post',
};

/* ── SCROLL REVEAL ── */
function observeReveal(threshold = 0.1) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold });

  document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
}

/* ── APLICA TRADUÇÕES data-i18n ── */
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = i18next.t(el.getAttribute('data-i18n'));
  });
}

/* ── PLACEHOLDER SVG ── */
function placeholderSVG(size = 48, sw = 0.8, cls = 'film-card__placeholder') {
  return `<div class="${cls}"><svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="white"><rect x="3" y="3" width="18" height="18" rx="1" stroke-width="${sw}"/><circle cx="8.5" cy="8.5" r="1.5" stroke-width="${sw}"/><path d="M21 15l-5-5L5 21" stroke-width="${sw}"/></svg></div>`;
}

/* ── MENU TOGGLE ── */
const menuBtn     = document.getElementById('menuBtn');
const menuOverlay = document.getElementById('menuOverlay');
let menuOpen = false;

function openMenu() {
  menuOpen = true;
  menuOverlay.classList.add('open');
  menuBtn.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  menuOpen = false;
  menuOverlay.classList.remove('open');
  menuBtn.classList.remove('open');
  document.body.style.overflow = '';
}

menuBtn.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());

/* ── COR CÍCLICA DOS BOTÕES DA HEADER NO HOVER ── */
let headerColorIdx = -1;

menuBtn.addEventListener('mouseenter', () => {
  headerColorIdx = (headerColorIdx + 1) % PALETTE.length;
  menuBtn.style.color = PALETTE[headerColorIdx];
});
menuBtn.addEventListener('mouseleave', () => {
  menuBtn.style.color = '';
});

document.querySelectorAll('.header-link').forEach(el => {
  el.addEventListener('mouseenter', () => {
    headerColorIdx = (headerColorIdx + 1) % PALETTE.length;
    const color = PALETTE[headerColorIdx];
    el.style.color = color;
    el.style.borderColor = color;
    el.style.fontWeight = '700';
  });
  el.addEventListener('mouseleave', () => {
    el.style.color = '';
    el.style.borderColor = '';
    el.style.fontWeight = '';
  });
});

// Fecha o menu ao clicar fora dele
menuOverlay.addEventListener('click', e => {
  if (e.target === menuOverlay) closeMenu();
});



/* ── BOTÃO DE IDIOMA ──
   Cada página define sua própria updateDOM().
   Este handler chama updateDOM() após a troca de idioma,
   então basta cada script-[página].js declarar essa função. ── */
function initLangBtn() {
  document.getElementById('langBtn').addEventListener('click', () => {
    const next = i18next.language === 'pt' ? 'en' : 'pt';
    i18next.changeLanguage(next, () => {
      if (typeof window.updateDOM === 'function') window.updateDOM();
      document.getElementById('langBtn').textContent = next === 'pt' ? 'EN' : 'PT';
    });
  });
}

document.getElementById('langBtn').addEventListener('click', () => {
  const next = i18next.language === 'pt' ? 'en' : 'pt';
  i18next.changeLanguage(next, () => {
    updateDOM();
    document.getElementById('langBtn').textContent = next === 'pt' ? 'EN' : 'PT';
  });
});

/*HIDE HEADER AFTER SCROLL*/

var lastScrollTop = 0;
var header = document.querySelector('header');

window.addEventListener('scroll', function() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 50) {
        // Scrolling down and past a certain threshold (e.g., 50px)
        if (!header.classList.contains('header--hidden')) {
            header.classList.add('header--hidden');
        }
    } else {
        // Scrolling up
        if (header.classList.contains('header--hidden')) {
            header.classList.remove('header--hidden');
        }
    }
    lastScrollTop = scrollTop;
});