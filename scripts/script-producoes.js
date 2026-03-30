/* ============================================================
   script-producoes.js
   Lógica exclusiva da página producoes.html
   Depende de: i18next, script-shared.js
   ============================================================ */

dataReady.then(() => { /* espera os dados do json serem carregados */


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


  /* ── PALETA HOVER DOS CARDS ── */
  const cardPalette = ['#c9a84c', '#c4622d', '#6b8f71', '#8b1a1a'];
  let cardColorIdx = -1;

  function attachCardHovers() {
    document.querySelectorAll('.film-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        cardColorIdx = (cardColorIdx + 1) % cardPalette.length;
        const color = cardPalette[cardColorIdx];
        card.style.boxShadow = `inset 4px 0 0 ${color}`;
        card.querySelector('.film-card__title').style.color = color;
      });
      card.addEventListener('mouseleave', () => {
        card.style.boxShadow = '';
        card.querySelector('.film-card__title').style.color = '';
      });
    });
  }

  /* ── CRIA CARD ── */
  function createCard(film, index) {
    const wide  = film.size === 'wide' ? 'card--wide' : '';
    const tall  = film.rows === 2      ? 'card--tall' : '';
    const title = i18next.language === 'en' && film.titleEn ? film.titleEn : film.title;

    return `
      <a href="filme.html?i=${index}" class="film-card ${wide} ${tall} card--${film.ratio}">
        <div class="film-card__img">
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
          <div class="film-card__title">${title}</div>
          <div class="film-card__meta">
            <div class="film-card__dir">Dir. ${film.director}</div>
            <span class="film-card__year">${film.year}</span>
          </div>
        </div>
      </a>`;
  }

  /* ── RENDERIZA GRID (com ordenação) ── */

  function renderGrid(sortMode = 'relevance') {
    let sorted = [...films];

    if (sortMode === 'relevance') {
      // Preserva a ordem editorial do data.json (sem modificação)
    } else if (sortMode === 'recent') {
      sorted.sort((a, b) => b.year - a.year);
    } else if (sortMode === 'az') {
      const lang = i18next.language;
      sorted.sort((a, b) => {
        const titleA = lang === 'en' ? a.titleEn : a.title;
        const titleB = lang === 'en' ? b.titleEn : b.title;
        return titleA.localeCompare(titleB, lang, { sensitivity: 'base' });
      });
    }

    document.querySelector('.films-grid').innerHTML = sorted.map((film, i) => {
      const pattern       = i === 0 ? { size: 'wide', ratio: 'l', rows: 1 }
                                    : { size: '',     ratio: 'p', rows: 1 };
      const originalIndex = films.indexOf(film);
      return createCard({ ...film, ...pattern }, originalIndex);
    }).join('');

    attachCardHovers();
  }





  /* ── updateDOM (chamada pelo script-shared ao trocar idioma) ── */
  window.updateDOM = function() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = i18next.t(el.getAttribute('data-i18n'));
    });

    // Mantém o sort ativo ao trocar idioma
    const activeSort = document.querySelector('.sort-btn.active');
    const mode = activeSort ? activeSort.getAttribute('data-sort') : 'relevance';
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
          'sort.relevance':         'Relevância',
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
          'sort.relevance':         'Relevance',
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
});