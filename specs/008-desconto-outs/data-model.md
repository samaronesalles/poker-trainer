# Data Model: Desconto de outs (upgrades vencedores, outs e odd)

**Feature**: `008-desconto-outs`  
**Escopo**: vilão assumido, baralho da próxima carta, lista RN-057, outs RN-061, ranks RN-062, odd RN-065, skip `sem_upgrade` com frase nova, três perguntas da §5.8 e converge de `EvolucaoTreino` com `outs`/`odds`. Sem Pot Odds. Sem river. Sem reabrir a pasta 005.

Substitui o modelo da [005-maos-ainda-possiveis](../005-maos-ainda-possiveis/data-model.md) **como contrato vigente** da §5.4 (aquela pasta permanece histórica). Estende Melhor5 da [004](../004-mao-atual/data-model.md), quiz/retry da [003](../003-feedback-persistencia/data-model.md) e showdown da [006](../006-showdown-vencedor/data-model.md) (hole reais). O snapshot vive **só em memória da visita**; o que sobrevive ao fechar a aba continua sendo **somente** `EvolucaoTreino` (agora cinco buckets).

Tipos abaixo são o contrato lógico; identificadores de código MAY estar em inglês. Rótulos visíveis MUST be pt-BR canônicos.

---

## Enums

### CategoriaId

Os mesmos 10 ids da 003/004/`storage.js` (ordem 1 = mais forte):

`royal_flush` · `straight_flush` · `quadra` · `full_house` · `flush` · `straight` · `trinca` · `dois_pares` · `par` · `carta_alta`

Rótulos visíveis MUST ser exatamente: Royal flush, Straight flush, Quadra, Full house, Flush, Straight, Trinca, Dois pares, Par, Carta alta.

`carta_alta` MUST NEVER ser upgrade vencedor. MAY aparecer só como distratora da 5.4.

### StreetDesconto

`flop` \| `turn`

MUST NOT existir `river` neste modelo.

### RankId

Identidade interna alinhada a `js/baralho.js` `RANKS`:

`A` · `K` · `Q` · `J` · `10` · `9` · `8` · `7` · `6` · `5` · `4` · `3` · `2`

Rótulos visíveis RN-064 (identidade fixa; ordem **visual** embaralhada):

**2**, **3**, **4**, **5**, **6**, **7**, **8**, **9**, **10**, **Valete**, **Dama**, **Rei**, **Ás**

| RankId | Rótulo |
|--------|--------|
| `2`…`10` | o próprio |
| `J` | Valete |
| `Q` | Dama |
| `K` | Rei |
| `A` | Ás |

### NaipeId

`espadas` · `copas` · `ouros` · `paus` — ordem canônica de desempate (primeiro = preferido).

### PassoQuiz (delta vs 005/006)

| Passo | Papel nesta feature |
|-------|---------------------|
| `flop_hero` / `turn_hero` | Inalterados (004). No pouso o quiz **também** prepara `DescontoStreet`. |
| `flop_upgrade` / `turn_upgrade` | **Gabarito novo** (RN-057). Enunciado novo. Acerto abre a §5.8, **não** a próxima street. |
| `flop_skip` / `turn_skip` | Frase nova. 0 §5.8. 0 deltas `upgrade`/`outs`/`odds`. |
| `flop_outs` / `turn_outs` | **Novo.** Seleção única. 1ª tentativa → `outs`. |
| `flop_ranks` / `turn_ranks` | **Novo.** Múltipla seleção, 13 rótulos. 1ª Confirmar → `outs` (exposição independente). |
| `flop_odds` / `turn_odds` | **Novo.** Seleção única X:1. 1ª tentativa → `odds`. Acerto avança a street. |
| `river_*` | Inalterados (006). 0 pergunta de upgrade, outs ou odd. |

### ResultadoDesconto

`ok` \| `falha`

`falha` MUST NOT ser modelada como lista vazia nem como N = 0.

### FraseSuposicaoId

Chave lógica da linha RN-059 (o texto visível é o canônico, sem sinônimo):

| Id | Quando (categoria da melhor 5 **já feita**) | Texto |
|----|---------------------------------------------|-------|
| `par_mais_alto` | `par` | Suponha que o adversário já tem o par mais alto da mesa. |
| `trinca_do_par` | `trinca` | Suponha que o adversário já tem trinca do par da mesa. |
| `straight` | `straight` | Suponha que o adversário já tem Straight. |
| `flush` | `flush` | Suponha que o adversário já tem Flush. |
| `rotulo` | qualquer outra CategoriaId (Full house, Quadra, …) | Suponha que o adversário já tem {rótulo RN-014}. |

A linha segue a categoria feita, **não** o apelido da textura.

---

## Entities

### CartaIdentidade

`{ rank: RankId, naipe: NaipeId }`

MUST ser legal no alfabeto 52. MUST NOT persistir.

### CartasVisiveisHeroi

Reuso da 004. Base da mão atual **e** do complemento do baralho da próxima carta (antes de retirar as assumidas).

| Street | Cartas | Índices RN-044 | Tamanho |
|--------|--------|----------------|---------|
| flop | 2 hole herói + 3 flop | `[4],[5]` + `[6],[7],[8]` | 5 |
| turn | 2 hole herói + 4 comunitárias | `[4],[5]` + `[6]..[9]` | 6 |

MUST NOT incluir holes de A/B (`[0]..[3]`), river `[10]` no flop, nem burns.

### VilaoAssumido

Duas cartas sintéticas da receita pessimista. **Não** são cartas de jogo. **Não** são as hole reais de A/B.

| Campo | Tipo | Regras |
|-------|------|--------|
| `cartas` | CartaIdentidade[2] | Legais: não repetem hole do herói nem o board da street |
| `categoriaFeita` | CategoriaId | Melhor 5 de `cartas + board` **sem** a próxima carta |
| `linhaId` | FraseSuposicaoId | Derivada de `categoriaFeita` |
| `street` | StreetDesconto | A street em que a receita rodou |

Validação: se a receita não montar 2 cartas → `ResultadoDesconto = falha` (não skip).  
No turn, esta entidade é **outra** (receita de novo); MUST NOT reutilizar o par do flop.  
MUST NOT persistir. MUST NOT ocupar slot de hole nem aparecer face-up.

### BaralhoProximaCarta

Cartas ainda elegíveis como o próximo comunitário.

| Campo | Tipo | Regras |
|-------|------|--------|
| `cartas` | CartaIdentidade[] | 52 − hole herói − board aberto − 2 assumidas |
| `street` | StreetDesconto | flop ⇒ cada uma como turn; turn ⇒ cada uma como river |

Tamanho esperado: flop 52−2−3−2 = **45**; turn 52−2−4−2 = **44**.  
Hole reais de A/B que **não** coincidam com as assumidas **permanecem**. Burns **não** retiram.  
MUST NOT mutar o baralho vivo. MUST NOT persistir.

Length fora do esperado → falha da street.

### UpgradeVencedor

Rótulo canônico C para o qual existe ≥1 carta em `BaralhoProximaCarta` tal que, após ela abrir:

1. melhor 5 do herói tem categoria **exatamente C**;
2. C é **estritamente mais forte** que a mão atual;
3. melhor 5 do herói **vence estritamente** a melhor 5 do vilão (2 assumidas + board + essa carta).

Empate hipotético **não** torna C verdadeira. Categoria igual/mais fraca **não** entra. Força só dentro da categoria **não** é chip. `carta_alta` nunca.

### ListaUpgradesVencedores

O conjunto RN-057 da street **antes** do teto de 6. Pode ser vazia. Ordenação canônica forte → fraco.

Vazia ⇒ skip; 0 §5.8; 0 deltas `upgrade`/`outs`/`odds`.

### ConjuntoOpcoesUpgrade

Até 6 `CategoriaId` visíveis. Único conjunto cobrado na 5.4.

| Lista | `ids` | `verdadeiros` |
|-------|-------|----------------|
| 0 | não se monta (skip) | — |
| 1–5 | todos + distratoras até 6 | os upgrades |
| ≥6 | os 6 mais fortes | esses 6 |

Distratora = categoria que **não** é upgrade vencedor **nesta** street, preenchida forte → fraco, sem repetir. Determinístico. Shuffle visual é do quiz.

### Out

Uma `CartaIdentidade` do baralho da próxima carta que, ao abrir, faz o herói vencer estritamente o vilão. Cada carta no máximo uma vez.

### ListaOuts

| Campo | Tipo | Regras |
|-------|------|--------|
| `cartas` | Out[] | N = `cartas.length`; N ≥ 1 quando a 5.8 existe |
| `ranks` | RankId[] | distintos; rank entra se ≥1 out daquele rank |
| `n` | inteiro 1–47 | MUST coincidir com `cartas.length` |

Carta suja (não vence) **não** entra em `cartas`; o rank permanece se restar out limpo.

### OddProximaCarta

| Campo | Tipo | Regras |
|-------|------|--------|
| `n` | inteiro | o N de `ListaOuts` |
| `x` | inteiro ≥ 0 | X de RN-065; 0,5 para baixo |
| `rotulo` | string | exatamente `{x}:1` (ex.: `4:1`) |

N = 4 → 11:1; N = 9 → 5:1; N = 10 → 4:1. Sempre regra do 2. MUST NOT modelar Pot Odds nem regra do 4.

X = 0 (N ≥ 25 pela fórmula) → rótulo **`0:1`**.

### ConjuntoOpcoesQuantidade

6 inteiros distintos em 1–47 incluindo N. Distratoras: N±1, N±2 e {4, 5, 8, 9, 12, 15}, sem repetir; resto = inteiro mais próximo ainda livre.

### ConjuntoOpcoesOdd

6 razões distintas `{x}:1` incluindo a correta. Distratoras: X±1 e {2:1, 3:1, 4:1, 5:1, 9:1, 11:1}, sem repetir.

### ConjuntoOpcoesRanks

Sempre os 13 `RankId`. `verdadeiros` = `ListaOuts.ranks`. Sem teto de 6. Sem “marcar todas”.

### DescontoStreet (snapshot da visita)

Cópia em memória determinada no pouso das comunitárias da street. O turn **substitui** o snapshot do flop.

| Campo | Tipo | Persistir? |
|-------|------|------------|
| `ok` | boolean | não |
| `street` | StreetDesconto | não |
| `categoriaAtual` | CategoriaId | não |
| `vilao` | VilaoAssumido | **não** |
| `baralho` | BaralhoProximaCarta | **não** |
| `lista` | CategoriaId[] | não |
| `conjunto` | ConjuntoOpcoesUpgrade \| null | não |
| `outs` | ListaOuts \| null | **não** (null no skip) |
| `quantidade` | ConjuntoOpcoesQuantidade \| null | não |
| `ranks` | ConjuntoOpcoesRanks \| null | não |
| `odd` | OddProximaCarta \| null | **não** |
| `opcoesOdd` | ConjuntoOpcoesOdd \| null | não |

Se `ok === false`, todos os campos de gabarito são null. MUST NOT fingir `lista: []`.  
MUST NOT copiar este objeto para `localStorage` / `sessionStorage` / cookie / IndexedDB.

### SkipSemUpgrade

Estado HUD `sem_upgrade`. Frase exatamente **“Não há mão que vire o pote.”** + CTA **Continuar**. Não é pergunta. Não gera estatística. Bloqueia a §5.8.

A frase antiga **“Não há upgrade possível.”** MUST NOT ser o copy canônico desta feature.

### PerguntaQuantidade / PerguntaRanks / PerguntaOdd

| Entidade | Modo | Enunciado | Submissão | Bucket |
|----------|------|-----------|-----------|--------|
| Quantidade | única | Quantas outs você tem? | clique | `outs` |
| Ranks | múltipla | Quais ranks são outs? | **Confirmar** | `outs` (exposição nova) |
| Odd | única | Qual é a sua odd? | clique | `odds` |

Feedback herdado: acerto **“Você acertou”**; erro **“Não é essa. Tente de novo.”**.  
Linha de suposição MAY permanecer só leitura. N, ranks e X MUST NOT permanecer como chip após a pergunta seguinte.

### EvolucaoTreino (converge 003)

Memória no dispositivo, chave `poker-trainer:evolucao`.

| Bucket | Forma | Notas |
|--------|-------|-------|
| `mao_atual` | 10 categorias | inalterado |
| `upgrade` | 10 categorias | 1ª Confirmar da 5.4 só das **exibidas** |
| `vencedor_pote` | grupo único | inalterado (006) |
| `outs` | grupo único | quantidade **e** ranks = duas exposições |
| `odds` | grupo único | só a pergunta de odd |

Célula: `{ acertos, erros, exposicoes }` com `exposicoes === acertos + erros` no MVP.

MUST NOT conter cartas, vilão, N, ranks, razão, snapshot, information set, timestamp, `versao` ou PII.

Bloco antigo (três buckets, sem `outs`/`odds`): **legível** — os dois novos = 0; o resto permanece.  
Bloco ilegível: zera os **cinco**.  
Bucket faltando num bloco legível: vale 0 sem zerar o resto.

### FalhaDesconto

`ok: false` ao montar o vilão, ao fechar o baralho da próxima carta, ou ao fechar N/ranks/X. HUD `ociosa` + **Nova mão**. Contadores já gravados nesta visita permanecem. MUST NOT skip falso.

---

## Relationships

```text
CartasVisiveisHeroi ──► sintetiza ──► VilaoAssumido (por street)
CartasVisiveisHeroi + VilaoAssumido ──► BaralhoProximaCarta
Baralho + Vilao + mão atual ──► ListaUpgradesVencedores ──► ConjuntoOpcoesUpgrade
Baralho + Vilao ──► ListaOuts ──► ConjuntoOpcoesQuantidade
                               └──► ConjuntoOpcoesRanks
                               └──► OddProximaCarta ──► ConjuntoOpcoesOdd
Lista vazia ──► SkipSemUpgrade ──x──► §5.8
Lista ≥ 1 + acerto 5.4 ──► PerguntaQuantidade → Ranks → Odd → próxima street
quemGanhou (006) ── usa hole reais; MUST NOT ler VilaoAssumido
EvolucaoTreino ── só contadores; MUST NOT guardar DescontoStreet
```

---

## State transitions

### Street flop/turn (após comunitárias pousadas)

```text
deal ──► flop_hero/turn_hero (5.3)
         │
         ├─ falha DescontoStreet ──► ociosa
         ├─ lista vazia ──► sem_upgrade ──Continuar──► próxima street
         └─ lista ≥ 1 ──► upgrade (5.4)
                            │
                            └─ conjunto exibido acertado ──► outs
                                                             └─ acerto ──► ranks
                                                                           └─ acerto ──► odds
                                                                                         └─ acerto ──► próxima street
```

Retry em qualquer pergunta: permanece no mesmo passo; ordem visual estável; 2ª+ tentativa não muda bucket.

Reload no meio: mão aborta; contadores já gravados permanecem.

### Showdown

Inalterado. `VilaoAssumido` MUST NOT entrar na transição `river_*` nem em `quemGanhou`.

---

## Validation rules (resumo)

1. Assumidas legais e distintas das visíveis do herói + board.
2. Baralho da próxima carta sem assumidas, sem burns subtraídos, com holes A/B se não coincidirem.
3. Testemunha = melhor 5 **após uma carta**; runner-runner não testemunha.
4. Empate com o vilão ≠ out e ≠ upgrade.
5. “Exatamente C”: royal não testemunha Flush nem Straight flush.
6. N ≥ 1 na 5.8; 0 outs só existe se a 5.4 foi skip (e então a 5.8 não abre).
7. Odd só regra do 2; tabela RN-065 é a fonte do gabarito.
8. 1ª tentativa imediata; skip não escreve; flop ≠ turn (CA-048).
9. Snapshot e vilão nunca no disco.
10. As nove categorias Royal flush … Par MUST ser upgrade vencedor em ≥1 fixture; Carta alta em 0.

---

## Fora deste modelo

- Runout de duas cartas / `SnapshotDesconhecido` de 47/46 como contrato vigente (005 histórico).
- Pot Odds, regra do 4, apostas, draws nomeados como entidade de opção.
- Preferência da colinha, chave de overlay, relatório, botão zerar.
- PII, telemetria, dump de `quemGanhou`.
