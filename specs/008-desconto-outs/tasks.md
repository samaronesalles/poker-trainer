---
description: "Task list for feature implementation"
---

# Tasks: Desconto de outs (upgrades que vencem o pote e odd da próxima carta)

**Input**: Design documents from `/specs/008-desconto-outs/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Pedidos explicitamente no plan.md (Testing) / research.md §10 / `contracts/motor-desconto-outs.md` §10 / `contracts/quiz-desconto-outs.md` §10 / `contracts/storage-outs-odds.md` §7 — `node --test` estendendo `tests/contract/motor.test.js`, `quiz.test.js`, `storage.test.js`, `hud-session.test.js` e, se o layout dos 13 ranks exigir, `layout-responsivo.test.js`. Sem Playwright/Cypress, sem bundler. Validação visual via `quickstart.md` (cenários A–H).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Site estático na raiz do repositório (ADR-006 / plan.md): `index.html`, `css/`, `js/`, `assets/`, `tests/contract/`. **MUST** estender `js/motor.js` (`sintetizarVilaoAssumido`, `baralhoProximaCarta`, `avaliarDescontoStreet`, `oddDaProximaCarta`, `conjuntoOpcoesQuantidade`, `conjuntoOpcoesOdd`). **MUST** alterar `js/quiz.js` (copy 5.4/5.8, `PASSOS` novos, snapshot no pouso). **MUST** alterar cadência em `js/mesa.js` (acerto da 5.4 → §5.8, não a street). **MUST** alterar `js/storage.js` (`outs` e `odds` na mesma chave). **MUST** alterar `css/hud.css` (faixa compacta dos 13 ranks). `js/layout.js` MAY alterar se o teste de cobertura exigir métrica. **MUST NOT** `js/mesa.js` importar `js/motor.js` nem chamar `localStorage`. **MUST NOT** persistir vilão, outs, ranks, N, razão, snapshot ou cartas. **MUST NOT** reabrir `specs/005-maos-ainda-possiveis/`. **MUST NOT** lib de poker, bundler, backend, Worker, Pot Odds, regra do 4. Kickers MUST NEVER na UI. UI visível MUST ser pt-BR. 0 pergunta 5.4/5.8 no river. `quemGanhou` permanece com hole reais.

## Escolhas registradas (ambíguo → padrão)

- Testes automatizados: **incluir** (plan.md Testing + research.md §10 + contratos §10/§10/§7). Visual permanece manual (quickstart A–H).
- TDD nas fases de história: escrever os testes daquela história **antes** da implementação e garantir que falham. A API de street (`avaliarDescontoStreet`) e o schema de storage entram no foundation porque FR-034 / FR-029 exigem snapshot e cinco buckets **antes** de qualquer pergunta.
- Git: permanecer em `feature/issue-4` (identidade Spec Kit `008-desconto-outs`).
- Módulos: estender `motor` / `quiz` / `storage` / `mesa` / `hud.css` (ADR-006). Sem módulo novo de outs.
- API de street: `avaliarDescontoStreet({ holeHeroi, comunitarias })` no pouso. Helpers `sintetizarVilaoAssumido`, `baralhoProximaCarta`, `oddDaProximaCarta`, `conjuntoOpcoesQuantidade`, `conjuntoOpcoesOdd`.
- `enumerarUpgrades`: contrato 005 morto; implementação MUST delegar a `avaliarDescontoStreet` e devolver só `{ ok, categoriaAtual, upgrades }` já descontados, ou sumir dos testes 005. MUST NOT manter dois gabaritos.
- Vilão no turn: receita de novo no board de 4; naipe **espadas → copas → ouros → paus**.
- Cadência: acerto da 5.4 abre §5.8; skip abre a street; river inalterado (006).
- Storage antigo (3 buckets): **legível** — `outs`/`odds` = 0; não é corrupção.
- Falha `{ ok: false }`: HUD `ociosa` + **Nova mão**; MUST NOT fingir skip nem N = 0.
- Persistência do snapshot: **proibida**.
- Pasta `specs/005-maos-ainda-possiveis/`: **intocada**.
- Lint/format: **não** adicionar ESLint/Prettier (YAGNI / constitution III).
- Relatório / zerar / lib / backend / Pot Odds / regra do 4 / draws nomeados / mute: ausentes.
- `js/baralho.js`, `js/carta.js`, `js/audio.js`, `js/colinha.js`: intocados (colinha só admite cinco buckets no critério CA-032 desta spec).
- Rule LGPD: atualizar `.cursor/rules/lgpd-sessao-sem-pii.mdc` no polish (contexto 001–008; buckets `outs`/`odds`; MUST NOT gravar vilão/outs/ranks/N/razão).
- Este comando **não** commita.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Encaixar a API de desconto no `js/motor.js` já entregue pela 004/006, sem backend, sem bundler e sem lib de poker

- [x] T001 Extend DOM-free ES module `js/motor.js` with placeholder exports `sintetizarVilaoAssumido({ holeHeroi, comunitarias })`, `baralhoProximaCarta({ holeHeroi, comunitarias, assumidas })`, `avaliarDescontoStreet({ holeHeroi, comunitarias })`, `oddDaProximaCarta(n)`, `conjuntoOpcoesQuantidade({ n })` and `conjuntoOpcoesOdd({ x })` (MAY return `{ ok: false }` / empty / stub until Phase 2); keep existing `CATEGORIAS`, `avaliarMelhor5`, `conjuntoOpcoesMaoAtual`, `conjuntoOpcoesUpgrade`, `quemGanhou`, `conjuntoOpcoesVencedor` and `UNIVERSO_POTE`; MAY import only `RANKS` / `NAIPES` from `js/baralho.js`; MUST NOT import `embaralhar`, mistura, `js/quiz.js`, `js/storage.js`, `js/mesa.js`, `document`, `alert` or `localStorage`; update the file header to state “melhor 5 + quemGanhou + vilão assumido + desconto de outs + odd da próxima carta”
- [x] T002 Add imports of `avaliarDescontoStreet`, `conjuntoOpcoesQuantidade` and `conjuntoOpcoesOdd` (and `oddDaProximaCarta` if the quiz maps X) in `js/quiz.js`; add `PASSOS.flop_outs` / `flop_ranks` / `flop_odds` / `turn_outs` / `turn_ranks` / `turn_odds` as frozen ids; add `COPY` keys `enunciadoOuts`, `enunciadoRanks`, `enunciadoOdd` and RN-059 linha map as stubs (MAY keep old 5.4/skip strings until US1/US3); confirm `package.json` stays `"type": "module"` with zero runtime dependencies and no bundler/lint/Playwright/poker-lib scripts; confirm `index.html` still loads only `js/mesa.js`; confirm `js/mesa.js` does not import `js/motor.js` and still MUST NOT call `localStorage`; MUST NOT yet change `avancarAcerto` of `flop_upgrade` / `turn_upgrade` (that is US1/US2)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Receita RN-055, baralho da próxima carta, snapshot de street, fórmula da odd, schema de cinco buckets e preparo oculto no pouso — bloqueiam TODAS as user stories

**⚠️ CRITICAL**: Nenhuma user story pode começar até esta fase estar completa

- [x] T003 Implement `sintetizarVilaoAssumido` in `js/motor.js` per `specs/008-desconto-outs/contracts/motor-desconto-outs.md` §2: arity hole=2 and comunitarias ∈ {3,4}; textures in strength order of the **already-made** best 5 (2 assumed + board, no next card); flush = two highest free ranks of that suit; straight = cards that complete the highest legal sequence (wheel A-2-3-4 ok, wrap K-A-2-3 forbidden; if only one card completes, second = best free kicker); paired board = one of the highest pair rank + best kicker; else = one of the highest board rank + best kicker (Ace if free); suit tie-break **espadas → copas → ouros → paus**; drop a texture that cannot be built with 2 free cards and try the next; success `{ ok: true, cartas, categoriaFeita, linhaId }` with `linhaId` from §2.2 (`par`→`par_mais_alto`, `trinca`→`trinca_do_par`, `straight`/`flush` same, else `rotulo`); failure `{ ok: false }` no throw; MUST NOT use real A/B holes; MUST NOT return pt-BR line text or kicker prose (depends on T001)
- [x] T004 Implement `baralhoProximaCarta` in `js/motor.js` per `contracts/motor-desconto-outs.md` §3: `(RANKS × NAIPES)` minus hero holes minus board minus the 2 assumed; flop length **45**, turn length **44**; include real A/B holes if those identities are not assumed/visible; MUST NOT subtract burns; MUST NOT mutate input arrays (depends on T001)
- [x] T005 Implement `oddDaProximaCarta`, `conjuntoOpcoesQuantidade` and `conjuntoOpcoesOdd` in `js/motor.js` per `contracts/motor-desconto-outs.md` §5–§6: P = min(2×n, 100); X = 50/n − 1; X integer, 0.5 toward floor; anchors n=4→11:1, n=9→5:1, n=10→4:1; n>20 same formula; return `{ x, rotulo: `${x}:1` }`; quantidade = 6 distinct ints in 1–47 including n, distractors n±1, n±2 and {4,5,8,9,12,15}, fill nearest free; odd = 6 distinct `{ valor, rotulo }` including x, distractors x±1 (if x−1≥0) and {2,3,4,5,9,11}; stable canonical order; MUST NOT use rule of 4; MUST NOT shuffle (G008 is quiz) (depends on T001)
- [x] T006 Implement `avaliarDescontoStreet` in `js/motor.js` per `contracts/motor-desconto-outs.md` §4: call T003+T004; `categoriaAtual` = `avaliarMelhor5` of visibles; for each remaining card evaluate hero and villain best 5 **with that one card only** (flop = hypothetical turn; turn = hypothetical river); C is upgrade iff exactly C, C strictly stronger than current, C ≠ `carta_alta`, hero **strictly** beats villain (RN-057/070); outs = cards that strictly win (RN-061); ranks = RankIds with ≥1 out (RN-062); if upgrades empty → `outs=[]`, `ranks=[]`, `n=0`, `odd=null`; if upgrades ≥1 → n≥1 and `odd=oddDaProximaCarta(n)` else `{ ok: false }`; MUST NOT enumerate C(47,2); MUST NOT include `chaveDesempate`/runouts/kicker text in the return; if `enumerarUpgrades` stays exported, MUST delegate to this and return only `{ ok, categoriaAtual, upgrades }` already discounted; retire 005 (47/46, “adversário não desconta”, CA-014–017) as vigente assertions in `tests/contract/motor.test.js` without editing `specs/005-maos-ainda-possiveis/`; `quemGanhou` signature/semantics MUST stay 006 (depends on T003, T004, T005)
- [x] T007 [P] Extend `evolucaoZerada`, `garantirSchema`, `lerDisco` and `aplicarSomas` in `js/storage.js` per `specs/008-desconto-outs/contracts/storage-outs-odds.md` §2–§4: every write serializes five buckets `mao_atual`, `upgrade`, `vencedor_pote`, `outs`, `odds`; `outs` and `odds` are group cells `{ acertos, erros, exposicoes }` like `vencedor_pote`; `aplicarDeltas({ bucket: 'outs'|'odds', acertos?, erros? })` MUST NOT require `categoria` (ignore it if present); historic 3-bucket JSON is **readable** (new cells = 0, rest preserved); missing one of five in a recognizable object = 0 without wiping the rest; unreadable / `{ "foo": 1 }` → zeros of **five**; extra keys (including `vilao`) ignored and MUST NOT be echoed; lazy read of missing key MUST NOT `setItem`; MUST NOT export `clear()`/`zerar()`; MUST NOT reference `document`, `alert`, `indexedDB`, `sessionStorage`, `fetch`
- [x] T008 Replace `prepararUpgradesStreet` in `js/quiz.js` per `contracts/quiz-desconto-outs.md` §3: from `sessao.mao.cartasJogo` take hero `[4][5]` and board `[6..8]` (flop) or `[6..9]` (turn); call `avaliarDescontoStreet`; on `ok` store `sessao.mao.descontoStreet` (MAY evolve `upgradesStreet`) with `lista`, `conjunto` via existing `conjuntoOpcoesUpgrade`, `vilao` only as `{ categoriaFeita, linhaId }` (MUST NOT put assumed cards on `sessao.hud`), plus `outs`/`n`/`ranks`/`odd` and option sets from T005; on `!ok` store `{ ok: false }` and MUST NOT open skip; `decidirPosMaoAtual` still returns `'pergunta'|'skip'|'falha'|'pendente'`; turn prepare MUST use four community cards and MUST NOT reuse the flop snapshot; MUST NOT present 5.4/5.8 from here; MUST NOT copy vilão/outs/N/razão/snapshot to `storage`; wire `modoDoPasso` / `enunciadoDoPasso` / `streetVisivelDoPasso` so the six new `PASSOS` exist (enunciados MAY stay stub until US4–US6) (depends on T006)
- [x] T009 Confirm `js/mesa.js` `fimAnimacao` already calls `prepararUpgradesStreet` via `apresentarPergunta(flop_hero|turn_hero)` on street land; keep `decidirAposMaoAtual` `'falha'` → existing `falhaEnumeracao` (`COPY.linhaErroEnumeracao`, HUD `ociosa` + **Nova mão**); `'pendente'` after 5.3 beat → stay on acerto ≤ 1 s extra with 0 spinner / 0 “calculando”, then falha; MUST NOT yet open `*_outs` (US1/US4); confirm isolation: `js/motor.js` has 0 `indexedDB` / `sessionStorage` / `fetch` / `sendBeacon` / Unicode baralho / poker CDN / Worker; `js/baralho.js`, `js/carta.js`, `js/audio.js` and `js/colinha.js` stay untouched; `js/mesa.js` still MUST NOT import `js/motor.js`; river path (`prepararShowdown` / `quemGanhou`) stays 006 (depends on T008)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Marcar só o que vira o pote no flop (Priority: P1) 🎯 MVP

**Goal**: Depois do beat da 5.3 no flop, o HUD pergunta **“Quais mãos melhoram o seu jogo com chance de ganhar o pote?”** com a linha RN-059 e só categorias que, na **próxima carta**, são exatamente C, mais fortes que a atual e vencem o vilão assumido. Acerto abre a §5.8 da mesma street — o turn **não** abre ainda.

**Independent Test**: No caso CA-033 (herói K♣ Q♦, flop 10♠ 9♦ 5♣, vilão = par mais alto), o enunciado e a linha são os canônicos; **Par** e **Straight** são verdadeiros; um par de 9 ou de 5 sozinho **não** torna **Par** falso. O turn ainda não abriu.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T010 [P] [US1] Replace remaining 005 vigente cases in `tests/contract/motor.test.js` with `contracts/motor-desconto-outs.md` §10.1–10.4, §10.11–10.12: CA-033 hero K♣ Q♦ / flop 10♠ 9♦ 5♣ → `linhaId === 'par_mais_alto'`, `upgrades` contains `par` and `straight`, a pair of 9s or 5s alone does **not** remove `par`; CA-034 unique losing pair → `par` ∉ `upgrades`; CA-039 runner-runner flush → `flush` ∉ `upgrades`; royal outcome witnesses only `royal_flush`; `carta_alta` ∉ `upgrades` in 100% of cases; `avaliarDescontoStreet` MUST NOT mutate input arrays
- [x] T011 [P] [US1] Update `tests/contract/quiz.test.js` per `contracts/quiz-desconto-outs.md` §10.1–10.2: after `flop_hero` acertado + lista ≥ 1, enunciado exactly **“Quais mãos melhoram o seu jogo com chance de ganhar o pote?”**, linha **“Suponha que o adversário já tem o par mais alto da mesa.”** on CA-033, modo `multipla`, CTA **Confirmar**, mark/unmark MUST NOT submit; old 005 enunciado **“Quais mãos você ainda não tem, mas ainda pode formar?”** MUST NOT appear; `correta` set is RN-057 not RN-020
- [x] T012 [P] [US1] Update cadence cases in `tests/contract/hud-session.test.js` per `contracts/quiz-desconto-outs.md` §4 / §10.2, §10.7, §10.10: 5.3 not yet acertada → 0 upgrade question / 0 linha / 0 Confirmar / 0 skip; after 5.3 beat + lista ≥ 1 → HUD `perguntando` 5.4 and turn **not** dealt; acerto of displayed 5.4 set → passo `flop_outs` (or equivalent 5.8 first step), still no turn (RN-068, SC-016/017); while flop still flying, HUD stays `deal`; A/B stay `verso` and 0 assumed cards in hole DOM (CA-038); `js/mesa.js` source MUST NOT contain `import` of `motor.js` nor `localStorage`

### Implementation for User Story 1

- [x] T013 [US1] Replace `COPY.enunciadoUpgrades` in `js/quiz.js` with **“Quais mãos melhoram o seu jogo com chance de ganhar o pote?”**; map `descontoStreet.vilao.linhaId` to the RN-059 string (`par_mais_alto` / `trinca_do_par` / `straight` / `flush` / `rotulo` + RN-014); expose it as `sessao.hud.linhaSuposicao` (read-only, not a question); `apresentarPergunta(flop_upgrade)` keeps `criarOpcoesUpgrade` + hint **“Pode ser mais de uma.”** on the **new** `conjunto` (RN-057); 1ª Confirmar still writes `upgrade` only for **displayed** options (RN-024); G008 shuffle only on present; MUST NOT put assumed cards, kicker prose or `chaveDesempate` on `sessao.hud`; MUST NOT call `avaliarDescontoStreet` again on Confirmar (depends on T008)
- [x] T014 [US1] Change `avancarAcerto` in `js/mesa.js` so `PASSOS.flop_upgrade` opens `PASSOS.flop_outs` (MUST NOT call `abrirStreetSeguinte(..., 'turn')`); `renderHud()` shows `linhaSuposicao` as a read-only `p` (MAY reuse `.hud__linha` sibling) during 5.4; A/B remain closed; hypothetical cards MUST NOT flip on the felt; 11 live cards and burns stay in place; after 5.4 beat, if N/ranks/X already in `descontoStreet` open outs immediately, else stay on acerto ≤ 1 s then `falhaEnumeracao` — MUST NOT invent N = 0; MUST NOT import `js/motor.js`; MUST NOT spinner / `alert` (depends on T009, T013)

**Checkpoint**: User Story 1 fully functional and independently testable (5.4 descontada no flop + turn ainda fechado)

---

## Phase 4: User Story 2 - Marcar só o que vira o pote no turn (Priority: P1)

**Goal**: No turn a receita remonta com o board de quatro cartas (2 assumidas novas). A mesma 5.4 vale com o baralho da próxima carta **deste** turn. Acerto abre a §5.8 do turn. O river **não** abre. 0 5.4/5.8 no river.

**Independent Test**: Num turn com exatamente 2 upgrades vencedores, a grade tem esses 2 + 4 distratoras (CA-035). O river não abre no acerto da 5.4 — abre a §5.8.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T015 [P] [US2] Extend `tests/contract/motor.test.js` per `contracts/motor-desconto-outs.md` §10.8: `sintetizarVilaoAssumido` with 4 community cards returns **different** assumed cards than the flop when the recipe changes; `avaliarDescontoStreet` on the turn uses length-44 deck; MUST NOT require equality with the flop snapshot; CA-035 fixture with exactly 2 winning upgrades → `conjuntoOpcoesUpgrade` has those 2 + 4 distractors (total 6)
- [x] T016 [P] [US2] Extend `tests/contract/quiz.test.js` and `tests/contract/hud-session.test.js` per `contracts/quiz-desconto-outs.md` §10.5, §10.14 and spec CA-048: turn 5.3 not yet acertada → 0 upgrade/skip of this street; after turn 5.4 acerto → `turn_outs`, river **not** dealt; `modoDoPasso` / `enunciadoDoPasso` return 0 5.4/5.8 on `river_*`; flop and turn of the **same** hand with non-empty 5.4 are independent `upgrade` (and later `outs`/`odds`) exposures — MUST NOT merge deltas (CA-048); turn prepare MUST NOT reuse `descontoStreet` from the flop

### Implementation for User Story 2

- [x] T017 [US2] Confirm `prepararUpgradesStreet` in `js/quiz.js` on `PASSOS.turn_hero` extracts `[6]..[9]` and **replaces** `sessao.mao.descontoStreet`; `apresentarPergunta(turn_upgrade)` uses the new conjunto + new `linhaSuposicao`; MUST NOT pass `[0]..[3]`, `[10]` or the flop snapshot; flop 5.4 path from US1 stays intact (depends on T013)
- [x] T018 [US2] Change `avancarAcerto` in `js/mesa.js` so `PASSOS.turn_upgrade` opens `PASSOS.turn_outs` (MUST NOT `abrirStreetSeguinte(..., 'river')`); river `fimAnimacao` / `prepararShowdown` still has 0 upgrade/outs/odd steps; `streetVisivelDoPasso` maps `turn_*` 5.8 ids to turn; MUST NOT import `js/motor.js` (depends on T014, T017)

**Checkpoint**: User Stories 1 AND 2 independently testable (5.4 descontada no flop e no turn; river limpo)

---

## Phase 5: User Story 3 - Pular a grade e a §5.8 quando nada vira o pote (Priority: P1)

**Goal**: Lista RN-057 vazia → HUD `sem_upgrade` com **“Não há mão que vire o pote.”** + **Continuar**. Zero grade, zero §5.8, zero deltas `upgrade`/`outs`/`odds`. Continuar abre a próxima street.

**Independent Test**: Lista vazia: skip com a frase nova + **Continuar**; zero §5.8; `upgrade`/`outs`/`odds` inalterados (CA-036, CA-043).

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T019 [P] [US3] Extend `tests/contract/quiz.test.js` per `contracts/quiz-desconto-outs.md` §10.1, §10.4: empty `descontoStreet.lista` → `decidirPosMaoAtual === 'skip'`; `COPY.semUpgrade` exactly **“Não há mão que vire o pote.”**; old **“Não há upgrade possível.”** MUST NOT be the canonical skip of this question; 0 `*_outs`/`*_ranks`/`*_odds` after skip; `aplicarDeltas` MUST NOT be called for `upgrade`/`outs`/`odds`; non-empty lista MUST NOT take the skip path
- [x] T020 [P] [US3] Extend `tests/contract/hud-session.test.js`: after 5.3 beat + empty lista → HUD `sem_upgrade` + **Continuar**; Continuar on `flop_skip` deals turn (0 5.8); Continuar on `turn_skip` deals river (0 5.8); `{ ok: false }` still aborts to `ociosa` + **Nova mão** (0 fake skip) (SC-004, SC-022)

### Implementation for User Story 3

- [x] T021 [US3] Replace `COPY.semUpgrade` in `js/quiz.js` with **“Não há mão que vire o pote.”**; `decidirPosMaoAtual` skip only when `ok && lista.length === 0`; `ok === false` stays `'falha'`; MUST NOT invent empty lista on motor failure; MUST NOT write storage on skip (depends on T008)
- [x] T022 [US3] Confirm `abrirSkip` / Continuar in `js/mesa.js` still go `flop_skip` → turn and `turn_skip` → river; MUST NOT open `*_outs` from skip; `renderHud()` skip copy is the new phrase; 0 multiple-choice on `sem_upgrade` (depends on T018, T021)

**Checkpoint**: User Stories 1–3 independently testable (grade ou skip; skip bloqueia a 5.8)

---

## Phase 6: User Story 4 - Dizer quantas outs limpas (Priority: P1)

**Goal**: Depois do beat da 5.4 (lista não vazia) o HUD pergunta **“Quantas outs você tem?”** com 6 inteiros distintos incluindo N. Clique submete. 1ª tentativa grava `outs`. A street seguinte **não** abre.

**Independent Test**: No exemplo CA-033 após acertar a 5.4, a correta é **10** (3 Reis + 3 Damas + 4 Valetes, descontando assumidas e visíveis); há 6 totais incluindo 10; o turn ainda não abriu (CA-040).

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T023 [P] [US4] Extend `tests/contract/motor.test.js` per `contracts/motor-desconto-outs.md` §10.2, §10.6: CA-033 → `n === 10`; CA-045 four Jacks in the next-card deck with 2 clean / 2 dirty → `n` includes 2 (not 4) and `J` ∈ `ranks`; `conjuntoOpcoesQuantidade({ n: 10 })` has 6 distinct ints in 1–47 including 10
- [x] T024 [P] [US4] Extend `tests/contract/quiz.test.js` per `contracts/quiz-desconto-outs.md` §6.2, §10.3, §10.8: after 5.4 acerto, enunciado exactly **“Quantas outs você tem?”**, seleção única, 6 buttons, `verdadeira` only N; first miss → `outs.erros +1`, `outs.acertos` unchanged on that exposure; later hit on the same question → 0 extra delta; skip/river → this question does not exist; 0 Confirmar on this step
- [x] T025 [P] [US4] Extend `tests/contract/hud-session.test.js`: `flop_outs` visible, turn still closed; N MUST NOT remain as a chip/hint after the next step opens; 5.3/skip/river never show this question (CA-040, RN-068)

### Implementation for User Story 4

- [x] T026 [US4] Implement `apresentarPergunta(flop_outs|turn_outs)` in `js/quiz.js`: enunciado `COPY.enunciadoOuts`; `modoDoPasso` → `unica`; options from `conjuntoOpcoesQuantidade({ n: descontoStreet.n })` with rótulo = the integer; `shuffleOpcoes` once; `corretaUnica` = n; extend `deltasUnica` so this passo writes `{ bucket: 'outs', acertos|erros: 1 }` (not `mao_atual`); reuse `avaliarUnica` click-submit; MUST NOT invent n=0; MUST NOT persist the integer N itself (depends on T007, T013)
- [x] T027 [US4] Wire `avancarAcerto` in `js/mesa.js` so `flop_outs` → `flop_ranks` and `turn_outs` → `turn_ranks`; `renderHud()` **replaces** enunciado/options (N MUST NOT stay as chip); `linhaSuposicao` MAY remain read-only; MUST NOT advance street; MUST NOT import `js/motor.js` (depends on T014, T026)

**Checkpoint**: User Stories 1–4 independently testable (quantidade cobrada; street ainda fechada)

---

## Phase 7: User Story 5 - Marcar quais ranks são outs (Priority: P1)

**Goal**: Depois de acertar a quantidade, o HUD pergunta **“Quais ranks são outs?”** com os **13** rótulos canônicos (ordem visual embaralhada). Múltipla seleção + **Confirmar**. 1ª Confirmar grava **uma** exposição em `outs` (conjunto, não por rank). Sem teto de 6. Sem “marcar todas”. Os 13 MUST NOT cobrir o feltro.

**Independent Test**: Após acertar 10 no exemplo CA-033, os 13 rótulos aparecem; o conjunto verdadeiro é **Rei**, **Dama** e **Valete**; 9 e 5 não são verdadeiros (CA-041).

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T028 [P] [US5] Extend `tests/contract/motor.test.js` per `contracts/motor-desconto-outs.md` §10.2, §10.7: CA-033 ranks = {K, Q, J}; RN-074 hero already with Pair + King that beats villain → `par` ∉ `upgrades` but `K` ∈ `ranks` if that card is an out; CA-045 dirty Jacks still leave `J` true
- [x] T029 [P] [US5] Extend `tests/contract/quiz.test.js` per `contracts/quiz-desconto-outs.md` §6.3, §10.8, §10.11–10.12: exactly the 13 RN-064 rótulos (**2**…**10**, **Valete**, **Dama**, **Rei**, **Ás**); modo `multipla` + **Confirmar**; first visual option receives focus; N from the previous question MUST NOT remain; 1ª Confirmar perfect set → `outs.acertos +1` (independent of the quantity exposure); incomplete/empty 1ª Confirmar → `outs.erros +1`, omitted trues stay selectable, marked distractors die, question stays open; 0 “marcar todas”; 0 per-rank acerto
- [x] T030 [P] [US5] Extend `tests/contract/layout-responsivo.test.js` (and `js/layout.js` only if a coverage metric is required) per FR-044 / SC-031: the 13-rank strip MUST NOT cover community cards, hero holes or seats at desktop / tablet / narrow; narrow HUD stacks below the table; MUST NOT force a 2×3 grid for ranks

### Implementation for User Story 5

- [x] T031 [P] [US5] Add a compact wrapping rank strip in `css/hud.css` (two or three lines inside `.hud__opcoes` / a `hud__opcoes--ranks` modifier); MUST NOT force 2×3; MUST NOT overlay the felt in any viewport; five HUD states MUST NOT increase; quantity/odd keep the existing 6-option grid
- [x] T032 [US5] Implement `apresentarPergunta(flop_ranks|turn_ranks)` in `js/quiz.js`: 13 buttons, identity `RankId`, rótulos RN-064, `verdadeira` iff id ∈ `descontoStreet.ranks`; `shuffleOpcoes` once; `confirmarMultipla` on this passo writes **one** `{ bucket: 'outs', acertos|erros: 1 }` for the **set** (MUST NOT push per-rank `upgrade`/`outs` cells); retry RN-025; `focarPrimeiroHabilitado` on open; MUST NOT add “marcar todas”; MUST NOT persist the rank list (depends on T026, T031)
- [x] T033 [US5] Wire `avancarAcerto` in `js/mesa.js` so `flop_ranks` → `flop_odds` and `turn_ranks` → `turn_odds`; `renderHud()` applies the ranks modifier, replaces the quantity HUD, keeps `linhaSuposicao` read-only; MUST NOT show N; MUST NOT advance street; MUST NOT import `js/motor.js` (depends on T027, T032)

**Checkpoint**: User Stories 1–5 independently testable (13 ranks + segunda exposição `outs`)

---

## Phase 8: User Story 6 - Escolher a odd da próxima carta (Priority: P1)

**Goal**: Depois de acertar os ranks, o HUD pergunta **“Qual é a sua odd?”** com 6 razões **X:1** da regra do **2**. Clique submete. Acerto avança a street. 1ª tentativa grava só `odds`. 0 Pot Odds, 0 regra do 4.

**Independent Test**: Com N = 10, a correta é **4:1** e há 6 razões distintas (CA-042). Com N = 4, **11:1**; com N = 9, **5:1** (não 4:1) (CA-044).

### Tests for User Story 6

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T034 [P] [US6] Extend `tests/contract/motor.test.js` per `contracts/motor-desconto-outs.md` §5 / §10.5: `oddDaProximaCarta(10).rotulo === '4:1'`; `(4) === '11:1'`; `(9) === '5:1'` and not `4:1`; table RN-065 sample rows; n>20 uses the same formula; `conjuntoOpcoesOdd({ x: 4 })` has 6 distinct `V:1` including `4:1`
- [x] T035 [P] [US6] Extend `tests/contract/quiz.test.js` per `contracts/quiz-desconto-outs.md` §6.4, §10.8: enunciado exactly **“Qual é a sua odd?”**; 6 `X:1` buttons; first attempt writes only `{ bucket: 'odds' }`; `outs` MUST NOT change because of the odd; scan enunciado/options/feedback for 0 “Pot Odds”, 0 “regra do 4”, 0 `flush draw` / `gutshot` / `overcards` (RN-027, SC-019)
- [x] T036 [P] [US6] Extend `tests/contract/hud-session.test.js`: acerto of `flop_odds` deals turn; acerto of `turn_odds` deals river; wrong first click → dead option, retry, `odds.erros +1`; street MUST NOT advance before the odd acerto (CA-042, FR-024)

### Implementation for User Story 6

- [x] T037 [US6] Implement `apresentarPergunta(flop_odds|turn_odds)` in `js/quiz.js`: enunciado `COPY.enunciadoOdd`; modo `unica`; options from `conjuntoOpcoesOdd({ x: descontoStreet.odd.x })`; `shuffleOpcoes` once; `deltasUnica` writes `{ bucket: 'odds', acertos|erros: 1 }`; reuse `avaliarUnica`; MUST NOT persist `rotulo`/X; MUST NOT mention Pot Odds or rule of 4 in `COPY` (depends on T026)
- [x] T038 [US6] Wire `avancarAcerto` in `js/mesa.js` so `flop_odds` → `abrirStreetSeguinte(..., 'turn')` and `turn_odds` → `abrirStreetSeguinte(..., 'river')`; keep skip/US3 path unchanged; MUST NOT import `js/motor.js` (depends on T033, T037)

**Checkpoint**: User Stories 1–6 independently testable (§5.8 completa; street só após a odd)

---

## Phase 9: User Story 7 - Entender o vilão assumido sem ver A e B (Priority: P1)

**Goal**: O treinando lê **uma** frase RN-059 (categoria da melhor 5 **já feita**, não o apelido da textura). Não vê as 2 assumidas, não vê kicker por extenso e não vê hole reais de A/B. No turn a receita remonta. No showdown o pote usa hole **reais**.

**Independent Test**: No CA-033 a linha é a do par mais alto; A e B fechados; assumidas invisíveis (CA-038). No showdown, o vencedor continua o da feature 006.

### Tests for User Story 7

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T039 [P] [US7] Extend `tests/contract/motor.test.js` per `contracts/motor-desconto-outs.md` §10.8–10.10, §10.17–10.18: unpaired/unsuited/unconnected board → `linhaId === 'par_mais_alto'`; one pair + made Three of a kind → `trinca_do_par`; two pair on board whose made best 5 is Full house → `categoriaFeita === 'full_house'` and `linhaId === 'rotulo'` (MUST NOT be trinca); 4 unique sequential ranks → `straight`; 3+ same suit → `flush`; two applicable textures → strongest made best 5 wins; tied rank picks earliest `NAIPES`; `quemGanhou` with real holes MUST NOT change when a street villain exists in memory
- [x] T040 [P] [US7] Extend `tests/contract/quiz.test.js` and `tests/contract/hud-session.test.js` per `contracts/quiz-desconto-outs.md` §10.7: CA-033 line exactly **“Suponha que o adversário já tem o par mais alto da mesa.”**; Full-house-made line **“Suponha que o adversário já tem Full house.”**; 0 assumed cards as hole faces; A/B closed during 5.4 and 5.8; line MAY remain read-only on 5.8 and MUST NOT count as a second question; showdown still uses 006 real holes (SC-006, SC-024)

### Implementation for User Story 7

- [x] T041 [US7] Complete the RN-059 map in `js/quiz.js` (`COPY` or helper): `par_mais_alto` / `trinca_do_par` / `straight` / `flush` / `rotulo` with exact `{rótulo RN-014}`; one sentence; MUST NOT list the 2 cards or kicker prose; MUST NOT reveal A/B; store only `linhaId` + display string in HUD memory (depends on T013)
- [x] T042 [US7] Confirm `js/mesa.js` `renderHud()` keeps `linhaSuposicao` read-only on 5.8; hole slots `[0]..[3]` never receive assumed identities; `abrirResultado` / `quemGanhou` path untouched (006); 0 `data-*` dumping assumed cards; MUST NOT import `js/motor.js` (depends on T014, T041)

**Checkpoint**: User Stories 1–7 independently testable (suposição declarada; A/B e showdown honestos)

---

## Phase 10: User Story 8 - Guardar só contadores outs e odds na mesma memória (Priority: P2)

**Goal**: A chave `poker-trainer:evolucao` ganha `outs` e `odds` (grupos únicos). Quantidade e ranks = duas exposições em `outs`. Odd escreve só `odds`. 0 N/ranks/razão/vilão/cartas no JSON. Fail-open. Sem relatório e sem zerar.

**Independent Test**: Erro na 1ª quantidade e acerto depois: `outs` +1 erro e +0 acerto nessa exposição; a 1ª Confirmar dos ranks é outra exposição em `outs`; a odd escreve só `odds` (CA-046). Acerto de primeira nas três: o bloco tem os cinco buckets e **não** contém cartas, ranks, N, razão, vilão nem information set (CA-047).

### Tests for User Story 8

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T043 [P] [US8] Extend `tests/contract/storage.test.js` per `contracts/storage-outs-odds.md` §7.1–7.14: `evolucaoZerada()` has 10+10+1+1+1 all zero; missing key → zeros of five, 0 `setItem`; 003 JSON (three buckets, Flush `mao_atual.acertos === 1`) → Flush preserved, `outs`/`odds` = 0, **not** hard corruption; `{ bucket: 'outs', erros: 1 }` then `{ bucket: 'outs', acertos: 1 }` → exposicoes 2; odds delta does not touch outs; `outs` + `categoria: 'par'` ignores categoria; `{` and `{ "foo": 1 }` → zeros of five; `outs` present without `mao_atual` → `mao_atual` zeros, `outs` preserved; extra `"vilao"` ignored and not echoed; `setItem` throw → `gravar` false, no throw; module has 0 `document`/`alert`/`indexedDB`/`sessionStorage`
- [x] T044 [P] [US8] Extend `tests/contract/quiz.test.js` per `contracts/quiz-desconto-outs.md` §10.8 and CA-046/047: first quantity miss + later hit → `outs.erros +1` / `acertos +0` on that exposure; first ranks Confirmar is a **new** `outs` exposure; odd writes only `odds`; first-try acerto on all three → persisted JSON has exactly the five product buckets and 0 cartas / ranks / N / razão / vilão / information set; colinha hidden → still 0 `poker-trainer:colinha` key (CA-032 updated)

### Implementation for User Story 8

- [x] T045 [US8] Confirm `js/quiz.js` is the only writer (`persistirPrimeira` / `aplicarDeltas`); close remaining fail-open gaps in `js/storage.js` against T043; `js/mesa.js` still MUST NOT call `localStorage`; MUST NOT add a zerar control, report screen, new overlay key or `versao`/timestamp; `js/colinha.js` stays untouched (depends on T007, T026, T032, T037)

**Checkpoint**: User Stories 1–8 independently testable (cinco buckets; 0 dump da mão)

---

## Phase 11: User Story 9 - Confirmar upgrades no contrato já conhecido (Priority: P2)

**Goal**: A grade da 5.4 reusa o contrato 003: até 6 rótulos, 1–5 vencedores + distratoras ou os 6 mais fortes; 1ª Confirmar grava `upgrade` só das **exibidas**; falso positivo mata a distratora; omissão cobra erro; retry sem spoiler. O que muda é **quem é verdadeiro** (RN-057) e o que vem depois (a §5.8).

**Independent Test**: Flush verdadeiro (vencedor) e Par distratora: marcar os dois na 1ª Confirmar → Flush +1 acerto, Par +1 erro, Par desabilita, pergunta aberta (CA-037).

### Tests for User Story 9

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T046 [P] [US9] Extend `tests/contract/quiz.test.js` per `contracts/quiz-desconto-outs.md` §10.6, §10.9: CA-037 Flush true + Par distractor both marked on 1ª Confirmar → Flush +1 acerto, Par +1 erro, Par dead, question open; 1–5 winners → all present + distractors to 6; ≥6 winners → only the 6 strongest, 0 distractor, omitted winners generate 0 stats; second Confirmar MUST NOT change `upgrade`; 10 **new** 5.4 questions MUST NOT pin the required set at the same visual index in all; retry of the **same** question MUST NOT reshuffle (RN-G008)

### Implementation for User Story 9

- [x] T047 [US9] Confirm `conjuntoOpcoesUpgrade` + `criarOpcoesUpgrade` + `confirmarMultipla` in `js/motor.js` / `js/quiz.js` still implement RN-023–026 with input = RN-057; `COPY.revelado` MUST NOT become the 5.4 success path (success still **“Você acertou”** then 5.8); 0 “marcar todas”; G008 only on present (depends on T013, T021)

**Checkpoint**: All user stories independently functional (5.4 contrato 003 + gabarito 008 + §5.8)

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Validação ponta a ponta, privacidade, idioma, layout dos ranks e guarda de escopo negativo

- [x] T048 Run `node --test tests/contract/motor.test.js tests/contract/quiz.test.js tests/contract/storage.test.js tests/contract/hud-session.test.js tests/contract/layout-responsivo.test.js` and close gaps against `contracts/motor-desconto-outs.md` §10, `contracts/quiz-desconto-outs.md` §10 and `contracts/storage-outs-odds.md` §7; add any missing FR-041 fixtures so each of Royal flush … Par is a winning upgrade in ≥1 flop/turn case and `carta_alta` in 0; 001 audio + 002 baralho + 003 (now five buckets) + 004 mão-atual + 006 showdown + 007 colinha (no own key) MUST still pass; leftover 005 47/46 / “adversário não desconta” / CA-014–017 MUST NOT remain as vigente gabarito; MUST NOT edit `specs/005-maos-ainda-possiveis/**`
- [x] T049 [P] Update the local-test / privacy paragraphs of `README.md`: §5.4 now asks which hands **turn the pot**; skip **“Não há mão que vire o pote.”**; §5.8 quantidade / ranks / odd (rule of 2); mention `avaliarDescontoStreet` / `sintetizarVilaoAssumido` in `js/motor.js`; evolution key now has five buckets `mao_atual`, `upgrade`, `vencedor_pote`, `outs`, `odds`; keep the no-PII sentence; MUST NOT advertise Pot Odds, rule of 4, report or zerar
- [x] T050 Execute manual quickstart scenarios A–H from `specs/008-desconto-outs/quickstart.md` against `http://localhost:8080` at 1280×720 (not `file://`) and repeat ranks on a narrow viewport: CA-033 path through odd; skip path; retry/buckets; turn remount; river/showdown 006; 13 ranks do not cover the felt; fail-open + LGPD DevTools (only counters); motor failure → `ociosa` + **Nova mão**
- [x] T051 [P] Update `.cursor/rules/lgpd-sessao-sem-pii.mdc` history to 001–008 / CR-002: MUST NOT persist vilão assumido, lista de outs, ranks, N, razão, snapshot or information set; audit DevTools Application plus source: only `poker-trainer:evolucao` (five buckets); nicknames remain **Você** / **Adversário A** / **Adversário B**; 0 `fetch` of telemetry; `js/mesa.js` still has 0 `localStorage` and 0 `motor.js` import; `js/colinha.js` still has 0 storage key (SC-021)
- [x] T052 Confirm negative scope in `js/motor.js`, `js/quiz.js`, `js/mesa.js`, `js/storage.js` and `index.html`: 0 Pot Odds / regra do 4 / `flush draw` / `gutshot` / `overcards` as labels; 0 5.4/5.8 on river; 0 apostas / relatório / zerar / mute / desistir / preflop quiz / poker lib / Worker / new overlay key; `specs/005-maos-ainda-possiveis/` git-clean (not reopened); `quemGanhou` still hole-real; RN-G001 (one question) and RN-G005 (no skip/reveal) hold
- [x] T053 Confirm copy stays the exact pt-BR strings in `js/quiz.js` `COPY` (5.4 / skip / quantidade / ranks / odd / RN-059 / **Você acertou** / **Não é essa. Tente de novo.** / **Não foi possível continuar esta mão. Tente de novo.**); beat adapter in `js/mesa.js` still 400 ms / 0 ms under `prefers-reduced-motion`; extra wait after 5.3/5.4 beat ≤ 1 s with 0 spinner; keyboard: Tab only activatable options then **Confirmar**; Enter/Space toggles on 5.4/ranks (does not submit) and submits on quantidade/odd; focus on first visual option when 5.4 or ranks opens (FR-040, SC-027)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) is the MVP increment (5.4 descontada no flop + turn fechado)
  - US2 reuses the 5.4 quiz path on the turn (recipe remounts)
  - US3 is the empty-lista branch of the same decision
  - US4–US6 are the three §5.8 steps after a non-skip 5.4
  - US7 completes RN-059 lines + showdown isolation on top of T003
  - US8 completes storage contract tests on top of T007 + US4–US6 writers
  - US9 locks the 003 multi-select contract on the new RN-057 truth
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no other story. MVP.
- **User Story 2 (P1)**: After US1 (shared 5.4 present/confirm in `js/quiz.js`; mesa must not open the next street)
- **User Story 3 (P1)**: After Foundational `decidirPosMaoAtual`; copy/cadence can land with or just after US1
- **User Story 4 (P1)**: After US1 (5.4 acerto opens `*_outs`); storage schema already in T007
- **User Story 5 (P1)**: After US4 (quantidade acertada abre ranks)
- **User Story 6 (P1)**: After US5 (ranks acertados abrem odd); street advance returns here
- **User Story 7 (P1)**: After Phase 2 recipe + US1 linha hook; Full house/Quadra/showdown locks can proceed in parallel with US4–US6 tests
- **User Story 8 (P2)**: After T007 schema + US4–US6 first-attempt writers
- **User Story 9 (P2)**: After US1 conjunto RN-057; CA-037 can be locked as soon as 5.4 confirm exists

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation of that story’s quiz/HUD wiring
- `sintetizarVilaoAssumido` before `baralhoProximaCarta` consumers
- `avaliarDescontoStreet` before `prepararUpgradesStreet`
- Prepare-on-pouso before 5.4/skip/5.8 cadence
- New 5.4 copy before §5.8 steps
- Quantidade before ranks before odd
- Storage schema before `outs`/`odds` deltas
- Story complete before moving to the next priority when the same file (`js/quiz.js` / `js/mesa.js`) is the bottleneck

### Parallel Opportunities

- Phase 1: T001 then T002 (T002 verifies T001 isolation + stubs)
- Phase 2: T007 (`js/storage.js`) in parallel with T003–T006 (`js/motor.js`, sequential in that file); T008 after T006; T009 after T008
- US1: T010, T011, T012 in parallel (three test files); then T013 (`js/quiz.js`) → T014 (`js/mesa.js`)
- US2: T015 and T016 in parallel; then T017 → T018
- US3: T019 and T020 in parallel; then T021 → T022
- US4: T023, T024, T025 in parallel; then T026 → T027
- US5: T028, T029, T030, T031 in parallel (tests + `css/hud.css`); then T032 → T033
- US6: T034, T035, T036 in parallel; then T037 → T038
- US7: T039 and T040 in parallel; then T041 → T042
- US8: T043 and T044 in parallel; then T045
- US9: T046 then T047
- Polish: T049 (README) in parallel with T051 (LGPD rule); T048 after stories; T050 after T048
- Do not parallelize tasks that edit the same file (`js/motor.js`, `js/quiz.js`, `js/mesa.js`, `js/storage.js`, `tests/contract/hud-session.test.js`)

---

## Parallel Example: User Story 1

```bash
# After Phase 2, launch US1 contract tests together:
Task: "CA-033/034/039 + carta_alta never in tests/contract/motor.test.js"
Task: "New 5.4 enunciado + linha in tests/contract/quiz.test.js"
Task: "5.4 does not deal turn + A/B closed in tests/contract/hud-session.test.js"

# Then sequential: quiz copy/linha/conjunto → mesa flop_upgrade opens flop_outs
```

## Parallel Example: User Story 4

```bash
Task: "N=10 / CA-045 in tests/contract/motor.test.js"
Task: "Quantidade 6 totais + delta outs in tests/contract/quiz.test.js"
Task: "flop_outs keeps turn closed in tests/contract/hud-session.test.js"
```

## Parallel Example: User Story 5

```bash
Task: "CA-041 / RN-074 in tests/contract/motor.test.js"
Task: "13 rótulos + conjunto outs in tests/contract/quiz.test.js"
Task: "Ranks must not cover felt in tests/contract/layout-responsivo.test.js"
Task: "Compact rank strip in css/hud.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: 5.4 descontada no flop, linha RN-059, CA-033 Par+Straight, turn ainda fechado, A/B fechados, zero persistência de vilão
5. Demo do flop se pronto (turn/§5.8 ainda podem ser stub de passo até US2–US6)

### Incremental Delivery

1. Setup + Foundational → placeholders + vilão + snapshot no pouso + cinco buckets
2. US1 → 5.4 descontada no flop (MVP!)
3. US2 → mesma 5.4 no turn (receita remonta)
4. US3 → skip novo; 0 §5.8
5. US4 → quantidade + `outs`
6. US5 → 13 ranks + segunda exposição `outs`
7. US6 → odd + `odds` + avança street
8. US7 → linhas RN-059 restantes + showdown isolado
9. US8 → contrato de storage (bloco de 3 legível, CA-046/047)
10. US9 → contrato 003 da grade (CA-037, G008)
11. Polish → `node --test` + quickstart A–H + auditoria LGPD/escopo

Cada história soma valor sem reabrir a pasta 005, sem redesenhar a 5.3 (004) e sem mudar `quemGanhou` (006).

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US2 → US3 → US4 → US5 → US6 on `js/quiz.js` / `js/mesa.js` (single owner of apresentar/cadência/persistir)
   - Developer B: `tests/contract/motor.test.js` + recipe/odd/FR-041 locks (T010, T015, T023, T028, T034, T039)
   - Developer C: `js/storage.js` + `storage.test.js` (T007, T043) and `css/hud.css` / `layout-responsivo.test.js` (T031, T030) if file ownership is split
3. HUD DOM (`renderHud` / `avancarAcerto`) stays on the owner of `js/mesa.js`
4. Do not split `js/motor.js` or `js/quiz.js` across two writers in the same phase

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to spec.md user stories US1–US9
- UI copy MUST be pt-BR; 10 rótulos MUST match RN-014; 13 ranks MUST match RN-064; razões MUST be `X:1`
- `js/mesa.js` MUST NOT import `js/motor.js` or call `localStorage`
- Vilão / outs / ranks / N / razão / snapshot MUST NEVER reach `poker-trainer:evolucao`
- Kickers MUST NEVER appear as option text (RN-G004)
- `specs/005-maos-ainda-possiveis/` MUST NOT be edited
- Verify tests fail before implementing quiz/HUD wiring
- Stop at any checkpoint to validate the story independently
- `/speckit-implement` executes this list; this command does **not** implement application code
- MUST NOT commit from `/speckit-tasks`
