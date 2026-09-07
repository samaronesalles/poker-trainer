# Data Model: Identificação da mão atual (flop e turn)

**Feature**: `004-mao-atual`  
**Escopo**: avaliador de melhor 5, taxonomia RN-014, conjunto de 6 opções (RN-017) e consumo no HUD só em `flop_hero` / `turn_hero`. Sem enumerador de upgrades. Sem vencedor do pote. Sem PII.

Estende o modelo da [003-feedback-persistencia](../003-feedback-persistencia/data-model.md). **Não** altera baralho (002), storage (três buckets) nem a cadência de passos. O estado da mão continua **só em memória**; o que sobrevive ao fechar a aba continua sendo **somente** `EvolucaoTreino`.

Tipos abaixo são o contrato lógico; identificadores de código MAY estar em inglês. Rótulos visíveis MUST ser pt-BR canônicos.

---

## Enums

### CategoriaId

Ids estáveis (JSON + código), 1:1 com RN-014 — **os mesmos** da 003/`storage.js`:

| Ordem (1 = mais forte) | id | Rótulo visível | Força interna (9 = mais forte) |
|------------------------|----|----------------|--------------------------------|
| 1 | `royal_flush` | Royal flush | 9 |
| 2 | `straight_flush` | Straight flush | 8 |
| 3 | `quadra` | Quadra | 7 |
| 4 | `full_house` | Full house | 6 |
| 5 | `flush` | Flush | 5 |
| 6 | `straight` | Straight | 4 |
| 7 | `trinca` | Trinca | 3 |
| 8 | `dois_pares` | Dois pares | 2 |
| 9 | `par` | Par | 1 |
| 10 | `carta_alta` | Carta alta | 0 |

As 10 MUST continuar presentes em `mao_atual` / `upgrade` (schema 003). Esta feature só **escolhe** qual id é a correta no flop/turn do herói.

### Rank

`A` \| `K` \| `Q` \| `J` \| `10` \| `9` \| `8` \| `7` \| `6` \| `5` \| `4` \| `3` \| `2`  
(alfabeto de `js/baralho.js`).

Valor de comparação padrão: A=14, K=13, Q=12, J=11, 10=10, …, 2=2.  
Wheel (straight / SF A-2-3-4-5): Ás vale **1** só para o topo da sequência (topo = 5).

### Naipe

`espadas` \| `copas` \| `ouros` \| `paus`

### SequenciaLegal

Conjuntos de 5 ranks (FR-006), únicos legais:

`A-2-3-4-5`, `2-3-4-5-6`, `3-4-5-6-7`, `4-5-6-7-8`, `5-6-7-8-9`, `6-7-8-9-10`, `7-8-9-10-J`, `8-9-10-J-Q`, `9-10-J-Q-K`, `10-J-Q-K-A`.

Qualquer outro conjunto de 5 ranks **não** é straight (wrap incluso).

### PassoQuiz (reuso 003)

Inalterado. Esta feature **só substitui a correção** de `flop_hero` e `turn_hero`.  
`river_hero` / `river_a` / `river_b` / `flop_upgrade` / `river_vencedor` / `turn_skip` permanecem stub da 003.

MUST NOT existir passo extra de mão do herói no river.

---

## Entities

### CartaIdentidade

Carta sem DOM. Fonte: `sessao.mao.cartasJogo` (já mapeado RN-044).

| Campo | Tipo | Regras |
|-------|------|--------|
| `rank` | Rank | Obrigatório |
| `naipe` | Naipe | Obrigatório |

Motor MUST NOT exigir `idVisual`, `visibilidade`, `papel` ou `dono`. Quiz filtra antes de chamar.

### CartasVisiveisHeroi

Conjunto que o avaliador usa **nesta feature**.

| Street | Cartas | Origem RN-044 (`cartasJogo`) | Tamanho |
|--------|--------|------------------------------|---------|
| flop | 2 hole herói + 3 flop | `[4],[5]` + `[6],[7],[8]` | 5 |
| turn | 2 hole herói + 4 comunitárias | `[4],[5]` + `[6]..[9]` | 6 |

MUST NOT incluir holes de Adversário A/B (`[0]..[3]`), river `[10]` nesta pergunta, nem burns cênicos.

O avaliador também classifica 7 cartas (`[4],[5]` + `[6]..[10]`) pelo **mesmo** critério; o HUD desta feature MUST NOT apresentar pergunta com 7.

### BoardDaStreet

Só comunitárias já abertas. Base das tentadoras RN-017. MUST NOT incluir hole do herói.

| Street | Cartas | Tamanho |
|--------|--------|---------|
| flop | `[6],[7],[8]` | 3 |
| turn | `[6],[7],[8],[9]` | 4 |

### Melhor5

Resultado do avaliador. Sempre existe exatamente uma categoria vencedora.

| Campo | Tipo | Regras |
|-------|------|--------|
| `cartas` | CartaIdentidade[5] | As cinco da combinação vencedora |
| `categoriaId` | CategoriaId | Única certa do quiz nesta pergunta |
| `rotulo` | string | Rótulo RN-014 **exato** (pt-BR) |
| `chaveDesempate` | number[] | Tupla lexicográfica; **nunca** na UI |

Validação:

- Royal = A,K,Q,J,10 do mesmo naipe → `royal_flush`, nunca `straight_flush`.
- A-2-3-4-5 suited → `straight_flush`, nunca `royal_flush`.
- A-2-3-4-5 offsuit → `straight`.
- Wrap (5 ranks fora de SequenciaLegal) → **não** `straight` nem `straight_flush`.
- Flush = 5 suited que **não** formam SF/royal.
- Par de 2 e par de Ás → ambos `par` (RN-046).

### ChaveDesempate

`[forcaCategoria, ...kickers]` comparado da esquerda para a direita (maior vence).

Kickers (RN-029), ranks numéricos:

| Categoria | Kickers |
|-----------|---------|
| Royal flush / Straight flush / Straight | topo da sequência (wheel = 5) |
| Quadra | rank da quadra, kicker |
| Full house | rank da trinca, rank do par |
| Flush / Carta alta | 5 ranks do mais alto ao mais baixo (A=14) |
| Trinca | rank da trinca, 2 kickers altos |
| Dois pares | par maior, par menor, kicker |
| Par | rank do par, 3 kickers altos |

Empate total de chave entre duas combinações de 5 = mesma mão (escolhe qualquer uma; rótulo idêntico).

### TexturaBoard

Derivada só de `BoardDaStreet`. Usada **apenas** para tentadoras.

| Predicado | Definição |
|-----------|-----------|
| `doisMaisMesmoNaipe` | ≥1 naipe aparece ≥2 vezes |
| `conectado` | ≥3 ranks distintos cabem numa janela SequenciaLegal (5 ranks). 2-4-6 sim; 2-4-7 / 2-3-8 não; A-2-3 sim; K-A-2 não |
| `sfTentadora` | ≥3 do **mesmo** naipe **e** os ranks **desse naipe** satisfazem `conectado` |
| `trincaOuMais` | ≥1 rank aparece ≥3 vezes |
| `pareadoSemTrinca` | ≥1 rank aparece exatamente 2 vezes e nenhum rank ≥3 |

Royal **não** tem predicado de tentadora.

### ConjuntoOpcoesMaoAtual

1 correta + 5 distratoras. Sem ordem visual.

| Campo | Tipo | Regras |
|-------|------|--------|
| `ids` | CategoriaId[6] | Distintos; inclui `categoriaId` da Melhor5 |
| `corretaId` | CategoriaId | = Melhor5.categoriaId |

Montagem determinística (FR-009): correta → vizinhas imediatas → tentadoras na ordem Flush, Straight, Straight flush (se `sfTentadora`), depois Quadra/FH/Trinca/Dois pares **ou** FH/Trinca/Dois pares → preenchimento RN-014 cima→baixo sem filtrar possibilidade. Excedente: descarta tentadoras posteriores. Sem repetir.

Ordem **visual** NÃO pertence a esta entidade — é `shuffleOpcoes` do quiz (G008), só ao apresentar pergunta nova.

### PerguntaMaoAtualHeroi

Exposição de seleção única no HUD. Estende `PerguntaDaMesa` da 003.

| Campo | Tipo | Regras |
|-------|------|--------|
| `passo` | `flop_hero` \| `turn_hero` | Só estes dois nesta feature |
| `enunciado` | string | exatamente **Qual mão você tem agora?** |
| `opcoes` | 6 × opção categoria | rótulo = RN-014; 0 kickers; 0 sinônimos |
| `corretaUnica` | CategoriaId | da Melhor5 da street |
| `modo` | `unica` | sem Confirmar |

Retry, opção morta, 1ª tentativa em `mao_atual` da **correta** e beat: contrato 003 inalterado.

Flop e turn da mesma mão = duas entidades independentes (duas 1ª tentativas).

---

## Relacionamentos

```text
cartasJogo (002) ──extrai──► CartasVisiveisHeroi ──► Melhor5
                    └──► BoardDaStreet ──► TexturaBoard ──► ConjuntoOpcoesMaoAtual
Melhor5.categoriaId ──► ConjuntoOpcoesMaoAtual + PerguntaMaoAtualHeroi.corretaUnica
Pergunta ──1ª tentativa──► EvolucaoTreino.mao_atual[categoriaId]   (003, fail-open)
Pergunta ──NÃO──► river_hero / adversários / vencedor / upgrade
```

`js/mesa.js` MUST NOT gravar Melhor5 em `localStorage`. Kickers morrem com o reload da mão.

---

## State transitions

### Avaliador

Stateless. Mesmas cartas visíveis → mesma Melhor5 e mesmo conjunto de 6 ids (ignorando shuffle).

### HUD (reuso 003)

```text
deal (flop pousado) → perguntando / flop_hero
  erro → perguntando (retry; morta no lugar; ordem estável)
  acerto + beat → perguntando / flop_upgrade   (stub 003)
deal (turn pousado) → perguntando / turn_hero
  acerto + beat → sem_upgrade / turn_skip
river → perguntando / river_hero               (stub 003; motor NÃO entra)
```

MUST NOT: `flop_hero` → turn; `turn_hero` → river; segunda pergunta de mão do herói no river.

---

## Validation rules (resumo)

- Sempre 1 melhor categoria; sem skip nesta pergunta (FR-003).
- HUD flop/turn: exatamente 6 rótulos canônicos distintos (FR-008).
- Kickers / “par de reis” / “Sequência” proibidos na UI (FR-007).
- Motor MUST NOT consultar holes adversárias para esta pergunta (FR-016).
- Persistência: só delta `mao_atual` da correta; 0 cartas/timestamp/PII (FR-019).
- Entrada do avaliador com length ∉ {5,6,7}: erro de programação (lança); o quiz nunca envia.

## Fora deste modelo

- Information set / upgrades (005).
- Comparação de três jogadores e split visual (006).
- Relatório, zerar, apostas, quiz preflop.
