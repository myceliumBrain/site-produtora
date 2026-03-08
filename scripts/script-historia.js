/* ============================================================
   script-historia.js
   Lógica exclusiva da página historia.html
   Depende de: i18next, script-shared.js
   ============================================================ */

/* ── SCROLL REVEAL ── */
function observeReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
}


/* ── updateDOM ── */
function updateDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = i18next.t(key);
    if (val !== key) el.textContent = val;
  });
}


/* ── i18next ── */
i18next.init({
  lng: 'pt',
  resources: {
    pt: {
      translation: {
        'nav.home':                   'Início',
        'nav.portfolio':              'Portfólio',
        'nav.shop':                   'Loja',
        'historia.eyebrow':           'Fundada em 2018 · Rio de Janeiro',
        'historia.title.1':           'Fazemos filmes',
        'historia.title.2':           'que resistem.',
        'historia.manifesto.p1':      'A 000 Filmes nasceu de uma convicção simples: o cinema brasileiro independente merece existir sem pedir licença. Fundada no Rio de Janeiro em 2018, a produtora surgiu da necessidade de criar espaços para histórias que o mercado convencional insiste em ignorar.',
        'historia.manifesto.p2':      'O nome vem de um princípio: começar do zero, sempre. Cada filme é uma reinvenção. Cada projeto, uma recusa ao conforto. Não há fórmula — há compromisso com a verdade de cada história que escolhemos contar.',
        'historia.valores.eyebrow':   'Missão e valores',
        'valor.1.title':              'Resistência',
        'valor.1.text':               'Fazer cinema independente no Brasil é um ato político. Cada filme que produzimos é uma afirmação de que outras narrativas são possíveis — e necessárias.',
        'valor.2.title':              'Autoria',
        'valor.2.text':               'Acreditamos no cinema de autor. O diretor é o centro criativo de cada projeto — nossa função é construir as condições para que sua visão se realize integralmente.',
        'valor.3.title':              'Território',
        'valor.3.text':               'O Brasil é vasto e pouco visto. Priorizamos histórias de regiões e comunidades que raramente aparecem nas telas — porque acreditamos que todo território tem uma épica própria.',
        'historia.marcos.eyebrow':    'Marcos',
        'marco.2018.title':           'Fundação',
        'marco.2018.text':            'A 000 Filmes é fundada no Rio de Janeiro por um grupo de cineastas comprometidos com o cinema independente brasileiro.',
        'marco.2019.title':           'Primeiro longa',
        'marco.2019.text':            'Produção do primeiro longa-metragem da casa, Fogo Baixo, dirigido por Camila Reis. Selecionado para o Festival de Gramado.',
        'marco.2021.title':           'Prêmio ANCINE',
        'marco.2021.text':            'Deriva, de André Castilho, recebe o prêmio de Melhor Direção no Festival de Cinema Brasileiro de Miami.',
        'marco.2023.title':           'Expansão',
        'marco.2023.text':            'A produtora expande seu catálogo para o documentário, com Cerrado e Vento Cru sendo exibidos em festivais internacionais na Europa e América Latina.',
        'marco.2025.title':           'Hoje',
        'marco.2025.text':            'Com mais de 14 títulos no catálogo e três projetos em produção simultânea, a 000 Filmes consolida-se como uma das produtoras independentes mais ativas do Brasil.',
        'historia.team.eyebrow':      'Quem faz acontecer',
        'role.director':              'Diretor(a)',
        'bio.ana':                    'Formada pela ECA-USP, Ana Luiza dirige desde 2015 com olhar voltado para as margens do Brasil. Seu longa de estreia, Última Fronteira, foi selecionado para o Festival de Brasília em 2025.',
        'bio.felipe':                 'Cineasta e fotógrafo carioca, Felipe transita entre o documentário e a ficção com a mesma naturalidade. Sombra Branca é seu segundo longa-metragem e estreia em 2025.',
        'bio.carla':                  'Carla Menezes é especialista em documentário social e tem quatro filmes premiados em festivais nacionais. Atualmente dirige Bruma, seu primeiro projeto de ficção.',
        'bio.renata':                 'Roteirista antes de diretora, Renata Pires traz para a câmera a precisão das palavras. O Intervalo é seu longa de estreia, atualmente em fase de desenvolvimento.',
        'bio.eduardo':                'Eduardo Braga vem do teatro e traz ao cinema uma direção de atores visceral e precisa. Corpo Fechado, atualmente em pós-produção, é seu trabalho mais ambicioso até hoje.',
        'historia.parceiros.eyebrow': 'Parceiros',
        'footer.col1':                'Navegação',
        'footer.col2':                'Mais',
        'footer.copy':                '© 2025 - 000 FILMES',
        'menu.home':                  'Início',
        'menu.home.count':            'Página inicial',
        'menu.productions':           'Produções',
        'menu.productions.count':     '10+',
        'menu.upcoming':              'Vem aí',
        'menu.upcoming.count':        'Em produção',
        'menu.history':               'Nossa história',
        'menu.history.count':         'Sobre',
        'menu.contact':               'Contato',
        'menu.contact.count':         'fale com a gente',
      }
    },
    en: {
      translation: {
        'nav.home':                   'Home',
        'nav.portfolio':              'Portfolio',
        'nav.shop':                   'Shop',
        'historia.eyebrow':           'Founded in 2018 · Rio de Janeiro',
        'historia.title.1':           'We make films',
        'historia.title.2':           'that resist.',
        'historia.manifesto.p1':      '000 Filmes was born from a simple conviction: Brazilian independent cinema deserves to exist without asking permission. Founded in Rio de Janeiro in 2018, the production company emerged from the need to create space for stories that the conventional market insists on ignoring.',
        'historia.manifesto.p2':      'The name comes from a principle: start from zero, always. Each film is a reinvention. Each project, a refusal of comfort. There is no formula — only a commitment to the truth of each story we choose to tell.',
        'historia.valores.eyebrow':   'Mission and values',
        'valor.1.title':              'Resistance',
        'valor.1.text':               'Making independent cinema in Brazil is a political act. Every film we produce is an affirmation that other narratives are possible — and necessary.',
        'valor.2.title':              'Authorship',
        'valor.2.text':               'We believe in auteur cinema. The director is the creative centre of each project — our role is to build the conditions for their vision to be fully realised.',
        'valor.3.title':              'Territory',
        'valor.3.text':               'Brazil is vast and little seen. We prioritise stories from regions and communities that rarely appear on screen — because we believe every territory has its own epic.',
        'historia.marcos.eyebrow':    'Milestones',
        'marco.2018.title':           'Foundation',
        'marco.2018.text':            '000 Filmes is founded in Rio de Janeiro by a group of filmmakers committed to Brazilian independent cinema.',
        'marco.2019.title':           'First feature',
        'marco.2019.text':            'Production of the company\'s first feature film, Fogo Baixo, directed by Camila Reis. Selected for the Gramado Film Festival.',
        'marco.2021.title':           'ANCINE Award',
        'marco.2021.text':            'Deriva, by André Castilho, receives the Best Direction award at the Brazilian Film Festival in Miami.',
        'marco.2023.title':           'Expansion',
        'marco.2023.text':            'The company expands its catalogue into documentary, with Cerrado and Vento Cru screening at international festivals in Europe and Latin America.',
        'marco.2025.title':           'Today',
        'marco.2025.text':            'With over 14 titles in the catalogue and three projects in simultaneous production, 000 Filmes establishes itself as one of Brazil\'s most active independent production companies.',
        'historia.team.eyebrow':      'Who makes it happen',
        'role.director':              'Director',
        'bio.ana':                    'Graduate of ECA-USP, Ana Luiza has been directing since 2015 with a focus on Brazil\'s margins. Her debut feature, Última Fronteira, was selected for the Brasília Film Festival in 2025.',
        'bio.felipe':                 'Rio-born filmmaker and photographer, Felipe moves between documentary and fiction with the same ease. Sombra Branca is his second feature, premiering in 2025.',
        'bio.carla':                  'Carla Menezes specialises in social documentary and has four award-winning films in national festivals. She is currently directing Bruma, her first fiction project.',
        'bio.renata':                 'A screenwriter before a director, Renata Pires brings the precision of words to the camera. O Intervalo is her debut feature, currently in development.',
        'bio.eduardo':                'Eduardo Braga comes from theatre and brings a visceral, precise approach to directing actors. Corpo Fechado, currently in post-production, is his most ambitious work to date.',
        'historia.parceiros.eyebrow': 'Partners',
        'footer.col1':                'Navigation',
        'footer.col2':                'More',
        'footer.copy':                '© 2025 - 000 FILMES',
        'menu.home':                  'Home',
        'menu.home.count':            'Homepage',
        'menu.productions':           'Productions',
        'menu.productions.count':     '10+',
        'menu.upcoming':              'Coming Soon',
        'menu.upcoming.count':        'In Production',
        'menu.history':               'Our Story',
        'menu.history.count':         'About',
        'menu.contact':               'Contact',
        'menu.contact.count':         'get in touch',
      }
    }
  }
}, () => {
  observeReveal();
  updateDOM();
});