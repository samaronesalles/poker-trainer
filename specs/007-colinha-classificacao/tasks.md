---
description: "Task list for feature implementation"
---

# Tasks: Colinha de classificação de mãos

**Input**: Design documents from `/specs/007-colinha-classificacao/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Pedidos explicitamente no plan.md (Testing) / research.md §9 / `contracts/colinha-catalogo.md` §4 / `contracts/colinha-overlay.md` §8 / `contracts/colinha-visita.md` §8 — `node --test` em `tests/contract/colinha.test.js` (arquivo **novo**). Sem Playwright/Cypress, sem bundler. Validação visual/teclado/resize via `quickstart.md` (S1–S8). Os `tests/contract/` das features 001–006 MUST continuar passando.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Site estático na raiz do repositório (ADR-006 / plan.md): `index.html`, `css/`, `js/`, `assets/`, `tests/contract/`. **MUST** criar `js/colinha.js` + `css/colinha.css`. **MUST** gancho fail-open em `js/mesa.js` (`bootMesa` + `resize` apenas). **MUST** predicado `colinhaExisteNoViewport` em `js/layout.js`. **MAY** papel `'exemplo'` em `js/carta.js` e modificadores em `css/cartas.css`. Overlay criado em JS **depois** de `#hud` dentro de `#clube`. **MUST NOT** importar `js/motor.js`, `js/baralho.js`, `js/quiz.js` nem `js/storage.js` a partir de `js/colinha.js`. **MUST NOT** `js/mesa.js` importar `js/motor.js` nem chamar `localStorage`. **MUST NOT** persistir preferência (`localStorage` / `sessionStorage` / cookie / IndexedDB). **MUST NOT** alterar specs 001–006 nem `js/motor.js`, `js/quiz.js`, `js/storage.js`, `js/baralho.js`, `js/audio.js`, `css/mesa.css`, `css/hud.css`. UI visível MUST ser pt-BR (título **Classificação de mãos**, **Melhor** / **Pior**, **Ocultar** / **Colinha**, rótulos RN-014 exatos).

## Escolhas registradas (ambíguo → padrão)

- Testes automatizados: **incluir** (plan.md Testing + research.md §9 + contratos §4/§8). Visual, Tab, 1280×720 e resize permanecem manuais (quickstart S1–S8).
- TDD nas fases de história: escrever os asserts de `tests/contract/colinha.test.js` **antes** da implementação daquela história e garantir que falham.
- Git: permanecer em `007-colinha-classificacao`.
- Módulo: domínio novo `js/colinha.js` (ADR-006). Catálogo ilustrativo próprio — MUST NOT importar `CATEGORIAS` de `js/motor.js`.
- Existência: `colinhaExisteNoViewport({ width })` ≡ `width > 900` em `js/layout.js`. MUST NOT usar `composicaoDoViewport(...) === 'desktop'` (paisagem larga ainda tem colinha).
- Catálogo: constante congelada `LINHAS_COLINHA` (tabela `contracts/colinha-catalogo.md` §2). Coincidência com o feltro **permitida** — MUST NOT recalcular.
- Miniaturas: `criarElementoCarta({ rank, suit: naipe, papel: 'exemplo', visibilidade: 'face' })`. Classes `carta--exemplo` / `carta--esmaecida`. MUST NOT Unicode U+1F0A0…, emoji, PNG de terceiros, `<img>` de infográfico.
- DOM: overlay depois de `#hud`; `role="complementary"`; MUST NOT `dialog` / `aria-modal`. Só **Ocultar** dispensa (não Escape, não clique fora).
- Persistência: nenhuma chave nova. Default `visivel` a cada load. `js/storage.js` intocado.
- Fail-open: `montarColinha` retorna `{ ok: false }` sem relançar; `bootMesa` segue `renderHud`. Sem `alert` / modal.
- Lint/format: **não** adicionar ESLint/Prettier (YAGNI / constitution III).
- Relatório / zerar / lib / backend / cola ao vivo / colinha no ≤ 900 px / persistir oculto / destacar a mão da mesa: ausentes.
- Rule LGPD: atualizar `.cursor/rules/lgpd-sessao-sem-pii.mdc` no polish (contexto 001–007; MUST NOT gravar preferência da colinha).
- Specs 001–006: **não** alterar.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Encaixar o domínio `colinha` no site estático já entregue pelas 001–006, sem backend, sem bundler e sem lib de poker

- [X] T001 Create DOM-free-capable ES module `js/colinha.js` with placeholder exports `LINHAS_COLINHA`, `ROTULO_TITULO`, `ROTULO_MELHOR`, `ROTULO_PIOR`, `ROTULO_OCULTAR`, `ROTULO_COLINHA`, `estadoInicial`, `ocultar`, `reabrir`, `montarColinha` and `sincronizarViewport`; header MUST state “colinha de classificação — lenda estática, sem motor, sem storage”; MUST NOT import `js/motor.js`, `js/baralho.js`, `js/quiz.js`, `js/storage.js`, `js/mesa.js` or call `localStorage` / `sessionStorage` / `document.cookie`; MAY import `criarElementoCarta` from `js/carta.js` and `colinhaExisteNoViewport` from `js/layout.js` only after those exports exist (T005/T006)
- [X] T002 [P] Create empty stylesheet `css/colinha.css` and add `<link rel="stylesheet" href="css/colinha.css" />` in `index.html` after `css/hud.css`; confirm `package.json` stays `"type": "module"` with zero runtime dependencies and no bundler/lint/Playwright/poker-lib scripts; confirm `index.html` still loads only `js/mesa.js` as the boot script; MUST NOT add overlay markup statically in `index.html` (JS cria depois de `#hud`); MUST NOT edit `css/mesa.css` or `css/hud.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Catálogo congelado, máquina de visita, predicado de largura, papel visual `exemplo` e gancho fail-open — bloqueiam TODAS as user stories

**⚠️ CRITICAL**: Nenhuma user story pode começar até esta fase estar completa

- [X] T003 Implement frozen `LINHAS_COLINHA` and copy constants in `js/colinha.js` per `specs/007-colinha-classificacao/contracts/colinha-catalogo.md` §1–§2 and `data-model.md` §2: exactly 10 `LinhaCategoria` in ordem 1→10 with ids `royal_flush` … `carta_alta`, rótulos RN-014 exactos, five `{ rank, naipe }` each and `indicesEsmaecidos` (`[]`, `[]`, `[4]`, `[]`, `[]`, `[]`, `[3,4]`, `[4]`, `[2,3,4]`, `[1,2,3,4]`); faces exactly the catalog table (A♠–10♠ royal, 9♥–5♥ SF, quadra 8s+K, etc.); `ROTULO_TITULO === 'Classificação de mãos'`, `ROTULO_MELHOR === 'Melhor'`, `ROTULO_PIOR === 'Pior'`, `ROTULO_OCULTAR === 'Ocultar'`, `ROTULO_COLINHA === 'Colinha'`; `Object.freeze` the array and each line; MUST NOT export a shuffle/replace-faces helper; MUST NOT import `js/motor.js` or `js/baralho.js` (depends on T001)
- [X] T004 Implement pure visit machine `estadoInicial()`, `ocultar(estado)` and `reabrir(estado)` in `js/colinha.js` per `contracts/colinha-visita.md` §1: `estadoInicial()` → `{ visibilidade: 'visivel' }`; `ocultar` → `{ visibilidade: 'oculto' }` without mutating the argument; `reabrir` → `{ visibilidade: 'visivel' }`; MUST NOT add `persistir` / `lerPreferencia`; MUST NOT touch `js/storage.js` (depends on T001)
- [X] T005 [P] Add pure predicate `colinhaExisteNoViewport({ width })` in `js/layout.js` per `contracts/colinha-overlay.md` §5: `true` iff `Number(width) > 900`; `{ width: 901 }` true, `{ width: 900 }` and `{ width: 480 }` false; MUST NOT delegate to `composicaoDoViewport(...) === 'desktop'`; keep existing `composicaoDoViewport` / `COMPOSICOES` unchanged
- [X] T006 [P] Extend `papelDataset` in `js/carta.js` so `papel === 'exemplo'` maps to `data-card-role="exemplo"`; `criarElementoCarta({ rank, suit, papel: 'exemplo', visibilidade: 'face' })` MUST still emit `data-rank` / `data-suit` / `data-face="up"` and MUST NOT add `data-vencedora`, flip or burn; the 11 game-card roles (`hole` / `community` / `burn`) MUST stay unchanged
- [X] T007 Implement fail-open `montarColinha(host)` and `sincronizarViewport(width)` stubs in `js/colinha.js` and wire them from `js/mesa.js`: `montarColinha` wraps DOM work in `try/catch`, on failure removes leftovers and returns `{ ok: false }` without throwing, on success returns `{ ok: true, el }`; `document` absent (Node) → `{ ok: false }` or `null`; `bootMesa` in `js/mesa.js` MUST call `montarColinha($('#clube'))` inside `try/catch` **after** `#hud` exists and **before or beside** `renderHud`, ignoring a false return; the existing `resize` listener MUST also call `sincronizarViewport(window.innerWidth)` (MAY no-op until US5); `aplicar()` FSM MUST NOT gain colinha events; `js/mesa.js` still MUST NOT import `js/motor.js` or call `localStorage`; MUST NOT register `Escape` or click-outside dismiss; MUST NOT `alert()` (depends on T003, T004, T005, T006)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Ver a classificação ao abrir no desktop (Priority: P1) 🎯 MVP

**Goal**: No desktop de referência 1280×720, ao abrir ou recarregar, o canto superior direito já mostra o overlay compacto no cromo do clube: título **Classificação de mãos**, sentido **Melhor** → **Pior** e as 10 linhas canônicas. Comunitárias, assentos e HUD permanecem descobertos; o feltro não é empurrado.

**Independent Test**: Abrir `http://localhost:8080` em 1280×720 (primeira visita ou reload), HUD `ociosa` ou qualquer outro estado, e ver o overlay no canto superior direito com título, **Melhor**/**Pior**, 10 linhas e zero obstrução de comunitárias, assentos ou HUD. Foco inicial **não** está em **Ocultar**.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T008 [US1] Create `tests/contract/colinha.test.js` with `node --test` per `contracts/colinha-overlay.md` §8 and `contracts/colinha-catalogo.md` §1 copy: import `ROTULO_TITULO` / `ROTULO_MELHOR` / `ROTULO_PIOR` and `colinhaExisteNoViewport` from `js/colinha.js` / `js/layout.js`; assert title/sentido strings exact; `colinhaExisteNoViewport({ width: 901 }) === true` and `{ width: 900 }` / `{ width: 480 }` === `false`; read `css/colinha.css` and assert it contains `max-width: 900px` hiding `[data-colinha]` / `[data-colinha-acao]`; MUST NOT import `js/motor.js` in this file (depends on T005)

### Implementation for User Story 1

- [X] T009 [US1] Implement overlay markup in `montarColinha` inside `js/colinha.js` per `contracts/colinha-overlay.md` §2: append `aside[data-colinha][role="complementary"][aria-label="Classificação de mãos"]` **after** `#hud` in `#clube`; `data-estado` from visit state (default `visivel`); header `h2` text exactly `ROTULO_TITULO`; `p[data-colinha-sentido="melhor"]` / `pior` with **Melhor** / **Pior**; `ol[data-colinha-lista]` with 10 `li[data-categoria="{id}"][data-ordem="{1-10}"]` from `LINHAS_COLINHA` (número + rótulo + `.colinha__cartas` with 5 `.colinha__slot`); MUST NOT use `role="dialog"` / `aria-modal`; MUST NOT `focus()` on boot; MUST NOT be a child of `#hud`; MUST NOT change `data-hud-estado` (depends on T007, T008)
- [X] T010 [P] [US1] Style the overlay in `css/colinha.css` per `contracts/colinha-overlay.md` §1 and §4: position absolute/fixed to the **top-right** of `#clube` (or `.clube`); MUST NOT enter flex/grid of `.palco` / `.feltro` / `.board`; tokens `--feltro`, `--rail`, `--texto`, `--rail-metal` (no red infographic palette, no white dashboard cards); compact vertical list; z-index above felt, HUD stays the bottom band; `@media (max-width: 900px)` hides `[data-colinha]` and `[data-colinha-acao]`; at 1280×720 100% the 10 lines MUST fit without covering `data-slot` 1–5, hole slots, `data-seat` or `#hud`; outside that viewport MAY shrink `--colinha-carta-*` or `overflow-y: auto` only on `.colinha__lista`; `prefers-reduced-motion: reduce` → no required animation (depends on T002)

**Checkpoint**: User Story 1 fully functional and independently testable (overlay visível no desktop, 10 linhas, mesa herói)

---

## Phase 4: User Story 2 - Consultar as 10 categorias com exemplos fixos (Priority: P1)

**Goal**: Cada linha tem número, rótulo RN-014 exato e cinco cartas-exemplo **fixas** no idioma visual da mesa. Extras esmaecidas conforme FR-003. Os exemplos não vêm do baralho da mão e não mudam em **Nova mão** / **Próxima mão**.

**Independent Test**: Com a colinha visível, conferir ordem 1→10 e os dez rótulos canônicos; cinco miniaturas por linha; Quadra/Trinca/Dois pares/Par/Carta alta com extras esmaecidas e as outras cinco linhas sem extra; **Nova mão** não troca as faces.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T011 [US2] Extend `tests/contract/colinha.test.js` per `contracts/colinha-catalogo.md` §4: `LINHAS_COLINHA.length === 10` and `ordem` 1..10; each `rotulo` exactly the §2 table; each line has 5 cartas with ranks/naipes in the product alphabet; `indicesEsmaecidos` matches FR-003; royal ≠ SF faces; flush not consecutive; straight mixed suits; carta alta has gaps; read source of `js/colinha.js` and assert it does not contain `from './motor.js'` or `from './baralho.js'` (depends on T008)

### Implementation for User Story 2

- [X] T012 [US2] Fill each `.colinha__slot` in `js/colinha.js` via `criarElementoCarta({ rank, suit: naipe, papel: 'exemplo', visibilidade: 'face' })` from `LINHAS_COLINHA`; apply `carta--exemplo` on every example card; for indexes in `indicesEsmaecidos` add `carta--esmaecida` and `data-esmaecida="true"`; MUST NOT set `data-vencedora`, flip, deal or burn; MUST NOT read `sessao.mao` / `cartasJogo` to pick or swap faces; MUST NOT recalculate when a felt card matches (depends on T006, T009, T011)
- [X] T013 [P] [US2] Add miniature modifiers `.carta--exemplo` and `.carta--esmaecida` in `css/cartas.css` (and slot sizing in `css/colinha.css` if `.carta` is `position: absolute; inset: 0`): example cards scale inside `.colinha__slot`; esmaecida = lower opacity, no selection chrome; MUST NOT change hole/community/burn layout of the 11 game cards; MUST NOT use Unicode/emoji/PNG as the face (depends on T006)
- [X] T014 [US2] Confirm `js/colinha.js` and `js/mesa.js` never rebuild `LINHAS_COLINHA` on `NOVA_MAO` / `PRÓXIMA_MAO` / `aplicar()`: overlay remains the same constant; `js/mesa.js` MUST NOT pass `cartasJogo` into `montarColinha`; no listener on deal that swaps example faces (SC-009) (depends on T007, T012)

**Checkpoint**: User Stories 1 AND 2 independently testable (lenda RN-014 + miniaturas fixas + extras esmaecidas)

---

## Phase 5: User Story 3 - Ocultar e reabrir na mesma visita (Priority: P2)

**Goal**: **Ocultar** some o painel e deixa só o controle discreto **Colinha** no mesmo canto. **Colinha** devolve as 10 linhas. Reload no desktop restaura **visível**. Zero chave de preferência. Só **Ocultar** dispensa; Tab depois do HUD; foco troca entre os dois botões.

**Independent Test**: No desktop, ocultar → só **Colinha**; reabrir → mesmas 10 linhas; recarregar → visível; DevTools Application → 0 chave de preferência; Tab em `ociosa` cai em **Nova mão**, não em **Ocultar**.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T015 [US3] Extend `tests/contract/colinha.test.js` per `contracts/colinha-visita.md` §8.1 and §8.3–8.4: `estadoInicial` / `ocultar` / `reabrir` round-trip; `ocultar` does not mutate the input object; read sources of `js/colinha.js` and the `montarColinha` hook in `js/mesa.js` and assert absence of `localStorage`, `sessionStorage`, `document.cookie` and `indexedDB`; assert `js/colinha.js` has no `Escape` listener that calls `ocultar` (regex / ausência) (depends on T004, T008)

### Implementation for User Story 3

- [X] T016 [US3] Wire controls in `js/colinha.js` per `contracts/colinha-visita.md` §2 and `contracts/colinha-overlay.md` §2: `button[type="button"][data-colinha-acao="ocultar"]` labeled **Ocultar** on the visible panel; `button[type="button"][data-colinha-acao="reabrir"]` labeled **Colinha** only when `data-estado="oculto"`; click/Enter/Space on ocultar → `ocultar` + `data-estado="oculto"` + `focus()` on **Colinha**; reabrir → `reabrir` + `data-estado="visivel"` + `focus()` on **Ocultar**; the hidden control uses `hidden` and/or `tabIndex=-1`; MUST NOT autofocus on `montarColinha`; MUST NOT persist (depends on T004, T009, T015)
- [X] T017 [US3] Keep dismiss and tab-order rules in `js/colinha.js` / `index.html` DOM order: MUST NOT register `keydown` Escape or click-on-feltro/HUD to hide; overlay node stays **after** `#hud` so skip-link → HUD CTAs/opções → **Ocultar**/**Colinha**; lines stay out of Tab (`li` without `tabindex`); `:focus-visible` on the two buttons (depends on T016)
- [X] T018 [P] [US3] Style the hidden-state **Colinha** button in `css/colinha.css` per FR-012 / CA-029: same top-right corner; visually **mínimo** (smaller, not primary CTA) so it does not compete with **Nova mão** / **Próxima mão**; panel hidden when `data-estado="oculto"`; MUST NOT restyle `.btn--cta` in `css/hud.css` (depends on T010)

**Checkpoint**: User Stories 1–3 independently testable (visita em memória, reload restaura visível, 0 persistência)

---

## Phase 6: User Story 4 - Olhar sem interferir no quiz (Priority: P2)

**Goal**: Em `perguntando`, nenhuma linha acende como “a certa”. Clique/tecla na linha não submete, não muda enunciado, opções nem contadores. Ocultar/reabrir não altera o HUD. Linhas sem hover/foco de seleção. Sem armadilha de foco.

**Independent Test**: Iniciar uma mão até `perguntando`, olhar a colinha (0 linha marcada), clicar cada linha (enunciado/opções/contadores iguais) e Tab a partir de **Ocultar** até o HUD.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T019 [US4] Extend `tests/contract/colinha.test.js` source audit per `contracts/colinha-visita.md` §5 and §8.3: `js/colinha.js` MUST NOT contain `from './quiz.js'`, `from './storage.js'`, `from './motor.js'`, `aplicar(` or `poker-trainer:evolucao`; `js/mesa.js` hook MUST NOT call `localStorage` for the colinha; generated-markup contract: `li[data-categoria]` MUST NOT be documented as `button` / `tabindex` / `data-certa` / `aria-current` in `js/colinha.js` (assert those strings are absent on line render) (depends on T011, T015)

### Implementation for User Story 4

- [X] T020 [US4] Make list rows consultation-only in `js/colinha.js` and `css/colinha.css` per `contracts/colinha-overlay.md` §6: `li` without `tabindex`, without nested `<button>`/`<a>`; click/keydown on a line is a no-op for the quiz (MUST NOT dispatch `ESCOLHER_OPCAO` / `ALTERNAR_OPCAO` / `CONFIRMAR`); MUST NOT set `data-certa`, `aria-current` or a “mão da mesa” class from `sessao.mao`; CSS: `cursor: default` on the line; MUST NOT `:hover` / `:focus` / `:active` selection chrome that looks like a HUD option (depends on T009, T017, T019)
- [X] T021 [US4] Confirm isolation in `js/colinha.js` and `js/mesa.js`: hide/reopen MUST NOT write `data-hud-estado`, enunciado, opções or `sessao.mao`; `js/colinha.js` MUST NOT increment `mao_atual` / `upgrade` / `vencedor_pote`; Tab from **Ocultar** leaves the overlay (no focus trap, not `aria-modal`); overlay stays in the corner in `ociosa`, `deal`, `perguntando`, `sem_upgrade` and `resultado` while width > 900 (FR-015) (depends on T016, T020)

**Checkpoint**: User Stories 1–4 independently testable (lenda estática; RN-G005 intacto)

---

## Phase 7: User Story 5 - Sem colinha no viewport estreito; mesa segue se o overlay falhar (Priority: P3)

**Goal**: Largura ≤ 900 px → ausência total (0 painel, 0 **Colinha**). Resize largo↔estreito na mesma visita restaura o estado de visita. Falha ao montar → mesa/quiz seguem sem modal. Paisagem larga baixa encolhe ou rola só dentro do overlay.

**Independent Test**: Abrir em 900 px ou 390 px e confirmar ausência; no desktop, simular falha de `montarColinha` e continuar com **Nova mão**; largo→estreito→largo preserva oculto/visível.

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T022 [US5] Extend `tests/contract/colinha.test.js` per `contracts/colinha-visita.md` §7–§8 and overlay §8.1: `colinhaExisteNoViewport` already locked; `montarColinha` without `document` (or with a host that throws) returns `{ ok: false }` and does not throw; assert `js/colinha.js` / `js/mesa.js` contain no `alert(` for colinha errors; CSS still hides at `max-width: 900px` (depends on T007, T008)

### Implementation for User Story 5

- [X] T023 [US5] Implement `sincronizarViewport(width)` in `js/colinha.js` and keep the `js/mesa.js` `resize` hook: `width ≤ 900` → hide panel **and** **Colinha** (`hidden` + `inert` or `tabIndex=-1` so they leave Tab); `width > 900` → restore UI from the in-memory `visibilidade` (oculto stays only **Colinha**; visivel shows the panel); opening already narrow then widening → default `visivel`; resize MUST NOT reset visit state and MUST NOT persist; `composicaoDoViewport === 'paisagem'` with width > 900 MUST still show the colinha (depends on T005, T007, T016, T022)
- [X] T024 [US5] Finish fail-open and motion in `js/colinha.js` / `js/mesa.js` / `css/colinha.css`: `montarColinha` failure removes leftover nodes, returns `{ ok: false }`, `bootMesa` still calls `renderHud`; MUST NOT modal / `alert` / HUD jargon; `@media (prefers-reduced-motion: reduce)` toggle is immediate; short wide window (e.g. ~1280×560) or zoom > 100% with width > 900: shrink miniaturas **or** `overflow-y: auto` only on `.colinha__lista`; MUST NOT cover board/seats/HUD or push `.feltro` (depends on T010, T013, T023)

**Checkpoint**: All user stories independently functional (desktop lenda + visita + quiz intacto + estreito ausente + fail-open)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Auditoria de contrato, quickstart e governança — depois das cinco histórias

- [X] T025 Run `node --test tests/contract/colinha.test.js` and `node --test tests/contract/` so 001–006 suites still pass; fix only regressions caused by 007 (`js/carta.js` papel `exemplo`, `js/layout.js` predicado, `js/mesa.js` hook) without changing specs 001–006
- [X] T026 Validate `specs/007-colinha-classificacao/quickstart.md` S1–S8 against a local `http://` server (`python -m http.server 8080`): 1280×720 overlay < 3 s (SC-001), catálogo/esmaecer/Nova mão (S2), ocultar/reabrir/reload/storage (S3), teclado (S4), quiz intacto (S5), ≤900 + resize (S6), fail-open (S7), paisagem baixa/zoom (S8)
- [X] T027 [P] Update `.cursor/rules/lgpd-sessao-sem-pii.mdc` for feature 007: colinha visit state is memory-only; MUST NOT persist preferência, cartas-exemplo, information set or a new `localStorage` key; `js/colinha.js` MUST NOT call storage or import `js/motor.js`; keep the three-bucket `poker-trainer:evolucao` rule unchanged
- [X] T028 Confirm isolation of untouched surfaces: `js/motor.js`, `js/quiz.js`, `js/storage.js`, `js/baralho.js`, `js/audio.js`, `css/mesa.css`, `css/hud.css` and every file under `specs/001-*` … `specs/006-*` have **no** 007 edits; `js/colinha.js` has 0 `fetch` / analytics; copy remains pt-BR; 0 relatório / zerar / mute / cola ao vivo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Sequential in priority order is the default: US1 (P1) → US2 (P1) → US3 (P2) → US4 (P2) → US5 (P3)
  - US2 needs the US1 overlay slots; US3 needs the US1 panel; US4 needs US3 controls; US5 needs US3 visit state
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — overlay chrome + 10 linhas. MVP.
- **User Story 2 (P1)**: After US1 markup (slots exist) — miniaturas `criarElementoCarta` + esmaecer + estabilidade
- **User Story 3 (P2)**: After US1 panel exists — toggle, foco, 0 persistência
- **User Story 4 (P2)**: After US3 controls exist — linhas não-controle + isolamento do quiz
- **User Story 5 (P3)**: After US3 visit state exists — estreito / resize / fail-open / overflow

### Within Each User Story

- Tests (included) MUST be written and FAIL before implementation
- Catalog/state before DOM
- Overlay chrome before miniaturas
- Toggle before quiz-isolation polish
- Viewport/fail-open last among stories
- Story complete before moving to the next priority when a single implementer

### Parallel Opportunities

- Phase 1: T001 and T002 in parallel (different files)
- Phase 2: T005 (`js/layout.js`) and T006 (`js/carta.js`) in parallel with T003; T004 after T001 in `js/colinha.js`; T007 after T003–T006
- US1: T010 (`css/colinha.css`) in parallel with T009 (`js/colinha.js`) after T008 fails
- US2: T013 (`css/cartas.css`) in parallel with T012 (`js/colinha.js`) after T011 fails
- US3: T018 (`css/colinha.css`) in parallel with T016/T017 after T015 fails — only if T010 selectors already exist
- US4: T020 then T021 (same files as US3 — sequential)
- US5: T023 then T024 (same JS/CSS owners)
- Polish: T027 (LGPD rule) in parallel with T025/T026 start; T028 after T025
- Do not parallelize two writers on `js/colinha.js`, `js/mesa.js` or `tests/contract/colinha.test.js`

---

## Parallel Example: User Story 1

```bash
# After Phase 2, write the failing US1 contract tests first:
Task: "Copy + viewport + CSS 900px in tests/contract/colinha.test.js"

# Then launch overlay JS and CSS together:
Task: "Overlay aside + 10 linhas in js/colinha.js"
Task: "Top-right club chrome in css/colinha.css"
```

## Parallel Example: User Story 2

```bash
# After US1, write failing catalog locks, then:
Task: "criarElementoCarta + indicesEsmaecidos in js/colinha.js"
Task: ".carta--exemplo / .carta--esmaecida in css/cartas.css"
```

## Parallel Example: User Story 3

```bash
# After US1 panel exists:
Task: "estadoInicial/ocultar/reabrir + storage audit in tests/contract/colinha.test.js"
Task: "Botão Colinha mínimo in css/colinha.css"
# Toggle + foco stay sequential in js/colinha.js
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: overlay no 1280×720, 10 linhas, **Melhor**/**Pior**, feltro não empurrado, foco inicial fora da colinha, `node --test tests/contract/colinha.test.js` nos asserts de US1
5. Demo da lenda desktop se pronto (miniaturas/esmaecer e toggle ainda podem estar incompletos até US2/US3)

### Incremental Delivery

1. Setup + Foundational → módulo, catálogo, visita pura, predicado > 900, gancho fail-open
2. US1 → overlay visível no desktop (MVP!)
3. US2 → cinco cartas-exemplo fixas + extras esmaecidas
4. US3 → ocultar/reabrir + teclado + 0 persistência
5. US4 → quiz intacto (RN-G005)
6. US5 → estreito ausente + resize + fail-open + overflow interno
7. Polish → `node --test tests/contract/` + quickstart S1–S8 + auditoria LGPD/escopo

Cada história soma valor sem reabrir motor, deal, HUD de pergunta ou `poker-trainer:evolucao`.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US3 → US4 → US5 on `js/colinha.js` / `js/mesa.js` (single owner of mount/toggle/foco)
   - Developer B: `tests/contract/colinha.test.js` locks (T008, T011, T015, T019, T022)
   - Developer C: `css/colinha.css` + `css/cartas.css` (T010, T013, T018) if file ownership is split
3. `js/carta.js` papel `exemplo` and `js/layout.js` predicado stay on their file owners after Phase 2
4. Do not split `js/colinha.js` across two writers in the same phase

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to spec.md user stories US1–US5
- UI copy MUST be pt-BR; 10 rótulos MUST match RN-014; sentidos MUST be exactly **Melhor** / **Pior**
- `js/colinha.js` MUST NOT import `js/motor.js`, `js/baralho.js`, `js/quiz.js` or `js/storage.js`
- `js/mesa.js` MUST NOT import `js/motor.js` or call `localStorage`
- Preferência da colinha MUST NEVER reach `localStorage` / `sessionStorage` / cookie / IndexedDB
- Linhas MUST NOT parecer opção de quiz (RN-G005 / RN-052)
- Overlay MUST NOT cover comunitárias/assentos/HUD nor push the felt at 1280×720
- Verify tests fail before implementing overlay/toggle/miniaturas
- Stop at any checkpoint to validate the story independently
- `/speckit-implement` executes this list; this command does **not** implement application code
- MUST NOT commit from `/speckit-tasks`
- MUST NOT alter specs 001–006
