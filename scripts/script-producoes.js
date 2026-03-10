/* ============================================================
   script-producoes.js
   Lógica exclusiva da página producoes.html
   Depende de: i18next, script-shared.js
   ============================================================ */

/* ── SORT BUTTONS (Recentes / A–Z) ── */
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const mode = btn.getAttribute('data-sort'); // 'recent' ou 'az'
    renderGrid(mode);
  });
});

/* ── PLACEHOLDER SVG ── */
const placeholder = `
  <div class="film-card__placeholder">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white">
      <rect x="3" y="3" width="18" height="18" rx="1" stroke-width="0.8"/>
      <circle cx="8.5" cy="8.5" r="1.5" stroke-width="0.8"/>
      <path d="M21 15l-5-5L5 21" stroke-width="0.8"/>
    </svg>
  </div>`;


/* ── CRIA CARD ── */
function createCard(film, index) {
  const wide = film.size === 'wide' ? 'card--wide' : '';
  const tall = film.rows === 2      ? 'card--tall' : '';
  const title = i18next.language === 'en' && film.titleEn ? film.titleEn : film.title;

  return `
    <a href="filme.html?i=${index}" class="film-card ${wide} ${tall} card--${film.ratio}">      <div class="film-card__img">
        ${placeholder}
        <img class="img-portrait"
             src="${film.imgPortrait}"
             alt="${title}"
             onerror="this.style.display='none'">
        <img class="img-landscape"
             src="${film.imgLandscape}"
             alt="${title}"
             onerror="this.style.display='none'">
      </div>
      <div class="film-card__info">
        <span class="film-card__year">${film.year}</span>
        <div class="film-card__title">${title}</div>
        <div class="film-card__dir">Dir. ${film.director}</div>
      </div>
    </div>`;
}

/* ── RENDERIZA GRID (com ordenação) ── */

function renderGrid(sortMode = 'recent') {
  let sorted = [...films];

  if (sortMode === 'az') {
    const lang = i18next.language;
    sorted.sort((a, b) => {
      const titleA = lang === 'en' ? a.titleEn : a.title;
      const titleB = lang === 'en' ? b.titleEn : b.title;
      return titleA.localeCompare(titleB, lang, { sensitivity: 'base' });
    });
  }

  const patterns = [
    { size: 'wide', ratio: 'l', rows: 1 },
    { size: '',     ratio: 'p', rows: 1 },
    { size: '',     ratio: 'p', rows: 1 },
    { size: '',     ratio: 'l', rows: 1 },
    { size: '',     ratio: 'p', rows: 1 },
  ];

  document.querySelector('.films-grid').innerHTML = sorted.map((film, index) => {
    const pattern       = patterns[index % patterns.length];
    const originalIndex = films.indexOf(film);
    return createCard({ ...film, ...pattern }, originalIndex);
  }).join('');
}





/* ── updateDOM (chamada pelo script-shared ao trocar idioma) ── */
function updateDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = i18next.t(el.getAttribute('data-i18n'));
  });

  // Mantém o sort ativo ao trocar idioma
  const activeSort = document.querySelector('.sort-btn.active');
  const mode = activeSort ? activeSort.getAttribute('data-sort') : 'recent';
  renderGrid(mode);
}


/* ── i18next ── */
i18next.init({
  lng: 'pt',
  resources: {
    pt: {
      translation: {
        'nav.home':               'Início',
        'section.title':          'Produções',
        'sort.recent':            'Recentes',
        'sort.az':                'A–Z',
        'footer.col1':            'Navegação',
        'footer.copy':            '© 2025 - 000 FILMES',
        'menu.home':              'Início',
        'menu.home.count':        'Pag. inicial',
        'menu.productions':       'Produções',
        'menu.productions.count': '10+',
        'menu.upcoming':          'Vem aí',
        'menu.upcoming.count':    'Em produção',
        'menu.history':           'Nossa história',
        'menu.history.count':     'Sobre',
        'menu.contact':           'Contato',
        'menu.contact.count':     'fale com a gente',
      }
    },
    en: {
      translation: {
        'nav.home':               'Home',
        'section.title':          'Productions',
        'sort.recent':            'Latest',
        'sort.az':                'A–Z',
        'footer.col1':            'Navigation',
        'footer.copy':            '© 2025 - 000 FILMES',
        'menu.home':              'Home',
        'menu.home.count':        'Beggining',
        'menu.productions':       'Productions',
        'menu.productions.count': '10+',
        'menu.upcoming':          'Coming Soon',
        'menu.upcoming.count':    'In Production',
        'menu.history':           'Our Story',
        'menu.history.count':     'About',
        'menu.contact':           'Contact',
        'menu.contact.count':     'get in touch',
      }
    }
  }
}, () => {
  renderGrid(); // renderiza o grid logo após o i18next estar pronto
});