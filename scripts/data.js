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
  })
  .catch(err => {
    console.error('[000 filmes] Falha ao carregar dados:', err);
  });