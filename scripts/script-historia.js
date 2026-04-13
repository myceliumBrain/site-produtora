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

  
    /* ── FESTIVAIS ── */
    const festivais = d.festivais || [];
    document.getElementById('festivaisDivider').style.display  = festivais.length ? '' : 'none';
    document.getElementById('festivaisSection').style.display  = festivais.length ? '' : 'none';
    const festivaisFillerCount = (() => {
      let units = 0;
      festivais.forEach((_, i) => { units += (i % 5 === 0 || i % 5 === 3) ? 2 : 1; });
      const rem = units % 6;
      return rem === 0 ? 0 : 6 - rem;
    })();
    document.querySelector('.historia-festivais__grid').innerHTML =
      festivais.map(f => `
        <div class="historia-festival">
          ${f.logo ? `<img src="${f.logo}" alt="${f.name}">` : ''}
          <span class="historia-festival__name">${f.name}</span>
          ${f.year ? `<span class="historia-festival__year">${f.year}</span>` : ''}
        </div>`
      ).join('') +
      '<div class="historia-festival historia-festival--filler"></div>'.repeat(festivaisFillerCount);

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
    const parceiros = d.parceiros || [];
    document.querySelector('.historia-parceiros__grid').innerHTML =
      parceiros.map(p => {
        const name = typeof p === 'string' ? p : (p.name || '');
        const logo = typeof p === 'object' && p.logo ? p.logo : '';
        return logo
          ? `<div class="historia-parceiro"><img src="${logo}" alt="${name}" style="max-height:48px;object-fit:contain;opacity:0.5;transition:opacity 0.3s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5"></div>`
          : `<div class="historia-parceiro">${name}</div>`;
      }).join('');
    updateParceirosFiller(parceiros.length);

    observeReveal(0.15);
  }

  /* ── PARCEIROS: fillers responsivos ── */
  function parceirosCols() {
    return window.innerWidth <= 480 ? 1 : window.innerWidth <= 1024 ? 2 : 3;
  }
  function updateParceirosFiller(count) {
    const grid = document.querySelector('.historia-parceiros__grid');
    if (!grid) return;
    grid.querySelectorAll('.historia-parceiro--filler').forEach(el => el.remove());
    const cols = parceirosCols();
    const rem  = count % cols;
    const n    = rem === 0 ? 0 : cols - rem;
    for (let i = 0; i < n; i++) {
      const div = document.createElement('div');
      div.className = 'historia-parceiro historia-parceiro--filler';
      grid.appendChild(div);
    }
  }
  let _parceirosResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_parceirosResizeTimer);
    _parceirosResizeTimer = setTimeout(() => {
      const grid = document.querySelector('.historia-parceiros__grid');
      if (!grid) return;
      const count = grid.querySelectorAll('.historia-parceiro:not(.historia-parceiro--filler)').length;
      updateParceirosFiller(count);
    }, 120);
  });

  /* ── updateDOM (chamada pelo script-shared ao trocar idioma) ── */
  window.updateDOM = function() {
    applyI18n();
    renderHistoria();
  }

  /* ── i18next ── */
  i18next.init({
    lng: 'pt',
    resources: {
      pt: {
        translation: {
          ...COMMON_I18N.pt,
          'nav.portfolio':          'Portfólio',
          'historia.team.eyebrow':       (pagesData.historia && pagesData.historia.teamEyebrowPt)      || 'Quem faz acontecer',
          'historia.festivais.eyebrow':  (pagesData.historia && pagesData.historia.festivaisEyebrowPt) || 'Festivais',
          'historia.marcos.eyebrow':     (pagesData.historia && pagesData.historia.marcosEyebrowPt)    || 'Marcos',
          'historia.parceiros.eyebrow': (pagesData.historia && pagesData.historia.parceirosEyebrowPt)  || 'Parceiros',
        }
      },
      en: {
        translation: {
          ...COMMON_I18N.en,
          'nav.portfolio':          'Portfolio',
          'historia.team.eyebrow':       (pagesData.historia && pagesData.historia.teamEyebrowEn)      || 'The team',
          'historia.festivais.eyebrow':  (pagesData.historia && pagesData.historia.festivaisEyebrowEn) || 'Film Festivals',
          'historia.marcos.eyebrow':     (pagesData.historia && pagesData.historia.marcosEyebrowEn)    || 'Milestones',
          'historia.parceiros.eyebrow': (pagesData.historia && pagesData.historia.parceirosEyebrowEn)  || 'Partners',
        }
      }
    }
  }, () => {
    renderHistoria();
  });
});