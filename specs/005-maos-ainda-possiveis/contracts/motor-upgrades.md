# Contract: Motor — enumerador de upgrades

**Feature**: `005-maos-ainda-possiveis`  
**Tipo**: contrato de domínio no cliente (sem HTTP)  
**Módulo**: `js/motor.js` (**alter**; estende [motor.md da 004](../../004-mao-atual/contracts/motor.md))  
**Consumidores**: `js/quiz.js` (preparo no pouso + `flop_upgrade` / `turn_upgrade`), testes `tests/contract/motor.test.js`  
**Modelo**: [data-model.md](../data-model.md)  
**Integração HUD**: [quiz-upgrades.md](./quiz-upgrades.md)

Não há API de rede. Nenhuma biblioteca de poker. Sem persistência. Sem `quemGanhou`. Sem vocabulário de draws no retorno.

---

## 1. Tipos de carta

Entrada: `{ rank, naipe }` com o alfabeto de `js/baralho.js` (`RANKS`, `NAIPES`).

O motor MAY importar `RANKS` / `NAIPES`. MUST NOT importar `embaralhar`, mistura, DOM, `quiz.js`, `mesa.js` ou `storage.js`. MUST NOT ler o baralho vivo da mão.

---

## 2. `snapshotDesconhecido(visiveis)`

| Entrada | Significado |
|---------|-------------|
| `visiveis` | Cartas que o herói **vê** (flop: 5; turn: 6) |

**Retorno:** array de `{ rank, naipe }` = (`RANKS × NAIPES`) − identidades em `visiveis`.

| Street implícita | `visiveis.length` | Snapshot |
|------------------|-------------------|----------|
| flop | 5 | **47** |
| turn | 6 | **46** |

Regras:

- Inclui holes dos adversários (não estão em `visiveis`).
- MUST NOT subtrair burns.
- MUST NOT mutar o array de entrada.
- Length fora de 47/46 é sinal de falha para o chamador de `enumerarUpgrades` — esta função MAY só devolver o complemento cru.

---

## 3. `enumerarUpgrades({ holeHeroi, comunitarias })`

| Campo | Aridade | Uso |
|-------|---------|-----|
| `holeHeroi` | 2 | Hole do herói |
| `comunitarias` | 3 | Flop |
| `comunitarias` | 4 | Turn |

**Retorno em sucesso:**

```text
{
  ok: true,
  categoriaAtual: CategoriaId,
  upgrades: CategoriaId[]   // RN-020, forte → fraco; 0..9; sem carta_alta
}
```

**Retorno em falha:**

```text
{ ok: false }
```

MUST NOT lançar até a UI. MUST NOT incluir runouts, cartas, `chaveDesempate` ou stack no retorno. MUST NOT persistir nada.

### 3.1 Mão atual

`categoriaAtual` = `avaliarMelhor5([...holeHeroi, ...comunitarias]).categoriaId`  
(5 cartas no flop, 6 no turn — critério da 004).

### 3.2 Runouts

- Flop: todo par distinto entre as 47 do snapshot. Testemunha = `avaliarMelhor5([...holeHeroi, ...comunitarias, t, r])` (**7** cartas). MUST NOT testemunhar a Melhor5 das 6 intermediárias.
- Turn: cada uma das 46 como river. Testemunha = melhor 5 das 7.
- Runout com Melhor5 = D testemunha **somente** D (royal ≠ Flush ≠ Straight flush).
- Pote hipotético MUST NOT filtrar.

### 3.3 Filtro RN-020

C entra em `upgrades` se e somente se:

1. existe ≥1 runout testemunhando C;
2. C é estritamente mais forte que `categoriaAtual`;
3. C ≠ `carta_alta`.

Categoria igual ou mais fraca, e força só dentro da categoria, **não** entram.

### 3.4 Falha (`ok: false`)

Qualquer um: `holeHeroi` ≠ 2; `comunitarias` ∉ {3,4}; snapshot ≠ 47/46; `avaliarMelhor5` lança; identidades duplicadas nas visíveis. MUST NOT converter falha em `upgrades: []`.

### 3.5 Early-out

MAY parar o laço só quando **todas** as categorias estritamente mais fortes que a atual já foram testemunhadas. MUST NOT parar ao achar 6 ids.

---

## 4. `conjuntoOpcoesUpgrade({ upgrades })`

| Entrada | Significado |
|---------|-------------|
| `upgrades` | Lista RN-020 completa (ids distintos, preferencialmente já forte→fraco) |

**Retorno:** `{ ids: CategoriaId[6], verdadeiros: CategoriaId[] }`

- `upgrades.length === 0`: MUST NOT ser chamado (skip é do quiz).
- 1–5: `ids` = todos os upgrades + distratoras até 6. Distratoras = categorias que **não** estão em `upgrades`, preenchidas da mais forte para a mais fraca na `CATEGORIAS`, sem repetir. `verdadeiros` = os upgrades.
- ≥6: `ids` = os 6 mais fortes; `verdadeiros` = esses 6; 0 distratora.
- Sem shuffle (G008 é do quiz).
- Mesma entrada → mesmo conjunto (ordem de `ids` MAY ser a de inserção: upgrades na ordem canônica, depois distratoras).

---

## 5. Proibições

- Lib de poker, CDN, WASM de terceiros, Worker remoto, lookup tables grandes
- Consumir, reordenar ou reler o baralho vivo / sapato
- Virar carta hipotética no feltro
- Gravar runouts, snapshot, Melhor5 ou kickers em `localStorage` / log
- Devolver texto com kicker, naipe por extenso, “par de ases”, draw/gutshot/outs
- Tratar burn como carta retirada
- Filtrar C porque um adversário “ganharia”
- Declarar vencedor / split (006)
- Pergunta de upgrade com 5 comunitárias (river)

---

## 6. Casos de contrato (automatizáveis)

1. Flop: 2 hole + 3 board → snapshot length 47; turn: +1 comunitária → 46.
2. Snapshot **não** exclui duas cartas que são holes de A/B (elas permanecem no desconhecido se não estão nas visíveis).
3. Burns passados por engano como visíveis **não** fazem parte do contrato — o quiz MUST NOT passá-los.
4. `enumerarUpgrades` **não** muta os arrays de entrada nem um `cartasJogo` do caller.
5. Flop: par hipotético cuja Melhor5 das 6 é Flush e das 7 é Full house → testemunha `full_house`, não `flush`.
6. Únicos runouts “de naipe” com Melhor5 royal → `upgrades` contém `royal_flush` e **não** `flush` nem `straight_flush` por esses runouts.
7. `categoriaAtual === 'trinca'` → `par`, `dois_pares`, `trinca`, `carta_alta` ∉ `upgrades`.
8. Par de 2 atual + runout que só sobe o par → `par` ∉ `upgrades`.
9. `carta_alta` ∉ `upgrades` em 100% dos casos.
10. Herói já com royal no flop → `upgrades` vazia (`ok: true`).
11. 1–5 upgrades → `conjuntoOpcoesUpgrade` length 6, todos os upgrades inclusos, resto distratoras forte→fraco.
12. ≥7 upgrades (flop Carta alta extremo) → `ids` = royal, SF, quadra, FH, flush, straight; 0 distratora; par/dois pares/trinca fora.
13. Exatamente 2 upgrades → 2 verdadeiros + 4 distratoras.
14. `holeHeroi` length 1 ou `comunitarias` length 2 → `{ ok: false }`, não lista vazia.
15. Cada uma das 9 categorias Royal flush … Par é `upgrades` verdadeiro em ≥1 fixture; Carta alta em 0.
16. Pote hipotético (adversário com royal no mesmo runout) **não** remove C do herói — o motor nem recebe holes adversárias como “conhecidas”.
