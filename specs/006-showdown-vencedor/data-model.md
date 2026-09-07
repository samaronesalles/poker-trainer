# Data Model: Showdown — mãos dos adversários e vencedor do pote

**Feature**: `006-showdown-vencedor`  
**Escopo**: três Melhor5 do river (2 hole + 5 comunitárias), conjunto vencedor RN-029, universo RN-030, recorte RN-031, quatro perguntas do HUD e desfecho `resultado`. Sem 5.4 no river. Sem draws nomeados. Sem apostas.

Estende o modelo da [004-mao-atual](../004-mao-atual/data-model.md) (Melhor5, CategoriaId, `chaveDesempate`) e o contrato de quiz da [003-feedback-persistencia](../003-feedback-persistencia/data-model.md). **Não** altera baralho (002), enumerador (005) nem storage (três buckets). O estado do showdown vive **só em memória da visita**; o que sobrevive ao fechar a aba continua sendo **somente** `EvolucaoTreino`.

Tipos abaixo são o contrato lógico; identificadores de código MAY estar em inglês. Rótulos visíveis MUST ser pt-BR canônicos.

---

## Enums

### CategoriaId

Os mesmos 10 ids da 003/004/`storage.js` (ordem 1 = mais forte):

`royal_flush` · `straight_flush` · `quadra` · `full_house` · `flush` · `straight` · `trinca` · `dois_pares` · `par` · `carta_alta`

Rótulos visíveis MUST ser exatamente: Royal flush, Straight flush, Quadra, Full house, Flush, Straight, Trinca, Dois pares, Par, Carta alta.

### AssentoId

`voce` \| `adversarioA` \| `adversarioB`

Apelidos visíveis: **Você**, **Adversário A**, **Adversário B**.

### VencedorId

Ids estáveis (código + testes), 1:1 com RN-030:

| id | Rótulo visível | Assentos |
|----|----------------|----------|
| `voce` | Você | `{voce}` |
| `adversarioA` | Adversário A | `{adversarioA}` |
| `adversarioB` | Adversário B | `{adversarioB}` |
| `voce_a` | Você e Adversário A | `{voce, adversarioA}` |
| `voce_b` | Você e Adversário B | `{voce, adversarioB}` |
| `a_b` | Adversário A e Adversário B | `{adversarioA, adversarioB}` |
| `tres` | Os três empatam | `{voce, adversarioA, adversarioB}` |

MUST NOT existir id `empate` genérico. MUST NOT usar nome de categoria como opção de pote.

### PassoQuiz (delta vs 005)

| Passo | Papel nesta feature |
|-------|---------------------|
| `flop_*` / `turn_*` | Inalterados (004/005). |
| `river_hero` | **Substitui stub Flush.** Única 5.3 do herói no river. Melhor 5 das 7 do herói. |
| `river_a` | **Substitui stub Par.** Melhor 5 de A. |
| `river_b` | **Substitui stub Par.** Melhor 5 de B. |
| `river_vencedor` | **Substitui stub `indiceMaoSessao`.** Ranking completo RN-029. |

MUST NOT existir `river_upgrade` nem skip de categoria no river.

### ResultadoShowdown

`ok` \| `falha` \| `pendente`

`falha` MUST NOT ser modelada como `tres` nem como lista vazia. `pendente` só existe como defesa de espera ≤1 s em `deal` após a virada; o caminho feliz é síncrono (`ok` ou `falha` no pouso).

### PoteModo

`centro` \| `para_vencedor` \| `split`

- `centro`: `deal` e as quatro perguntas. Bolo no meio. `vencedoresVisuais` vazia.
- `para_vencedor`: `resultado` com exatamente 1 assento. Fichas caminham a esse assento.
- `split`: `resultado` com 2 ou 3 assentos. Fichas dividem-se visualmente entre eles.

### HudEstado (reuso)

`ociosa` \| `deal` \| `perguntando` \| `sem_upgrade` \| `resultado`

`sem_upgrade` **não** ocorre no river. `resultado` só depois do acerto de `river_vencedor` + beat.

---

## Entities

### CartasDeJogoShowdown

As 11 cartas RN-044, já conhecidas quando o river pousa.

| Papel | Índices `cartasJogo` | Tamanho |
|-------|----------------------|---------|
| Hole A | `[0],[1]` | 2 |
| Hole B | `[2],[3]` | 2 |
| Hole herói | `[4],[5]` | 2 |
| Comunitárias | `[6]..[10]` | 5 |

Burns cênicos MUST NOT entrar. MUST NOT persistir.

### Melhor5DeJogador

Reuso da Melhor5 da 004, uma por assento, sobre as **7** cartas daquele jogador (2 hole + 5 comunitárias).

| Campo | Tipo | Regras |
|-------|------|--------|
| `cartas` | CartaIdentidade[5] | A combinação vencedora; MAY usar 0, 1 ou 2 hole |
| `categoriaId` | CategoriaId | Exatamente uma |
| `rotulo` | string | RN-014 exato; único campo visível nas perguntas 1–3 |
| `chaveDesempate` | number[] | Ranking RN-029; MUST NEVER ir à UI, `aria-*` ou storage |

Sempre existe exatamente uma melhor categoria por jogador. Skip **não** é legal.

### CincoCartasEfetivas

A chave de comparação: `chaveDesempate` da Melhor5 (categoria + ranks). Iguais ⇒ aqueles jogadores empatam. Naipe **não** faz parte.

Board que joga para todos: as três Melhor5 MAY ser a mesa. O pote empata os três **somente** se as chaves também empatam. Se um jogador monta 5 estritamente melhor que a mesa, ele vence.

### ShowdownMemoria

Snapshot em `sessao.mao.showdown`. Só memória da visita.

| Campo | Tipo | Regras |
|-------|------|--------|
| `ok` | boolean | `false` ⇒ aborto; MUST NOT abrir quiz |
| `maos` | `{ voce, adversarioA, adversarioB }` | Três Melhor5 se `ok` |
| `vencedorId` | VencedorId | Se `ok` |
| `vencedores` | AssentoId[] | 1, 2 ou 3; ordem Você → A → B |
| `conjuntoPote` | VencedorId[6] | Recorte RN-031, **sem** shuffle |

MUST NOT persistir. MUST NOT copiar `chaveDesempate` para o HUD.

### UniversoPote

Os 7 pares `(VencedorId, rótulo RN-030)`. Fonte: motor `UNIVERSO_POTE`. O conjunto exibido é sempre 6.

Prioridade de preenchimento (FR-013):

1. Você  
2. Adversário A  
3. Adversário B  
4. Você e Adversário A  
5. Você e Adversário B  
6. Adversário A e Adversário B  
7. Os três empatam  

Correta entra sempre. Se a correta for `tres`, as outras 5 são (1)–(5) e `a_b` fica de fora. Caso contrário `tres` é a 7ª e fica de fora.

### PerguntaCategoriaRiver

Exposição de seleção única (contrato 5.3).

| Campo | Tipo | Regras |
|-------|------|--------|
| `passo` | `river_hero` \| `river_a` \| `river_b` | Uma por vez |
| `enunciado` | string | Copy canônica daquele assento |
| `corretaUnica` | CategoriaId | Melhor 5 **daquele** jogador |
| `opcoes` | 6 rótulos RN-014 | RN-017 com board = 5 comunitárias; ordem visual embaralhada uma vez |
| `exposição` | delta `mao_atual` | Só 1ª tentativa; categoria **correta daquele jogador** |

As três exposições são independentes mesmo se dois jogadores compartilham o rótulo.

### PerguntaPote

| Campo | Tipo | Regras |
|-------|------|--------|
| `passo` | `river_vencedor` | Só depois das três categorias acertadas |
| `enunciado` | string | **Quem ganhou o pote?** |
| `corretaUnica` | VencedorId | De `ShowdownMemoria` |
| `opcoes` | 6 textos RN-030 | Conjunto RN-031 + shuffle G008 |
| `exposição` | delta `vencedor_pote` | Um grupo; MUST NOT ter 10 categorias; MUST NOT tocar `mao_atual` / `upgrade` |

### Desfecho

Estado `resultado` após acerto + beat.

| Campo | Tipo | Regras |
|-------|------|--------|
| `textoPote` | string | Rótulo RN-030 + “levou o pote” (único) ou “dividem o pote” (split) |
| `categoriasIdentificadas` | `{ voce, adversarioA, adversarioB }` | Três rótulos RN-014, nesta ordem, **no HUD** |
| `pote.modo` | PoteModo | `para_vencedor` ou `split` |
| `pote.vencedoresVisuais` | AssentoId[] | Só agora; vazia antes |
| `cta` | **Próxima mão** | Habilitado na entrada; MUST NOT esperar fichas |

MUST NOT: colar rótulo nas cartas; contornar a melhor 5; escurecer perdedores; valores em bb; kicker; chave; destaque antes deste estado.

### PrimeiraTentativa

Reuso 003. Um evento por pergunta. Três categorias + um pote = até quatro deltas por river concluído.

---

## Validation rules

- 11 cartas distintas do alfabeto; aridade 2+2+2+5. Violação → `falha`.
- Sempre uma categoria por jogador; sempre um `VencedorId`.
- Conjunto de categoria: length 6, inclui a certa, determinístico para as mesmas 7 cartas + board de 5.
- Conjunto de pote: length 6, inclui a certa, determinístico para o mesmo `vencedorId`.
- Naipe não desempatar.
- Wheel legal (topo 5); wrap ilegal; royal ≠ straight flush.
- Gerador MUST NOT filtrar empate.
- 0 kickers / 0 “par de reis” / 0 sinônimos na UI.
- Storage: só os três buckets já definidos; 0 dump.

---

## State transitions

```text
turn completo (5.3 + 5.4 ou skip)
  → deal river (A/B ainda verso; pote centro)
  → river pousa [10]  → prepararShowdown (memória)
  → virada A e B no mesmo beat (HUD ainda deal)
  → se falha / teto 1 s → ociosa + Nova mão
  → river_hero (perguntando)
  → [acerto + beat] river_a
  → [acerto + beat] river_b
  → [acerto + beat] river_vencedor
      (pote ainda centro; 0 destaque)
  → [acerto + beat] resultado
      (destaque + fichas + 3 rótulos + Próxima mão imediato)
  → Próxima mão → recolhe; bolo centro; novo deal (sem preflop)
```

Reload em qualquer passo: mão aborta; deltas já gravados permanecem.

---

## Relacionamentos

```text
CartasDeJogoShowdown
  ├─→ Melhor5DeJogador × 3
  │     └─→ CincoCartasEfetivas (chave)
  └─→ ShowdownMemoria
        ├─→ PerguntaCategoriaRiver × 3  → mao_atual
        ├─→ PerguntaPote               → vencedor_pote
        └─→ Desfecho (só após acerto do pote)
```

`mesa.js` lê `ShowdownMemoria` já preenchida pelo quiz. MUST NOT conhecer `chaveDesempate`.
