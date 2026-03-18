/* ============================================================
   script-shared.js
   Compartilhado entre todas as páginas do site 000 filmes
   Depende de: i18next (carregado antes no HTML)
   ============================================================ */

/* ── CURSOR CUSTOMIZADO (só existe no index.html) ── */
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');

if (cursor && cursorRing) {
  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  (function animRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
    requestAnimationFrame(animRing);
  })();
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
const headerPalette = ['#c9a84c', '#c4622d', '#6b8f71', '#8b1a1a'];
let headerColorIdx = -1;

menuBtn.addEventListener('mouseenter', () => {
  headerColorIdx = (headerColorIdx + 1) % headerPalette.length;
  menuBtn.style.color = headerPalette[headerColorIdx];
});
menuBtn.addEventListener('mouseleave', () => {
  menuBtn.style.color = '';
});

document.querySelectorAll('.header-link').forEach(el => {
  el.addEventListener('mouseenter', () => {
    headerColorIdx = (headerColorIdx + 1) % headerPalette.length;
    const color = headerPalette[headerColorIdx];
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