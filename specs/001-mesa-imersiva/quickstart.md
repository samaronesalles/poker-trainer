# Quickstart: validar a mesa imersiva (feature 001)

Guia de validação ponta a ponta do **casco** (visual + ciclo de sessão + stub de quiz). Não implementa o motor de mãos nem o shuffle de 52 cartas.

Contratos: [hud-session.md](./contracts/hud-session.md), [mesa-visual.md](./contracts/mesa-visual.md), [audio-failopen.md](./contracts/audio-failopen.md). Modelo: [data-model.md](./data-model.md).

---

## Pré-requisitos

- Navegador atual (Chrome, Edge ou Firefox).
- Node.js 18+ **somente** se for rodar os testes de contrato da FSM.
- Python 3 ou `npx serve` para HTTP local.
- **Não** abrir `index.html` via `file://` (ES modules e áudio).

Arquivos esperados após a implementação (ainda não precisam existir neste comando `/speckit-plan`):

- `index.html`
- `css/mesa.css`, `css/cartas.css`, `css/hud.css`
- `js/mesa.js`, `js/carta.js`, `js/audio.js`, `js/quiz-stub.js`

---

## Subir o site

Na raiz do repositório:

```bash
python -m http.server 8080
```

Alternativa:

```bash
npx serve .
```

Abrir `http://localhost:8080` (ou a porta impressa). Viewport de referência: **1280×720** (DevTools).

---

## Testes de contrato da FSM (opcional, sem bundler)

Quando `tests/contract/` existir:

```bash
node --test tests/contract/
```

Esperado: casos do contrato HUD §8 passam (estados, CTAs, uma pergunta por vez, sem quiz preflop, falha de deal → ociosa).

---

## Cenários manuais

Marcar cada item. Falha = feature incompleta.

### S1 — Abertura ociosa (CA-001, SC-001)

1. Abrir o app (primeira visita ou reload).
2. Em menos de 3 s com a tela pronta: feltro de clube, três assentos (**Você**, **Adversário A**, **Adversário B**) com avatar ilustrado, cinco slots vazios, pote cênico, HUD com “Treine ler as mãos. Sem apostas.” e **Nova mão**.
3. Zero opções de quiz. Zero apostas/fold/timer/dealer funcional. Zero tutorial em etapas.

### S2 — Deal sem preflop (CA-026, RN-041)

1. Acionar **Nova mão** (mouse ou Tab+Enter).
2. Enquanto hole cards voam: HUD `deal`, nenhuma opção clicável.
3. Após pouso, herói face-up; A e B verso; board ainda vazio → **nenhuma** pergunta.

### S3 — Flop → skip upgrade (CA-002)

1. As três comunitárias pousam nos slots 1–3.
2. HUD pergunta “Qual mão você tem agora?” com **6** categorias canônicas, ordem não constante entre recargas de pergunta.
3. Clicar uma opção que **não** seja **Par** → “Não é essa. Tente de novo.”; essa opção morta; pergunta não avança; a UI **não** diz qual era a certa.
4. Clicar **Par** → “Você acertou” → “Não há upgrade possível.” + **Continuar**.
5. Completar o mesmo fluxo só com teclado (SC-011).

### S4 — Turn e teto de ritmo (SC-010)

1. **Continuar**: burn cênico (verso fora do board) + turn no slot 4; HUD `deal` durante o voo.
2. Quiz do turn (mesmo enunciado); acertar **Par**; de novo skip + **Continuar**.
3. Primeira mão: animação da street ≤ 2 s antes do quiz. (Na segunda mão, ≈ 1 s.)

### S5 — River / showdown (CA-003, CA-004)

1. River no slot 5 (burn cênico antes, fora dos slots).
2. Enquanto A/B não viraram: HUD ainda `deal`, 0 opções.
3. Após virada: seis hole abertas; primeira pergunta do river habilitada.
4. Quatro perguntas **em sequência** (você, A, B, quem ganhou) — nunca as quatro juntas.
5. Mão 1: vencedor correto = **Você** → `resultado` com pote no herói, três categorias reiteradas, CTA **Próxima mão** (não “Embaralhar”).
6. Não existe **Desistir** / **Nova mão** no meio da mão.

### S6 — Próxima mão e split (CA-005, RN-G003 visual)

1. **Próxima mão**: recolhe, novo deal, mesma mesa, sem reload perceptível, de novo sem quiz preflop (< 3 s até o deal andar).
2. Percorrer até o vencedor: correta = **Você e Adversário A**; fichas se **dividem** visualmente, sem bb.

### S7 — Fail-open de áudio (SC-007)

1. Com som permitido após o gesto: one-shots em shuffle/deal/flop/virada/acerto/erro; sem BGM; sem controle de mute.
2. Bloquear som (permissão do site / política): mesa muda; treino segue; **zero** modal/`alert`.

### S8 — Movimento reduzido

1. DevTools → emulate `prefers-reduced-motion: reduce` (ou ajuste do SO).
2. Nova mão: cartas já nos lugares; quiz MAY habilitar sem esperar 1–2 s de voo.

### S9 — Reload e viewport (FR-016, SC-008)

1. No meio da mão, recarregar → `ociosa`; não pede nome/e-mail; mão perdida.
2. 1280×720: cartas legíveis. Estreitar: HUD pode descer; cartas ainda legíveis.

### S10 — Privacidade rápida

1. DevTools → Application: esta feature **não** grava chaves de evolução nem identificadores.
2. Nenhum campo para digitar apelido.

---

## Resultado esperado

Todos os S1–S10 passam no HTTP local. Itens de shuffle 52, motor de mãos e `localStorage` de contadores **não** fazem parte desta validação (features 002–006).
