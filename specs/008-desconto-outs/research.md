# Research: Desconto de outs (008)

**Feature**: `008-desconto-outs`  
**Date**: 2026-09-13  
**Sources**: [spec.md](./spec.md), [constitution v1.1.0](../../.specify/memory/constitution.md), [CR-002](../../docs/changes/CR-002.md), [ADR-002](../../docs/adr/ADR-002-persistencia-localstorage.md), [ADR-003](../../docs/adr/ADR-003-motor-avaliacao-maos.md), [PRD §5.4 / §5.8](../../docs/prd.md), [outs-and-odds.md](../../docs/studies/outs-and-odds.md) (só desconto + regra do 2), código vigente (`js/motor.js`, `js/quiz.js`, `js/storage.js`, `js/mesa.js`), contratos históricos `005` (invalidado) e `003`/`006` (reuso).

Nenhum item do Technical Context ficou em `NEEDS CLARIFICATION`. Clarificações da spec (sessões 2026-09-13) já fecharam vilão por street, naipe, frase Full house/Quadra, N não permanece no HUD e ranks sem cobrir o feltro.

---

## 1. Substituir o enumerador 005 (runout de duas cartas) pela próxima carta + vilão

**Decision**: Invalidar o contrato de `enumerarUpgrades` da 005. A função pública de street passa a: (1) sintetizar o vilão assumido no **board atual**; (2) montar o baralho da próxima carta (52 − 2 hole do herói − comunitárias abertas − 2 assumidas); (3) para **cada** restante, avaliar a melhor 5 do herói e a do vilão **com essa única carta**; (4) C é upgrade se existe ≥1 carta cuja melhor 5 do herói é **exatamente C**, C > atual e herói **vence estritamente**. Flop: cada restante = turn hipotético. Turn: cada restante = river. Runner-runner **não** conta.

**Rationale**: CR-002 e o estudo pedagógico pedem desconto de outs, não “ainda possível”. C(47,2) no flop treinava duas cartas e não descontava o adversário. O espaço da próxima carta é ~45 avaliações — menor e alinhado à regra do 2.

**Alternatives considered**:
- Manter C(47,2) e só filtrar o pote no runout de duas cartas — viola RN-069 e a regra do 2 (sempre a próxima carta).
- Lib de poker + wrapper — ADR-003 já recusou; RN-055/057/061 continuariam nossos.
- Worker / WASM — custo, bundler e complexidade contra constitution III/VI.

---

## 2. Receita do vilão assumido (RN-055) remonta em cada street

**Decision**: `sintetizarVilaoAssumido({ holeHeroi, comunitarias })` roda **no pouso** das comunitárias da street. O flop MUST NOT congelar as 2 assumidas até o showdown. “Um único vilão abstrato” = um oponente sintético (não A e B), não cartas imutáveis. Texturas tentadas na ordem de força da melhor 5 **já feita** (2 assumidas + board, sem a próxima carta). Se uma textura não monta com 2 cartas livres, descarta e tenta a seguinte. Empate de naipe no mesmo rank: **espadas**, **copas**, **ouros**, **paus**. Kicker = maior rank ainda livre (Ás se couber).

Texturas (PRD):
- 3+ do mesmo naipe → Flush (dois ranks mais altos daquele naipe ainda livres).
- 4 ranks únicos em sequência (wheel A-2-3-4 ok; wrap K-A-2-3 proibido) → Straight (cartas que completam a sequência mais alta; se só uma falta, a segunda é o melhor kicker).
- Board pareado → uma do par mais alto + melhor kicker (dois pares na mesa: par de rank maior). A **linha** segue a categoria da melhor 5 já feita: Trinca usa a frase de trinca; Full house/Quadra usam **“Suponha que o adversário já tem {rótulo}.”**.
- Senão → par mais alto da mesa (maior rank do board + melhor kicker).

**Rationale**: Clarification session 1 (vilão por street, naipe canônico, frase pela categoria feita). Determinístico; não escolhe naipe para “sujar” mais outs.

**Alternatives considered**:
- Congelar o vilão do flop até o river — rejeitado na clarify (o board de 4 muda a receita).
- Usar hole reais de A ou B — vazaria informação e violaria “um vilão abstrato”.
- Range probabilístico — fora do MVP e da receita fixa.
- Escolher o naipe que mais desconta outs — não determinístico; a spec fixou a ordem do baralho.

---

## 3. API do motor: um snapshot de street, helpers puros

**Decision**: Estender `js/motor.js` sem módulo novo. Superfície pública desta feature:

| Função | Papel |
|--------|--------|
| `sintetizarVilaoAssumido({ holeHeroi, comunitarias })` | 2 cartas + categoria feita + id da linha RN-059. `{ ok: false }` se não montar. |
| `baralhoProximaCarta({ holeHeroi, comunitarias, assumidas })` | Complemento RN-056. |
| `avaliarDescontoStreet({ holeHeroi, comunitarias })` | Snapshot completo: vilão, upgrades vencedores, outs, ranks, N, X. Uma chamada no pouso. |
| `conjuntoOpcoesUpgrade({ upgrades })` | Reuso do teto 6 (RN-023); entrada agora é RN-057. |
| `conjuntoOpcoesQuantidade({ n })` | 6 inteiros 1–47 incluindo N (RN-063). |
| `conjuntoOpcoesOdd({ x })` | 6 razões X:1 incluindo a correta (RN-066). |
| `oddDaProximaCarta(n)` | X inteiro da tabela/fórmula RN-065. |
| `avaliarMelhor5` / `quemGanhou` | Intocados na semântica. |

`enumerarUpgrades` da 005 **deixa de ser o contrato**. Implementação MAY mantê-lo como wrapper fino que delega a `avaliarDescontoStreet` e devolve só `{ ok, categoriaAtual, upgrades }` **já descontados**, ou removê-lo dos testes 005 — o contrato vigente passa a ser o desta pasta. MUST NOT devolver cartas, `chaveDesempate` ou dump no objeto que o quiz persiste (o quiz só guarda o snapshot em `sessao.mao`, memória).

`snapshotDesconhecido(visiveis)` MAY permanecer como helper interno do complemento 52 − visíveis; o baralho da próxima carta **ainda** subtrai as 2 assumidas.

**Rationale**: Um prepare no pouso atende FR-034 (lista e gabarito prontos quando as comunitárias pousam). Helpers isolam CA-033/040/044. `quemGanhou` não recebe assumidas.

**Alternatives considered**:
- Dois módulos `js/vilao.js` + `js/outs.js` — ADR-006 reserva `motor`; YAGNI.
- Quiz calcular odd — a fórmula é domínio; o motor é a fonte única (ADR-003).
- Reusar `enumerarUpgrades` sem mudar a assinatura e filtrar depois no quiz — o quiz importaria lógica de pote; viola a fronteira mesa/quiz/motor.

---

## 4. Outs limpas, ranks e odd (regra do 2)

**Decision**:
- Carta é **out** iff, ao abri-la, melhor 5 do herói **vence estritamente** a melhor 5 do vilão (2 assumidas + board + essa carta). Empate ≠ out. Carta que só “melhora” sem virar o pote ≠ out. Cada identidade conta no máximo uma vez.
- Rank é verdadeiro se ≥1 out daquele rank (2 de 4 Valetes limpos → N inclui 2; **Valete** verdadeiro).
- Ranks que só sobem a força **dentro** da categoria entram na 5.8 se a carta for out (RN-074); **não** são chip na 5.4 (RN-046).
- N ≥ 1 quando a 5.8 abre (lista 5.4 não vazia ⇒ existe ≥1 carta que vence). MUST NOT inventar N = 0.
- Odd: P = min(2 × N, 100)%; X = 50/N − 1; X inteiro, 0,5 para baixo. Tabela canônica RN-065 (N=4 → 11:1; N=9 → 5:1; N=10 → 4:1). Sempre regra do **2**, flop e turn. N > 20 usa a mesma fórmula.
- Distratoras quantidade: N±1, N±2 e {4,5,8,9,12,15}, sem repetir, resto = inteiro mais próximo ainda livre em 1–47.
- Distratoras odd: X±1 e {2:1, 3:1, 4:1, 5:1, 9:1, 11:1}, sem repetir.

**Rationale**: Estudo pedagógico (desconto + regra do 2) + PRD RN-061..066. Pot Odds e regra do 4 do mesmo estudo estão **fora** (constitution IV).

**Alternatives considered**:
- Regra do 4 no flop — constitution 1.1.0 e RN-065 vetam.
- Cobrar Pot Odds / call-fold — escopo negativo.
- Recortar ranks aos 6 mais frequentes — spec fixou os 13.
- Chip de “par melhor” na 5.4 — RN-046 reiterado; só 5.8.

---

## 5. Cadência HUD: 5.4 acertada abre §5.8, não a próxima street

**Decision**: Novos `PASSOS` em `quiz.js` / `mesa.js`:

| Após | Abre |
|------|------|
| `flop_hero` acertado | `flop_upgrade` **ou** `flop_skip` (como hoje, gabarito novo) |
| `flop_upgrade` acertado | `flop_outs` → `flop_ranks` → `flop_odds` → turn |
| `flop_skip` Continuar | turn (**sem** 5.8) |
| `turn_hero` acertado | `turn_upgrade` **ou** `turn_skip` |
| `turn_upgrade` acertado | `turn_outs` → `turn_ranks` → `turn_odds` → river |
| `turn_skip` Continuar | river (**sem** 5.8) |
| river | showdown 006; 0 passos de upgrade/outs/odd |

Copy canônica: enunciado 5.4 **“Quais mãos melhoram o seu jogo com chance de ganhar o pote?”**; skip **“Não há mão que vire o pote.”**; quantidade / ranks / odd conforme FR-019..021. A linha RN-059 **permanece** só leitura na 5.8. Cada pergunta nova **substitui** enunciado e opções; N MUST NOT virar chip.

`prepararUpgradesStreet` passa a gravar o snapshot completo (`vilao`, `upgrades`, `outs`, `n`, `ranks`, `odd`) em `sessao.mao` no pouso da 5.3 (já ocorre hoje ao apresentar `flop_hero`/`turn_hero`). O turn **substitui** o snapshot do flop.

**Rationale**: RN-G002 emendado + RN-068. Reusa seleção única/múltipla da 003.

**Alternatives considered**:
- Abrir a street no acerto da 5.4 (código atual de `mesa.js`) — viola RN-068.
- Empilhar N visível enquanto ranks abre — clarification session 1 recusou.
- Um único passo “5.8” com três grades na mesma tela — viola RN-G001.

---

## 6. Converge de storage (003): cinco buckets, bloco antigo legível

**Decision**: `evolucaoZerada()` passa a incluir `outs` e `odds` como células `{ acertos, erros, exposicoes }` (grupo único, igual `vencedor_pote`). `aplicarDeltas` aceita `{ bucket: 'outs' | 'odds', acertos?, erros? }` sem `categoria`. Leitura: bucket ausente num bloco que já tem algum dos cinco (ou dos três históricos) reconhecível = 0, **não** zera o resto. Bloco ilegível (parse falha, não-objeto, nenhum bucket reconhecível) → zera os **cinco**. Chaves extras ignora. Escrita após esta feature sempre serializa os cinco. Sem chave nova. Sem `clear()` na UI.

Exposições: quantidade e ranks = **duas** escritas independentes em `outs`. Odd escreve só `odds`. Flop e turn da mesma mão = exposições independentes (CA-048). Skip = 0 deltas nesses buckets.

**Rationale**: Constitution II 1.1.0, ADR-002 emendado, FR-029, escolha autônoma da spec (bloco de 3 é incompleto, não corrupção).

**Alternatives considered**:
- Chave `poker-trainer:outs` — viola “mesma chave” e CA-032.
- Dez categorias de rank em `outs` — RN-067 é grupo único.
- Tratar JSON antigo como corrupto — apagaria `mao_atual`/`upgrade` do treinando; a spec proíbe.

---

## 7. Fronteiras de módulo, LGPD e showdown

**Decision**:
- `mesa.js` MUST NOT importar `motor.js` nem chamar `localStorage`. Só reage a decisão do quiz (`pergunta` / `skip` / `falha`) e aos novos passos.
- `quiz.js` é o único escritor (`aplicarDeltas`). Snapshot vive em `sessao.mao`; MUST NOT ir para o JSON.
- `motor.js` MUST NOT persistir, MUST NOT importar quiz/mesa/storage, MUST NOT mutar o baralho vivo.
- `colinha.js` intocado; CA-032 atualizado só no critério desta spec (cinco buckets na mesma chave).
- `quemGanhou({ holeVoce, holeA, holeB, comunitarias })` **não** ganha parâmetro de vilão. Assumidas MUST NOT ocupar `[0]..[3]`.
- Falha ao montar vilão ou fechar N/ranks/X → `{ ok: false }` → HUD `ociosa` + **Nova mão**. MUST NOT fingir skip nem N = 0.

**Rationale**: Regras LGPD da sessão, ADR-006, feature 006, FR-033/035/036.

**Alternatives considered**:
- Mostrar as 2 assumidas face-up “para pedagogia” — CA-038 / RN-071.
- Persistir o snapshot para retomar após reload — reload aborta a mão; persistir vilão/outs viola LGPD.

---

## 8. Layout dos 13 ranks e desktop-first

**Decision**: Quantidade e odd reusam a grade de 6 (2×3 / 3×2). Ranks: faixa compacta no HUD, quebra em duas ou três linhas, **não** forçar 2×3. Em todo viewport MUST NOT cobrir comunitárias, hole do herói nem assentos. No estreito o HUD já empilha abaixo (constitution VI / feature 001). `css/hud.css` ganha a faixa; `layout.js` só muda se um teste de cobertura precisar de métrica. Cinco estados do HUD **não** aumentam (`perguntando` cabe os 13).

**Rationale**: Clarification session 1 (viewport) + FR-044 + SC-031.

**Alternatives considered**:
- Overlay flutuante sobre o feltro no estreito — cobre cartas.
- Scroll horizontal único dos 13 — pior no tablet; a spec pede quebra em linhas.

---

## 9. Estudo pedagógico: o que entra e o que fica fora

**Decision**: De [docs/studies/outs-and-odds.md](../../docs/studies/outs-and-odds.md) esta feature implementa **somente** (a) desconto de outs (carta que também fortalece o vilão não conta) e (b) regra do **2** convertida em X:1. **Fora**: Pot Odds, regra do 4, all-in flop→river, rótulos `flush draw` / `gutshot` / `OESD` / `overcards`, decisão call/fold, EV.

**Rationale**: Constitution IV 1.1.0 e CR-002 item 9.

**Alternatives considered**: Incluir Pot Odds “porque o estudo tem” — exigiria emenda de constitution e apostas, ambas vetadas.

---

## 10. Testes e fixtures

**Decision**: `tests/contract/motor.test.js` substitui os casos 005 (47/46, testemunha das 7, “adversário não desconta”) por CA-033 (K♣ Q♦ / 10♠ 9♦ 5♣ → Par+Straight, N=10, ranks Rei/Dama/Valete, odd 4:1), CA-034, CA-039, CA-044, CA-045, receita por textura, naipe canônico, remount no turn, `carta_alta` nunca upgrade, as 9 categorias vencedoras em ≥1 fixture. `quiz.test.js` + `hud-session.test.js` cobrem copy, skip, cadência 5.8, river sem 5.8. `storage.test.js` cobre cinco buckets e bloco de 3 legível. Sem E2E de browser no MVP; quickstart é validação manual `http://`.

**Rationale**: Contratos da 005 deixam de ser fonte; a 008 herda o estilo `node --test` já vigente.

**Alternatives considered**: Playwright — fora do stack (sem bundler, constitution III).

---

## Escolhas registradas (ambíguo → padrão)

| Tópico | Escolha | Por quê |
|--------|---------|---------|
| Branch Git | Permanece `feature/issue-4`; identidade Spec Kit `008-desconto-outs` | Spec + pedido do orquestrador; setup-plan reportou a identidade 008 |
| Pasta 005 | Intocada | CR-002: contrato invalidado, não reabrir |
| Módulos | Estender `motor` / `quiz` / `storage` / `mesa` / `hud.css` | ADR-006; sem módulo novo |
| API de street | `avaliarDescontoStreet` no pouso | FR-034; um snapshot por street |
| `enumerarUpgrades` | Contrato 005 morto; implementação MAY delegar ou sumir dos testes | Evita dois gabaritos |
| Vilão no turn | Receita de novo no board de 4 | Clarify Q1 |
| Naipe | espadas → copas → ouros → paus | Clarify Q2 + `baralho.js` |
| Linha pareada | Categoria da melhor 5 já feita | Clarify Q3 |
| N no HUD da 5.8 | Não permanece | Clarify Q4 |
| Ranks no estreito | Quebra no HUD empilhado | Clarify Q5 |
| Storage antigo | Incompleto: `outs`/`odds` = 0 | Spec / FR-029 |
| Odd N>20 | Mesma fórmula | RN-065 |
| Falha | `ociosa` + Nova mão | FR-033; skip falso treina a lição errada |
| Persistência do snapshot | Proibida | LGPD / RN-071 |
| Pot Odds / regra do 4 | Fora | Constitution IV |
| Commit | Este comando **não** commita | Orquestrador commita após o gate |
