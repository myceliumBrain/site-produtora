/* ============================================================
   script-vemai.js
   Lógica exclusiva da página vemai.html
   Depende de: i18next, script-shared.js (upcomingFilms)
   ============================================================ */

dataReady.then(() => { /* espera os dados do json serem carregados */

   
  /* ── MAPA DE STATUS → chave i18n ── */
  const statusKey = {
    filming: 'status.filming',
    dev:     'status.dev',
    post:    'status.post',
  };


  /* ── RENDERIZA FILMES ── */

  function renderFilmes() {
    const lang = i18next.language;

    const html = upcomingFilms.map((f, i) => {
      const title    = lang === 'en' ? f.titleEn    : f.title;
      const synopsis = lang === 'en' ? f.synopsisEn : f.synopsis;
      const genre    = lang === 'en' ? f.genreEn    : f.genre;
      const status   = i18next.t(statusKey[f.status]);

      return `
        <a href="filme.html?src=upcoming&i=${i}" class="vemai-filme reveal">
          <div class="vemai-filme__img-wrap">
            <div class="vemai-filme__img-bg"></div>
            <div class="vemai-filme__placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white">
                <rect x="3" y="3" width="18" height="18" rx="1" stroke-width="0.6"/>
                <circle cx="8.5" cy="8.5" r="1.5" stroke-width="0.6"/>
                <path d="M21 15l-5-5L5 21" stroke-width="0.6"/>
              </svg>
            </div>
            ${f.imgPortrait
              ? `<img class="vemai-filme__img" src="${f.imgPortrait}" alt="${title}" onerror="this.style.display='none'">`
              : ''}
          </div>
          <div class="vemai-filme__info">
            <div class="vemai-filme__status">${status}</div>
            <h2 class="vemai-filme__title">${title}</h2>
            <div class="vemai-filme__meta">
              ${genre} &nbsp;·&nbsp; ${f.year}
            </div>
            <p class="vemai-filme__synopsis">${synopsis}</p>
            <div class="vemai-filme__tags">
              <span class="vemai-filme__tag">${genre}</span>
              <span class="vemai-filme__tag">${f.year}</span>
              <span class="vemai-filme__tag">${status}</span>
            </div>
          </div>
        </a>`;
    }).join('');

    document.getElementById('vemai-filmes').innerHTML = html;
    observeReveal();
  }

  /* ── SCROLL REVEAL ── */
  function observeReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
  }


  /* ── updateDOM (chamada pelo script-shared ao trocar idioma) ── */
  window.updateDOM = function() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = i18next.t(key);
      if (val !== key) el.textContent = val;
    });
    renderFilmes();
  }


  /* ── i18next ── */
  i18next.init({
    lng: 'pt',
    resources: {
      pt: {
        translation: {
          'nav.home':               'Início',
          'nav.portfolio':          'Portfólio',
          'nav.shop':               'Loja',
          'vemai.eyebrow':          'Em produção',
          'vemai.title':            'Vem aí',
          'vemai.sub':              'Cada projeto nasce de uma inquietação — uma pergunta que não cabe em silêncio. Aqui vivem as histórias que ainda estão tomando forma.',
          'status.filming':         'Filmando',
          'status.dev':             'Desenvolvimento',
          'status.post':            'Pós-produção',
          'footer.col1':            'Navegação',
          'footer.col2':            'Mais',
          'footer.copy':            '© 2025 - 000 FILMES',
          'menu.home':              'Início',
          'menu.home.count':        'Página inicial',
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
          'nav.portfolio':          'Portfolio',
          'nav.shop':               'Shop',
          'vemai.eyebrow':          'In production',
          'vemai.title':            'Coming soon',
          'vemai.sub':              'Each project is born from a restlessness — a question that doesn\'t fit in silence. Here live the stories still taking shape.',
          'status.filming':         'Filming',
          'status.dev':             'Development',
          'status.post':            'Post-production',
          'footer.col1':            'Navigation',
          'footer.col2':            'More',
          'footer.copy':            '© 2025 - 000 FILMES',
          'menu.home':              'Home',
          'menu.home.count':        'Homepage',
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
    renderFilmes();
    observeReveal();
  });
});