# Contract: Motor de showdown (`quemGanhou`)

**Feature**: `006-showdown-vencedor`  
**Tipo**: contrato de domínio no cliente (sem HTTP)  
**Módulo**: `js/motor.js` (**alter**; ADR-003)  
**Consumidores**: `js/quiz.js` (preparação do river), testes `tests/contract/motor.test.js`  
**Modelo**: [data-model.md](../data-model.md)  
**Integração HUD**: [quiz-showdown.md](./quiz-showdown.md)

Não há API de rede. Nenhuma biblioteca de poker. Sem persistência. `mesa.js` MUST NOT importar este módulo.

Reusa `avaliarMelhor5`, `conjuntoOpcoesMaoAtual`, `CATEGORIAS` e `SEQUENCIAS_LEGAIS` da 004. MUST NOT alterar a semântica do enumerador 005.

---

## 1. Tipos de carta

Entrada: `{ rank, naipe }` com o alfabeto de `js/baralho.js` (`RANKS`, `NAIPES`).

O motor MAY importar `RANKS` / `NAIPES`. MUST NOT importar `embaralhar`, mistura, DOM, `quiz.js` ou `storage.js`.

---

## 2. `UNIVERSO_POTE`

Exportar array congelado de 7 itens `{ id: VencedorId, rotulo }`, nesta ordem de prioridade RN-031:

1. `{ id: 'voce', rotulo: 'Você' }`
2. `{ id: 'adversarioA', rotulo: 'Adversário A' }`
3. `{ id: 'adversarioB', rotulo: 'Adversário B' }`
4. `{ id: 'voce_a', rotulo: 'Você e Adversário A' }`
5. `{ id: 'voce_b', rotulo: 'Você e Adversário B' }`
6. `{ id: 'a_b', rotulo: 'Adversário A e Adversário B' }`
7. `{ id: 'tres', rotulo: 'Os três empatam' }`

Rótulos MUST ser exatamente esses. MUST NOT haver 8º texto.

---

## 3. `quemGanhou({ holeVoce, holeA, holeB, comunitarias })`

| Campo | Aridade | Origem RN-044 (quiz, não motor) |
|-------|---------|----------------------------------|
| `holeVoce` | 2 | `[4],[5]` |
| `holeA` | 2 | `[0],[1]` |
| `holeB` | 2 | `[2],[3]` |
| `comunitarias` | 5 | `[6]..[10]` |

**Validação** (qualquer falha → `{ ok: false }`, sem throw até a UI):

- Arrays presentes com as aridades acima.
- Cada carta tem `rank`/`naipe` do alfabeto.
- As 11 identidades `rank-naipe` são distintas.

**Cálculo** se válido:

1. `maos.voce = avaliarMelhor5([...holeVoce, ...comunitarias])` (7 cartas). Idem A e B.
2. Comparar `chaveDesempate` lexicograficamente (maior vence). Empate de chave = empate daqueles jogadores.
3. `vencedores` = assentos com chave máxima, ordem `voce` → `adversarioA` → `adversarioB`.
4. `vencedorId` = mapeamento 1-para-1 da tabela em [data-model.md](../data-model.md).

**Retorno feliz:**

```text
{
  ok: true,
  maos: { voce: Melhor5, adversarioA: Melhor5, adversarioB: Melhor5 },
  vencedorId: VencedorId,
  vencedores: AssentoId[]   // length 1, 2 ou 3
}
```

**Retorno de falha:** `{ ok: false }`. MUST NOT incluir `vencedorId: 'tres'` por falha. MUST NOT incluir runouts, dump serializável extra, nem log.

Naipe MUST NOT desempatar. Wheel / wrap / royal seguem a 004. Jogar a mesa (0 hole na melhor 5) é legal.

---

## 4. `conjuntoOpcoesVencedor(vencedorId)`

**Entrada:** um `VencedorId` válido.

**Retorno:** array de **exatamente 6** `VencedorId` distintos, incluindo a correta. **Sem** shuffle (G008 é do quiz).

Algoritmo:

1. `ids = [vencedorId]`.
2. Percorrer `UNIVERSO_POTE` na ordem 1..7; incluir cada id ainda ausente até length 6.
3. O 7º que não couber não retorna.

Implicações testáveis:

- Correta `tres` → conjunto = `tres, voce, adversarioA, adversarioB, voce_a, voce_b` (`a_b` fora).
- Correta qualquer outra → `tres` é o 7º e fica fora; as 5 distratoras são os primeiros da lista que não são a correta.

Mesmo `vencedorId` → mesmo conjunto (ordem de inserção da prioridade; a ordem **visual** é outra função).

`vencedorId` inválido: `{ ok: false }` não se aplica aqui — o quiz só chama com id vindo de `quemGanhou` ok. Testes MAY tratar id inválido como array vazio ou throw de programação; MUST NOT inventar 6 textos.

---

## 5. Reuso de `conjuntoOpcoesMaoAtual`

Nas três perguntas de categoria do river o quiz chama `conjuntoOpcoesMaoAtual({ categoriaId, board })` com `board` = as **5** comunitárias. A heurística RN-017 da 004 **não muda**. MUST NOT usar `enumerarUpgrades` / “ainda possível”.

---

## 6. Proibições

- Lib de poker, CDN, WASM de terceiros, lookup tables grandes
- Backend / worker remoto
- Gravar em `localStorage` / log de mãos / dump da comparação
- Devolver texto com kicker, naipe por extenso ou “par de ases”
- Tratar burn como carta de jogo
- Filtrar empate ou “board que joga”
- Alterar `avaliarMelhor5` / enumerador 005 neste contrato (salvo regressão)
- Inventar vencedor ou `tres` por falha

---

## 7. Casos de contrato (automatizáveis)

1. Mesma categoria, kicker do herói estritamente melhor, A/B atrás → `vencedorId === 'voce'`.
2. Empate verdadeiro herói vs A (chaves iguais), B atrás → `voce_a` (CA-020).
3. 5 comunitárias A-K-Q-J-10 suited → três `royal_flush` e `tres` (SC-008). Nunca rótulo Straight flush.
4. Wheel (A-2-3-4-5) vs six-high (2-3-4-5-6), ambos Straight → six-high vence (SC-010).
5. Wrap K-A-2-3-4 como única “quase sequência” → categoria **não** é `straight` nem `straight_flush`.
6. Dois Flush com ranks efetivos diferentes → vence a melhor sequência de cinco ranks; naipe não desempatar; rótulo das duas continua **Flush**.
7. Mesma categoria e mesmos ranks, naipes diferentes → empate daqueles jogadores.
8. A-2-3-4-5 suited → `straight_flush`, nunca royal.
9. Board “forte” mas um jogador monta 5 estritamente melhor que a mesa → esse jogador vence (não `tres` só porque o board é forte).
10. Jogar a mesa (melhor 5 = as 5 comunitárias) é legal e a categoria é a da mesa.
11. Cada um dos 7 `VencedorId` é o retorno de ≥1 fixture (SC-015).
12. Cada um dos 10 `CategoriaId` é a certa de ≥1 jogador em ≥1 fixture de 7 cartas de river (SC-015).
13. `conjuntoOpcoesVencedor('tres')` tem 6 ids, inclui `tres`, exclui `a_b`.
14. `conjuntoOpcoesVencedor('voce')` tem 6 ids, inclui `voce`, exclui `tres`.
15. Input com duplicata / aridade errada / naipe inválido → `{ ok: false }`; 0 campo `vencedorId`.
16. Retorno feliz MUST NOT conter chave `runouts`; `chaveDesempate` MAY existir dentro de `maos.*` (memória) mas testes de persistência (quiz/storage) MUST NOT a serializar.
