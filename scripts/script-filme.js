/* ============================================================
   script-filme.js
   Lógica exclusiva da página filme.html
   Depende de: i18next, script-shared.js, data.js
   ============================================================ */

dataReady.then(() => { /* espera os dados do json serem carregados */

  function getFilme() {
    const params = new URLSearchParams(window.location.search);
    const idx    = params.get('i');
    const src    = params.get('src');
    const source = src === 'upcoming' ? upcomingFilms
                 : src === 'other'    ? otherProductions
                 :                      films;
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
    document.title = `${title} — pontos de fuga`;

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
      f.director ? `Dir. ${f.director}` : '';

    // sinopse
    document.getElementById('filmeSynopsis').textContent = synopsis || '';

    // tags
    const tags = f.tags || [f.genre, f.year].filter(Boolean);
    document.getElementById('filmeTags').innerHTML =
      tags.map(t => `<span class="tag">${t}</span>`).join('');

    // trailer
    const trailerWrap = document.getElementById('filmeTrailer');
    const trailerVideo = document.getElementById('filmeTrailerVideo');
    if (f.videoTrailer) {
      trailerVideo.src = f.videoTrailer;
      trailerWrap.style.display = '';
    } else {
      trailerWrap.style.display = 'none';
    }

    observeReveal();
  }

  window.updateDOM = function() {
    applyI18n();
    renderFilme();
  }

  i18next.init({
    lng: 'pt',
    resources: {
      pt: {
        translation: {
          ...COMMON_I18N.pt,
          'nav.portfolio':          'Portfólio',
          'nav.shop':               'Loja',
          'footer.col2':            'Mais',
        }
      },
      en: {
        translation: {
          ...COMMON_I18N.en,
          'nav.portfolio':          'Portfolio',
          'nav.shop':               'Shop',
          'footer.col2':            'More',
        }
      }
    }
  }, () => {
    renderFilme();
  });
});