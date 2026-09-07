# Data Model: Embaralhamento e distribuição das cartas

**Feature**: `002-embaralhamento-deal`  
**Escopo**: baralho permutado em memória, mapeamento RN-044 e revelação por street. Sem motor de melhor-5. Sem `localStorage`. Sem entidades de evolução (`mao_atual`, `upgrade`, `vencedor_pote` — feature 003).

Estende o modelo da [001-mesa-imersiva](../001-mesa-imersiva/data-model.md): HUD, Assento, Board, PoteCenico e cadência stub **permanecem**. O que muda é a origem das 11 cartas e o momento em que o HUD entra em `deal`.

Tipos abaixo são o contrato lógico; identificadores de código MAY estar em inglês.

---

## Enums

### Rank

`A` | `K` | `Q` | `J` | `10` | `9` | `8` | `7` | `6` | `5` | `4` | `3` | `2`

### Naipe

`copas` | `ouros` | `espadas` | `paus`

Copas/ouros = vermelho; espadas/paus = preto (ADR-005). Sem coringa.

### IdentidadeCarta

Par `(rank, naipe)`. Unique no baralho de 52. Chave canônica sugerida: `` `${rank}-${naipe}` ``.

### ResultadoMontagem

`ok` | `incompleto` | `duplicata` | `mapeamento_impossivel`

Ausência de `crypto.getRandomValues` **não** é um valor deste enum — o shuffle segue com o pool.

### PapelCarta

`hole` | `comunitaria` | `restante` | `burn_cenico`

`burn_cenico` **não** pertence à permutação de 52.

Os enums da 001 (`HudEstado`, `Street`, `VisibilidadeCarta`, `PassoQuizStub`) **não mudam**. Não existe sexto `HudEstado`.

---

## Entities

### CartaPadrao

Uma carta do baralho francês.

| Campo | Tipo | Regras |
|-------|------|--------|
| `rank` | Rank | Obrigatório |
| `naipe` | Naipe | Obrigatório |

**Validação:** 13×4 = 52 identidades distintas. MUST NOT coringa, MUST NOT Unicode de baralho como identidade.

### BaralhoPadrao

Conjunto fechado e **ordenado de fábrica** (antes do shuffle). Ordem canônica recomendada para testes: naipes `espadas`, `copas`, `ouros`, `paus`; em cada naipe `A,K,Q,J,10,…,2`. A ordem de fábrica **não** é a ordem da mão.

### PermutacaoRodada

| Campo | Tipo | Regras |
|-------|------|--------|
| `cartas` | CartaPadrao[52] | Permutação Fisher–Yates do baralho padrão |
| `geradaEm` | número (tick) | Só em memória; MUST NOT persistir |

**Invariantes:**

- `cartas.length === 52`
- 52 identidades distintas
- Uma instância por mão; MUST NOT mutar após o deal começar
- Streets **não** geram nova permutação

### MapeamentoRodada (RN-044)

Visão **derivada** de `PermutacaoRodada.cartas` — não é um segundo sorteio.

| Posições | Campo lógico | Destino visual |
|----------|--------------|----------------|
| `[0]`, `[1]` | `adversarioA` | Hole de Adversário A |
| `[2]`, `[3]` | `adversarioB` | Hole de Adversário B |
| `[4]`, `[5]` | `voce` | Hole de Você |
| `[6]`, `[7]`, `[8]` | `flop` | Slots 1–3 |
| `[9]` | `turn` | Slot 4 |
| `[10]` | `river` | Slot 5 |
| `[11]…[51]` | `restante` | Fora da mesa nesta mão |

**Validação:** as 11 primeiras posições são 11 identidades distintas. `restante` tem 41 cartas e MUST NOT aparecer como hole nem comunitária.

Dentro do assento, índice par = esquerda e ímpar = direita (escolha padrão); o produto exige só a atribuição de **quem** recebe **quais**.

### CartaDeJogo

Estende a `Carta` da 001 com identidade real da permutação.

| Campo | Tipo | Regras |
|-------|------|--------|
| `idVisual` | string | Componente DOM |
| `rank` | Rank | Nunca null nas 11 de jogo |
| `naipe` | Naipe | Nunca null nas 11 de jogo |
| `indicePermutacao` | 0..10 | Índice RN-044 |
| `visibilidade` | `vazia` \| `verso` \| `face` | Ver revelação |
| `papel` | `hole` \| `comunitaria` | Nunca `restante` na mesa |
| `animando` | boolean | HUD `deal` enquanto `true` |

**Revelação:**

| Momento | Cartas | Visibilidade |
|---------|--------|----------------|
| Antes do deal daquele assento/slot | comunitárias; holes ainda não dadas | slot `vazia` (sem elemento de carta) |
| Deal hole A/B pousado | `[0]…[3]` | `verso` |
| Deal hole Você pousado | `[4]`, `[5]` | `face` |
| Street flop | `[6][7][8]` nos slots 1–3 | `face` |
| Street turn | `[9]` no slot 4 | `face`; flop inalterado |
| Street river | `[10]` no slot 5 | `face`; flop/turn inalterados |
| Showdown | `[0]…[3]` | passam a `face` — **as mesmas** identidades |

MUST NOT ocupar slot comunitário com verso antecipado.

### BurnCenico

| Campo | Tipo | Regras |
|-------|------|--------|
| `papel` | `burn_cenico` | Único valor |
| `visibilidade` | `verso` | Sem rank/naipe |
| `consomeCarta` | `false` | Sempre |

Não é elemento de `PermutacaoRodada`. MUST NOT usar `[11]` nem criar 12ª carta de jogo.

### MisturaVisita

| Campo | Tipo | Regras |
|-------|------|--------|
| `buffer` | bytes compactos (ex. 32) | XOR+rotate; **não** é lista de pontos |
| `origem` | memória da visita | Recarregar zera |

**MUST NOT:** histórico de `clientX/Y`, log, `localStorage`, cookies, envio a servidor.

Atualização: `pointermove` mistura e descarta coordenadas; montagem mistura `Date.now()` + tick.

### ResultadoMontagemBaralho

| Campo | Tipo | Regras |
|-------|------|--------|
| `status` | ResultadoMontagem | |
| `permutacao` | PermutacaoRodada \| null | `null` se não `ok` |
| `cartasJogo` | CartaDeJogo[11] \| null | Derivado RN-044 se `ok` |

`ok` ⇔ 52 distintas ∧ mapeamento possível. Crypto ausente + pool ⇒ ainda pode ser `ok`.

### Mesa (deltas vs. 001)

Campos novos / alterados:

| Campo | Tipo | Regras |
|-------|------|--------|
| `misturaVisita` | MisturaVisita | Uma por carga da página |
| `montagemEmCurso` | boolean | `true` só enquanto embaralha; HUD permanece `ociosa`; **não** é estado de HUD |
| `hud.linhaErro` | string \| null | Se setada em `ociosa`: exatamente `Não foi possível embaralhar. Tente de novo.` Substitui `linhaProposito` até montagem OK ou reload |

`mao` continua `null` em `ociosa`. `INICIAR_MAO` / `PROXIMA_MAO` **só** materializam `mao` após `status = ok`.

### MaoTreino (deltas vs. 001)

| Campo | Tipo | Regras |
|-------|------|--------|
| `permutacao` | PermutacaoRodada | Congelada no início da mão |
| `cartasJogo` | CartaDeJogo[11] | **Não** é stub; índices = RN-044 |
| `street` | Street | Igual 001 |
| `passo` | PassoQuizStub \| null | Quiz stub inalterado |
| `cartasDaStreetPousadas` | boolean | Igual 001 |
| `viradaShowdownConcluida` | boolean | Virar A/B **não** troca identidades |
| `falhaDeal` | boolean | Só após já ter entrado em `deal` (exceção de animação). Falha de **montagem** não usa este flag — `mao` permanece `null` |

Reload destrói `MaoTreino` **e** `MisturaVisita`. MUST NOT pedir dado pessoal para retomar.

---

## State transitions — montagem e deal

A FSM de quiz da 001 permanece. Transições **novas/alteradas**:

```text
ociosa --> ociosa              # Nova mão ignorada se montagemEmCurso
ociosa --> ociosa              # montagem falhou: linhaErro + CTA Nova mão
                               # (nunca passou por deal)
ociosa --> deal                # montagem ok (Nova mão)
resultado --> ociosa(visual)   # Próxima mão: recolher até feltro limpo
                               # (HUD ainda resultado até permutação ok;
                               #  orquestração: limpar feltro ANTES do shuffle)
resultado --> deal             # feltro limpo + montagem ok
deal --> deal                  # holes A→B→Você; depois flop/turn/river do casco
deal --> perguntando           # igual 001 (flop/turn/river+virada)
deal --> ociosa                # FALHA_DEAL (exceção pós-deal, casco)
```

**Proibido:**

- `ociosa → deal → ociosa` por falha de montagem
- novo shuffle em `CONTINUAR` / avanço de street
- `perguntando` com board vazio / preflop
- sexto `HudEstado`

---

## Relationships

```text
Visita 1 -- 1 MisturaVisita
Mesa 1 -- 0..1 MaoTreino
MaoTreino 1 -- 1 PermutacaoRodada
PermutacaoRodada 1 -- 52 CartaPadrao
PermutacaoRodada 1 -- 1 MapeamentoRodada   # visão
MapeamentoRodada 1 -- 11 CartaDeJogo
MapeamentoRodada 1 -- 41 restante (não renderizado)
Assento.adversarioA.hole = cartas[0], cartas[1]
Assento.adversarioB.hole = cartas[2], cartas[3]
Assento.voce.hole        = cartas[4], cartas[5]
Board.slots[1..3]        = cartas[6..8]    # só na street flop
Board.slots[4]           = cartas[9]       # só na street turn
Board.slots[5]           = cartas[10]      # só na street river
Board.burnVisivel        = BurnCenico | null   # sem FK para permutação
```

---

## Persistence

Nenhuma. Sem schema JSON. Sem chaves de evolução. Pool e permutação morrem no reload.

Feature 003 poderá gravar só contadores no `localStorage` (ADR-002), fail-open — **não** baralho, **não** cursor, **não** PII.

---

## Validation rules (resumo testável)

1. 52 identidades francesas; 0 coringas; 0 duplicatas na permutação.
2. 11 de jogo = `[0]…[10]`; 41 restantes invisíveis.
3. Herói face após deal; A/B verso até showdown; showdown usa as mesmas `[0]…[3]`.
4. Slots comunitários vazios até a street correspondente.
5. Avançar street não altera cartas já visíveis nem gera nova permutação.
6. Burn sem rank e fora dos 5 slots.
7. Gerador não filtra empates de pote.
8. Crypto ausente ⇒ montagem ainda pode `ok`.
9. Montagem `!ok` ⇒ `mao = null`, HUD `ociosa`, copy de erro, sem ter sido `deal`.
10. Zero PII; zero `localStorage` nesta feature; mistura sem histórico de coordenadas.
11. `CARTAS_JOGO_STUB` não é fonte das 11.
