# Testes — Buck's Burguer

## 1. Testes automatizados

Cobrem as **regras de negócio** (`js/loja.js`), que são funções puras sem DOM.

```bash
node tests/testes.js
```

Última execução: **59 passaram, 0 falharam**.

O que está coberto:

| Área | Casos |
| --- | --- |
| Dinheiro | conversão para centavos, ausência de erro de float, formato pt-BR, leitura de valor digitado |
| Carrinho | subtotal com adicionais e quantidade, carrinho vazio, agrupamento por observação igual, separação por observação diferente, ordem dos adicionais, limite de 200 caracteres |
| Entrega | retirada sem taxa, taxa indeterminada sem regras, regra por bairro, regra por CEP, frete grátis só com distância medida, Haversine, total com taxa, total parcial, pedido mínimo |
| Horário | segunda fechada, antes de abrir, depois de abrir, fuso da loja vs. do visitante, fechamento não confirmado, turno que vira a madrugada, configuração ausente |
| Alérgenos | produto sem o campo, produto com lista, lista vazia, contaminação cruzada, catálogo sem alérgeno não confirmado |
| Checkout | retirada válida, nome incompleto, telefone não exigido, endereço só na entrega, dinheiro com/sem troco, troco menor que o total, carrinho vazio, loja fechada, abaixo do mínimo |
| Mensagem | **formato conferido linha a linha contra o modelo**, todos os blocos, ausência de `undefined` e de telefone, retirada sem endereço, observação vazia não vira linha solta, "não preciso de troco", total parcial, valores idênticos aos do carrinho, `encodeURIComponent` |
| Dados comerciais | endereço vazio não vira texto, contatos não confirmados ausentes, máscara de telefone |

## 2. Verificações estáticas executadas

- `node --check` em todos os 7 arquivos JS — sem erro de sintaxe.
- Script de fiação: os 39 `id` procurados pelo JS existem no HTML ou são criados por ele.
- Ordem dos scripts idêntica nas 5 páginas: `config → loja → modal → carrinho → checkout → cardapio → main`.
- `grep`: nenhum `prompt()` nem `alert()` restante no código.
- `grep`: nenhum dado comercial fictício nos HTML.
- Todas as páginas e assets respondem HTTP 200.
- `sitemap.xml` e `produtos.json` validados como XML/JSON.

## 3. Roteiro de teste manual

O ambiente não tem navegador nem jsdom, então **os fluxos de interface abaixo
não foram executados** — precisam ser rodados por você no navegador.

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

### 3.1 Carrinho e observações
- [ ] Adicionar um item pelo "+" do cardápio → o modal abre com nome, alérgenos, quantidade e observação.
- [ ] Escrever uma observação, adicionar, abrir o carrinho → a observação aparece no item.
- [ ] Editar a observação direto no carrinho (sem `prompt`) → salva ao sair do campo e pelo botão.
- [ ] Aumentar a quantidade → a observação permanece.
- [ ] Adicionar o mesmo produto **com a mesma** observação → vira uma linha com quantidade 2.
- [ ] Adicionar o mesmo produto **com observação diferente** → vira duas linhas separadas.
- [ ] Digitar mais de 200 caracteres → o campo trava e o contador mostra 200/200.

### 3.2 Checkout
- [ ] Carrinho vazio → botão "Finalizar pedido" desabilitado, com aparência de desabilitado.
- [ ] Selecionar **Entrega** → os campos de endereço aparecem; **Retirada** → somem.
- [ ] Selecionar **Dinheiro** → o campo de troco aparece; PIX/cartão → some.
- [ ] Marcar "Não preciso de troco" → o campo de valor some.
- [ ] Enviar com campos vazios → erros aparecem **junto de cada campo**, e o que já foi digitado permanece.
- [ ] Não existe campo de telefone; a nota explicando o porquê aparece sob o nome.
- [ ] Informar troco menor que o total → erro específico com o valor mínimo.
- [ ] Enviar válido → abre o WhatsApp com a mensagem formatada.
- [ ] Conferir que os valores da mensagem batem com os do resumo na tela.

### 3.3 Horário
- [ ] Numa segunda-feira (ou alterando `businessHours` temporariamente) → header mostra "Fechado agora", carrinho bloqueia o envio e informa a próxima abertura.
- [ ] Em dia útil antes das 18h → bloqueado, com "Abrimos hoje às 18:00".

### 3.4 Acessibilidade e teclado
- [ ] Tab a partir do topo → o primeiro foco é "Pular para o conteúdo".
- [ ] Com o carrinho fechado, navegar por Tab → o foco **não** entra no painel.
- [ ] Abrir o checkout → foco vai para o campo Nome; Tab não sai do diálogo.
- [ ] `Esc` fecha o diálogo; o foco volta para o ícone do carrinho.
- [ ] Clicar fora do diálogo → fecha.
- [ ] Todo foco tem contorno dourado visível.

### 3.5 Breakpoints
Conferir em 320, 375, 768, 1024 e 1440 px:
- [ ] Sem rolagem horizontal.
- [ ] O diálogo do checkout sobe de baixo no celular e é rolável.
- [ ] O carrossel da semana mostra 1 / 2 / 3 / 4 cards conforme a largura.
- [ ] O rodapé empilha corretamente.

### 3.6 Estados de dados ausentes
- [ ] Como `address` está vazio → nenhuma seção de endereço ou mapa aparece.
- [ ] Como `phone`/`email`/`instagram` estão vazios → só o WhatsApp aparece no contato.
- [ ] Produto sem alérgenos → mostra "Alérgenos não informados — consulte a equipe" (nunca "livre de").
- [ ] `produto.html?id=999` → "Produto não encontrado" com link para o cardápio.
- [ ] Console do navegador sem erros em todos os fluxos.
