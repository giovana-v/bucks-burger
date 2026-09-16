/* ============================================================
   BUCK'S BURGUER — INTERFACE GERAL
   ------------------------------------------------------------
   Header, menu, carrossel, animações e — importante — a
   renderização dos DADOS COMERCIAIS a partir de js/config.js.

   Regra: nada de endereço, telefone, e-mail ou @ escrito no
   HTML. Se o dado não estiver confirmado na configuração, o
   bloco simplesmente não aparece (em vez de exibir um valor
   inventado).
   ============================================================ */

/* ---------- Header ---------- */
function iniciarHeader() {
  const header = document.querySelector('.header');
  if (!header) return;
  const atualizar = () => header.classList.toggle('rolado', window.scrollY > 40);
  atualizar();
  window.addEventListener('scroll', atualizar, { passive: true });
}

/* ---------- Menu mobile ---------- */
function iniciarMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const aberto = nav.classList.toggle('aberto');
    toggle.classList.toggle('aberto', aberto);
    toggle.setAttribute('aria-expanded', String(aberto));
  });

  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('aberto');
      toggle.classList.remove('aberto');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function marcarLinkAtivo() {
  const atual = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const alvo = (link.getAttribute('href') || '').split('#')[0];
    if (alvo === atual) {
      link.classList.add('ativo');
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ---------- Revelação ao rolar ----------
   Observa também o que for inserido depois pelo cardapio.js. */
let observadorRevelar = null;

function iniciarRevelar() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.revelar').forEach(el => el.classList.add('visivel'));
    return;
  }

  observadorRevelar = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('visivel');
      observadorRevelar.unobserve(entrada.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -60px 0px' });

  observar();
}

function observar() {
  if (!observadorRevelar) return;
  document.querySelectorAll('.revelar:not(.visivel)').forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 80}ms`;
    observadorRevelar.observe(el);
  });
}

/* ---------- Faixa corrida ---------- */
function iniciarFaixa() {
  document.querySelectorAll('.faixa__trilho').forEach(trilho => {
    trilho.innerHTML += trilho.innerHTML;
  });
}

/* ---------- Carrossel do menu da semana ---------- */
function iniciarCarrossel() {
  document.querySelectorAll('.carrossel').forEach(carrossel => {
    const trilho = carrossel.querySelector('.carrossel__trilho');
    const anterior = carrossel.querySelector('[data-carrossel="anterior"]');
    const proximo = carrossel.querySelector('[data-carrossel="proximo"]');
    if (!trilho) return;

    const passo = () => {
      const card = trilho.querySelector('.dia');
      return card ? card.offsetWidth + 24 : trilho.clientWidth * .8;
    };

    const atualizarSetas = () => {
      const fim = trilho.scrollWidth - trilho.clientWidth - 2;
      if (anterior) anterior.disabled = trilho.scrollLeft <= 2;
      if (proximo) proximo.disabled = trilho.scrollLeft >= fim;
    };

    anterior?.addEventListener('click', () => trilho.scrollBy({ left: -passo() }));
    proximo?.addEventListener('click', () => trilho.scrollBy({ left: passo() }));
    trilho.addEventListener('scroll', atualizarSetas, { passive: true });
    window.addEventListener('resize', atualizarSetas);
    document.addEventListener('carrossel:pronto', () => setTimeout(atualizarSetas, 60));
    atualizarSetas();
  });
}

/* ============================================================
   DADOS COMERCIAIS — tudo vem de BUSINESS_CONFIG
   ============================================================ */

const DIAS_ORDEM = [
  ['tuesday', 'Terça'], ['wednesday', 'Quarta'], ['thursday', 'Quinta'],
  ['friday', 'Sexta'], ['saturday', 'Sábado'], ['sunday', 'Domingo'],
  ['monday', 'Segunda']
];

/** Situação da loja (aberto/fechado), onde houver [data-status-loja]. */
function renderizarStatusLoja() {
  const alvos = document.querySelectorAll('[data-status-loja]');
  if (!alvos.length) return;

  const estado = Loja.estaAberto(BUSINESS_CONFIG.businessHours);

  alvos.forEach(alvo => {
    alvo.textContent = '';
    alvo.classList.toggle('status-loja--aberto', estado.aberto);
    alvo.classList.toggle('status-loja--fechado', !estado.aberto);

    const ponto = document.createElement('span');
    ponto.className = 'status-loja__ponto';
    ponto.setAttribute('aria-hidden', 'true');

    const texto = document.createElement('span');
    // O ícone é redundante: o texto sozinho já informa a situação.
    texto.textContent = estado.aberto ? 'Aberto agora' : 'Fechado agora';

    alvo.append(ponto, texto);

    if (!estado.aberto && estado.proximaAbertura) {
      const prox = document.createElement('small');
      prox.textContent = `Abrimos ${estado.proximaAbertura}`;
      alvo.appendChild(prox);
    }
  });
}

/** Lista de horários. Fechamento não confirmado vira "a partir de". */
function renderizarHorarios() {
  const alvos = document.querySelectorAll('[data-horarios]');
  if (!alvos.length) return;

  const h = BUSINESS_CONFIG.businessHours || {};

  alvos.forEach(alvo => {
    alvo.textContent = '';

    DIAS_ORDEM.forEach(([chave, rotulo]) => {
      const dia = h[chave];
      const linha = document.createElement('p');
      linha.className = 'horario-linha';

      const nome = document.createElement('strong');
      nome.textContent = `${rotulo}:`;

      const valor = document.createElement('span');
      if (!dia) {
        valor.textContent = 'Fechado';
        linha.classList.add('horario-linha--fechado');
      } else if (!dia.close) {
        // Não inventamos horário de encerramento
        valor.textContent = `a partir das ${dia.open}`;
      } else {
        valor.textContent = `${dia.open} às ${dia.close}`;
      }

      linha.append(nome, valor);
      alvo.appendChild(linha);
    });
  });
}

/** Endereço da loja — some inteiro quando não há dado. */
function renderizarEndereco() {
  const texto = Loja.enderecoFormatado(BUSINESS_CONFIG.address);

  document.querySelectorAll('[data-endereco]').forEach(alvo => {
    if (!texto) {
      // Sem endereço confirmado, escondemos a seção inteira
      const secao = alvo.closest('[data-some-sem-endereco]');
      if (secao) { secao.hidden = true; return; }
      alvo.textContent = 'Endereço em breve';
      alvo.classList.add('dado-indisponivel');
      return;
    }
    alvo.textContent = texto;
  });
}

/** Links de contato: só renderiza o que existe e é válido. */
function renderizarContatos() {
  const c = BUSINESS_CONFIG;

  document.querySelectorAll('[data-contatos]').forEach(alvo => {
    alvo.textContent = '';
    const links = [];

    if (c.whatsapp) {
      links.push(linkContato(
        `https://wa.me/${c.whatsapp.replace(/\D/g, '')}`,
        Loja.formatarTelefone(c.whatsapp.replace(/^55/, '')),
        'WhatsApp', iconeWhatsapp()
      ));
    }
    if (c.phone) {
      links.push(linkContato(`tel:+55${c.phone.replace(/\D/g, '')}`,
        Loja.formatarTelefone(c.phone), 'Telefone', iconeTelefone()));
    }
    if (c.email && c.email.includes('@')) {
      links.push(linkContato(`mailto:${c.email}`, c.email, 'E-mail', iconeEmail()));
    }
    if (c.instagram) {
      const usuario = c.instagram.replace(/^@/, '');
      links.push(linkContato(`https://instagram.com/${usuario}`, `@${usuario}`, 'Instagram', iconeInstagram()));
    }

    if (!links.length) {
      const p = document.createElement('p');
      p.className = 'dado-indisponivel';
      p.textContent = 'Canais de contato em breve.';
      alvo.appendChild(p);
      return;
    }
    links.forEach(l => alvo.appendChild(l));
  });

  // Ícones sociais avulsos (hero, rodapé)
  document.querySelectorAll('[data-social="instagram"]').forEach(el => {
    if (!c.instagram) { el.hidden = true; return; }
    el.href = `https://instagram.com/${c.instagram.replace(/^@/, '')}`;
  });
  document.querySelectorAll('[data-social="whatsapp"]').forEach(el => {
    if (!c.whatsapp) { el.hidden = true; return; }
    el.href = `https://wa.me/${c.whatsapp.replace(/\D/g, '')}`;
  });
}

function linkContato(href, texto, rotulo, svg) {
  const a = document.createElement('a');
  a.className = 'contato-item';
  a.href = href;
  a.setAttribute('aria-label', `${rotulo}: ${texto}`);
  if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
  a.innerHTML = svg;                       // SVG estático nosso, sem dado externo
  const span = document.createElement('span');
  span.textContent = texto;                // o dado entra como texto
  a.appendChild(span);
  return a;
}

const iconeWhatsapp = () => `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.3-5.3A8.4 8.4 0 1 1 21 11.5z"/></svg>`;
const iconeTelefone = () => `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>`;
const iconeEmail = () => `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>`;
const iconeInstagram = () => `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>`;

/** Aviso de entrega — só promete o que o sistema consegue validar. */
function renderizarAvisoEntrega() {
  const alvos = document.querySelectorAll('[data-entrega-aviso]');
  if (!alvos.length) return;

  const d = BUSINESS_CONFIG.delivery || {};
  const temRegras = (d.feeRules || []).length > 0;
  const temCoordenadas = !!(BUSINESS_CONFIG.address && BUSINESS_CONFIG.address.coords);

  alvos.forEach(alvo => {
    alvo.textContent = temRegras || temCoordenadas
      ? `Entrega gratuita para quem está a até ${d.freeRadiusKm} km da loja.`
      : 'Consulte as condições e a taxa de entrega no atendimento.';
  });
}

/* ---------- Ano no rodapé ---------- */
function atualizarAno() {
  document.querySelectorAll('[data-ano]').forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });
}

/* ---------- Formulário de contato ---------- */
function iniciarFormulario() {
  const form = document.getElementById('formContato');
  if (!form) return;

  const validar = (campo) => {
    const input = campo.querySelector('input, textarea');
    if (!input) return true;

    let valido = input.value.trim() !== '';
    if (valido && input.type === 'email') valido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    if (valido && input.type === 'tel') valido = input.value.replace(/\D/g, '').length >= 10;

    campo.classList.toggle('invalido', !valido);
    input.setAttribute('aria-invalid', String(!valido));
    return valido;
  };

  form.querySelectorAll('.campo').forEach(campo => {
    campo.querySelector('input, textarea')?.addEventListener('blur', () => validar(campo));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const campos = [...form.querySelectorAll('.campo')];
    if (!campos.map(validar).every(Boolean)) {
      form.querySelector('.campo.invalido input, .campo.invalido textarea')?.focus();
      return;
    }

    // Sem backend: a mensagem segue pelo WhatsApp da loja.
    const texto = [
      'CONTATO PELO SITE', '',
      `Nome: ${form.nome.value.trim()}`,
      `Telefone: ${form.telefone.value.trim()}`,
      `E-mail: ${form.email.value.trim()}`,
      `Assunto: ${form.assunto.value}`, '',
      form.mensagem.value.trim()
    ].join('\n');

    const url = Loja.montarUrlWhatsapp(BUSINESS_CONFIG.whatsapp, texto);
    if (url) window.open(url, '_blank', 'noopener');
    Carrinho.toast('Abrindo o WhatsApp para enviar sua mensagem.');
  });

  const tel = form.querySelector('input[type="tel"]');
  tel?.addEventListener('input', () => { tel.value = Loja.formatarTelefone(tel.value); });
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  iniciarHeader();
  iniciarMenu();
  marcarLinkAtivo();
  iniciarRevelar();
  iniciarFaixa();
  iniciarCarrossel();
  atualizarAno();
  iniciarFormulario();

  renderizarStatusLoja();
  renderizarHorarios();
  renderizarEndereco();
  renderizarContatos();
  renderizarAvisoEntrega();

  // Atualiza a situação da loja a cada minuto
  setInterval(renderizarStatusLoja, 60000);
  // Observa os cards que o cardapio.js insere depois
  document.addEventListener('carrossel:pronto', observar);
});
