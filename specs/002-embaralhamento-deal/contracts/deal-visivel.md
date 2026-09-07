# Contract: Deal visível e revelação por street

**Feature**: `002-embaralhamento-deal`  
**Tipo**: contrato de UI / DOM  
**Stack**: ADR-005 (cartas já existentes), palco da 001  
**Complementa**: [baralho.md](./baralho.md), [hud-montagem.md](./hud-montagem.md), [mesa-visual.md](../../001-mesa-imersiva/contracts/mesa-visual.md)

O casco visual permanece. Este contrato substitui a **fonte** das 11 faces stub e a **ordem** do deal das hole cards.

Atributos de teste já estáveis: `data-seat`, `data-hole`, `data-slot`, `data-card-role`, `data-face`, `data-rank`, `data-suit`, `data-burn`.

---

## 1. Pré-condição

A permutação RN-044 está **pronta** antes do primeiro movimento de carta. Teatro extra de “cartas misturando no feltro” **MUST NOT** ser adicionado nesta feature. Com `prefers-reduced-motion: reduce`, hole cards aparecem já nos assentos (corte imediato).

Após gesto bem-sucedido (**Nova mão**, ou **Próxima mão** com feltro já limpo) e montagem `ok`, o deal visível **começa em menos de 1 segundo**.

---

## 2. Ordem do deal das hole cards

MUST ser **por assento**, duas cartas, nesta ordem:

1. `data-seat="adversarioA"` — `data-hole="0"` e `"1"` (versos)
2. `data-seat="adversarioB"` — idem (versos)
3. `data-seat="voce"` — ao pousar, `data-face="up"`

MUST NOT: uma carta por volta (A-B-Você-A-B-Você). MUST NOT: começar pelo herói (comportamento do stub 001).

Identidades:

- A ← permutação `[0]`, `[1]`
- B ← `[2]`, `[3]`
- Você ← `[4]`, `[5]`

Esquerda/direita no leque MAY seguir par = esquerda (padrão).

Enquanto as holes voam: HUD `deal`, 0 opções, 0 CTA. Clique ignorado (casco).

---

## 3. Board vazio após o deal (CA-008)

Quando as seis hole cards pousaram e a street flop **ainda não** começou:

- `data-slot="1|2|3|4|5"` visíveis e **sem** `.carta` (nem face nem verso)
- 0 perguntas no HUD

A reserva `[6]…[10]` existe só nos dados da `MaoTreino`.

---

## 4. Streets comunitárias (sem reembaralhar)

| Evento do casco | O que abre | O que NÃO muda |
|-----------------|------------|----------------|
| Início da street flop | `[6][7][8]` face-up nos slots 1–3 | holes; slots 4–5 vazios |
| Início da street turn | `[9]` face-up no slot 4 | flop; slot 5 vazio |
| Início da street river | `[10]` face-up no slot 5 | flop e turn |

MUST NOT chamar `embaralhar` / `montarMao` nesses eventos. MUST NOT sortear a carta do slot na hora. MUST NOT deslocar a permutação.

---

## 5. Burn cênico (RN-G007 / RN-045)

Como na 001: verso breve em `[data-burn]` no turn e no river.

- MUST NOT ocupar `data-slot` 1–5
- MUST NOT ter `data-rank` / `data-suit` de jogo
- MUST NOT consumir permutação `[11]` nem qualquer 12ª carta
- Ausência do burn (se o palco for usado sem ele) **não** invalida a mão

---

## 6. Showdown (RN-012)

No início do showdown (river pousado + virada):

- A e B passam de `data-face="down"` para `"up"`
- `data-rank` / `data-suit` **iguais** aos atribuídos no deal
- MUST NOT substituir hole cards por um novo par

As 11 identidades da mão permanecem as do shuffle inicial.

---

## 7. Próxima mão

1. Recolher até **zero** `.carta` nos assentos e slots vazios.
2. Só então `montarMao` (nova permutação).
3. Deal das holes na ordem §2.

MUST NOT aplicar faces novas sobre cartas ainda visíveis da mão anterior.

---

## 8. Substituição do stub

Nenhuma mão iniciada com sucesso MAY pintar o ciclo fixo `A♠ K♥ Q♦ J♣ 10♥ 9♠ 8♦ 7♣ 6♥ 5♠ 4♦` como fonte permanente. Faces vêm de `cartasDeJogo`.

Unicode U+1F0A0… e emoji como carta principal continuam vedados (ADR-005).

---

## 9. Casos de contrato (manual / DOM)

1. Deal A (2) → B (2) → Você (2); herói aberto; A/B fechados.
2. Após holes: 5 slots vazios, 0 quiz.
3. Flop = `[6][7][8]`; turn não altera flop; river não altera flop/turn.
4. Burn fora dos slots; 11 cartas de jogo.
5. Virada A/B = mesmas identidades do deal.
6. Reduced motion: cartas no lugar, sem teatro de shuffle, identidades já determinadas.
7. Dez mãos: sequências das 11 não todas idênticas (CA-006).
