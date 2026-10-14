# Buck's Burguer — site

Site institucional + cardápio + pedido pelo WhatsApp.
HTML, CSS e JavaScript puros, sem build e sem dependências.

## Cache do navegador

Os links de CSS e JS carregam com `?v=N`. Ao alterar um desses arquivos,
**incremente o número nas 5 páginas** — senão o navegador continua
servindo a versão antiga e a mudança parece não ter sido feita:

```bash
sed -i 's/?v=7/?v=8/g' *.html
```

## Publicar

Ver **[DEPLOY.md](DEPLOY.md)** — Cloudflare Pages, sem build, deploy a
cada push no `main`.

## Rodar

O cardápio é carregado de `data/produtos.json` via `fetch`, então é preciso
servir por HTTP (abrir o arquivo com duplo clique não funciona):

```bash
npx wrangler dev
# http://localhost:8787
```

Use o `wrangler dev`, não um servidor estático simples: os links
internos apontam para **URLs limpas** (`/cardapio`, não
`/cardapio.html`), que só funcionam com o mesmo tratamento de assets
da produção. Num `python3 -m http.server` a navegação interna dá 404.

## Estrutura

```
bucks-burger/
├── index.html · cardapio.html · produto.html · contato.html · 404.html
├── robots.txt · sitemap.xml          (SEO — ver "Domínio" abaixo)
├── css/    global.css · components.css · responsive.css
├── js/
│   ├── config.js     ← CONFIGURAÇÃO CENTRAL (mexa aqui)
│   ├── loja.js       ← regras de negócio, funções puras e testáveis
│   ├── modal.js      ← diálogo acessível reutilizável
│   ├── carrinho.js   ← estado do carrinho + painel lateral
│   ├── checkout.js   ← formulário de identificação + WhatsApp
│   ├── cardapio.js   ← catálogo, carrossel, página de produto
│   └── main.js       ← header, animações e dados comerciais na tela
├── data/produtos.json
└── assets/images · assets/icons
```

**Separação de responsabilidades:** `config.js` guarda os dados, `loja.js`
guarda as contas (sem tocar no DOM, por isso é testável), e os demais
arquivos só cuidam de interface. Carrinho, checkout e mensagem do WhatsApp
usam a **mesma** função de cálculo, então os três nunca divergem.

---

# Como configurar

Tudo o que muda de loja para loja está em **[js/config.js](js/config.js)**.
Nenhum endereço, telefone ou horário está escrito no HTML.

> **Regra do projeto:** campo vazio (`""` ou `null`) significa *dado não
> confirmado*, e o site **esconde** o bloco correspondente em vez de exibir
> um valor de exemplo. Nunca preencha "só para não ficar vazio".

### Contatos comerciais

```js
whatsapp:  "5599999999999",   // placeholder — troque pelo número real
phone:     "",               // fixo — enquanto vazio, não aparece
email:     "",               // enquanto vazio, não aparece
instagram: "",               // só o usuário, sem "@"
```

### Endereço

```js
address: {
  street: "", number: "", neighborhood: "",
  city: "", state: "", zipCode: "",
  coords: null              // { lat: -22.9, lng: -47.0 }
}
```

Enquanto `street` e `city` estiverem vazios, **somem** do site: o bloco
"Estamos em" da home, o mapa e o bloco de endereço da página de contato.

Com o endereço preenchido, o site monta sozinho o texto completo, o link
"Como chegar" e o **mapa embutido do Google Maps** — sem chave de API e
sem endereço escrito no HTML. Para trocar de endereço basta mexer aqui.

`coords` continua opcional: só é necessário para calcular frete por
distância, não para o mapa.

### Horários

```js
businessHours: {
  timeZone: "America/Sao_Paulo",
  monday: { open: "18:30", close: "01:00" },
  ...
}
```

- `null` no dia = fechado o dia inteiro.
- `close: null` = **fechamento ainda não confirmado**. O site mostra
  "a partir das 18:30" e sinaliza a pendência, em vez de inventar.
- **Turno que vira a madrugada funciona**: `close` menor que `open`
  (como `18:30 → 01:00`) é entendido como o dia seguinte.
- Dias consecutivos com o mesmo horário são agrupados sozinhos na tela:
  sete dias iguais viram "Todos os dias"; variações viram
  "Terça a Quinta", "Sexta e Sábado" etc.

Quando a loja está fechada, o botão de finalizar fica desabilitado e o
carrinho explica o motivo e a próxima abertura.

### Taxa de entrega e pedido mínimo

```js
delivery: {
  freeRadiusKm: 1.5,
  minimumOrder: null,   // em CENTAVOS: 3000 = R$ 30,00
  feeRules: []
}
```

> **Regras por distância ainda não funcionam.** O projeto não calcula
> distância: falta `address.coords` da loja *e* as coordenadas do
> cliente (o checkout coleta endereço em texto). Regras `tipo: "distancia"`
> cadastradas são ignoradas, e o motivo aparece no console do navegador
> como `[entrega] regra por distância ignorada: ...`. Regras por
> **bairro** e por **CEP** funcionam.

Três formatos de regra, avaliados na ordem da lista:

```js
feeRules: [
  { tipo: "bairro",    bairros: ["Centro", "Vila Nova"], taxaCentavos: 500 },
  { tipo: "cep",       de: "13000000", ate: "13099999",  taxaCentavos: 700 },
  { tipo: "distancia", ateKm: 3,                          taxaCentavos: 0 }
]
```

- **Sem regras cadastradas**, a taxa sai como "A combinar com a loja" e o
  total é declarado como **parcial** — na tela e na mensagem do WhatsApp.
- **Frete grátis por raio só é aplicado com distância real medida**, o que
  exige `address.coords` e as coordenadas do cliente. Como o checkout coleta
  o endereço em texto, isso ainda não acontece — por isso o card da home diz
  "Consulte as condições" em vez de prometer gratuidade.
- `minimumOrder` preenchido faz o carrinho mostrar quanto falta e bloquear a
  finalização.

### Domínio

```js
siteUrl: ""
```

Quando o domínio existir:

1. Preencha `siteUrl` em `config.js`.
2. Nos 5 HTML, descomente o bloco `<!-- ================= COMPARTILHAMENTO -->`
   e troque `SEU-DOMINIO` (habilita `canonical`, `og:url`, `og:image`).
3. Em `sitemap.xml`, troque todas as ocorrências de `SEU-DOMINIO` e atualize
   `<lastmod>`.
4. Em `robots.txt`, descomente a linha `Sitemap:`.

### Imagem de compartilhamento

```js
socialImage: ""
```

Coloque um arquivo de **1200 × 630 px** (JPG ou PNG, até ~300 KB) em
`assets/images/og-capa.jpg` e aponte aqui. Sem ela, as meta tags `og:image`
ficam comentadas de propósito: apontar para uma imagem inexistente quebra o
preview do link no WhatsApp.

### Alérgenos

Em `data/produtos.json`, cada produto aceita dois campos **opcionais**:

```json
{
  "alergenos": ["glúten", "lactose", "ovo"],
  "avisoContaminacaoCruzada": false
}
```

- Campo **ausente** = não conferido → o site **não exibe nada** sobre
  alérgenos naquele produto (nem no card, nem no modal, nem na página).
- Lista **vazia** `[]` = conferido, nenhum alérgeno.
- O site **nunca** afirma que um produto é livre de algo sem o cadastro:
sem dado, ele simplesmente cala. Quem tem restrição usa o campo de
observação, que acompanha o item até a mensagem do WhatsApp.

O vocabulário sugerido e um exemplo da estrutura estão no bloco
`_alergenos` no topo do próprio `produtos.json`. Hoje **nenhum produto tem
alérgeno cadastrado** — preencha junto com a cozinha antes de divulgar.

---

## Imagens

Todo espaço de foto é uma `<div class="ph">` com rótulo e um comentário HTML
acima indicando o arquivo esperado. Para inserir:

```html
<div class="ph" style="background-image:url('assets/images/hero-burger.png')"></div>
```

O rótulo some sozinho quando há `url` no `style`.

| Arquivo | Onde aparece | Situação |
| --- | --- | --- |
| `assets/images/logo.jpg` | Logo no header, nas duas faixas do rodapé e favicon | **colocada** |
| `assets/images/noitedoDate.jpg` | Cartaz da seção Reservas | **colocada** |
| `assets/images/hero-banner.webp` | Banner de fundo do hero | **colocada** |
| `assets/images/hero-tijolo.jpg` | Fundo da seção de delivery | falta |
| `assets/images/cardapio-topo.jpg` | Topo do cardápio | falta |
| `assets/images/produto-topo.jpg` | Topo da página de produto | falta |
| `assets/images/contato-topo.jpg` | Topo do contato | falta |
| fotos dos produtos | campo `imagem` de cada item do `produtos.json` | falta |

> As imagens são otimizadas antes de entrar: JPEG progressivo, qualidade
> 80–82, redimensionado para no máximo ~3x o tamanho de exibição.
> `hero-banner.webp` veio de um original de 522 KB; `noitedoDate.jpg` de
> 281 KB. Os originais ficam no histórico do git, não na pasta.

> O cartaz da Noite do Date tem o texto embutido na imagem ("sexta-feira,
> casal R$ 99,99, mediante reserva"). Isso está descrito no `alt` para
> leitores de tela, mas **trocar a promoção exige trocar a imagem** — o
> preço não sai de nenhuma configuração.

As fotos dos produtos ficam no campo `imagem` de cada item do
`produtos.json`.

## Identidade visual

| Token | Hex | Uso |
| --- | --- | --- |
| `--preto` | `#0B0B0B` | Fundo e estrutura |
| `--vermelho` | `#C51F28` | Destaques e bordas |
| `--dourado` | `#D9A928` | Preços e detalhe premium |
| `--verde` | `#567B32` | Tag veggie |
| `--marrom` | `#713A22` | Elementos rústicos |

Anton nos títulos, Caveat nos manuscritos, Montserrat nos textos e preços.

## Privacidade

Os dados do checkout (nome e, na entrega, endereço) ficam **apenas em memória**
e no formulário durante o preenchimento. Não vão para `localStorage`, não são
enviados a terceiros e só seguem para o WhatsApp da loja por ação explícita
do cliente. O `localStorage` guarda somente o carrinho em montagem.

O checkout **não pede telefone**: o pedido é enviado pelo WhatsApp da
própria cliente, então a loja já responde na mesma conversa. É um dado a
menos coletado e um campo a menos para preencher.
