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

    // fotografias
    const fotosWrap = document.getElementById('filmeFotografias');
    const fotosGrid = document.getElementById('filmeFotografiasGrid');
    if (f.fotografias && f.fotografias.length) {
      fotosGrid.innerHTML = f.fotografias.map(url =>
        `<img src="${url}" class="filme-gallery__img" loading="lazy" onerror="this.style.display='none'">`
      ).join('');
      fotosWrap.style.display = '';
      attachGalleryLightbox('filmeFotografiasGrid', f.fotografias);
    } else {
      fotosWrap.style.display = 'none';
    }

    // making off
    const makingOffWrap = document.getElementById('filmeMakingOff');
    const makingOffGrid = document.getElementById('filmeMakingOffGrid');
    if (f.makingOff && f.makingOff.length) {
      makingOffGrid.innerHTML = f.makingOff.map(url =>
        `<img src="${url}" class="filme-gallery__img" loading="lazy" onerror="this.style.display='none'">`
      ).join('');
      makingOffWrap.style.display = '';
      attachGalleryLightbox('filmeMakingOffGrid', f.makingOff);
    } else {
      makingOffWrap.style.display = 'none';
    }

    observeReveal();
  }

  /* ── LIGHTBOX ── */
  let lbImages = [];
  let lbIndex  = 0;

  const lightbox   = document.getElementById('lightbox');
  const lbImg      = document.getElementById('lightboxImg');
  const lbCounter  = document.getElementById('lightboxCounter');
  const lbPrev     = document.getElementById('lightboxPrev');
  const lbNext     = document.getElementById('lightboxNext');
  const lbClose    = document.getElementById('lightboxClose');

  function lbOpen(images, startIdx) {
    lbImages = images;
    lbIndex  = startIdx;
    lbShow();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function lbClose_() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function lbShow() {
    lbImg.src = lbImages[lbIndex];
    lbCounter.textContent = `${lbIndex + 1} / ${lbImages.length}`;
    lbPrev.disabled = lbIndex === 0;
    lbNext.disabled = lbIndex === lbImages.length - 1;
  }

  lbClose.addEventListener('click', lbClose_);
  lbPrev.addEventListener('click', () => { if (lbIndex > 0) { lbIndex--; lbShow(); } });
  lbNext.addEventListener('click', () => { if (lbIndex < lbImages.length - 1) { lbIndex++; lbShow(); } });

  lightbox.addEventListener('click', e => { if (e.target === lightbox) lbClose_(); });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      lbClose_();
    if (e.key === 'ArrowLeft'  && lbIndex > 0)                      { lbIndex--; lbShow(); }
    if (e.key === 'ArrowRight' && lbIndex < lbImages.length - 1)    { lbIndex++; lbShow(); }
  });

  function attachGalleryLightbox(gridId, images) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.querySelectorAll('.filme-gallery__img').forEach((img, i) => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => lbOpen(images, i));
    });
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