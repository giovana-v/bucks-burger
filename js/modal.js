/* ============================================================
   BUCK'S BURGUER — MODAL REUTILIZÁVEL
   ------------------------------------------------------------
   Padrão único de diálogo do projeto, usado tanto pela
   personalização rápida do produto quanto pelo checkout.

   Usa <dialog> nativo, que já entrega de graça:
     - prender o foco dentro do diálogo;
     - fechar com Esc;
     - tornar o resto da página inerte (não operável);
     - backdrop próprio.
   Cuidamos só do que o nativo não faz: clique fora e devolver
   o foco ao elemento que abriu.
   ============================================================ */

const Modal = (() => {
  let ultimoGatilho = null;

  /**
   * @param {HTMLDialogElement} dialog
   * @param {Object} opcoes
   * @param {HTMLElement} opcoes.gatilho  elemento que abriu (recebe o foco de volta)
   * @param {string}  opcoes.focoInicial  seletor do que deve receber foco
   * @param {boolean} opcoes.fecharAoClicarFora
   */
  function abrir(dialog, opcoes = {}) {
    if (!dialog) return;
    ultimoGatilho = opcoes.gatilho || document.activeElement;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      // Navegador muito antigo: degrada para um painel simples visível.
      dialog.setAttribute('open', '');
    }

    // Trava o scroll do fundo (o <dialog> nativo não faz isso sozinho)
    document.body.classList.add('modal-aberto');

    const alvo = opcoes.focoInicial
      ? dialog.querySelector(opcoes.focoInicial)
      : dialog.querySelector('[autofocus], input, select, textarea, button');
    // Espera o diálogo pintar antes de mover o foco
    requestAnimationFrame(() => alvo?.focus());

    if (opcoes.fecharAoClicarFora !== false) ligarCliqueFora(dialog);
  }

  function fechar(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }

  /* O clique no backdrop chega como clique no próprio <dialog>,
     já que o conteúdo fica num wrapper interno. */
  function ligarCliqueFora(dialog) {
    if (dialog.dataset.cliqueForaLigado) return;
    dialog.dataset.cliqueForaLigado = '1';

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) fechar(dialog);
    });
  }

  /** Devolve o foco a quem abriu, sempre que o diálogo fecha. */
  function ligarRetornoDeFoco(dialog) {
    if (!dialog || dialog.dataset.retornoLigado) return;
    dialog.dataset.retornoLigado = '1';

    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-aberto');
      if (ultimoGatilho && document.contains(ultimoGatilho)) {
        ultimoGatilho.focus();
      }
      ultimoGatilho = null;
    });
  }

  /** Prepara um diálogo: botões [data-fechar] e retorno de foco. */
  function preparar(dialog) {
    if (!dialog) return;
    ligarRetornoDeFoco(dialog);
    dialog.querySelectorAll('[data-fechar]').forEach(btn => {
      btn.addEventListener('click', () => fechar(dialog));
    });
  }

  return { abrir, fechar, preparar };
})();

if (typeof window !== 'undefined') window.Modal = Modal;
