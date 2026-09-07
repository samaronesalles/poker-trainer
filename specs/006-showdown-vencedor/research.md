# Research: Showdown — mãos dos adversários e vencedor do pote

**Feature**: `006-showdown-vencedor`  
**Date**: 2026-09-07  
**Status**: Completo — nenhum `NEEDS CLARIFICATION` remanescente no Technical Context.

Fontes: [spec.md](./spec.md), [constitution](../../.specify/memory/constitution.md) v1.0.0, [PRD §5.5](../../docs/prd.md) (RN-028..033, RN-038, CA-018..021, CA-027), [ADR-003](../../docs/adr/ADR-003-motor-avaliacao-maos.md), motor da [004-mao-atual](../004-mao-atual/) e [005-maos-ainda-possiveis](../005-maos-ainda-possiveis/), quiz/persistência [003-feedback-persistencia](../003-feedback-persistencia/), baralho [002-embaralhamento-deal](../002-embaralhamento-deal/), casco [001-mesa-imersiva](../001-mesa-imersiva/).

A stack **não se reabre**. Escolhas ambíguas foram resolvidas pela opção recomendada/padrão e registradas no final.

---

## 1. Stack do cliente (já decidida)

**Decision:** HTML + CSS + JavaScript ES modules nativos; `index.html` na raiz; GitHub Pages; sem bundler, sem framework, sem backend, sem `file://`. Comparação de pote **própria** no mesmo `js/motor.js` da 004/005. **Nenhuma** biblioteca de poker em runtime (CDN ou vendored). Sem Worker, sem WASM de terceiros, sem API remota de ranking.

**Rationale:** Constitution I–III, ADR-001, ADR-003, ADR-006. O espaço é minúsculo: 3 × C(7,5) = 63 avaliações de 5. `avaliarMelhor5` já devolve `chaveDesempate` no formato RN-029.

**Alternatives considered:** Lib vendored / CDN (rejeitada pelo ADR-003); lookup Cactus Kev (tabela grande; o mapeamento RN-030/031 continua nosso); backend de avaliação (custo + LGPD).

---

## 2. Organização dos módulos nesta feature

**Decision:** **Estender** `js/motor.js` com `quemGanhou`, `conjuntoOpcoesVencedor` e `UNIVERSO_POTE`. **Alterar** `js/quiz.js` para preparar o showdown no pouso do river e tornar autoritativos `river_hero`, `river_a`, `river_b` e `river_vencedor`. **Alterar** `js/mesa.js` na cadência (virada → quatro perguntas → `resultado` autoritativo; aborto `ociosa` se a comparação falhar) e na cenografia do pote. `mesa.js` MUST NOT importar `motor.js` nem chamar `localStorage`.

| Módulo | Nesta feature |
|--------|----------------|
| `js/motor.js` | **Alter.** Acrescentar `quemGanhou`, `conjuntoOpcoesVencedor`, `UNIVERSO_POTE`. Reusar `avaliarMelhor5` (7 cartas), `conjuntoOpcoesMaoAtual` e `CATEGORIAS`. Sem persistir Melhor5/chave. |
| `js/quiz.js` | **Alter.** Preparar showdown no pouso; os quatro passos do river usam correção real + shuffle G008. Stub Flush/Par/`indiceMaoSessao` **sai**. Flop/turn 004/005 **intocados**. |
| `js/mesa.js` | **Alter cadência + desfecho.** Após virada: pergunta, espera ≤1 s ou aborto. `resultado` lê `sessao.mao.showdown`. Destaque/fichas **só** em `resultado`. MUST NOT importar `motor.js`. |
| `js/storage.js` | Intocado. Continua o único writer; buckets `mao_atual` e `vencedor_pote` já existem. |
| `js/baralho.js` | Intocado. Gerador **não** passa a evitar empates (RN-G003). |
| `index.html` / `css/mesa.css` | **Alter menor.** Grupo de fichas `adversarioB`; destaque de assento; pote caminha ao vencedor real (não só herói). |
| `js/carta.js` / `audio.js` | Intocados. |

**Rationale:** ADR-006 reserva `motor` para 004–006. A 003 isolou retry/G008 precisamente para trocar só a correção. Workspace LGPD: `mesa.js` não importa o motor.

**Alternatives considered:** `mesa.js` chamar o motor (veda a regra de isolamento); comparador num `js/showdown.js` novo (módulo extra sem ganho; ADR-003 já coloca “compara três mãos” no motor); calcular só ao abrir “quem ganhou” (spec manda determinar com as 11 conhecidas, antes da 1ª pergunta).

---

## 3. API `quemGanhou` e ranking completo (RN-029)

**Decision:** API pública `quemGanhou({ holeVoce, holeA, holeB, comunitarias })`.

- Cada hole: exatamente 2 `{ rank, naipe }`. Comunitárias: exatamente 5. As 11 identidades MUST ser distintas e do alfabeto `RANKS × NAIPES`.
- Para cada jogador: `avaliarMelhor5([...holeDaquele, ...comunitarias])` — **sempre 7 cartas**. Jogar a mesa (0 hole na melhor 5) já é legal no avaliador.
- Comparar as três `chaveDesempate` com a mesma ordem lexicográfica já usada em `avaliarMelhor5` (`compararChave` interno). Categoria (primeiro elemento) + ranks que definem a mão. Naipe **não** entra na chave.
- Conjunto vencedor = todos cujo chave é máxima e empatada. Mapear 1-para-1 a `VencedorId`:

| Vencedores (assentos) | `VencedorId` | Rótulo RN-030 |
|-----------------------|--------------|---------------|
| `{voce}` | `voce` | Você |
| `{adversarioA}` | `adversarioA` | Adversário A |
| `{adversarioB}` | `adversarioB` | Adversário B |
| `{voce, adversarioA}` | `voce_a` | Você e Adversário A |
| `{voce, adversarioB}` | `voce_b` | Você e Adversário B |
| `{adversarioA, adversarioB}` | `a_b` | Adversário A e Adversário B |
| `{voce, adversarioA, adversarioB}` | `tres` | Os três empatam |

- Retorno feliz: `{ ok: true, maos: { voce, adversarioA, adversarioB }, vencedorId, vencedores }`. Cada `maos.*` é a Melhor5 daquele jogador (categoria + chave **só em memória**). MUST NOT incluir runouts.
- Falha (aridade, duplicata, identidade inválida, throw do avaliador): `{ ok: false }`. MUST NOT lançar até a UI. MUST NOT inventar `tres`. MUST NOT fingir empate.

A `chaveDesempate` já vigente cobre FR-011: royal `[9,14]`; SF `[8, topo]` (wheel=5); quadra; full house; flush (cinco ranks); straight (topo, wheel=5); trinca + 2 kickers; dois pares; par + 3 kickers; carta alta. Dois royais empatam; naipe não desempatar.

**Rationale:** Reusar a chave da 004 evita duas semânticas de ranking (o risco que o ADR-003 aponta). Nome `quemGanhou` é o da tarefa e o que o ADR descreve (“declara vencedor único ou empate”).

**Alternatives considered:** Reimplementar desempate do zero (duplica bugs); devolver só ids sem Melhor5 (o quiz das três categorias precisaria avaliar de novo, ok, mas o aborto precisa das três classificações prontas juntas); throw na UI (quebra fail-open / HUD).

---

## 4. Momento da preparação e aborto

**Decision:** O quiz expõe `prepararShowdown(sessao)`. A mesa chama **assim que o river pousa** (`cartasJogo[10]` conhecido; MAY durante a virada, MUST NOT esperar o treinando responder). Resultado fica em `sessao.mao.showdown` (memória da visita).

Depois da virada simultânea de A e B:

1. Se `showdown.ok === true` → abrir `river_hero`.
2. Se `showdown.ok === false` → abortar imediatamente (`ociosa` + **Nova mão**); o quiz **não** abre.
3. Se ainda `pendente` (defesa; o caminho feliz é síncrono) → HUD permanece em `deal` no máximo **1 segundo** extra, sem spinner e sem “calculando”; findo o teto sem `ok`, aborta.

MUST NOT abrir a primeira pergunta sem as três Melhor5 e o `vencedorId`. MUST NOT persistir o dump. Contadores já gravados nesta visita permanecem.

**Rationale:** FR-025 / clarificação. Abrir o quiz sem poder cobrá-lo treinaria a lição errada ou abortaria no meio com exposições parciais. Padrão idêntico à 005 (`{ ok: false }` → ociosa).

**Alternatives considered:** Preparar só em `river_vencedor` (tarde demais se A/B falharem); spinner (jargão, veda spec); fingir **Os três empatam** (treina o erro).

---

## 5. Quatro passos do river e fim do stub

**Decision:** Reusar `avaliarMelhor5` + `conjuntoOpcoesMaoAtual` nas três perguntas de categoria, com **board = as 5 comunitárias** (`cartasJogo[6]..[10]`), nunca as hole do jogador da pergunta.

| Passo | 7 cartas | Enunciado | Bucket 1ª tentativa |
|-------|----------|-----------|---------------------|
| `river_hero` | herói `[4][5]` + 5 comunitárias | Qual mão você tem agora? | `mao_atual` da categoria **do herói** |
| `river_a` | A `[0][1]` + 5 | Qual mão o Adversário A completou? | `mao_atual` da categoria **de A** |
| `river_b` | B `[2][3]` + 5 | Qual mão o Adversário B completou? | `mao_atual` da categoria **de B** |
| `river_vencedor` | — | Quem ganhou o pote? | `vencedor_pote` (um grupo) |

Contrato 5.3: seleção única, 6 rótulos, clique submete, retry, G008. **Zero** `Confirmar`. **Zero** `flop_upgrade`/`turn_upgrade`/`skip` após `river_hero`. Cada pergunta **substitui** o HUD; rótulos **não** grudam no assento até `resultado`.

Remover do quiz (deixam de ser fonte de verdade): `CATEGORIAS_STUB`, `CATEGORIA_CORRETA_*`, `CATEGORIA_ADVERSARIO_*`, `VENCEDORES_STUB` (só 6 textos, sem **Os três empatam**), `idVencedorCorreto(indiceMaoSessao)` / `rotuloVencedorCorreto`. Testes da 001/003 que assumem Flush/Par/split na 2ª mão MUST ser reescritos com fixtures.

**Rationale:** CA-027 (uma só 5.3 do herói no river), RN-G002 (sem 5.4), RN-038 (três exposições independentes). O stub ensinava o rótulo errado.

**Alternatives considered:** Manter Flush/Par e só consertar o pote (CA-019 falha); segunda pergunta do herói “Qual mão você completou?” (spec/casco já fixaram “tem agora”).

---

## 6. Universo RN-030 e recorte RN-031

**Decision:** `UNIVERSO_POTE` no motor: os **7** textos, ids estáveis acima. `conjuntoOpcoesVencedor(vencedorId)` devolve **exatamente 6** ids distintos, **sem** shuffle:

1. Incluir a correta.
2. Completar, sem repetir, na prioridade (1) Você (2) Adversário A (3) Adversário B (4) Você e Adversário A (5) Você e Adversário B (6) Adversário A e Adversário B (7) Os três empatam.
3. Se a correta for `tres`, ela já está no passo inicial; as outras 5 seguem (1)→(5). A de menor prioridade que não couber **não** aparece (`a_b` fica de fora quando a certa é `tres`; `tres` fica de fora quando a certa é qualquer outra).

O quiz só aplica `shuffleOpcoes` ao apresentar. Retry MUST NOT reembaralhar. MUST NOT reembaralhar as 52.

**Rationale:** FR-013; conjunto determinístico para a mesma correta; G008 é visual.

**Alternatives considered:** Sempre mostrar os 7 (viola “sempre 6”); sortear distratoras (não determinístico; RN-031 é lista fixa).

---

## 7. Desfecho visual só em `resultado`

**Decision:** Durante `deal` e as quatro perguntas: `pote.modo === 'centro'`, `vencedoresVisuais === []`, **0** `data-vencedor` nos assentos. Após acerto de `river_vencedor` + beat: HUD `resultado`; texto canônico RN-030; `categoriasIdentificadas` na ordem Você / A / B; destaque **somente** nos assentos vencedores (perdedores **não** escurecem, cartas 100% legíveis); fichas caminham ao único ou **dividem-se** entre os empatados (incluindo B e os três); permanecem lá até **Próxima mão**. CTA **Próxima mão** habilita **na entrada** — MUST NOT esperar a caminhada. MUST NOT contornar as 5 cartas da melhor mão. MUST NOT colar rótulo nas cartas. **Próxima mão** restaura o bolo no centro.

O casco hoje move `para_vencedor` sempre em direção ao herói e o `split` só Você+A, escolhidos por `indiceMaoSessao`. Esta feature torna o destino **autoritativo** a partir de `vencedores`. Acrescentar grupo `data-para="adversarioB"` em `index.html`. Preferência por reduzir movimento: cortar para o estado final; o beat de acerto permanece o da 003.

**Rationale:** Clarifications (não vazar a certa; CTA imediato; perdedores legíveis; sem acender a melhor 5). RN-G005 / RN-G004 / RN-033.

**Alternatives considered:** Destacar durante “quem ganhou” (vaza); escurecer perdedores (cartas ilegíveis); bloquear CTA até as fichas pararem (mesa parece travada).

---

## 8. Testes e cobertura

**Decision:** Estender `tests/contract/motor.test.js` com fixtures das 7 certas de pote e das 10 categorias como certa de ≥1 jogador no river; split herói vs A; kicker não empata; royal no board; wheel vs six-high; wrap; dois flushes; board joga vs alguém que monta melhor que a mesa; `{ ok: false }` em input inválido; RN-031 (6 ids, exclusão da 7ª). Atualizar `quiz.test.js` e `hud-session.test.js`: sem Flush/Par-stub; sem split cego na 2ª mão; cadência; 0 destaque antes de `resultado`; aborto; 0 5.4 no river. Sem Playwright.

**Rationale:** Mesmo padrão 001–005; SC-015 / FR-020. CA-019/020 exigem fixtures explícitas, não o gerador aleatório.

**Alternatives considered:** Só testes manuais (regressão do stub); Playwright (dependência contra o mínimo).

---

## 9. LGPD, idioma, custo, retenção

**Decision:** Motor e quiz desta pergunta **não** persistem cartas, Melhor5, `chaveDesempate`, dump de `quemGanhou`, pool, enunciado, timestamp, stack de erro nem identificador. O único efeito que sobrevive é o delta já definido: três exposições em `mao_atual` (categoria **correta daquele jogador**) e uma em `vencedor_pote`, via `js/storage.js`. Apelidos continuam **Você / Adversário A / Adversário B**. Fail-open da 003 inalterado para storage; falha de comparação **não** é fail-open de mentira no quiz — aborta a mão. Sem backend, sem lib paga, UI pt-BR.

Na implementação (não neste plan), a rule `.cursor/rules/lgpd-sessao-sem-pii.mdc` MUST ser atualizada: contexto 001–006; MUST NOT gravar dump de `quemGanhou`.

**Rationale:** Constitution II/III/VII, workspace LGPD, FR-021/022/024/025.

**Alternatives considered:** Log da comparação para debug (replay/PII); persistir o showdown para “continuar depois do F5” (a mão aborta no reload por contrato do casco).

---

## Registro de escolhas (ambíguo → padrão)

| Tema | Escolha |
|------|---------|
| Branch git | Permanecer em `main`. Identidade Spec Kit: `006-showdown-vencedor`. |
| Módulo | Estender `js/motor.js`. Quiz prepara o showdown; mesa não importa motor. |
| Nome da API | `quemGanhou` + `conjuntoOpcoesVencedor` + `UNIVERSO_POTE`. |
| Comparação | Reusar `chaveDesempate` da 004; naipe fora. |
| Id dos três | `tres` → **Os três empatam**. Demais ids iguais ao stub 003. |
| Momento | Determinar no pouso do river (11 conhecidas). Mostrar 1ª pergunta só após virada **e** `ok`. |
| Execução | Síncrona no thread da UI. Teto de 1 s extra só se ainda `pendente`. Sem Worker. |
| Falha | `{ ok: false }` (não throw na UI) → `ociosa` + **Nova mão**. Não inventar empate. |
| Distratoras categoria | RN-017 da 004 com board = 5 comunitárias. Sem “ainda possível”. |
| RN-031 | Sempre 6; 7ª de menor prioridade fora. Shuffle só no quiz. |
| 5.4 no river | Ausente. `river_hero` → `river_a`. |
| Destaque / fichas | Só em `resultado`. Perdedores não escurecem. CTA imediato. |
| Pote único | Caminha ao assento **real** (não só herói). Grupo B no HTML. |
| Stub | Flush/Par/`indiceMaoSessao` saem. |
| Persistência | Só `mao_atual`×3 + `vencedor_pote`×1. 0 Melhor5/chave. |
| Testes | Estender `motor.test.js`; atualizar quiz/HUD; fixtures 7+10. |
| Relatório / zerar / lib / backend / draws | Ausentes. |
