# Quickstart: validar feedback e persistência (feature 003)

Guia de validação ponta a ponta do **contrato de quiz** e da **evolução no dispositivo**. Não valida o motor de mãos (004–006). O feltro honesto da 002 permanece; a “certa” do stub MAY não bater com o board.

Contratos: [quiz.md](./contracts/quiz.md), [storage.md](./contracts/storage.md), [hud-cadencia.md](./contracts/hud-cadencia.md). Modelo: [data-model.md](./data-model.md).

---

## Pré-requisitos

- Navegador atual (Chrome, Edge ou Firefox).
- Node.js 18+ para os testes de contrato.
- Python 3 ou `npx serve` para HTTP local.
- **Não** abrir `index.html` via `file://`.
- DevTools → Application → Local Storage da origem do app (para CA-023).

Arquivos esperados **após** `/speckit-implement` (ainda não precisam existir neste `/speckit-plan`):

- `js/quiz.js` (novo; substitui `js/quiz-stub.js`)
- `js/storage.js` (novo)
- `js/mesa.js` atualizado (cadência, Confirmar, beat)
- `css/hud.css` atualizado (✕ / ✓ / Confirmar)
- `tests/contract/quiz.test.js`, `tests/contract/storage.test.js`
- `tests/contract/hud-session.test.js` atualizado (correta Flush, flop → upgrade)

Casco 001 + baralho 002 já existentes. **Não** deve existir `js/motor.js`. **Não** deve restar `js/quiz-stub.js` após a migração.

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

- [quiz.md](./contracts/quiz.md) §9 (única vs múltipla, 1ª tentativa, falso positivo, G008, skip).
- [storage.md](./contracts/storage.md) §7 (schema 10+10+1, fail-open, incompleto vs corrupção, LWW, zero PII).
- [hud-cadencia.md](./contracts/hud-cadencia.md) §6 (Flush, `flop_upgrade`, Confirmar, beat, turn skip).
- Baralho 002 continua passando; MUST NOT reembaralhar as 52 ao permutar opções.

---

## Cenários manuais

Marcar cada item. Falha = feature incompleta.

### S1 — Seleção única no clique, sem Confirmar (RN-047, SC-003)

1. **Nova mão** → flop pousa → “Qual mão você tem agora?”
2. 6 categorias; **0** botão **Confirmar**.
3. Clicar uma opção que **não** seja **Flush** → exatamente “Não é essa. Tente de novo.”; essa opção com ✕ no mesmo lugar; 0 `alert`; a UI **não** diz que a certa é Flush.
4. Tab **não** para na morta; as outras seguem na mesma ordem.
5. Clicar **Flush** → “Você acertou” + ✓ na opção; a grade **permanece** visível; em ≤ 1 s (imediato se reduzir movimento) abre a pergunta de upgrades — **sem** **Continuar**.

### S2 — Múltipla seleção só no Confirmar (RN-047, CA-016, SC-004)

1. Enunciado: “Quais mãos você ainda não tem, mas ainda pode formar?” + **Confirmar**.
2. Marcar **Flush** e **Par** (sem apertar Confirmar) → pergunta não fecha; sem feedback de acerto.
3. **Confirmar** → “Não é essa. Tente de novo.”; Par com ✕; Flush com ✓ travado (não desmarca); pergunta **não** avança.
4. DevTools: `upgrade.flush` +1 acerto; `upgrade.par` +1 erro; outras categorias de `upgrade` inalteradas (Par não ganha acerto por “ter sido vista”).
5. Marcar uma distratora que ainda estava livre → **Confirmar** de novo → ela morre; **contadores não mudam**.
6. Deixar só Flush (já travado) como verdadeiro marcado, distratoras mortas ou desmarcadas → **Confirmar** → “Você acertou” → beat → turn (deal), não `sem_upgrade`.

### S3 — Omissão e skip do turn (RN-024, SC-012, FR-020)

1. Nova mão até `flop_upgrade`. **Confirmar** sem marcar nada → `upgrade.flush` +1 erro; Flush continua marcável; “Não é essa. Tente de novo.”
2. Corrigir até acertar → turn.
3. Acertar **Flush** no turn → **“Não há upgrade possível.”** + **Continuar**. Contadores `upgrade` **não** mudam nesse skip.
4. Completar S1 também só com teclado (opções + Confirmar).

### S4 — Primeira tentativa e CA-022 (SC-005)

1. Application → limpar só para este cenário (ou origem limpa).
2. Flop herói: errar uma distratora e depois acertar **Flush**.
3. Inspecionar `poker-trainer:evolucao`: `mao_atual.flush` = acertos 0, erros 1, exposicoes 1. Chute na distratora **não** incrementa a distratora.

### S5 — Sobrevive ao fechar (CA-023, SC-006)

1. Origem limpa. Acertar **Flush** de primeira no flop (mão atual).
2. Fechar a aba. Reabrir `http://localhost:8080`.
3. A chave ainda tem `mao_atual.flush.acertos === 1`. HUD volta `ociosa` (mão abortada). **Nova mão** funciona.

### S6 — Reload no meio da mão (FR-014)

1. Acertar de primeira o flop herói (gravação imediata). Recarregar **antes** do river.
2. HUD `ociosa`; o acerto de Flush **permanece** no storage.

### S7 — Sem relatório e sem zerar (CA-024, SC-007)

1. Percorrer ociosa → flop → upgrade → turn skip → river → `resultado` → **Próxima mão**.
2. 0 tela de relatório, 0 gráfico, 0 tabela de stats, 0 botão zerar.
3. Apelidos só **Você**, **Adversário A**, **Adversário B**. 0 pedido de e-mail/nome.

### S8 — G008 (SC-008)

1. Abrir várias mãos (ou as várias perguntas da mesma mão).
2. A posição visual de **Flush** (herói) **não** é sempre o mesmo botão.
3. Após um erro, a morta **não** troca de lugar no retry.

### S9 — Fail-open (SC-010)

1. DevTools → bloquear/desligar o storage da origem (ou simular cota), **ou** gravar lixo em `poker-trainer:evolucao`.
2. Completar uma pergunta: feedback no HUD, 0 `alert`, 0 jargão que bloqueie, 0 pedido de dado pessoal.
3. Mesa não trava. (Evolução MAY perder-se ao fechar.)

### S10 — Empate visual e vencedor (continuidade 001)

1. Segunda mão da sessão: “Quem ganhou o pote?” correta **Você e Adversário A** (seleção única, sem Confirmar).
2. 1ª tentativa alimenta só `vencedor_pote`, não as 10 categorias.

---

## Privacidade (obrigatório)

- Única chave: `poker-trainer:evolucao`.
- JSON só com `mao_atual`, `upgrade`, `vencedor_pote` (10+10 ids + grupo).
- 0 nome, e-mail, CPF, apelido digitado, cartas, timestamp, trajetória de mouse.
- 0 `fetch` de telemetria. Limpar dados do site zera a evolução; a mesa segue.
