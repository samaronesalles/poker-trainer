# Contract: Catálogo ilustrativo da colinha

**Feature**: `007-colinha-classificacao`  
**Tipo**: contrato de dados constantes (sem HTTP, sem I/O)  
**Módulo**: `js/colinha.js` (`LINHAS_COLINHA`)  
**Consumidores**: render do overlay; testes `tests/contract/colinha.test.js`  
**Modelo**: [data-model.md](../data-model.md)

O catálogo é a única fonte das dez linhas. MUST NOT ser calculado pelo motor, MUST NOT ler `cartasJogo`, MUST NOT mudar entre mãos.

---

## 1. Superfície

| Export | Contrato |
|--------|----------|
| `LINHAS_COLINHA` | `FrozenArray` de 10 `LinhaCategoria`, ordem 1→10 |
| `ROTULO_TITULO` | `'Classificação de mãos'` |
| `ROTULO_MELHOR` | `'Melhor'` |
| `ROTULO_PIOR` | `'Pior'` |
| `ROTULO_OCULTAR` | `'Ocultar'` |
| `ROTULO_COLINHA` | `'Colinha'` |

MUST NOT exportar função que embaralhe, recorte ou substitua faces para “descoincidir” do feltro.

---

## 2. Faces congeladas

Naipes: `espadas` `copas` `ouros` `paus`. Ranks: `A` `K` `Q` `J` `10` `9` `8` `7` `6` `5` `4` `3` `2`.

| ordem | id | rótulo | cartas (`rank`/`naipe`) | esmaecidas (índice 0-based) |
|------:|----|--------|-------------------------|-----------------------------|
| 1 | `royal_flush` | Royal flush | A/espadas, K/espadas, Q/espadas, J/espadas, 10/espadas | — |
| 2 | `straight_flush` | Straight flush | 9/copas, 8/copas, 7/copas, 6/copas, 5/copas | — |
| 3 | `quadra` | Quadra | 8/espadas, 8/copas, 8/ouros, 8/paus, K/espadas | 4 |
| 4 | `full_house` | Full house | K/espadas, K/copas, K/ouros, 4/espadas, 4/copas | — |
| 5 | `flush` | Flush | A/paus, J/paus, 9/paus, 6/paus, 3/paus | — |
| 6 | `straight` | Straight | 9/espadas, 8/copas, 7/ouros, 6/paus, 5/espadas | — |
| 7 | `trinca` | Trinca | Q/espadas, Q/copas, Q/ouros, 9/paus, 4/espadas | 3, 4 |
| 8 | `dois_pares` | Dois pares | J/espadas, J/copas, 6/ouros, 6/paus, 2/espadas | 4 |
| 9 | `par` | Par | 10/espadas, 10/copas, A/ouros, 8/paus, 3/espadas | 2, 3, 4 |
| 10 | `carta_alta` | Carta alta | A/espadas, K/ouros, 9/paus, 7/copas, 4/espadas | 1, 2, 3, 4 |

### Inequívoco (obrigatório)

- Royal ≠ Straight flush (AKQJT suited vs 98765 suited).
- Flush não é sequências (A-J-9-6-3).
- Straight não é flush (cinco naipes mistos).
- Straight não é circular (sem A-2-3-4-K).
- Carta alta não é sequências (A-K-9-7-4).
- Quadra tem exatamente um kicker esmaecido; Full house nenhum.

---

## 3. Proibições

- Sinônimos na UI: `Sequência`, `Um par`, `Straight flush real`, `Best`, `Worst`.
- Texto de kicker, naipe por extenso ou “par de reis”.
- Recalcular o conjunto se alguma face aparecer no feltro.
- Importar `js/motor.js` ou `js/baralho.js` para obter estas linhas.
- Incorporar, copiar pixel a pixel ou carregar por URL arte de infográfico de terceiros (RN-054).

---

## 4. Testes de contrato (Node)

1. `LINHAS_COLINHA.length === 10` e `ordem` = 1..10.
2. `rotulo` de cada linha é exatamente a tabela §2.
3. Cada linha tem 5 cartas; ranks/naipes no alfabeto.
4. `indicesEsmaecidos` coincide com a tabela (FR-003).
5. Fonte de `js/colinha.js` não contém `from './motor.js'` nem `from './baralho.js'`.
6. Fonte não contém `localStorage`, `sessionStorage` nem `document.cookie`.
