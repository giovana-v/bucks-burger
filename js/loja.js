/* ============================================================
   BUCK'S BURGUER — REGRAS DE NEGÓCIO (funções puras)
   ------------------------------------------------------------
   Nenhuma função deste arquivo toca no DOM. Isso mantém o
   cálculo testável (ver tests/testes.js) e garante que carrinho
   e mensagem do WhatsApp usem exatamente a mesma conta.

   Todo valor monetário circula em CENTAVOS INTEIROS.
   Reais (float) só aparecem na entrada (produtos.json) e na
   saída formatada.
   ============================================================ */

const Loja = (() => {

  /* ================= DINHEIRO ================= */

  const formatador = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL'
  });

  /** Reais (float) -> centavos (int). 42.90 -> 4290 */
  function paraCentavos(reais) {
    const n = Number(reais);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
  }

  /** Centavos (int) -> "R$ 42,90" */
  function formatarMoeda(centavos) {
    const n = Number.isFinite(Number(centavos)) ? Number(centavos) : 0;
    return formatador.format(n / 100);
  }

  /** "12,50" | "12.50" | "R$ 12,50" -> 1250 centavos. Inválido -> null */
  function lerValorDigitado(texto) {
    if (texto === null || texto === undefined) return null;
    const limpo = String(texto).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    if (limpo === '' || limpo === '-') return null;
    const n = Number(limpo);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100);
  }

  /* ================= ITENS DO CARRINHO ================= */

  /**
   * Identidade de um item. Produto + adicionais + observação.
   * Observações diferentes = itens diferentes (importante para alergia:
   * "sem cebola" não pode ser agrupado com o pedido normal).
   */
  function chaveItem(item) {
    const adicionais = (item.adicionais || []).map(a => a.id).sort().join(',');
    const obs = normalizarObs(item.obs);
    return `${item.id}|${adicionais}|${obs}`;
  }

  /** Normaliza observação: apara, colapsa espaços e corta no limite. */
  const LIMITE_OBS = 200;
  function normalizarObs(texto) {
    return String(texto ?? '').replace(/\s+/g, ' ').trim().slice(0, LIMITE_OBS);
  }

  /** Preço unitário do item (produto + adicionais), em centavos. */
  function precoUnitario(item) {
    const extras = (item.adicionais || [])
      .reduce((soma, a) => soma + (a.precoCentavos || 0), 0);
    return (item.precoCentavos || 0) + extras;
  }

  /** Preço do item já multiplicado pela quantidade, em centavos. */
  function precoItem(item) {
    return precoUnitario(item) * (item.qtd || 0);
  }

  /** Soma de todos os itens, em centavos. */
  function calcularSubtotal(itens) {
    return (itens || []).reduce((soma, item) => soma + precoItem(item), 0);
  }

  /* ================= ENTREGA ================= */

  /**
   * Decide a taxa de entrega a partir das regras cadastradas.
   *
   * @returns {{ situacao: string, centavos: number|null, rotulo: string, gratis: boolean }}
   *   situacao: 'retirada' | 'gratis' | 'calculada' | 'indeterminada'
   *   centavos: null quando não há como calcular com os dados atuais.
   */
  function calcularTaxaEntrega(config, contexto = {}) {
    const { tipoPedido, bairro, cep, distanciaKm } = contexto;

    if (tipoPedido !== 'entrega') {
      return { situacao: 'retirada', centavos: 0, rotulo: 'Retirada no balcão', gratis: false };
    }

    const entrega = (config && config.delivery) || {};
    const regras = entrega.feeRules || [];

    // Frete grátis por raio só vale com distância REAL medida.
    // Sem coordenadas não afirmamos gratuidade.
    if (typeof distanciaKm === 'number' &&
        typeof entrega.freeRadiusKm === 'number' &&
        distanciaKm <= entrega.freeRadiusKm) {
      return { situacao: 'gratis', centavos: 0, rotulo: 'Grátis', gratis: true };
    }

    for (const regra of regras) {
      if (regra.tipo === 'bairro' && bairro) {
        const alvo = normalizarTexto(bairro);
        const bate = (regra.bairros || []).some(b => normalizarTexto(b) === alvo);
        if (bate) return taxaDeRegra(regra);
      }

      if (regra.tipo === 'cep' && cep) {
        const numero = String(cep).replace(/\D/g, '');
        if (numero.length === 8 && numero >= String(regra.de) && numero <= String(regra.ate)) {
          return taxaDeRegra(regra);
        }
      }

      if (regra.tipo === 'distancia' && typeof distanciaKm === 'number') {
        if (distanciaKm <= regra.ateKm) return taxaDeRegra(regra);
      }
    }

    // Nenhuma regra aplicável: a loja informa a taxa no atendimento.
    return {
      situacao: 'indeterminada',
      centavos: null,
      rotulo: 'A combinar com a loja',
      gratis: false
    };
  }

  function taxaDeRegra(regra) {
    const centavos = Number(regra.taxaCentavos) || 0;
    return {
      situacao: centavos === 0 ? 'gratis' : 'calculada',
      centavos,
      rotulo: centavos === 0 ? 'Grátis' : formatarMoeda(centavos),
      gratis: centavos === 0
    };
  }

  function normalizarTexto(t) {
    return String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  /**
   * Distância em km entre duas coordenadas (fórmula de Haversine).
   * Só é usada quando a loja e o cliente têm coordenadas válidas.
   */
  function distanciaEntre(a, b) {
    if (!coordenadaValida(a) || !coordenadaValida(b)) return null;
    const R = 6371; // raio da Terra em km
    const rad = (g) => g * Math.PI / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 +
              Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function coordenadaValida(c) {
    return !!c && Number.isFinite(c.lat) && Number.isFinite(c.lng) &&
           Math.abs(c.lat) <= 90 && Math.abs(c.lng) <= 180;
  }

  /* ================= TOTAIS ================= */

  /**
   * Fonte única dos valores mostrados no carrinho, no checkout
   * e na mensagem do WhatsApp.
   */
  function calcularTotais(itens, config, contexto = {}) {
    const subtotal = calcularSubtotal(itens);
    const taxa = calcularTaxaEntrega(config, contexto);
    const minimo = (config && config.delivery && config.delivery.minimumOrder) ?? null;

    const faltaParaMinimo = (minimo !== null && subtotal < minimo)
      ? minimo - subtotal
      : 0;

    return {
      subtotal,
      taxa,
      // Taxa indeterminada não entra no total: o cliente não pode
      // ver um total que a loja ainda vai alterar sem avisar.
      total: subtotal + (taxa.centavos || 0),
      totalParcial: taxa.centavos === null,
      minimo,
      faltaParaMinimo,
      atingiuMinimo: faltaParaMinimo === 0
    };
  }

  /* ================= HORÁRIO DE FUNCIONAMENTO ================= */

  const DIAS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const DIAS_PT = {
    sunday: 'domingo', monday: 'segunda-feira', tuesday: 'terça-feira',
    wednesday: 'quarta-feira', thursday: 'quinta-feira',
    friday: 'sexta-feira', saturday: 'sábado'
  };
  const DIAS_PT_PLURAL = {
    sunday: 'aos domingos', monday: 'às segundas-feiras', tuesday: 'às terças-feiras',
    wednesday: 'às quartas-feiras', thursday: 'às quintas-feiras',
    friday: 'às sextas-feiras', saturday: 'aos sábados'
  };

  /** Lê data/hora no fuso configurado, sem depender do relógio local. */
  function momentoNoFuso(data, timeZone) {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    });
    const partes = Object.fromEntries(
      fmt.formatToParts(data).map(p => [p.type, p.value])
    );
    const mapa = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
    const hora = Number(partes.hour) % 24;
    return {
      diaSemana: mapa[partes.weekday],
      minutos: hora * 60 + Number(partes.minute)
    };
  }

  function emMinutos(hhmm) {
    if (typeof hhmm !== 'string' || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Estado da loja agora.
   * @returns {{ aberto, motivo, proximaAbertura, fechamentoIndefinido, configuracaoIncompleta }}
   */
  function estaAberto(businessHours, agora = new Date()) {
    if (!businessHours) {
      return {
        aberto: false, motivo: 'Horário de funcionamento não configurado.',
        proximaAbertura: null, fechamentoIndefinido: false,
        configuracaoIncompleta: true
      };
    }

    const tz = businessHours.timeZone || 'America/Sao_Paulo';
    const { diaSemana, minutos } = momentoNoFuso(agora, tz);
    const hoje = businessHours[DIAS[diaSemana]];

    const incompleta = DIAS.some(d => {
      const h = businessHours[d];
      return h && h.close === null;
    });

    // Ontem pode ter varado a madrugada (ex.: 18:00 -> 02:00).
    const ontemKey = DIAS[(diaSemana + 6) % 7];
    const ontem = businessHours[ontemKey];
    if (ontem && ontem.close) {
      const abreOntem = emMinutos(ontem.open);
      const fechaOntem = emMinutos(ontem.close);
      if (abreOntem !== null && fechaOntem !== null && fechaOntem <= abreOntem && minutos < fechaOntem) {
        return {
          aberto: true, motivo: 'Aberto agora.', proximaAbertura: null,
          fechamentoIndefinido: false, configuracaoIncompleta: incompleta
        };
      }
    }

    if (!hoje) {
      return {
        aberto: false,
        motivo: `Não abrimos ${DIAS_PT_PLURAL[DIAS[diaSemana]]}.`,
        proximaAbertura: proximaAbertura(businessHours, diaSemana, minutos),
        fechamentoIndefinido: false,
        configuracaoIncompleta: incompleta
      };
    }

    const abre = emMinutos(hoje.open);
    if (abre === null) {
      return {
        aberto: false, motivo: 'Horário de abertura não configurado.',
        proximaAbertura: null, fechamentoIndefinido: false,
        configuracaoIncompleta: true
      };
    }

    if (minutos < abre) {
      return {
        aberto: false, motivo: `Ainda fechado. Abrimos hoje às ${hoje.open}.`,
        proximaAbertura: `hoje às ${hoje.open}`,
        fechamentoIndefinido: false, configuracaoIncompleta: incompleta
      };
    }

    // Fechamento não confirmado: consideramos aberto a partir do "open"
    // e sinalizamos a pendência, em vez de inventar um horário.
    const fecha = emMinutos(hoje.close);
    if (fecha === null) {
      return {
        aberto: true, motivo: 'Aberto agora.', proximaAbertura: null,
        fechamentoIndefinido: true, configuracaoIncompleta: incompleta
      };
    }

    const aindaAberto = fecha > abre ? minutos < fecha : true;
    return {
      aberto: aindaAberto,
      motivo: aindaAberto ? 'Aberto agora.' : 'Já encerramos por hoje.',
      proximaAbertura: aindaAberto ? null : proximaAbertura(businessHours, diaSemana, minutos),
      fechamentoIndefinido: false,
      configuracaoIncompleta: incompleta
    };
  }

  function proximaAbertura(businessHours, diaAtual, minutosAgora) {
    for (let i = 0; i <= 7; i++) {
      const idx = (diaAtual + i) % 7;
      const dia = businessHours[DIAS[idx]];
      if (!dia || !dia.open) continue;
      const abre = emMinutos(dia.open);
      if (abre === null) continue;
      if (i === 0 && minutosAgora >= abre) continue;
      if (i === 0) return `hoje às ${dia.open}`;
      if (i === 1) return `amanhã às ${dia.open}`;
      return `${DIAS_PT[DIAS[idx]]} às ${dia.open}`;
    }
    return null;
  }

  /**
   * Agrupa dias consecutivos com o mesmo horário, como na referência:
   * em vez de sete linhas, sai "Segunda: Fechado" + "Terça a Domingo: ...".
   * @returns {Array<{rotulo: string, texto: string, fechado: boolean}>}
   */
  const ORDEM_SEMANA = [
    ['monday', 'Segunda'], ['tuesday', 'Terça'], ['wednesday', 'Quarta'],
    ['thursday', 'Quinta'], ['friday', 'Sexta'], ['saturday', 'Sábado'],
    ['sunday', 'Domingo']
  ];

  function textoDoDia(dia) {
    if (!dia || !dia.open) return 'Fechado';
    // Fechamento não confirmado: não inventamos um horário de encerramento
    return dia.close ? `${dia.open} às ${dia.close}` : `a partir das ${dia.open}`;
  }

  function agruparHorarios(businessHours) {
    const h = businessHours || {};
    const grupos = [];

    ORDEM_SEMANA.forEach(([chave, rotulo]) => {
      const texto = textoDoDia(h[chave]);
      const ultimo = grupos[grupos.length - 1];

      if (ultimo && ultimo.texto === texto) {
        ultimo.dias.push(rotulo);
      } else {
        grupos.push({ dias: [rotulo], texto });
      }
    });

    return grupos.map(g => ({
      rotulo: g.dias.length === 7 ? 'Todos os dias'
            : g.dias.length === 1 ? g.dias[0]
            : g.dias.length === 2 ? `${g.dias[0]} e ${g.dias[1]}`
            : `${g.dias[0]} a ${g.dias[g.dias.length - 1]}`,
      texto: g.texto,
      fechado: g.texto === 'Fechado'
    }));
  }

  /* ================= ALÉRGENOS ================= */

  /**
   * Normaliza o campo de alérgenos de um produto.
   * Produtos cadastrados antes desse campo continuam funcionando:
   * ausência de dado NÃO é tratada como "livre de alérgenos".
   */
  function lerAlergenos(produto) {
    const p = produto || {};
    const temCampo = Object.prototype.hasOwnProperty.call(p, 'alergenos');
    const lista = Array.isArray(p.alergenos)
      ? p.alergenos.map(a => String(a).trim()).filter(Boolean)
      : [];

    return {
      informado: temCampo && Array.isArray(p.alergenos),
      lista,
      contaminacaoCruzada: p.avisoContaminacaoCruzada === true,
      // Texto único, usado por card, modal e página de produto.
      texto: !temCampo || !Array.isArray(p.alergenos)
        ? 'Alérgenos não informados — consulte a equipe'
        : (lista.length ? `Contém: ${lista.join(', ')}` : 'Nenhum alérgeno cadastrado para este item')
    };
  }

  /* ================= VALIDAÇÃO DO CHECKOUT ================= */

  const PAGAMENTOS = {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    credito: 'Cartão de crédito',
    debito: 'Cartão de débito'
  };

  /**
   * Valida os dados do checkout.
   * @returns {{ valido: boolean, erros: Object<string,string> }}
   */
  function validarCheckout(dados = {}, contexto = {}) {
    const erros = {};
    const v = (c) => String(dados[c] ?? '').trim();

    if (v('nome').length < 3) {
      erros.nome = 'Informe seu nome completo.';
    } else if (!v('nome').includes(' ')) {
      erros.nome = 'Informe nome e sobrenome.';
    }

    const tel = v('telefone').replace(/\D/g, '');
    if (tel.length < 10 || tel.length > 11) {
      erros.telefone = 'Informe um telefone com DDD.';
    }

    if (!['entrega', 'retirada'].includes(v('tipoPedido'))) {
      erros.tipoPedido = 'Escolha entrega ou retirada.';
    }

    if (v('tipoPedido') === 'entrega') {
      if (v('rua').length < 3) erros.rua = 'Informe a rua.';
      if (v('numero') === '') erros.numero = 'Informe o número (ou "s/n").';
      if (v('bairro').length < 2) erros.bairro = 'Informe o bairro.';
    }

    if (!Object.keys(PAGAMENTOS).includes(v('pagamento'))) {
      erros.pagamento = 'Escolha a forma de pagamento.';
    }

    if (v('pagamento') === 'dinheiro' && dados.semTroco !== true) {
      const troco = lerValorDigitado(dados.trocoPara);
      if (troco === null) {
        erros.trocoPara = 'Informe o valor ou marque "não preciso de troco".';
      } else if (contexto.total != null && troco < contexto.total) {
        erros.trocoPara = `O valor deve ser igual ou maior que ${formatarMoeda(contexto.total)}.`;
      }
    }

    if (normalizarObs(dados.observacaoGeral).length > LIMITE_OBS) {
      erros.observacaoGeral = `Máximo de ${LIMITE_OBS} caracteres.`;
    }

    if (!contexto.temItens) erros.carrinho = 'Seu carrinho está vazio.';
    if (contexto.lojaFechada) erros.carrinho = 'A loja está fechada no momento.';
    if (contexto.abaixoDoMinimo) {
      erros.carrinho = `Pedido mínimo de ${formatarMoeda(contexto.minimo)}.`;
    }

    return { valido: Object.keys(erros).length === 0, erros };
  }

  /* ================= MENSAGEM DO WHATSAPP ================= */

  /** Junta linhas ignorando vazios, para nunca sair "undefined". */
  const linhas = (...partes) => partes.filter(p => p !== null && p !== undefined && p !== '').join('\n');

  /**
   * Monta a mensagem do pedido. Função pura: recebe tudo pronto.
   */
  function montarMensagem({ itens, cliente, totais }) {
    const c = cliente || {};
    const t = totais || {};

    const blocoEndereco = c.tipoPedido === 'entrega' ? linhas(
      '',
      'ENDEREÇO',
      linhas(
        `${c.rua}, ${c.numero}`,
        c.complemento ? `Complemento: ${c.complemento}` : null,
        `Bairro: ${c.bairro}`,
        c.referencia ? `Referência: ${c.referencia}` : null
      )
    ) : '';

    const blocoItens = (itens || []).map(item => linhas(
      `${item.qtd}x ${item.nome}`,
      (item.adicionais || []).length
        ? `Adicionais: ${item.adicionais.map(a => a.nome).join(', ')}`
        : null,
      item.obs ? `Observação: ${item.obs}` : null,
      `Subtotal: ${formatarMoeda(precoItem(item))}`
    )).join('\n\n');

    const taxaTexto = t.taxa
      ? (t.taxa.centavos === null ? t.taxa.rotulo
        : t.taxa.gratis ? 'Grátis' : formatarMoeda(t.taxa.centavos))
      : null;

    const blocoResumo = linhas(
      '',
      'RESUMO',
      `Subtotal: ${formatarMoeda(t.subtotal)}`,
      c.tipoPedido === 'entrega' && taxaTexto ? `Taxa de entrega: ${taxaTexto}` : null,
      t.totalParcial
        ? `Total parcial: ${formatarMoeda(t.total)} (+ taxa de entrega a confirmar)`
        : `Total: ${formatarMoeda(t.total)}`
    );

    const troco = c.pagamento === 'dinheiro'
      ? (c.semTroco ? 'Não precisa de troco' : `Troco para: ${formatarMoeda(c.trocoParaCentavos)}`)
      : null;

    const blocoPagamento = linhas(
      '',
      'PAGAMENTO',
      `Forma: ${PAGAMENTOS[c.pagamento] || c.pagamento}`,
      troco
    );

    const blocoObs = c.observacaoGeral ? linhas(
      '',
      'OBSERVAÇÃO GERAL',
      c.observacaoGeral
    ) : '';

    return linhas(
      'NOVO PEDIDO',
      '',
      'CLIENTE',
      `Nome: ${c.nome}`,
      `Telefone: ${c.telefone}`,
      '',
      'TIPO DO PEDIDO',
      `${c.tipoPedido === 'entrega' ? 'Entrega' : 'Retirada'}`,
      blocoEndereco,
      '',
      'ITENS',
      blocoItens,
      blocoResumo,
      blocoPagamento,
      blocoObs
    );
  }

  /** URL final do WhatsApp, com a mensagem codificada. */
  function montarUrlWhatsapp(numero, mensagem) {
    const digitos = String(numero || '').replace(/\D/g, '');
    if (!digitos) return null;
    return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
  }

  /* ================= FORMATAÇÃO ================= */

  /** Máscara de telefone: (19) 99193-8590 */
  function formatarTelefone(valor) {
    const d = String(valor || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  /** Endereço completo, com CEP. "" quando não configurado. */
  function enderecoCompleto(address) {
    const a = address || {};
    if (!a.street || !a.city) return '';
    const rua = [a.street, a.number].filter(Boolean).join(', ');
    const cidade = [a.city, a.state].filter(Boolean).join(' - ');
    return [rua, a.neighborhood, cidade, a.zipCode].filter(Boolean).join(', ');
  }

  /** URL do Google Maps para abrir a rota. "" quando não configurado. */
  function urlMapa(address) {
    const texto = enderecoCompleto(address);
    if (!texto) return '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(texto)}`;
  }

  /** URL do mapa embutido. Não exige chave de API. */
  function urlMapaEmbed(address) {
    const texto = enderecoCompleto(address);
    if (!texto) return '';
    return `https://www.google.com/maps?q=${encodeURIComponent(texto)}&z=16&output=embed`;
  }

  /** Endereço da loja em uma linha. "" quando não configurado. */
  function enderecoFormatado(address) {
    const a = address || {};
    if (!a.street || !a.city) return '';
    const rua = [a.street, a.number].filter(Boolean).join(', ');
    const local = [a.neighborhood, a.city, a.state].filter(Boolean).join(' — ');
    return [rua, local].filter(Boolean).join(' — ');
  }

  return {
    paraCentavos, formatarMoeda, lerValorDigitado,
    chaveItem, normalizarObs, LIMITE_OBS,
    precoUnitario, precoItem, calcularSubtotal,
    calcularTaxaEntrega, distanciaEntre, calcularTotais,
    estaAberto, momentoNoFuso, emMinutos, agruparHorarios,
    lerAlergenos, validarCheckout, PAGAMENTOS,
    montarMensagem, montarUrlWhatsapp,
    formatarTelefone, enderecoFormatado, enderecoCompleto, urlMapa, urlMapaEmbed
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { Loja };
if (typeof window !== 'undefined') window.Loja = Loja;
