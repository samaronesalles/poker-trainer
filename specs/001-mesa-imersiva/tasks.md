---
description: "Task list for feature implementation"
---

# Tasks: Mesa imersiva e sessão de treino

**Input**: Design documents from `/specs/001-mesa-imersiva/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Pedidos explicitamente no plan.md / research.md — testes de contrato da FSM do HUD com `node --test` (ES modules, sem bundler, sem framework de UI). Sem Playwright/Cypress. Validação visual via quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Site estático na raiz do repositório (ADR-006 / plan.md): `index.html`, `css/`, `js/`, `assets/`, `tests/contract/`. **MUST NOT** criar `js/baralho.js`, `js/motor.js`, `js/quiz.js` nem `js/storage.js`. **MUST NOT** escrever `localStorage`.

## Escolhas registradas (ambíguo → padrão)

- Testes automatizados: **incluir** contrato FSM (`node --test`) porque plan.md e research.md pedem; visual permanece manual (quickstart).
- `package.json`: **mínimo** `{"type":"module"}` sem dependências — necessário para `node --test` importar `.js` ES modules; não é bundler.
- Lint/format: **não** adicionar ESLint/Prettier (YAGNI / constitution III).
- Branch git: permanecer em `main` (identidade Spec Kit `001-mesa-imersiva`).
- Burn cênico: **incluir** no turn/river (research.md).
- Vencedor stub: mão 1 = Você; mão 2+ = Você e Adversário A.
- US2–US5 são cadência da mesma tela: implementação sequencial recomendada; US6 (áudio/layout) pode avançar em paralelo após a Phase 2 nos módulos isolados.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Estrutura do site estático e bootstrap ES module, sem backend e sem bundler

- [ ] T001 Create directory structure `css/`, `js/`, `assets/avatares/`, `tests/contract/` at repository root per plan.md
- [ ] T002 Create minimal `package.json` with only `"type": "module"` (no runtime dependencies, no bundler scripts) so `node --test` can import ES modules
- [ ] T003 Create `index.html` shell (`lang="pt-BR"`, viewport, dark full-page, `script type="module"` pointing at `js/mesa.js`, no SPA router, no `file://` as supported mode)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tokens, componentes e FSM em memória que TODAS as user stories usam

**⚠️ CRITICAL**: Nenhuma user story pode começar até esta fase estar completa

- [ ] T004 [P] Create club visual tokens (deep felt green, dark rail, center spotlight, chrome-less page) in `css/mesa.css`
- [ ] T005 [P] Create card face/back/empty slot skeleton (no deal animation yet; no Unicode/emoji deck as primary face) in `css/cartas.css`
- [ ] T006 [P] Create HUD action-bar skeleton (dark translucent, large targets, `:focus-visible`) in `css/hud.css`
- [ ] T007 [P] Implement card DOM factory (rank typography, red/black SVG suits, `data-card-role`, `data-face`, `data-rank`, `data-suit`, visibilities `vazia|verso|face`) in `js/carta.js`
- [ ] T008 [P] Implement fail-open `unlock()` / `play()` stubs (never throw, no mute UI, no MP3/OGG, no microphone) in `js/audio.js` per `specs/001-mesa-imersiva/contracts/audio-failopen.md`
- [ ] T009 [P] Export stub constants in `js/quiz-stub.js`: RN-014 six-option set (`par` correct), RN-030 winner texts, exact HUD copy, `PassoQuizStub` ids, and `shuffleOpcoes` via `Math.random` (G008 only)
- [ ] T010 Implement in-memory Mesa/HUD/MaoTreino model and pure FSM transitions (`INICIAR_MAO`, `PROXIMA_MAO`, `CONTINUAR`, `ESCOLHER_OPCAO`, `FIM_ANIMACAO_STREET`, `FALHA_DEAL`) exportable without DOM in `js/mesa.js` (depends on T009); MUST NOT write `localStorage`; MUST NOT create `js/baralho.js`, `js/motor.js`, `js/quiz.js`, `js/storage.js`
- [ ] T011 Wire `index.html` to load `css/mesa.css`, `css/cartas.css`, `css/hud.css` and boot `js/mesa.js` without touching the DOM at module import time (Node must still import the FSM)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Abrir a mesa ociosa de clube (Priority: P1) 🎯 MVP

**Goal**: Primeira visita/reload mostra feltro, três assentos, cinco slots, pote cênico e HUD `ociosa` com **Nova mão**, sem opções de quiz (CA-001)

**Independent Test**: Abrir `http://localhost:8080` em 1280×720 (primeira visita ou reload) e verificar feltro de clube, assentos **Você** / **Adversário A** / **Adversário B** com avatar ilustrado, slots vazios, pote, linha “Treine ler as mãos. Sem apostas.”, CTA **Nova mão**, zero opções, zero apostas/fold/timer/dealer

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T012 [US1] Write FSM contract test for initial state `ociosa` (CTA Nova mão, 0 opções, purpose line) in `tests/contract/hud-session.test.js` (hud-session.md §8 caso 1)

### Implementation for User Story 1

- [ ] T013 [US1] Markup the single-table shell (felt oval region, three `data-seat` positions, five `data-slot` placeholders, scenic pot, HUD root) in `index.html`
- [ ] T014 [P] [US1] Create product-only illustrated SVG avatars (MUST NOT real-person photos, MUST NOT user upload) in `assets/avatares/voce.svg`, `assets/avatares/adversario-a.svg`, `assets/avatares/adversario-b.svg`
- [ ] T015 [US1] Style felt, rail, crease, center spotlight, hero-larger bottom seat, opponent seats, decorative stacks and pot in `css/mesa.css` (FR-017, FR-019)
- [ ] T016 [US1] Bind avatars and exact nicknames **Você**, **Adversário A**, **Adversário B** into seats in `index.html` (no name input field)
- [ ] T017 [US1] Render HUD `ociosa` with exact copy “Treine ler as mãos. Sem apostas.” and CTA **Nova mão**, 0 quiz options, no betting/fold/timer/dealer chrome in `css/hud.css` and `js/mesa.js` (FR-003, FR-011, FR-012)
- [ ] T018 [US1] Make **Nova mão** reachable by Tab and activatable with Enter/Space with visible focus in `css/hud.css` and `js/mesa.js` (SC-011)
- [ ] T019 [US1] Initialize session on load/reload as `hud.estado=ociosa`, `mao=null`, `indiceMaoSessao=0` with zero `localStorage`/cookie writes in `js/mesa.js` (FR-016, FR-025)

**Checkpoint**: User Story 1 fully functional and independently testable (tela ociosa CA-001 / SC-001)

---

## Phase 4: User Story 2 - Iniciar a mão sem quiz preflop (Priority: P1)

**Goal**: **Nova mão** distribui hole cards em HUD `deal` sem opções clicáveis; board vazio nunca pergunta; não há Desistir (RN-041, CA-026, RN-042)

**Independent Test**: Acionar **Nova mão** a partir de `ociosa`; durante o voo das hole cards o HUD está `deal` sem opções; após pouso com board vazio nenhuma pergunta aparece; não existe CTA **Desistir** nem **Nova mão** no meio da mão

### Tests for User Story 2

- [ ] T020 [US2] Extend FSM contract tests in `tests/contract/hud-session.test.js`: `INICIAR_MAO` → `deal` with 0 options; empty board after holes landed stays out of `perguntando`; `FALHA_DEAL` → `ociosa` (hud-session.md §8 casos 2, 3, 14)

### Implementation for User Story 2

- [ ] T021 [P] [US2] Define 11 distinct stub game faces (6 hole + 5 community) without Fisher–Yates/Web Crypto/ADR-004 in `js/carta.js` (or a stub deck helper exported from `js/quiz-stub.js` if kept in one module)
- [ ] T022 [US2] Implement hole-card deal fan/slide animation and HUD `deal` (0 clickable options while `animando`) in `css/cartas.css`, `js/carta.js`, and `js/mesa.js` (CA-026)
- [ ] T023 [US2] Handle **Nova mão**: best-effort `unlock()` from `js/audio.js`, increment `indiceMaoSessao`, enter `deal`, hide session CTAs during `deal` in `js/mesa.js`
- [ ] T024 [US2] After holes land with empty board, keep HUD out of `perguntando` (RN-041) and omit **Desistir** / mid-hand **Nova mão** from `index.html` and `js/mesa.js` (RN-042)
- [ ] T025 [US2] On deal start failure, transition FSM to `ociosa` + **Nova mão** (`FALHA_DEAL`) in `js/mesa.js`

**Checkpoint**: User Stories 1 AND 2 independently testable (deal sem preflop)

---

## Phase 5: User Story 3 - Ver as próprias cartas e as dos adversários no momento certo (Priority: P1)

**Goal**: Herói abre ao pousar; A/B fechados no flop/turn; river pousa → virada A/B → só então o HUD pode sair de `deal` (RN-001, RN-005, RN-006, CA-003, CA-004)

**Independent Test**: Percorrer até flop/turn e conferir herói `up` e A/B `down`; no river conferir ordem slot 5 → flip A/B → primeira pergunta, com as seis hole abertas; cinco slots sempre visíveis

### Tests for User Story 3

- [ ] T026 [US3] Extend FSM contract tests in `tests/contract/hud-session.test.js`: river landed without opponent flip stays `deal`; flip complete → `perguntando` `river_hero` only (hud-session.md §8 casos 9–10)

### Implementation for User Story 3

- [ ] T027 [US3] Apply hole visibility rules after deal land: `voce` face-up, `adversarioA`/`adversarioB` face-down through flop/turn in `js/mesa.js` and `js/carta.js`
- [ ] T028 [US3] Deal flop into `data-slot` 1–3 in rapid sequence and keep unused slots visible-empty in `js/mesa.js`, `css/cartas.css`, and `index.html` (FR-020)
- [ ] T029 [US3] Add scenic burn on turn/river (verso theatrical, not in slots 1–5, not consuming the 11 stub game cards) then place the street card in slot 4 or 5 in `js/carta.js`, `js/mesa.js`, and `css/cartas.css` (RN-G007)
- [ ] T030 [US3] Implement showdown order in `js/mesa.js`: river lands in slot 5 → flip A/B in place → set `viradaShowdownConcluida` before leaving `deal` (FR-005)
- [ ] T031 [US3] Keep HUD in `deal` with 0 clickable options until street cards have landed and, on river, the opponent flip has finished in `js/mesa.js` (CA-026)

**Checkpoint**: User Stories 1–3 independently testable (contrato visual de Hold’em)

---

## Phase 6: User Story 4 - Treinar pelo HUD da mesa, não por um questionário solto (Priority: P2)

**Goal**: Os cinco estados do HUD na própria mesa; cadência stub flop/turn (`perguntando` → `sem_upgrade`) e river em quatro passos até `resultado`; teclado e retry sem revelar a certa

**Independent Test**: Percorrer uma mão stub até `resultado` observando `ociosa`/`deal`/`perguntando`/`sem_upgrade`/`resultado`; no flop pousado, HUD `perguntando` com “Qual mão você tem agora?” e 6 categorias; erro desabilita opção; acerto **Par** vai a “Não há upgrade possível.”; Tab/Enter percorrem CTAs e opções; sem `alert()`

### Tests for User Story 4

- [ ] T032 [US4] Extend FSM contract tests in `tests/contract/hud-session.test.js`: flop_hero 6 options with correct `par`; wrong stay + disable; `par` → `sem_upgrade`; Continuar → `deal` turn; turn skip → `deal` river; river A → B → winner one-at-a-time (hud-session.md §8 casos 4–8, 11)

### Implementation for User Story 4

- [ ] T033 [US4] Render `perguntando` as table HUD (not white form, not `alert()`): exact enunciados, up to 6 large option buttons, visual states `padrao|hover|foco|selecionado|correto|errado_desabilitado` in `css/hud.css` and `js/mesa.js` (FR-012, FR-021)
- [ ] T034 [US4] Implement stub grading in `js/quiz-stub.js` and `js/mesa.js`: exactly one correct id; wrong shows “Não é essa. Tente de novo.” and disables that option; correct shows “Você acertou” and advances; never reveal the answer in text; shuffle visual order each prompt (RN-G005, RN-G008)
- [ ] T035 [US4] After `flop_hero`/`turn_hero` correct, enter `sem_upgrade` with exact text “Não há upgrade possível.” and CTA **Continuar**; Continuar opens the next street in `deal` in `js/mesa.js` (FR-011, FR-013)
- [ ] T036 [US4] Implement river four sequential `perguntando` steps (você → A → B → quem ganhou) then `resultado` with winner, three identified categories (stub “Par”), and CTA **Próxima mão** in `js/mesa.js` and `css/hud.css` (RN-G001, FR-011)
- [ ] T037 [US4] Implement HUD keyboard cycle (options LTR/TTB then the state CTA; Enter/Space activate; do not park focus on disabled controls) in `js/mesa.js` and `css/hud.css` (FR-021, SC-011)
- [ ] T038 [US4] Enable quiz only after `FIM_ANIMACAO_STREET`, reduced-motion cut, or safety timeout (2 s first session hand, ≈ 1 s afterwards) in `js/mesa.js` (SC-002, SC-010)

**Checkpoint**: User Stories 1–4 independently testable (cinco estados do HUD percorríveis só com o casco)

---

## Phase 7: User Story 5 - Encerrar a rodada e pedir a próxima mão na mesma mesa (Priority: P2)

**Goal**: Desfecho com pote (único ou split visual) e **Próxima mão** recolhe e redestribui na mesma mesa sem quiz preflop (CA-005)

**Independent Test**: Chegar a `resultado`, acionar **Próxima mão**, ver recolhimento + novo deal na mesma mesa, HUD `deal`, board vazio sem pergunta, < 3 s; na 2ª mão o vencedor stub split divide o bolo sem bb; nenhum CTA chamado **Embaralhar**

### Tests for User Story 5

- [ ] T039 [US5] Extend FSM contract tests in `tests/contract/hud-session.test.js`: hand 1 winner `voce` → `resultado` non-split + Próxima mão; hand 2+ winner `voce_a` → `resultado` split (hud-session.md §8 casos 12–13)

### Implementation for User Story 5

- [ ] T040 [US5] Animate scenic pot `para_vencedor` toward seat **Você** on hand 1 resultado in `css/mesa.css` and `js/mesa.js` (FR-003)
- [ ] T041 [US5] Animate scenic pot `split` between **Você** and **Adversário A** on hand 2+ without bb/accounting in `css/mesa.css` and `js/mesa.js` (RN-G003 visual)
- [ ] T042 [US5] Implement **Próxima mão**: collect cards, same `Mesa`, new deal, no perceptible reload, no preflop quiz, increment `indiceMaoSessao`, best-effort audio unlock in `js/mesa.js` and `css/cartas.css` (FR-015, SC-006)
- [ ] T043 [US5] Enforce CTA names only **Nova mão** / **Próxima mão** / **Continuar** (MUST NOT **Embaralhar**, **Desistir**, mid-hand **Nova mão**) in `index.html`, `js/mesa.js`, and `css/hud.css` (FR-009, FR-010, SC-009)

**Checkpoint**: User Stories 1–5 independently testable (ciclo de sessão encadeável)

---

## Phase 8: User Story 6 - Mesa usável mesmo muda, no desktop primeiro (Priority: P3)

**Goal**: SFX sintetizados fail-open, sem mute na UI; desktop 1280×720 completo; HUD MAY empilhar no estreito; `prefers-reduced-motion` corta o voo

**Independent Test**: Jogar com áudio permitido (one-shots, sem BGM, sem mute) e com áudio bloqueado (mesa muda, zero modal); conferir 1280×720 sem cortar cartas ilegíveis e viewport estreita com HUD empilhável; em reduced-motion as cartas já estão sentadas e o quiz MAY habilitar na hora

### Tests for User Story 6

- [ ] T044 [P] [US6] Write fail-open contract tests for missing/rejected `AudioContext` (`unlock`/`play` never throw, no mute export) in `tests/contract/audio-failopen.test.js`

### Implementation for User Story 6

- [ ] T045 [US6] Implement synthesized one-shots (`shuffle`, `deal`, `flop`, `showdown`, `acerto`, `erro`) with oscillator/filtered noise, low mix, no BGM, no samples in `js/audio.js` (ADR-007)
- [ ] T046 [US6] Call `unlock()` on first **Nova mão** / **Próxima mão** and `play()` on table events from `js/mesa.js` without blocking the deal on audio (constitution VII)
- [ ] T047 [US6] Honor `prefers-reduced-motion: reduce` with instant-seated cards (0 s flight) and HUD treating them as landed in `css/cartas.css` and `js/mesa.js`; sound MAY continue
- [ ] T048 [US6] Fit felt + 3 seats + 5 slots + HUD at 1280×720 CSS px and stack HUD below on narrow viewports without unreadable overlapping cards in `css/mesa.css` and `css/hud.css` (FR-007, SC-008)
- [ ] T049 [US6] Ensure no mute/volume control and no aggressive audio modal/`alert()`/`confirm()`/`prompt()` in `index.html`, `js/audio.js`, and `js/mesa.js` (FR-023, FR-024)

**Checkpoint**: All user stories independently functional (casco completo + fail-open + desktop-first)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validação ponta a ponta, privacidade e guarda de escopo negativo

- [ ] T050 Run `node --test tests/contract/` and close any FSM gaps against `specs/001-mesa-imersiva/contracts/hud-session.md` §8
- [ ] T051 [P] Update serve/`file://` warning and local HTTP instructions in `README.md` (python `-m http.server` or `npx serve`, viewport 1280×720)
- [ ] T052 Execute manual quickstart scenarios S1–S10 from `specs/001-mesa-imersiva/quickstart.md` against `http://localhost:8080` (do not implement 002–006 behavior)
- [ ] T053 Audit DevTools Application plus source: zero evolution `localStorage` keys, zero PII fields, zero telemetry, avatars/nicknames are product-only in `js/mesa.js`, `index.html`, and `js/audio.js` (FR-025, Principle II)
- [ ] T054 Confirm negative scope: no `js/baralho.js`/`js/motor.js`/`js/quiz.js`/`js/storage.js`, no betting UI, no report/mute/zerar, pt-BR copy matches hud-session.md §2, street animation caps 2 s / ≈ 1 s in `js/mesa.js` and `css/cartas.css`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) is the MVP increment and has no story dependency
  - US2–US5 share one session cadence on the same table: sequential in priority order (P1 → P2)
  - US6 modules (`js/audio.js`, layout CSS) can proceed in parallel after Phase 2; event wiring waits for US2/US4
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no other story
- **User Story 2 (P1)**: After US1 (**Nova mão** and ociosa HUD must exist)
- **User Story 3 (P1)**: After US2 (deal/hole cards must exist)
- **User Story 4 (P2)**: After US3 (streets must land before quiz enablement)
- **User Story 5 (P2)**: After US4 (`resultado` and stub winner must exist)
- **User Story 6 (P3)**: After Foundational for `js/audio.js`/`css`; integration after US2 (unlock) and US4 (acerto/erro)

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models/FSM before HUD rendering
- Card component before deal/street animation
- Core street visual before quiz enablement
- Story complete before moving to next priority (recommended for this single-screen casco)

### Parallel Opportunities

- Phase 1: T001 then T002/T003 (T002 and T003 different files after T001)
- Phase 2: T004, T005, T006, T007, T008, T009 in parallel; T010 after T009; T011 last
- US1: T012 (tests) parallel with T014 (avatars); T013 markup before T015/T016/T017
- US2: T020 (tests) parallel with T021 (11 faces)
- US6: T044 (audio tests) parallel with T045 (synth) after Phase 2
- Do not parallelize tasks that edit the same file (`js/mesa.js`, `index.html`, `css/hud.css`)

---

## Parallel Example: User Story 1

```bash
# After Phase 2, launch US1 test + avatars together:
Task: "Write FSM contract test for initial state ociosa in tests/contract/hud-session.test.js"
Task: "Create product-only illustrated SVG avatars in assets/avatares/voce.svg, assets/avatares/adversario-a.svg, assets/avatares/adversario-b.svg"

# Then sequential markup → CSS → HUD ociosa on index.html / css/mesa.css / css/hud.css / js/mesa.js
```

## Parallel Example: User Story 2

```bash
Task: "Extend FSM contract tests for INICIAR_MAO/deal/FALHA_DEAL in tests/contract/hud-session.test.js"
Task: "Define 11 distinct stub game faces in js/carta.js"
```

## Parallel Example: User Story 6

```bash
Task: "Write fail-open contract tests in tests/contract/audio-failopen.test.js"
Task: "Implement synthesized one-shots in js/audio.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: abrir HTTP local em 1280×720 — CA-001 / SC-001
5. Demo da mesa ociosa se pronto

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → mesa ociosa (MVP visual)
3. US2 → deal sem preflop
4. US3 → visibilidade Hold’em + burn
5. US4 → HUD stub completo (cinco estados)
6. US5 → Próxima mão + split
7. US6 → áudio fail-open + desktop-first + reduced-motion
8. Polish → `node --test` + quickstart S1–S10 + auditoria LGPD/escopo

Cada história soma valor sem reabrir features 002–006 (shuffle 52, motor, storage, quiz autoritativo).

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US2 → US3 (palco + deal)
   - Developer B: US6 áudio isolado em `js/audio.js` + testes `tests/contract/audio-failopen.test.js`
   - Developer C: CSS de viewport (`css/mesa.css` / `css/hud.css`) only if file ownership is split
3. US4 and US5 stay on the owner of `js/mesa.js` to avoid merge conflicts on the FSM

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to spec.md user stories US1–US6
- Contract tests assert by option **label/id**, never by shuffled grid index
- Stub correct category is **Par**; hand-1 winner **Você**; hand-2+ **Você e Adversário A**
- UI copy MUST be pt-BR exact strings from `contracts/hud-session.md` §2
- Verify tests fail before implementing
- Stop at any checkpoint to validate the story independently
- `/speckit-implement` executes this list; this command does **not** implement application code
