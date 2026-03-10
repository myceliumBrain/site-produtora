/* ============================================================
   script-historia.js
   Lógica exclusiva da página historia.html
   Depende de: i18next, script-shared.js, data.js
   ============================================================ */

dataReady.then(() => { /* espera os dados do json serem carregados */

  function renderHistoria() {
    const lang = i18next.language;
    const d    = historiaData;

    /* ── MANIFESTO ── */
    document.querySelector('.historia-manifesto__eyebrow').textContent =
      lang === 'en' ? d.manifesto.eyebrowEn : d.manifesto.eyebrow;

    document.querySelector('.historia-manifesto__title').innerHTML = `
      ${lang === 'en' ? d.manifesto.title1En : d.manifesto.title1}<br>
      <em>${lang === 'en' ? d.manifesto.title2En : d.manifesto.title2}</em>`;

    const [p1, p2] = document.querySelectorAll('.historia-manifesto__body p');
    p1.textContent = lang === 'en' ? d.manifesto.p1En : d.manifesto.p1;
    p2.textContent = lang === 'en' ? d.manifesto.p2En : d.manifesto.p2;

  
    /* ── MARCOS ── */
    document.querySelector('.historia-marcos__list').innerHTML =
      d.marcos.map(m => `
        <div class="historia-marco reveal">
          <span class="historia-marco__year">${m.year}</span>
          <div class="historia-marco__content">
            <h4 class="historia-marco__title">${lang === 'en' ? m.titleEn : m.title}</h4>
            <p class="historia-marco__text">${lang === 'en' ? m.textEn : m.text}</p>
          </div>
        </div>`
      ).join('');

    /* ── TIME ── */
    document.querySelector('.historia-team').innerHTML =
      d.team.map((m, i) => `
        <div class="historia-member${i % 2 !== 0 ? ' historia-member--reverse' : ''} reveal">
          <div class="historia-member__img-wrap">
            <div class="historia-member__img-bg"></div>
            <img src="${m.img}" alt="${m.name}" class="historia-member__img" onerror="this.style.display='none'">
          </div>
          <div class="historia-member__info">
            <span class="historia-member__role">${lang === 'en' ? m.roleEn : m.role}</span>
            <h3 class="historia-member__name">${m.name}</h3>
            <p class="historia-member__bio">${lang === 'en' ? m.bioEn : m.bio}</p>
          </div>
        </div>`
      ).join('');

    /* ── PARCEIROS ── */
    document.querySelector('.historia-parceiros__grid').innerHTML =
      d.parceiros.map(p => `<div class="historia-parceiro">${p}</div>`).join('');

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
  function updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = i18next.t(el.getAttribute('data-i18n'));
    });
    renderHistoria();
  }

  /* ── i18next ── */
  i18next.init({
    lng: 'pt',
    resources: {
      pt: {
        translation: {
          'nav.home':               'Início',
          'nav.portfolio':          'Portfólio',
          'footer.col1':            'Navegação',
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
          'historia.team.eyebrow':  'Quem faz acontecer',
          'historia.marcos.eyebrow':'Marcos',
          'historia.parceiros.eyebrow': 'Parceiros',
        }
      },
      en: {
        translation: {
          'nav.home':               'Home',
          'nav.portfolio':          'Portfolio',
          'footer.col1':            'Navigation',
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
          'historia.team.eyebrow':  'The team',
          'historia.marcos.eyebrow':'Milestones',
          'historia.parceiros.eyebrow': 'Partners',
        }
      }
    }
  }, () => {
    renderHistoria();
  });
});