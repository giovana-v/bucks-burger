/* ============================================================
   BUCK'S BURGUER — CHECKOUT
   ------------------------------------------------------------
   Etapa de identificação antes de abrir o WhatsApp.

   O formulário é montado aqui (uma única vez, em qualquer
   página) para não duplicar markup nos quatro HTML.
   Validação e mensagem vêm de js/loja.js — este arquivo só
   cuida de DOM e eventos.

   PRIVACIDADE: os dados pessoais ficam apenas em memória e no
   formulário. Nada é gravado em localStorage nem enviado a
   terceiros — só seguem para o WhatsApp da loja, por ação
   explícita do cliente.
   ============================================================ */

const Checkout = (() => {
  let dialog = null;

  /* ---------- Markup (estático, sem dado do cliente) ---------- */
  const TEMPLATE = `
    <form class="checkout" id="formCheckout" novalidate>
      <header class="checkout__topo">
        <h2 id="checkoutTitulo">Finalizar pedido</h2>
        <button type="button" class="checkout__fechar" data-fechar aria-label="Fechar e voltar ao carrinho">×</button>
      </header>

      <div class="checkout__corpo">
        <p class="checkout__erro-geral" id="checkoutErroGeral" role="alert" hidden></p>

        <fieldset class="checkout__bloco">
          <legend>Seus dados</legend>

          <div class="campo">
            <label for="ckNome">Nome completo <span aria-hidden="true">*</span></label>
            <input type="text" id="ckNome" name="nome" autocomplete="name" required
                   aria-describedby="erroNome">
            <span class="form__erro" id="erroNome" role="alert"></span>
          </div>

          <div class="campo">
            <label for="ckTelefone">Telefone com DDD <span aria-hidden="true">*</span></label>
            <input type="tel" id="ckTelefone" name="telefone" autocomplete="tel"
                   inputmode="numeric" placeholder="(19) 99999-9999" required
                   aria-describedby="erroTelefone">
            <span class="form__erro" id="erroTelefone" role="alert"></span>
          </div>
        </fieldset>

        <fieldset class="checkout__bloco">
          <legend>Como você quer receber? <span aria-hidden="true">*</span></legend>
          <div class="opcoes" role="radiogroup" aria-describedby="erroTipoPedido">
            <label class="opcao">
              <input type="radio" name="tipoPedido" value="retirada" checked>
              <span class="opcao__texto"><strong>Retirar no balcão</strong><small>Sem taxa</small></span>
            </label>
            <label class="opcao">
              <input type="radio" name="tipoPedido" value="entrega">
              <span class="opcao__texto"><strong>Entrega</strong><small>Taxa informada pela loja</small></span>
            </label>
          </div>
          <span class="form__erro" id="erroTipoPedido" role="alert"></span>
        </fieldset>

        <fieldset class="checkout__bloco" id="blocoEndereco" hidden>
          <legend>Endereço de entrega</legend>

          <div class="form__linha form__linha--rua">
            <div class="campo">
              <label for="ckRua">Rua <span aria-hidden="true">*</span></label>
              <input type="text" id="ckRua" name="rua" autocomplete="address-line1"
                     aria-describedby="erroRua">
              <span class="form__erro" id="erroRua" role="alert"></span>
            </div>
            <div class="campo">
              <label for="ckNumero">Número <span aria-hidden="true">*</span></label>
              <input type="text" id="ckNumero" name="numero" autocomplete="address-line2"
                     placeholder="123 ou s/n" aria-describedby="erroNumero">
              <span class="form__erro" id="erroNumero" role="alert"></span>
            </div>
          </div>

          <div class="campo">
            <label for="ckComplemento">Complemento <small>(opcional)</small></label>
            <input type="text" id="ckComplemento" name="complemento" placeholder="Apto, bloco, casa">
          </div>

          <div class="campo">
            <label for="ckBairro">Bairro <span aria-hidden="true">*</span></label>
            <input type="text" id="ckBairro" name="bairro" aria-describedby="erroBairro">
            <span class="form__erro" id="erroBairro" role="alert"></span>
          </div>

          <div class="campo">
            <label for="ckReferencia">Ponto de referência <small>(opcional)</small></label>
            <input type="text" id="ckReferencia" name="referencia" placeholder="Portão azul, ao lado da padaria">
          </div>
        </fieldset>

        <fieldset class="checkout__bloco">
          <legend>Pagamento <span aria-hidden="true">*</span></legend>
          <div class="opcoes opcoes--grade" role="radiogroup" aria-describedby="erroPagamento">
            <label class="opcao"><input type="radio" name="pagamento" value="pix"><span class="opcao__texto"><strong>PIX</strong></span></label>
            <label class="opcao"><input type="radio" name="pagamento" value="dinheiro"><span class="opcao__texto"><strong>Dinheiro</strong></span></label>
            <label class="opcao"><input type="radio" name="pagamento" value="debito"><span class="opcao__texto"><strong>Débito</strong></span></label>
            <label class="opcao"><input type="radio" name="pagamento" value="credito"><span class="opcao__texto"><strong>Crédito</strong></span></label>
          </div>
          <span class="form__erro" id="erroPagamento" role="alert"></span>

          <div id="blocoTroco" hidden>
            <label class="checkbox">
              <input type="checkbox" id="ckSemTroco" name="semTroco">
              <span>Não preciso de troco</span>
            </label>
            <div class="campo" id="campoTroco">
              <label for="ckTroco">Troco para quanto?</label>
              <input type="text" id="ckTroco" name="trocoPara" inputmode="decimal"
                     placeholder="Ex.: 50,00" aria-describedby="erroTrocoPara">
              <span class="form__erro" id="erroTrocoPara" role="alert"></span>
            </div>
          </div>
        </fieldset>

        <fieldset class="checkout__bloco">
          <legend>Observação geral <small>(opcional)</small></legend>
          <div class="campo">
            <label for="ckObs" class="sr-only">Observação geral do pedido</label>
            <textarea id="ckObs" name="observacaoGeral" rows="2" maxlength="200"
                      placeholder="Algo que a loja precise saber sobre o pedido inteiro"
                      aria-describedby="erroObservacaoGeral"></textarea>
            <span class="obs-contador"><span id="ckObsContador">0</span>/200</span>
            <span class="form__erro" id="erroObservacaoGeral" role="alert"></span>
          </div>
        </fieldset>

        <section class="checkout__resumo" aria-label="Resumo do pedido">
          <h3>Resumo</h3>
          <div id="checkoutResumo"></div>
        </section>
      </div>

      <footer class="checkout__rodape">
        <button type="button" class="btn btn--fantasma" data-fechar>Voltar</button>
        <button type="submit" class="btn btn--primario" id="checkoutEnviar">Enviar pelo WhatsApp</button>
      </footer>
    </form>`;

  /* ---------- Montagem ---------- */
  function montar() {
    if (document.getElementById('checkoutDialog')) return;

    dialog = document.createElement('dialog');
    dialog.id = 'checkoutDialog';
    dialog.className = 'dialogo dialogo--checkout';
    dialog.setAttribute('aria-labelledby', 'checkoutTitulo');
    dialog.innerHTML = TEMPLATE;
    document.body.appendChild(dialog);

    Modal.preparar(dialog);
    ligarEventos();
  }

  const $ = (id) => document.getElementById(id);

  /* ---------- Campos condicionais ---------- */
  function atualizarCondicionais() {
    const tipo = valorRadio('tipoPedido');
    const pagamento = valorRadio('pagamento');

    // Endereço só para entrega
    const blocoEndereco = $('blocoEndereco');
    blocoEndereco.hidden = tipo !== 'entrega';
    // hidden não basta: campos escondidos não podem ser focados nem validados
    blocoEndereco.disabled = tipo !== 'entrega';

    // Troco só no dinheiro
    const blocoTroco = $('blocoTroco');
    blocoTroco.hidden = pagamento !== 'dinheiro';
    $('campoTroco').hidden = $('ckSemTroco').checked;

    atualizarResumo();
  }

  function valorRadio(nome) {
    const el = document.querySelector(`#formCheckout input[name="${nome}"]:checked`);
    return el ? el.value : '';
  }

  /* ---------- Leitura dos dados ---------- */
  function lerFormulario() {
    const tipo = valorRadio('tipoPedido');
    return {
      nome: $('ckNome').value.trim(),
      telefone: $('ckTelefone').value.trim(),
      tipoPedido: tipo,
      rua: tipo === 'entrega' ? $('ckRua').value.trim() : '',
      numero: tipo === 'entrega' ? $('ckNumero').value.trim() : '',
      complemento: tipo === 'entrega' ? $('ckComplemento').value.trim() : '',
      bairro: tipo === 'entrega' ? $('ckBairro').value.trim() : '',
      referencia: tipo === 'entrega' ? $('ckReferencia').value.trim() : '',
      pagamento: valorRadio('pagamento'),
      semTroco: $('ckSemTroco').checked,
      trocoPara: $('ckTroco').value.trim(),
      observacaoGeral: Loja.normalizarObs($('ckObs').value)
    };
  }

  function contextoAtual(dados) {
    const itens = Carrinho.listar();
    const totais = Loja.calcularTotais(itens, BUSINESS_CONFIG, {
      tipoPedido: dados.tipoPedido,
      bairro: dados.bairro
    });
    const estado = Loja.estaAberto(BUSINESS_CONFIG.businessHours);

    return {
      itens, totais, estado,
      temItens: itens.length > 0,
      total: totais.total,
      lojaFechada: !estado.aberto,
      abaixoDoMinimo: !totais.atingiuMinimo,
      minimo: totais.minimo
    };
  }

  /* ---------- Resumo ao vivo ---------- */
  function atualizarResumo() {
    const box = $('checkoutResumo');
    if (!box) return;

    const dados = lerFormulario();
    const { totais } = contextoAtual(dados);

    box.textContent = '';
    box.appendChild(linha('Subtotal', Loja.formatarMoeda(totais.subtotal)));

    if (dados.tipoPedido === 'entrega') {
      box.appendChild(linha('Taxa de entrega', totais.taxa.rotulo));
    }

    if (totais.minimo !== null && !totais.atingiuMinimo) {
      const falta = linha('Falta para o mínimo', Loja.formatarMoeda(totais.faltaParaMinimo));
      falta.classList.add('resumo__linha--alerta');
      box.appendChild(falta);
    }

    const total = linha(
      totais.totalParcial ? 'Total parcial' : 'Total',
      Loja.formatarMoeda(totais.total)
    );
    total.classList.add('resumo__linha--total');
    box.appendChild(total);

    if (totais.totalParcial) {
      const nota = document.createElement('p');
      nota.className = 'resumo__nota';
      nota.textContent = 'A taxa de entrega será confirmada pela loja no WhatsApp.';
      box.appendChild(nota);
    }
  }

  function linha(rotulo, valor) {
    const el = document.createElement('div');
    el.className = 'resumo__linha';
    const a = document.createElement('span'); a.textContent = rotulo;
    const b = document.createElement('strong'); b.textContent = valor;
    el.append(a, b);
    return el;
  }

  /* ---------- Erros ---------- */
  const CAMPO_DE_ERRO = {
    nome: 'ckNome', telefone: 'ckTelefone', rua: 'ckRua', numero: 'ckNumero',
    bairro: 'ckBairro', trocoPara: 'ckTroco', observacaoGeral: 'ckObs'
  };

  function limparErros() {
    document.querySelectorAll('#formCheckout .form__erro').forEach(el => { el.textContent = ''; });
    document.querySelectorAll('#formCheckout .campo').forEach(el => el.classList.remove('invalido'));
    document.querySelectorAll('#formCheckout [aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    const geral = $('checkoutErroGeral');
    geral.textContent = '';
    geral.hidden = true;
  }

  /** Mostra cada mensagem junto do seu campo (sem alert). */
  function mostrarErros(erros) {
    limparErros();

    Object.entries(erros).forEach(([campo, msg]) => {
      if (campo === 'carrinho') {
        const geral = $('checkoutErroGeral');
        geral.textContent = msg;
        geral.hidden = false;
        return;
      }
      const alvo = $(`erro${campo.charAt(0).toUpperCase()}${campo.slice(1)}`);
      if (alvo) alvo.textContent = msg;

      const input = $(CAMPO_DE_ERRO[campo]);
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.closest('.campo')?.classList.add('invalido');
      }
    });

    // Leva o foco ao primeiro problema
    const primeiro = document.querySelector('#formCheckout [aria-invalid="true"]');
    if (primeiro) primeiro.focus();
    else if (!$('checkoutErroGeral').hidden) $('checkoutErroGeral').focus();
  }

  /* ---------- Envio ---------- */
  function enviar(e) {
    e.preventDefault();

    const dados = lerFormulario();
    const ctx = contextoAtual(dados);
    const { valido, erros } = Loja.validarCheckout(dados, ctx);

    // Em caso de erro nada é limpo: o cliente não reescreve o formulário.
    if (!valido) {
      mostrarErros(erros);
      return;
    }
    limparErros();

    const numero = BUSINESS_CONFIG.whatsapp;
    if (!numero) {
      const geral = $('checkoutErroGeral');
      geral.textContent = 'WhatsApp da loja não configurado. Avise o administrador.';
      geral.hidden = false;
      return;
    }

    const mensagem = Loja.montarMensagem({
      itens: ctx.itens,
      cliente: {
        ...dados,
        trocoParaCentavos: Loja.lerValorDigitado(dados.trocoPara)
      },
      totais: ctx.totais
    });

    const url = Loja.montarUrlWhatsapp(numero, mensagem);
    window.open(url, '_blank', 'noopener');

    Modal.fechar(dialog);
    Carrinho.toast('Pedido enviado! Confirme no WhatsApp.');
  }

  /* ---------- Eventos ---------- */
  function ligarEventos() {
    const form = $('formCheckout');

    form.addEventListener('change', (e) => {
      if (['tipoPedido', 'pagamento', 'semTroco'].includes(e.target.name)) {
        atualizarCondicionais();
      }
      if (e.target.name === 'bairro') atualizarResumo();
    });

    form.addEventListener('submit', enviar);

    // Máscara de telefone
    const tel = $('ckTelefone');
    tel.addEventListener('input', () => { tel.value = Loja.formatarTelefone(tel.value); });

    // Contador da observação
    const obs = $('ckObs');
    obs.addEventListener('input', () => { $('ckObsContador').textContent = String(obs.value.length); });

    // Revalida o campo assim que o cliente corrige
    form.addEventListener('input', (e) => {
      const campo = e.target.closest('.campo');
      if (campo?.classList.contains('invalido')) {
        campo.classList.remove('invalido');
        e.target.removeAttribute('aria-invalid');
        campo.querySelector('.form__erro').textContent = '';
      }
      if (e.target.name === 'bairro') atualizarResumo();
    });
  }

  /* ---------- Abertura ---------- */
  function abrir(gatilho) {
    montar();

    if (Carrinho.vazio()) {
      Carrinho.toast('Adicione um item antes de finalizar.');
      return;
    }

    limparErros();
    atualizarCondicionais();
    Carrinho.fechar();

    // O foco NÃO volta para o botão "Finalizar": ele fica dentro do
    // carrinho, que acabou de virar inert. Devolvemos para o ícone
    // do carrinho no header, que continua visível e focável.
    const destinoDoFoco = document.getElementById('carrinhoAbrir') || gatilho;
    Modal.abrir(dialog, { gatilho: destinoDoFoco, focoInicial: '#ckNome' });
  }

  function iniciar() {
    document.getElementById('carrinhoFinalizar')
      ?.addEventListener('click', (e) => abrir(e.currentTarget));
  }

  return { iniciar, abrir };
})();

document.addEventListener('DOMContentLoaded', Checkout.iniciar);
