/* ============================================================
   script-filme.js
   Lógica exclusiva da página filme.html
   Depende de: i18next, script-shared.js, data.js
   ============================================================ */

dataReady.then(() => { /* espera os dados do json serem carregados */

  function getFilme() {
    const params = new URLSearchParams(window.location.search);
    const idx    = params.get('i');
    const source = params.get('src') === 'upcoming' ? upcomingFilms : films;
    return source[parseInt(idx)] || null;
  }

  function renderFilme() {
    const f    = getFilme();
    const lang = i18next.language;

    if (!f) {
      document.querySelector('.filme-page').innerHTML =
        '<p style="padding:120px 48px;opacity:0.4">Filme não encontrado.</p>';
      return;
    }

    const title    = lang === 'en' ? f.titleEn    : f.title;
    const synopsis = lang === 'en' ? f.synopsisEn : f.synopsis;

    // título da aba
    document.title = `${title} — 000 filmes`;

    // hero bg
    if (f.imgLandscape) {
      document.getElementById('filmeBg').style.backgroundImage = `url('${f.imgLandscape}')`;
    }

    // eyebrow
    document.getElementById('filmeEyebrow').textContent =
      `${f.genre || ''} · ${f.year}`;

    // título
    document.getElementById('filmeTitle').textContent = title;

    // meta
    document.getElementById('filmeMeta').textContent =
      `Dir. ${f.director}`;

    // sinopse
    document.getElementById('filmeSynopsis').textContent = synopsis || '';

    // tags
    const tags = f.tags || [f.genre, f.year].filter(Boolean);
    document.getElementById('filmeTags').innerHTML =
      tags.map(t => `<span class="tag">${t}</span>`).join('');

    observeReveal();
  }

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

  window.updateDOM = function() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = i18next.t(el.getAttribute('data-i18n'));
    });
    renderFilme();
  }

  i18next.init({
    lng: 'pt',
    resources: {
      pt: {
        translation: {
          'nav.home':               'Início',
          'nav.portfolio':          'Portfólio',
          'nav.shop':               'Loja',
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
          'footer.col1':            'Navigation',
          'footer.col2':            'More',
          'footer.copy':            '© 2025 - 000 FILMES',
          'menu.home':              'Home',
          'menu.home.count':        'Home page',
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
    renderFilme();
  });
});