---
description: "Task list for feature implementation"
---

# Tasks: Identificação de mãos ainda possíveis (flop e turn)

**Input**: Design documents from `/specs/005-maos-ainda-possiveis/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Pedidos explicitamente no plan.md (Testing) / research.md §8 / `contracts/motor-upgrades.md` §6 / `contracts/quiz-upgrades.md` §8 — `node --test` estendendo `tests/contract/motor.test.js` e atualizando `tests/contract/quiz.test.js` e `tests/contract/hud-session.test.js`. Sem Playwright/Cypress, sem bundler. Validação visual via `quickstart.md` (S1–S8).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Site estático na raiz do repositório (ADR-006 / plan.md): `index.html`, `css/`, `js/`, `assets/`, `tests/contract/`. **MUST** estender `js/motor.js` (`snapshotDesconhecido`, `enumerarUpgrades`, `conjuntoOpcoesUpgrade`). **MUST** alterar `js/quiz.js` (preparo no pouso; `flop_upgrade` / `turn_upgrade` reais; `flop_skip`). **MUST** alterar cadência em `js/mesa.js` (pergunta, skip ou aborto após a 5.3). **MUST NOT** `js/mesa.js` importar `js/motor.js` nem chamar `localStorage`. **MUST NOT** persistir runouts, snapshot, Melhor5 ou kickers. **MUST NOT** lib de poker, bundler, backend, Worker. Kickers MUST NEVER na UI. UI visível MUST ser pt-BR (rótulos RN-014 exatos). 0 pergunta de upgrade no river.

## Escolhas registradas (ambíguo → padrão)

- Testes automatizados: **incluir** (plan.md Testing + research.md §8 + contratos §6/§8). Visual permanece manual (quickstart S1–S8).
- TDD nas fases de história: escrever os testes de contrato **antes** da implementação daquela história e garantir que falham.
- Git: permanecer em `main` (identidade Spec Kit `005-maos-ainda-possiveis`).
- Módulo: estender `js/motor.js` (ADR-003). Quiz prepara a lista; mesa **não** importa motor.
- Momento: determinar RN-020 no pouso (`apresentarPergunta(flop_hero|turn_hero)`). Mostrar só após beat da 5.3.
- Falha síncrona: se `enumerarUpgrades` retornar `{ ok: false }` no pouso, abortar **já no pouso** (`ociosa` + **Nova mão**) — preferível quando a falha é síncrona. O teto de 1 s extra no estado de acerto permanece só se `upgradesStreet` estiver `pendente` no beat da 5.3.
- Execução: síncrona no thread da UI; sem Worker. Early-out só quando **todas** as categorias mais fortes que a atual já foram testemunhadas (não ao achar 6).
- Snapshot: `RANKS × NAIPES` − visíveis ao herói. Nunca o baralho vivo. Burns não retiram carta. Holes A/B permanecem no desconhecido.
- Testemunha: só melhor 5 das **7** finais; ranking completo da 004. No flop, Melhor5 das 6 intermediárias MUST NOT testemunhar.
- `conjuntoOpcoesUpgrade`: regra completa FR-010/011 já na US1 (a 5.4 precisa de 6 opções). A US3 trava CA-014, G008, foco e “não couberam”.
- Passos: `turn_upgrade` e `flop_skip` novos; `turn_skip` permanece para lista vazia no turn.
- Distratoras: mais forte → mais fraca na tabela canônica (já na spec).
- Pote hipotético: não filtra.
- Persistência: só delta `upgrade` das exibidas na 1ª Confirmar; 0 runouts na chave.
- Foco / marcar todas: reuso de `focarPrimeiroHabilitado`; 0 controle “marcar todas”.
- Aborto: copy exatamente **Não foi possível continuar esta mão. Tente de novo.** MUST NOT reusar a copy de montagem.
- Lint/format: **não** adicionar ESLint/Prettier (YAGNI / constitution III).
- Relatório / zerar / lib / backend / draws: ausentes.
- `js/storage.js`, `js/baralho.js`, `js/carta.js`, `js/audio.js`, `css/`: intocados.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Encaixar o enumerador no `js/motor.js` já entregue pela 004, sem backend, sem bundler e sem lib de poker

- [X] T001 Extend DOM-free ES module `js/motor.js` with placeholder exports `snapshotDesconhecido(visiveis)`, `enumerarUpgrades({ holeHeroi, comunitarias })` and `conjuntoOpcoesUpgrade({ upgrades })`; keep existing `CATEGORIAS`, `avaliarMelhor5` and `conjuntoOpcoesMaoAtual`; MAY import only `RANKS` / `NAIPES` from `js/baralho.js`; MUST NOT import `embaralhar`, mistura, `js/quiz.js`, `js/storage.js`, `js/mesa.js`, `document`, `alert`, or `localStorage`; update the file header to state “melhor 5 + RN-017 + enumerador de upgrades; sem quemGanhou”
- [X] T002 Add `PASSOS.flop_skip` and `PASSOS.turn_upgrade` plus `COPY.linhaErroEnumeracao = 'Não foi possível continuar esta mão. Tente de novo.'` in `js/quiz.js`; confirm `package.json` stays `"type": "module"` with zero runtime dependencies and no bundler/lint/Playwright/poker-lib scripts; confirm `index.html` still loads only `js/mesa.js`; confirm `js/mesa.js` does not import `js/motor.js` and still MUST NOT call `localStorage`; MUST NOT add CSS files for this feature

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Snapshot do information set, assinaturas do enumerador, preparo oculto no pouso e helper de cadência — bloqueiam TODAS as user stories

**⚠️ CRITICAL**: Nenhuma user story pode começar até esta fase estar completa

- [X] T003 Implement `snapshotDesconhecido(visiveis)` in `js/motor.js` per `specs/005-maos-ainda-possiveis/contracts/motor-upgrades.md` §2: return `(RANKS × NAIPES) − visiveis` identities; MUST NOT mutate the input array; MUST NOT subtract burns; holes of A/B stay in the snapshot when absent from `visiveis` (depends on T001)
- [X] T004 Implement arity / failure guards in `js/motor.js`: `enumerarUpgrades` MUST return `{ ok: false }` (never throw to UI, never `{ ok: true, upgrades: [] }` as a stand-in for failure) when `holeHeroi.length !== 2`, `comunitarias.length` ∉ {3,4}, snapshot length ≠ 47/46, duplicated visible identities, or `avaliarMelhor5` throws; success MAY still return a placeholder `{ ok: true, categoriaAtual, upgrades: [] }` until US1; `conjuntoOpcoesUpgrade` MUST accept `{ upgrades }` and return `{ ids, verdadeiros }` (placeholder ok); MUST NOT persist runouts, snapshot, Melhor5 or `chaveDesempate` (depends on T003)
- [X] T005 Add `prepararUpgradesStreet(sessao)` and `decidirPosMaoAtual(sessao)` in `js/quiz.js`: on `apresentarPergunta(flop_hero|turn_hero)`, after mounting the 5.3, extract hole `[4][5]` and comunitárias (flop `[6][7][8]` / turn `[6]..[9]`) from `sessao.mao.cartasJogo`, call `enumerarUpgrades`, store `sessao.mao.upgradesStreet = { ok, lista, categoriaAtual, conjunto, street }` in visit memory only; `decidirPosMaoAtual` MUST return `'pergunta' | 'skip' | 'falha' | 'pendente'`; MUST NOT copy runouts, snapshot or `chaveDesempate` onto `sessao.hud` / storage; MUST NOT present 5.4 or `sem_upgrade` at this instant; if `!ok` at pouso, MAY leave `ok: false` for mesa to abort (depends on T004)
- [X] T006 Confirm isolation: `js/motor.js` has 0 `indexedDB` / `sessionStorage` / `fetch` / `sendBeacon` / Unicode baralho / poker CDN / Worker; `js/storage.js`, `js/baralho.js`, `js/carta.js` and `js/audio.js` stay untouched; `js/mesa.js` still MUST NOT import `js/motor.js`; cadence comments may note the new decision helper but MUST NOT yet replace the stub Flush-upgrade / forced `turn_skip` paths (that is US1/US2)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Marcar upgrades reais no flop (Priority: P1) 🎯 MVP

**Goal**: Depois de acertar a mão atual no flop, o HUD pergunta **“Quais mãos você ainda não tem, mas ainda pode formar?”** com a lista RN-020 real (não o stub Flush-verdadeiro), ou skip se a lista for vazia, ou aborto se a enumeração falhar. O turn **não** abre no acerto da 5.3.

**Independent Test**: Depois de acertar a mão atual num flop em carta alta com upgrades reais, a grade **não** é o conjunto stub Flush-verdadeiro; Flush só é upgrade se algum desfecho tiver melhor mão exatamente Flush. Acerto do conjunto (ou skip) permanece na street — o turn ainda não abre.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T007 [P] [US1] Extend `tests/contract/motor.test.js` per `specs/005-maos-ainda-possiveis/contracts/motor-upgrades.md` §6.1–6.5, §6.8, §6.14: flop 2 hole + 3 board → snapshot length 47; `enumerarUpgrades` does not mutate input arrays or a caller `cartasJogo`; flop pair whose Melhor5 of 6 is Flush and of 7 is Full house → witnesses `full_house` not `flush`; `holeHeroi` length 1 or `comunitarias` length 2 → `{ ok: false }` not empty list; `carta_alta` ∉ `upgrades`
- [X] T008 [P] [US1] Update `tests/contract/quiz.test.js` per `contracts/quiz-upgrades.md` §8.1–8.4: after flop pousado, `flop_hero` visible, 0 upgrade grid, `upgradesStreet` already `ok` or `falha` in memory; `CONJUNTO_UPGRADE_STUB` MUST NOT remain the source of `flop_upgrade`; acerto 5.3 + beat + lista ≥ 1 → `flop_upgrade`, enunciado exactly `Quais mãos você ainda não tem, mas ainda pode formar?`, 6 opções, CTA **Confirmar**, toggle does not submit; Flush is `verdadeira` only if RN-020 says so; turn still closed
- [X] T009 [P] [US1] Update helper `ate()` / cadence cases in `tests/contract/hud-session.test.js`: `FIM_BEAT_ACERTO` on `flop_hero` MUST NOT open the turn; MUST go to `flop_upgrade` or `flop_skip` or `ociosa` via `decidirPosMaoAtual`; existing 002 montagem / `FALHA_MONTAGEM` / cartas continuity cases MUST still pass; river stub and A/B remain; tests that assumed Flush-verdadeiro on every flop MUST be rewritten against a constructed `cartasJogo` fixture

### Implementation for User Story 1

- [X] T010 [US1] Implement flop branch of `enumerarUpgrades({ holeHeroi, comunitarias })` in `js/motor.js`: snapshot of 47; every unordered pair `(t, r)`; witness = `avaliarMelhor5([...holeHeroi, ...comunitarias, t, r])` (always 7 cards); a runout whose category is D witnesses **only** D; RN-020 = witnessed ids strictly stronger than `avaliarMelhor5` of the 5 visibles, excluding `carta_alta`; return `{ ok: true, categoriaAtual, upgrades }` ordered strong→weak; early-out only when every stronger category is found; MUST NOT filter by hypothetical pot; MUST NOT include runouts in the return (depends on T004)
- [X] T011 [US1] Implement `conjuntoOpcoesUpgrade({ upgrades })` in `js/motor.js` per `contracts/motor-upgrades.md` §4 / FR-010/011: 1–5 → all upgrades + distractors strong→weak until 6; ≥6 → exactly the 6 strongest, 0 distractor, omitted ids absent; return `{ ids[6], verdadeiros }`; no shuffle; MUST NOT be called on empty list (depends on T010)
- [X] T012 [US1] Replace stub `criarOpcoesUpgrade` / `CONJUNTO_UPGRADE_STUB` in `js/quiz.js` for `PASSOS.flop_upgrade`: map `upgradesStreet.conjunto` (or call `conjuntoOpcoesUpgrade`) → `{ id, rotulo }` via `CATEGORIAS`; `verdadeira === verdadeiros.includes(id)`; `shuffleOpcoes` (existing RNG) only when presenting a **new** question; set `sessao.mao.conjuntoCorreto = verdadeiros` and `corretaUnica = null`; CTA **Confirmar**; keep `criarOpcoesCategoria` stub for `river_hero` / A/B; MUST NOT import `js/baralho.js` (depends on T005, T011)
- [X] T013 [US1] Change `avancarAcerto()` in `js/mesa.js` for `flop_hero`: call `decidirPosMaoAtual(sessao)` → `'pergunta'` opens `flop_upgrade`, `'skip'` opens `abrirSkip(sessao, PASSOS.flop_skip)`, `'falha'` aborts to `ociosa` with `COPY.linhaErroEnumeracao` (not `LINHA_ERRO_MONTAGEM`); `'pendente'` MAY stay on acerto ≤ 1 s extra then treat as falha; extend `continuar()` so `flop_skip` starts the turn deal; if `!ok` already at pouso, abort before showing 5.3; MUST NOT import `js/motor.js`; MUST NOT spinner / “calculando”; MUST NOT open the turn on the 5.3 beat (depends on T012)

**Checkpoint**: User Story 1 fully functional and independently testable (flop 5.4 real + skip/falha + turn still closed)

---

## Phase 4: User Story 2 - Marcar upgrades reais no turn (Priority: P1)

**Goal**: Depois de acertar a mão atual no turn, a mesa deixa o skip forçado da 003 e aplica a mesma regra de upgrades com 46 desconhecidas (cada uma como river). O river **não** abre no acerto da 5.3. **Não** há 5.4 no river.

**Independent Test**: Num turn com exatamente 2 upgrades, a grade tem esses 2 mais 4 distratoras (CA-015). Num turn sem upgrade, só skip + **Continuar**, sem grade. O river não abre no acerto da mão atual.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T014 [P] [US2] Extend `tests/contract/motor.test.js` per `contracts/motor-upgrades.md` §6.1, §6.13: turn 2 hole + 4 board → snapshot length 46; `enumerarUpgrades` with 4 comunitárias enumerates each of the 46 as river and witnesses Melhor5 of the 7; exactly 2 upgrades → `conjuntoOpcoesUpgrade` has 2 `verdadeiros` + 4 distractors
- [X] T015 [US2] Extend `tests/contract/quiz.test.js` and `tests/contract/hud-session.test.js` per `contracts/quiz-upgrades.md` §8.5–8.6, §8.11: after flop (real 5.4 or skip) and turn pousado, 0 upgrade until 5.3 beat; then `turn_upgrade` (not forced `turn_skip`) when lista ≥ 1; CA-015 fixture with exactly 2 upgrades → 2 true + 4 distractors; acerto conjunto + beat → river deal; 0 second 5.4 on that street; 0 `*_upgrade` on river; helper `ate()` MUST NOT assume `turn_hero` beat → skip

### Implementation for User Story 2

- [X] T016 [US2] Implement turn branch of `enumerarUpgrades` in `js/motor.js`: `comunitarias.length === 4`; snapshot of 46; each unknown as river; same RN-020 filter and `{ ok: true|false }` contract as flop; MUST NOT use `[10]` from a live shoe; MUST NOT witness a 6-card intermediate (depends on T010)
- [X] T017 [US2] Wire `js/quiz.js` `PASSOS.turn_upgrade`: `modoDoPasso` returns `'multipla'`; `enunciadoDoPasso` uses `COPY.enunciadoUpgrades`; `apresentarPergunta(turn_upgrade)` reuses the US1 `criarOpcoesUpgrade` path against `upgradesStreet` of the turn; `prepararUpgradesStreet` already runs on `turn_hero` pouso; `turn_skip` remains only when lista is empty; MUST NOT skip the turn 5.4 just because the flop was charged (depends on T012, T016)
- [X] T018 [US2] Change `avancarAcerto()` / `continuar()` / `onCta` in `js/mesa.js`: `turn_hero` beat → `decidirPosMaoAtual` pergunta (`turn_upgrade`) / skip (`turn_skip`) / falha (`ociosa`); `turn_upgrade` beat → deal river (same as today’s `flop_upgrade` → turn); `turn_skip` + **Continuar** → deal river (existing); 0 upgrade question after the fifth community card; `js/mesa.js` still MUST NOT import `js/motor.js` (depends on T013, T017)

**Checkpoint**: User Stories 1 AND 2 independently testable (flop + turn 5.4 reais; river sem upgrade)

---

## Phase 5: User Story 3 - Ver até 6 opções: todos os upgrades cabíveis ou os 6 mais fortes (Priority: P1)

**Goal**: Cada pergunta de upgrades mostra **sempre 6** rótulos canônicos (salvo skip). Com 1–5 upgrades, todos + distratoras; com ≥6, só os 6 mais fortes, sem distratora; os que não couberam não são cobrados. Ordem visual embaralhada só ao apresentar; retry não reembaralha. Foco na primeira opção.

**Independent Test**: Flop em carta alta com 7 ou mais upgrades: as opções são exatamente as 6 mais fortes (Royal flush, Straight flush, Quadra, Full house, Flush, Straight), todas obrigatórias, zero distratora; Par / Dois pares / Trinca não aparecem mesmo que também sejam possíveis (CA-014).

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T019 [P] [US3] Extend `tests/contract/motor.test.js` per `contracts/motor-upgrades.md` §6.11–6.13: 1–5 upgrades → length 6, all upgrades included, remainder distractors strong→weak; ≥7 upgrades (Carta alta extremo) → `ids` = royal, SF, quadra, FH, flush, straight, 0 distractor, par/dois pares/trinca out (CA-014 / SC-001); same input → same id set (ignore visual order)
- [X] T020 [P] [US3] Extend `tests/contract/quiz.test.js` per `contracts/quiz-upgrades.md` §8.14–8.16: ten **new** upgrade questions → obligatory set MUST NOT occupy the same visual order in all (G008); retry after error MUST NOT permute; upgrades omitted from the 6 get 0 acerto / 0 erro / 0 exposição on first Confirmar; opening 5.4 focuses the first visual option (`focarPrimeiroHabilitado`); 0 control whose label/action is “marcar todas”; empty list MUST NOT force 6 options (skip path)

### Implementation for User Story 3

- [X] T021 [US3] Close remaining `conjuntoOpcoesUpgrade` gaps in `js/motor.js` against T019 fixtures (distractor fill order, teto of 6, omitted ids absent from `ids` and `verdadeiros`); keep no shuffle in the motor (depends on T011)
- [X] T022 [US3] Confirm `js/quiz.js` `shuffleOpcoes` only at present of `flop_upgrade` / `turn_upgrade` and `js/mesa.js` `renderHud()` / `gradeOpcoes()` / `focarPrimeiroHabilitado`: Tab walks still-enabled options then **Confirmar**; Enter/Space on an option toggles (`ALTERNAR_OPCAO`) and does not submit; MUST NOT add a “marcar todas” control in `index.html` or HUD; MUST NOT call `embaralhar` in `js/baralho.js` (depends on T012, T017, T021)

**Checkpoint**: User Stories 1–3 independently testable (teto 6 + CA-014 + G008 + foco)

---

## Phase 6: User Story 4 - Confirmar uma vez para a memória; corrigir o conjunto sem spoiler (Priority: P2)

**Goal**: A 1ª **Confirmar** grava o bucket `upgrade` só das opções **exibidas** (RN-024); retry até o conjunto exibido estar perfeito sem revelar a certa; 2ª Confirmar não muda contadores; flop e turn da mesma mão são duas exposições independentes.

**Independent Test**: Montar uma street com Flush verdadeiro e Par distratora; marcar os dois na 1ª **Confirmar**; ler a memória: Flush +1 acerto, Par +1 erro; Par desabilitada; pergunta aberta até o conjunto estar correto (CA-016).

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T023 [P] [US4] Rewrite first-Confirmar cases in `tests/contract/quiz.test.js` per `contracts/quiz-upgrades.md` §8.7–8.9 / CA-016: constructed street with Flush true and Par distractor; mark both → `upgrade.flush` +1 acerto, `upgrade.par` +1 erro, Par dead, Flush locked, pergunta still open; empty first Confirmar with displayed upgrades → +1 erro per omitted true; unmarked distractor → 0 increment; 2ª Confirmar → 0 delta; omitted-from-6 categories stay 0
- [X] T024 [P] [US4] Extend `tests/contract/hud-session.test.js`: flop and turn of the same hand, both non-skip, produce two independent first Confirmars in `upgrade` (SC-013); skip on a street writes 0 `upgrade`; 0 skip/reveal/“marcar todas” CTA; fail-open of storage still lets the quiz continue; MUST NOT touch `mao_atual` or `vencedor_pote` on this question

### Implementation for User Story 4

- [X] T025 [US4] Keep `confirmarMultipla` / `persistirPrimeira` in `js/quiz.js` writing bucket `upgrade` only for **displayed** options on the first Confirmar (already the 003 contract) now that `verdadeira` comes from the enumerator; later Confirmars MUST NOT `gravar`; fail-open of `js/storage.js` unchanged (no `alert`, no HUD jargon); MUST NOT increment omitted-from-6 ids (depends on T012, T017)
- [X] T026 [US4] Confirm retry UX in `js/quiz.js` / `js/mesa.js` `gradeOpcoes()`: dead distractor stays visible; unmarked distractors remain selectable after first Confirmar; true upgrades already marked lock; copy exactly `Não é essa. Tente de novo.` / `Você acertou`; G008 frozen on retry; 0 “pular pergunta” / “mostrar quais faltam” / “marcar todas” (depends on T025)

**Checkpoint**: User Stories 1–4 independently testable (RN-024/025/026 sobre o conjunto real)

---

## Phase 7: User Story 5 - Entender “exatamente C” e o que o herói não vê (Priority: P2)

**Goal**: Um desfecho testemunha só a categoria da melhor 5 das 7. Royal não promove Flush/SF. Holes adversárias ficam no desconhecido. Burns não consomem. Força dentro da categoria e Carta alta nunca são upgrade. As nove categorias Royal flush … Par são upgrade verdadeiro em ≥1 fixture. 0 vocabulário de draws.

**Independent Test**: Caso em que os únicos desfechos “de flush” são royal: Flush **não** entra como upgrade. Caso em que o herói tem trinca: Par **não** é upgrade. UI sem as palavras de draw da lista excluída do produto.

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T027 [P] [US5] Extend `tests/contract/motor.test.js` per `contracts/motor-upgrades.md` §6.2, §6.6–6.10, §6.15–6.16: snapshot does **not** drop two cards that are A/B holes if they are not in `visiveis`; only-naipe runouts whose Melhor5 is royal → `upgrades` contains `royal_flush` and not `flush`/`straight_flush` from those runouts; `categoriaAtual === 'trinca'` → `par`/`dois_pares`/`trinca`/`carta_alta` ∉ `upgrades`; pair-of-deuces that only improves to pair-of-aces → `par` ∉ `upgrades`; hero already royal on flop → `ok: true` and empty `upgrades`; each of the nine Royal flush … Par is a true upgrade in ≥1 flop-or-turn fixture; Carta alta in 0; hypothetical pot is not an input (motor never receives opponent holes as “known”)
- [X] T028 [P] [US5] Extend `tests/contract/quiz.test.js`: scan `sessao.hud.enunciado`, every option `rotulo` / `aria-*` and feedback on `flop_upgrade` / `turn_upgrade` / skip for 0 “draw”, “gutshot”, “flush draw”, “straight draw”, “oesd”, “outs”, 0 kickers / “par de ases”, 0 “Sequência” (SC-010); `chaveDesempate` MUST NOT appear on `sessao.hud` or in the storage blob

### Implementation for User Story 5

- [X] T029 [US5] Close remaining enumerator gaps in `js/motor.js` against T027 fixtures (exactly C, 7 vs 6 already in T010, RN-046 inside-category, coverage of the nine, empty list on royal, holes A/B in snapshot); kickers stay only inside `avaliarMelhor5` / `chaveDesempate` and MUST NOT appear in `enumerarUpgrades` return (depends on T010, T016)
- [X] T030 [US5] Audit `js/quiz.js` + `js/mesa.js` `renderHud()` / `gradeOpcoes()`: option labels come only from `CATEGORIAS.rotulo`; MUST NOT interpolate rank/kicker/suit/draw names into copy; `COPY.enunciadoUpgrades` stays `Quais mãos você ainda não tem, mas ainda pode formar?`; `COPY.semUpgrade` stays `Não há upgrade possível.`; `abrirResultado()` still MUST NOT dump kickers (depends on T029)

**Checkpoint**: User Stories 1–5 independently testable (exatamente C + information set + as 9 + 0 draws)

---

## Phase 8: User Story 6 - Pular a grade quando não há upgrade (Priority: P2)

**Goal**: Lista RN-020 vazia → HUD `sem_upgrade` com a frase única e **Continuar**; 0 grade; 0 estatística `upgrade`. Falha de enumeração MUST NOT fingir skip. Lista não vazia MUST NOT usar skip.

**Independent Test**: Herói com royal no flop, após acertar a mão atual: sem múltipla seleção; mensagem + **Continuar**; `upgrade` inalterado (CA-017).

### Tests for User Story 6

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T031 [US6] Extend `tests/contract/quiz.test.js` and `tests/contract/hud-session.test.js` per `contracts/quiz-upgrades.md` §8.4, §8.12–8.13 / CA-017: royal-on-flop fixture after 5.3 → `flop_skip`, frase exactly `Não há upgrade possível.`, CTA **Continuar**, 0 `upgrade` cell changes, **Continuar** opens the turn; any other empty RN-020 (flop or turn) uses the same skip; non-empty list MUST NOT skip; `enumerarUpgrades` `{ ok: false }` → `ociosa` + **Nova mão** + `COPY.linhaErroEnumeracao`, 0 `sem_upgrade`, prior evolução intact; after a happy-path enumeration the 11 `cartasJogo` identities/slots and scenic burns are unchanged (SC-019)

### Implementation for User Story 6

- [X] T032 [US6] Confirm `abrirSkip` / `continuar` in `js/mesa.js` and `modoDoPasso` in `js/quiz.js` for `flop_skip` and `turn_skip`: HUD `sem_upgrade` copy exact; 0 opções; 0 **Confirmar**; 0 `persistirPrimeira` / 0 `upgrade` write; **Continuar** advances street; skip MUST NOT be used when `upgradesStreet.ok && lista.length ≥ 1` (depends on T013, T018)
- [X] T033 [US6] Implement `falhaEnumeracao` in `js/mesa.js` (same spirit as `falhaMontagem`): HUD `ociosa`, CTA **Nova mão**, `linhaErro` = `COPY.linhaErroEnumeracao`; feltro empty; `mao` null; MUST NOT persist runouts, snapshot, stack or identifier; counters already written this visit remain; MUST NOT treat `{ ok: false }` as empty-list skip; MUST NOT remain on “Você acertou” (depends on T013, T031)

**Checkpoint**: All user stories independently functional (5.4 real no flop/turn, skip verdadeiro, falha ≠ skip)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validação ponta a ponta, privacidade, idioma e guarda de escopo negativo (006 fora)

- [X] T034 Run `node --test tests/contract/` and close gaps against `specs/005-maos-ainda-possiveis/contracts/motor-upgrades.md` §6 and `contracts/quiz-upgrades.md` §8; 001 audio + 002 baralho + 003 storage/river-stub + 004 mão-atual cases MUST still pass; MUST NOT reshuffle the 52 when enumerating or permuting options
- [X] T035 [P] Update the local-test section of `README.md`: flop/turn upgrades are no longer the Flush-stub / forced turn skip; river showdown remains stub until 006; mention `enumerarUpgrades` / `conjuntoOpcoesUpgrade` in `js/motor.js`; keep the privacy sentence (only `poker-trainer:evolucao`)
- [X] T036 Execute manual quickstart scenarios S1–S8 from `specs/005-maos-ainda-possiveis/quickstart.md` against `http://localhost:8080` at 1280×720 (not `file://`): read the feltro (do not assume Flush on flop nor skip on turn); DevTools only the three buckets
- [X] T037 Audit DevTools Application plus source: only `poker-trainer:evolucao` (three buckets); zero PII/cartas/runouts/snapshot/kickers/timestamp/`versao`; nicknames remain **Você** / **Adversário A** / **Adversário B**; 0 `fetch` of telemetry; `js/mesa.js` still has 0 `localStorage` and 0 `motor.js` import (SC-015, FR-019)
- [X] T038 Confirm negative scope in `js/motor.js`, `js/quiz.js`, and `js/mesa.js`: 0 upgrade question on river (`river_hero` stub 003 remains); no `quemGanhou`; no relatório/zerar/mute/desistir/preflop quiz; no poker lib; no draw vocabulary; RN-G001 (one question) and RN-G005 (no skip/reveal on a non-empty 5.4) hold; `CATEGORIAS_STUB` in `js/quiz.js` remains only for river/A/B
- [X] T039 Confirm copy stays the exact pt-BR strings in `js/quiz.js` `COPY` (`Você acertou` / `Não é essa. Tente de novo.` / `Não há upgrade possível.` / `Não foi possível continuar esta mão. Tente de novo.`); beat adapter in `js/mesa.js` still 400 ms / 0 ms under `prefers-reduced-motion`; extra wait for lista ≤ 1 s with 0 spinner; keyboard path (Tab skips dead; Enter/Space toggles on 5.4 and does not submit)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) is the MVP increment (`enumerarUpgrades` flop + `flop_upgrade` real)
  - US2 precisa do mesmo `apresentarPergunta` / `decidirPosMaoAtual` da US1 (`js/quiz.js` / `js/mesa.js` são gargalo)
  - US3 trava o teto de 6 / CA-014 / G008 sobre o `conjuntoOpcoesUpgrade` da US1
  - US4 assume `verdadeira` real no flop (US1) e no turn (US2)
  - US5 trava exatamente C / information set / as 9 sobre o enumerador da US1
  - US6 trava skip CA-017 e falha ≠ skip sobre a cadência da US1/US2
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no other story. MVP.
- **User Story 2 (P1)**: After US1 (shared quiz/mesa cadence; motor turn branch)
- **User Story 3 (P1)**: After US1 (`conjuntoOpcoesUpgrade` exists); turn CA-015 stays correct after US2
- **User Story 4 (P2)**: After US1 (1ª Confirmar on real set); two exposures flop+turn after US2
- **User Story 5 (P2)**: After US1 enumerator exists; UI audit after US3 rótulos finais
- **User Story 6 (P2)**: After US1 skip/falha decision; royal empty list from enumerator; turn empty skip after US2

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Snapshot before `enumerarUpgrades`
- `enumerarUpgrades` before `conjuntoOpcoesUpgrade`
- Conjunto before quiz `flop_upgrade` wiring
- Flop wiring before mesa cadence
- Flop cadence before turn wiring
- Real `verdadeira` flags before first-Confirmar assertions
- Core enumerator before exactly-C / nine-category lock tests
- Skip/falha decision before CA-017 / falha≠skip lock
- Story complete before moving to the next priority

### Parallel Opportunities

- Phase 1: T001 then T002 (T002 verifies T001 isolation + PASSOS)
- Phase 2: T003 → T004 in `js/motor.js` (same file, sequential); T005 after T004 signatures; T006 after T005
- US1: T007, T008, T009 in parallel (three test files); then T010 → T011 (`js/motor.js`) → T012 (`js/quiz.js`) → T013 (`js/mesa.js`)
- US2: T014 in parallel with T015 only after US1 tests exist; then T016 → T017 → T018
- US3: T019 and T020 in parallel; then T021 (`js/motor.js`) → T022 (`js/quiz.js` / `js/mesa.js`)
- US4: T023 and T024 in parallel; then T025 → T026
- US5: T027 and T028 in parallel; then T029 → T030
- US6: T031 then T032 → T033
- Polish: T035 (README) in parallel with T037/T038 source audit
- Do not parallelize tasks that edit the same file (`js/motor.js`, `js/quiz.js`, `js/mesa.js`, `tests/contract/hud-session.test.js`)

---

## Parallel Example: User Story 1

```bash
# After Phase 2, launch US1 contract tests together:
Task: "Snapshot 47 / 7-vs-6 / arity fail in tests/contract/motor.test.js"
Task: "No Flush-stub flop_upgrade in tests/contract/quiz.test.js"
Task: "flop_hero beat does not open turn in tests/contract/hud-session.test.js"

# Then sequential: enumerarUpgrades flop → conjuntoOpcoesUpgrade → quiz flop_upgrade → mesa cadence
```

## Parallel Example: User Story 3

```bash
Task: "CA-014 teto de 6 in tests/contract/motor.test.js"
Task: "G008 + foco + omitted-no-stats in tests/contract/quiz.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: flop 5.4 real, não-stub, skip se lista vazia, beat não abre o turn, zero `alert`, zero kicker, zero persistência de runout
5. Demo do flop se pronto (turn ainda pode ser skip forçado até US2)

### Incremental Delivery

1. Setup + Foundational → placeholders + snapshot + preparo oculto no pouso
2. US1 → enumerador flop + `flop_upgrade` real (MVP!)
3. US2 → enumerador turn + `turn_upgrade` (some o skip forçado)
4. US3 → teto de 6 / CA-014 / G008 / foco
5. US4 → 1ª Confirmar RN-024 + duas exposições
6. US5 → exatamente C / information set / as 9 / 0 draws
7. US6 → skip CA-017 + falha ≠ skip
8. Polish → `node --test` + quickstart S1–S8 + auditoria LGPD/escopo

Cada história soma valor sem reabrir o avaliador da 5.3 (004) nem o vencedor do pote (006).

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US2 → US4 on `js/quiz.js` / `js/mesa.js` (single owner of apresentar/cadência/persistir)
   - Developer B: `tests/contract/motor.test.js` + `js/motor.js` snapshot / enumerar / conjunto (US1 T010–T011, US2 T016, US3 T021, US5 T029)
   - Developer C: `hud-session.test.js` cadence rewrite (T009) and README (T035) if file ownership is split
3. HUD DOM (`gradeOpcoes` / `focarPrimeiroHabilitado`) stays on the owner of `js/mesa.js`
4. Do not split `js/motor.js` across two writers in the same phase

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to spec.md user stories US1–US6
- UI copy MUST be pt-BR; 10 rótulos MUST match RN-014 exactly
- `js/mesa.js` MUST NOT import `js/motor.js` or call `localStorage`
- Runouts / snapshot / Melhor5 / `chaveDesempate` MUST NEVER reach HUD, `aria-*`, or `poker-trainer:evolucao`
- Kickers MUST NEVER appear as option text (RN-G004)
- Verify tests fail before implementing
- Stop at any checkpoint to validate the story independently
- `/speckit-implement` executes this list; this command does **not** implement application code
- MUST NOT commit from `/speckit-tasks`
