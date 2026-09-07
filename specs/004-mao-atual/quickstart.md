# Quickstart: validar mão atual no flop e no turn (feature 004)

Guia de validação ponta a ponta do **avaliador** e da **pergunta de mão atual** do herói. Upgrades, river e pote continuam o stub da 003.

Contratos: [motor.md](./contracts/motor.md), [quiz-mao-atual.md](./contracts/quiz-mao-atual.md). Modelo: [data-model.md](./data-model.md).

---

## Pré-requisitos

- Navegador atual (Chrome, Edge ou Firefox).
- Node.js 18+ para os testes de contrato.
- Python 3 ou `npx serve` para HTTP local.
- **Não** abrir `index.html` via `file://`.
- DevTools → Application → Local Storage da origem (chave `poker-trainer:evolucao`).

Arquivos esperados **após** `/speckit-implement` (ainda não precisam existir neste `/speckit-plan`):

- `js/motor.js` (**novo**)
- `js/quiz.js` atualizado (`flop_hero` / `turn_hero` consomem o motor)
- `tests/contract/motor.test.js` (**novo**)
- `tests/contract/quiz.test.js` e `hud-session.test.js` atualizados (sem Flush cego no flop/turn)

Casco 001 + baralho 002 + quiz/storage 003 já existentes. **Não** deve existir dependência npm de poker. **Não** deve existir backend.

---

## Subir o site

Na raiz do repositório:

```bash
python -m http.server 8080
```

Abrir `http://localhost:8080`. Viewport de referência: **1280×720**.

---

## Testes de contrato (sem bundler)

```bash
node --test tests/contract/
```

Esperado:

- [motor.md](./contracts/motor.md) §6 (10 categorias, royal ≠ SF, wheel, wrap, turn 1+4, RN-017, 7 cartas sem HUD).
- [quiz-mao-atual.md](./contracts/quiz-mao-atual.md) §5 (CA-010..013, duas exposições flop+turn, river stub).
- Testes 002/003 de baralho, storage, skip e upgrade stub **continuam** passando.
- MUST NOT reembaralhar as 52 ao permutar opções.

---

## Cenários manuais

Marcar cada item. Falha = feature incompleta.  
Não assumir que a certa é Flush: ler o feltro (2 hole abertas + comunitárias pousadas).

### S1 — Par no flop (CA-010, SC-001)

1. **Nova mão** até o flop pousar (opções só depois das 3 comunitárias).
2. Enunciado exatamente **Qual mão você tem agora?**; **6** categorias canônicas; **0** Confirmar.
3. Se a melhor 5 for um par: a única opção verdadeira é **Par** (não “par de reis”).
4. Acertar **Par** de primeira → “Você acertou”; DevTools: `mao_atual.par` +1 acerto, +0 erro.
5. Após o beat (≤1 s; 0 se reduzir movimento) → pergunta de upgrades **ou** o stub 5.4 — **não** vira o turn.

### S2 — Erro e retry (CA-011, SC-002, SC-007)

1. Errar de primeira numa distratora.
2. Copy exatamente **Não é essa. Tente de novo.**; ✕ no mesmo lugar; ordem estável; a certa **não** revelada.
3. Contador: +1 erro na **categoria correta**, 0 na distratora chutada.
4. Acertar em seguida **não** vira a exposição em acerto.

### S3 — Turn é pergunta nova (SC-009, SC-012, FR-014)

1. Concluir flop (mão atual + upgrade stub).
2. Turn pousa → **de novo** “Qual mão você tem agora?” (mesmo se o rótulo não mudou).
3. A certa é a melhor 5 entre as **6** (pode ser 1 hole + 4 comunitárias).
4. 1ª tentativa grava **outra** exposição em `mao_atual`.
5. Acerto + beat → **Não há upgrade possível.** + Continuar — **não** abre o river nesta street.

### S4 — Royal, wheel, wrap (SC-005, SC-006)

Validar via `node --test` (fixtures) e, se a mão aleatória cair, no feltro:

- A-K-Q-J-10 suited → **Royal flush**, nunca Straight flush.
- A-2-3-4-5 suited → **Straight flush**, nunca royal.
- A-2-3-4-5 offsuit → **Straight**.
- Wrap (K-A-2-3-4 etc.) → **não** Straight / Straight flush.

### S5 — Seis opções e G008 (CA-013, SC-004, SC-008)

1. Sempre 6 rótulos da tabela oficial; certa inclusa; 0 sinônimos; 0 kickers.
2. Várias **Nova mão**: a certa **não** fica sempre no mesmo botão.
3. Após um erro, os botões **não** trocam de lugar.

### S6 — River não duplica a mão do herói (SC-010, FR-015)

1. Chegar ao showdown.
2. Há **uma** pergunta “Qual mão você tem agora?” no river (stub 003) — não duas.
3. Esta feature **não** altera a certa stub do river (Flush) nem A/B.

### S7 — LGPD / fail-open (SC-011)

1. JSON da chave = só `mao_atual`, `upgrade`, `vencedor_pote`. 0 cartas, 0 timestamp, 0 apelido digitado.
2. Apelidos na mesa: **Você**, **Adversário A**, **Adversário B**.
3. Recarregar no meio da pergunta aborta a mão; contadores **já gravados** permanecem.
4. 0 `alert`. Sem botão zerar / relatório.

---

## Fora deste quickstart

- Lista real de upgrades (005).
- Virada autoritativa A/B e vencedor do pote (006).
- `file://`, bundler, lib de poker, servidor de avaliação.
