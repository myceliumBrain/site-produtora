/* ============================================================
   script-index.js
   Lógica exclusiva da página index.html
   Depende de: i18next, script-shared.js
   ============================================================ */

dataReady.then(() => { /* espera os dados do json serem carregados */

/* ── HERO SLIDESHOW ──
   Filmes marcados com hero:true no array films ── */

  const heroFilms = films.filter(f => f.hero);
  let currentSlide = 0;

  // Gera slides e dots dinamicamente — funciona com qualquer quantidade de heroFilms
  const slidesContainer = document.querySelector('.hero-slides');
  const dotsContainer   = document.getElementById('heroNav');

  slidesContainer.innerHTML = heroFilms.map((_, i) =>
    `<div class="hero-slide${i === 0 ? ' active' : ''}"></div>`
  ).join('');

  dotsContainer.innerHTML = heroFilms.map((_, i) =>
    `<div class="hero-dot${i === 0 ? ' active' : ''}" data-index="${i}"></div>`
  ).join('');

  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.hero-dot');

  function goToSlide(n) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = n;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');

    const f    = heroFilms[n];
    const lang = i18next.language;
    const title = lang === 'en' ? f.titleEn : f.title;

    // Atualiza imagem de fundo do slide
    if (f.imgLandscape) {
      slides[n].style.backgroundImage    = `url('${f.imgLandscape}')`;
      slides[n].style.backgroundSize     = 'cover';
      slides[n].style.backgroundPosition = 'center';
    } else {
      slides[n].style.backgroundImage = '';
    }

    // Atualiza texto do hero
    document.querySelector('.hero-title').innerHTML = title;
    document.querySelector('.hero-meta').textContent =
      `Dir. ${f.director} · ${f.genre || 'Drama'} · ${f.year}`;
  }

  dots.forEach(d => d.addEventListener('click', () => goToSlide(+d.dataset.index)));
  setInterval(() => goToSlide((currentSlide + 1) % heroFilms.length), 5000);


  /* ── PREVIEW GRID ──
    Usa os 4 primeiros filmes do array `films` (script-shared.js),
    ignorando os "wide" para manter o grid equilibrado na home. ── */
  function renderPreview() {
    const lang = i18next.language;

    // Pega até 4 filmes normais para o preview da home
  const previewFilms = films.slice(0, 4);

    document.getElementById('previewGrid').innerHTML = previewFilms.map(f => {
      const originalIndex = films.indexOf(f);
      return `
        <a href="filme.html?i=${originalIndex}" class="preview-card reveal">
          <div class="preview-card__bg">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(240,236,228,0.1)">
              <rect x="3" y="3" width="18" height="18" rx="1" stroke-width="0.6"/>
              <circle cx="8.5" cy="8.5" r="1.5" stroke-width="0.6"/>
              <path d="M21 15l-5-5L5 21" stroke-width="0.6"/>
            </svg>
            <img class="preview-card__img-portrait"
                src="${f.imgPortrait}"
                alt="${lang === 'en' ? f.titleEn : f.title}"
                onerror="this.style.display='none'">
          </div>
          <div class="preview-card__overlay"></div>
          <div class="preview-card__info">
            <div class="preview-card__year">${f.year}</div>
            <div class="preview-card__title">${lang === 'en' ? f.titleEn : f.title}</div>
            <div class="preview-card__dir">Dir. ${f.director}</div>
          </div>
        </a>`;
    }).join('');

    observeReveal();
  }

  /* ── UPCOMING (lê upcomingFilms do script-shared.js) ── */
  const statusKey = {
    filming: 'status.filming',
    dev:     'status.dev',
    post:    'status.post',
  };

  function renderUpcoming() {
    const lang = i18next.language;

    document.getElementById('upcomingList').innerHTML = upcomingFilms.map((f, i) => {
      const title  = lang === 'en' ? f.titleEn : f.title;
      const status = i18next.t(statusKey[f.status]);
      const num    = String(i + 1).padStart(2, '0');
      const delay  = i > 0 ? `reveal-delay-${i}` : '';

      return `
        <li class="upcoming-item reveal ${delay}">
          <a href="filme.html?src=upcoming&i=${i}" class="upcoming-item__link">
            <span class="upcoming-item__num">${num}</span>
            <span class="upcoming-item__title">${title}</span>
            <div class="upcoming-item__meta">
              <div>Dir. ${f.director}</div>
              <div class="upcoming-item__status">${status}</div>
            </div>
          </a>
        </li>`;
    }).join('');

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
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
  }


  /* ── updateDOM (chamada pelo script-shared ao trocar idioma) ── */
  window.updateDOM = function() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = i18next.t(el.getAttribute('data-i18n'));
    });
    renderPreview();
    renderUpcoming();
    goToSlide(currentSlide);
  }


  /* ── i18next ── */
    i18next.init({
      lng: 'pt',
      resources: {
        pt: {
          translation: {
            'nav.portfolio':          'Portfólio',
            'identity.statement':     'Fazemos filmes que precisam existir.',
            'identity.link':          'Nossa história',
            'cta.eyebrow':            'Contato',
            'cta.title':              'Tem uma história que precisa ser contada?',
            'cta.body':               'Estamos sempre abertos a novos projetos, parcerias criativas e colaborações que valham a pena.',
            'cta.link':               'Fale com a gente',
            'hero.label':             'Em destaque · 2025',
            'hero.cta':               'Ver portfólio',
            'hero.scroll':            'Scroll',
            'featured.eyebrow':       'Último lançamento',
            'featured.more':          'Saiba mais',
            'manifesto.sub':          'Fundada em 2018 · Rio de Janeiro',
            'grid.title':             'Produções recentes',
            'grid.all':               'Ver todas',
            'upcoming.title':         'Vem aí',
            'upcoming.sub':           'Em produção',
            'status.filming':         'Filmando',
            'status.dev':             'Desenvolvimento',
            'status.post':            'Pós-produção',
            'footer.col1':            'Navegação',
            'footer.copy':            '© 2025 - 000 FILMES',
            'menu.home':              'Início',
            'menu.home.count':        '',
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
            'nav.portfolio':          'Portfolio',
            'identity.statement':     'We make films that need to exist.',
            'identity.link':          'Our story',
            'cta.eyebrow':            'Contact',
            'cta.title':              'Got a story that needs to be told?',
            'cta.body':               'We\'re always open to new projects, creative partnerships and collaborations worth making.',
            'cta.link':               'Get in touch',
            'hero.label':             'Featured · 2025',
            'hero.cta':               'View portfolio',
            'hero.scroll':            'Scroll',
            'featured.eyebrow':       'Latest release',
            'featured.more':          'Learn more',
            'manifesto.sub':          'Founded in 2018 · Rio de Janeiro',
            'grid.title':             'Recent productions',
            'grid.all':               'View all',
            'upcoming.title':         'Coming soon',
            'upcoming.sub':           'In production',
            'status.filming':         'Filming',
            'status.dev':             'Development',
            'status.post':            'Post-production',
            'footer.col1':            'Navigation',
            'footer.copy':            '© 2025 - 000 FILMES',
            'menu.home':              'Home',
            'menu.home.count': '',
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
      goToSlide(0);
      renderPreview();
      renderUpcoming();
      observeReveal();
    });
});