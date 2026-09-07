---
description: "Task list for feature implementation"
---

# Tasks: Showdown — mãos dos adversários e vencedor do pote

**Input**: Design documents from `/specs/006-showdown-vencedor/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Pedidos explicitamente no plan.md (Testing) / research.md §8 / `contracts/motor-showdown.md` §7 / `contracts/quiz-showdown.md` §6 / `contracts/hud-resultado.md` §8 — `node --test` estendendo `tests/contract/motor.test.js` e atualizando `tests/contract/quiz.test.js` e `tests/contract/hud-session.test.js`. Sem Playwright/Cypress, sem bundler. Validação visual via `quickstart.md` (S1–S7).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Site estático na raiz do repositório (ADR-006 / plan.md): `index.html`, `css/`, `js/`, `assets/`, `tests/contract/`. **MUST** estender `js/motor.js` (`quemGanhou`, `conjuntoOpcoesVencedor`, `UNIVERSO_POTE`). **MUST** alterar `js/quiz.js` (`prepararShowdown`; `river_hero` / `river_a` / `river_b` / `river_vencedor` reais). **MUST** alterar cadência e desfecho em `js/mesa.js` (virada simultânea, aborto `ociosa`, `resultado` autoritativo). **MUST NOT** `js/mesa.js` importar `js/motor.js` nem chamar `localStorage`. **MUST NOT** persistir cartas, Melhor5, `chaveDesempate` ou dump de `quemGanhou`. **MUST NOT** lib de poker, bundler, backend, Worker. Kickers MUST NEVER na UI. UI visível MUST ser pt-BR (rótulos RN-014 e textos RN-030 exatos). 0 pergunta de upgrade (5.4) no river.

## Escolhas registradas (ambíguo → padrão)

- Testes automatizados: **incluir** (plan.md Testing + research.md §8 + contratos §7/§6/§8). Visual permanece manual (quickstart S1–S7).
- TDD nas fases de história: escrever os testes de quiz/HUD **antes** da implementação daquela história e garantir que falham. Testes de ranking em `tests/contract/motor.test.js` (US3/US6) são **locks/fixtures de cobertura** sobre o `quemGanhou` da Phase 2 — a comparação completa entra no foundation porque FR-025 exige as três Melhor5 e o `vencedorId` prontos **antes** da 1ª pergunta (falha ≠ empate inventado).
- Git: permanecer em `main` (identidade Spec Kit `006-showdown-vencedor`).
- Módulo: estender `js/motor.js` (ADR-003). Quiz prepara o showdown; mesa **não** importa motor.
- Nome da API: `quemGanhou` + `conjuntoOpcoesVencedor` + `UNIVERSO_POTE`. Id `tres` → **Os três empatam**.
- Momento: determinar no pouso do river (`cartasJogo[10]` conhecido). Mostrar `river_hero` só após virada **e** `showdown.ok`.
- Execução: síncrona no thread da UI; sem Worker. Teto de 1 s extra em `deal` só se `showdown` ainda `pendente` após a virada.
- Falha: `{ ok: false }` → `ociosa` + **Nova mão**. Copy de aborto: reusar `COPY.linhaErroEnumeracao` (`Não foi possível continuar esta mão. Tente de novo.`) — a linha da 005 já existe; MUST NOT inventar `tres` nem spinner.
- Distratoras de categoria: RN-017 da 004 com board = as 5 comunitárias. Sem “ainda possível”.
- RN-031: sempre 6; 7ª de menor prioridade fora. Shuffle só no quiz (`shuffleOpcoes`).
- 5.4 no river: ausente. `river_hero` → `river_a`.
- Destaque / fichas: só em `resultado`. Perdedores não escurecem. CTA **Próxima mão** imediato. Grupo `data-para="adversarioB"` em `index.html`.
- Stub: `CATEGORIAS_STUB`, `CATEGORIA_CORRETA_*`, `CATEGORIA_ADVERSARIO_*`, `VENCEDORES_STUB`, `idVencedorCorreto`, `rotuloVencedorCorreto` saem como fonte de verdade.
- Persistência: só `mao_atual`×3 + `vencedor_pote`×1 via `js/storage.js`. 0 Melhor5/chave/dump.
- Lint/format: **não** adicionar ESLint/Prettier (YAGNI / constitution III).
- Relatório / zerar / lib / backend / draws / mute: ausentes.
- `js/storage.js`, `js/baralho.js`, `js/carta.js`, `js/audio.js`: intocados.
- Rule LGPD: atualizar `.cursor/rules/lgpd-sessao-sem-pii.mdc` no polish (contexto 001–006; MUST NOT gravar dump de `quemGanhou`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Encaixar a API de showdown no `js/motor.js` já entregue pela 004/005, sem backend, sem bundler e sem lib de poker

- [X] T001 Extend DOM-free ES module `js/motor.js` with placeholder exports `UNIVERSO_POTE`, `quemGanhou({ holeVoce, holeA, holeB, comunitarias })` and `conjuntoOpcoesVencedor(vencedorId)`; keep existing `CATEGORIAS`, `avaliarMelhor5`, `conjuntoOpcoesMaoAtual`, `enumerarUpgrades` and `conjuntoOpcoesUpgrade`; MAY import only `RANKS` / `NAIPES` from `js/baralho.js`; MUST NOT import `embaralhar`, mistura, `js/quiz.js`, `js/storage.js`, `js/mesa.js`, `document`, `alert`, or `localStorage`; update the file header to state “melhor 5 + RN-017 + enumerador de upgrades + quemGanhou”
- [X] T002 Add imports of `quemGanhou` and `conjuntoOpcoesVencedor` (and `UNIVERSO_POTE` if the quiz maps rótulos) in `js/quiz.js`; add `prepararShowdown(sessao)` and `decidirAposShowdown(sessao)` as stubs (`prepararShowdown` MAY no-op; `decidirAposShowdown` MAY return `'pendente'`); confirm `package.json` stays `"type": "module"` with zero runtime dependencies and no bundler/lint/Playwright/poker-lib scripts; confirm `index.html` still loads only `js/mesa.js`; confirm `js/mesa.js` does not import `js/motor.js` and still MUST NOT call `localStorage`; MUST NOT yet add the `adversarioB` chip group (that is US4)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Universo RN-030, comparação RN-029, recorte RN-031, preparo oculto no pouso e helper de aborto — bloqueiam TODAS as user stories

**⚠️ CRITICAL**: Nenhuma user story pode começar até esta fase estar completa

- [X] T003 Implement frozen `UNIVERSO_POTE` in `js/motor.js` per `specs/006-showdown-vencedor/contracts/motor-showdown.md` §2: exactly seven `{ id, rotulo }` in RN-031 priority order (`voce` / `adversarioA` / `adversarioB` / `voce_a` / `voce_b` / `a_b` / `tres`) with rótulos **Você**, **Adversário A**, **Adversário B**, **Você e Adversário A**, **Você e Adversário B**, **Adversário A e Adversário B**, **Os três empatam**; MUST NOT add an 8th text or a generic `empate` id (depends on T001)
- [X] T004 Implement `quemGanhou` and `conjuntoOpcoesVencedor` in `js/motor.js` per `contracts/motor-showdown.md` §3–§4: arity 2+2+2+5, alphabet `RANKS × NAIPES`, 11 distinct identities; any violation or throw from `avaliarMelhor5` → `{ ok: false }` with no `vencedorId` and no throw to UI; success evaluates three Melhor5 of 7 (`hole` + 5 comunitárias), compares `chaveDesempate` lexicographically (reuse internal `compararChave`; naipe never breaks ties), maps the max-tied seats (order `voce` → `adversarioA` → `adversarioB`) 1-to-1 onto `VencedorId`; `conjuntoOpcoesVencedor(vencedorId)` returns exactly 6 distinct ids including the correct one, no shuffle, 7th lowest-priority omitted (`tres` correct → exclude `a_b`; any other correct → exclude `tres`); MUST NOT persist Melhor5/chave/dump; MUST NOT filter ties or “board that plays” (depends on T003)
- [X] T005 Implement `prepararShowdown(sessao)` and `decidirAposShowdown(sessao)` in `js/quiz.js` per `contracts/quiz-showdown.md` §2: from `sessao.mao.cartasJogo` take hole A `[0][1]`, hole B `[2][3]`, hero `[4][5]`, comunitárias `[6]..[10]`; call `quemGanhou`; on `!ok` store `sessao.mao.showdown = { ok: false, maos: null, vencedorId: null, vencedores: [], conjuntoPote: null }`; on `ok` store `maos`, `vencedorId`, `vencedores` and `conjuntoPote = conjuntoOpcoesVencedor(r.vencedorId)`; `decidirAposShowdown` returns `'pergunta' | 'falha' | 'pendente'` (`ok === true` → pergunta, `ok === false` → falha, absent → pendente); MUST NOT copy `chaveDesempate` onto `sessao.hud` / `aria-*` / storage; MUST NOT present `river_hero` from here; MUST NOT call `enumerarUpgrades` on the river; MUST NOT include burns (depends on T004)
- [X] T006 Wire `js/mesa.js` `fimAnimacao` etapa `'river'` to call `prepararShowdown(sessao)` as soon as `cartasJogo[10]` is seated (MAY during the A/B flip; MUST NOT wait for the trainee to answer); after etapa `'showdown'`, call `decidirAposShowdown`: `'falha'` → existing `falhaEnumeracao` (reuse `COPY.linhaErroEnumeracao`, HUD `ociosa` + **Nova mão**); `'pendente'` → stay in `deal` ≤ 1 s extra with 0 spinner / 0 “calculando”, then treat as falha; `'pergunta'` still opens the current stub `river_hero` until US1; confirm isolation: `js/motor.js` has 0 `indexedDB` / `sessionStorage` / `fetch` / `sendBeacon` / Unicode baralho / poker CDN / Worker; `js/storage.js`, `js/baralho.js`, `js/carta.js` and `js/audio.js` stay untouched; `js/mesa.js` still MUST NOT import `js/motor.js`; MUST NOT yet replace Flush/Par/`indiceMaoSessao` stubs (that is US1–US3); MUST NOT set `data-vencedor` or move the pot during `deal` (depends on T005)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Virar o showdown e identificar a mão do herói uma vez só (Priority: P1) 🎯 MVP

**Goal**: O turn termina, o river pousa, A e B viram no mesmo beat, e o HUD pergunta **uma** vez **“Qual mão você tem agora?”** com a melhor 5 real das 7 do herói (não o stub Flush). Zero 5.4 no river. Se a classificação ou a comparação falhar, a mão aborta antes da primeira pergunta.

**Independent Test**: Percorrer até o river: A e B ainda fechados enquanto a quinta comunitária voa; depois da virada, as 6 hole e as 5 comunitárias face-up; exatamente uma pergunta **“Qual mão você tem agora?”**; a certa é a melhor 5 das 7 do herói, não Flush fixo; zero pergunta de upgrades.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T007 [P] [US1] Extend `tests/contract/motor.test.js` per `contracts/motor-showdown.md` §7.10, §7.15–7.16: playing the board (best 5 = the 5 community cards) is legal and `maos.voce.categoriaId` matches `avaliarMelhor5` of those 7; duplicate / wrong arity / invalid suit → `{ ok: false }` with 0 `vencedorId` field; happy return MUST NOT contain `runouts`; `chaveDesempate` MAY exist inside `maos.*` (memory only)
- [X] T008 [P] [US1] Update `tests/contract/quiz.test.js` per `contracts/quiz-showdown.md` §6.1, §6.4: `criarOpcoesCategoria(PASSOS.river_hero)` / stub Flush MUST NOT remain the source of `river_hero`; fixture where hero’s 7 is not Flush → `corretaUnica` is that Melhor5, enunciado exactly `Qual mão você tem agora?`, exactly 6 distinct RN-014 rótulos, 0 **Confirmar**; acerto of `river_hero` → passo `river_a`; 0 `*_upgrade` / skip / **Continuar** of upgrade on the river (CA-027, SC-013)
- [X] T009 [P] [US1] Update cadence cases in `tests/contract/hud-session.test.js` per `contracts/hud-resultado.md` §8.1–8.2, §8.10, §8.12: while river is flying, A/B stay `verso` and HUD `deal`; after showdown, A and B face in the same event and `passo === river_hero` with 11 faces (CA-018, SC-023); `showdown.ok === false` after the flip → `ociosa` + **Nova mão**, 0 `perguntando` (SC-019); acerto of `river_hero` MUST NOT open upgrades; helper `ate()` / fixtures that assumed Flush-on-every-river MUST be rewritten against a constructed `cartasJogo`; during `deal` and `river_hero`, `pote.modo === 'centro'` and `vencedoresVisuais` empty (SC-022)

### Implementation for User Story 1

- [X] T010 [US1] Replace stub `criarOpcoesCategoria` / `CATEGORIAS_STUB` / `CATEGORIA_CORRETA_*` for `PASSOS.river_hero` in `js/quiz.js`: prefer `sessao.mao.showdown.maos.voce`; fallback `avaliarMelhor5` of hero `[4][5]` + 5 comunitárias; `ids = conjuntoOpcoesMaoAtual({ categoriaId, board: comunitarias })`; map via `CATEGORIAS`; `shuffleOpcoes` only when presenting a **new** question; set `corretaUnica` to that player’s `categoriaId`; keep stub path for `river_a` / `river_b` until US2; MUST NOT call `prepararUpgradesStreet` on the river; MUST NOT import `js/baralho.js`; MUST NOT put `chaveDesempate` on `sessao.hud` (depends on T005)
- [X] T011 [US1] Change `js/mesa.js` `ritualTurnOuRiver` / `fimAnimacao` / `avancarAcerto`: A and B flip on the **same beat** (`virarAdversariosNoDom` + session `visibilidade = 'face'` together); HUD MUST NOT leave `deal` with one opponent face and the other back; after flip, `'pergunta'` opens `river_hero`, `'falha'` aborts, `'pendente'` waits ≤ 1 s then aborts; `avancarAcerto` of `river_hero` still goes to `river_a` (no 5.4); `pote.modo` stays `'centro'` and 0 `data-vencedor` on seats; MUST NOT import `js/motor.js`; MUST NOT spinner / `alert`; reduced-motion MAY cut the flip to the final state (depends on T006, T010)

**Checkpoint**: User Story 1 fully functional and independently testable (virada simultânea + única 5.3 real do herói + aborto + 0 5.4)

---

## Phase 4: User Story 2 - Identificar as mãos de A e de B, uma de cada vez (Priority: P1)

**Goal**: Depois do acerto do herói no river, o HUD pergunta **“Qual mão o Adversário A completou?”** e só então **“Qual mão o Adversário B completou?”**, cada uma com o contrato 5.3 na melhor 5 daquele jogador. Uma pergunta por vez. Board que joga para todos ⇒ o mesmo rótulo nas três.

**Independent Test**: Montar um river em que A tem Flush e o herói tem Par; na pergunta de A a única certa é **Flush**, com 6 opções e retry. Percorrer herói → A → B: uma pergunta por vez; B não aparece antes do acerto de A.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T012 [P] [US2] Extend `tests/contract/quiz.test.js` and `tests/contract/hud-session.test.js` per `contracts/quiz-showdown.md` §6.1, §6.5 and `contracts/hud-resultado.md` §8.3: fixture hero Par / A Flush / B anything → `river_a` certa **Flush**, 6 opções, retry (CA-019); `river_hero` is **not** Flush-blind; `river_b` and `river_vencedor` stay invisible until the previous river category is acertada (SC-014); each pergunta **replaces** the HUD — 0 hero rótulo stuck on the seat or panel while A is asking (SC-024); board-that-plays fixture → same `corretaUnica` rótulo on the three category steps; A and B with different categories → each has its own certa (depends on T008, T009)

### Implementation for User Story 2

- [X] T013 [US2] Replace remaining stub `criarOpcoesCategoria` / `CATEGORIA_ADVERSARIO_*` in `js/quiz.js` for `PASSOS.river_a` and `PASSOS.river_b`: 7 cards of that player + board of 5; prefer `showdown.maos.adversarioA` / `adversarioB`; `conjuntoOpcoesMaoAtual` with `board = comunitarias`; enunciados exactly `Qual mão o Adversário A completou?` / `Qual mão o Adversário B completou?`; remove `CATEGORIAS_STUB`, `CATEGORIA_CORRETA_ID`, `CATEGORIA_CORRETA_ROTULO`, `CATEGORIA_ADVERSARIO_ID` and `CATEGORIA_ADVERSARIO_ROTULO` as sources of truth; flop/turn 004/005 paths MUST stay on `criarOpcoesMaoAtual` of the visibles; MUST NOT call `enumerarUpgrades` (depends on T010)
- [X] T014 [US2] Confirm `js/mesa.js` `avancarAcerto` already sequences `river_hero` → `river_a` → `river_b` → `river_vencedor` one at a time; `renderHud()` MUST NOT write `categoriasIdentificadas` until `resultado` (US4); MUST NOT glue RN-014 rótulos onto `.assento` / cards between questions; `pote.modo` stays `'centro'` through A and B; `js/mesa.js` still MUST NOT import `js/motor.js` (depends on T011, T013)

**Checkpoint**: User Stories 1 AND 2 independently testable (três 5.3 reais, uma por vez, 0 rótulo grudado)

---

## Phase 5: User Story 3 - Dizer quem ganhou o pote, inclusive split (Priority: P1)

**Goal**: Só depois das três categorias acertadas o HUD pergunta **“Quem ganhou o pote?”** com 6 textos RN-030, certa pelo ranking completo RN-029 (kickers por dentro, split legal, gerador não evita empate). Kickers nunca no texto. Durante a pergunta o bolo permanece no centro.

**Independent Test**: Empate verdadeiro herói vs A (mesmas 5 efetivas, B atrás): a certa é **Você e Adversário A**, o conjunto tem 6 textos do universo, a ordem visual não é constante entre perguntas novas. Um único vencedor com kicker melhor **não** empata só porque a categoria é a mesma.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T015 [P] [US3] Extend `tests/contract/motor.test.js` per `contracts/motor-showdown.md` §7.1–7.2, §7.6–7.7, §7.11, §7.13–7.14: same category + hero kicker strictly better → `vencedorId === 'voce'` (SC-009); true tie hero vs A, B behind → `voce_a` (CA-020); two Flushes with different effective ranks → better five-rank sequence wins, naipe does not break; same category + same ranks, different suits → those players tie; each of the 7 `VencedorId` is the return of ≥1 fixture (SC-015); `conjuntoOpcoesVencedor('tres')` has 6 ids, includes `tres`, excludes `a_b`; `conjuntoOpcoesVencedor('voce')` has 6 ids, includes `voce`, excludes `tres`
- [X] T016 [P] [US3] Extend `tests/contract/quiz.test.js` per `contracts/quiz-showdown.md` §6.2, §6.8–6.9: true-tie hero vs A → `river_vencedor` certa **Você e Adversário A**, conjunto length 6, includes the certa, excludes `tres`; enunciado exactly `Quem ganhou o pote?`; 0 RN-014 categories as options; 0 kickers / “par de ases”; G008: 10 **new** pot questions of the same certa MUST NOT put the certa at the same visual index in all; retry MUST NOT permute; copy **Não é essa. Tente de novo.**; `river_vencedor` invisible while any river category is unsolved (SC-014)

### Implementation for User Story 3

- [X] T017 [US3] Replace `criarOpcoesVencedor(indiceMaoSessao)` / `VENCEDORES_STUB` / `idVencedorCorreto` / `rotuloVencedorCorreto` in `js/quiz.js`: `apresentarPergunta(PASSOS.river_vencedor)` sets `corretaUnica = showdown.vencedorId` and options from `showdown.conjuntoPote` mapped through `UNIVERSO_POTE` (tipo `vencedor`); `shuffleOpcoes` once; if `showdown.ok !== true` MUST NOT invent options (mesa already aborted); remove stub functions as sources of truth; MUST NOT reshuffle the 52; MUST NOT use `indiceMaoSessao` to decide the pot (depends on T005, T013)
- [X] T018 [US3] Confirm `js/mesa.js` keeps `pote.modo === 'centro'` and `vencedoresVisuais === []` for the entire `river_vencedor` question (FR-029 / SC-022); 0 `data-vencedor` on seats; `abrirResultado` still MUST NOT run until acerto + beat (US4); 2ª mão of the session MUST NOT become split only because `indiceMaoSessao >= 2` (`contracts/hud-resultado.md` §8.13); `js/mesa.js` still MUST NOT import `js/motor.js` (depends on T014, T017)

**Checkpoint**: User Stories 1–3 independently testable (pote autoritativo + RN-031 + 0 vazamento visual)

---

## Phase 6: User Story 4 - Ver o desfecho e seguir com Próxima mão (Priority: P1)

**Goal**: Ao acertar quem ganhou, o HUD vai a `resultado`: texto RN-030, destaque só nos vencedores, fichas caminham ou se dividem (incluindo B e os três), três rótulos no HUD na ordem Você / A / B, **Próxima mão** habilitado na hora. Perdedores não escurecem. 0 contorno da melhor 5.

**Independent Test**: Acertar um vencedor único e ver destaque + fichas + **Próxima mão**. Acertar split herói vs A e ver o bolo dividir-se entre os dois. Acionar **Próxima mão** e confirmar novo deal na mesma mesa.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T019 [P] [US4] Rewrite resultado cases in `tests/contract/hud-session.test.js` per `contracts/hud-resultado.md` §8.5–8.9, §8.11: unique winner → `resultado`, CTA **Próxima mão**, `para_vencedor`, `vencedoresVisuais` = the **real** seat — not always `voce` (CA-021); split hero vs A → `split`, `['voce','adversarioA']`, texto **dividem o pote.** (CA-020); `tres` → three seats highlighted; 0 loser-darkening class/style (SC-025); `categoriasIdentificadas` order Você / A / B from the three acertadas RN-014, 0 rótulo on cards (SC-024); **Próxima mão** while pote still `split`/`para_vencedor` → new deal, pote back to `centro` (SC-020); 0 botão **Embaralhar**; 0 outline of the winning 5 cards

### Implementation for User Story 4

- [X] T020 [P] [US4] Add `.pote-grupo[data-para='adversarioB']` (hidden until split involving B) in `index.html`; extend `css/mesa.css` so `para_vencedor` walks chips to the **actual** winning seat (Você **or** A **or** B — the stub that always translated toward the hero MUST go) and `split` reveals only the tied groups (including B and the three); add seat highlight via `.assento[data-vencedor='true']` (or equivalent) that MUST NOT reduce opacity/filter of losers; reduced-motion MAY jump to the final chip/seat state; MUST NOT contour hole or board cards as “best 5”
- [X] T021 [US4] Rewrite `abrirResultado` / `atualizarPote` / `renderHud()` in `js/mesa.js`: read `sessao.mao.showdown.vencedores` and `vencedorId`; texto RN-030 + **“levou o pote.”** (1) or **“dividem o pote.”** (2–3); `categoriasIdentificadas` from the three river category rótulos already acertados, HUD order Você / A / B; set `pote.modo` `para_vencedor` or `split` and `vencedoresVisuais` only now; enable **Próxima mão** immediately (MUST NOT wait for chip animation); toggle `data-vencedor` only on winning seats; minor `css/hud.css` so the three labels stay scannable and losers are not dimmed in the HUD; MUST NOT paste rótulos onto cards; MUST NOT show bb / kicker / `chaveDesempate` (depends on T017, T020)
- [X] T022 [US4] Confirm `js/mesa.js` **Próxima mão** (`iniciarMao({ proxima: true })` / recolhe): restores `pote.modo === 'centro'`, hides all winner groups, clears `data-vencedor`, returns chips to `[data-para='comum']`, deals a new hand on the same table with 0 preflop quiz — even if chips are still walking; abort (`ociosa`) keeps CTA **Nova mão**, not **Próxima mão** (depends on T021)

**Checkpoint**: User Stories 1–4 independently testable (desfecho autoritativo + Próxima mão imediato)

---

## Phase 7: User Story 5 - Errar, tentar de novo e gravar só a primeira vez (Priority: P2)

**Goal**: Retry da 003 vale nas quatro perguntas. Cada categoria do river incrementa `mao_atual` da categoria **correta daquele jogador** na 1ª tentativa. “Quem ganhou” incrementa só `vencedor_pote`. Reload aborta a mão e preserva contadores já gravados.

**Independent Test**: Errar de primeira a mão de A (certa Flush) e depois acertar: Flush em `mao_atual` tem +1 erro e +0 acerto. Errar de primeira o vencedor e depois acertar: `vencedor_pote` tem +1 erro; nenhuma categoria RN-014 muda por essa pergunta.

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T023 [P] [US5] Extend `tests/contract/quiz.test.js` per `contracts/quiz-showdown.md` §6.6–6.7, §6.9: first miss on A when certa is Flush → `mao_atual.flush.erros +1`, `par` unchanged (RN-038); first pot attempt increments only `vencedor_pote` and MUST NOT touch `mao_atual` / `upgrade`; three river category first-attempts are independent even if two players share a rótulo; retry after error → 0 extra delta; copy **Não é essa. Tente de novo.**; dead option stays in place; 0 “pular” / “mostrar resposta”
- [X] T024 [P] [US5] Extend `tests/contract/hud-session.test.js`: reload / `ociosa` mid-showdown after at least one 1ª tentativa → mão aborta, counters already written this visit remain; fail-open of storage still lets the four questions and `resultado` continue; JSON of `poker-trainer:evolucao` still only `mao_atual`, `upgrade`, `vencedor_pote`; `chaveDesempate` / Melhor5 / dump MUST NOT appear on `sessao.hud` or in the storage blob (SC-011, SC-018)

### Implementation for User Story 5

- [X] T025 [US5] Confirm `persistirPrimeira` / `deltasUnica` / `avaliarUnica` in `js/quiz.js` already write `mao_atual` from `corretaUnica` (now the real category of **that** player) and `vencedor_pote` without `categoria` on `river_vencedor`; later retries MUST NOT `gravar`; fail-open of `js/storage.js` unchanged (no `alert`, no HUD jargon); MUST NOT add buckets or a zerar control; `js/mesa.js` still MUST NOT call `localStorage` (depends on T013, T017)

**Checkpoint**: User Stories 1–5 independently testable (RN-032/038 sobre as quatro perguntas reais)

---

## Phase 8: User Story 6 - Ler ranking completo, wheel, wrap e royal no pote (Priority: P2)

**Goal**: Royal no board é **Royal flush** para os três e **Os três empatam**. Wheel perde para six-high. Wrap não é straight. Dois flushes decidem-se pelos cinco ranks. A UI continua mostrando só categorias e textos de pote. Cada um dos 10 rótulos e dos 7 textos é a certa em ≥1 fixture.

**Independent Test**: Percorrer (ou montar) rivers com royal na mesa, wheel vs six-high, wrap que não é straight, e dois flushes de ranks diferentes; conferir categoria e vencedor, com 0 kickers na UI.

### Tests for User Story 6

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T026 [P] [US6] Extend `tests/contract/motor.test.js` per `contracts/motor-showdown.md` §7.3–7.5, §7.8–7.9, §7.12: five community A-K-Q-J-10 suited → three `royal_flush` and `vencedorId === 'tres'` (SC-008), never Straight flush; wheel A-2-3-4-5 vs six-high 2-3-4-5-6, both Straight → six-high wins (SC-010); wrap K-A-2-3-4 as only “almost sequence” → category is not `straight` / `straight_flush`; A-2-3-4-5 suited → `straight_flush`, never royal; strong board but one player builds a strictly better 5 than the board → that player wins (not `tres` just because the board is strong); each of the 10 `CategoriaId` is the certa of ≥1 player in ≥1 7-card river fixture (SC-015)
- [X] T027 [P] [US6] Extend `tests/contract/quiz.test.js`: royal-on-board fixture → three certas **Royal flush**, pot **Os três empatam**, conjunto includes `tres` and excludes `a_b`; scan `sessao.hud.enunciado`, every option `rotulo` / `aria-*` and `resultado` copy for 0 kickers, 0 “par de reis”, 0 “Sequência”, 0 naipe-por-extenso (SC-017); `chaveDesempate` MUST NOT appear on `sessao.hud`

### Implementation for User Story 6

- [X] T028 [US6] Close remaining `quemGanhou` / `avaliarMelhor5` gaps in `js/motor.js` against T026 fixtures (royal vs SF label, wheel topo 5, wrap illegal, flush five-rank compare, board-plays vs better-than-board, coverage of 10 categories + 7 `VencedorId`); kickers stay only inside `chaveDesempate` and MUST NOT leak into `UNIVERSO_POTE` rótulos or `conjuntoOpcoesVencedor`; MUST NOT change `enumerarUpgrades` semantics (depends on T004, T015, T026)

**Checkpoint**: All user stories independently functional (showdown autoritativo, 0 stub Flush/Par/`indiceMaoSessao`)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validação ponta a ponta, privacidade, idioma e guarda de escopo negativo

- [X] T029 Run `node --test tests/contract/` and close gaps against `specs/006-showdown-vencedor/contracts/motor-showdown.md` §7, `contracts/quiz-showdown.md` §6 and `contracts/hud-resultado.md` §8; 001 audio + 002 baralho + 003 storage + 004 mão-atual + 005 upgrades cases MUST still pass; MUST NOT reshuffle the 52 when permuting pot or category options; add `focarPrimeiroHabilitado` assertion for each of the four river questions if still missing (`contracts/quiz-showdown.md` §6.11 / FR-027)
- [X] T030 [P] Update the local-test section of `README.md`: river hero / A / B / pot are no longer Flush/Par/`indiceMaoSessao` stubs; mention `quemGanhou` / `conjuntoOpcoesVencedor` / `UNIVERSO_POTE` in `js/motor.js`; keep the privacy sentence (only `poker-trainer:evolucao`); flop/turn 004/005 remain real
- [X] T031 Execute manual quickstart scenarios S1–S7 from `specs/006-showdown-vencedor/quickstart.md` against `http://localhost:8080` at 1280×720 (not `file://`): read the eleven open cards (do not assume Flush on hero nor Par on A/B); DevTools only the three buckets
- [X] T032 [P] Update `.cursor/rules/lgpd-sessao-sem-pii.mdc` context from 001–005 to 001–006: MUST NOT persist dump of `quemGanhou`, Melhor5, `chaveDesempate`, cartas or timestamp; audit DevTools Application plus source: only `poker-trainer:evolucao` (three buckets); nicknames remain **Você** / **Adversário A** / **Adversário B**; 0 `fetch` of telemetry; `js/mesa.js` still has 0 `localStorage` and 0 `motor.js` import (SC-018, FR-021)
- [X] T033 Confirm negative scope in `js/motor.js`, `js/quiz.js`, `js/mesa.js` and `index.html`: 0 `river_upgrade`; 0 apostas / relatório / zerar / mute / desistir / preflop quiz / poker lib / Worker / bb; RN-G001 (one question) and RN-G005 (no skip/reveal, no winner highlight during the four questions) hold; gerador in `js/baralho.js` still MUST NOT avoid tying boards (RN-G003)
- [X] T034 Confirm copy stays the exact pt-BR strings in `js/quiz.js` `COPY` (`Qual mão você tem agora?` / `Qual mão o Adversário A completou?` / `Qual mão o Adversário B completou?` / `Quem ganhou o pote?` / `Você acertou` / `Não é essa. Tente de novo.` / `Não foi possível continuar esta mão. Tente de novo.`); beat adapter in `js/mesa.js` still 400 ms / 0 ms under `prefers-reduced-motion`; extra wait after flip ≤ 1 s with 0 spinner; keyboard path (Tab reaches options and CTAs; Enter/Space submit única; focus on first visual option at each pergunta)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) is the MVP increment (virada + `river_hero` real + aborto)
  - US2 precisa do `apresentarPergunta` de categoria da US1 (`js/quiz.js` é gargalo) para A/B
  - US3 trava `river_vencedor` sobre `showdown.vencedorId` / `conjuntoPote` da Phase 2
  - US4 assume `vencedores` reais da US3 para o desfecho visual
  - US5 assume `corretaUnica` real nas quatro perguntas (US1–US3)
  - US6 trava extremos RN-015/029/046 sobre o `quemGanhou` da Phase 2
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no other story. MVP.
- **User Story 2 (P1)**: After US1 (shared quiz category path for the river; mesa cadence hero → A)
- **User Story 3 (P1)**: After US2 (pot question only after the three categories); ranking API already in Phase 2
- **User Story 4 (P1)**: After US3 (`vencedorId` / `vencedores` autoritativos no acerto do pote)
- **User Story 5 (P2)**: After US1 (hero 1ª tentativa real); full RN-038 after US2+US3
- **User Story 6 (P2)**: After Phase 2 `quemGanhou`; UI audit after US3 rótulos/textos finais

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation of that story’s quiz/HUD wiring
- `UNIVERSO_POTE` before `conjuntoOpcoesVencedor`
- `quemGanhou` before `prepararShowdown`
- Prepare-on-pouso before virada / abort cadence
- `river_hero` before `river_a` / `river_b`
- Three categories before `river_vencedor` wiring
- Autoritativo `vencedorId` before `abrirResultado`
- Real `corretaUnica` before first-attempt assertions
- Ranking locks (royal / wheel / wrap) after the comparator exists
- Story complete before moving to the next priority

### Parallel Opportunities

- Phase 1: T001 then T002 (T002 verifies T001 isolation + stubs)
- Phase 2: T003 → T004 in `js/motor.js` (same file, sequential); T005 after T004 signatures; T006 after T005
- US1: T007, T008, T009 in parallel (three test files); then T010 (`js/quiz.js`) → T011 (`js/mesa.js`)
- US2: T012 after US1 tests exist; then T013 (`js/quiz.js`) → T014 (`js/mesa.js`)
- US3: T015 and T016 in parallel; then T017 (`js/quiz.js`) → T018 (`js/mesa.js`)
- US4: T019 (tests) in parallel with T020 (`index.html` / `css/mesa.css`); then T021 → T022 (`js/mesa.js`)
- US5: T023 and T024 in parallel; then T025
- US6: T026 and T027 in parallel; then T028 (`js/motor.js`)
- Polish: T030 (README) in parallel with T032 (LGPD rule); T029 after stories; T031 after T029
- Do not parallelize tasks that edit the same file (`js/motor.js`, `js/quiz.js`, `js/mesa.js`, `tests/contract/hud-session.test.js`)

---

## Parallel Example: User Story 1

```bash
# After Phase 2, launch US1 contract tests together:
Task: "Board-plays + arity fail in tests/contract/motor.test.js"
Task: "No Flush-stub river_hero in tests/contract/quiz.test.js"
Task: "Simultaneous A/B flip + abort in tests/contract/hud-session.test.js"

# Then sequential: quiz river_hero real → mesa virada/abort/0 5.4
```

## Parallel Example: User Story 3

```bash
Task: "Kicker / split / RN-031 / 7 VencedorId in tests/contract/motor.test.js"
Task: "CA-020 + G008 + 0 kickers in tests/contract/quiz.test.js"
```

## Parallel Example: User Story 4

```bash
Task: "Resultado autoritativo in tests/contract/hud-session.test.js"
Task: "Grupo adversarioB + CSS de pote/assento in index.html / css/mesa.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: virada simultânea, `river_hero` real (não Flush), 0 5.4, aborto se `!ok`, zero `alert`, zero kicker, zero persistência de Melhor5
5. Demo do river do herói se pronto (A/B ainda podem ser Par-stub até US2)

### Incremental Delivery

1. Setup + Foundational → placeholders + `quemGanhou` + preparo oculto no pouso
2. US1 → virada + `river_hero` real (MVP!)
3. US2 → `river_a` / `river_b` reais (some o Par-stub)
4. US3 → `river_vencedor` autoritativo (some `indiceMaoSessao`)
5. US4 → `resultado` com pote/assento reais + **Próxima mão** imediato
6. US5 → 1ª tentativa RN-032/038 nas quatro perguntas
7. US6 → royal / wheel / wrap / cobertura 10+7
8. Polish → `node --test` + quickstart S1–S7 + auditoria LGPD/escopo

Cada história soma valor sem reabrir o avaliador da 5.3 do flop/turn (004) nem o enumerador (005).

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US2 → US3 → US5 on `js/quiz.js` / `js/mesa.js` (single owner of apresentar/cadência/persistir)
   - Developer B: `tests/contract/motor.test.js` + ranking locks (US1 T007, US3 T015, US6 T026/T028)
   - Developer C: `hud-session.test.js` cadence rewrite (T009) and `index.html` / `css/mesa.css` (T020) if file ownership is split
3. HUD DOM (`renderHud` / `atualizarPote` / `abrirResultado`) stays on the owner of `js/mesa.js`
4. Do not split `js/motor.js` across two writers in the same phase

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to spec.md user stories US1–US6
- UI copy MUST be pt-BR; 10 rótulos MUST match RN-014; 7 textos MUST match RN-030
- `js/mesa.js` MUST NOT import `js/motor.js` or call `localStorage`
- Melhor5 / `chaveDesempate` / dump de `quemGanhou` MUST NEVER reach HUD, `aria-*`, or `poker-trainer:evolucao`
- Kickers MUST NEVER appear as option text (RN-G004)
- Destaque de vencedor e movimento do bolo MUST occur only in `resultado` (RN-G005)
- Verify tests fail before implementing quiz/HUD wiring
- Stop at any checkpoint to validate the story independently
- `/speckit-implement` executes this list; this command does **not** implement application code
- MUST NOT commit from `/speckit-tasks`
