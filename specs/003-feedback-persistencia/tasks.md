---
description: "Task list for feature implementation"
---

# Tasks: Feedback de resposta e persistência da evolução

**Input**: Design documents from `/specs/003-feedback-persistencia/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Pedidos explicitamente no plan.md / research.md §12 — `node --test` em `tests/contract/quiz.test.js` (novo), `tests/contract/storage.test.js` (novo) e atualização de `tests/contract/hud-session.test.js`. Sem Playwright/Cypress, sem bundler. Validação visual via `quickstart.md` (S1–S10).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Site estático na raiz do repositório (ADR-006 / plan.md): `index.html`, `css/`, `js/`, `assets/`, `tests/contract/`. **MUST** criar `js/quiz.js` e `js/storage.js`. **MUST NOT** criar `js/motor.js`. **MUST** remover `js/quiz-stub.js` após migrar imports. **MUST NOT** persistir PII, cartas, pool de cursor, timestamp ou `versao`. **MUST NOT** reembaralhar as 52 ao permutar opções. UI visível MUST ser pt-BR.

## Escolhas registradas (ambíguo → padrão)

- Testes automatizados: **incluir** (plan.md Testing + research.md §12 + `contracts/quiz.md` §9, `storage.md` §7, `hud-cadencia.md` §6). Visual permanece manual (quickstart).
- TDD nas fases de história: escrever os testes de contrato **antes** da implementação daquela história e garantir que falham.
- Git: permanecer em `main` (identidade Spec Kit `003-feedback-persistencia`).
- Módulos: criar `js/quiz.js` + `js/storage.js`; absorver `js/quiz-stub.js`; **não** criar `js/motor.js`.
- Cadência incremental: US1 mantém `flop_hero` → beat → `flop_skip` para a história ser testável sozinha; US2 substitui `flop_skip` por `flop_upgrade` (Flush verdadeiro, Par distratora) e deixa o skip só no turn.
- Herói stub: correta = **Flush**. A/B = **Par**. Upgrade stub: 6 iguais à 001; verdadeiro = só Flush.
- Enunciado 5.4: `Quais mãos você ainda não tem, mas ainda pode formar?`
- Chave storage: `poker-trainer:evolucao`. Ids snake_case. Sem `versao`/timestamp. Escrita preguiçosa. LWW sem mescla.
- Beat: 400 ms; 0 se `prefers-reduced-motion: reduce`; evento `FIM_BEAT_ACERTO` no adapter de `js/mesa.js` (FSM sem `setTimeout`).
- Marcas: ✕ morta, ✓ acertada; Tab só ativáveis. Distinção MUST NOT depender só de cor.
- Fail-open: silencioso; sem linha extra no HUD (diferente da copy de embaralhar da 002).
- RNG opções: `Math.random` injetável; isolado de `js/baralho.js`.
- `js/mesa.js` MUST NOT chamar `localStorage` direto; único escritor = `js/quiz.js` via `js/storage.js`.
- Relatório / zerar: ausentes (YAGNI / constitution IV).
- Lint/format: **não** adicionar ESLint/Prettier (YAGNI / constitution III).

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Encaixar os módulos de domínio `quiz` e `storage` no site estático já entregue pelas 001–002, sem backend e sem bundler

- [ ] T001 Create DOM-free ES module skeleton `js/quiz.js` absorbing current exports from `js/quiz-stub.js` (`COPY`, `APELIDOS`, `PASSOS`, `CATEGORIAS_STUB`, `VENCEDORES_STUB`, `shuffleOpcoes`, `criarOpcoesCategoria`, `criarOpcoesVencedor`, `enunciadoDoPasso`, `idVencedorCorreto`, `rotuloVencedorCorreto`); add `PASSOS.flop_upgrade`; drop `PASSOS.flop_skip` from the new enum (callers still on stub until T009); MUST NOT import `js/baralho.js`; MUST NOT create `js/motor.js`
- [ ] T002 [P] Create DOM-free ES module skeleton `js/storage.js` exporting `CHAVE_EVOLUCAO = 'poker-trainer:evolucao'` and `criarStorage({ api } = {})` with injectable `{ getItem, setItem, removeItem }` (or `indisponivel: true`); MUST NOT import `document`, `alert`, `indexedDB`, `sessionStorage`, `js/quiz.js`, or `js/mesa.js`; MUST NOT export `clear()` / `zerar()` for the UI
- [ ] T003 Confirm `package.json` stays `"type": "module"` with zero runtime dependencies and no bundler/lint/Playwright scripts; MUST NOT add `js/motor.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema de evolução, conteúdo stub, eventos de pergunta e migração fora de `quiz-stub.js` — bloqueiam TODAS as user stories

**⚠️ CRITICAL**: Nenhuma user story pode começar até esta fase estar completa

- [ ] T004 [P] Implement `CATEGORIA_IDS` (the 10 RN-014 ids) and `evolucaoZerada()` returning `mao_atual` + `upgrade` (all 10 keys at `{ acertos:0, erros:0, exposicoes:0 }`) plus `vencedor_pote` group in `js/storage.js` per `specs/003-feedback-persistencia/contracts/storage.md` §2 and `specs/003-feedback-persistencia/data-model.md`
- [ ] T005 Implement `ler()`, `gravar(evolucao)`, and `aplicarDeltas(deltas)` in `js/storage.js`: JSON on `poker-trainer:evolucao`; lazy write (absent key MUST NOT `setItem`); never throw; success `gravar` → `true`, failure → `false`; one read-mutate-write blob per `aplicarDeltas` (depends on T004)
- [ ] T006 Update stub content in `js/quiz.js`: six visible categories remain Par / Carta alta / Dois pares / Trinca / Flush / Straight; hero (`flop_hero`/`turn_hero`/`river_hero`) correct id `flush`; `river_a`/`river_b` correct id `par`; `conjuntoCorreto` of upgrades `['flush']` with Par as distractor; add `COPY.ctaConfirmar = 'Confirmar'` and `COPY.enunciadoUpgrades = 'Quais mãos você ainda não tem, mas ainda pode formar?'`; keep winner RN-030 texts (depends on T001)
- [ ] T007 [P] Extend option/CTA styles in `css/hud.css`: replace `data-estado='correto'`/`errado_desabilitado` with `acertada`/`eliminada`/`selecionada`; visible ✕ mark on eliminated and ✓ mark on acertada (not color-only); reduced emphasis on dead options; keep existing `.btn--cta` for **Confirmar**
- [ ] T008 Extend in-memory session in `js/mesa.js`: add `EVENTOS.ALTERNAR_OPCAO`, `CONFIRMAR`, `FIM_BEAT_ACERTO`; add `mao.faseTentativa` (`aguardando_primeira` \| `primeira_registrada` \| `aguardando_beat`); add `sessao.evolucao` cache; keep exactly five HUD states; update the file header to allow `quiz`/`storage` modules but MUST NOT call `localStorage` from `js/mesa.js` and MUST NOT create `js/motor.js`
- [ ] T009 Switch imports in `js/mesa.js` and `tests/contract/hud-session.test.js` from `js/quiz-stub.js` to `js/quiz.js`; keep `APELIDOS` **Você** / **Adversário A** / **Adversário B**; existing 002 montagem/`FALHA_MONTAGEM` cases MUST still compile (depends on T001, T006, T008)
- [ ] T010 Delete `js/quiz-stub.js` after zero remaining imports (grep the repo); MUST NOT leave the stub in parallel with `js/quiz.js` (depends on T009)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Responder seleção única no clique, com feedback no HUD (Priority: P1) 🎯 MVP

**Goal**: Clique em opção de seleção única submete na hora (sem **Confirmar**); acerto mostra **“Você acertou”** + marca ✓ e avança sozinho após o beat; erro mostra **“Não é essa. Tente de novo.”**, mata a opção no lugar sem spoiler; zero `alert()`

**Independent Test**: Com o stub de correção (herói = Flush): percorrer `flop_hero`; clique submete; acerto mostra texto e estado certos no HUD; erro mostra retry, mata a opção, não revela a certa; retry até a correta; zero `alert()`. Até a US2, o beat de `flop_hero` MAY ainda ir a `flop_skip`.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T011 [P] [US1] Write contract tests in `tests/contract/quiz.test.js` for seleção única per `specs/003-feedback-persistencia/contracts/quiz.md` §9.1–9.3: 0 CTA **Confirmar** on `unica`; click on distractor submits; click on `flush` submits; error copy exactly `Não é essa. Tente de novo.`; dead option keeps the same visual index with marca `corte`; remaining order frozen; correct option not marked certa until chosen; zero `alert`
- [ ] T012 [P] [US1] Update helper `ate()` and FSM tests in `tests/contract/hud-session.test.js`: hero correct is `flush` (not `par`); wrong choice stays `flop_hero` with option `eliminada`; correct `flush` stays `perguntando` with feedback acerto until `FIM_BEAT_ACERTO`; 0 **Confirmar** on `flop_hero`/`river_*`; `resultado` reiterates Você=Flush, A=Par, B=Par (`specs/003-feedback-persistencia/contracts/hud-cadencia.md` §6.2–6.3, §5)

### Implementation for User Story 1

- [ ] T013 [US1] Implement seleção única submit-on-click in `js/quiz.js` + `js/mesa.js` `aplicar()`/`escolherOpcao`: `ESCOLHER_OPCAO` on ativável submits; MUST NOT render **Confirmar** when `modo === 'unica'`; click on feltro / missing id does nothing (FR-001, RN-047)
- [ ] T014 [US1] Implement error path in `js/quiz.js` and paint it in `js/mesa.js` `gradeOpcoes()` / `renderHud()`: exact error copy in `.hud__feedback`; option `estadoVisual = 'eliminada'`, `marca = 'corte'`, `ativavel = false`; same place in the grid; Tab/`tabIndex` skips dead; re-click/Enter/Space ignored; MUST NOT name the correct category (RN-035, RN-036, FR-004, FR-005)
- [ ] T015 [US1] Implement success path in `js/quiz.js`: exact copy `Você acertou`; option `acertada` + marca `acerto` only after chosen; `faseTentativa → aguardando_beat`; grade remains visible; ignore `ESCOLHER_OPCAO` during beat; MUST NOT call `avancarAcerto` until `FIM_BEAT_ACERTO`; MUST NOT show **Continuar** on acerto (FR-003)
- [ ] T016 [US1] Schedule `FIM_BEAT_ACERTO` in the browser adapter of `js/mesa.js` (400 ms default, 0 ms when `sessao.movimentoReduzido` / `prefers-reduced-motion: reduce`); FSM in `js/quiz.js` MUST NOT use `setTimeout`; Node tests fire the event immediately (research.md §7)
- [ ] T017 [US1] Point stub grading and `abrirResultado()` in `js/quiz.js` / `js/mesa.js` at hero Flush and A/B Par; keep vencedor RN-030 (`voce` mão 1, `voce_a` mão 2+); MUST NOT use `alert`/`confirm`/`prompt`; existing SFX `playAudio('acerto'|'erro')` stay (FR-021, FR-023)
- [ ] T018 [US1] Render marcas and disabled/Tab behavior in `js/mesa.js` `gradeOpcoes()` plus `css/hud.css` (depends on T007): visible ✕/✓ besides HUD text; `data-estado` matches `acertada`/`eliminada`; dead buttons `disabled` and out of tab order (CA-025, FR-024)

**Checkpoint**: User Story 1 fully functional and independently testable (clique-submete + feedback canônico + opção morta + beat)

---

## Phase 4: User Story 2 - Marcar várias opções e só submeter em Confirmar (Priority: P1)

**Goal**: Após acertar a mão atual no flop, HUD em `flop_upgrade` (6 categorias, **Confirmar**); toggle não avalia; 1ª/2ª **Confirmar** aplicam RN-024/025 na UI; turn permanece `sem_upgrade`

**Independent Test**: No flop, após acerto de Flush, usar o stub de múltipla seleção (Flush verdadeiro, Par distratora): marcar, **Confirmar**, falso positivo e omissão, mortas/travadas, retry até o conjunto exibido estar correto; o turn permanece skip `sem_upgrade`

### Tests for User Story 2

- [ ] T019 [P] [US2] Extend `tests/contract/quiz.test.js` for múltipla seleção per `specs/003-feedback-persistencia/contracts/quiz.md` §9.5–9.10: toggle does not change feedback/counters; only `CONFIRMAR` evaluates; 1st Confirmar Flush+Par → Par eliminada, Flush travado, pergunta não fecha; empty 1st Confirmar → Flush still ativável; 2nd Confirmar does not change counters; conjunto só Flush → acerto + beat; `turn_skip` / **Continuar** leaves `upgrade` unchanged
- [ ] T020 [P] [US2] Extend `tests/contract/hud-session.test.js` per `specs/003-feedback-persistencia/contracts/hud-cadencia.md` §6.4–6.8, §6.11: `flush` + `FIM_BEAT_ACERTO` → `flop_upgrade` with CTA **Confirmar** and 0 `sem_upgrade`; `ALTERNAR_OPCAO` stays `perguntando` with feedback null; `CONFIRMAR` with only `flush` + beat → `deal` turn (not skip); `turn_hero` + `flush` + beat → `sem_upgrade` + **Continuar**; 0 **Confirmar** on `flop_hero` / `river_*`; helper `ate()` no longer uses `flop_skip`

### Implementation for User Story 2

- [ ] T021 [P] [US2] Add `criarOpcoesUpgrade()` and `enunciadoDoPasso(PASSOS.flop_upgrade)` in `js/quiz.js`: exactly the same 6 category faces; `conjuntoCorreto = ['flush']`; Par and the other four are distractors; enunciado exactly the §5.4 copy (FR-020)
- [ ] T022 [US2] Implement `ALTERNAR_OPCAO` in `js/quiz.js` and `js/mesa.js` `aplicar()`/`onOpcao`: toggle `selecionada` / `aria-pressed` on ativável options in `multipla`; MUST NOT evaluate or write storage; `ESCOLHER_OPCAO` in `multipla` MUST toggle or be unused (mesa emits `ALTERNAR_OPCAO` only) (FR-002, RN-047)
- [ ] T023 [US2] Implement `CONFIRMAR` UI rules in `js/quiz.js` per quiz.md §4: 1st confirm applies RN-024 (true marked → lock ✓; true omitted → stay ativável; distractor marked → eliminada ✕; distractor unmarked → stay ativável); later confirms only fix the displayed set (RN-025); ignore un-toggle of locked and re-activate of dead; perfect displayed set → `Você acertou` + beat (FR-011)
- [ ] T024 [US2] Change cadence in `js/mesa.js` `avancarAcerto()` / `continuar()` / `onCta()`: `flop_hero` beat → `perguntando` `flop_upgrade` (not `abrirSkip`); `flop_upgrade` beat → deal turn (burn cênico + slot 4) without **Continuar**; remove `flop_skip` from PASSOS usage; `turn_hero` beat still `turn_skip` + **Continuar** → deal river (FR-020, RN-G002)
- [ ] T025 [US2] Render **Confirmar** in `js/mesa.js` `renderHud()` for `multipla` outside beat: CTA after the option grid; Tab order ativáveis → **Confirmar**; Enter/Space on **Confirmar** evaluates; `aria-pressed` on selected chips; ignore Confirmar during `aguardando_beat` (FR-024, hud-cadencia.md §4)

**Checkpoint**: User Stories 1 AND 2 independently testable (única no clique + múltipla só no Confirmar + skip do turn)

---

## Phase 5: User Story 3 - Guardar só a primeira tentativa, e sobreviver a fechar a aba (Priority: P1)

**Goal**: Só a 1ª tentativa altera contadores e já está em `localStorage` na hora; erro-depois-acerto = +1 erro +0 acerto na categoria **correta**; fechar/reabrir na mesma origem preserva; skip de upgrade não conta

**Independent Test**: Errar depois acertar a mesma pergunta de categoria e ler os contadores: +1 erro e +0 acerto em Flush. Acertar Flush de primeira, fechar e reabrir: `mao_atual.flush` permanece. Zero tela de relatório e zero botão zerar (ausência visual completa na US5).

### Tests for User Story 3

- [ ] T026 [P] [US3] Write contract tests in `tests/contract/storage.test.js` per `specs/003-feedback-persistencia/contracts/storage.md` §7.1–7.4: `evolucaoZerada()` has 10+10+1 all zero and `exposicoes === acertos + erros`; absent key `ler()` = zeros and 0 `setItem`; delta acerto Flush `mao_atual` writes all 10 keys with `flush.acertos === 1` and `par` present at 0; second delta on the same cell sums (quiz still owns “one first attempt”)
- [ ] T027 [P] [US3] Extend `tests/contract/quiz.test.js` per quiz.md §9.3–9.4, §9.6–9.8, §9.10, §9.12–9.13: error then acerto on hero → `mao_atual.flush` +1 erro +0 acerto exposicoes 1 (distractor chute does not increment the distractor); first-try Flush acerto; 1st Confirmar Flush+Par → `upgrade.flush` +1 acerto and `upgrade.par` +1 erro; empty 1st Confirmar → `upgrade.flush` +1 erro and unmarked distractors 0; 2nd Confirmar counters frozen; vencedor 1ª tentativa only `vencedor_pote`; river three independent `mao_atual` exposures (Flush, Par, Par); `turn_skip` does not touch `upgrade`
- [ ] T028 [P] [US3] Extend `tests/contract/hud-session.test.js`: after 1ª tentativa with fake storage, simulated reload/`criarSessao` + `ler()` keeps counters while HUD is `ociosa`; write happens before `FIM_BEAT_ACERTO` / next passo (hud-cadencia.md §6.10, FR-008, FR-014)

### Implementation for User Story 3

- [ ] T029 [US3] Make `js/quiz.js` the unique writer: when `faseTentativa` leaves `aguardando_primeira`, compute deltas then `storage.aplicarDeltas` (full 10+10+1 blob) **before** painting retry or entering `aguardando_beat`; later attempts MUST NOT write (FR-008, quiz.md §7)
- [ ] T030 [US3] Implement seleção única deltas in `js/quiz.js`: acerto or erro on the **correct** `CategoriaId` in `mao_atual` (never the guessed distractor); winner question increments only `vencedor_pote` (FR-009, FR-022, RN-032)
- [ ] T031 [US3] Implement 1st `CONFIRMAR` RN-024 deltas in `js/quiz.js` as a single `ler` + sums + one `gravar` (true marked acerto; true omitted erro; distractor marked erro; distractor unmarked 0); subsequent `CONFIRMAR` MUST NOT call `gravar` (FR-010, FR-011, storage.md §3)
- [ ] T032 [US3] Inject storage into `criarSessao({ storage })` in `js/mesa.js` (default `criarStorage()`); hydrate `sessao.evolucao` via `ler()` on boot; **Continuar** on `turn_skip` MUST NOT write `upgrade`; `js/mesa.js` MUST NOT call `localStorage` (FR-019)
- [ ] T033 [US3] Keep reload aborting the hand (`ociosa`, `mao = null`) without wiping `poker-trainer:evolucao` in `js/mesa.js` / `js/storage.js`; lazy write: boot MUST NOT `setItem` zeros (FR-013, FR-014, CA-023)

**Checkpoint**: User Stories 1–3 independently testable (1ª tentativa imediata + JSON só de contadores)

---

## Phase 6: User Story 4 - Não decorar o botão: ordem visual embaralhada (Priority: P2)

**Goal**: Cada pergunta **nova** embaralha opções (G008); retry da mesma pergunta não permuta; embaralhar opções MUST NOT tocar o baralho da mão

**Independent Test**: Abrir a mesma pergunta stub em várias mãos e ver que Flush não fica sempre no mesmo botão; após um erro, a ordem daquela pergunta permanece

### Tests for User Story 4

- [ ] T034 [P] [US4] Extend `tests/contract/quiz.test.js` per quiz.md §9.11 / §5.5: `shuffleOpcoes` accepts injectable `rng`; 10 independent `apresentar` of the same new question → correct id not at the same index in all; retry after error MUST NOT permute; module MUST NOT import `js/baralho.js`

### Implementation for User Story 4

- [ ] T035 [US4] Implement `shuffleOpcoes(opcoes, rng = Math.random)` called only when presenting a new `PerguntaDaMesa` in `js/quiz.js`; freeze `ordemVisual` after the first error; MUST NOT reshuffle on retry (FR-007, RN-G008)
- [ ] T036 [US4] Guard isolation in `js/quiz.js` and `js/mesa.js`: option shuffle MUST NOT call `embaralhar` / `montarMao` in `js/baralho.js`; advancing a question MUST NOT replace `mao.permutacao` / `mao.cartasJogo` (continuity of feature 002)

**Checkpoint**: User Stories 1–4 independently testable (G008 ao apresentar, retry estável)

---

## Phase 7: User Story 5 - Treinar sem dashboard e sem botão zerar (Priority: P2)

**Goal**: Percorrer a mesa do deal ao desfecho sem relatório, gráfico, ranking, tabela de stats ou botão zerar; limpar dados do site no navegador é o único reset

**Independent Test**: Percorrer ociosa → uma mão até `resultado` → **Próxima mão** e procurar relatório/zerar; confirmar ausência. Limpar dados do site (quando o ambiente permitir) e confirmar que a mesa ainda abre com contadores zerados.

### Tests for User Story 5

- [ ] T037 [P] [US5] Extend `tests/contract/hud-session.test.js` per hud-cadencia.md §6.12: session model has 0 zerar CTA and 0 relatório fields; allowed CTA names only `Nova mão` / `Próxima mão` / `Continuar` / `Confirmar`; `resultado` reiterates already-acertadas categories, not counters (CA-024, FR-016)

### Implementation for User Story 5

- [ ] T038 [US5] Audit `index.html`, `js/mesa.js`, `css/hud.css`, and `js/quiz.js`: no report route/view, no desempenho table/chart, no **Zerar** control, no mute, no desistir, no quiz preflop; nicknames stay **Você** / **Adversário A** / **Adversário B** (FR-016, FR-025)
- [ ] T039 [US5] Keep `js/storage.js` without a UI-facing `clear`/`zerar` export; `removeItem` only in `tests/contract/storage.test.js` (ADR-002, CA-024)
- [ ] T040 [US5] Keep `abrirResultado()` in `js/mesa.js` as category labels already acertadas this hand (Você Flush, A Par, B Par) — MUST NOT dump `sessao.evolucao` into the HUD (FR-005, FR-016)

**Checkpoint**: User Stories 1–5 independently testable (evolução invisível na UI)

---

## Phase 8: User Story 6 - Continuar o treino se a memória do dispositivo falhar (Priority: P3)

**Goal**: Storage recusado, cheio ou corrompido não trava a mesa; incompleto ≠ corrupção dura; LWW sem mescla e sem aviso; zero pedido de PII

**Independent Test**: Completar uma pergunta com armazenamento indisponível (treino segue, sem modal). Simular dado corrompido: a mesa não quebra; a visita seguinte trata contadores como zerados. Zero pedido de dado pessoal.

### Tests for User Story 6

- [ ] T041 [P] [US6] Extend `tests/contract/storage.test.js` per storage.md §7.5–7.11: unreadable `{` → zeros, no throw; `mao_atual` valid without `upgrade` → upgrade zeros, `mao_atual` preserved; `{ "foo": 1 }` → hard corruption zeros; extra `"debug"` ignored; `setItem` throws → `gravar` false, no throw; two writes LWW (second blob replaces first); module references neither `document`, `alert`, `indexedDB` nor `sessionStorage`
- [ ] T042 [P] [US6] Extend `tests/contract/quiz.test.js` (and hud-session if needed): with `indisponivel: true` storage, error/acerto still produce HUD copy and the hand can finish; 0 throw to `aplicar()`; 0 PII fields in any written blob (SC-010, FR-017)

### Implementation for User Story 6

- [ ] T043 [US6] Implement read normalization in `js/storage.js` per storage.md §4: absent/unreadable/incompatible → in-memory zeros without writing; missing bucket/category → 0 preserving the rest; unknown keys ignored; non-integer/negative cell → 0 that cell only (FR-018)
- [ ] T044 [US6] Fail-open writes in `js/storage.js` + consumers in `js/quiz.js` / `js/mesa.js`: quota/`SecurityError`/null api → `false` and keep this visit’s deltas only in `sessao.evolucao`; MUST NOT `alert`, MUST NOT HUD jargon (`localStorage`, quota, cookie), MUST NOT block the panel (FR-017, constitution VII)
- [ ] T045 [US6] Enforce last-write-wins in `js/storage.js` `aplicarDeltas`: full blob replace; MUST NOT merge increments across tabs; MUST NOT listen to `storage` events for conflict UI (clarification + FR-017)
- [ ] T046 [US6] Privacy lock in `js/storage.js` and `js/quiz.js`: persisted JSON only the three buckets; MUST NOT write name/e-mail/CPF/apelido/cartas/enunciados/cursor pool/timestamp/`versao`/session id; MUST NOT `fetch`/`sendBeacon`; MUST NOT prompt for identifiers (FR-015, RN-039, SC-011)

**Checkpoint**: All user stories independently functional (contrato de quiz + evolução fail-open)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validação ponta a ponta, privacidade, idioma e guarda de escopo negativo

- [ ] T047 Run `node --test tests/contract/` and close gaps against `specs/003-feedback-persistencia/contracts/quiz.md` §9, `storage.md` §7, and `hud-cadencia.md` §6 (001 audio + 002 baralho cases MUST still pass)
- [ ] T048 [P] Update the local-test and Privacidade sections of `README.md`: mention `js/quiz.js`, `js/storage.js`, `tests/contract/quiz.test.js`, `tests/contract/storage.test.js`, and that the only persisted key is `poker-trainer:evolucao` (replace the “esta etapa ainda não grava chaves” sentence)
- [ ] T049 Execute manual quickstart scenarios S1–S10 from `specs/003-feedback-persistencia/quickstart.md` against `http://localhost:8080` at 1280×720 (not `file://`)
- [ ] T050 Audit DevTools Application plus source: only `poker-trainer:evolucao` (three buckets, 10+10 ids always present); zero PII/cartas/timestamp; nicknames remain **Você** / **Adversário A** / **Adversário B**; no name/e-mail fields in `index.html`, `js/mesa.js`, `js/quiz.js`, `js/storage.js`; 0 `fetch` of telemetry (SC-011)
- [ ] T051 Confirm negative scope: no `js/motor.js`; no leftover `js/quiz-stub.js`; no relatório/zerar/mute/desistir/preflop quiz; five HUD states only; `js/baralho.js` still unused by option shuffle; RN-G001 (one question) and RN-G005 (no skip/reveal) hold in `js/quiz.js` / `js/mesa.js`
- [ ] T052 Confirm beat adapter in `js/mesa.js` is 0 ms under `prefers-reduced-motion: reduce`, keyboard path (Tab skips dead/locked; Enter/Space submits unica or toggles multipla; **Confirmar**/**Continuar** reachable), and copy stays the exact pt-BR strings in `js/quiz.js` `COPY`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) is the MVP increment (seleção única + feedback + beat)
  - US2 precisa do beat/acerto de `flop_hero` (US1) para abrir `flop_upgrade`; `js/mesa.js` é gargalo de um arquivo — ordem P1 sequencial recomendada
  - US3 precisa de US1 (deltas `unica`) e US2 (deltas da 1ª **Confirmar**)
  - US4 pode testar `shuffleOpcoes` em paralelo após T006; freeze no retry espera US1
  - US5 é guarda de UI após Confirmar existir (US2)
  - US6 fail-open de `js/storage.js` pode ser testado após T005; HUD sem jargão espera US1/US3
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no other story. MVP.
- **User Story 2 (P1)**: After US1 (needs `FIM_BEAT_ACERTO` on `flop_hero` before replacing `flop_skip` with `flop_upgrade`)
- **User Story 3 (P1)**: After US1 + US2 (1ª tentativa única e 1ª Confirmar); `js/storage.js` API already from Phase 2
- **User Story 4 (P2)**: After US1 freeze-on-retry; RNG injection can start after T006
- **User Story 5 (P2)**: After US2 (CTA **Confirmar** exists so the allow-list is complete)
- **User Story 6 (P3)**: Storage normalization after T005; quiz fail-open after US3 writer exists

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- `js/storage.js` schema before deltas
- `js/quiz.js` modo `unica` before `multipla`
- Cadence `flop_upgrade` before first-attempt `upgrade` deltas
- Core HUD contract before persistence
- Persistence happy path before fail-open
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 1: T001 and T002 in parallel; T003 is a `package.json` guardrail
- Phase 2: T004 and T007 in parallel; T005 after T004; T006 after T001; T008 can start after T001 (session fields) in parallel with T005; T009 after T006+T008; T010 after T009
- US1: T011 and T012 in parallel; then T013 → T015 sequential on quiz/mesa; T018 after T007
- US2: T019 and T020 in parallel; T021 (`js/quiz.js` factory) in parallel with those tests; T022 → T025 sequential on `js/mesa.js`/`js/quiz.js`
- US3: T026, T027, T028 in parallel (three test files); then T029 → T033
- US4: T034 then T035/T036
- US6: T041 and T042 in parallel after US3 API exists
- Polish: T048 (README) in parallel with T050/T051 source audit
- Do not parallelize tasks that edit the same file (`js/mesa.js`, `js/quiz.js` after the initial split, `js/storage.js` after T004, `tests/contract/hud-session.test.js`)

---

## Parallel Example: User Story 1

```bash
# After Phase 2, launch US1 contract tests together:
Task: "Write unica quiz tests in tests/contract/quiz.test.js"
Task: "Update ate() / Flush / beat tests in tests/contract/hud-session.test.js"

# Then sequential quiz+mesa: submit-on-click → error/dead → acerto+beat → adapter 400/0
```

## Parallel Example: User Story 3

```bash
Task: "Write storage schema tests in tests/contract/storage.test.js"
Task: "Write first-attempt quiz tests in tests/contract/quiz.test.js"
Task: "Write reload-preserves-counters tests in tests/contract/hud-session.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: seleção única no clique, copy canônica, opção morta, beat, zero `alert`
5. Demo do contrato de responder se pronto (skip do flop ainda aceitável até US2)

### Incremental Delivery

1. Setup + Foundational → `js/quiz.js` + `js/storage.js` + migração fora do stub
2. US1 → clique-submete + feedback + beat (MVP!)
3. US2 → `flop_upgrade` + **Confirmar** + skip do turn
4. US3 → 1ª tentativa imediata no `localStorage`
5. US4 → G008 estável no retry
6. US5 → zero relatório/zerar
7. US6 → fail-open + corrupção + LWW
8. Polish → `node --test` + quickstart S1–S10 + auditoria LGPD/escopo

Cada história soma valor sem reabrir features 004–006 (motor de melhor-5 / upgrades reais / vencedor autoritativo).

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US2 → US3 on `js/quiz.js` + `js/mesa.js` (single owner to avoid FSM conflicts)
   - Developer B: `tests/contract/storage.test.js` + `js/storage.js` fail-open (T004–T005, US6)
   - Developer C: `css/hud.css` marks (T007) and README (T048) only if file ownership is split
3. US4 RNG tests can sit with Developer B (`tests/contract/quiz.test.js` G008) after US1 freeze exists
4. HUD DOM (`gradeOpcoes` / **Confirmar**) stays on the owner of `js/mesa.js`

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to spec.md user stories US1–US6
- UI copy MUST be pt-BR; feedback/CTA/enunciados MUST match `contracts/quiz.md` §1 exactly
- Stub correction MAY not match the honest board until features 004–006; counters follow the **contract of the current question**
- Verify tests fail before implementing
- Stop at any checkpoint to validate the story independently
- `/speckit-implement` executes this list; this command does **not** implement application code
- MUST NOT commit from `/speckit-tasks`
