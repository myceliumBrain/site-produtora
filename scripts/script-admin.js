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
    // 1. Carrega o JSON publicamente (sem token)
    await loadData();

    // 2. Verifica se existe _auth configurado
    const tokens = data._auth?.tokens || [];
    if (tokens.length === 0) {
      // Nenhuma senha cadastrada ainda — mostra tela de setup
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('setupScreen').style.display = 'flex';
      btn.disabled = false;
      btn.innerHTML = 'Entrar →';
      return;
    }

    // 3. Tenta descriptografar com a senha digitada
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
    // Recarrega com o token para garantir SHA atualizado
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
}

/* ══════════════════════════════════════════════════════════
   RENDER ALL
══════════════════════════════════════════════════════════ */
function renderAll() {
  renderFilms();
  renderUpcoming();
  renderManifesto();
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
          <div class="field"><label>Proporção</label>
            <select data-film="${i}" data-key="ratio">
              <option value="p" ${f.ratio==='p'?'selected':''}>Retrato (p)</option>
              <option value="l" ${f.ratio==='l'?'selected':''}>Paisagem (l)</option>
            </select>
          </div>
          <div class="field"><label>Tamanho</label>
            <select data-film="${i}" data-key="size">
              <option value=""     ${!f.size?'selected':''}>Normal</option>
              <option value="wide" ${f.size==='wide'?'selected':''}>Wide</option>
            </select>
          </div>
          <div class="field" style="display:flex;align-items:center;padding-top:1.5rem;">
            <label class="checkbox-row">
              <input type="checkbox" data-film="${i}" data-key="hero" ${f.hero?'checked':''}>
              Aparece no hero
            </label>
          </div>
          <div class="field full"><label>Sinopse PT</label><textarea data-film="${i}" data-key="synopsis">${esc(f.synopsis)}</textarea></div>
          <div class="field full"><label>Sinopse EN</label><textarea data-film="${i}" data-key="synopsisEn">${esc(f.synopsisEn)}</textarea></div>
          <div class="field full"><label>Imagem retrato (URL)</label><input data-film="${i}" data-key="imgPortrait" value="${esc(f.imgPortrait)}"></div>
          <div class="field full"><label>Imagem paisagem (URL)</label><input data-film="${i}" data-key="imgLandscape" value="${esc(f.imgLandscape)}"></div>
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
        </div>
      </div>
    </div>`).join('');
}

function addFilm() {
  data.films.push({ title:'', titleEn:'', director:'', year:'', genre:'Drama',
    ratio:'p', size:'', hero:false, synopsis:'', synopsisEn:'', tags:[], imgPortrait:'', imgLandscape:'' });
  renderFilms();
  const idx = data.films.length - 1;
  toggleCard(`film-card-${idx}`);
  document.getElementById(`film-card-${idx}`).scrollIntoView({ behavior:'smooth' });
}

function removeFilm(i) {
  if (!confirm(`Remover "${data.films[i].title || 'este filme'}"?`)) return;
  data.films.splice(i, 1);
  renderFilms();
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
          <div class="field full"><label>Imagem retrato (URL)</label><input data-upcoming="${i}" data-key="imgPortrait" value="${esc(f.imgPortrait)}"></div>
          <div class="field full"><label>Imagem paisagem (URL)</label><input data-upcoming="${i}" data-key="imgLandscape" value="${esc(f.imgLandscape)}"></div>
        </div>
        <div class="card-actions">
          <button class="btn btn-danger btn-small" onclick="removeUpcoming(${i})">Remover</button>
        </div>
      </div>
    </div>`).join('');
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
function renderManifesto() {
  const m = data.historiaData.manifesto;
  document.getElementById('manifestoForm').innerHTML = `
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
    </div>`;
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
        </div>
      </div>
    </div>`).join('');
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
          <div class="field full">
            <label>Foto (URL)</label>
            <input data-team="${i}" data-key="img" value="${esc(m.img)}"
                   oninput="updateImgPreview(${i}, this.value)">
            <img id="team-img-${i}" src="${esc(m.img)}" class="team-img-preview"
                 style="${m.img?'':'display:none'}" onerror="this.style.display='none'">
          </div>
          <div class="field full"><label>Bio PT (aceita &lt;em&gt;)</label><textarea data-team="${i}" data-key="bio">${esc(m.bio)}</textarea></div>
          <div class="field full"><label>Bio EN (aceita &lt;em&gt;)</label><textarea data-team="${i}" data-key="bioEn">${esc(m.bioEn)}</textarea></div>
        </div>
        <div class="card-actions">
          <button class="btn btn-danger btn-small" onclick="removeTeamMember(${i})">Remover</button>
        </div>
      </div>
    </div>`).join('');
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

function updateImgPreview(i, url) {
  const img = document.getElementById(`team-img-${i}`);
  if (!img) return;
  img.src = url;
  img.style.display = url ? 'block' : 'none';
}

/* ══════════════════════════════════════════════════════════
   PARCEIROS
══════════════════════════════════════════════════════════ */
function renderParceiros() {
  const parceiros = data.historiaData.parceiros || [];
  document.getElementById('parceirosForm').innerHTML = `
    <div class="parceiros-list">
      ${parceiros.map((p, i) => `
        <span class="tag-badge">${esc(p)}
          <button onclick="removeParceiro(${i})" title="remover">×</button>
        </span>`).join('')}
    </div>
    <div class="add-parceiro-row">
      <div class="field">
        <label>Novo parceiro</label>
        <input id="parceiroInput" placeholder="nome do parceiro…"
               onkeydown="if(event.key==='Enter'){addParceiro();event.preventDefault()}">
      </div>
      <button class="btn btn-secondary" onclick="addParceiro()">+ adicionar</button>
    </div>`;
}

function addParceiro() {
  const val = document.getElementById('parceiroInput').value.trim();
  if (!val) return;
  data.historiaData.parceiros.push(val);
  renderParceiros();
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
  document.querySelectorAll('[data-upcoming]').forEach(el => {
    const i = +el.dataset.upcoming, key = el.dataset.key;
    if (!data.upcomingFilms[i]) return;
    data.upcomingFilms[i][key] = el.value;
  });
  ['eyebrow','eyebrowEn','title1','title1En','title2','title2En','p1','p1En','p2','p2En']
    .forEach(f => {
      const el = document.getElementById('m-' + f);
      if (el) data.historiaData.manifesto[f] = el.value;
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
}

/* ══════════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════════ */
function toggleCard(id) { document.getElementById(id).classList.toggle('open'); }

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