# Contract: Mesa visual (feltro, cartas, board, pote)

**Feature**: `001-mesa-imersiva`  
**Tipo**: contrato de UI / DOM  
**Stack**: ADR-005 (cartas HTML/CSS + naipes SVG), ADR-006 (shell estático)

Complementa [hud-session.md](./hud-session.md). Este arquivo fixa o palco; o HUD fixa a cadência.

---

## 1. Shell

- Um único `index.html` na raiz. Sem rotas, sem SPA router, sem hash de “página de quiz”.
- Durante o treino: chrome de página (header, rodapé, créditos) mínima ou inexistente.
- Ambiente escuro de clube. Feltro oval verde-mesa profundo (não lima). Rail madeira ou borracha escura. Vinco oval. Holofote no centro (comunitárias no ponto mais claro).
- MUST NOT: fundo branco de landing, logo gigante, dashboard, mascote falante, confetes infantis, chat, emotes, rake, lobby, foto de cassino stock.

**Viewport de referência:** 1280×720 CSS px. Nesse tamanho, feltro + 3 assentos + 5 slots + HUD cabem sem cortar cartas até ilegíveis (~70 cm).

**Degradação:** viewport estreita → HUD MAY empilhar abaixo; cartas não se sobrepõem até ilegíveis. Imersão no celular NÃO precisa igualar o desktop.

---

## 2. Assentos

| `data-seat` | Apelido visível | Posição |
|-------------|-----------------|--------|
| `voce` | Você | Inferior, maior, “lugar do player” |
| `adversarioA` | Adversário A | Oposta / diagonal — estável |
| `adversarioB` | Adversário B | Oposta / diagonal — estável |

Cada assento: avatar ilustrado (SVG/CSS, não foto real), apelido, stack de fichas cênico, dois slots de hole.

MUST NOT: input para o usuário nomear o assento.

---

## 3. Componente carta

Estrutura lógica (nomes de classe/id livres, papéis estáveis):

- Face: rank tipográfico grande + naipe SVG (copas/ouros vermelhos; espadas/paus pretos).
- Verso: um único padrão para todas as fechadas.
- Flip/deal: CSS `transform` (translação + `rotateY`). MUST NOT Unicode U+1F0A0… nem emoji como carta principal. MUST NOT 52 PNGs como face principal.

Estados visuais: `vazia` (slot sem carta), `verso`, `face`, `animando`.

Atributos recomendados para teste: `data-card-role="hole|community|burn"`, `data-face="up|down|empty"`, `data-rank`, `data-suit`.

### Burn (obrigatório nesta feature — pesquisa)

- Aparece no turn e no river como verso teatral breve.
- MUST NOT ocupar `data-slot` 1–5.
- MUST NOT substituir uma das 11 cartas de jogo stub.
- Some antes ou ao abrir a comunitária da street.

---

## 4. Board

Cinco slots fixos no centro:

| `data-slot` | Street |
|-------------|--------|
| 1, 2, 3 | Flop (alinhados) |
| 4 | Turn |
| 5 | River |

Slots ainda não da street: visíveis e vazios. Flop preenche 1–3 em sequência rápida (ou corte imediato se movimento reduzido).

---

## 5. Pote cênico

- Bolo de fichas sem valor numérico em bb.
- `resultado` com um vencedor: bolo caminha visualmente ao assento.
- `resultado` split: bolo divide-se entre os vencedores (mão 2+ do stub: Você e Adversário A).
- MUST NOT: apostas, blinds, raises, fold, side pot, dealer button funcional, timer.

---

## 6. HUD (layout)

Faixa inferior / painel sobre o feltro, estilo barra de ações de client de poker.

- Fundo escuro/translúcido, tipografia nítida, alto contraste.
- Opções: botões grandes; desktop grade 2×3 ou 3×2.
- Estados de opção: padrão, hover, foco, correto, errado-desabilitado (permanece no lugar, opacidade reduzida, não clicável).
- Feedback no próprio HUD (flash + texto), não no topo da página, não em popup.

MUST NOT cobrir as cartas a ponto de impedir a leitura do board no desktop de referência.

---

## 7. Movimento

| Momento | Visual |
|---------|--------|
| Deal | Leque/deslize até o assento; herói abre ao pousar; A/B verso |
| Flop | Três cartas em sequência rápida nos slots 1–3 |
| Turn / river | Burn cênico + carta no slot 4 ou 5 |
| Showdown | Depois do river no slot 5, flip no lugar das hole de A e B |
| Próxima mão | Recolhimento + novo deal, mesma mesa |
| `prefers-reduced-motion: reduce` | Cartas já sentadas; 0 s de voo |

Teto: 2 s / street na primeira mão da sessão; ≈ 1 s depois. Quiz só depois do pouso (exceto movimento reduzido, que conta como pouso imediato).

---

## 8. Checklist visual (aceitação)

- [ ] CA-001: ociosa completa (feltro, 3 assentos nomeados, 5 slots, pote, Nova mão, 0 opções).
- [ ] CA-002: flop pousado + HUD perguntando visível na mesa.
- [ ] CA-003: flop/turn → A e B `data-face="down"`.
- [ ] CA-004: primeira pergunta do river → seis hole `up` e slot 5 preenchido.
- [ ] CA-005: Próxima mão recolhe e redestribui sem sair do clube.
- [ ] CA-026: durante qualquer voo/virada, 0 opções clicáveis.
- [ ] Split visual na segunda mão stub.
- [ ] Burn visível e fora do board.
- [ ] 1280×720: nada essencial cortado até carta ilegível.
