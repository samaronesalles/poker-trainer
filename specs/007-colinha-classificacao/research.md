# Research: Colinha de classificação de mãos

**Feature**: `007-colinha-classificacao`  
**Date**: 2026-09-07  
**Status**: Completo — nenhum `NEEDS CLARIFICATION` remanescente no Technical Context.

Fontes: [spec.md](./spec.md), [constitution](../../.specify/memory/constitution.md) v1.0.0, [PRD §5.7](../../docs/prd.md), ADRs 001–007, código vivo (`js/mesa.js`, `js/carta.js`, `js/layout.js`, `css/mesa.css`).

A spec declara zero `[NEEDS CLARIFICATION]`. As decisões abaixo resolvem o “como” técnico (stack já ratificada; exemplos de cartas não congelados na spec).

---

## 1. Stack e isolamento de domínio

**Decision:** HTML + CSS + JavaScript ES modules; sem bundler, sem framework, sem backend. Novo módulo `js/colinha.js` + `css/colinha.css`. `js/mesa.js` só **monta** a colinha no `bootMesa` e no `resize`, dentro de `try/catch`. A FSM `aplicar()` **não** ganha eventos de colinha.

`js/colinha.js` MUST NOT importar `motor.js`, `storage.js`, `quiz.js` nem `baralho.js`. MAY importar `criarElementoCarta` de `carta.js` e o predicado de viewport de `layout.js`.

**Rationale:** ADR-006 pede módulos por domínio. Isolar a colinha permite fail-open (Principle VII) sem arrastar o quiz. ADR-003: esta feature **não toca o motor**. ADR-002: não passar perto do storage. O precedente `js/layout.js` já mostrou que um domínio extra além da lista mínima do ADR-006 é aceitável.

**Alternatives considered:** Lógica dentro de `mesa.js` (rejeitado — mesa já orquestra 001–006; falha da colinha não pode quebrar o boot). Importar `CATEGORIAS` de `motor.js` (rejeitado — acopla lenda a avaliador). Componente em canvas/PNG (veda ADR-005 / RN-054).

---

## 2. Catálogo ilustrativo congelado (não o baralho, não o motor)

**Decision:** Um array constante `LINHAS_COLINHA` (10 entradas, ordem 1→10) com `id`, `rotulo` RN-014, cinco `{ rank, naipe }` e índices esmaecidos. Congelado em [contracts/colinha-catalogo.md](./contracts/colinha-catalogo.md). Não é derivado de `cartasJogo`, não é reavaliado, não embaralha em **Nova mão** / **Próxima mão**. Coincidência de faces com o feltro é **permitida** — MUST NOT recalcular.

IDs iguais aos do motor (`royal_flush` … `carta_alta`) só por vocabulário de produto; a fonte é a própria constante, não `js/motor.js`.

Exemplos escolhidos para deixar cada categoria **inequívoca**:

| # | Rótulo | Cinco cartas (rank + naipe) | Esmaecidas |
|---|--------|-----------------------------|------------|
| 1 | Royal flush | A♠ K♠ Q♠ J♠ 10♠ | nenhuma |
| 2 | Straight flush | 9♥ 8♥ 7♥ 6♥ 5♥ | nenhuma |
| 3 | Quadra | 8♠ 8♥ 8♦ 8♣ K♠ | K (kicker) |
| 4 | Full house | K♠ K♥ K♦ 4♠ 4♥ | nenhuma |
| 5 | Flush | A♣ J♣ 9♣ 6♣ 3♣ | nenhuma (não consecutivo) |
| 6 | Straight | 9♠ 8♥ 7♦ 6♣ 5♠ | nenhuma (naipes mistos) |
| 7 | Trinca | Q♠ Q♥ Q♦ 9♣ 4♠ | 9 e 4 |
| 8 | Dois pares | J♠ J♥ 6♦ 6♣ 2♠ | 2 |
| 9 | Par | 10♠ 10♥ A♦ 8♣ 3♠ | A, 8, 3 |
| 10 | Carta alta | A♠ K♦ 9♣ 7♥ 4♠ | K, 9, 7, 4 |

Naipes canônicos do produto: `espadas`, `copas`, `ouros`, `paus`. Ranks: `A` `K` `Q` `J` `10` `9`…`2` (mesmo alfabeto de `js/baralho.js`, **sem** importá-lo).

**Rationale:** A spec deixa o conjunto para o plan. Congelar aqui torna o quickstart e os testes determinísticos. Royal ≠ SF (AKQJT vs 98765). Straight não é flush. Flush não é straight. Carta alta tem buracos (não é sequências). Wheel suited **não** aparece (evita confusão com royal).

**Alternatives considered:** Gerar exemplos a partir da mão (veda RN-049). Pedir ao motor “uma mão típica de C” (toca ADR-003). Embaralhar exemplos por visita (quebra SC-009). Trocar se coincidir com o feltro (veda clarificação).

---

## 3. Miniaturas = mesmo componente de carta

**Decision:** Cada face-exemplo é `criarElementoCarta({ rank, suit: naipe, papel: 'exemplo', visibilidade: 'face' })` dentro de um slot dimensionado `.colinha__slot`. Classes `carta--exemplo` (escala de miniatura) e `carta--esmaecida` (opacity baixa, sem chrome de seleção). MUST NOT Unicode U+1F0A0…, emoji, PNG de terceiros, `<img>` de infográfico.

`js/carta.js` MAY mapear `papel === 'exemplo'` → `data-card-role="exemplo"` (aditivo). Sem isso, o seletor das 11 cartas de jogo (hole/community/burn) não se mistura com a lenda.

As cartas da colinha **não** usam flip, deal, burn nem `data-vencedora`.

**Rationale:** ADR-005 + RN-049 (mesmo idioma visual). Slot próprio resolve o `position: absolute; inset: 0` de `.carta`. Papel `exemplo` evita falso positivo nos testes da mesa.

**Alternatives considered:** SVG estático por linha (duplica naipe). CSS-only “cartas” sem o componente (diverge do idioma). Reusar as 11 do feltro (veda RN-049).

---

## 4. Existência no viewport: largura > 900 px, não `composicao === 'desktop'`

**Decision:** A colinha **existe** se e somente se `window.innerWidth > 900`. Predicado puro `colinhaExisteNoViewport({ width })` em `js/layout.js` (dono atual do 900 px). CSS espelha com `@media (max-width: 900px)` (`display: none` + o JS aplica `hidden`/`inert` para tirar do Tab).

`composicaoDoViewport` **não** é o predicado: `paisagem` (ex.: 1280×500) tem largura > 900 e **deve** ter colinha (MAY encolher ou rolar por dentro). `retrato`/`estreito` (≤ 900) = ausência total.

Resize na **mesma visita**: estreito esconde painel e botão; ao voltar ao largo, restaura o estado de visita (`visível` ou `oculto`). Resize **não** é reload.

**Rationale:** FR-005 / FR-009 / clarificação de resize. `composicao === 'desktop'` mentiria na paisagem baixa.

**Alternatives considered:** Só CSS (botão **Colinha** continuaria no Tab). Só JS (flash de overlay no estreito). Usar `desktop` de `layout.js` (quebra paisagem larga).

---

## 5. Overlay no cromo, não no fluxo do feltro

**Decision:** Overlay posicionado no canto **superior direito** de `#clube` (`position: absolute` ou `fixed` relativo ao clube), **depois** de `#hud` no DOM. MUST NOT alterar flex/grid de `.palco` / `.feltro` / `.board`. MUST NOT cobrir comunitárias, hole cards, assentos nem o HUD no 1280×720 a 100%.

Fora do viewport de referência: MAY reduzir `--colinha-carta-*` ou `overflow-y: auto` **só** em `.colinha__lista`. MUST NOT `position` que empurre o feltro.

Cromo: tokens já existentes (`--feltro`, `--rail`, `--texto`, `--rail-metal`). Título **Classificação de mãos**. Indicadores visíveis exatamente **Melhor** (topo) e **Pior** (base). Sem paleta vermelha de infográfico.

**Rationale:** RN-050, FR-005, Principle VI. DOM depois do HUD entrega a ordem de Tab pedida pela clarificação (HUD primeiro).

**Alternatives considered:** Coluna que empurra o palco (veda overlay). Overlay dentro do `.feltro` (risco de cobrir o board). Portal no `<body>` antes do HUD (roubaria a primeira Tab).

---

## 6. Estado de visita e proibição de persistência

**Decision:** Estado puro `{ visibilidade: 'visivel' | 'oculto' }`, default `visivel`. Funções: `ocultar`, `reabrir`, `estadoInicial`. Vive só na instância montada. Nova montagem (reload) = visível.

MUST NOT `localStorage` / `sessionStorage` / cookie / IndexedDB. Duas abas = duas visitas. `js/storage.js` intocado. Inspeção CA-032: única chave de produto `poker-trainer:evolucao`.

Só o botão **Ocultar** oculta. MUST NOT listener de Escape nem clique-fora.

**Rationale:** RN-051, CA-032, Principle II, ADR-002. Clarificações da spec.

**Alternatives considered:** `sessionStorage` “só a aba” (ainda é persistência; veda RN-051). Cookie de UI (PII-adjacent + veda). Sincronizar abas (fora do MVP).

---

## 7. Teclado, foco e não-modal

**Decision:** A colinha **não** é `dialog` / `aria-modal`. `role="complementary"` (ou `<aside>`), `aria-label="Classificação de mãos"`. Sem armadilha de foco.

Só **Ocultar** e **Colinha** entram no Tab da colinha (`<button type="button">`). Linhas = `<ol>`/`<li>` sem `tabindex`, sem `button`, `cursor: default`, sem hover/foco de seleção. Clique na linha é no-op para o quiz (`pointer-events` das linhas não submetem opção).

Ordem de Tab da página: skip-link da 001 (já existe) → CTAs/opções do HUD → **Ocultar**/**Colinha**. Em `ociosa`, a primeira Tab de produto após o skip-link é **Nova mão**.

Foco: **Ocultar** → foca **Colinha**; **Colinha** → foca **Ocultar**. `boot` / reload MUST NOT `focus()` na colinha.

**Rationale:** Clarificações de teclado + FR-010 + SC-007. Skip-link é contrato da 001; a spec exige que a colinha **não** preceda o HUD.

**Alternatives considered:** Modal com focus trap (veda clarificação). Linhas como botões (parecem quiz — veda RN-052). `tabindex` positivo (quebra ordem natural).

---

## 8. Fail-open e movimento reduzido

**Decision:** `montarColinha(host)` envolve criação DOM + listeners em `try/catch`. Falha → remove restos, retorna `{ ok: false }`, **não** relança. `bootMesa` ignora o retorno e segue `renderHud`. MUST NOT `alert()`, modal ou jargão no HUD.

`prefers-reduced-motion: reduce`: aparecer/sumir **imediato** (sem exigir `@keyframes`). Sem SFX próprio (ADR-007 intocado).

**Rationale:** FR-011, Principle VII, SC-006.

**Alternatives considered:** Overlay estático no HTML sem JS (falha de CSS mostraria chrome vazio no estreito). Banner de erro (veda fail-open).

---

## 9. Testes sem bundler

**Decision:** (1) [quickstart.md](./quickstart.md) no browser `http://`. (2) `tests/contract/colinha.test.js` com `node --test`: catálogo (rótulos, ordem, 5 cartas, esmaecidas), máquina de visita, predicado > 900, leitura de fonte de `js/colinha.js` / `js/mesa.js` (não referencia `localStorage` nem `./motor.js`). Visual, Tab e 1280×720 só no browser.

**Rationale:** Mesmo padrão 001–006. Custo zero. FSM da mesa não precisa de eventos novos.

**Alternatives considered:** Playwright (dependência contra o mínimo). Zero teste automático do catálogo (SC-008 ficaria só manual).

---

## Registro de escolhas (ambíguo → padrão)

| Tema | Escolha |
|------|---------|
| Módulo | `js/colinha.js` + `css/colinha.css`; gancho fail-open em `mesa.js` |
| Catálogo | 10 linhas congeladas (tabela §2); sem motor / sem baralho |
| Miniaturas | `criarElementoCarta` + papel `exemplo` + `.carta--esmaecida` |
| Viewport | existe ↔ largura > 900 px (não `composicao === 'desktop'`) |
| DOM | depois de `#hud`; position overlay; não empurra feltro |
| Persistência | nenhuma; default visível a cada load |
| Teclado | HUD primeiro; sem modal; foco no toggle restante |
| Escape / clique fora | não dispensam |
| Testes | quickstart + `node --test` em `colinha.test.js` |
| Specs 001–006 | não alterar |
