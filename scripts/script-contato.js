/* ============================================================
   script-contato.js
   Lógica exclusiva da página contato.html
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


/* ── FORMULÁRIO ── */
const form     = document.getElementById('contactForm');
const feedback = document.getElementById('formFeedback');

form.addEventListener('submit', e => {
  e.preventDefault();

  const lang = i18next.language;

  // Validação básica
  const nome     = form.nome.value.trim();
  const email    = form.email.value.trim();
  const assunto  = form.assunto.value.trim();
  const mensagem = form.mensagem.value.trim();

  if (!nome || !email || !assunto || !mensagem) {
    feedback.textContent = lang === 'en'
      ? 'Please fill in all required fields.'
      : 'Preencha todos os campos obrigatórios.';
    feedback.className = 'form-feedback error';
    return;
  }

   // E-MAIL JS
emailjs.init('Rq3NnSh6M4ep2ARq_'); // public key (emailjs)

form.addEventListener('submit', e => {
  e.preventDefault();

  const lang     = i18next.language;
  const nome     = form.nome.value.trim();
  const email    = form.email.value.trim();
  const assunto  = form.assunto.value.trim();
  const mensagem = form.mensagem.value.trim();

  if (!nome || !email || !assunto || !mensagem) {
    feedback.textContent = lang === 'en'
      ? 'Please fill in all required fields.'
      : 'Preencha todos os campos obrigatórios.';
    feedback.className = 'form-feedback error';
    return;
  }

  const btn = form.querySelector('.btn-submit');
  btn.disabled = true;
  btn.style.opacity = '0.5';

  emailjs.send('service_2yrzyqh', 'template_lg3h37e', { //service_id | template_id (emailJS)
    nome:      nome,
    email:     email,
    telefone:  form.telefone.value.trim() || '—',
    assunto:   assunto,
    mensagem:  mensagem,
  })
  .then(() => {
    feedback.textContent = lang === 'en'
      ? 'Message sent. We\'ll be in touch soon.'
      : 'Mensagem enviada. Entraremos em contato em breve.';
    feedback.className = 'form-feedback success';
    form.reset();
  })
  .catch(() => {
    feedback.textContent = lang === 'en'
      ? 'Something went wrong. Please try again.'
      : 'Algo deu errado. Tente novamente.';
    feedback.className = 'form-feedback error';
  })
  .finally(() => {
    btn.disabled = false;
    btn.style.opacity = '1';
  });
});
});


/* FORMA ALTERNATIVA (ABRE O E-MAIL COM AS INFO PREENCHIDAS)*/

// form.addEventListener('submit', e => {
//   e.preventDefault();

//   const lang     = i18next.language;
//   const nome     = form.nome.value.trim();
//   const email    = form.email.value.trim();
//   const telefone = form.telefone.value.trim();
//   const assunto  = form.assunto.value.trim();
//   const mensagem = form.mensagem.value.trim();

//   if (!nome || !email || !assunto || !mensagem) {
//     feedback.textContent = lang === 'en'
//       ? 'Please fill in all required fields.'
//       : 'Preencha todos os campos obrigatórios.';
//     feedback.className = 'form-feedback error';
//     return;
//   }

//   const corpo = `Nome: ${nome}\nE-mail: ${email}\nTelefone: ${telefone || '—'}\n\n${mensagem}`;

//   const mailto = `mailto:tenoriopha@gmail.com`
//     + `?subject=${encodeURIComponent(assunto + ' — 000 Filmes')}`
//     + `&body=${encodeURIComponent(corpo)}`;

//   window.location.href = mailto;
// });


/* ── updateDOM (chamada pelo script-shared ao trocar idioma) ── */
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
        'nav.home':               'Início',
        'nav.portfolio':          'Portfólio',
        'nav.shop':               'Loja',
        'contact.eyebrow':        'Fale com a gente',
        'contact.title':          'Contato',
        'contact.sub':            'Estamos disponíveis para parcerias, imprensa e qualquer conversa sobre cinema.',
        'form.name':              'Nome',
        'form.phone':             'Telefone',
        'form.email':             'E-mail',
        'form.subject':           'Assunto',
        'form.message':           'Mensagem',
        'form.send':              'Enviar mensagem',
        'form.whatsapp':          'Prefere o WhatsApp?',
        'footer.col1':            'Navegação',
        'footer.copy':            '© 2025 - 000 FILMES',
        'menu.home':              'Início',
        'menu.home.count':        'Página inicial',
        'menu.productions':       'Produções',
        'menu.productions.count': '10+',
        'menu.upcoming':          'Vem aí',
        'menu.upcoming.count':    'Em produção',
        'menu.history':           'Nossa história',
        'menu.history.count':     'Sobre',
        'menu.contact':           'Contato',
        'menu.contact.count':     'fale com a gente',
      }
    },
    en: {
      translation: {
        'nav.home':               'Home',
        'nav.portfolio':          'Portfolio',
        'nav.shop':               'Shop',
        'contact.eyebrow':        'Get in touch',
        'contact.title':          'Contact',
        'contact.sub':            'We\'re available for partnerships, press, and any conversation about cinema.',
        'form.name':              'Name',
        'form.phone':             'Phone',
        'form.email':             'E-mail',
        'form.subject':           'Subject',
        'form.message':           'Message',
        'form.send':              'Send message',
        'form.whatsapp':          'Prefer WhatsApp?',
        'footer.col1':            'Navigation',
        'footer.copy':            '© 2025 - 000 FILMES',
        'menu.home':              'Home',
        'menu.home.count':        'Homepage',
        'menu.productions':       'Productions',
        'menu.productions.count': '10+',
        'menu.upcoming':          'Coming Soon',
        'menu.upcoming.count':    'In Production',
        'menu.history':           'Our Story',
        'menu.history.count':     'About',
        'menu.contact':           'Contact',
        'menu.contact.count':     'get in touch',
      }
    }
  }
}, () => {
  observeReveal();
  updateDOM();
});