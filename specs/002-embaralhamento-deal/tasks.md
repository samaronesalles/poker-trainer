---
description: "Task list for feature implementation"
---

# Tasks: Embaralhamento e distribuição das cartas

**Input**: Design documents from `/specs/002-embaralhamento-deal/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Pedidos explicitamente no plan.md / research.md — `node --test` em `tests/contract/baralho.test.js` (novo) e extensão de `tests/contract/hud-session.test.js`. Sem Playwright/Cypress, sem bundler. Validação visual via `quickstart.md` (S1–S12).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Site estático na raiz do repositório (ADR-006 / plan.md): `index.html`, `css/`, `js/`, `assets/`, `tests/contract/`. **MUST** criar `js/baralho.js`. **MUST NOT** criar `js/motor.js`, `js/quiz.js` nem `js/storage.js`. **MUST NOT** reescrever `js/quiz-stub.js`. **MUST NOT** escrever `localStorage` / cookies / `sessionStorage`. **MUST NOT** adicionar teatro visual de shuffle no feltro.

## Escolhas registradas (ambíguo → padrão)

- Testes automatizados: **incluir** (plan.md Testing + research.md §10 + contratos §7 / hud-montagem.md §6). Visual permanece manual (quickstart).
- TDD nas fases de história: escrever os testes de contrato **antes** da implementação daquela história e garantir que falham.
- Git: permanecer em `main` (identidade Spec Kit `002-embaralhamento-deal`).
- Inteiro Fisher–Yates: Uint32 + rejection sampling; XOR com o pool (research.md).
- Pool: buffer compacto 32 bytes; XOR+rotate; sem histórico de coordenadas; sobrevive entre mãos da visita; some no reload.
- Teatro visual de shuffle: **não** adicionar (casco 001 não tem; reduced-motion o proibiria).
- Esquerda/direita no leque: `[0]`/`[2]`/`[4]` = esquerda do assento.
- Copy de erro: constante em `js/mesa.js` (exata `Não foi possível embaralhar. Tente de novo.`). **Não** alterar `js/quiz-stub.js` (FR-020).
- `INICIAR_MAO`: só entra em `deal` com payload de montagem `ok` (`permutacao` + `cartasJogo` RN-044). Orquestrador chama `montarMao` **antes** do evento.
- `FALHA_DEAL` (001): mantida só para exceção **após** `deal`. Falha de montagem = `FALHA_MONTAGEM` / permanece `ociosa`.
- RNG nos testes: parâmetro opcional `rng` em `embaralhar` / `montarMao`; produção usa `crypto.getRandomValues` + pool.
- `CARTAS_JOGO_STUB`: remover como fonte; não usar como fallback.
- CA-006 (janela de 10 mãos): critério de teste; **não** filtro/reject-and-retry no gerador.
- Cadência do casco: após holes, a street flop do casco pode abrir em seguida (como na 001); o invariante é slots vazios **até** essa street começar e **não** reembaralhar.
- `Próxima mão`: recolher feltro **antes** de `montarMao` (inverter a ordem atual de `iniciarMao` em `js/mesa.js`).
- Lint/format: **não** adicionar ESLint/Prettier (YAGNI / constitution III).
- Empates (RN-G003): gerador honesto; zero ramificação que descarte permutação por “pote empataria”.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Encaixar o módulo de domínio `baralho` no site estático já entregue pela 001, sem backend e sem bundler

- [X] T001 Create DOM-free ES module skeleton `js/baralho.js` (ADR-004/006 header; MUST NOT import `js/quiz-stub.js`, `js/audio.js`, or `document`; MUST NOT write `localStorage`)
- [X] T002 Confirm `package.json` stays `"type": "module"` with zero runtime dependencies and no bundler/lint/Playwright scripts; MUST NOT add `js/motor.js`, `js/quiz.js`, or `js/storage.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Gerador, pool da visita e campos de sessão que TODAS as user stories usam

**⚠️ CRITICAL**: Nenhuma user story pode começar até esta fase estar completa

- [X] T003 [P] Implement `criarBaralhoPadrao()` returning 52 distinct French identities (ranks `A,K,Q,J,10,9,8,7,6,5,4,3,2` × naipes `espadas,copas,ouros,paus`; 0 jokers) in `js/baralho.js` per `specs/002-embaralhamento-deal/contracts/baralho.md` §1
- [X] T004 [P] Implement `criarMisturaVisita()`, `misturarCursor(mistura, clientX, clientY)`, and `misturarRelogio(mistura, agoraMs, tickMs)` as a 32-byte XOR+rotate buffer (discard coordinates after mix; finite-only; no trajectory array) in `js/baralho.js` per `specs/002-embaralhamento-deal/contracts/baralho.md` §2
- [X] T005 Implement `embaralhar(baralho52, mistura, rng?)` as a copied Fisher–Yates shuffle (MUST NOT mutate the shared factory array): Uint32 rejection sampling, XOR with pool, injectable `rng`, production `crypto.getRandomValues` when present else pool-only (MUST NOT throw; MUST NOT treat missing crypto as montagem failure; MUST NOT use `Math.random()` as the 52-card source; MUST NOT filter ties) in `js/baralho.js` (depends on T003, T004)
- [X] T006 Implement `cartasDeJogo(permutacao52)` (RN-044: A `[0][1]`, B `[2][3]`, Você `[4][5]`, flop `[6][7][8]`, turn `[9]`, river `[10]`; restante 41 omitted), `validarPermutacao(cartas)` (`ok` \| `incompleto` \| `duplicata` \| `mapeamento_impossivel`), and `montarMao(mistura, rng?)` in `js/baralho.js` per `specs/002-embaralhamento-deal/contracts/baralho.md` §4–§5 (depends on T005)
- [X] T007 Extend in-memory session in `js/mesa.js`: `misturaVisita`, `montagemEmCurso` (not a HUD state), `hud.linhaErro`; add `EVENTOS.FALHA_MONTAGEM`; keep exactly five HUD states (`ociosa|deal|perguntando|sem_upgrade|resultado`); export exact copy constant `Não foi possível embaralhar. Tente de novo.` from `js/mesa.js` (not `js/quiz-stub.js`)
- [X] T008 On `bootMesa()` in `js/mesa.js`, call `criarMisturaVisita()` once per page load and register `pointermove` to `misturarCursor` (window/clube); reload MUST discard the previous buffer (depends on T004, T007)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Começar uma mão com baralho completo e imprevisível (Priority: P1) 🎯 MVP

**Goal**: **Nova mão** / **Próxima mão** permutam 52 cartas uma vez (crypto+pool) **antes** do deal visível; as 11 de jogo seguem RN-044; a mesa não espera mouse

**Independent Test**: Iniciar dez ou mais mãos seguidas no casco e conferir: 52 possíveis, 11 distintas, sequências das 11 não todas idênticas na janela (no máximo uma coincidência adjacente), deal das hole cards sem travar à espera do ponteiro, início do deal visível em < 1 s

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T009 [P] [US1] Write contract tests in `tests/contract/baralho.test.js` for `criarBaralhoPadrao` (52 unique), `embaralhar` (52 unique; not always factory order across 10 calls), `cartasDeJogo` RN-044 table, indices 11–51 absent from the 11, module references neither `localStorage` nor `document`, and no G003 “discard tying board” branch (`specs/002-embaralhamento-deal/contracts/baralho.md` §7.1–7.4, 7.7–7.8; CA-006)
- [X] T010 [P] [US1] Update helper `ate()` and extend FSM tests in `tests/contract/hud-session.test.js`: `INICIAR_MAO` without valid 11-card payload stays `ociosa` with `mao === null`; `INICIAR_MAO` with RN-044 `cartasJogo` enters `deal` and increments `indiceMaoSessao`; existing 001 cases keep passing with an explicit montagem payload (`specs/002-embaralhamento-deal/contracts/hud-montagem.md` §6.1–6.2)

### Implementation for User Story 1

- [X] T011 [P] [US1] Remove `CARTAS_JOGO_STUB` as the source of the 11 game faces in `js/carta.js` (delete the export or leave it with zero consumers; MUST NOT keep it as visual fallback) (FR-016)
- [X] T012 [US1] Change `novaMao` / `INICIAR_MAO` in `js/mesa.js` to require montagem `ok` payload (`permutacao` frozen on `mao`, `cartasJogo` from `cartasDeJogo`); map hole indices A=`[0][1]`, B=`[2][3]`, Você=`[4][5]` in `sentarHoles()` and `sentarHolesNoDom()`; MUST NOT enter `deal` without valid cards; `misturarRelogio` runs inside `montarMao` (depends on T006, T007, T011)
- [X] T013 [US1] Orchestrate **Nova mão** in `iniciarMao()` (`js/mesa.js`): stay `ociosa` while `montagemEmCurso`; call `montarMao(mistura)` synchronously before any HUD `deal`; on `ok` apply `INICIAR_MAO` and start hole deal in < 1 s; permutation ready before first card motion; play existing `shuffle` SFX of the casco (not a second sorteio) (FR-022, FR-023, SC-012)
- [X] T014 [US1] Orchestrate **Próxima mão** in `iniciarMao({ proxima: true })` (`js/mesa.js`): collect until zero `.carta` on seats and empty community slots **then** `montarMao` and deal; MUST NOT apply `INICIAR_MAO`/`PROXIMA_MAO` while previous faces are still visible; MUST NOT reuse the previous permutation (FR-015)

**Checkpoint**: User Story 1 fully functional and independently testable (shuffle por mão + RN-044 + deal sem ritual de mouse)

---

## Phase 4: User Story 2 - Ver o deal das hole cards (A, B, Você) com cartas reais (Priority: P1)

**Goal**: Seis hole cards reais; deal visível por assento **Adversário A (duas) → Adversário B (duas) → Você (duas)**; herói abre; A/B fechados; flop ainda vazio; zero quiz

**Independent Test**: Iniciar uma mão, observar A (2) → B (2) → herói (2) (não uma carta por volta), herói aberto / A e B fechados, slots 1–5 vazios, ausência de pergunta

### Tests for User Story 2

- [X] T015 [US2] Extend FSM contract tests in `tests/contract/hud-session.test.js`: after `FIM_ANIMACAO_STREET` `holes`, `assentos.adversarioA.hole` = game cards 0–1, `adversarioB` = 2–3, `voce` = 4–5; hero `face`; A `verso`; all five board slots `carta === null`; HUD not `perguntando` (`specs/002-embaralhamento-deal/contracts/hud-montagem.md` §6.2–6.3)

### Implementation for User Story 2

- [X] T016 [US2] Change `ritualHoles()` deal order in `js/mesa.js` to seat-at-a-time **Adversário A → Adversário B → Você** (two cards each before the next); MUST NOT round-robin A-B-Você-A-B-Você; MUST NOT start with the hero (replace the current You-first `destinos` loop) (FR-008)
- [X] T017 [US2] On hole land in `js/mesa.js` / `js/carta.js`: Você `data-face="up"`; A and B `data-face="down"`; with `prefers-reduced-motion: reduce` seat instantly in place (existing teto 0 s); MUST NOT add felt-shuffle theater (FR-022, deal-visivel.md §1–§2)
- [X] T018 [US2] After holes land and before the casco flop street starts, keep `data-slot` 1–5 empty (no `.carta` face or back in the slot) and HUD with 0 options in `js/mesa.js` (CA-008, FR-009)

**Checkpoint**: User Stories 1 AND 2 independently testable (deal honesto A→B→Você)

---

## Phase 5: User Story 3 - Abrir flop, turn e river só na street, sem reembaralhar (Priority: P1)

**Goal**: Flop/turn/river já determinados no shuffle; cada street só revela a reserva; avançar **não** chama `embaralhar` / `montarMao`

**Independent Test**: Percorrer até o turn na cadência stub: flop só abre na street flop; no turn o slot 4 é a carta já mapeada; flop permanece igual

### Tests for User Story 3

- [X] T019 [US3] Extend FSM contract tests in `tests/contract/hud-session.test.js`: `CONTINUAR` / street advances MUST NOT replace `mao.cartasJogo` or `mao.permutacao`; after turn, flop slot identities equal pre-turn `[6][7][8]`; after river, flop+turn unchanged (`specs/002-embaralhamento-deal/contracts/hud-montagem.md` §6.4)

### Implementation for User Story 3

- [X] T020 [US3] Open flop in `ritualFlop()` / `preencherSlots()` (`js/mesa.js`) as frozen `[6][7][8]` face-up in slots 1–3 only when the flop street starts; slots 4–5 stay empty; MUST NOT call `embaralhar` or `montarMao` (FR-010, RN-011)
- [X] T021 [US3] Open turn as frozen `[9]` in slot 4 without altering flop, and river as frozen `[10]` in slot 5 without altering flop/turn, in `ritualTurnOuRiver()` (`js/mesa.js`) (FR-011, FR-012, CA-009)
- [X] T022 [US3] Keep unused community slots visibly empty until their street (MUST NOT pre-place backs) in `js/mesa.js` and `index.html` (FR-009)

**Checkpoint**: User Stories 1–3 independently testable (board estável, uma permutação por mão)

---

## Phase 6: User Story 4 - Confiar que as 11 cartas são distintas e que a queima não “come” carta (Priority: P2)

**Goal**: Sempre 11 identidades distintas do baralho padrão; burn cênico sem rank e fora dos slots; `[11]…[51]` nunca entram na mesa

**Independent Test**: Completar deal + três streets; listar 11 cartas de jogo distintas; se a queima aparecer, confirmar verso teatral e 11 inalteradas

### Tests for User Story 4

- [X] T023 [P] [US4] Extend `tests/contract/baralho.test.js`: `cartasDeJogo` returns 11 distinct standard-deck identities; duplicate permutation → `validarPermutacao` ≠ `ok`; restante never included (`specs/002-embaralhamento-deal/contracts/baralho.md` §7.4, 7.6)

### Implementation for User Story 4

- [X] T024 [US4] Keep scenic burn on turn/river via `criarBurnCenico()` in `js/carta.js` and `mostrarBurn()` in `js/mesa.js`: verso only, no `data-rank`/`data-suit` of play, outside `data-slot` 1–5, MUST NOT consume `permutacao[11]` or create a 12th game card (RN-045, RN-G007, CA-007)
- [X] T025 [US4] Render only the 11 `cartasJogo` as hole/community faces in `js/mesa.js`; restante `[11]…[51]` MUST NOT be painted on seats or board (SC-010)

**Checkpoint**: User Stories 1–4 independently testable (11 honestas + burn cênico)

---

## Phase 7: User Story 5 - Só ver as cartas adversárias no showdown, e elas serem as do deal (Priority: P2)

**Goal**: A/B fechados até o river; na virada, as mesmas identidades `[0]…[3]` do deal — ninguém troca de mão

**Independent Test**: Seguir até o river com verso em A/B; no showdown, `data-rank`/`data-suit` coincidem com o mapeamento da rodada

### Tests for User Story 5

- [X] T026 [US5] Extend FSM contract tests in `tests/contract/hud-session.test.js`: after `FIM_ANIMACAO_STREET` `showdown`, A/B hole identities equal deal-time indices 0–3; `viradaShowdownConcluida` does not swap `rank`/`naipe` (hud-montagem / deal-visivel.md §6)

### Implementation for User Story 5

- [X] T027 [US5] Keep A/B `verso` through flop and turn while Você stays `face` in `js/mesa.js` (FR-006, FR-008)
- [X] T028 [US5] Flip A/B in place at showdown in `virarAdversariosNoDom()` / `fimAnimacao(..., 'showdown')` (`js/mesa.js`): `data-face` down→up on the same elements/identities as the deal; MUST NOT deal a new pair (RN-012)

**Checkpoint**: User Stories 1–5 independently testable (showdown = deal)

---

## Phase 8: User Story 6 - A mesa não trava se faltar movimento ou se o embaralhamento falhar (Priority: P3)

**Goal**: Sem mouse e sem Web Crypto a mão ainda começa; montagem inválida permanece `ociosa` com copy canônica e **Nova mão**; uma tentativa por vez; zero PII

**Independent Test**: Nova mão sem mover o ponteiro (deal ocorre); injetar crypto ausente (ainda permuta); injetar montagem inválida (HUD permanece `ociosa` com o texto de erro, sem ter passado por `deal`); segundo clique durante montagem ignorado

### Tests for User Story 6

- [X] T029 [P] [US6] Extend `tests/contract/baralho.test.js`: `embaralhar` / `montarMao` without `getRandomValues` still return 52 cards (not a montagem failure); injected invalid deck → `status` ≠ `ok` and `permutacao`/`cartasJogo` null (`specs/002-embaralhamento-deal/contracts/baralho.md` §7.5–7.6)
- [X] T030 [P] [US6] Extend `tests/contract/hud-session.test.js`: `FALHA_MONTAGEM` stays `ociosa`, `mao === null`, exact error line, CTA **Nova mão**; second start while `montagemEmCurso` does not increment `indiceMaoSessao` twice (`specs/002-embaralhamento-deal/contracts/hud-montagem.md` §6.5–6.6)

### Implementation for User Story 6

- [X] T031 [US6] Implement `FALHA_MONTAGEM` in `js/mesa.js` + `renderHud()`: remain `ociosa`, `mao = null`, `hud.linhaErro` exactly `Não foi possível embaralhar. Tente de novo.` replacing the purpose line until next successful montagem or reload; CTA **Nova mão**; 0 `alert()`; MUST NOT enter `deal`; surface in < 3 s (FR-017, SC-009)
- [X] T032 [US6] Keep `FALHA_DEAL` only for exceptions **after** HUD already entered `deal` (animation) in `js/mesa.js`; montagem failure MUST NOT reuse that path (`ociosa → deal → ociosa` forbidden)
- [X] T033 [US6] Ignore a second **Nova mão** while `montagemEmCurso` in `js/mesa.js` (one attempt; `indiceMaoSessao` increments only on `ok`) (FR-023)
- [X] T034 [US6] Fail-open wiring in `js/mesa.js` and `js/baralho.js`: no pointer movement still shuffles; missing `crypto.getRandomValues` uses pool and still deals; MUST NOT show a “mexa o mouse” ritual or block the HUD (FR-004, SC-008)
- [X] T035 [US6] Privacy/retention in `js/mesa.js` and `js/baralho.js`: MUST NOT prompt for name/e-mail/CPF; MUST NOT persist permutation, pool, or coordinates; reload boots a new mistura and purpose line (not the error line unless the new load fails) (FR-019, SC-011)

**Checkpoint**: All user stories independently functional (gerador honesto + fail-open + HUD ociosa na falha)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validação ponta a ponta, privacidade, idioma e guarda de escopo negativo

- [X] T036 Run `node --test tests/contract/` and close gaps against `specs/002-embaralhamento-deal/contracts/baralho.md` §7 and `specs/002-embaralhamento-deal/contracts/hud-montagem.md` §6 (001 audio/HUD cases MUST still pass)
- [X] T037 [P] Mention `js/baralho.js` and the two contract files (`baralho.test.js`, `hud-session.test.js`) in the local-test section of `README.md` without claiming `localStorage` evolution (still feature 003)
- [X] T038 Execute manual quickstart scenarios S1–S12 from `specs/002-embaralhamento-deal/quickstart.md` against `http://localhost:8080` at 1280×720 (not `file://`)
- [X] T039 Audit DevTools Application plus source: zero baralho/cursor/PII keys in `localStorage`/cookies; zero coordinate logs; nicknames remain **Você** / **Adversário A** / **Adversário B**; no name fields in `index.html`, `js/mesa.js`, `js/baralho.js` (SC-011, Principle II)
- [X] T040 Confirm negative scope: `js/quiz-stub.js` untouched (G008 still `Math.random` and MUST NOT reshuffle the 52 — FR-021); no `js/motor.js`/`js/quiz.js`/`js/storage.js`; no shuffle theater; no CTA **Embaralhar**; no sixth HUD state; no betting/mute/zerar/preflop quiz
- [X] T041 Confirm RN-G003 (no tie filter in `js/baralho.js`) and RN-G007 (burn still scenic in `js/mesa.js` / `js/carta.js`); copy of error is pt-BR exact; operational cost remains zero (no entropy API)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) is the MVP increment (gerador + montagem antes do deal)
  - US2–US5 share the same table/FSM: sequential in priority order recommended (`js/mesa.js` is a single-file bottleneck)
  - US6 fail-open in `js/baralho.js` (crypto ausente) can be tested in parallel after T006; HUD `FALHA_MONTAGEM` waits for US1 orchestration
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no other story. MVP.
- **User Story 2 (P1)**: After US1 (real `cartasJogo` must exist before the A→B→Você fan)
- **User Story 3 (P1)**: After US2 (holes + empty board before reserved streets open)
- **User Story 4 (P2)**: After US3 (11 visibles include flop/turn/river; burn is on turn/river)
- **User Story 5 (P2)**: After US2 (deal identities) and US3 (river reached); showdown flip uses US1 mapping
- **User Story 6 (P3)**: `js/baralho.js` crypto-absent after T006; HUD error path after US1 `iniciarMao` / `FALHA_MONTAGEM`

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- `js/baralho.js` models (`criarBaralhoPadrao`, pool, shuffle) before `montarMao`
- `montarMao` before `INICIAR_MAO` payload
- Data mapping RN-044 before visual deal order
- Core deal before street reveal
- Street reveal before showdown flip
- Success path before montagem-failure HUD

### Parallel Opportunities

- Phase 1: T001 then T002 (T002 is a guardrail on `package.json`)
- Phase 2: T003 and T004 in parallel; T005 after both; T006 after T005; T007 can start after T001 (session fields) in parallel with T005; T008 after T004+T007
- US1: T009 and T010 in parallel; T011 (carta.js) in parallel with those tests; then T012 → T013 → T014 on `js/mesa.js`
- US4: T023 (`baralho.test.js`) in parallel with T024 if T024 only touches burn helpers already in `js/carta.js`
- US6: T029 and T030 in parallel after US1 API exists
- Polish: T037 (README) in parallel with T039/T040 source audit
- Do not parallelize tasks that edit the same file (`js/mesa.js`, `js/baralho.js` after the initial split, `tests/contract/hud-session.test.js`)

---

## Parallel Example: User Story 1

```bash
# After Phase 2, launch US1 contract tests + stub removal together:
Task: "Write baralho contract tests in tests/contract/baralho.test.js"
Task: "Update ate() / INICIAR_MAO payload tests in tests/contract/hud-session.test.js"
Task: "Remove CARTAS_JOGO_STUB as source in js/carta.js"

# Then sequential mesa.js: INICIAR_MAO payload → Nova mão montagem → Próxima mão feltro limpo
```

## Parallel Example: User Story 6

```bash
Task: "Extend baralho tests for missing crypto and invalid montagem in tests/contract/baralho.test.js"
Task: "Extend HUD tests for FALHA_MONTAGEM copy and double-start in tests/contract/hud-session.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: dez mãos — 11 distintas, não o ciclo stub da 001, deal < 1 s, sem esperar mouse
5. Demo do baralho honesto se pronto

### Incremental Delivery

1. Setup + Foundational → `js/baralho.js` + pool da visita
2. US1 → permutação por mão + RN-044 + **Nova mão**/**Próxima mão** (MVP!)
3. US2 → deal visível A→B→Você + herói aberto + board vazio
4. US3 → flop/turn/river reservados, sem reembaralhar
5. US4 → 11 distintas + burn cênico
6. US5 → showdown = cartas do deal
7. US6 → fail-open + copy de montagem + uma tentativa
8. Polish → `node --test` + quickstart S1–S12 + auditoria LGPD/escopo

Cada história soma valor sem reabrir features 003–006 (quiz autoritativo, motor, `localStorage` de contadores).

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US2 → US3 on `js/mesa.js` (single owner to avoid FSM conflicts)
   - Developer B: `tests/contract/baralho.test.js` + crypto-absent/G003 cases (US1/US4/US6 tests)
   - Developer C: `js/carta.js` stub removal (T011) and burn audit (T024) only if file ownership is split
3. US5 and US6 HUD paths stay on the owner of `js/mesa.js`

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to spec.md user stories US1–US6
- UI copy MUST be pt-BR; error line MUST match hud-montagem.md §2 exactly
- Quiz stub remains provisional (correct option MAY not match the real board until 003–006)
- Verify tests fail before implementing
- Stop at any checkpoint to validate the story independently
- `/speckit-implement` executes this list; this command does **not** implement application code
- MUST NOT commit from `/speckit-tasks`
