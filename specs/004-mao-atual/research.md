# Research: Identificação da mão atual (flop e turn)

**Feature**: `004-mao-atual`  
**Date**: 2026-09-07  
**Status**: Completo — nenhum `NEEDS CLARIFICATION` remanescente no Technical Context.

Fontes: [spec.md](./spec.md), [constitution](../../.specify/memory/constitution.md) v1.0.0, [PRD §5.3](../../docs/prd.md) (RN-013..019, RN-046, RN-029, CA-010..013, CA-027), [ADR-003](../../docs/adr/ADR-003-motor-avaliacao-maos.md), [ADR-006](../../docs/adr/ADR-006-es-modules-sem-bundler.md), quiz/persistência [003-feedback-persistencia](../003-feedback-persistencia/), baralho [002-embaralhamento-deal](../002-embaralhamento-deal/).

A stack **não se reabre**. Escolhas ambíguas foram resolvidas pela opção recomendada/padrão e registradas no final.

---

## 1. Stack do cliente (já decidida)

**Decision:** HTML + CSS + JavaScript ES modules nativos; `index.html` na raiz; GitHub Pages; sem bundler, sem framework, sem backend, sem `file://`. Motor **próprio** no cliente. **Nenhuma** biblioteca de poker em runtime (CDN ou vendored). Sem API de avaliação remota.

**Rationale:** Constitution I–III, ADR-001, ADR-003, ADR-006. O avaliador de melhor 5 cabe num módulo de domínio; o contrato de quiz da 003 já existe.

**Alternatives considered:** Lib vendored / CDN (rejeitada pelo ADR-003 e pelo custo/offline); lookup Cactus Kev (tabela grande, upgrades da 005 ainda seriam nossos); backend de avaliação (custo + LGPD).

---

## 2. Organização dos módulos nesta feature

**Decision:** Criar **`js/motor.js`**. **Alterar** `js/quiz.js` para consumir o motor **somente** em `flop_hero` e `turn_hero`. `js/mesa.js` continua orquestrando a cadência; **não** importa o motor. Upgrades stub, river do herói/A/B e vencedor **permanecem** o contrato da 003.

| Módulo | Nesta feature |
|--------|----------------|
| `js/motor.js` | **Novo.** Melhor 5 (5/6/7 cartas), taxonomia RN-014, kickers internos RN-029, wheel/wrap/royal, conjunto determinístico de 6 opções (RN-017) **sem** embaralhar. Sem enumerador de upgrades. Sem “quem ganhou”. |
| `js/quiz.js` | **Alter.** Em `flop_hero`/`turn_hero`: extrai cartas visíveis ao herói + board da street em `sessao.mao.cartasJogo` (RN-044), chama o motor, monta opções (shuffle G008 já existente). River e `flop_upgrade` continuam stub. |
| `js/mesa.js` | Cadência **inalterada** (`flop_hero` → upgrade stub; `turn_hero` → skip; river stub). Não chama `localStorage`. Não importa `motor.js`. |
| `js/storage.js` | Intocado. Continua o único writer via quiz; ids de categoria já batem com o motor. |
| `js/baralho.js` | Intocado. Motor MAY importar só `RANKS` / `NAIPES` para não divergir o alfabeto; MUST NOT importar shuffle/pool. |
| `js/carta.js` / `audio.js` / CSS | Intocados. |

**Rationale:** ADR-006 reserva `motor` para 004–006. A 003 isolou o contrato de retry precisamente para esta troca de correção. YAGNI: enumerador 005 e showdown 006 ficam fora.

**Alternatives considered:** `mesa.js` chamar o motor (duplica extração de cartas; quiz já é o dono da correta); motor dentro de `quiz.js` (quebra o domínio ADR-006); já exportar `avaliarShowdown` / enumerador (fora de escopo).

---

## 3. Algoritmo de melhor 5 (sem lib)

**Decision:** API pública `avaliarMelhor5(cartas)` aceita **5, 6 ou 7** cartas `{ rank, naipe }`. Internamente: enumerar todas as combinações de 5 (`C(5,5)=1`, `C(6,5)=6`, `C(7,5)=21`), pontuar cada 5, escolher a de maior `chaveDesempate`. No flop o HUD só entrega 5; no turn, 6. O caso 7 existe para o mesmo critério (e para a 006 reusar), mas o HUD desta feature **não** pergunta com 7.

Pontuação de 5 cartas, nesta ordem de reconhecimento:

1. Flush = 5 do mesmo naipe.
2. Straight = o conjunto de 5 ranks é **exatamente** uma das 10 sequências legais de FR-006.
3. Royal = flush **e** ranks A-K-Q-J-10.
4. Straight flush = flush + straight **e** não royal.
5. Senão: quadra → full house → flush → straight → trinca → dois pares → par → carta alta.

Comparação: tupla lexicográfica `[forcaCategoria 9..0, ...kickers]`. Kickers segundo RN-029. Wheel: Ás vale 1 só para o topo da sequência (topo = 5), nunca 14 nessa mão.

No turn, `C(6,5)` já cobre 2 hole + 3 comunitárias e 1 hole + 4 comunitárias. **Não** existe 0+5 (só 4 comunitárias). No caso 7, 0+5 (jogar a mesa) é legal — reservado à 006.

**Rationale:** Espaço minúsculo; determinístico; cobre FR-016 sem gerador recursivo. Combinações por laços aninhados (sem alocação exótica).

**Alternatives considered:** Classificador só de 5 cartas + wrapper ad hoc de turn (duplica a regra “melhor”); bitmask/Cactus Kev (excesso); pontuar 7 cartas “como se fossem 5” sem enumerar (erra o turn).

---

## 4. Wheel, wrap e royal ≠ SF

**Decision:** As **únicas** sequências legais são as 10 de FR-006, como conjuntos de ranks: `A-2-3-4-5`, `2-3-4-5-6`, …, `10-J-Q-K-A`. Qualquer outro conjunto de 5 ranks **não** é straight (nem SF se suited). Wrap (Ás alto e baixo ao mesmo tempo) fica de fora por construção — não há janela legal K-A-2-3-4, Q-K-A-2-3, J-Q-K-A-2, A-2-3-4-K.

Royal é **categoria distinta** (força 9), nunca rótulo Straight flush. Wheel suited = Straight flush (força 8), nunca royal. Wheel offsuit = Straight.

**Rationale:** Spec FR-005/FR-006 e RN-015. Lista fechada é mais simples e testável do que “ordenar Ás nos dois sentidos e filtrar wrap”.

**Alternatives considered:** Ás dual com filtro de wrap depois (fácil errar); tratar royal como SF + flag (vaza no rótulo).

---

## 5. Kickers internos, UI só com rótulo

**Decision:** `Melhor5` devolve `{ categoriaId, rotulo, cartas, chaveDesempate }`. O HUD consome **somente** `rotulo` / `categoriaId`. Kickers MUST NEVER virar texto de opção, enunciado, `aria-label` extra ou tooltip. Par de dois e par de Ás → mesmo `par`. Duas combinações do turn na mesma categoria → mesmo rótulo; a chave escolhe **qual** 5 cartas vence, não a opção.

**Rationale:** RN-016, RN-046, RN-G004, clarificação da spec. Sem a chave, o turn 1+4 vs 2+3 empata no rótulo e pode escolher a 5 errada internamente — a 006 precisará da mesma chave.

**Alternatives considered:** Devolver só o rótulo (falha FR-016 e o turn); mostrar “par de reis” “para ensinar” (veda RN-016).

---

## 6. Heurística RN-017 (conjunto, não ordem visual)

**Decision:** Função `conjuntoOpcoesMaoAtual({ categoriaId, board })` no **motor** (domínio determinístico). Devolve **exatamente 6** ids distintos, correta inclusa, **sem** shuffle. Quiz aplica `shuffleOpcoes` já existente ao apresentar.

Passos (FR-009 / Assumptions):

1. Incluir a correta.
2. Vizinhas imediatas na tabela de 10 (Royal só tem SF; Carta alta só tem Par).
3. Tentadoras do **board da street** (só comunitárias já abertas; **nunca** hole do herói), nesta ordem, sem repetir:
   - **Flush** se ≥2 do mesmo naipe;
   - **Straight** se o board está **conectado**;
   - **Straight flush** se ≥3 do mesmo naipe **e** os ranks **desse naipe** estão conectados (connector offsuit não basta);
   - se ≥3 do mesmo rank: **Quadra**, **Full house**, **Trinca**, **Dois pares**;
   - senão, se pareado (um rank ≥2 vezes, sem trinca): **Full house**, **Trinca**, **Dois pares**.
   - **Royal flush** MUST NOT entrar só por tentadora.
4. Preencher de cima para baixo na RN-014, **sem** filtrar “ainda possível”.

Se 2–3 passarem de 5 distratoras: manter correta + vizinhas já incluídas + tentadoras na ordem do passo 3; descartar o excedente. Categoria que é a certa não entra de novo como distratora.

**Conectado** (escolha já na spec): ≥3 ranks distintos cabem numa janela de 5 ranks consecutivos **legal** (as 10 sequências). 2-4-6 conectado; 2-4-7 e 2-3-8 não; A-2-3 conectado (wheel); K-A-2 não (wrap).

**Rationale:** Heurística é regra de produto sobre textura, não UI. Isolar no motor deixa o quiz só com apresentação/G008.

**Alternatives considered:** Montar opções no quiz (quiz precisaria conhecer textura); filtrar impossíveis no preenchimento (é 005); incluir Royal por “board bonito” (spec proíbe).

---

## 7. Integração no flop/turn e exclusão do river

**Decision:** `apresentarPergunta` em `flop_hero` / `turn_hero` lê `sessao.mao.cartasJogo` (índices RN-044: herói `[4][5]`, flop `[6][7][8]`, turn `[9]`). Flop → 5 cartas; turn → 6. MUST NOT incluir holes de A/B nem burns. MUST NOT chamar o motor em `river_hero`, `river_a`, `river_b`, `flop_upgrade` nem `river_vencedor`.

Cadência da 003 **não muda**: acerto flop → `flop_upgrade` stub; acerto turn → `turn_skip`. Esta feature **não** abre o river após o flop e **não** cria pergunta extra de mão do herói no river (CA-027 / FR-015).

Flop e turn da mesma mão = duas 1ª tentativas independentes em `mao_atual` (já é o contrato 003 por passo; só muda a categoria correta).

**Rationale:** Roadmap e spec: river do herói é 006. Substitui só a correção stub Flush nos dois passos desta feature.

**Alternatives considered:** Já avaliar o river “para adiantar” (duplica a pergunta, viola CA-027); pular o turn se a categoria não mudou (spec proíbe).

---

## 8. Testes sem bundler e fixtures

**Decision:** (1) [quickstart.md](./quickstart.md) no browser `http://`. (2) `node --test`: **novo** `tests/contract/motor.test.js`; **atualizar** `quiz.test.js` e `hud-session.test.js` para **não** assumir Flush no flop/turn. Testes de HUD/quiz MUST usar a `corretaUnica` devolvida **ou** permutações-fixture. Clique em distratora = qualquer opção `verdadeira === false` exibida — as 6 faces **deixam de ser** o conjunto stub fixo da 001/003. River/upgrade continuam assertando Flush/Par stub.

`payloadFabrica` (baralho ordenado) no flop do herói é 10-9-8-7-6 de espadas = **Straight flush** — útil como fixture, mas os testes atuais que clicam `flush` **quebram** e MUST ser atualizados na implementação.

Cobre as 10 categorias como única certa em pelo menos um flop ou turn (SC-013). Casos obrigatórios: royal, wheel suited, wheel offsuit, wraps, par vs dois pares no turn (1+4 vs 2+3), board 2-4-6 vs 2-4-7.

**Rationale:** Mesmo padrão 001–003; custo zero. Após RN-017, Par/Carta alta podem nem aparecer nas 6.

**Alternatives considered:** Manter as 6 faces stub e só mudar a “certa” (viola RN-017); Playwright (dependência contra o mínimo).

---

## 9. LGPD, idioma, custo, retenção

**Decision:** Motor e quiz desta pergunta **não** persistem cartas, kickers, pool, enunciado, timestamp nem identificador. O único efeito que sobrevive é o delta já definido em `mao_atual` da categoria correta (1ª tentativa), via `js/storage.js`. Apelidos continuam **Você / Adversário A / Adversário B**. Fail-open da 003 inalterado: se o storage falhar, o avaliador segue. Sem backend, sem lib paga, UI pt-BR, rótulos RN-014 exatos.

**Rationale:** Constitution II/III/VII, workspace LGPD, FR-018..021.

**Alternatives considered:** Cache da melhor 5 no `localStorage` para replay (veda FR-019); log de mãos para debug (PII/replay).

---

## Registro de escolhas (ambíguo → padrão)

| Tema | Escolha |
|------|---------|
| Branch git | Permanecer em `main`. Identidade Spec Kit: `004-mao-atual`. |
| Módulo | Criar `js/motor.js` (ADR-003). Quiz consome; mesa não importa motor. |
| Escopo do motor agora | Melhor 5 + kickers + conjunto RN-017. Sem enumerador 005. Sem vencedor 006. |
| API 7 cartas | `avaliarMelhor5` aceita 5/6/7; HUD só 5/6. |
| Sequência | Lista fechada de 10 conjuntos legais; wrap impossível por construção. |
| Kickers | Tupla numérica interna; 0 vazamento na UI. |
| RN-017 | Função no motor; shuffle continua no quiz. |
| Extração RN-044 | Quiz lê `cartasJogo`; motor só vê `{rank,naipe}[]`. |
| River | Stub 003 inalterado (`river_hero` = Flush). |
| Import baralho | Só `RANKS`/`NAIPES`; sem shuffle. |
| Testes flop/turn | Fixture + `corretaUnica`; não clicar `flush` cego. |
| Entrada inválida (≠5/6/7) | Motor lança; quiz nunca chama nesses tamanhos. |
| Relatório / zerar / lib / backend | Ausentes. |
