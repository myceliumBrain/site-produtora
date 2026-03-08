/* ============================================================
   script-shared.js
   Compartilhado entre todas as páginas do site 000 filmes
   Depende de: i18next (carregado antes no HTML)
   ============================================================ */

/* ── CURSOR CUSTOMIZADO (só existe no index.html) ── */
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');

if (cursor && cursorRing) {
  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  (function animRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
    requestAnimationFrame(animRing);
  })();
}


/* ── MENU TOGGLE ── */
const menuBtn     = document.getElementById('menuBtn');
const menuOverlay = document.getElementById('menuOverlay');
let menuOpen = false;

function openMenu() {
  menuOpen = true;
  menuOverlay.classList.add('open');
  menuBtn.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  menuOpen = false;
  menuOverlay.classList.remove('open');
  menuBtn.classList.remove('open');
  document.body.style.overflow = '';
}

menuBtn.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());

// Fecha o menu ao clicar fora dele
menuOverlay.addEventListener('click', e => {
  if (e.target === menuOverlay) closeMenu();
});

/* ── BANCO DE FILMES ──
   Fonte única de dados para todas as páginas.
   script-producoes.js usa o array completo.
   script-index.js usa os primeiros itens como preview.
   ── */
const films = [
  {
    title:        'Última Fronteira',
    titleEn:      'The Last Frontier',
    director:     'Ana Luiza Morais',
    year:         '2025',
    genre:        'Drama',
    ratio:        'p',
    size:         'wide',
    hero:         true,   // aparece no slideshow e no featured
    synopsis:     'Em um vilarejo isolado do sertão, uma mulher confronta o passado de sua família enquanto as fronteiras entre memória e esquecimento começam a se dissolver.',
    synopsisEn:   'In an isolated village in the sertão, a woman confronts her family\'s past as the boundaries between memory and forgetting begin to dissolve.',
    tags:         ['Drama', 'Sertão', '87 min'],
    imgPortrait:  'https://http.cat/images/100.jpg',
    imgLandscape: 'https://http.cat/images/101.jpg',
  },
  {
    title:        'Sombra Branca',
    titleEn:      'White Shadow',
    director:     'Felipe Drummond',
    year:         '2025',
    genre:        'Drama',
    ratio:        'p',
    size:         '',
    hero:         true,
    synopsis:     'Um fotógrafo retorna à cidade natal e descobre que as memórias que guardou nunca foram suas.',
    synopsisEn:   'A photographer returns to his hometown and discovers that the memories he kept were never his own.',
    tags:         ['Drama', 'Fotografia', '94 min'],
    imgPortrait:  'https://http.cat/images/102.jpg',
    imgLandscape: 'https://http.cat/images/103.jpg',
  },
  {
    title:        'Vento Cru',
    titleEn:      'Raw Wind',
    director:     'Carla Menezes',
    year:         '2024',
    genre:        'Documentário',
    ratio:        'p',
    size:         '',
    hero:         true,
    synopsis:     'Três gerações de agricultoras enfrentam a seca e a especulação imobiliária no Nordeste.',
    synopsisEn:   'Three generations of female farmers face drought and real estate speculation in the Brazilian Northeast.',
    tags:         ['Documentário', 'Nordeste', '76 min'],
    imgPortrait:  'https://http.cat/images/200.jpg',
    imgLandscape: 'https://http.cat/images/201.jpg',
  },
  {
    title:        'Mar de Dentro',
    titleEn:      'Inside Sea',
    director:     'Bruno Tavares',
    year:         '2024',
    genre:        'Drama',
    ratio:        'l',
    size:         '',
    imgPortrait:  'https://http.cat/images/202.jpg',
    imgLandscape: 'https://http.cat/images/203.jpg',
  },
  {
    title:        'O Peso do Nome',
    titleEn:      'The Weight of the Name',
    director:     'Renata Pires',
    year:         '2024',
    genre:        'Drama',
    ratio:        'p',
    size:         '',
    imgPortrait:  'https://http.cat/images/204.jpg',
    imgLandscape: 'https://http.cat/images/205.jpg',
  },
  {
    title:        'Noite Alta',
    titleEn:      'High Night',
    director:     'Lucas Fonseca',
    year:         '2024',
    genre:        'Thriller',
    ratio:        'l',
    size:         '',
    imgPortrait:  'https://http.cat/images/206.jpg',
    imgLandscape: 'https://http.cat/images/207.jpg',
  },
  {
    title:        'Cerrado',
    titleEn:      'Cerrado',
    director:     'Mariana Luz',
    year:         '2023',
    genre:        'Documentário',
    ratio:        'l',
    size:         '',
    imgPortrait:  'https://http.cat/images/208.jpg',
    imgLandscape: 'https://http.cat/images/214.jpg',
  },
  {
    title:        'Silêncio Fundo',
    titleEn:      'Deep Silence',
    director:     'Paulo Salave\'a',
    year:         '2023',
    genre:        'Drama',
    ratio:        'p',
    size:         '',
    imgPortrait:  'https://http.cat/images/415.jpg',
    imgLandscape: 'https://http.cat/images/416.jpg',
  },
  {
    title:        'Estrada Torta',
    titleEn:      'Pie Road',
    director:     'Isabela Cardoso',
    year:         '2023',
    genre:        'Comédia',
    ratio:        'p',
    size:         '',
    imgPortrait:  'https://http.cat/images/226.jpg',
    imgLandscape: 'https://http.cat/images/300.jpg',
  },
  {
    title:        'Terra sem Sombra',
    titleEn:      'Land without Shadow',
    director:     'Eduardo Braga',
    year:         '2022',
    genre:        'Drama',
    ratio:        'l',
    size:         'wide',
    imgPortrait:  'https://http.cat/images/301.jpg',
    imgLandscape: 'https://http.cat/images/302.jpg',
  },
  {
    title:        'Dobra',
    titleEn:      'Fold',
    director:     'Sofia Meireles',
    year:         '2022',
    genre:        'Drama',
    ratio:        'p',
    size:         '',
    imgPortrait:  'https://http.cat/images/303.jpg',
    imgLandscape: 'https://http.cat/images/304.jpg',
  },
  {
    title:        'Raiz Nua',
    titleEn:      'Bare Root',
    director:     'Thiago Monteiro',
    year:         '2022',
    genre:        'Drama',
    ratio:        'p',
    size:         '',
    imgPortrait:  'https://http.cat/images/305.jpg',
    imgLandscape: 'https://http.cat/images/307.jpg',
  },
  {
    title:        'Fogo Baixo',
    titleEn:      'Low Fire',
    director:     'Camila Reis',
    year:         '2021',
    genre:        'Drama',
    ratio:        'p',
    size:         '',
    imgPortrait:  'https://http.cat/images/308.jpg',
    imgLandscape: 'https://http.cat/images/400.jpg',
  },
  {
    title:        'Deriva',
    titleEn:      'Drift',
    director:     'André Castilho',
    year:         '2021',
    genre:        'Drama',
    ratio:        'p',
    size:         '',
    imgPortrait:  'https://http.cat/images/401.jpg',
    imgLandscape: 'https://http.cat/images/402.jpg',
  },
];

/* ── BANCO DE FILMES EM PRODUÇÃO ──
   Fonte única de dados para todas as páginas.
   Usado em: index.html (section-upcoming), vemai.html
   ── */
const upcomingFilms = [
  {
    title:       'Bruma',
    titleEn:     'Bruma',
    director:    'Carla Menezes',
    status:      'filming',        // 'filming' | 'dev' | 'post'
    genre:       'Ficção',
    genreEn:     'Fiction',
    year:        '2026',
    synopsis:    'Em uma cidade costeira encoberta por névoa permanente, dois irmãos redescobrem uma língua que acreditavam perdida. Um filme sobre memória, pertencimento e as palavras que nos sobrevivem.',
    synopsisEn:  'In a coastal city shrouded in permanent mist, two siblings rediscover a language they believed lost. A film about memory, belonging and the words that outlive us.',
    imgPortrait:  '',
    imgLandscape: '',
  },
  {
    title:       'O Intervalo',
    titleEn:     'The Interval',
    director:    'Renata Pires',
    status:      'dev',
    genre:       'Drama',
    genreEn:     'Drama',
    year:        '2027',
    synopsis:    'Entre o fim de um relacionamento e o começo de outro, existe um tempo que ninguém nomeia. O Intervalo vive exatamente ali — no espaço entre o que foi e o que ainda não é.',
    synopsisEn:  'Between the end of one relationship and the beginning of another, there is a time no one names. The Interval lives exactly there — in the space between what was and what is not yet.',
    imgPortrait:  '',
    imgLandscape: '',
  },
  {
    title:       'Corpo Fechado',
    titleEn:     'Corpo Fechado',
    director:    'Eduardo Braga',
    status:      'post',
    genre:       'Thriller',
    genreEn:     'Thriller',
    year:        '2025',
    synopsis:    'Um homem descobre que seu corpo guarda memórias que sua mente recusa. Thriller psicológico sobre identidade, trauma e os limites da carne.',
    synopsisEn:  'A man discovers his body holds memories his mind refuses. A psychological thriller about identity, trauma and the limits of flesh.',
    imgPortrait:  '',
    imgLandscape: '',
  },
];

/* ── BOTÃO DE IDIOMA ──
   Cada página define sua própria updateDOM().
   Este handler chama updateDOM() após a troca de idioma,
   então basta cada script-[página].js declarar essa função. ── */
document.getElementById('langBtn').addEventListener('click', () => {
  const next = i18next.language === 'pt' ? 'en' : 'pt';
  i18next.changeLanguage(next, () => {
    updateDOM(); // definida no script específico de cada página
    document.getElementById('langBtn').textContent = next === 'pt' ? 'EN' : 'PT';
  });
});

/*HIDE HEADER AFTER SCROLL*/

var lastScrollTop = 0;
var header = document.querySelector('header');

window.addEventListener('scroll', function() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > 50) {
        // Scrolling down and past a certain threshold (e.g., 50px)
        if (!header.classList.contains('header--hidden')) {
            header.classList.add('header--hidden');
        }
    } else {
        // Scrolling up
        if (header.classList.contains('header--hidden')) {
            header.classList.remove('header--hidden');
        }
    }
    lastScrollTop = scrollTop;
});