# Research: Identificação de mãos ainda possíveis (flop e turn)

**Feature**: `005-maos-ainda-possiveis`  
**Date**: 2026-09-07  
**Status**: Completo — nenhum `NEEDS CLARIFICATION` remanescente no Technical Context.

Fontes: [spec.md](./spec.md), [constitution](../../.specify/memory/constitution.md) v1.0.0, [PRD §5.4](../../docs/prd.md) (RN-020..027, RN-046, CA-014..017), [ADR-003](../../docs/adr/ADR-003-motor-avaliacao-maos.md), motor da [004-mao-atual](../004-mao-atual/), quiz/persistência [003-feedback-persistencia](../003-feedback-persistencia/), baralho [002-embaralhamento-deal](../002-embaralhamento-deal/).

A stack **não se reabre**. Escolhas ambíguas foram resolvidas pela opção recomendada/padrão e registradas no final.

---

## 1. Stack do cliente (já decidida)

**Decision:** HTML + CSS + JavaScript ES modules nativos; `index.html` na raiz; GitHub Pages; sem bundler, sem framework, sem backend, sem `file://`. Enumerador **próprio** no mesmo `js/motor.js` da 004. **Nenhuma** biblioteca de poker em runtime (CDN ou vendored). Sem Worker, sem WASM de terceiros, sem API remota de runouts.

**Rationale:** Constitution I–III, ADR-001, ADR-003, ADR-006. O espaço do information set cabe no cliente (flop: C(47,2)=1 081 runouts; turn: 46). Cada runout reusa `avaliarMelhor5` de 7 cartas (C(7,5)=21) já entregue na 004.

**Alternatives considered:** Lib vendored / CDN (rejeitada pelo ADR-003); Web Worker só para enumerar (complexidade extra, YAGNI: ~23 k avaliações de 5 cabem no thread da UI); lookup Cactus Kev (tabela grande; a regra “exatamente C” continua nossa).

---

## 2. Organização dos módulos nesta feature

**Decision:** **Estender** `js/motor.js` com snapshot + enumerador + montagem do conjunto de até 6. **Alterar** `js/quiz.js` para consumir o enumerador em `flop_upgrade` e no novo `turn_upgrade`, e para **preparar** a lista RN-020 no pouso da street (ao apresentar `flop_hero` / `turn_hero`). **Alterar** `js/mesa.js` só na cadência (skip real no flop, pergunta real no turn, aborto `ociosa` se a enumeração falhar). `mesa.js` MUST NOT importar `motor.js` nem chamar `localStorage`.

| Módulo | Nesta feature |
|--------|----------------|
| `js/motor.js` | **Alter.** Acrescentar `snapshotDesconhecido`, `enumerarUpgrades`, `conjuntoOpcoesUpgrade`. Reusar `avaliarMelhor5` (7 cartas) e `CATEGORIAS`. Sem `quemGanhou`. Sem persistir runouts. |
| `js/quiz.js` | **Alter.** Preparar lista no pouso; `flop_upgrade` / `turn_upgrade` usam conjunto real + shuffle G008; `flop_skip` / `turn_skip` quando a lista é vazia. Stub Flush-verdadeiro e skip forçado do turn **saem**. River permanece stub 003. |
| `js/mesa.js` | **Alter cadência.** Após beat da 5.3: pergunta, skip ou aborto — lê só campos da sessão / helpers do quiz. MUST NOT importar `motor.js`. |
| `js/storage.js` | Intocado. Continua o único writer; bucket `upgrade` já existe. |
| `js/baralho.js` | Intocado. Motor MAY importar só `RANKS` / `NAIPES`. MUST NOT embaralhar, consumir ou reler o baralho vivo para enumerar. |
| `js/carta.js` / `audio.js` / CSS | Intocados (foco já existe via `focarPrimeiroHabilitado`). |

**Rationale:** ADR-006 reserva `motor` para 004–006. A 003 isolou retry/RN-024 precisamente para trocar só a correção. Workspace LGPD: `mesa.js` não importa o motor.

**Alternatives considered:** `mesa.js` chamar o motor (veda a regra de isolamento); enumerador num `js/upgrades.js` novo (módulo extra sem ganho; ADR-003 já coloca a enumeração no motor); calcular a lista só depois do beat da 5.3 (spec manda determinar no pouso).

---

## 3. Snapshot e information set (47 / 46)

**Decision:** O desconhecido é reconstruído pelo alfabeto `RANKS × NAIPES` (52 identidades) **menos** as cartas visíveis ao herói nesta street (2 hole + 3 comunitárias no flop = 5 visíveis → 47; 2+4 no turn = 6 visíveis → 46). Fonte das visíveis: `sessao.mao.cartasJogo` índices RN-044 — herói `[4][5]`, flop `[6][7][8]`, turn `[9]`. MUST NOT ler o array vivo do sapato, MUST NOT retirar carta, MUST NOT incluir burns, MUST NOT excluir holes de A/B (o herói não as vê).

Validação: se o snapshot não tiver length 47 (flop) ou 46 (turn), ou se `holeHeroi` não tiver 2 cartas, ou se `comunitarias` não tiver 3 (flop) nem 4 (turn), a enumeração **falha** (não inventa lista vazia).

**Rationale:** FR-004, FR-025, clarificação do snapshot. Reconstruir pelo alfabeto garante que o baralho da mão permanece intacto (SC-019).

**Alternatives considered:** Clonar e “dar as cartas” do baralho vivo (consome/reordena — veda FR-025); excluir holes adversárias “porque já saíram” (veda RN-020); tratar burn como carta retirada (veda RN-G007).

---

## 4. Algoritmo de enumeração (exatamente C, só as 7 finais)

**Decision:** API pública `enumerarUpgrades({ holeHeroi, comunitarias })`.

- Flop (`comunitarias.length === 3`): todo par não ordenado `(t, r)` entre as 47; testemunha = `avaliarMelhor5([...holeHeroi, ...comunitarias, t, r])` — **sempre 7 cartas**. MUST NOT testemunhar `avaliarMelhor5` das 6 intermediárias daquele par.
- Turn (`comunitarias.length === 4`): cada uma das 46 como river; testemunha = melhor 5 das 7.
- Um runout cuja melhor categoria é D incrementa **somente** D no conjunto testemunhado (royal **não** testemunha Flush nem Straight flush).
- Lista RN-020 = categorias testemunhadas que são **estritamente mais fortes** que a mão atual das cartas visíveis da street (`avaliarMelhor5` de 5 no flop / 6 no turn) e que **não** são `carta_alta`.
- Quem ganharia o pote no desfecho **não** filtra a lista.
- Retorno: `{ ok: true, categoriaAtual, upgrades }` com `upgrades` ordenados da mais forte para a mais fraca na tabela canônica; ou `{ ok: false }` se aridade/snapshot/avaliação falhar. MUST NOT lançar até a UI. MUST NOT incluir runouts no retorno (só ids de categoria).
- Early-out **correto**: parar só quando todas as categorias estritamente mais fortes que a atual já foram testemunhadas (no máximo 9). Early-out ao achar 6 ids **é inseguro** — os 6 primeiros no espaço de cartas podem não ser os 6 mais fortes.

Custo: 1 081 × 21 ≈ 22 701 avaliações de 5 no flop; 46 × 21 no turn. Meta: terminar **síncrono** no pouso, antes do beat da 5.3 (< 50 ms no desktop de referência). O teto de 1 s extra no estado de acerto permanece como fallback se a implementação fatiar o laço; MUST NOT spinner / “calculando” / skip de espera.

**Rationale:** ADR-003 + FR-003..007 + clarificações (7 vs 6; pote hipotético irrelevante). Reusar o ranking completo da 004 (kickers só por dentro) evita duas semânticas.

**Alternatives considered:** Enumerar só “outs de naipe/straight” (vira draw nomeado; erra “exatamente C”); testemunhar a mão de 6 no flop (Flush de passagem vira upgrade mesmo quando o rio é Full house); Worker/`requestIdleCallback` como padrão (atraso imprevisível; sync cabe).

---

## 5. Conjunto de até 6 e distratoras

**Decision:** Função `conjuntoOpcoesUpgrade({ upgrades })` no **motor**. Entrada = lista RN-020 completa (antes do teto). Devolve **exatamente 6** ids distintos, **sem** shuffle.

1. Lista vazia: o quiz **não** chama esta função — vai a `sem_upgrade`.
2. 1 a 5 upgrades: incluir todos; completar com distratoras da mais forte para a mais fraca na tabela canônica, sem repetir. Distratora = categoria que **não** é upgrade nesta street (atual, mais fracas, `carta_alta`, mais fortes inatingíveis).
3. 6 ou mais: só os 6 mais fortes; zero distratora; as que não couberam não entram no retorno e não geram estatística.
4. Sempre 6 quando a lista não é vazia. Conjunto determinístico para o mesmo information set + mesma mão atual.

Quiz aplica `shuffleOpcoes` já existente ao **apresentar** a pergunta nova. Retry da mesma pergunta MUST NOT reembaralhar (contrato 003). MUST NOT haver controle “marcar todas”.

**Rationale:** RN-023 / FR-010 / FR-011 já fecharam a ordem das distratoras na spec. Isolar no motor deixa o quiz só com apresentação/G008/RN-024.

**Alternatives considered:** Heurística “board tentador” da 004 nas distratoras (é da 5.3, não da 5.4); preencher da mais fraca (menos alinhado ao recorte “6 mais fortes”); montar no quiz (duplica a tabela canônica).

---

## 6. Cadência: pergunta, skip e falha

**Decision:** No pouso do flop/turn, ao `apresentarPergunta(flop_hero|turn_hero)`, o quiz prepara e guarda em memória da visita `sessao.mao.upgradesStreet` (`ok`, `lista`, `street`). A 5.3 abre na hora — a lista **não** aparece ainda.

Após `FIM_BEAT_ACERTO` da 5.3:

| `upgradesStreet` | HUD |
|------------------|-----|
| `ok === false` ou ausente após o teto de espera | abortar mão: `ociosa` + **Nova mão** (espírito de `falhaMontagem`). Copy pt-BR sem jargão: **“Não foi possível continuar esta mão. Tente de novo.”** MUST NOT fingir `sem_upgrade`. Contadores já gravados permanecem. 0 persistência de runout/dump. |
| `ok` e `lista.length === 0` | `sem_upgrade` + **Continuar**. Flop: novo passo `flop_skip` → turn. Turn: `turn_skip` → river. 0 estatística `upgrade`. |
| `ok` e `lista.length ≥ 1` | `perguntando` com enunciado 5.4, 6 opções, **Confirmar**. Flop: `flop_upgrade`. Turn: **`turn_upgrade`** (o skip forçado da 003 **sai**). |

Se a lista ainda não estiver pronta no beat: permanecer no acerto no máximo **1 s** extra; depois disso, se continuar `!ok` / ausente → aborto. MUST NOT spinner. Com movimento reduzido o beat da 5.3 já é 0 s; o teto de 1 s extra permanece.

River: 0 pergunta de upgrade (006). `continuar()` passa a tratar **também** `flop_skip` (hoje só `turn_skip`).

**Rationale:** FR-001/002/008/024/027/028. Skip falso treinaria a lição errada; travar em “Você acertou” viola o ritmo da mesa.

**Alternatives considered:** Abortar só no pouso sem mostrar 5.3 (também legal se `!ok` já no pouso — permitido e preferível quando a falha é síncrona); tratar falha como skip (veda FR-027); esperar indefinidamente (veda fail-open / ritmo).

---

## 7. Contrato de quiz e persistência (reuso 003)

**Decision:** Retry, morta, trava de verdadeiro, 1ª **Confirmar** no bucket `upgrade` das opções **exibidas**, Confirmar seguintes sem regravar, fail-open de storage, copy de acerto/erro, Tab só no ativável: **iguais** à 003. O que muda é `conjuntoCorreto` / flags `verdadeira` virem do enumerador, e o turn deixar de ser skip cego.

Flop e turn da mesma mão = duas 1ªs **Confirmar** independentes quando ambas têm lista não vazia. Skip não cria exposição. MUST NOT fundir deltas. MUST NOT tocar `mao_atual` nem `vencedor_pote` por causa desta pergunta.

Foco: reusar `focarPrimeiroHabilitado` (já foca o primeiro `button` habilitado; a grade vem antes de **Confirmar**). Enter/Espaço na opção continua `ALTERNAR_OPCAO`. MUST NOT controle “marcar todas”.

**Rationale:** FR-014..017, FR-029/030, RN-024..026, RN-G005, RN-G008.

**Alternatives considered:** Novo bucket de persistência (veda ADR-002 / FR-019); cache da lista no `localStorage` para retomar após reload (veda FR-019; reload já aborta a mão).

---

## 8. Testes sem bundler e cobertura das 9

**Decision:** (1) [quickstart.md](./quickstart.md) no browser `http://`. (2) `node --test`: **estender** `tests/contract/motor.test.js` com snapshot 47/46, exatamente C, 7 vs 6, conjunto de 6, falha de aridade; **atualizar** `quiz.test.js` e `hud-session.test.js` para **não** assumir Flush-verdadeiro no flop nem skip forçado no turn. River stub permanece.

Fixtures obrigatórias (cartas construídas, não deal aleatório):

- CA-014: flop em Carta alta com ≥7 upgrades → 6 mais fortes, 0 distratora.
- CA-015: turn com exatamente 2 upgrades → 2 + 4 distratoras.
- CA-016: Flush verdadeiro + Par distratora na 1ª Confirmar.
- CA-017: royal no flop → skip, 0 `upgrade`.
- Royal testemunha só royal (Flush/SF não sobem).
- Herói com trinca → Par não é upgrade.
- Cada uma das 9 (Royal flush … Par) é upgrade verdadeiro em ≥1 fixture de flop ou turn; Carta alta em 0.
- Enumeração falha → `ociosa` + Nova mão; 11 cartas e burns intactos no caminho feliz.
- Snapshot não altera `cartasJogo`.

**Rationale:** Mesmo padrão 001–004; SC-023 exige as 9. Após o teto de 6, Par/Dois pares/Trinca podem sumir da grade mesmo sendo possíveis.

**Alternatives considered:** Manter faces stub e só mudar a “certa” (viola RN-023); Playwright (dependência contra o mínimo).

---

## 9. LGPD, idioma, custo, retenção

**Decision:** Motor e quiz desta pergunta **não** persistem cartas, runouts, snapshot, information set, pool, enunciado, timestamp, stack de erro nem identificador. O único efeito que sobrevive é o delta já definido em `upgrade` das categorias **exibidas** na 1ª **Confirmar**, via `js/storage.js`. Apelidos continuam **Você / Adversário A / Adversário B**. Fail-open da 003 inalterado para storage; falha de enumeração **não** é fail-open de mentira no quiz — aborta a mão. Sem backend, sem lib paga, UI pt-BR, rótulos RN-014 exatos, 0 vocabulário de draws.

**Rationale:** Constitution II/III/VII, workspace LGPD, FR-019..023, FR-027.

**Alternatives considered:** Log de runouts para debug (replay/PII); persistir a lista para “continuar depois do F5” (a mão aborta no reload por contrato do casco).

---

## Registro de escolhas (ambíguo → padrão)

| Tema | Escolha |
|------|---------|
| Branch git | Permanecer em `main`. Identidade Spec Kit: `005-maos-ainda-possiveis`. |
| Módulo | Estender `js/motor.js`. Quiz prepara a lista; mesa não importa motor. |
| Momento | Determinar RN-020 no pouso (junto de `flop_hero` / `turn_hero`). Mostrar só após beat da 5.3. |
| Execução | Síncrona no thread da UI; teto de 1 s extra só como fallback. Sem Worker. |
| Snapshot | `RANKS × NAIPES` − visíveis ao herói. Nunca o baralho vivo. |
| Testemunha | Só melhor 5 das **7** finais; ranking completo da 004. |
| Early-out | Só quando todas as mais fortes que a atual já foram achadas. Não ao achar 6. |
| Resultado de falha | `{ ok: false }` (não throw na UI) → `ociosa` + copy sem jargão. |
| Passos | Novo `turn_upgrade` e `flop_skip`; `turn_skip` permanece para lista vazia no turn. |
| Distratoras | Mais forte → mais fraca (já na spec). |
| Pote hipotético | Não filtra. |
| Persistência | Só delta `upgrade` exibido; 0 runouts. |
| Foco / marcar todas | Reuso do HUD; 0 controle “marcar todas”. |
| Testes | Estender `motor.test.js`; atualizar quiz/HUD; fixtures das 9. |
| Relatório / zerar / lib / backend / draws | Ausentes. |
