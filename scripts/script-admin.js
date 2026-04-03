/* ============================================================
   script-admin.js
   Admin com autenticação por senha criptografada (AES-GCM)
   O token GitHub fica criptografado no data.json (_auth.tokens)
   ============================================================ */

const REPO   = 'myceliumBrain/site-produtora';
const FILE   = 'scripts/data.json';
const BRANCH = 'lite_mode';

let TOKEN   = '';
let fileSHA = '';
let data    = {};


/* ══════════════════════════════════════════════════════════
   CRYPTO — Web Crypto API (nativa no browser)
══════════════════════════════════════════════════════════ */
const enc = new TextEncoder();
const dec = new TextDecoder();

function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}
function bytesToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}

async function encryptToken(token, password) {
  const salt      = crypto.getRandomValues(new Uint8Array(16));
  const iv        = crypto.getRandomValues(new Uint8Array(12));
  const key       = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, enc.encode(token)
  );
  return {
    salt: bytesToB64(salt),
    iv:   bytesToB64(iv),
    data: bytesToB64(encrypted)
  };
}

async function decryptToken(entry, password) {
  try {
    const salt = b64ToBytes(entry.salt);
    const iv   = b64ToBytes(entry.iv);
    const key  = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, b64ToBytes(entry.data)
    );
    return dec.decode(decrypted);
  } catch {
    return null; // senha errada
  }
}

/* ══════════════════════════════════════════════════════════
   GITHUB API (sem token ainda — só para carregar o JSON)
══════════════════════════════════════════════════════════ */
async function ghGet(path) {
  const headers = { Accept: 'application/vnd.github.v3+json' };
  if (TOKEN) headers.Authorization = `token ${TOKEN}`;
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers }
  );
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function ghPut(path, content, sha, message) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        sha,
        branch: BRANCH
      })
    }
  );
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || `PUT → ${res.status}`); }
  return res.json();
}

async function ghPutBinary(path, base64Content, message) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, content: base64Content, branch: BRANCH })
    }
  );
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || `PUT → ${res.status}`); }
  return res.json();
}

async function ghDelete(path, sha, message) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, sha, branch: BRANCH })
    }
  );
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || `DELETE → ${res.status}`); }
  return res.json();
}


async function loadData(tok) {
  if (tok) TOKEN = tok;
  const file = await ghGet(FILE);
  fileSHA = file.sha;
  data = JSON.parse(decodeURIComponent(escape(atob(file.content.replace(/\n/g, '')))));
}

async function saveData(commitMsg) {
  const result = await ghPut(FILE, JSON.stringify(data, null, 2), fileSHA, commitMsg);
  fileSHA = result.content.sha;
}

/* ══════════════════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════════════════ */
async function doLogin() {
  const password = document.getElementById('passwordInput').value.trim();
  if (!password) return;

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> verificando…';
  document.getElementById('loginErr').textContent = '';

  try {
    await loadData();

    const tokens = data._auth?.tokens || [];
    if (tokens.length === 0) {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('setupScreen').style.display = 'flex';
      btn.disabled = false;
      btn.innerHTML = 'Entrar →';
      return;
    }

    let decryptedToken = null;
    for (const entry of tokens) {
      decryptedToken = await decryptToken(entry, password);
      if (decryptedToken) break;
    }

    if (!decryptedToken) throw new Error('Senha incorreta.');

    TOKEN = decryptedToken;
    showApp();

  } catch (e) {
    document.getElementById('loginErr').textContent = e.message;
    btn.disabled = false;
    btn.innerHTML = 'Entrar →';
  }
}

document.getElementById('passwordInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('setupScreen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  renderAll();
  setStatus('dados carregados ✓', 'ok');
}

function doLogout() {
  TOKEN = ''; fileSHA = ''; data = {};
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('passwordInput').value = '';
  document.getElementById('loginErr').textContent = '';
}

/* ══════════════════════════════════════════════════════════
   SETUP — primeira configuração (nenhuma senha cadastrada)
══════════════════════════════════════════════════════════ */
async function doSetup() {
  const token    = document.getElementById('setupToken').value.trim();
  const password = document.getElementById('setupPassword').value.trim();
  const label    = document.getElementById('setupLabel').value.trim() || 'admin';

  if (!token || !password) {
    document.getElementById('setupErr').textContent = 'Preencha token e senha.';
    return;
  }

  const btn = document.getElementById('setupBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> salvando…';

  try {
    TOKEN = token;
    await loadData(token);

    const encrypted = await encryptToken(token, password);
    if (!data._auth) data._auth = { tokens: [] };
    data._auth.tokens.push({ label, ...encrypted });
    await saveData('admin: configura autenticação');
    showApp();
  } catch (e) {
    document.getElementById('setupErr').textContent = 'Erro: ' + e.message;
    btn.disabled = false;
    btn.innerHTML = 'Salvar e entrar →';
  }
}

/* ══════════════════════════════════════════════════════════
   GERENCIAR ACESSOS
══════════════════════════════════════════════════════════ */
function renderAcessos() {
  const tokens = data._auth?.tokens || [];
  document.getElementById('acessosList').innerHTML = tokens.length === 0
    ? '<p style="font-family:var(--mono);font-size:0.8rem;color:var(--muted)">Nenhum acesso cadastrado.</p>'
    : tokens.map((t, i) => `
        <div class="card" style="margin-bottom:0.5rem">
          <div class="card-header" style="cursor:default">
            <div class="card-header-left">
              <span class="card-num">${String(i+1).padStart(2,'0')}</span>
              <span class="card-name">${t.label || 'sem nome'}</span>
            </div>
            <button class="btn btn-danger btn-small" onclick="revokeAccess(${i})">Revogar</button>
          </div>
        </div>`).join('');
}

async function addAccess() {
  const token    = document.getElementById('newToken').value.trim();
  const password = document.getElementById('newPassword').value.trim();
  const label    = document.getElementById('newLabel').value.trim() || 'usuário';

  if (!token || !password) {
    toast('Preencha token e senha.', 'err'); return;
  }

  const btn = document.getElementById('addAccessBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const encrypted = await encryptToken(token, password);
    if (!data._auth) data._auth = { tokens: [] };
    data._auth.tokens.push({ label, ...encrypted });
    await saveData('admin: adiciona acesso');
    renderAcessos();
    document.getElementById('newToken').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newLabel').value = '';
    toast('Acesso adicionado!', 'ok');
  } catch (e) {
    toast('Erro: ' + e.message, 'err');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '+ adicionar acesso';
  }
}

async function revokeAccess(i) {
  if (!confirm(`Revogar acesso de "${data._auth.tokens[i].label}"?`)) return;
  data._auth.tokens.splice(i, 1);
  try {
    await saveData('admin: revoga acesso');
    renderAcessos();
    toast('Acesso revogado.', 'ok');
  } catch (e) {
    toast('Erro: ' + e.message, 'err');
  }
}

/* ══════════════════════════════════════════════════════════
   NAV
══════════════════════════════════════════════════════════ */
function showPanel(name) {
  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  document.querySelector(`[onclick="showPanel('${name}')"]`).classList.add('active');
  if (name === 'acessos') renderAcessos();
  closeAdmDrawer();
}

function toggleAdmDrawer() {
  const sidebar  = document.querySelector('.adm-sidebar');
  const backdrop = document.getElementById('admDrawerBackdrop');
  const open     = sidebar.classList.toggle('open');
  backdrop.classList.toggle('open', open);
}

function closeAdmDrawer() {
  document.querySelector('.adm-sidebar').classList.remove('open');
  document.getElementById('admDrawerBackdrop').classList.remove('open');
}

/* ══════════════════════════════════════════════════════════
   RENDER ALL
══════════════════════════════════════════════════════════ */
function renderAll() {
  renderFilms();
  renderOtherProductions();
  renderUpcoming();
  renderPagHistoria();
  renderPagPrincipal();
  renderPagProducoes();
  renderPagContato();
  renderPagVemai();
  renderFestivais();
  renderMarcos();
  renderTeam();
  renderParceiros();
  document.getElementById('saveBtn').disabled = false;
}

/* ══════════════════════════════════════════════════════════
   SAVE ALL
══════════════════════════════════════════════════════════ */
async function saveAll() {
  collectAll();
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  document.getElementById('saveBtnText').innerHTML = '<span class="spinner"></span>';
  setStatus('salvando…', '');
  try {
    await saveData('admin: atualiza data.json');
    setStatus('salvo ✓', 'ok');
    toast('Salvo no GitHub!', 'ok');
  } catch (e) {
    setStatus('erro ao salvar ✗', 'err');
    toast('Erro: ' + e.message, 'err');
  } finally {
    btn.disabled = false;
    document.getElementById('saveBtnText').textContent = 'Salvar no GitHub';
  }
}

/* ══════════════════════════════════════════════════════════
   SAVE CARD — salva um item individual e re-renderiza o header
══════════════════════════════════════════════════════════ */

/**
 * Coleta os campos de um card, atualiza `data` em memória
 * e re-renderiza o painel. NÃO faz commit no GitHub.
 *
 * @param {string} type  'film' | 'upcoming' | 'marco' | 'team'
 * @param {number} i     Índice do item no array
 */
function saveCard(type, i) {
  // Coleta todos os campos do formulário para `data` em memória (sem commit)
  collectAll();

  // Re-renderiza o painel para refletir mudanças no header (título, ano, etc.)
  const renderMap = { film: renderFilms, other: renderOtherProductions, upcoming: renderUpcoming, festival: renderFestivais, marco: renderMarcos, team: renderTeam };
  if (renderMap[type]) renderMap[type]();

  // Reabre o card e desabilita o botão salvar até haver nova alteração
  const cardId = `${type}-card-${i}`;
  const card = document.getElementById(cardId);
  if (card) {
    card.classList.add('open');
    const saveBtn = card.querySelector('.card-actions .btn-primary');
    if (saveBtn) {
      saveBtn.disabled = true;
      const reEnable = () => {
        saveBtn.disabled = false;
        card.removeEventListener('input',  reEnable);
        card.removeEventListener('change', reEnable);
      };
      card.addEventListener('input',  reEnable);
      card.addEventListener('change', reEnable);
    }
  }

  toast('Visual atualizado — clique em “Salvar no GitHub” para confirmar.', 'ok');
}

/* ══════════════════════════════════════════════════════════
   REORDER — ferramenta genérica de reordenação
   Usada por: films, upcomingFilms, marcos, team
══════════════════════════════════════════════════════════ */

/**
 * Move um item do array na posição `fromIdx` para `toIdx`.
 * Após mover, re-renderiza a lista e salva automaticamente no GitHub.
 *
 * @param {Array}    arr        Referência ao array em `data`
 * @param {number}   fromIdx    Índice atual do item
 * @param {number}   toIdx      Índice de destino
 * @param {Function} renderFn   Função que re-renderiza o painel (ex: renderFilms)
 * @param {string}   commitMsg  Mensagem do commit no GitHub
 */
function moveItem(arr, fromIdx, toIdx, renderFn) {
  if (toIdx < 0 || toIdx >= arr.length) return;

  // Coleta os valores dos campos abertos antes de reorganizar
  collectAll();

  // Troca os elementos
  const [removed] = arr.splice(fromIdx, 1);
  arr.splice(toIdx, 0, removed);

  // Re-renderiza visualmente (sem commit — aguarda "Salvar no GitHub")
  renderFn();

  toast('Ordem atualizada — clique em “Salvar no GitHub” para confirmar.', 'ok');
}

/**
 * Gera o HTML dos botões de seta para reordenação.
 * A seta para cima é desabilitada no primeiro item;
 * a seta para baixo é desabilitada no último.
 *
 * @param {number} idx       Índice atual do item
 * @param {number} total     Total de itens no array
 * @param {string} moveUpFn  String com a chamada JS para mover para cima
 * @param {string} moveDnFn  String com a chamada JS para mover para baixo
 */
function reorderBtns(idx, total, moveUpFn, moveDnFn) {
  return `
    <div class="reorder-btns">
      <button class="reorder-btn" title="Mover para cima"
        ${idx === 0 ? 'disabled' : ''}
        onclick="${moveUpFn}">▲</button>
      <button class="reorder-btn" title="Mover para baixo"
        ${idx === total - 1 ? 'disabled' : ''}
        onclick="${moveDnFn}">▼</button>
    </div>`;
}

/* ══════════════════════════════════════════════════════════
   FILMS
══════════════════════════════════════════════════════════ */
function renderFilms() {
  const films = data.films || [];
  document.getElementById('filmsCount').textContent = films.length;
  document.getElementById('filmsPanelCount').textContent = films.length + ' filmes';
  document.getElementById('filmsList').innerHTML = films.map((f, i) => `
    <div class="card" id="film-card-${i}">
      <div class="card-header" onclick="toggleCard('film-card-${i}')">
        <div class="card-header-left">
          ${reorderBtns(i, films.length,
            `event.stopPropagation(); moveFilm(${i}, ${i-1})`,
            `event.stopPropagation(); moveFilm(${i}, ${i+1})`
          )}
          <span class="card-num">${String(i+1).padStart(2,'0')}</span>
          <span class="card-name">${f.title || '(sem título)'}</span>
          <span class="card-meta">${f.year||''} · ${f.genre||''}</span>
        </div>
        <span class="card-chevron">▼</span>
      </div>
      <div class="card-body">
        <div class="fields-grid">
          <div class="field"><label>Título PT</label><input data-film="${i}" data-key="title" value="${esc(f.title)}"></div>
          <div class="field"><label>Título EN</label><input data-film="${i}" data-key="titleEn" value="${esc(f.titleEn)}"></div>
          <div class="field"><label>Diretor</label><input data-film="${i}" data-key="director" value="${esc(f.director)}"></div>
          <div class="field"><label>Ano</label><input data-film="${i}" data-key="year" value="${esc(f.year)}"></div>
          <div class="field"><label>Gênero</label><input data-film="${i}" data-key="genre" value="${esc(f.genre)}"></div>
          <div class="field" style="display:flex;flex-direction:column;justify-content:center;padding-top:1.5rem;gap:4px;">
            <label class="checkbox-row">
              <input type="checkbox" data-film="${i}" data-key="hero" ${f.hero?'checked':''}>
              Aparece no hero
            </label>
            <span class="field-note" style="margin-left:0">necessário ter imagem paisagem (horizontal)</span>
          </div>
          <div class="field full"><label>Sinopse PT</label><textarea data-film="${i}" data-key="synopsis">${esc(f.synopsis)}</textarea></div>
          <div class="field full"><label>Sinopse EN</label><textarea data-film="${i}" data-key="synopsisEn">${esc(f.synopsisEn)}</textarea></div>
          ${imgField('film', i, 'imgPortrait',  'Imagem retrato (vertical)',   f.imgPortrait)}
          ${imgField('film', i, 'imgLandscape', 'Imagem paisagem (horizontal)', f.imgLandscape)}
          ${videoField('film', i, 'videoHover',   'Preview (.mp4)', f.videoHover||'',   'recomendado máx 15 segundos')}
          ${videoField('film', i, 'videoTrailer', 'Trailer (.mp4)', f.videoTrailer||'')}
          ${fotografiasField('film', i, f.fotografias)}
          ${makingOffField('film', i, f.makingOff)}
          <div class="field full">
            <label>Tags</label>
            <div id="tags-film-${i}">${renderTags(f.tags||[], 'film', i)}</div>
            <div class="tags-input-row">
              <input id="tagInput-film-${i}" placeholder="nova tag…"
                     onkeydown="if(event.key==='Enter'){addTag('film',${i});event.preventDefault()}">
              <button class="btn btn-secondary btn-small" onclick="addTag('film',${i})">+ tag</button>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn btn-danger btn-small" onclick="removeFilm(${i})">Remover filme</button>
          <button class="btn btn-primary btn-small" onclick="saveCard('film',${i})">Salvar</button>
        </div>
      </div>
    </div>`).join('');
}

function moveFilm(fromIdx, toIdx) {
  moveItem(data.films, fromIdx, toIdx, renderFilms);
}

function addFilm() {
  data.films.push({ title:'', titleEn:'', director:'', year:'', genre:'Drama',
    hero:false, synopsis:'', synopsisEn:'', tags:[], imgPortrait:'', imgLandscape:'',
    videoHover:'', videoTrailer:'', videoMakingOff:'', fotografias:[], makingOff:[] });
  renderFilms();
  const idx = data.films.length - 1;
  toggleCard(`film-card-${idx}`);
  document.getElementById(`film-card-${idx}`).scrollIntoView({ behavior:'smooth' });
}

function removeFilm(i) {
  if (!confirm(`Remover "${data.films[i].title || 'esta produção'}"?`)) return;
  data.films.splice(i, 1);
  renderFilms();
}

/* ══════════════════════════════════════════════════════════
   OTHER PRODUCTIONS
══════════════════════════════════════════════════════════ */
function renderOtherProductions() {
  const items = data.otherProductions || [];
  document.getElementById('otherPanelCount').textContent = items.length + ' itens';
  document.getElementById('otherProductionsList').innerHTML = items.map((f, i) => `
    <div class="card" id="other-card-${i}">
      <div class="card-header" onclick="toggleCard('other-card-${i}')">
        <div class="card-header-left">
          ${reorderBtns(i, items.length,
            `event.stopPropagation(); moveOtherProduction(${i}, ${i-1})`,
            `event.stopPropagation(); moveOtherProduction(${i}, ${i+1})`
          )}
          <span class="card-num">${String(i+1).padStart(2,'0')}</span>
          <span class="card-name">${f.title || '(sem título)'}</span>
          <span class="card-meta">${f.year||''} · ${f.genre||''}</span>
        </div>
        <span class="card-chevron">▼</span>
      </div>
      <div class="card-body">
        <div class="fields-grid">
          <div class="field"><label>Título PT</label><input data-other="${i}" data-key="title" value="${esc(f.title)}"></div>
          <div class="field"><label>Título EN</label><input data-other="${i}" data-key="titleEn" value="${esc(f.titleEn)}"></div>
          <div class="field"><label>Diretor</label><input data-other="${i}" data-key="director" value="${esc(f.director)}"></div>
          <div class="field"><label>Ano</label><input data-other="${i}" data-key="year" value="${esc(f.year)}"></div>
          <div class="field full"><label>Gênero</label><input data-other="${i}" data-key="genre" value="${esc(f.genre)}"></div>
          <div class="field full"><label>Sinopse PT</label><textarea data-other="${i}" data-key="synopsis">${esc(f.synopsis)}</textarea></div>
          <div class="field full"><label>Sinopse EN</label><textarea data-other="${i}" data-key="synopsisEn">${esc(f.synopsisEn)}</textarea></div>
          ${imgField('other', i, 'imgPortrait', 'Imagem retrato', f.imgPortrait)}
        </div>
        <div class="card-actions">
          <button class="btn btn-danger btn-small" onclick="removeOtherProduction(${i})">Remover</button>
          <button class="btn btn-primary btn-small" onclick="saveCard('other',${i})">Salvar</button>
        </div>
      </div>
    </div>`).join('');
}

function moveOtherProduction(fromIdx, toIdx) {
  moveItem(data.otherProductions, fromIdx, toIdx, renderOtherProductions);
}

function addOtherProduction() {
  if (!data.otherProductions) data.otherProductions = [];
  data.otherProductions.push({ title:'', titleEn:'', director:'', year:'', genre:'',
    synopsis:'', synopsisEn:'', imgPortrait:'' });
  renderOtherProductions();
  const idx = data.otherProductions.length - 1;
  toggleCard(`other-card-${idx}`);
  document.getElementById(`other-card-${idx}`).scrollIntoView({ behavior:'smooth' });
}

function removeOtherProduction(i) {
  if (!confirm(`Remover "${data.otherProductions[i].title || 'esta produção'}"?`)) return;
  data.otherProductions.splice(i, 1);
  renderOtherProductions();
}

/* ══════════════════════════════════════════════════════════
   UPCOMING
══════════════════════════════════════════════════════════ */
function renderUpcoming() {
  const films = data.upcomingFilms || [];
  document.getElementById('upcomingCount').textContent = films.length;
  document.getElementById('upcomingPanelCount').textContent = films.length + ' projetos';
  document.getElementById('upcomingList').innerHTML = films.map((f, i) => `
    <div class="card" id="upcoming-card-${i}">
      <div class="card-header" onclick="toggleCard('upcoming-card-${i}')">
        <div class="card-header-left">
          ${reorderBtns(i, films.length,
            `event.stopPropagation(); moveUpcoming(${i}, ${i-1})`,
            `event.stopPropagation(); moveUpcoming(${i}, ${i+1})`
          )}
          <span class="card-num">${String(i+1).padStart(2,'0')}</span>
          <span class="card-name">${f.title||'(sem título)'}</span>
          <span class="status-chip status-${f.status}">${f.status||''}</span>
        </div>
        <span class="card-chevron">▼</span>
      </div>
      <div class="card-body">
        <div class="fields-grid">
          <div class="field"><label>Título PT</label><input data-upcoming="${i}" data-key="title" value="${esc(f.title)}"></div>
          <div class="field"><label>Título EN</label><input data-upcoming="${i}" data-key="titleEn" value="${esc(f.titleEn)}"></div>
          <div class="field"><label>Diretor</label><input data-upcoming="${i}" data-key="director" value="${esc(f.director)}"></div>
          <div class="field"><label>Ano previsto</label><input data-upcoming="${i}" data-key="year" value="${esc(f.year)}"></div>
          <div class="field"><label>Gênero PT</label><input data-upcoming="${i}" data-key="genre" value="${esc(f.genre)}"></div>
          <div class="field"><label>Gênero EN</label><input data-upcoming="${i}" data-key="genreEn" value="${esc(f.genreEn)}"></div>
          <div class="field"><label>Status</label>
            <select data-upcoming="${i}" data-key="status">
              <option value="filming" ${f.status==='filming'?'selected':''}>Filmando</option>
              <option value="dev"     ${f.status==='dev'?'selected':''}>Desenvolvimento</option>
              <option value="post"    ${f.status==='post'?'selected':''}>Pós-produção</option>
            </select>
          </div>
          <div class="field full"><label>Sinopse PT</label><textarea data-upcoming="${i}" data-key="synopsis">${esc(f.synopsis)}</textarea></div>
          <div class="field full"><label>Sinopse EN</label><textarea data-upcoming="${i}" data-key="synopsisEn">${esc(f.synopsisEn)}</textarea></div>
          ${imgField('upcoming', i, 'imgPortrait',  'Imagem retrato',  f.imgPortrait)}
          ${imgField('upcoming', i, 'imgLandscape', 'Imagem paisagem', f.imgLandscape)}
        </div>
        <div class="card-actions">
          <button class="btn btn-danger btn-small" onclick="removeUpcoming(${i})">Remover</button>
          <button class="btn btn-primary btn-small" onclick="saveCard('upcoming',${i})">Salvar</button>
        </div>
      </div>
    </div>`).join('');
}

function moveUpcoming(fromIdx, toIdx) {
  moveItem(data.upcomingFilms, fromIdx, toIdx, renderUpcoming);
}

function addUpcoming() {
  data.upcomingFilms.push({ title:'', titleEn:'', director:'', status:'dev',
    genre:'', genreEn:'', year:'', synopsis:'', synopsisEn:'', imgPortrait:'', imgLandscape:'' });
  renderUpcoming();
  toggleCard(`upcoming-card-${data.upcomingFilms.length - 1}`);
}

function removeUpcoming(i) {
  if (!confirm(`Remover "${data.upcomingFilms[i].title || 'este projeto'}"?`)) return;
  data.upcomingFilms.splice(i, 1);
  renderUpcoming();
}

/* ══════════════════════════════════════════════════════════
   MANIFESTO
══════════════════════════════════════════════════════════ */
function renderPagHistoria() {
  const m = data.historiaData.manifesto;
  const h = (data.pagesData && data.pagesData.historia) || {};
  document.getElementById('pagHistoriaForm').innerHTML = `
    <div class="panel-header" style="margin-top:0"><span class="panel-title" style="font-size:14px">Cabeçalho da página</span></div>
    <div class="fields-grid">
      <div class="field"><label>Eyebrow PT</label><input id="m-eyebrow"   value="${esc(m.eyebrow)}"></div>
      <div class="field"><label>Eyebrow EN</label><input id="m-eyebrowEn" value="${esc(m.eyebrowEn)}"></div>
      <div class="field"><label>Título linha 1 PT</label><input id="m-title1"   value="${esc(m.title1)}"></div>
      <div class="field"><label>Título linha 1 EN</label><input id="m-title1En" value="${esc(m.title1En)}"></div>
      <div class="field"><label>Título linha 2 PT</label><input id="m-title2"   value="${esc(m.title2)}"></div>
      <div class="field"><label>Título linha 2 EN</label><input id="m-title2En" value="${esc(m.title2En)}"></div>
      <div class="field full"><label>Parágrafo 1 PT</label><textarea id="m-p1">${esc(m.p1)}</textarea></div>
      <div class="field full"><label>Parágrafo 1 EN</label><textarea id="m-p1En">${esc(m.p1En)}</textarea></div>
      <div class="field full"><label>Parágrafo 2 PT</label><textarea id="m-p2">${esc(m.p2)}</textarea></div>
      <div class="field full"><label>Parágrafo 2 EN</label><textarea id="m-p2En">${esc(m.p2En)}</textarea></div>
    </div>
    <div class="panel-header" style="margin-top:2rem"><span class="panel-title" style="font-size:14px">Eyebrows das seções</span></div>
    <div class="fields-grid">
      <div class="field"><label>Equipe PT</label><input id="h-teamEyebrowPt"      value="${esc(h.teamEyebrowPt||'')}"></div>
      <div class="field"><label>Equipe EN</label><input id="h-teamEyebrowEn"      value="${esc(h.teamEyebrowEn||'')}"></div>
      <div class="field"><label>Festivais PT</label><input id="h-festivaisEyebrowPt" value="${esc(h.festivaisEyebrowPt||'')}"></div>
      <div class="field"><label>Festivais EN</label><input id="h-festivaisEyebrowEn" value="${esc(h.festivaisEyebrowEn||'')}"></div>
      <div class="field"><label>Marcos PT</label><input id="h-marcosEyebrowPt"    value="${esc(h.marcosEyebrowPt||'')}"></div>
      <div class="field"><label>Marcos EN</label><input id="h-marcosEyebrowEn"    value="${esc(h.marcosEyebrowEn||'')}"></div>
      <div class="field"><label>Parceiros PT</label><input id="h-parceirosEyebrowPt" value="${esc(h.parceirosEyebrowPt||'')}"></div>
      <div class="field"><label>Parceiros EN</label><input id="h-parceirosEyebrowEn" value="${esc(h.parceirosEyebrowEn||'')}"></div>
    </div>`;
}

function renderPagPrincipal() {
  const m = data.historiaData.manifesto;
  const ix = (data.pagesData && data.pagesData.index) || {};
  document.getElementById('pagPrincipalForm').innerHTML = `
    <div class="panel-header" style="margin-top:0"><span class="panel-title" style="font-size:14px">Bloco de identidade</span></div>
    <div class="fields-grid">
      <div class="field full"><label>Frase principal PT</label><input id="m-identityStatement"   value="${esc(m.identityStatement)}"></div>
      <div class="field full"><label>Frase principal EN</label><input id="m-identityStatementEn" value="${esc(m.identityStatementEn)}"></div>
      <div class="field"><label>Subtítulo PT</label><input id="m-manifestoSub"   value="${esc(m.manifestoSub)}"></div>
      <div class="field"><label>Subtítulo EN</label><input id="m-manifestoSubEn" value="${esc(m.manifestoSubEn)}"></div>
    </div>
    <div class="panel-header" style="margin-top:2rem"><span class="panel-title" style="font-size:14px">Hero</span></div>
    <div class="fields-grid">
      <div class="field"><label>Label PT</label><input id="ix-heroLabelPt" value="${esc(ix.heroLabelPt||'')}"></div>
      <div class="field"><label>Label EN</label><input id="ix-heroLabelEn" value="${esc(ix.heroLabelEn||'')}"></div>
    </div>
    <div class="panel-header" style="margin-top:2rem"><span class="panel-title" style="font-size:14px">Grid de produções recentes</span></div>
    <div class="fields-grid">
      <div class="field"><label>Título PT</label><input id="ix-gridTitlePt" value="${esc(ix.gridTitlePt||'')}"></div>
      <div class="field"><label>Título EN</label><input id="ix-gridTitleEn" value="${esc(ix.gridTitleEn||'')}"></div>
    </div>
    <div class="panel-header" style="margin-top:2rem"><span class="panel-title" style="font-size:14px">Bloco CTA (fale conosco)</span></div>
    <div class="fields-grid">
      <div class="field full"><label>Título PT</label><input id="ix-ctaTitlePt" value="${esc(ix.ctaTitlePt||'')}"></div>
      <div class="field full"><label>Título EN</label><input id="ix-ctaTitleEn" value="${esc(ix.ctaTitleEn||'')}"></div>
      <div class="field full"><label>Corpo PT</label><textarea id="ix-ctaBodyPt">${esc(ix.ctaBodyPt||'')}</textarea></div>
      <div class="field full"><label>Corpo EN</label><textarea id="ix-ctaBodyEn">${esc(ix.ctaBodyEn||'')}</textarea></div>
    </div>`;
}

function renderPagProducoes() {
  const p = (data.pagesData && data.pagesData.producoes) || {};
  document.getElementById('pagProducoesForm').innerHTML = `
    <div class="fields-grid">
      <div class="field"><label>Título PT</label><input id="pp-titlePt" value="${esc(p.titlePt||'')}"></div>
      <div class="field"><label>Título EN</label><input id="pp-titleEn" value="${esc(p.titleEn||'')}"></div>
    </div>`;
}

function renderPagContato() {
  const c = (data.pagesData && data.pagesData.contato) || {};
  document.getElementById('pagContatoForm').innerHTML = `
    <div class="fields-grid">
      <div class="field"><label>Eyebrow PT</label><input id="pc-eyebrowPt" value="${esc(c.eyebrowPt||'')}"></div>
      <div class="field"><label>Eyebrow EN</label><input id="pc-eyebrowEn" value="${esc(c.eyebrowEn||'')}"></div>
      <div class="field"><label>Título PT</label><input id="pc-titlePt" value="${esc(c.titlePt||'')}"></div>
      <div class="field"><label>Título EN</label><input id="pc-titleEn" value="${esc(c.titleEn||'')}"></div>
      <div class="field full"><label>Subtítulo PT</label><textarea id="pc-subPt">${esc(c.subPt||'')}</textarea></div>
      <div class="field full"><label>Subtítulo EN</label><textarea id="pc-subEn">${esc(c.subEn||'')}</textarea></div>
      <div class="field full"><label>WhatsApp (só o número, ex: 5521988902499)</label><input id="pc-whatsapp" value="${esc(c.whatsapp||'')}"></div>
    </div>`;
}

function renderPagVemai() {
  const v = (data.pagesData && data.pagesData.vemai) || {};
  document.getElementById('pagVemaiForm').innerHTML = `
    <div class="fields-grid">
      <div class="field"><label>Eyebrow PT</label><input id="pv-eyebrowPt" value="${esc(v.eyebrowPt||'')}"></div>
      <div class="field"><label>Eyebrow EN</label><input id="pv-eyebrowEn" value="${esc(v.eyebrowEn||'')}"></div>
      <div class="field"><label>Título PT</label><input id="pv-titlePt" value="${esc(v.titlePt||'')}"></div>
      <div class="field"><label>Título EN</label><input id="pv-titleEn" value="${esc(v.titleEn||'')}"></div>
      <div class="field full"><label>Frase PT <span class="field-note">aceita HTML — ex: Ele &lt;em&gt;acontece&lt;/em&gt;</span></label><textarea id="pv-statementPt">${esc(v.statementPt||'')}</textarea></div>
      <div class="field full"><label>Frase EN <span class="field-note">aceita HTML</span></label><textarea id="pv-statementEn">${esc(v.statementEn||'')}</textarea></div>
      <div class="field full"><label>Subtítulo PT</label><textarea id="pv-subPt">${esc(v.subPt||'')}</textarea></div>
      <div class="field full"><label>Subtítulo EN</label><textarea id="pv-subEn">${esc(v.subEn||'')}</textarea></div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════
   FESTIVAIS
══════════════════════════════════════════════════════════ */
function renderFestivais() {
  const items = data.historiaData.festivais || [];
  document.getElementById('festivalPanelCount').textContent = items.length + ' festivais';
  document.getElementById('festivaisList').innerHTML = items.map((f, i) => `
    <div class="card" id="festival-card-${i}">
      <div class="card-header" onclick="toggleCard('festival-card-${i}')">
        <div class="card-header-left">
          ${reorderBtns(i, items.length,
            `event.stopPropagation(); moveFestival(${i}, ${i-1})`,
            `event.stopPropagation(); moveFestival(${i}, ${i+1})`
          )}
          <span class="card-num">${String(i+1).padStart(2,'0')}</span>
          <span class="card-name">${f.name || '(sem nome)'}</span>
          <span class="card-meta">${f.year || ''}</span>
        </div>
        <span class="card-chevron">▼</span>
      </div>
      <div class="card-body">
        <div class="fields-grid">
          <div class="field"><label>Nome</label><input data-festival="${i}" data-key="name" value="${esc(f.name)}"></div>
          <div class="field"><label>Ano</label><input data-festival="${i}" data-key="year" value="${esc(f.year)}"></div>
          ${imgField('festival', i, 'logo', 'Logo', f.logo)}
        </div>
        <div class="card-actions">
          <button class="btn btn-danger btn-small" onclick="removeFestival(${i})">Remover</button>
          <button class="btn btn-primary btn-small" onclick="saveCard('festival',${i})">Salvar</button>
        </div>
      </div>
    </div>`).join('');
}

function moveFestival(fromIdx, toIdx) {
  moveItem(data.historiaData.festivais, fromIdx, toIdx, renderFestivais);
}

function addFestival() {
  if (!data.historiaData.festivais) data.historiaData.festivais = [];
  data.historiaData.festivais.push({ name: '', year: '', logo: '' });
  renderFestivais();
  const idx = data.historiaData.festivais.length - 1;
  toggleCard(`festival-card-${idx}`);
  document.getElementById(`festival-card-${idx}`).scrollIntoView({ behavior: 'smooth' });
}

function removeFestival(i) {
  if (!confirm(`Remover "${data.historiaData.festivais[i].name || 'este festival'}"?`)) return;
  data.historiaData.festivais.splice(i, 1);
  renderFestivais();
}

/* ══════════════════════════════════════════════════════════
   MARCOS
══════════════════════════════════════════════════════════ */
function renderMarcos() {
  const marcos = data.historiaData.marcos || [];
  document.getElementById('marcosList').innerHTML = marcos.map((m, i) => `
    <div class="card" id="marco-card-${i}">
      <div class="card-header" onclick="toggleCard('marco-card-${i}')">
        <div class="card-header-left">
          ${reorderBtns(i, marcos.length,
            `event.stopPropagation(); moveMarco(${i}, ${i-1})`,
            `event.stopPropagation(); moveMarco(${i}, ${i+1})`
          )}
          <span class="card-num">${m.year||'----'}</span>
          <span class="card-name">${m.title||'(sem título)'}</span>
        </div>
        <span class="card-chevron">▼</span>
      </div>
      <div class="card-body">
        <div class="fields-grid">
          <div class="field"><label>Ano</label><input data-marco="${i}" data-key="year" value="${esc(m.year)}"></div>
          <div class="field"></div>
          <div class="field"><label>Título PT</label><input data-marco="${i}" data-key="title"   value="${esc(m.title)}"></div>
          <div class="field"><label>Título EN</label><input data-marco="${i}" data-key="titleEn" value="${esc(m.titleEn)}"></div>
          <div class="field full"><label>Texto PT (aceita &lt;em&gt;)</label><textarea data-marco="${i}" data-key="text">${esc(m.text)}</textarea></div>
          <div class="field full"><label>Texto EN (aceita &lt;em&gt;)</label><textarea data-marco="${i}" data-key="textEn">${esc(m.textEn)}</textarea></div>
        </div>
        <div class="card-actions">
          <button class="btn btn-danger btn-small" onclick="removeMarco(${i})">Remover</button>
          <button class="btn btn-primary btn-small" onclick="saveCard('marco',${i})">Salvar</button>
        </div>
      </div>
    </div>`).join('');
}

function moveMarco(fromIdx, toIdx) {
  moveItem(data.historiaData.marcos, fromIdx, toIdx, renderMarcos);
}

function addMarco() {
  data.historiaData.marcos.push({ year:'', title:'', titleEn:'', text:'', textEn:'' });
  renderMarcos();
  toggleCard(`marco-card-${data.historiaData.marcos.length - 1}`);
}

function removeMarco(i) {
  if (!confirm('Remover este marco?')) return;
  data.historiaData.marcos.splice(i, 1);
  renderMarcos();
}

/* ══════════════════════════════════════════════════════════
   TEAM
══════════════════════════════════════════════════════════ */
function renderTeam() {
  const team = data.historiaData.team || [];
  document.getElementById('teamList').innerHTML = team.map((m, i) => `
    <div class="card" id="team-card-${i}">
      <div class="card-header" onclick="toggleCard('team-card-${i}')">
        <div class="card-header-left">
          ${reorderBtns(i, team.length,
            `event.stopPropagation(); moveTeam(${i}, ${i-1})`,
            `event.stopPropagation(); moveTeam(${i}, ${i+1})`
          )}
          <span class="card-num">${String(i+1).padStart(2,'0')}</span>
          <span class="card-name">${m.name||'(sem nome)'}</span>
          <span class="card-meta">${m.role||''}</span>
        </div>
        <span class="card-chevron">▼</span>
      </div>
      <div class="card-body">
        <div class="fields-grid">
          <div class="field"><label>Nome</label><input data-team="${i}" data-key="name"   value="${esc(m.name)}"></div>
          <div class="field"></div>
          <div class="field"><label>Cargo PT</label><input data-team="${i}" data-key="role"   value="${esc(m.role)}"></div>
          <div class="field"><label>Cargo EN</label><input data-team="${i}" data-key="roleEn" value="${esc(m.roleEn)}"></div>
          ${imgField('team', i, 'img', 'Foto', m.img)}
          <div class="field full"><label>Bio PT (aceita &lt;em&gt;)</label><textarea data-team="${i}" data-key="bio">${esc(m.bio)}</textarea></div>
          <div class="field full"><label>Bio EN (aceita &lt;em&gt;)</label><textarea data-team="${i}" data-key="bioEn">${esc(m.bioEn)}</textarea></div>
        </div>
        <div class="card-actions">
          <button class="btn btn-danger btn-small" onclick="removeTeamMember(${i})">Remover</button>
          <button class="btn btn-primary btn-small" onclick="saveCard('team',${i})">Salvar</button>
        </div>
      </div>
    </div>`).join('');
}

function moveTeam(fromIdx, toIdx) {
  moveItem(data.historiaData.team, fromIdx, toIdx, renderTeam);
}

function addTeamMember() {
  data.historiaData.team.push({ name:'', role:'', roleEn:'', img:'', bio:'', bioEn:'' });
  renderTeam();
  toggleCard(`team-card-${data.historiaData.team.length - 1}`);
}

function removeTeamMember(i) {
  if (!confirm('Remover este membro?')) return;
  data.historiaData.team.splice(i, 1);
  renderTeam();
}


/* ══════════════════════════════════════════════════════════
   PARCEIROS
══════════════════════════════════════════════════════════ */
function renderParceiros() {
  // Normaliza strings legadas para objetos
  data.historiaData.parceiros = (data.historiaData.parceiros || []).map(p =>
    typeof p === 'string' ? { name: p, logo: '' } : p
  );
  const parceiros = data.historiaData.parceiros;
  document.getElementById('parceirosForm').innerHTML =
    parceiros.map((p, i) => `
      <div class="card" id="parceiro-card-${i}">
        <div class="card-header" onclick="toggleCard('parceiro-card-${i}')">
          <div class="card-header-left">
            ${reorderBtns(i, parceiros.length,
              `event.stopPropagation(); moveParceiro(${i}, ${i-1})`,
              `event.stopPropagation(); moveParceiro(${i}, ${i+1})`
            )}
            <span class="card-num">${String(i+1).padStart(2,'0')}</span>
            <span class="card-name">${esc(p.name) || '(sem nome)'}</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <button class="btn btn-danger btn-small" onclick="event.stopPropagation();removeParceiro(${i})">Remover</button>
            <span class="card-chevron">▼</span>
          </div>
        </div>
        <div class="card-body">
          <div class="fields-grid">
            <div class="field full"><label>Nome</label><input data-parceiro="${i}" data-key="name" value="${esc(p.name)}"></div>
            ${imgField('parceiro', i, 'logo', 'Logo', p.logo)}
          </div>
        </div>
      </div>`).join('') +
    `<button class="add-btn" onclick="addParceiro()">+ adicionar parceiro</button>`;
}

function addParceiro() {
  if (!data.historiaData.parceiros) data.historiaData.parceiros = [];
  data.historiaData.parceiros.push({ name: '', logo: '' });
  renderParceiros();
  const idx = data.historiaData.parceiros.length - 1;
  toggleCard(`parceiro-card-${idx}`);
  document.getElementById(`parceiro-card-${idx}`).scrollIntoView({ behavior: 'smooth' });
}

function moveParceiro(fromIdx, toIdx) {
  moveItem(data.historiaData.parceiros, fromIdx, toIdx, renderParceiros);
}

function removeParceiro(i) {
  data.historiaData.parceiros.splice(i, 1);
  renderParceiros();
}

/* ══════════════════════════════════════════════════════════
   TAGS
══════════════════════════════════════════════════════════ */
function renderTags(tags, type, idx) {
  return (tags||[]).map((t, ti) => `
    <span class="tag-badge">${esc(t)}
      <button onclick="removeTag('${type}',${idx},${ti})">×</button>
    </span>`).join('');
}

function addTag(type, idx) {
  const input = document.getElementById(`tagInput-${type}-${idx}`);
  const val = input.value.trim();
  if (!val) return;
  if (type === 'film') {
    data.films[idx].tags = data.films[idx].tags || [];
    data.films[idx].tags.push(val);
    document.getElementById(`tags-film-${idx}`).innerHTML = renderTags(data.films[idx].tags, 'film', idx);
  }
  input.value = '';
}

function removeTag(type, idx, ti) {
  if (type === 'film') {
    data.films[idx].tags.splice(ti, 1);
    document.getElementById(`tags-film-${idx}`).innerHTML = renderTags(data.films[idx].tags, 'film', idx);
  }
}

/* ══════════════════════════════════════════════════════════
   COLLECT ALL
══════════════════════════════════════════════════════════ */
function collectAll() {
  document.querySelectorAll('[data-film]').forEach(el => {
    const i = +el.dataset.film, key = el.dataset.key;
    if (!data.films[i]) return;
    data.films[i][key] = el.type === 'checkbox' ? el.checked : el.value;
  });
  document.querySelectorAll('[data-other]').forEach(el => {
    const i = +el.dataset.other, key = el.dataset.key;
    if (!data.otherProductions || !data.otherProductions[i]) return;
    data.otherProductions[i][key] = el.value;
  });
  document.querySelectorAll('[data-upcoming]').forEach(el => {
    const i = +el.dataset.upcoming, key = el.dataset.key;
    if (!data.upcomingFilms[i]) return;
    data.upcomingFilms[i][key] = el.value;
  });
  ['eyebrow','eyebrowEn','title1','title1En','title2','title2En','p1','p1En','p2','p2En',
   'identityStatement','identityStatementEn','manifestoSub','manifestoSubEn']
    .forEach(f => {
      const el = document.getElementById('m-' + f);
      if (el) data.historiaData.manifesto[f] = el.value;
    });
  if (!data.pagesData) data.pagesData = {};
  if (!data.pagesData) data.pagesData = {};
  if (!data.pagesData.producoes) data.pagesData.producoes = {};
  ['titlePt','titleEn'].forEach(f => {
    const el = document.getElementById('pp-' + f);
    if (el) data.pagesData.producoes[f] = el.value;
  });
  if (!data.pagesData.contato) data.pagesData.contato = {};
  ['eyebrowPt','eyebrowEn','titlePt','titleEn','subPt','subEn','whatsapp'].forEach(f => {
    const el = document.getElementById('pc-' + f);
    if (el) data.pagesData.contato[f] = el.value;
  });
  if (!data.pagesData.vemai) data.pagesData.vemai = {};
  ['eyebrowPt','eyebrowEn','titlePt','titleEn','statementPt','statementEn','subPt','subEn'].forEach(f => {
    const el = document.getElementById('pv-' + f);
    if (el) data.pagesData.vemai[f] = el.value;
  });
  if (!data.pagesData.index) data.pagesData.index = {};
  ['ctaTitlePt','ctaTitleEn','ctaBodyPt','ctaBodyEn','heroLabelPt','heroLabelEn','gridTitlePt','gridTitleEn'].forEach(f => {
    const el = document.getElementById('ix-' + f);
    if (el) data.pagesData.index[f] = el.value;
  });
  if (!data.pagesData.historia) data.pagesData.historia = {};
  ['teamEyebrowPt','teamEyebrowEn','festivaisEyebrowPt','festivaisEyebrowEn',
   'marcosEyebrowPt','marcosEyebrowEn','parceirosEyebrowPt','parceirosEyebrowEn'].forEach(f => {
    const el = document.getElementById('h-' + f);
    if (el) data.pagesData.historia[f] = el.value;
  });
  document.querySelectorAll('[data-marco]').forEach(el => {
    const i = +el.dataset.marco, key = el.dataset.key;
    if (!data.historiaData.marcos[i]) return;
    data.historiaData.marcos[i][key] = el.value;
  });
  document.querySelectorAll('[data-team]').forEach(el => {
    const i = +el.dataset.team, key = el.dataset.key;
    if (!data.historiaData.team[i]) return;
    data.historiaData.team[i][key] = el.value;
  });
  document.querySelectorAll('[data-parceiro]').forEach(el => {
    const i = +el.dataset.parceiro, key = el.dataset.key;
    if (!data.historiaData.parceiros[i]) return;
    data.historiaData.parceiros[i][key] = el.value;
  });
  document.querySelectorAll('[data-festival]').forEach(el => {
    const i = +el.dataset.festival, key = el.dataset.key;
    if (!data.historiaData.festivais[i]) return;
    data.historiaData.festivais[i][key] = el.value;
  });
}

/* ══════════════════════════════════════════════════════════
   IMAGE UPLOAD
══════════════════════════════════════════════════════════ */

/* Gera o HTML do campo de imagem — só upload, sem input de URL */
function imgField(dataAttr, idx, key, labelText, currentVal) {
  const fieldId   = `img-${dataAttr}-${idx}-${key}`;
  const previewId = `prev-${dataAttr}-${idx}-${key}`;
  const btnText   = currentVal ? '↑ substituir' : '↑ enviar';
  return `
    <div class="field full">
      <label>${labelText}</label>
      <input type="hidden" id="${fieldId}" data-${dataAttr}="${idx}" data-key="${key}" value="${esc(currentVal)}">
      <div class="img-field-row">
        <img id="${previewId}" class="img-field-thumb"
             src="${esc(currentVal)}" style="${currentVal ? '' : 'display:none'}"
             onerror="this.style.display='none'">
        <div class="asset-btns">
          <label class="upload-label">
            <span class="upload-label-text">${btnText}</span>
            <input type="file" accept="image/*" onchange="uploadImage(this,'${fieldId}','${previewId}')">
          </label>
          ${currentVal ? `
          <a class="btn btn-small asset-btn-dl" href="${esc(currentVal)}" download target="_blank">↓ baixar</a>
          <button class="btn btn-danger btn-small" onclick="removeAsset('${fieldId}','${previewId}')">✕ remover</button>` : ''}
        </div>
      </div>
    </div>`;
}

/* Gera o HTML do campo de vídeo hover com botão de upload */
function videoField(dataAttr, idx, key, labelText, currentVal, note = '') {
  const fieldId   = `img-${dataAttr}-${idx}-${key}`;
  const previewId = `prev-${dataAttr}-${idx}-${key}`;
  const btnText   = currentVal ? '↑ substituir' : '↑ enviar';
  return `
    <div class="field full">
      <label>${labelText}${note ? `<span class="field-note">${note}</span>` : ''}</label>
      <input type="hidden" id="${fieldId}" data-${dataAttr}="${idx}" data-key="${key}" value="${esc(currentVal)}">
      <div class="img-field-row">
        <video id="${previewId}" class="img-field-thumb"
               src="${esc(currentVal)}" style="${currentVal ? '' : 'display:none'}" muted></video>
        <div class="asset-btns">
          <label class="upload-label">
            <span class="upload-label-text">${btnText}</span>
            <input type="file" accept="video/mp4,video/*" onchange="uploadImage(this,'${fieldId}','${previewId}')">
          </label>
          ${currentVal ? `
          <a class="btn btn-small asset-btn-dl" href="${esc(currentVal)}" download target="_blank">↓ baixar</a>
          <button class="btn btn-danger btn-small" onclick="removeAsset('${fieldId}','${previewId}')">✕ remover</button>` : ''}
        </div>
      </div>
    </div>`;
}

/* ── FOTOGRAFIAS — galeria de múltiplas imagens ── */
function fotografiasField(dataAttr, idx, currentImages) {
  const images = Array.isArray(currentImages) ? currentImages : [];
  return `
    <div class="field full">
      <label>Fotografias (imagens)</label>
      <div class="makingoff-gallery" id="fotografias-gallery-${dataAttr}-${idx}">
        ${renderFotografiasItems(dataAttr, idx, images)}
      </div>
      <label class="upload-label" style="margin-top:10px">
        <span class="upload-label-text">↑ adicionar imagem(ns)</span>
        <input type="file" accept="image/*" multiple onchange="uploadFotografias(this,'${dataAttr}',${idx})">
      </label>
    </div>`;
}

function renderFotografiasItems(dataAttr, idx, images) {
  if (!images.length) return '<p class="makingoff-empty">nenhuma imagem ainda</p>';
  return images.map((url, imgIdx) => `
    <div class="makingoff-item">
      <img src="${esc(url)}" class="makingoff-thumb" onerror="this.style.display='none'">
      <div class="asset-btns">
        <a class="btn btn-small asset-btn-dl" href="${esc(url)}" download target="_blank">↓ baixar</a>
        <button class="btn btn-danger btn-small" onclick="removeFotografia('${dataAttr}',${idx},${imgIdx})">✕</button>
      </div>
    </div>`).join('');
}

async function uploadFotografias(fileInput, dataAttr, idx) {
  const files = Array.from(fileInput.files);
  if (!files.length) return;

  const label = fileInput.closest('label');
  const span  = label.querySelector('.upload-label-text');
  label.style.pointerEvents = 'none';

  const source = dataAttr === 'film' ? data.films : data.upcomingFilms;
  if (!Array.isArray(source[idx].fotografias)) source[idx].fotografias = [];

  const rawBase = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
  const nameEl  = document.querySelector(`[data-${dataAttr}="${idx}"][data-key="title"]`)
               || document.querySelector(`[data-${dataAttr}="${idx}"][data-key="name"]`);
  const baseName = (nameEl && nameEl.value.trim())
    ? nameEl.value.trim().replace(/\s+/g, '_').replace(/[/\\?#%*:|"<>]/g, '').slice(0, 60)
    : 'fotografias';

  for (let n = 0; n < files.length; n++) {
    const file = files[n];
    span.textContent = `… (${n + 1}/${files.length})`;
    const ext     = file.name.split('.').pop().toLowerCase();
    const newPath = `assets/filmes/fotografias/${baseName}/${baseName}_foto_${Date.now()}_${n}.${ext}`;
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = e => res(e.target.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      await ghPutBinary(newPath, base64, `assets: upload ${newPath}`);
      source[idx].fotografias.push(`${rawBase}${newPath}`);
    } catch (err) {
      toast(`Erro no upload (${file.name}): ${err.message}`, 'err');
    }
  }

  const gallery = document.getElementById(`fotografias-gallery-${dataAttr}-${idx}`);
  if (gallery) gallery.innerHTML = renderFotografiasItems(dataAttr, idx, source[idx].fotografias);
  span.textContent = '↑ adicionar imagem(ns)';
  label.style.pointerEvents = '';
  fileInput.value = '';
  toast('Imagens enviadas!', 'ok');
}

async function removeFotografia(dataAttr, idx, imgIdx) {
  if (!confirm('Remover esta fotografia do GitHub?')) return;
  const source = dataAttr === 'film' ? data.films : data.upcomingFilms;
  const url    = source[idx].fotografias[imgIdx];
  const rawBase = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
  if (url && url.startsWith(rawBase)) {
    const path = url.replace(rawBase, '').split('?')[0];
    try {
      const file = await ghGet(path);
      await ghDelete(path, file.sha, `assets: remove ${path}`);
    } catch { /* arquivo já não existe */ }
  }
  source[idx].fotografias.splice(imgIdx, 1);
  const gallery = document.getElementById(`fotografias-gallery-${dataAttr}-${idx}`);
  if (gallery) gallery.innerHTML = renderFotografiasItems(dataAttr, idx, source[idx].fotografias);
  toast('Fotografia removida.', 'ok');
}

/* ── MAKING OFF — galeria de múltiplas imagens ── */
function makingOffField(dataAttr, idx, currentImages) {
  const images = Array.isArray(currentImages) ? currentImages : [];
  return `
    <div class="field full">
      <label>Making off (imagens)</label>
      <div class="makingoff-gallery" id="makingoff-gallery-${dataAttr}-${idx}">
        ${renderMakingOffItems(dataAttr, idx, images)}
      </div>
      <label class="upload-label" style="margin-top:10px">
        <span class="upload-label-text">↑ adicionar imagem(ns)</span>
        <input type="file" accept="image/*" multiple onchange="uploadMakingOffImages(this,'${dataAttr}',${idx})">
      </label>
    </div>`;
}

function renderMakingOffItems(dataAttr, idx, images) {
  if (!images.length) return '<p class="makingoff-empty">nenhuma imagem ainda</p>';
  return images.map((url, imgIdx) => `
    <div class="makingoff-item">
      <img src="${esc(url)}" class="makingoff-thumb" onerror="this.style.display='none'">
      <div class="asset-btns">
        <a class="btn btn-small asset-btn-dl" href="${esc(url)}" download target="_blank">↓ baixar</a>
        <button class="btn btn-danger btn-small" onclick="removeMakingOffImage('${dataAttr}',${idx},${imgIdx})">✕</button>
      </div>
    </div>`).join('');
}

async function uploadMakingOffImages(fileInput, dataAttr, idx) {
  const files = Array.from(fileInput.files);
  if (!files.length) return;

  const label = fileInput.closest('label');
  const span  = label.querySelector('.upload-label-text');
  label.style.pointerEvents = 'none';

  const source = dataAttr === 'film' ? data.films : data.upcomingFilms;
  if (!Array.isArray(source[idx].makingOff)) source[idx].makingOff = [];

  const rawBase = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
  const nameEl  = document.querySelector(`[data-${dataAttr}="${idx}"][data-key="title"]`)
               || document.querySelector(`[data-${dataAttr}="${idx}"][data-key="name"]`);
  const baseName = (nameEl && nameEl.value.trim())
    ? nameEl.value.trim().replace(/\s+/g, '_').replace(/[/\\?#%*:|"<>]/g, '').slice(0, 60)
    : 'makingoff';

  for (let n = 0; n < files.length; n++) {
    const file = files[n];
    span.textContent = `… (${n + 1}/${files.length})`;
    const ext     = file.name.split('.').pop().toLowerCase();
    const newPath = `assets/filmes/makingoff/${baseName}/${baseName}_mo_${Date.now()}_${n}.${ext}`;
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = e => res(e.target.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      await ghPutBinary(newPath, base64, `assets: upload ${newPath}`);
      source[idx].makingOff.push(`${rawBase}${newPath}`);
    } catch (err) {
      toast(`Erro no upload (${file.name}): ${err.message}`, 'err');
    }
  }

  const gallery = document.getElementById(`makingoff-gallery-${dataAttr}-${idx}`);
  if (gallery) gallery.innerHTML = renderMakingOffItems(dataAttr, idx, source[idx].makingOff);
  span.textContent = '↑ adicionar imagem(ns)';
  label.style.pointerEvents = '';
  fileInput.value = '';
  toast('Imagens enviadas!', 'ok');
}

async function removeMakingOffImage(dataAttr, idx, imgIdx) {
  if (!confirm('Remover esta imagem do GitHub?')) return;
  const source = dataAttr === 'film' ? data.films : data.upcomingFilms;
  const url    = source[idx].makingOff[imgIdx];
  const rawBase = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
  if (url && url.startsWith(rawBase)) {
    const path = url.replace(rawBase, '').split('?')[0];
    try {
      const file = await ghGet(path);
      await ghDelete(path, file.sha, `assets: remove ${path}`);
    } catch { /* arquivo já não existe */ }
  }
  source[idx].makingOff.splice(imgIdx, 1);
  const gallery = document.getElementById(`makingoff-gallery-${dataAttr}-${idx}`);
  if (gallery) gallery.innerHTML = renderMakingOffItems(dataAttr, idx, source[idx].makingOff);
  toast('Imagem removida.', 'ok');
}

async function removeAsset(fieldId, previewId) {
  if (!confirm('Remover este arquivo do GitHub?')) return;
  const field = document.getElementById(fieldId);
  const url   = field.value;
  if (!url) return;
  const rawBase = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
  if (url.startsWith(rawBase)) {
    const path = url.replace(rawBase, '').split('?')[0];
    try {
      const file = await ghGet(path);
      await ghDelete(path, file.sha, `assets: remove ${path}`);
    } catch { /* arquivo já não existe */ }
  }
  field.value = '';
  field.dispatchEvent(new Event('input', { bubbles: true }));
  const thumb = document.getElementById(previewId);
  if (thumb) { thumb.src = ''; thumb.style.display = 'none'; }
  toast('Arquivo removido.', 'ok');
}

async function uploadImage(fileInput, targetFieldId, previewId) {
  const file = fileInput.files[0];
  if (!file) return;

  const label = fileInput.closest('label');
  const span  = label.querySelector('.upload-label-text');
  span.textContent = '…';
  label.style.pointerEvents = 'none';

  // Nome baseado no título/nome do item; espaços → "_"; sem nome → número aleatório
  const ext       = file.name.split('.').pop().toLowerCase();
  const parts     = targetFieldId.replace(/^img-/, '').split('-'); // ['film','0','imgPortrait']
  const dataAttr  = parts[0];
  const idx       = parts[1];
  const nameEl    = document.querySelector(`[data-${dataAttr}="${idx}"][data-key="title"]`)
                 || document.querySelector(`[data-${dataAttr}="${idx}"][data-key="name"]`);
  const titleRaw  = nameEl ? nameEl.value.trim() : '';
  const baseName  = titleRaw
    ? titleRaw.replace(/\s+/g, '_').replace(/[/\\?#%*:|"<>]/g, '').slice(0, 80)
    : Math.floor(Math.random() * 1e6).toString();
  const isPreview   = targetFieldId.includes('videoHover');
  const isTrailer   = targetFieldId.includes('videoTrailer');
  const isLandscape = targetFieldId.includes('imgLandscape');
  const keySuffix   = isLandscape ? '_l' : '_p';
  const folder      = dataAttr === 'team'                  ? 'assets/equipe'
                    : dataAttr === 'parceiro'               ? 'assets/parceiros'
                    : dataAttr === 'festival'               ? 'assets/festivais'
                    : isPreview                             ? 'assets/filmes/previews'
                    : isTrailer                             ? 'assets/filmes/trailers'
                    : isLandscape && dataAttr === 'film'    ? 'assets/filmes/paisagens'
                    : dataAttr === 'film'                   ? 'assets/filmes/retratos'
                    : 'assets/filmes';
  const newPath   = `${folder}/${baseName}${keySuffix}.${ext}`;

  // Deleta arquivo anterior do mesmo slot (mesmo que tenha extensão diferente)
  const field      = document.getElementById(targetFieldId);
  const currentUrl = field.value;
  const rawBase    = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
  if (currentUrl && currentUrl.startsWith(rawBase)) {
    const oldPath = currentUrl.replace(rawBase, '').split('?')[0];
    try {
      const oldFile = await ghGet(oldPath);
      await ghDelete(oldPath, oldFile.sha, `assets: remove ${oldPath}`);
    } catch { /* arquivo anterior não encontrado — segue */ }
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    try {
      await ghPutBinary(newPath, base64, `assets: upload ${newPath}`);
      const url   = `${rawBase}${newPath}`;
      field.value = url;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      const thumb = document.getElementById(previewId);
      if (thumb) {
        thumb.src = url;
        if (thumb.tagName === 'VIDEO') thumb.load();
        thumb.style.display = 'block';
      }
      span.textContent = '↑ substituir';
      toast('Imagem enviada!', 'ok');
    } catch (err) {
      toast('Erro no upload: ' + err.message, 'err');
    } finally {
      label.style.pointerEvents = '';
      fileInput.value = '';
    }
  };
  reader.readAsDataURL(file);
}

/* ══════════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════════ */
function toggleCard(id) {
  const target = document.getElementById(id);
  const isOpen = target.classList.contains('open');
  document.querySelectorAll('.card.open').forEach(c => c.classList.remove('open'));
  if (!isOpen) target.classList.add('open');
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/"/g,'&quot;')
    .replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function setStatus(msg, type) {
  const el = document.getElementById('saveStatus');
  el.textContent = msg;
  el.className = 'save-status ' + (type||'');
}

function toast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + (type||'');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.className = '', 3500);
}