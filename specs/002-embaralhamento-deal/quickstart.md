# Quickstart: validar embaralhamento e deal (feature 002)

Guia de validação ponta a ponta do **baralho honesto** sobre o casco da 001. Não valida motor de mãos, correção autoritativa do quiz nem `localStorage` de contadores.

Contratos: [baralho.md](./contracts/baralho.md), [deal-visivel.md](./contracts/deal-visivel.md), [hud-montagem.md](./contracts/hud-montagem.md). Modelo: [data-model.md](./data-model.md).

---

## Pré-requisitos

- Navegador atual (Chrome, Edge ou Firefox).
- Node.js 18+ para os testes de contrato.
- Python 3 ou `npx serve` para HTTP local.
- **Não** abrir `index.html` via `file://`.

Arquivos esperados após `/speckit-implement` (ainda não precisam existir neste comando `/speckit-plan`):

- `js/baralho.js` (novo)
- `js/mesa.js` atualizado (consome o baralho; deal A→B→Você; montagem antes de `deal`)
- `js/carta.js` sem `CARTAS_JOGO_STUB` como fonte das 11
- `tests/contract/baralho.test.js`

Casco 001 já existente: `index.html`, CSS, `carta.js`, `audio.js`, `quiz-stub.js`.

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

- Casos da 001 (HUD/FSM) continuam passando, com `INICIAR_MAO` agora exigindo montagem válida quando o teste passar payload — ver [hud-montagem.md](./contracts/hud-montagem.md) §6.
- Novos casos de [baralho.md](./contracts/baralho.md) §7: 52 distintas, RN-044, crypto ausente, sem filtro de empate, 10 permutações não idênticas.

---

## Cenários manuais

Marcar cada item. Falha = feature incompleta.

### S1 — Nova mão permuta antes do deal (RN-010, SC-012)

1. Mesa `ociosa` → **Nova mão**.
2. Sem ritual de “mexa o mouse”. Deal visível das hole cards começa em **< 1 s**.
3. HUD só esteve `deal` **depois** das cartas existirem (não pisca `deal` e volta).

### S2 — Ordem do deal e herói aberto (RN-044, RN-012, CA-008)

1. Observar o leque: **Adversário A** (duas) → **Adversário B** (duas) → **Você** (duas). Não é uma carta por volta.
2. Você face-up; A e B verso.
3. Slots 1–5 **vazios**; **zero** perguntas.

### S3 — Flop / turn / river já determinados (RN-011, CA-009)

1. Quando o flop do casco abre: três faces nos slots 1–3; 4 e 5 vazios.
2. Acertar o stub do flop → **Continuar** → turn: **exatamente uma** carta nova no slot 4; flop **igual**.
3. Idem river no slot 5; flop e turn intactos.
4. Nenhuma animação de “reembaralhar o sapato” no meio da mão.

### S4 — Burn não come carta (RN-045, CA-007)

1. No turn e no river, o verso teatral (se aparecer) **não** está num `data-slot`.
2. Ao completar o river, contar 6 hole + 5 comunitárias = **11** identidades distintas do baralho padrão; 0 coringa; 0 12ª carta de jogo.

### S5 — Showdown usa o deal (RN-012)

1. Até o river pousar, A e B fechados.
2. Na virada, as faces de A e B são as mesmas do deal (anotar `data-rank`/`data-suit` no deal e conferir).

### S6 — Imprevisibilidade (CA-006, FR-016)

1. Completar ou reiniciar **10** mãos com sucesso (reload no meio aborta; use **Próxima mão** ou **Nova mão** após voltar a `ociosa`).
2. Anotar as 11 identidades (ou um hash visual: herói + flop).
3. As 10 sequências **não** são todas iguais. No máximo **uma** coincidência entre mãos **adjacentes**.
4. **Não** é o ciclo stub da 001 (`A♠ K♥ Q♦ J♣ 10♥ 9♠ 8♦ 7♣ 6♥ 5♠ 4♦`) em todas as rodadas.

### S7 — Próxima mão limpa o feltro (FR-015)

1. Chegar a `resultado` → **Próxima mão**.
2. Cartas da mão anterior somem **antes** das faces novas aparecerem.
3. Novo deal; outra permutação.

### S8 — Fail-open de entropia (SC-008)

1. **Nova mão** **sem** mover o ponteiro nesta visita (reload + clique imediato no CTA, teclado Tab+Enter). Deal ocorre.
2. (Opcional, DevTools) bloquear/ausentar `crypto.getRandomValues` no teste de contrato; a mão **ainda** monta. Não é o copy de erro.

### S9 — Falha de montagem (SC-009)

Cobrir no teste de contrato (injetar permutação inválida). No browser, só observável se a montagem for forçada a falhar:

1. HUD permanece `ociosa`.
2. Texto **exato**: `Não foi possível embaralhar. Tente de novo.`
3. CTA **Nova mão**. Sem `alert()`. Sem ter passado por `deal`.
4. Em menos de 3 s.

### S10 — Clique duplo e movimento reduzido (FR-022, FR-023)

1. Dois cliques rápidos em **Nova mão**: uma única tentativa / um único `indiceMaoSessao` incrementado.
2. Emular `prefers-reduced-motion: reduce`: holes já nos assentos; **sem** teatro de shuffle; faces já determinadas.

### S11 — Privacidade e retenção (SC-011)

1. DevTools → Application: **zero** chaves novas de baralho, cursor ou identificador. Sem cookies de sessão de mão.
2. Nenhum campo de nome/e-mail.
3. Recarregar no meio da mão → `ociosa`, linha de propósito do casco (não a de erro, a menos que a nova carga falhe), mão perdida.

### S12 — Empate não é evitado (RN-G003)

Não há botão nem filtro visível. Confiança = teste de contrato §7.8 + inspeção: o gerador não descarta permutações. O stub do vencedor da 001 **pode** não bater com o board real (fora de escopo).

---

## Resultado esperado

S1–S11 passam no HTTP local; S12 no `node --test`. Quiz stub, áudio fail-open, layout 1280×720 e CTAs da 001 **permanecem**. Motor, upgrades reais e `localStorage` **não** fazem parte desta validação.
