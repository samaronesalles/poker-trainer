# Contract: Motor de avaliação (melhor 5)

**Feature**: `004-mao-atual`  
**Tipo**: contrato de domínio no cliente (sem HTTP)  
**Módulo**: `js/motor.js` (**novo**; ADR-003)  
**Consumidores**: `js/quiz.js` (só `flop_hero` / `turn_hero`), testes `tests/contract/motor.test.js`  
**Modelo**: [data-model.md](../data-model.md)  
**Integração HUD**: [quiz-mao-atual.md](./quiz-mao-atual.md)

Não há API de rede. Nenhuma biblioteca de poker. Sem persistência. Sem enumerador de upgrades. Sem `quemGanhou`.

---

## 1. Tipos de carta

Entrada: array de `{ rank, naipe }` com o alfabeto de `js/baralho.js` (`RANKS`, `NAIPES`).

O motor MAY importar `RANKS` / `NAIPES`. MUST NOT importar `embaralhar`, mistura, DOM, `quiz.js` ou `storage.js`.

---

## 2. `avaliarMelhor5(cartas)`

| Aridade | Uso nesta feature |
|---------|-------------------|
| 5 | Flop do herói (única combinação) |
| 6 | Turn do herói (melhor 5 entre as 6) |
| 7 | Mesmo critério; **HUD não pergunta** (reserva 006 / testes) |

Outro length: MUST lançar (erro de programação).

**Retorno** (`Melhor5`):

```text
{
  cartas: [5 × { rank, naipe }],
  categoriaId: CategoriaId,
  rotulo: string,           // RN-014 exato
  chaveDesempate: number[]  // nunca serializar para UI/storage
}
```

Regras:

- Enumerar `C(n,5)` e escolher a maior `chaveDesempate`.
- Royal ≠ Straight flush (RN-015).
- Wheel legal; wrap ilegal (FR-006).
- Sempre exatamente uma categoria.
- MUST NOT ler holes que não foram passadas no array.

---

## 3. Taxonomia e sequências

Exportar `CATEGORIAS` (id, rótulo, ordem 1..10) e `SEQUENCIAS_LEGAIS` (10 conjuntos).

Rótulos visíveis MUST ser exatamente: Royal flush, Straight flush, Quadra, Full house, Flush, Straight, Trinca, Dois pares, Par, Carta alta.

---

## 4. `conjuntoOpcoesMaoAtual({ categoriaId, board })`

| Entrada | Significado |
|---------|-------------|
| `categoriaId` | Correta da Melhor5 |
| `board` | Comunitárias da street (3 no flop, 4 no turn) — **sem** hole |

**Retorno:** array de **exatamente 6** `CategoriaId` distintos, incluindo `categoriaId`. **Sem** shuffle (G008 é do quiz).

Heurística FR-009 / [data-model.md](../data-model.md) (vizinhas, tentadoras, preenchimento, descarte do excedente).

Predicados de textura MUST seguir as definições de `TexturaBoard` (conectado, SF só com naipe conectado, Quadra tentadora só com 3+ do mesmo rank).

Mesmas cartas + mesmo board → mesmo conjunto (ordem do array MAY ser a de inserção da heurística; a ordem **visual** é outra função).

---

## 5. Proibições

- Lib de poker, CDN, WASM de terceiros, lookup tables grandes
- Backend / worker remoto
- Comparar três jogadores / declarar split (006)
- Enumerar 47/46 para upgrades (005)
- Gravar em `localStorage` / log de mãos
- Devolver texto com kicker, naipe por extenso ou “par de ases”
- Tratar burn como carta de jogo
- Filtrar preenchimento por “ainda possível”

---

## 6. Casos de contrato (automatizáveis)

1. Flop 5 cartas com um par → `par`; rótulo **Par**.
2. 5 cartas A-K-Q-J-10 suited → `royal_flush`, não `straight_flush`.
3. A-2-3-4-5 suited → `straight_flush`, não royal.
4. A-2-3-4-5 offsuit → `straight`.
5. K-A-2-3-4 (e demais wraps FR-006) → não `straight` nem `straight_flush`.
6. 5 suited não consecutivas → `flush`.
7. Turn: combinação 1+4 **Dois pares** vs 2+3 **Par** → correta `dois_pares`.
8. Par de 2 vs par de Ás (mãos distintas) → ambas `par`.
9. As 10 categorias: cada uma é a única certa em ≥1 fixture de 5 ou 6 cartas (SC-013).
10. `avaliarMelhor5` com 7 cartas classifica; não é chamado pelo HUD desta feature.
11. Board 2-4-6 + certa ≠ Straight → `straight` no conjunto (tentadora). Board 2-4-7 → Straight **não** entra só por tentadora.
12. 3+ mesmo naipe conectado no naipe → `straight_flush` tentadora (se não for a certa). Connector só offsuit → não.
13. Board com trinca de rank → `quadra` tentadora (se não for a certa). Só um par no board → `quadra` não é tentadora.
14. Conjunto sempre length 6, inclui a certa, determinístico.
15. Royal **não** entra só por textura de board.
16. Length ∉ {5,6,7} lança.
