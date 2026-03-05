/* MENU TOGGLE */

const btn = document.getElementById('menuBtn');
const overlay = document.getElementById('menuOverlay');
let menuOpen = false;

function openMenu() {
  menuOpen = true;
  overlay.classList.add('open');
  btn.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  menuOpen = false;
  overlay.classList.remove('open');
  btn.classList.remove('open');
  document.body.style.overflow = '';
}

btn.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());

/* SWITCH BETWEEN BOTTONS (recentes / a-z) */

document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

/* FILMS DATABASE */

const films = [
    {
        title:        "A Última Fronteira",
        titleEn:      "The Last Frontier",
        director:     "Ana Luiza Morais",
        year:         "2025",
        ratio:        "p",       // "p" = portrait  |  "l" = landscape
        size:         "wide",    // "wide" = 2 colunas  |  "" = 1 coluna
        imgPortrait:  "https://http.cat/images/100.jpg",
        imgLandscape: "https://http.cat/images/101.jpg"
    },
    {
        title:        "Sombra Branca",
        titleEn:      "White Shadow",
        director:     "Felipe Drummond",
        year:         "2025",
        ratio:        "p",
        size:         "",
        imgPortrait:  "",
        imgLandscape: ""
    },
    {
        title:        "Vento Cru",
        titleEn:      "Raw Wind",
        director:     "Carla Menezes",
        year:         "2024",
        ratio:        "p",
        size:         "",
        imgPortrait:  "",
        imgLandscape: ""
    },
    {
        title:        "Mar de Dentro",
        titleEn:      "Inside Sea",
        director:     "Bruno Tavares",
        year:         "2024",
        ratio:        "l",
        size:         "",
        imgPortrait:  "",
        imgLandscape: ""
    },
    {
        title:        "O Peso do Nome",
        titleEn:      "The Weight of the Name",
        director:     "Renata Pires",
        year:         "2024",
        ratio:        "p",
        size:         "",
        imgPortrait:  "",
        imgLandscape: ""
    },
    {
        title:        "Noite Alta",
        titleEn:      "High Night",
        director:     "Lucas Fonseca",
        year:         "2024",
        ratio:        "l",
        size:         "",
        imgPortrait:  "",
        imgLandscape: ""
    },
    {
        title:        "Cerrado",
        titleEn:      "Cerrado",
        director:     "Mariana Luz",
        year:         "2023",
        ratio:        "l",
        size:         "",
        imgPortrait:  "",
        imgLandscape: ""
    },
    {
        title:        "Silêncio Fundo",
        titleEn:      "Deep Silence",
        director:     "Paulo Salave'a",
        year:         "2023",
        ratio:        "p",
        size:         "",
        imgPortrait:  "",
        imgLandscape: ""
    },
    {
        title:        "Estrada Torta",
        titleEn:      "Pie Road",
        director:     "Isabela Cardoso",
        year:         "2023",
        ratio:        "p",
        size:         "",
        imgPortrait:  "",
        imgLandscape: ""
    },
    {
        title:        "Terra sem Sombra",
        titleEn:      "Land without Shadow",
        director:     "Eduardo Braga",
        year:         "2022",
        ratio:        "l",
        size:         "wide",
        imgPortrait:  "",
        imgLandscape: ""
    },
    {
        title:        "Dobra",
        titleEn:      "Fold",
        director:     "Sofia Meireles",
        year:         "2022",
        ratio:        "p",
        size:         "",
        imgPortrait:  "",
        imgLandscape: ""
    },
    {
        title:        "Raiz Nua",
        titleEn:      "Bare Root",
        director:     "Thiago Monteiro",
        year:         "2022",
        ratio:        "p",
        size:         "",
        imgPortrait:  "",
        imgLandscape: ""
    },
    {
        title:        "Fogo Baixo",
        titleEn:      "Low Fire",
        director:     "Camila Reis",
        year:         "2021",
        ratio:        "p",
        size:         "",
        imgPortrait:  "",
        imgLandscape: ""
    },
    {
        title:        "Deriva",
        titleEn:      "Drift",
        director:     "André Castilho",
        year:         "2021",
        ratio:        "p",
        size:         "",
        imgPortrait:  "",
        imgLandscape: ""
    }
];

/* placeholder (img temporaria)*/

const placeholder = `
    <div class="film-card__placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white">
            <rect x="3" y="3" width="18" height="18" rx="1" stroke-width="0.8"/>
            <circle cx="8.5" cy="8.5" r="1.5" stroke-width="0.8"/>
            <path d="M21 15l-5-5L5 21" stroke-width="0.8"/>
        </svg>
    </div>`;

/* GRID */
function createCard(film) {
const wide = film.size === "wide" ? "card--wide" : "";

/* translate title in grid */
const title = i18next.language === 'en' && film.titleEn ? film.titleEn : film.title;

/* HTML insertion in grid */
    return `
        <div class="film-card ${wide} card--${film.ratio}">
            <div class="film-card__img">
                ${placeholder}
                <img class="img-portrait"
                     src="${film.imgPortrait}"
                     alt="${title}"
                     onerror="this.style.display='none'">
                <img class="img-landscape"
                     src="${film.imgLandscape}"
                     alt="${title}"
                     onerror="this.style.display='none'">
            </div>
            <div class="film-card__info">
                <span class="film-card__year">${film.year}</span>
                <div class="film-card__title">${title}</div>
                <div class="film-card__dir">Dir. ${film.director}</div>
            </div>
        </div>`;
}

document.querySelector('.films-grid').innerHTML = films.map(createCard).join('');

function renderGrid() {
        document.querySelector('.films-grid').innerHTML = films.map(createCard).join('');
}

function updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = i18next.t(el.getAttribute('data-i18n'));
    });
    renderGrid(); // re-renderiza os cards com o idioma atual
}

// i18next - TRANSLATION

i18next.init({
    lng: 'pt',
    resources: {
        pt: {
            translation: {
                'nav.portfolio':          'Portfólio',
                'nav.shop':               'Loja',
                'section.title':          'Produções',
                'sort.recent':            'Recentes',
                'sort.az':                'A–Z',
                'menu.productions':       'Produções',
                'menu.productions.count': '10+',
                'menu.upcoming':          'Vem aí',
                'menu.upcoming.count':    'Em produção',
                'menu.history':           'Nossa história',
                'menu.history.count':     'Sobre',
                'menu.contact':           'Contato',
                'menu.contact.count':     'fale com a gente',
                'footer.copy':            '© 2025 - 000 FILMES',
            }
        },
        en: {
            translation: {
                'nav.portfolio':          'Portfolio',
                'nav.shop':               'Shop',
                'section.title':          'Productions',
                'sort.recent':            'Latest',
                'sort.az':                'A–Z',
                'menu.productions':       'Productions',
                'menu.productions.count': '10+',
                'menu.upcoming':          'Coming Soon',
                'menu.upcoming.count':    'In Production',
                'menu.history':           'Our Story',
                'menu.history.count':     'About',
                'menu.contact':           'Contact',
                'menu.contact.count':     'get in touch',
                'footer.copy':            '© 2025 - 000 FILMES',
            }
        }
    }
});

//BUTTOM TRANSLATE 

document.getElementById('langBtn').addEventListener('click', () => {
    const next = i18next.language === 'pt' ? 'en' : 'pt';
    i18next.changeLanguage(next, () => {
        updateDOM();
        document.getElementById('langBtn').textContent =
            next === 'pt' ? 'EN' : 'PT';
    });
});