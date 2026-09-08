# Contract: Overlay visual da colinha

**Feature**: `007-colinha-classificacao`  
**Tipo**: contrato de UI / DOM  
**Módulos**: `js/colinha.js`, `css/colinha.css`, gancho em `index.html` + `js/mesa.js`  
**Cartas**: [ADR-005](../../../docs/adr/ADR-005-cartas-html-css-svg.md) via `js/carta.js`  
**Modelo**: [data-model.md](../data-model.md)  
**Catálogo**: [colinha-catalogo.md](./colinha-catalogo.md)

Complementa o palco da 001: a colinha é **chrome**, não feltro. MUST NOT alterar o contrato [mesa-visual.md](../../001-mesa-imersiva/contracts/mesa-visual.md) das 11 cartas de jogo.

---

## 1. Âncora e fluxo

- Host: `#clube`. Nó da colinha **depois** de `#hud` no DOM (ordem de Tab).
- Posição visual: canto **superior direito** (`position: absolute` ou `fixed` relativamente ao clube).
- MUST NOT entrar no fluxo de `.palco` / `.feltro` / `.board` (não empurra comunitárias).
- MUST NOT cobrir `data-slot` 1–5, hole slots, assentos (`data-seat`) nem `#hud` no viewport de referência **1280×720** a 100% de zoom.
- Fora do 1280×720: MAY encolher miniaturas (custom properties) ou `overflow-y: auto` **somente** em `.colinha__lista`. MUST NOT cobrir a mesa nem deslocar o feltro.

`z-index`: acima do feltro o bastante para ler; o HUD continua uma faixa inferior independente.

---

## 2. Markup lógico

Papéis estáveis (classes livres; atributos de teste obrigatórios):

```text
aside[data-colinha][data-estado="visivel|oculto"][role="complementary"]
  header: h2 título + button[data-colinha-acao="ocultar"]
  p[data-colinha-sentido="melhor"]  → texto Melhor
  ol[data-colinha-lista]
    li[data-categoria="{id}"][data-ordem="{1-10}"]
      span ordem, span rótulo, .colinha__cartas > 5 slots
  p[data-colinha-sentido="pior"]    → texto Pior
button[data-colinha-acao="reabrir"] → rótulo Colinha (só no estado oculto)
```

- MUST NOT `role="dialog"` / `aria-modal="true"`.
- Título visível exatamente **Classificação de mãos**.
- Sentido exatamente **Melhor** (topo) e **Pior** (base).
- `aria-label` do aside: `Classificação de mãos`.

Quando `data-estado="oculto"`, o painel (`aside` interno ou o bloco da lista) não é visível; resta o botão **Colinha** no mesmo canto.

---

## 3. Cartas-exemplo

- Cada `li` tem **cinco** `.colinha__slot` com uma carta `data-card-role="exemplo"`, `data-face="up"`, `data-rank`, `data-suit`.
- Classe `carta--exemplo` (miniatura). Cartas extras: `carta--esmaecida` + `data-esmaecida="true"`.
- MUST NOT `data-vencedora`. MUST NOT flip / deal / burn.
- MUST NOT Unicode U+1F0A0… nem emoji como face. MUST NOT `<img>` de infográfico externo.

Idioma visual: mesmos naipes SVG e tipografia de índice da mesa (ADR-005).

---

## 4. Cromo de clube

- Fundo/borda alinhados ao feltro/rail (`--feltro`, `--rail`, `--texto`, `--rail-metal`).
- MUST NOT paleta de infográfico vermelho de site, cards brancos de dashboard ou ranking com medalhas.
- Botão **Colinha** (estado oculto): mínimo; MUST NOT competir com **Nova mão** / **Próxima mão** (menor, sem CTA primário).
- `prefers-reduced-motion: reduce`: toggle imediato; animação não é requisito.

---

## 5. Viewport

| Largura | DOM / CSS |
|---------|-----------|
| `> 900` | componente existe; painel ou botão conforme visita |
| `≤ 900` | **ausência total**: `hidden` ou equivalente + `display: none`; 0 botão no Tab |

Predicado JS: `colinhaExisteNoViewport({ width })` ≡ `width > 900` em `js/layout.js`.  
MUST NOT usar `composicaoDoViewport(...) === 'desktop'` (paisagem larga ainda tem colinha).

CSS obrigatório: `@media (max-width: 900px)` esconde `[data-colinha]` e `[data-colinha-acao]`.

---

## 6. Linhas não são controle

- `li` sem `tabindex`, sem `<button>`, sem `href`.
- MUST NOT `:hover` / `:focus` / `:active` que pareçam opção de quiz (sem outline de seleção, sem `cursor: pointer` na linha).
- Clique/tecla na linha MUST NOT disparar `ESCOLHER_OPCAO` / `ALTERNAR_OPCAO` / `CONFIRMAR`.
- MUST NOT marcar `data-certa` / `aria-current` / classe de “mão da mesa”.

---

## 7. Independência do HUD

O overlay (ou o botão) permanece no canto em `ociosa`, `deal`, `perguntando`, `sem_upgrade` e `resultado` enquanto a largura for > 900 px. MUST NOT ser filho de `#hud`. MUST NOT alterar `data-hud-estado`.

---

## 8. Testes de contrato (Node + inspeção de fonte)

1. `colinhaExisteNoViewport({ width: 901 }) === true`; `{ width: 900 }` e `{ width: 480 }` === `false`.
2. CSS contém `max-width: 900px` ocultando a colinha.
3. Fonte de `css/colinha.css` / markup gerado: título e sentidos canônicos (assertável no módulo de copy).
4. Visual 1280×720, obstrução e miniatura: [quickstart.md](../quickstart.md) (browser).
