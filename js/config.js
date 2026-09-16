/* ============================================================
   BUCK'S BURGUER — CONFIGURAÇÃO CENTRAL
   ------------------------------------------------------------
   FONTE ÚNICA DE VERDADE dos dados comerciais.
   Nada aqui deve ser duplicado no HTML: a interface lê deste
   arquivo e esconde o que não estiver preenchido.

   REGRA: campo vazio ("" ou null) = dado ainda NÃO confirmado.
   A interface não renderiza link nem texto para campo vazio.
   Nunca preencha com valor de exemplo "só para não ficar vazio".
   ============================================================ */

const BUSINESS_CONFIG = {
  /* ---------- Identificação ---------- */
  name: "Buck's Burguer",

  /* ---------- Contatos ----------
     whatsapp: confirmado pela proprietária em 16/09/2026.
     Formato: só dígitos, com DDI 55.                         */
  whatsapp: "5519991938590",

  // TODO: confirmar telefone fixo. Enquanto vazio, não aparece no site.
  phone: "",
  // TODO: confirmar e-mail comercial. Enquanto vazio, não aparece no site.
  email: "",
  // TODO: confirmar @ do Instagram (sem o "@"). Enquanto vazio, não aparece.
  instagram: "",

  /* ---------- Endereço ----------
     TODO: preencher com o endereço real da loja.
     Enquanto street/city estiverem vazios, o site não exibe
     endereço nem link de mapa em lugar nenhum.               */
  address: {
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    // Coordenadas da loja — necessárias para calcular distância.
    // TODO: preencher { lat, lng } se quiser frete por distância.
    coords: null
  },

  /* ---------- Domínio ----------
     TODO: preencher quando o domínio estiver registrado.
     Sem isso o site não gera canonical, og:url nem sitemap
     com URL absoluta.                                        */
  siteUrl: "",

  /* ---------- Imagem de compartilhamento ----------
     TODO: colocar o arquivo em assets/images/ e apontar aqui.
     Recomendado: 1200x630 px, JPG ou PNG, até ~300 KB.
     Enquanto vazio, as meta tags og:image não são geradas.   */
  socialImage: "",

  /* ---------- Horário de funcionamento ----------
     timeZone fixo para não depender do relógio do visitante.
     null           = não abre nesse dia.
     close: null    = horário de fechamento AINDA NÃO CONFIRMADO.
                      O site trata o dia como aberto a partir do
                      "open" e sinaliza a pendência, em vez de
                      inventar um horário.
     TODO: confirmar os horários de fechamento de cada dia.    */
  businessHours: {
    timeZone: "America/Sao_Paulo",
    monday:    null,                          // confirmado: não abre
    tuesday:   { open: "18:00", close: null }, // TODO: confirmar fechamento
    wednesday: { open: "18:00", close: null }, // TODO: confirmar fechamento
    thursday:  { open: "18:00", close: null }, // TODO: confirmar fechamento
    friday:    { open: "18:00", close: null }, // TODO: confirmar fechamento
    saturday:  { open: "18:00", close: null }, // TODO: confirmar fechamento
    sunday:    { open: "18:00", close: null }  // TODO: confirmar fechamento
  },

  /* ---------- Entrega ----------
     freeRadiusKm: raio de entrega gratuita divulgado.
       Só é APLICÁVEL se address.coords existir E o cliente
       informar coordenadas. Como hoje o checkout coleta apenas
       endereço em texto, o site NÃO promete frete grátis:
       a taxa sai como "a combinar com a loja".

     minimumOrder: pedido mínimo em CENTAVOS (ex.: 3000 = R$ 30).
       null = sem pedido mínimo. TODO: confirmar se existe.

     feeRules: regras de taxa, avaliadas na ordem.
       Formatos aceitos (ver js/loja.js):
         { tipo: "bairro",    bairros: ["centro"], taxaCentavos: 500 }
         { tipo: "cep",       de: "13000000", ate: "13099999", taxaCentavos: 700 }
         { tipo: "distancia", ateKm: 3, taxaCentavos: 0 }
       Lista vazia = nenhuma taxa pode ser calculada.
     TODO: cadastrar as regras reais de taxa por bairro/CEP.   */
  delivery: {
    freeRadiusKm: 1.5,
    minimumOrder: null,
    feeRules: []
  }
};

/* Disponibiliza em ambos os ambientes (navegador e Node, para os testes) */
if (typeof module !== 'undefined' && module.exports) module.exports = { BUSINESS_CONFIG };
if (typeof window !== 'undefined') window.BUSINESS_CONFIG = BUSINESS_CONFIG;
