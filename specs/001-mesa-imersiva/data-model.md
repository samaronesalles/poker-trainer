# Data Model: Mesa imersiva e sessão de treino

**Feature**: `001-mesa-imersiva`  
**Escopo**: estado **em memória** da sessão visual. Sem persistência. Sem entidades de evolução (`mao_atual`, `upgrade`, `vencedor_pote` — feature 003). Sem baralho permutado RN-044 (feature 002). Sem avaliação de melhor-5 (features 004–006).

Tipos abaixo são o contrato lógico; identificadores de código MAY estar em inglês.

---

## Enums

### HudEstado

`ociosa` | `deal` | `perguntando` | `sem_upgrade` | `resultado`

Não existe sexto estado. `deal` cobre: voo das hole cards, voo de flop/turn/river, burn cênico, e virada das hole cards de A e B no showdown.

### Street

`nenhuma` | `preflop` | `flop` | `turn` | `river`

- `nenhuma`: mesa ociosa ou após abort (reload).
- `preflop`: hole cards em deal ou já pousadas com board vazio — **sem quiz**.
- `flop` / `turn` / `river`: street da cadência (cartas da street + quiz associado).

### VisibilidadeCarta

`vazia` | `verso` | `face`

### PassoQuizStub

Identifica qual pergunta (ou skip) o HUD está tratando:

| Passo | Street | HudEstado alvo após pouso | Enunciado / copy |
|-------|--------|---------------------------|------------------|
| `flop_hero` | flop | `perguntando` | Qual mão você tem agora? |
| `flop_skip` | flop | `sem_upgrade` | Não há upgrade possível. |
| `turn_hero` | turn | `perguntando` | Qual mão você tem agora? |
| `turn_skip` | turn | `sem_upgrade` | Não há upgrade possível. |
| `river_hero` | river | `perguntando` | Qual mão você tem agora? |
| `river_a` | river | `perguntando` | Qual mão o Adversário A completou? |
| `river_b` | river | `perguntando` | Qual mão o Adversário B completou? |
| `river_vencedor` | river | `perguntando` | Quem ganhou o pote? |

`resultado` não é um passo de pergunta; ocorre após acerto de `river_vencedor`.

### TipoOpcao

`categoria` | `vencedor`

### EstadoOpcaoVisual

`padrao` | `hover` | `foco` | `selecionado` | `correto` | `errado_desabilitado`

Nesta feature não há multi-select; `selecionado` é transitório no clique.

---

## Entities

### Mesa

Palco único. Não há lobby nem segunda rota.

| Campo | Tipo | Regras |
|-------|------|--------|
| `hud` | HUD | Obrigatório; um por mesa |
| `assentos` | Assento[3] | Sempre Você, Adversário A, Adversário B; sem vazio |
| `board` | Board | Cinco slots fixos |
| `pote` | PoteCenico | Sem valor em bb |
| `mao` | MaoTreino \| null | `null` em `ociosa` |
| `indiceMaoSessao` | number ≥ 0 | 0 ociosa; incrementa a cada **Nova mão** / **Próxima mão** bem-sucedida. Reload zera. Define teto de animação (1ª mão = 2 s; demais ≈ 1 s) |
| `movimentoReduzido` | boolean | Derivado de `prefers-reduced-motion` no início da street |

**Validação:** MUST NOT existir dealer button funcional, timer, blinds, fold, chat, mute, relatório, campo de nome.

### HUD

| Campo | Tipo | Regras |
|-------|------|--------|
| `estado` | HudEstado | Exatamente um |
| `enunciado` | string \| null | Só em `perguntando`; copy da tabela PassoQuizStub |
| `linhaProposito` | string \| null | Só em `ociosa`: exatamente `Treine ler as mãos. Sem apostas.` |
| `opcoes` | OpcaoQuiz[] | 0 em `ociosa`/`deal`/`sem_upgrade`/`resultado`; até 6 em `perguntando` (nesta feature: exatamente 6) |
| `cta` | CtaSessao \| null | Ver entidade CTA |
| `feedback` | `acerto` \| `erro` \| null | Texto associado: `Você acertou` / `Não é essa. Tente de novo.` Nunca revela a certa |
| `categoriasIdentificadas` | { voce, adversarioA, adversarioB } | Preenchido no `resultado` com os rótulos que o stub considerou “já identificados” (os acertados nos passos de categoria do river). Sem kicker |

**Invariantes:**

- Uma pergunta por vez (RN-G001).
- Opções clicáveis só em `perguntando` e só após pouso da street (e da virada no river).
- `deal` ⇒ `opcoes.length === 0` e nenhum CTA de sessão visível.

### Assento

| Campo | Tipo | Regras |
|-------|------|--------|
| `id` | `voce` \| `adversarioA` \| `adversarioB` | Estável |
| `apelido` | string | Exatamente `Você` / `Adversário A` / `Adversário B` |
| `avatar` | ilustração de produto | MUST NOT foto real; MUST NOT upload do usuário |
| `stackCenario` | visual | Decorativo |
| `hole` | Carta[2] | Sempre dois slots |

**Visibilidade das hole cards:**

- Após pouso do deal: `voce` → `face`; A e B → `verso`.
- Flop e turn: A e B permanecem `verso`.
- Após virada de showdown: os três → `face`.
- `ociosa` / recolhimento: slots `vazia` (ou recolhidos).

Herói é visualmente o player (maior, mais perto, HUD ancorado).

### Carta

| Campo | Tipo | Regras |
|-------|------|--------|
| `idVisual` | string | Identificador do componente DOM |
| `rank` | `A`\|`K`\|`Q`\|`J`\|`10`\|`9`…`2` \| null | `null` se `vazia` ou só verso teatral de burn |
| `naipe` | `copas`\|`ouros`\|`espadas`\|`paus` \| null | SVG vermelho (copas/ouros) ou preto |
| `visibilidade` | VisibilidadeCarta | |
| `papel` | `hole` \| `comunitaria` \| `burn_cenico` | Burn NÃO é carta de jogo |
| `animando` | boolean | `true` enquanto voa/vira; HUD permanece `deal` |

**Validação:** face clássica; um verso único para fechadas; sem emoji/Unicode de baralho como face principal.

**Stub desta feature:** 11 cartas de jogo distintas na mão (6 hole + 5 board). Burn, se visível, é um 12º verso teatral sem rank.

### Board

| Campo | Tipo | Regras |
|-------|------|--------|
| `slots` | SlotComunitaria[5] | Índices 1–3 flop, 4 turn, 5 river |
| `burnVisivel` | Carta \| null | Só verso; nunca em `slots` |

Slots futuros permanecem visíveis e `vazia`.

### SlotComunitaria

| Campo | Tipo | Regras |
|-------|------|--------|
| `indice` | 1..5 | Fixo |
| `carta` | Carta \| null | `null` = vazio visível |

### PoteCenico

| Campo | Tipo | Regras |
|-------|------|--------|
| `modo` | `centro` \| `para_vencedor` \| `split` | Sem contas, sem bb |
| `vencedoresVisuais` | Assento.id[] | 1 em pote único; 2 ou 3 em split |

No `resultado`, se o stub do vencedor for empate, `modo = split` e o bolo divide-se visualmente.

### MaoTreino

Ciclo desde o gesto de início até `resultado` ou abort por reload.

| Campo | Tipo | Regras |
|-------|------|--------|
| `cartasJogo` | Carta[11] | Stub distinto; **não** é a permutação ADR-004 |
| `street` | Street | |
| `passo` | PassoQuizStub \| null | `null` durante deal/preflop |
| `cartasDaStreetPousadas` | boolean | Quiz só se `true` (e virada concluída no river) |
| `viradaShowdownConcluida` | boolean | River: pergunta 1 só se `true` |
| `falhaDeal` | boolean | Se `true`, transição para `ociosa` |

Reload destrói esta entidade; MUST NOT pedir dado pessoal para retomar.

### OpcaoQuiz

| Campo | Tipo | Regras |
|-------|------|--------|
| `id` | string | Estável na pergunta |
| `rotulo` | string | Categoria = RN-014 exato; vencedor = RN-030 exato |
| `tipo` | TipoOpcao | |
| `correta` | boolean | Exatamente uma `true` por pergunta no stub |
| `estadoVisual` | EstadoOpcaoVisual | |
| `desabilitada` | boolean | Clique em desabilitada ignora |

**Validação:** ordem visual embaralhada a cada abertura (RN-G008). MUST NOT texto de kicker, “par de ases”, draws, ou “a resposta era X”.

### CtaSessao

| Campo | Tipo | Regras |
|-------|------|--------|
| `nome` | `Nova mão` \| `Próxima mão` \| `Continuar` | Únicos nomes permitidos |
| `visivelQuando` | HudEstado | Nova mão → `ociosa`; Próxima mão → `resultado`; Continuar → `sem_upgrade` |

MUST NOT: `Embaralhar`, `Desistir`, `Nova mão` durante mão em curso, mute, zerar.

---

## State transitions — HUD

```text
[*] --> ociosa                 # load / reload
ociosa --> deal                # Nova mão (gesto; unlock áudio)
deal --> perguntando           # street pousou (flop/turn/river+virada) e passo é *_hero ou river_*
deal --> ociosa                # falha ao iniciar o deal
perguntando --> perguntando    # erro stub; mesma pergunta; opção morta
perguntando --> sem_upgrade    # acerto flop_hero ou turn_hero
perguntando --> deal           # (não direto) Continuar dispara street seguinte
perguntando --> resultado      # acerto river_vencedor
sem_upgrade --> deal           # Continuar → turn ou river (animação)
resultado --> deal             # Próxima mão: recolhe + novo deal (mesma Mesa)
deal --> deal                  # ainda animando (hole, street, virada)
```

`perguntando` das perguntas do river (hero → A → B → vencedor) permanece no mesmo estado HUD, mudando só `passo` / `enunciado` / `opcoes` após acerto — **uma por vez**.

Não há transição para `perguntando` com `street = preflop` ou board vazio (RN-041).

Não há transição que empilhe as quatro perguntas do river (RN-G001).

Não há avanço de street a partir de `perguntando` sem acerto (RN-G002 no casco: flop/turn exigem acerto da mão atual + skip; river exige as quatro).

---

## Relationships

```text
Mesa 1 -- 1 HUD
Mesa 1 -- 3 Assento
Mesa 1 -- 1 Board
Mesa 1 -- 1 PoteCenico
Mesa 1 -- 0..1 MaoTreino
Assento 1 -- 2 Carta (hole)
Board 1 -- 5 SlotComunitaria
SlotComunitaria 0..1 -- 1 Carta
HUD 1 -- 0..6 OpcaoQuiz
HUD 0..1 -- 1 CtaSessao
```

---

## Persistence

Nenhuma. Sem schema JSON em disco. Feature 003 introduzirá contadores no `localStorage` (ADR-002) com fail-open; este modelo MUST NOT escrever chaves agora, para não colidir nem coletar dado.

---

## Validation rules (resumo testável)

1. Três apelidos imutáveis; zero input de nome.
2. Cinco slots sempre no DOM; vazios visíveis.
3. Herói face-up após deal; A/B verso até virada.
4. Burn, se existir, `papel = burn_cenico` e fora dos 5 slots.
5. Stub: uma `correta` por pergunta; 6 opções; rótulos canônicos.
6. CTAs só nos estados listados.
7. Reload: `mao = null`, `hud.estado = ociosa`, `indiceMaoSessao = 0`.
