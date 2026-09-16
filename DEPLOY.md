# Publicar no Cloudflare Pages

O site é estático (HTML, CSS e JS puros, sem build), então o Cloudflare
Pages serve os arquivos direto do repositório. Cada `git push` no `main`
publica sozinho.

---

## 1. Conectar o repositório

1. Entre em **dash.cloudflare.com** → menu lateral **Workers & Pages**
2. **Create** → aba **Pages** → **Connect to Git**
3. Autorize o GitHub e escolha **`giovana-v/bucks-burger`**
   (funciona com repositório privado, sem custo)

## 2. Configurar o build

O site não tem etapa de build. Preencha exatamente assim:

| Campo | Valor |
| --- | --- |
| Project name | `bucks-burger` *(vira `bucks-burger.pages.dev`)* |
| Production branch | `main` |
| Framework preset | **None** |
| Build command | *(deixe vazio)* |
| Build output directory | `/` |

Clique em **Save and Deploy**. O primeiro deploy leva menos de um minuto.

## 3. Conferir

Abra a URL `.pages.dev` e verifique:

- [ ] Home carrega com banner, cardápio da semana e mapa
- [ ] Cardápio lista os 12 produtos
- [ ] Adicionar ao carrinho e finalizar abre o WhatsApp certo
- [ ] `/404.html` — uma URL inexistente cai na página de erro
- [ ] `/robots.txt` responde

---

## 4. Domínio próprio (opcional)

1. No projeto do Pages → **Custom domains** → **Set up a domain**
2. Se o domínio já estiver na Cloudflare, o DNS é configurado sozinho
3. Se estiver no registro.br, aponte os nameservers para a Cloudflare

O certificado HTTPS é emitido automaticamente.

### Depois que o domínio existir

Três ajustes que hoje estão esperando por isso:

**a) `js/config.js`**
```js
siteUrl: "https://seudominio.com.br",
```

**b) Nas 5 páginas HTML** — descomente o bloco
`<!-- ================= COMPARTILHAMENTO -->` e troque `SEU-DOMINIO`.
Isso liga `canonical`, `og:url` e `og:image`, que fazem o link ter
preview ao ser compartilhado no WhatsApp.

**c) `sitemap.xml` e `robots.txt`** — troque `SEU-DOMINIO` e descomente
a linha `Sitemap:`.

```bash
# Com o domínio definido, os três de uma vez:
sed -i 's|SEU-DOMINIO|seudominio.com.br|g' *.html sitemap.xml robots.txt
```

---

## O que já está configurado

- **`_headers`** — cache e cabeçalhos de segurança. HTML sempre
  revalida, CSS/JS têm cache de 1 hora (o `?v=N` invalida na hora),
  `produtos.json` tem 5 minutos para mudança de preço chegar rápido,
  imagens têm 7 dias.
- **`404.html`** — o Cloudflare Pages usa automaticamente.
- **`robots.txt`** — libera as páginas públicas, mantém CSS/JS
  acessíveis ao Google e tira `/tests/` do índice.

## Atenção ao publicar

`js/config.js` fica **público** — é assim que tem de ser, pois o
navegador precisa lê-lo. Só contém dados comerciais (WhatsApp,
endereço, horários), nada sigiloso. **Nunca coloque chave de API
nesse arquivo.**

Ao alterar CSS ou JS, incremente o `?v=N` nas 5 páginas:

```bash
sed -i 's/?v=7/?v=8/g' *.html
```
