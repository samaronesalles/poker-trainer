# Data Model: Identificação de mãos ainda possíveis (flop e turn)

**Feature**: `005-maos-ainda-possiveis`  
**Escopo**: information set do herói, runout legal, lista RN-020, conjunto de até 6 opções, skip `sem_upgrade` e consumo no HUD em `flop_upgrade` / `turn_upgrade`. Sem pergunta no river. Sem draws nomeados. Sem vencedor do pote.

Estende o modelo da [004-mao-atual](../004-mao-atual/data-model.md) (Melhor5, CategoriaId, ranking completo) e o contrato de quiz da [003-feedback-persistencia](../003-feedback-persistencia/data-model.md). **Não** altera baralho (002), storage (três buckets) nem a pergunta de mão atual. O estado da enumeração vive **só em memória da visita**; o que sobrevive ao fechar a aba continua sendo **somente** `EvolucaoTreino`.

Tipos abaixo são o contrato lógico; identificadores de código MAY estar em inglês. Rótulos visíveis MUST ser pt-BR canônicos.

---

## Enums

### CategoriaId

Os mesmos 10 ids da 003/004/`storage.js` (ordem 1 = mais forte):

`royal_flush` · `straight_flush` · `quadra` · `full_house` · `flush` · `straight` · `trinca` · `dois_pares` · `par` · `carta_alta`

Rótulos visíveis MUST ser exatamente: Royal flush, Straight flush, Quadra, Full house, Flush, Straight, Trinca, Dois pares, Par, Carta alta.

`carta_alta` MUST NEVER ser upgrade. MAY aparecer só como distratora.

### StreetUpgrade

`flop` \| `turn`

MUST NOT existir `river` neste modelo.

### PassoQuiz (delta vs 004)

| Passo | Papel nesta feature |
|-------|---------------------|
| `flop_hero` / `turn_hero` | Inalterados (004). No pouso, o quiz **também** prepara `UpgradesStreet`. |
| `flop_upgrade` | **Substitui stub.** Múltipla seleção com lista real. |
| `flop_skip` | **Novo.** HUD `sem_upgrade` quando RN-020 do flop é vazia. |
| `turn_upgrade` | **Novo.** Mesma pergunta no turn (o skip forçado da 003 sai). |
| `turn_skip` | Permanece, mas **só** quando RN-020 do turn é vazia. |
| `river_*` | Inalterados (stub 003 / 006). 0 pergunta de upgrade. |

### ResultadoEnumeracao

`ok` \| `falha`

`falha` MUST NOT ser modelada como lista vazia.

---

## Entities

### CartasVisiveisHeroi

Reuso da 004. Base da mão atual **e** do complemento do snapshot.

| Street | Cartas | Índices RN-044 | Tamanho |
|--------|--------|----------------|---------|
| flop | 2 hole herói + 3 flop | `[4],[5]` + `[6],[7],[8]` | 5 |
| turn | 2 hole herói + 4 comunitárias | `[4],[5]` + `[6]..[9]` | 6 |

MUST NOT incluir holes de A/B (`[0]..[3]`), river `[10]` no flop, nem burns.

### SnapshotDesconhecido

Cópia em memória das cartas que o herói **não** vê. Não é o baralho vivo.

| Campo | Tipo | Regras |
|-------|------|--------|
| `cartas` | CartaIdentidade[] | 47 no flop; 46 no turn |
| `street` | StreetUpgrade | flop \| turn |

Construção: `RANKS × NAIPES` (52) **menos** as identidades em `CartasVisiveisHeroi`. Inclui holes adversárias. Burns **não** retiram carta. MUST NOT persistir. MUST NOT reordenar o sapato.

Validação: length ≠ 47/46 conforme a street → enumeração em `falha`.

### RunoutLegal

Desfecho hipotético usado só como testemunha. MUST NOT virar carta no feltro.

| Street | Forma | Cartas finais do herói |
|--------|-------|------------------------|
| flop | par distinto `(t, r)` entre as 47 | 2 hole + 3 flop + t + r = **7** |
| turn | uma carta `r` entre as 46 | 2 hole + 4 comunitárias + r = **7** |

A categoria testemunhada é a da **Melhor5** dessas 7 (mesmo critério da 004, kickers só por dentro). No flop, a Melhor5 das **6** intermediárias daquele par MUST NOT testemunhar.

Um runout cuja Melhor5 é D testemunha **somente** D.

O pote hipotético (quem ganharia) **não** é campo desta entidade.

### UpgradeDeCategoria

Rótulo canônico C tal que:

1. C é estritamente mais forte que `Melhor5.categoriaId` das cartas visíveis da street;
2. C ≠ `carta_alta`;
3. existe ≥1 `RunoutLegal` cuja Melhor5 tem `categoriaId === C`.

Melhorar só a força **dentro** da mesma categoria (par fraco → par forte) **não** cria upgrade.

### ListaUpgrades

Conjunto RN-020 da street, **antes** do teto de 6.

| Campo | Tipo | Regras |
|-------|------|--------|
| `ids` | CategoriaId[] | Distintos; ordem canônica forte→fraca; 0..9 itens |
| `categoriaAtual` | CategoriaId | Melhor5 das visíveis |
| `street` | StreetUpgrade | |

Pode ser vazia (royal já feito, ou nenhuma mais forte atingível).

### ConjuntoOpcoesUpgrade

Até 6 rótulos visíveis. Único conjunto cobrado.

| Campo | Tipo | Regras |
|-------|------|--------|
| `ids` | CategoriaId[6] | Distintos; só existe se `ListaUpgrades` não é vazia |
| `verdadeiros` | CategoriaId[] | Interseção de `ids` com a lista RN-020 |

Montagem determinística (FR-010/011):

- 1–5 upgrades: todos + distratoras até 6 (preencher forte→fraco, sem repetir).
- ≥6 upgrades: só os 6 mais fortes; `verdadeiros.length === 6`; 0 distratora.
- Upgrades que não couberam **não** estão em `ids` e **não** geram estatística.

Ordem **visual** NÃO pertence a esta entidade — é `shuffleOpcoes` do quiz (G008), só ao apresentar pergunta nova.

### Distratora

CategoriaId em `ConjuntoOpcoesUpgrade.ids` que **não** está em `ListaUpgrades`. Só existe no ramo 1–5. Inclui, quando couber: atual, mais fracas, `carta_alta`, mais fortes inatingíveis.

### UpgradesStreet

Resultado pronto em memória da visita, determinado no pouso das comunitárias.

| Campo | Tipo | Regras |
|-------|------|--------|
| `ok` | boolean | `false` ⇒ aborto; MUST NOT virar skip |
| `lista` | ListaUpgrades \| null | `null` se `!ok` |
| `conjunto` | ConjuntoOpcoesUpgrade \| null | `null` se `!ok` ou lista vazia |
| `street` | StreetUpgrade | |
| `prontoEm` | instante de memória | MUST NOT ser timestamp persistido |

Reload da página descarta esta entidade (mão aborta). MUST NOT ir ao `localStorage`.

### PerguntaUpgrades

Exposição de múltipla seleção no HUD. Estende `PerguntaDaMesa` da 003.

| Campo | Tipo | Regras |
|-------|------|--------|
| `passo` | `flop_upgrade` \| `turn_upgrade` | Só após 5.3 acertada + beat |
| `enunciado` | string | exatamente **Quais mãos você ainda não tem, mas ainda pode formar?** |
| `opcoes` | 6 × opção categoria | rótulo RN-014; 0 kickers; 0 draws |
| `conjuntoCorreto` | CategoriaId[] | = `verdadeiros` das exibidas |
| `modo` | `multipla` | só **Confirmar** submete |
| `focoInicial` | primeira opção na ordem visual | Tab → ativáveis → **Confirmar** |

MUST NOT existir controle “marcar todas”.

Retry, morta, trava, 1ª Confirmar em `upgrade` das **exibidas** e beat: contrato 003 inalterado.

Flop e turn da mesma mão = duas entidades independentes (duas 1ªs Confirmar se ambas não-skip).

### SkipSemUpgrade

Estado do HUD quando `ListaUpgrades` é vazia. **Não** é pergunta.

| Campo | Tipo | Regras |
|-------|------|--------|
| `passo` | `flop_skip` \| `turn_skip` | |
| `frase` | string | exatamente **Não há upgrade possível.** |
| `cta` | Continuar | Avança street; 0 escrita em `upgrade` |

MUST NOT ser usado para mascarar `ResultadoEnumeracao = falha` nem espera da lista.

### FalhaEnumeracao

| Campo | Tipo | Regras |
|-------|------|--------|
| `hud` | `ociosa` | CTA **Nova mão** |
| `linhaErro` | string | exatamente **Não foi possível continuar esta mão. Tente de novo.** |
| `mao` | null | mão abortada; feltro vazio como `falhaMontagem` |

MUST NOT persistir runouts, snapshot, stack ou identificador. Contadores já gravados nesta visita permanecem.

---

## Relacionamentos

```text
cartasJogo (002) ──extrai──► CartasVisiveisHeroi ──► Melhor5 (004, mão atual)
                         └──► SnapshotDesconhecido ──► RunoutLegal* ──► ListaUpgrades
ListaUpgrades vazia ──► SkipSemUpgrade
ListaUpgrades não vazia ──► ConjuntoOpcoesUpgrade ──► PerguntaUpgrades
Pergunta ──1ª Confirmar──► EvolucaoTreino.upgrade[id exibido]   (003, fail-open)
Enumeração !ok ──► FalhaEnumeracao (ociosa)
Pergunta ──NÃO──► river / adversários / vencedor / mao_atual / vencedor_pote
Snapshot ──NÃO──► baralho vivo / localStorage / feltro
```

`js/mesa.js` MUST NOT gravar snapshot, lista ou Melhor5 em `localStorage`. Runouts morrem com o reload da mão.

---

## State transitions

### Enumerador

Stateless. Mesmas visíveis + mesmo alfabeto → mesma `ListaUpgrades` e mesmo conjunto de 6 ids (ignorando shuffle). Snapshot descartado ao fim da chamada (MAY permanecer só o resumo `UpgradesStreet` até o fim da street).

### HUD (delta vs 004)

```text
deal (flop pousado) → perguntando / flop_hero
                      + preparar UpgradesStreet (oculto)
  acerto 5.3 + beat
    ├─ !ok / ausente após ≤1 s → ociosa + Nova mão
    ├─ lista vazia → sem_upgrade / flop_skip
    │     Continuar → deal turn
    └─ lista ≥1 → perguntando / flop_upgrade
          acerto conjunto + beat → deal turn

deal (turn pousado) → perguntando / turn_hero
                      + preparar UpgradesStreet
  acerto 5.3 + beat
    ├─ !ok / ausente após ≤1 s → ociosa + Nova mão
    ├─ lista vazia → sem_upgrade / turn_skip
    │     Continuar → deal river
    └─ lista ≥1 → perguntando / turn_upgrade
          acerto conjunto + beat → deal river

river → perguntando / river_hero   (stub 003; 0 upgrade)
```

MUST NOT: empilhar 5.3 e 5.4; abrir a próxima street no acerto da 5.3; 5.4 no river; skip falso por espera ou falha; “marcar todas”.

---

## Validation rules (resumo)

- Information set: 47 no flop, 46 no turn; holes A/B dentro; burns fora (FR-004).
- Testemunha: só Melhor5 das 7 finais; exatamente C (FR-005, FR-006).
- Sem upgrade de categoria igual/mais fraca; Carta alta nunca (FR-007).
- Lista vazia → skip; não vazia → exatamente 6 opções (FR-008..011).
- 0 draws nomeados, 0 kickers na UI (FR-012).
- Persistência: só delta `upgrade` das exibidas na 1ª Confirmar (FR-019).
- Falha ≠ skip (FR-027).
- Baralho vivo e burns intactos (FR-025, SC-019).

## Fora deste modelo

- Heurística RN-017 da mão atual (004) — não monta distratoras desta pergunta.
- Comparação de três jogadores e split visual (006).
- Relatório, zerar, apostas, quiz preflop, vocabulário de draws.
