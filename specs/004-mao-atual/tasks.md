---
description: "Task list for feature implementation"
---

# Tasks: Identificação da mão atual (flop e turn)

**Input**: Design documents from `/specs/004-mao-atual/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Pedidos explicitamente no plan.md (Testing) / research.md §8 — `node --test` em `tests/contract/motor.test.js` (novo) e atualização de `tests/contract/quiz.test.js` e `tests/contract/hud-session.test.js`. Sem Playwright/Cypress, sem bundler. Validação visual via `quickstart.md` (S1–S7).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Site estático na raiz do repositório (ADR-006 / plan.md): `index.html`, `css/`, `js/`, `assets/`, `tests/contract/`. **MUST** criar `js/motor.js` e `tests/contract/motor.test.js`. **MUST** alterar `js/quiz.js` só em `flop_hero` / `turn_hero`. **MUST NOT** alterar cadência em `js/mesa.js`. **MUST NOT** `js/mesa.js` importar `js/motor.js` nem chamar `localStorage`. **MUST NOT** lib de poker, bundler, backend. Kickers MUST NEVER na UI. UI visível MUST ser pt-BR (rótulos RN-014 exatos).

## Escolhas registradas (ambíguo → padrão)

- Testes automatizados: **incluir** (plan.md Testing + research.md §8 + `contracts/motor.md` §6 + `contracts/quiz-mao-atual.md` §5). Visual permanece manual (quickstart S1–S7).
- TDD nas fases de história: escrever os testes de contrato **antes** da implementação daquela história e garantir que falham.
- Git: permanecer em `main` (identidade Spec Kit `004-mao-atual`).
- Módulo: criar `js/motor.js` (ADR-003). Quiz consome; mesa **não** importa motor.
- `avaliarMelhor5`: API 5/6/7 na US1 (mesmo critério; HUD só 5/6). Sequências = lista fechada FR-006.
- `conjuntoOpcoesMaoAtual`: na US1, preenchimento mínimo (correta + RN-014 cima→baixo até 6) para o flop ter 6 rótulos; a US3 substitui pela heurística completa FR-009 (vizinhas + tentadoras + descarte do excedente).
- Extração RN-044: quiz lê `cartasJogo`; motor só vê `{rank,naipe}[]`.
- River / upgrade: stub 003 inalterado (`river_hero` = Flush; `flop_upgrade` = Flush verdadeiro; A/B = Par).
- Import `js/baralho.js`: só `RANKS` / `NAIPES`; sem `embaralhar` / pool.
- Testes flop/turn: fixture `cartasJogo` injetada via `INICIAR_MAO` + `corretaUnica`; **não** clicar `flush` cego. Helper `ate()` em `hud-session.test.js` MUST acertar `sessao.mao.corretaUnica` no flop/turn e continuar clicando `flush` só no `river_hero`.
- `payloadFabrica()` (baralho ordenado) no flop do herói é 10-9-8-7-6 de espadas = **Straight flush** — testes que clicam `flush` nesse payload MUST ser atualizados.
- Entrada inválida (length ∉ {5,6,7}): motor lança; quiz nunca chama nesses tamanhos.
- Lint/format: **não** adicionar ESLint/Prettier (YAGNI / constitution III).
- Relatório / zerar / lib / backend: ausentes.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Encaixar o módulo de domínio `motor` no site estático já entregue pelas 001–003, sem backend, sem bundler e sem lib de poker

- [ ] T001 Create DOM-free ES module skeleton `js/motor.js` exporting placeholders `CATEGORIAS`, `SEQUENCIAS_LEGAIS`, `avaliarMelhor5(cartas)` and `conjuntoOpcoesMaoAtual({ categoriaId, board })`; MAY import only `RANKS` / `NAIPES` from `js/baralho.js`; MUST NOT import `embaralhar`, mistura, `js/quiz.js`, `js/storage.js`, `js/mesa.js`, `document`, `alert`, or `localStorage`; file header MUST state “melhor 5 + RN-017; sem enumerador; sem quemGanhou”
- [ ] T002 Confirm `package.json` stays `"type": "module"` with zero runtime dependencies and no bundler/lint/Playwright/poker-lib scripts; confirm `index.html` still loads only `js/mesa.js`; confirm `js/mesa.js` does not import `js/motor.js` and still MUST NOT call `localStorage`; MUST NOT add CSS files for this feature

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Taxonomia RN-014, sequências legais e contrato de aridade — bloqueiam TODAS as user stories

**⚠️ CRITICAL**: Nenhuma user story pode começar até esta fase estar completa

- [ ] T003 [P] Export frozen `CATEGORIAS` in `js/motor.js` with the 10 RN-014 ids (`royal_flush` … `carta_alta`), exact pt-BR rótulos, and ordem 1..10 matching `js/storage.js` / `specs/004-mao-atual/data-model.md`; export `SEQUENCIAS_LEGAIS` as the 10 closed rank sets of FR-006 (`A-2-3-4-5` … `10-J-Q-K-A`) per `specs/004-mao-atual/contracts/motor.md` §3
- [ ] T004 Implement arity guard in `js/motor.js` `avaliarMelhor5(cartas)`: length ∉ {5,6,7} MUST throw (programming error); valid lengths MAY still return a placeholder until US1; `conjuntoOpcoesMaoAtual` MUST accept `{ categoriaId, board }` and return an array (placeholder ok); MUST NOT persist `Melhor5` or `chaveDesempate`
- [ ] T005 Confirm isolation of `js/motor.js`: no `indexedDB`, `sessionStorage`, `fetch`, `sendBeacon`, Unicode baralho, or poker CDN; MUST NOT treat burn as input; `js/storage.js` and `js/audio.js` stay untouched; cadence comments in `js/mesa.js` remain `flop_hero` → `flop_upgrade`, `turn_hero` → `turn_skip`, river stub 003

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Reconhecer a mão já completa no flop (Priority: P1) 🎯 MVP

**Goal**: Depois do flop pousar, o HUD pergunta **“Qual mão você tem agora?”** com 6 rótulos canônicos; a certa é a melhor categoria das 5 cartas visíveis ao herói; acerto de primeira grava `mao_atual` nessa categoria; após o beat segue `flop_upgrade` stub — **não** abre o turn

**Independent Test**: Injetar um flop em que a melhor 5 do herói é um par; a única opção verdadeira é **Par**; acertá-la de primeira incrementa `mao_atual.par`; após o beat a mesa permanece na street (`flop_upgrade`), sem virar o turn

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T006 [P] [US1] Write contract tests in `tests/contract/motor.test.js` per `specs/004-mao-atual/contracts/motor.md` §6.1, §6.8, §6.16: five cards that form a pair → `categoriaId === 'par'` and `rotulo === 'Par'`; pair of deuces and pair of aces (separate hands) both `par`; `avaliarMelhor5` with length 0/4/8 throws
- [ ] T007 [P] [US1] Update `tests/contract/quiz.test.js` per `specs/004-mao-atual/contracts/quiz-mao-atual.md` §5.1–5.2, §5.4: helper that builds 11 `cartasJogo` (RN-044) whose hero flop (indices `[4],[5],[6],[7],[8]`) is a pair; after flop pousado, enunciado exactly `Qual mão você tem agora?`; exactly 6 distinct RN-014 rótulos; 0 **Confirmar**; `corretaUnica === 'par'`; first-try acerto → `mao_atual.par` +1 acerto +0 erro; `FIM_BEAT_ACERTO` → `flop_upgrade` not turn; MUST NOT click `flush` blindly on `flop_hero`
- [ ] T008 [P] [US1] Update helper `ate()` / `acertarUnica` in `tests/contract/hud-session.test.js`: on `flop_hero` and `turn_hero` submit `sessao.mao.corretaUnica` (not hardcoded `flush`); keep `river_hero` stub `flush` and A/B `par`; existing 002 montagem / `FALHA_MONTAGEM` / cartas continuity cases MUST still pass; the `payloadFabrica` flop (10-9-8-7-6 espadas) MUST expect **Straight flush**, not Flush

### Implementation for User Story 1

- [ ] T009 [US1] Implement `avaliarMelhor5(cartas)` in `js/motor.js`: enumerate all `C(n,5)` (n∈{5,6,7}), score each five with lexicographic `chaveDesempate` `[forcaCategoria 9..0, ...kickers]` per RN-029 / `data-model.md` (wheel topo = 5); recognize royal ≠ SF, wheel legal, wrap illegal via `SEQUENCIAS_LEGAIS`; return `{ cartas, categoriaId, rotulo, chaveDesempate }`; always exactly one category (depends on T003, T004)
- [ ] T010 [US1] Add `extrairVisiveisHeroi(cartasJogo, passo)` and `extrairBoardStreet(cartasJogo, passo)` in `js/quiz.js` for `flop_hero` → indices `[4],[5],[6],[7],[8]` visíveis and `[6],[7],[8]` board; map to `{ rank, naipe }` only; MUST NOT pass holes of A/B (`[0]..[3]`), river `[10]`, burns, `idVisual`, or `chaveDesempate` (depends on T009)
- [ ] T011 [US1] Change `apresentarPergunta` in `js/quiz.js` for `PASSOS.flop_hero`: call `avaliarMelhor5` + a minimal `conjuntoOpcoesMaoAtual` (always include `categoriaId`, then fill RN-014 top-down without filtering “ainda possível” until length 6); map ids → `{ id, rotulo }` via `CATEGORIAS`; `shuffleOpcoes` (existing RNG); set `sessao.mao.corretaUnica = melhor.categoriaId`; keep `criarOpcoesCategoria` stub for `river_hero` / A/B (depends on T010)
- [ ] T012 [US1] Keep `js/mesa.js` `avancarAcerto()` cadence: `flop_hero` beat → `flop_upgrade` stub (not turn); MUST NOT import `js/motor.js` from `js/mesa.js`; MUST NOT render **Confirmar** on `flop_hero`; MUST NOT copy kickers into HUD text, `aria-*`, or storage; `persistirPrimeira` already writes `mao_atual[corretaUnica]` — leave that path, now fed by the real id (depends on T011)

**Checkpoint**: User Story 1 fully functional and independently testable (flop honesto + Par CA-010 + beat → upgrade stub)

---

## Phase 4: User Story 2 - Reconhecer a melhor 5 no turn (Priority: P1)

**Goal**: Depois do turn pousar, o HUD pergunta de novo **“Qual mão você tem agora?”**; a certa é a melhor combinação de 5 entre as 6 visíveis (2+3 ou 1+4); acerto + beat → `turn_skip`, não o river; 1ª tentativa nova mesmo se a categoria coincidir com o flop

**Independent Test**: Injetar um turn em que 1 hole + 4 comunitárias (Dois pares) ganha de 2 hole + 3 comunitárias (Par); a opção correta é **Dois pares**; o river ainda não abre

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US2] Extend `tests/contract/motor.test.js` per `contracts/motor.md` §6.7, §6.10: six cards where one 1+4 combo is `dois_pares` and the 2+3 combo is `par` → `categoriaId === 'dois_pares'`; seven cards still classify (HUD will not call this); MUST NOT require 0 hole on turn
- [ ] T014 [P] [US2] Extend `tests/contract/quiz.test.js` and `tests/contract/hud-session.test.js` per `contracts/quiz-mao-atual.md` §5.5–5.6: after flop (real `corretaUnica` + upgrade stub) and turn pousado, enunciado de novo `Qual mão você tem agora?`; 6 opções; `corretaUnica` = Melhor5 of the 6; first attempt is a **new** `mao_atual` exposure even if id equals the flop (SC-012); acerto + `FIM_BEAT_ACERTO` → `turn_skip` / **Continuar**, not river and not a second mão-atual on that street

### Implementation for User Story 2

- [ ] T015 [US2] Extend `extrairVisiveisHeroi` / `extrairBoardStreet` in `js/quiz.js` for `PASSOS.turn_hero`: visíveis `[4],[5],[6],[7],[8],[9]` (6) and board `[6]..[9]` (4); `apresentarPergunta(turn_hero)` MUST call the same `avaliarMelhor5` + conjunto + `shuffleOpcoes` path as flop; MUST NOT use `[10]`; MUST NOT skip the question when the category matches the flop (depends on T011, T013)
- [ ] T016 [US2] Confirm `js/mesa.js` cadence unchanged: `turn_hero` beat → `sem_upgrade` / `turn_skip` (FR-014); MUST NOT open the river on that beat; MUST NOT add a second hero-hand question on the turn; `js/mesa.js` still MUST NOT import `js/motor.js` (depends on T015)

**Checkpoint**: User Stories 1 AND 2 independently testable (flop 5 + turn melhor-5 + skip do turn)

---

## Phase 5: User Story 3 - Ver seis categorias canônicas, com distratoras do board (Priority: P1)

**Goal**: Cada pergunta de mão atual do flop/turn mostra **sempre 6** rótulos oficiais (nunca “Sequência”); conjunto determinístico RN-017 (vizinhas + tentadoras de board + preenchimento); ordem visual embaralhada só ao apresentar; retry não reembaralha

**Independent Test**: Em várias mãos, contar 6 rótulos distintos da lista oficial com a certa inclusa; a posição da certa não é a mesma em todas as perguntas novas; após um erro a ordem permanece; board 2-4-6 inclui Straight como tentadora e 2-4-7 não

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T017 [P] [US3] Extend `tests/contract/motor.test.js` per `contracts/motor.md` §6.11–6.15: `conjuntoOpcoesMaoAtual` always length 6, includes `categoriaId`, deterministic; board 2-4-6 + certa ≠ Straight → `straight` in set; board 2-4-7 → Straight **not** tentadora-only; 3+ same suit with that suit connected → `straight_flush` tentadora (offsuit connector does not); board trips → `quadra` tentadora; board only paired → `quadra` not tentadora; Royal **not** tentadora by texture
- [ ] T018 [P] [US3] Extend `tests/contract/quiz.test.js` per `contracts/quiz-mao-atual.md` §5.8–5.9: ten **new** `apresentarPergunta` of flop/turn → index of `corretaUnica` not constant (G008); retry after error MUST NOT permute; displayed rótulos are exactly RN-014 (0 kickers, 0 “Sequência”, 0 “par de reis”); same cards+board → same 6-id set ignoring visual order

### Implementation for User Story 3

- [ ] T019 [US3] Replace the US1 fill-only builder in `js/motor.js` `conjuntoOpcoesMaoAtual({ categoriaId, board })` with full FR-009: correta → immediate neighbors on RN-014 (Royal only SF; Carta alta only Par) → tentadoras from **board only** (never hero holes) in order Flush (≥2 same suit), Straight (`conectado`), Straight flush (`sfTentadora`), then Quadra/FH/Trinca/Dois pares **or** FH/Trinca/Dois pares → fill top-down without filtering possibility; if steps 2–3 exceed 5 distractors keep correta + neighbors + tentadoras in step-3 order and drop the rest; no duplicates (`data-model.md` TexturaBoard) (depends on T003, T011)
- [ ] T020 [US3] Wire `js/quiz.js` `flop_hero` / `turn_hero` to the real `conjuntoOpcoesMaoAtual` using `extrairBoardStreet` (3 flop / 4 turn); keep `shuffleOpcoes` only at present; MUST NOT call `embaralhar` in `js/baralho.js`; MUST NOT use hero holes as board; `criarOpcoesUpgrade` / river stubs stay on `CATEGORIAS_STUB` (depends on T019)

**Checkpoint**: User Stories 1–3 independently testable (6 rótulos estáveis + tentadoras + G008)

---

## Phase 6: User Story 4 - Errar, tentar de novo e gravar só a primeira vez na categoria certa (Priority: P2)

**Goal**: Erro de primeira mostra **“Não é essa. Tente de novo.”**, mata a distratora no lugar sem revelar a certa, e grava **erro na categoria correta** (não na chutada); o segundo clique não vira acerto; sem pular / mostrar resposta

**Independent Test**: Errar de primeira numa mão cuja certa é Par, depois acertar; `mao_atual.par` tem +1 erro +0 acerto; Flush (distratora) não recebe o erro

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T021 [P] [US4] Rewrite first-attempt cases in `tests/contract/quiz.test.js` per `contracts/quiz-mao-atual.md` §5.3 / RN-019: on a pair-flop fixture, click a displayed distractor (`verdadeira === false`) → copy exactly `Não é essa. Tente de novo.`; dead option same index; `mao_atual.par` +1 erro +0 acerto; the distractor id is **not** incremented; second click on `par` does not flip to acerto; click on dead / missing id changes nothing
- [ ] T022 [P] [US4] Extend `tests/contract/hud-session.test.js`: wrong first choice stays `flop_hero` with option `eliminada`; correct option not marked certa until chosen; 0 skip/reveal CTA; flop then turn of the same hand produce two independent `mao_atual` first attempts (SC-012); `turn_skip` still does not write `upgrade`

### Implementation for User Story 4

- [ ] T023 [US4] Keep `avaliarUnica` / `persistirPrimeira` / `deltasUnica` in `js/quiz.js` writing only `mao_atual[sessao.mao.corretaUnica]` on the first submission (already the 003 contract) now that `corretaUnica` is the motor id; MUST NOT increment the guessed distractor; later attempts MUST NOT `gravar`; fail-open of `js/storage.js` unchanged (no `alert`, no HUD jargon) (depends on T011, T015)
- [ ] T024 [US4] Confirm dead-option + retry UX in `js/quiz.js` / `js/mesa.js` `gradeOpcoes()`: error copy exact; `eliminada` + marca `corte` in place; G008 frozen; no “pular pergunta” / “mostrar resposta”; `river_hero` first-attempt still counts Flush stub independently of flop/turn (FR-015) (depends on T023)

**Checkpoint**: User Stories 1–4 independently testable (retry + erro na categoria correta)

---

## Phase 7: User Story 5 - Distinguir royal, wheel e wrap sem kickers no texto (Priority: P2)

**Goal**: A-K-Q-J-10 suited é **Royal flush** (nunca SF); wheel suited é **Straight flush**; wheel offsuit é **Straight**; wrap não é sequência; par de dois e par de Ás são ambos **Par**; as 10 categorias canônicas são alcançáveis; 0 kickers na UI

**Independent Test**: Percorrer fixtures de flop/turn com royal, wheel suited, wheel offsuit, wrap e pares de forças diferentes; conferir o rótulo e a ausência de kicker no enunciado e nas opções

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T025 [P] [US5] Extend `tests/contract/motor.test.js` per `contracts/motor.md` §6.2–6.6, §6.9: A-K-Q-J-10 suited → `royal_flush` not `straight_flush`; A-2-3-4-5 suited → `straight_flush` not royal; A-2-3-4-5 offsuit → `straight`; wraps K-A-2-3-4, Q-K-A-2-3, J-Q-K-A-2, A-2-3-4-K → not `straight` / not `straight_flush`; 5 suited non-consecutive → `flush`; each of the 10 RN-014 categories is the unique correct label in ≥1 five- or six-card fixture (SC-013)
- [ ] T026 [P] [US5] Extend `tests/contract/quiz.test.js`: scan `sessao.hud.enunciado` and every option `rotulo` / `aria-*` on `flop_hero` / `turn_hero` for 0 kickers, 0 “par de reis” / “par de ases”, 0 “Sequência”, 0 naipe por extenso (SC-008, RN-G004); `chaveDesempate` MUST NOT appear on `sessao.hud` or in the storage blob

### Implementation for User Story 5

- [ ] T027 [US5] Close remaining evaluator gaps in `js/motor.js` against T025 fixtures (royal as force 9, wheel SF vs wheel straight, wrap excluded by `SEQUENCIAS_LEGAIS`, flush vs SF, all 10 categories); kickers stay only in `chaveDesempate` (depends on T009)
- [ ] T028 [US5] Audit `js/quiz.js` + `js/mesa.js` `renderHud()` / `gradeOpcoes()`: option labels come only from `CATEGORIAS.rotulo`; MUST NOT interpolate rank/kicker/suit into copy; `COPY.enunciadoHero` stays `Qual mão você tem agora?`; `abrirResultado()` MUST NOT dump kickers or `chaveDesempate` (depends on T027)

**Checkpoint**: All user stories independently functional (avaliador completo + HUD só com rótulo)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validação ponta a ponta, privacidade, idioma e guarda de escopo negativo (005/006 fora)

- [ ] T029 Run `node --test tests/contract/` and close gaps against `specs/004-mao-atual/contracts/motor.md` §6 and `contracts/quiz-mao-atual.md` §5; 001 audio + 002 baralho + 003 storage/upgrade-stub/river-stub cases MUST still pass; MUST NOT reshuffle the 52 when permuting options
- [ ] T030 [P] Update the local-test section of `README.md`: mention new `js/motor.js` and `tests/contract/motor.test.js`; flop/turn hero correction is no longer the Flush stub; river/upgrade remain stub until 006/005; keep the privacy sentence (only `poker-trainer:evolucao`)
- [ ] T031 Execute manual quickstart scenarios S1–S7 from `specs/004-mao-atual/quickstart.md` against `http://localhost:8080` at 1280×720 (not `file://`): read the feltro (do not assume Flush); DevTools only the three buckets
- [ ] T032 Audit DevTools Application plus source: only `poker-trainer:evolucao` (three buckets); zero PII/cartas/kickers/timestamp/`versao`; nicknames remain **Você** / **Adversário A** / **Adversário B**; 0 `fetch` of telemetry; `js/mesa.js` still has 0 `localStorage` and 0 `motor.js` import (SC-011, FR-019)
- [ ] T033 Confirm negative scope in `js/motor.js`, `js/quiz.js`, and `js/mesa.js`: no upgrade enumerator (005); no `quemGanhou` / extra `river_hero` question (CA-027); no relatório/zerar/mute/desistir/preflop quiz; no poker lib; `CATEGORIAS_STUB` in `js/quiz.js` remains for river/upgrade; RN-G001 (one question) and RN-G005 (no skip/reveal on this question) hold
- [ ] T034 Confirm copy stays the exact pt-BR strings in `js/quiz.js` `COPY` (`Você acertou` / `Não é essa. Tente de novo.` / `Não há upgrade possível.`); beat adapter in `js/mesa.js` still 400 ms / 0 ms under `prefers-reduced-motion`; keyboard path (Tab skips dead; Enter/Space submits `unica`) unchanged

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) is the MVP increment (`avaliarMelhor5` + flop HUD)
  - US2 precisa do mesmo `apresentarPergunta` / extração RN-044 da US1 (`js/quiz.js` é gargalo de um arquivo)
  - US3 substitui o preenchimento mínimo da US1 em `js/motor.js` + `js/quiz.js`
  - US4 assume `corretaUnica` real no flop (US1) e no turn (US2)
  - US5 trava royal/wheel/wrap/10 categorias sobre o avaliador da US1
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no other story. MVP.
- **User Story 2 (P1)**: After US1 (shared `js/quiz.js` apresentar/extrair; motor already accepts n=6)
- **User Story 3 (P1)**: After US1 (replaces fill-only `conjuntoOpcoesMaoAtual`); turn tentadoras (board de 4) ficam corretas depois da US2
- **User Story 4 (P2)**: After US1 (erro na categoria real); duas exposições flop+turn depois da US2
- **User Story 5 (P2)**: After US1 evaluator exists; UI audit after US3 rótulos finais

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Taxonomia / sequências before `avaliarMelhor5`
- `avaliarMelhor5` before quiz extraction
- Flop wiring before turn wiring
- Fill-6 before full RN-017
- Real `corretaUnica` before first-attempt assertions on Par
- Core ranking before royal/wheel/wrap lock tests
- Story complete before moving to the next priority

### Parallel Opportunities

- Phase 1: T001 then T002 (T002 verifies T001 isolation)
- Phase 2: T003 in parallel with the T004 signature work only after T001 exists; T005 after T003/T004
- US1: T006, T007, T008 in parallel (three test files); then T009 → T012 sequential on `js/motor.js` then `js/quiz.js`
- US2: T013 and T014 in parallel; then T015 → T016
- US3: T017 and T018 in parallel; then T019 (`js/motor.js`) → T020 (`js/quiz.js`)
- US4: T021 and T022 in parallel; then T023 → T024
- US5: T025 and T026 in parallel; then T027 → T028
- Polish: T030 (README) in parallel with T032/T033 source audit
- Do not parallelize tasks that edit the same file (`js/motor.js`, `js/quiz.js`, `js/mesa.js`, `tests/contract/hud-session.test.js`)

---

## Parallel Example: User Story 1

```bash
# After Phase 2, launch US1 contract tests together:
Task: "Pair / arity tests in tests/contract/motor.test.js"
Task: "Par flop + CA-010 quiz tests in tests/contract/quiz.test.js"
Task: "ate() uses corretaUnica in tests/contract/hud-session.test.js"

# Then sequential: avaliarMelhor5 → extrair RN-044 → apresentarPergunta flop_hero → cadence guard
```

## Parallel Example: User Story 3

```bash
Task: "RN-017 texture tests in tests/contract/motor.test.js"
Task: "G008 + 6 rótulos tests in tests/contract/quiz.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: flop honesto, Par CA-010, 6 rótulos, beat → `flop_upgrade`, zero `alert`, zero kicker
5. Demo do flop se pronto (turn ainda pode ser stub Flush até US2)

### Incremental Delivery

1. Setup + Foundational → `js/motor.js` + taxonomia
2. US1 → melhor 5 + flop HUD (MVP!)
3. US2 → turn melhor-5 + skip da street
4. US3 → RN-017 tentadoras + G008 estável
5. US4 → erro na categoria correta + duas exposições
6. US5 → royal / wheel / wrap / 10 categorias / 0 kickers
7. Polish → `node --test` + quickstart S1–S7 + auditoria LGPD/escopo

Cada história soma valor sem reabrir enumerador de upgrades (005) nem vencedor do pote (006).

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US2 → US4 on `js/quiz.js` (single owner of apresentar/persistir)
   - Developer B: `tests/contract/motor.test.js` + `js/motor.js` ranking / RN-017 (US1 T009, US3 T019, US5 T027)
   - Developer C: `hud-session.test.js` `ate()` rewrite (T008) and README (T030) if file ownership is split
3. HUD DOM (`gradeOpcoes`) stays on the owner of `js/mesa.js` — this feature SHOULD NOT need cadence edits beyond confirming existing paths
4. Do not split `js/motor.js` across two writers in the same phase

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to spec.md user stories US1–US5
- UI copy MUST be pt-BR; 10 rótulos MUST match RN-014 exactly
- `js/mesa.js` MUST NOT import `js/motor.js` or call `localStorage`
- Kickers / `chaveDesempate` MUST NEVER reach HUD, `aria-*`, or `poker-trainer:evolucao`
- Verify tests fail before implementing
- Stop at any checkpoint to validate the story independently
- `/speckit-implement` executes this list; this command does **not** implement application code
- MUST NOT commit from `/speckit-tasks`
