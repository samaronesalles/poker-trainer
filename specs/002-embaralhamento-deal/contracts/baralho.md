# Contract: Módulo `js/baralho.js`

**Feature**: `002-embaralhamento-deal`  
**Tipo**: contrato de módulo ES (sem HTTP)  
**Stack**: ADR-004 (Web Crypto + pool, Fisher–Yates), ADR-006  
**Consumidores**: `js/mesa.js`, `tests/contract/baralho.test.js`  
**Modelo**: [data-model.md](../data-model.md)

Não há API de rede. Não há lib de poker. MUST NOT importar `quiz-stub`, `audio` ou DOM.

---

## 1. Baralho padrão

Fábrica pura, determinística, sem RNG:

```text
criarBaralhoPadrao() → CartaPadrao[52]
```

- 13 ranks × 4 naipes; 0 coringas.
- Identidades distintas (`rank` + `naipe`).
- Ordem de fábrica estável (para testes): naipes `espadas`, `copas`, `ouros`, `paus`; ranks `A,K,Q,J,10,9,8,7,6,5,4,3,2`.

---

## 2. Pool / mistura da visita

```text
criarMisturaVisita() → MisturaVisita
misturarCursor(mistura, clientX, clientY) → void
  # mistura no buffer e NÃO retém as coordenadas
misturarRelogio(mistura, agoraMs, tickMs) → void
```

Regras:

- Buffer compacto (ex. 32 bytes). MUST NOT acumular trajetória.
- `misturarCursor` pode ser no-op seguro se x/y não forem finitos.
- Sem `localStorage` / cookies / I/O.

O orquestrador (`mesa.js`) registra `pointermove` no boot e chama `misturarCursor`. Recarregar descarta a mistura (nova `criarMisturaVisita` no boot).

---

## 3. Embaralhar

```text
embaralhar(baralho52, mistura, rng?) → CartaPadrao[52]
```

- Cópia permutada (MUST NOT mutar o array de fábrica compartilhado).
- Fisher–Yates; inteiro uniforme por rejection sampling.
- Cada passo: bytes de `rng` XOR pool (ou só pool se `rng` ausente).
- `rng` injetável nos testes. Em produção:
  - se `crypto.getRandomValues` existir → usá-lo;
  - senão → só pool; **não** lançar; **não** sinalizar falha de montagem.

`Math.random()` MUST NOT ser a fonte das 52 em produção.

Uma chamada por mão. Streets MUST NOT chamar `embaralhar` de novo.

---

## 4. Mapeamento RN-044

```text
cartasDeJogo(permutacao52) → CartaDeJogo[11]
```

| Índice | `papel` | Dono / slot |
|--------|---------|-------------|
| 0, 1 | hole | adversarioA |
| 2, 3 | hole | adversarioB |
| 4, 5 | hole | voce |
| 6, 7, 8 | comunitaria | flop slots 1–3 |
| 9 | comunitaria | turn slot 4 |
| 10 | comunitaria | river slot 5 |

As 41 cartas `[11]…[51]` **não** são retornadas aqui. Não há API que “queira” uma 12ª carta de jogo para burn.

---

## 5. Validar e montar

```text
validarPermutacao(cartas) → ResultadoMontagem
montarMao(mistura, rng?) → ResultadoMontagemBaralho
```

`montarMao`:

1. `criarBaralhoPadrao()`
2. `misturarRelogio` com relógio atual
3. `embaralhar`
4. `validarPermutacao`
5. se `ok` → `{ status: 'ok', permutacao, cartasJogo }`;
   senão → `{ status, permutacao: null, cartasJogo: null }`

Falha (`incompleto` | `duplicata` | `mapeamento_impossivel`) **não** inclui “crypto ausente”.

MUST NOT filtrar permutações por “pote empataria” ou “igual à mão anterior”.

---

## 6. Privacidade e custo

| Proibido | Obrigatório |
|----------|-------------|
| Enviar permutação/pool a servidor | Tudo local |
| Persistir baralho ou cursor | Só memória de visita |
| Pedir nome/e-mail/CPF | — |
| API paga de entropia | Web Crypto nativo + pool |
| Histórico de coordenadas | Mix compacto |

---

## 7. Casos de contrato (automatizáveis)

1. `criarBaralhoPadrao()` tem 52 identidades únicas.
2. `embaralhar` devolve 52 únicas; não é sempre a ordem de fábrica em 10 chamadas seguidas (com RNG real ou injetado não-constante).
3. `cartasDeJogo` mapeia A/B/herói/flop/turn/river como a tabela.
4. Índices 11–51 não aparecem em `cartasDeJogo`.
5. Sem `crypto`, `embaralhar` / `montarMao` ainda retornam 52 cartas (pool).
6. Permutação artificial com duplicata → `validarPermutacao` ≠ `ok`.
7. Módulo não referencia `localStorage` nem `document`.
8. Nenhuma ramificação que descarte shuffle por “empate de pote”.
