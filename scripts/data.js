/* ============================================================
   data.js
   Carrega data.json e expõe as variáveis globais usadas
   pelos demais scripts: films, upcomingFilms, historiaData.

   IMPORTANTE: este script usa fetch(), portanto o site precisa
   rodar em um servidor HTTP (local ou produção).
   Para desenvolvimento local, use: npx serve . ou Live Server.
   ============================================================ */

/* Promessa global resolvida quando os dados estiverem prontos.
   Os scripts de página devem aguardar: await dataReady          */
let films            = [];
let upcomingFilms    = [];
let historiaData     = {};
let otherProductions = [];
let pagesData        = {};
let siteData         = {};

const dataReady = fetch('scripts/data.json')
  .then(res => {
    if (!res.ok) throw new Error(`Erro ao carregar data.json: ${res.status}`);
    return res.json();
  })
  .then(json => {
    films            = json.films;
    upcomingFilms    = json.upcomingFilms;
    historiaData     = json.historiaData;
    otherProductions = json.otherProductions || [];
    pagesData        = json.pagesData        || {};
    siteData         = json.siteData         || {};
  })
  .catch(err => {
    console.error('[pontos de fuga] Falha ao carregar dados:', err);
    // Exibe mensagem de erro visível para o usuário em páginas públicas.
    // O admin tem tratamento próprio — só aplica se houver .page ou main no DOM.
    const target = document.querySelector('.page, main, .filme-page');
    if (target && !document.getElementById('app')) {
      target.innerHTML =
        '<p style="padding:120px 48px;font-family:monospace;opacity:0.5">' +
        'Erro ao carregar dados. Tente recarregar a página.</p>';
    }
    throw err; // re-throw para que páginas possam capturar via .catch() se necessário
  });