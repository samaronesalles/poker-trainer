# Contract: Quiz consome o motor (flop/turn do herói)

**Feature**: `004-mao-atual`  
**Tipo**: contrato de UI / domínio no cliente (sem HTTP)  
**Módulo**: `js/quiz.js` (**alter**; contrato 003 permanece para retry/storage)  
**Consumidores**: `js/mesa.js`, testes `quiz.test.js` / `hud-session.test.js`  
**Motor**: [motor.md](./motor.md)  
**Persistência**: inalterada — [003 storage](../../003-feedback-persistencia/contracts/storage.md)

Não há API de rede. Cadência de passos da 003 **não** muda.

---

## 1. O que muda vs. 003

| Passo | 003 (stub) | 004 |
|-------|------------|-----|
| `flop_hero` | 6 faces fixas; certa = Flush | Motor: Melhor5 das 5 visíveis + RN-017; certa = categoria real |
| `turn_hero` | idem Flush | Motor: Melhor5 das 6 visíveis + RN-017 |
| `flop_upgrade` | stub Flush verdadeiro | **Inalterado** (005) |
| `turn_skip` | skip | **Inalterado** |
| `river_hero` | certa = Flush | **Inalterado** (006) — MUST NOT chamar o motor |
| `river_a` / `river_b` | Par | **Inalterado** |
| `river_vencedor` | stub | **Inalterado** |

Copy canônica, clique-submete, morta, G008, beat, 1ª tentativa imediata: **iguais** à 003.

---

## 2. Extração de cartas (quiz, não mesa)

A partir de `sessao.mao.cartasJogo` e `sessao.mao.street`:

| Passo | Visíveis ao herói | Board para RN-017 |
|-------|-------------------|-------------------|
| `flop_hero` | índices `[4],[5],[6],[7],[8]` | `[6],[7],[8]` |
| `turn_hero` | `[4],[5],[6],[7],[8],[9]` | `[6],[7],[8],[9]` |

MUST NOT passar `[0]..[3]` (adversários) nem burn. MUST NOT usar `[10]` nestes dois passos.

Fluxo ao `apresentarPergunta(flop_hero|turn_hero)`:

1. Extrair visíveis + board.
2. `melhor = avaliarMelhor5(visiveis)`.
3. `ids = conjuntoOpcoesMaoAtual({ categoriaId: melhor.categoriaId, board })`.
4. Mapear ids → opções `{ id, rotulo }` via `CATEGORIAS` do motor (rótulo RN-014).
5. `shuffleOpcoes` (RNG injetável existente). MUST NOT chamar `baralho.js`.
6. `sessao.mao.corretaUnica = melhor.categoriaId`.
7. MUST NOT copiar `chaveDesempate` para o HUD, `aria-*`, feedback ou storage.

---

## 3. Primeira tentativa (`mao_atual`)

Contrato 003: só a 1ª submissão grava, na **correta** desta pergunta.

Implicações desta feature:

- Acerto/erro incrementa `mao_atual[corretaUnica]` real (Par, Flush, …), não mais Flush cego.
- Chutar distratora **não** incrementa a distratora (RN-019).
- Flop e turn da **mesma** mão = duas exposições; MUST NOT fundir deltas; MUST NOT pular o turn se a categoria não mudou.

Fail-open: se `storage` falhar, o quiz e o motor seguem (003).

---

## 4. O que o HUD MUST NOT fazer nesta feature

- Perguntar a mão do herói no river (além do `river_hero` stub já existente — **não** duplicar).
- Abrir turn após acerto de `flop_hero` (ainda vai a `flop_upgrade`).
- Abrir river após acerto de `turn_hero` (ainda vai a `turn_skip`).
- Mostrar kicker, “par de reis”, “Sequência”, naipe por extenso.
- Botão Confirmar em `flop_hero` / `turn_hero`.
- Pular / revelar a certa.
- `alert()`.
- Importar lib de poker.
- `mesa.js` chamar `localStorage` ou `motor.js`.

---

## 5. Testes de integração (automatizáveis)

Além de [motor.md](./motor.md) §6:

1. Flop pousado → enunciado **Qual mão você tem agora?**; 6 rótulos RN-014 distintos; 0 Confirmar; `corretaUnica` = Melhor5 das 5 cartas do herói.
2. Fixture de par no flop: única verdadeira = `par`; 1ª tentativa acerto → `mao_atual.par` +1 acerto (CA-010).
3. 1ª tentativa errada → erro na categoria **correta**, não na distratora; morta no lugar; G008 estável (CA-011).
4. Acerto flop + beat → `flop_upgrade`, não turn (CA-012).
5. Turn pousado → nova pergunta; 6 opções; certa = melhor 5 das 6; 1ª tentativa **nova** mesmo se o id coincidir com o flop (SC-012).
6. Acerto turn + beat → `turn_skip`, não river e não segunda mão-atual na street (FR-014).
7. `river_hero` continua certa stub **Flush**; motor não determina essa pergunta (CA-027 / FR-015).
8. Dez apresentações novas: índice da certa não constante; retry não reembaralha.
9. Opções: 0 kickers / 0 sinônimos (varredura dos rótulos exibidos).
10. Quiz MUST NOT chamar `embaralhar` / gravar cartas.
