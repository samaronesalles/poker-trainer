# Contract: Motor — vilão assumido, upgrades vencedores, outs e odd

**Feature**: `008-desconto-outs`  
**Tipo**: contrato de domínio no cliente (sem HTTP)  
**Módulo**: `js/motor.js` (**alter**; estende [motor.md da 004](../../004-mao-atual/contracts/motor.md) e convive com [motor-showdown.md da 006](../../006-showdown-vencedor/contracts/motor-showdown.md))  
**Consumidores**: `js/quiz.js` (preparo no pouso + 5.4/5.8), testes `tests/contract/motor.test.js`  
**Modelo**: [data-model.md](../data-model.md)  
**Integração HUD**: [quiz-desconto-outs.md](./quiz-desconto-outs.md)  
**Substitui como contrato vigente**: [motor-upgrades.md da 005](../../005-maos-ainda-possiveis/contracts/motor-upgrades.md) — essa pasta **não** se edita.

Não há API de rede. Nenhuma biblioteca de poker. Sem persistência. `quemGanhou` MUST NOT receber o vilão assumido. Sem vocabulário de draws / Pot Odds no retorno.

---

## 1. Tipos de carta

Entrada: `{ rank, naipe }` com o alfabeto de `js/baralho.js` (`RANKS`, `NAIPES`).

O motor MAY importar `RANKS` / `NAIPES`. MUST NOT importar `embaralhar`, mistura, DOM, `quiz.js`, `mesa.js` ou `storage.js`. MUST NOT ler o baralho vivo da mão. MUST NOT persistir.

Desempate de naipe no mesmo rank: **espadas**, **copas**, **ouros**, **paus**.

---

## 2. `sintetizarVilaoAssumido({ holeHeroi, comunitarias })`

| Campo | Aridade | Uso |
|-------|---------|-----|
| `holeHeroi` | 2 | Hole do herói |
| `comunitarias` | 3 | Flop |
| `comunitarias` | 4 | Turn |

**Sucesso:**

```text
{
  ok: true,
  cartas: [CartaIdentidade, CartaIdentidade],
  categoriaFeita: CategoriaId,
  linhaId: 'par_mais_alto' | 'trinca_do_par' | 'straight' | 'flush' | 'rotulo'
}
```

`categoriaFeita` = `avaliarMelhor5([...cartas, ...comunitarias]).categoriaId` (sem a próxima carta).

**Falha:** `{ ok: false }` — MUST NOT lançar até a UI. MUST NOT converter falha em cartas vazias.

### 2.1 Receita (RN-055)

Texturas aplicáveis (pode haver mais de uma). Se duas se aplicam, fica a cuja melhor 5 **atual** for a mais forte. Se uma textura não montar com 2 cartas livres, descarta e tenta a seguinte nessa ordem de força.

| Textura do board | Cartas pedidas |
|------------------|----------------|
| 3+ do mesmo naipe | dois ranks mais altos daquele naipe ainda livres |
| 4 ranks únicos em sequência (wheel A-2-3-4 ok; wrap K-A-2-3 proibido) | as que completam a sequência **mais alta** possível; se só uma falta, a segunda = melhor kicker livre |
| Board pareado | uma do par de rank maior + melhor kicker livre |
| Senão | uma do maior rank do board + melhor kicker livre (Ás se couber) |

“Melhor kicker” = maior rank ainda livre. Vários naipes do mesmo rank → ordem canônica. Descer o rank do “par mais alto” só se o herói esgotou o rank alvo.

As 2 cartas MUST NOT repetir hole do herói nem o board. Hole reais de A/B **não** entram na receita.

O flop MUST NOT ser reutilizado no turn: o chamador MUST invocar de novo com 4 comunitárias.

### 2.2 `linhaId`

| `categoriaFeita` | `linhaId` |
|------------------|-----------|
| `par` | `par_mais_alto` |
| `trinca` | `trinca_do_par` |
| `straight` | `straight` |
| `flush` | `flush` |
| qualquer outra | `rotulo` |

MUST NOT devolver o texto pt-BR (o quiz mapeia). MUST NOT listar as 2 cartas nem o kicker.

---

## 3. `baralhoProximaCarta({ holeHeroi, comunitarias, assumidas })`

Retorno: `CartaIdentidade[]` = (`RANKS × NAIPES`) − hole herói − comunitárias − `assumidas` (2).

| Street | `comunitarias.length` | Tamanho |
|--------|----------------------|---------|
| flop | 3 | **45** |
| turn | 4 | **44** |

Regras:

- Inclui holes de A/B se essas identidades **não** estão nas assumidas nem nas visíveis.
- MUST NOT subtrair burns.
- MUST NOT mutar os arrays de entrada.
- Length fora de 45/44 é falha para `avaliarDescontoStreet`.

---

## 4. `avaliarDescontoStreet({ holeHeroi, comunitarias })`

Única chamada que o quiz precisa no pouso da street.

**Sucesso:**

```text
{
  ok: true,
  categoriaAtual: CategoriaId,
  vilao: { cartas, categoriaFeita, linhaId },
  upgrades: CategoriaId[],          // RN-057, forte → fraco; 0..9; sem carta_alta
  outs: CartaIdentidade[],          // RN-061; [] se upgrades vazia
  ranks: RankId[],                  // RN-062; [] se upgrades vazia
  n: number,                        // outs.length; 0 só se upgrades vazia
  odd: { x: number, rotulo: string } | null   // null se upgrades vazia
}
```

MUST NOT incluir `chaveDesempate`, runouts, stack ou texto de kicker. MUST NOT persistir.

**Falha:** `{ ok: false }` se hole ≠ 2, comunitárias ∉ {3,4}, vilão falhar, baralho ≠ 45/44, identidades inválidas/duplicadas nas visíveis, `avaliarMelhor5` lançar, ou N/ranks/X não fecharem quando `upgrades.length ≥ 1`.

### 4.1 Mão atual

`categoriaAtual` = `avaliarMelhor5([...holeHeroi, ...comunitarias]).categoriaId`.

### 4.2 Horizonte (RN-069)

Para cada carta `c` em `baralhoProximaCarta`:

- Herói = `avaliarMelhor5([...holeHeroi, ...comunitarias, c])`
- Vilão = `avaliarMelhor5([...vilao.cartas, ...comunitarias, c])`
- Comparar `chaveDesempate` (reuso 004). Herói vence **estritamente** ⇔ chave herói > chave vilão.

MUST NOT enumerar pares (flop histórico 005). MUST NOT testemunhar a melhor 5 intermediária de 6 no flop.

### 4.3 Filtro RN-057

C entra em `upgrades` se e somente se existe ≥1 `c` tal que:

1. categoria do herói após `c` é **exatamente C**;
2. C é estritamente mais forte que `categoriaAtual`;
3. C ≠ `carta_alta`;
4. herói vence estritamente o vilão após `c`.

### 4.4 Outs, ranks, odd

Se `upgrades` é vazia: `outs = []`, `ranks = []`, `n = 0`, `odd = null`. MUST NOT inventar N para o quiz cobrar 5.8.

Se `upgrades` ≥ 1: `n` MUST ser ≥ 1. `odd = oddDaProximaCarta(n)`. Se `n < 1` ou `odd` não fechar → `{ ok: false }`.

Rank entra em `ranks` se ≥1 out daquele `RankId`. Ordem de `ranks` MAY ser a de `RANKS`; o quiz embaralha o visual.

### 4.5 Early-out

MAY parar de procurar **novas categorias** quando todas as mais fortes que a atual já foram testemunhadas **como upgrade vencedor**. MUST NOT pular a enumeração de outs: cada carta do baralho da próxima carta MUST ser classificada como out ou não.

---

## 5. `oddDaProximaCarta(n)`

P = min(2 × n, 100); X = 50/n − 1; X inteiro, 0,5 para baixo.

| n | X:1 | n | X:1 | n | X:1 | n | X:1 |
|---|-----|---|-----|---|-----|---|-----|
| 1 | 49:1 | 6 | 7:1 | 11 | 4:1 | 16 | 2:1 |
| 2 | 24:1 | 7 | 6:1 | 12 | 3:1 | 17 | 2:1 |
| 3 | 16:1 | 8 | 5:1 | 13 | 3:1 | 18 | 2:1 |
| 4 | 11:1 | 9 | 5:1 | 14 | 3:1 | 19 | 2:1 |
| 5 | 9:1 | 10 | 4:1 | 15 | 2:1 | 20 | 1:1 |

n > 20: a mesma fórmula. n ≥ 1. MUST NOT usar regra do 4. Retorno `{ x, rotulo: `${x}:1` }`.

Casos âncora: n=4 → 11:1; n=9 → 5:1 (não 4:1); n=10 → 4:1.

---

## 6. Conjuntos de opções (sem shuffle)

### 6.1 `conjuntoOpcoesUpgrade({ upgrades })`

Idêntico ao teto 6 da 005, com entrada = RN-057. 0 upgrades → MUST NOT ser chamado (skip é do quiz). 1–5 + distratoras forte→fraco. ≥6 → só os 6 mais fortes. Mesma entrada → mesmo conjunto.

### 6.2 `conjuntoOpcoesQuantidade({ n })`

6 inteiros distintos em 1–47 incluindo `n` (n ∈ 1..47). Distratoras: preferir n±1, n±2 e {4, 5, 8, 9, 12, 15}, sem repetir; o que faltar = inteiro mais próximo ainda livre no intervalo. Ordem de `ids` estável (canônica crescente); G008 é do quiz.

### 6.3 `conjuntoOpcoesOdd({ x })`

6 razões distintas `{ valor: number, rotulo: 'V:1' }` incluindo `{ x, rotulo: `${x}:1` }`. Distratoras: x±1 (se x−1 ≥ 0) e {2, 3, 4, 5, 9, 11}, sem repetir o correto. Ordem estável.

### 6.4 Ranks

O quiz monta os 13 rótulos; o motor só devolve `ranks` verdadeiros. MUST NOT recortar a 6.

---

## 7. `enumerarUpgrades` (005)

O contrato 005 (47/46, testemunha das 7, “adversário não desconta”) **não vale mais**.

Se a função permanecer exportada, MUST delegar a `avaliarDescontoStreet` e devolver só `{ ok, categoriaAtual, upgrades }` já **descontados**, horizonte = próxima carta. Testes 005 históricos MUST ser substituídos nesta feature, não “corrigidos” na pasta 005.

---

## 8. `quemGanhou` (006)

MUST permanecer com a assinatura e a semântica da 006. MUST NOT ganhar parâmetro de vilão. MUST NOT ler assumidas.

---

## 9. Proibições

- Lib de poker, CDN, WASM de terceiros, Worker remoto, lookup tables grandes
- Consumir, reordenar ou reler o baralho vivo / sapato
- Virar carta hipotética no feltro
- Gravar vilão, outs, ranks, N, razão, snapshot, Melhor5 ou kickers em `localStorage` / log
- Devolver texto com kicker, “par de ases”, draw/gutshot/Pot Odds/regra do 4
- Tratar burn como carta retirada
- Tratar as 2 assumidas como cartas de jogo das 11
- Usar hole reais de A/B na receita
- Reutilizar o snapshot do flop no turn
- Filtrar C só por “ainda possível” sem o teste do vilão
- Declarar vencedor do pote com o vilão assumido
- Pergunta / enumeração de 5.4/5.8 com 5 comunitárias (river)

---

## 10. Casos de contrato (automatizáveis)

1. CA-033: herói K♣ Q♦, flop 10♠ 9♦ 5♣ → vilão = par mais alto; `linhaId === 'par_mais_alto'`; `upgrades` contém `par` e `straight`; um par de 9 ou de 5 sozinho não remove `par`.
2. Nesse caso, `n === 10`; `ranks` = {K, Q, J}; `odd.rotulo === '4:1'`.
3. CA-034: única forma de completar Par perde do vilão → `par` ∉ `upgrades`.
4. CA-039: Flush só runner-runner no flop → `flush` ∉ `upgrades`.
5. CA-044: `oddDaProximaCarta(4).rotulo === '11:1'`; `oddDaProximaCarta(9).rotulo === '5:1'`.
6. CA-045: 4 Valetes no baralho da próxima carta, 2 limpos e 2 sujos → `n` inclui 2 (não 4); `J` ∈ `ranks`.
7. RN-074: herói já com Par + Rei que vence o vilão → `par` ∉ `upgrades`; `K` ∈ `ranks` se a carta for out.
8. Turn: `sintetizarVilaoAssumido` com 4 comunitárias devolve cartas **diferentes** das do flop quando a receita muda; MUST NOT exigir igualdade com o flop.
9. Board com dois pares cuja melhor 5 assumida é Full house → `categoriaFeita === 'full_house'`; `linhaId === 'rotulo'`.
10. Empate hipotético com o vilão → carta ∉ `outs`; C testemunhada só nesse empate ∉ `upgrades`.
11. Royal no desfecho → testemunha só `royal_flush`.
12. `carta_alta` ∉ `upgrades` em 100% dos casos.
13. Herói já à frente e nenhuma carta vence → `upgrades` vazia, `n === 0`, `odd === null`, `ok: true`.
14. `holeHeroi` length 1 ou `comunitarias` length 2 ou 5 → `{ ok: false }`.
15. Cada uma das 9 categorias Royal flush … Par é upgrade vencedor em ≥1 fixture; Carta alta em 0.
16. `avaliarDescontoStreet` **não** muta os arrays de entrada.
17. Naipe empatado: primeira carta do rank pedido é o naipe mais cedo em `NAIPES`.
18. `quemGanhou` com holes reais **não** muda quando o vilão da street existe em memória.
