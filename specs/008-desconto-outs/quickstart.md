# Quickstart: Desconto de outs (008)

Validação ponta a ponta da [spec](./spec.md). Sem código de implementação neste arquivo. Contratos: [motor-desconto-outs.md](./contracts/motor-desconto-outs.md), [quiz-desconto-outs.md](./contracts/quiz-desconto-outs.md), [storage-outs-odds.md](./contracts/storage-outs-odds.md). Modelo: [data-model.md](./data-model.md).

Este comando (`/speckit-plan`) **não** implementa a feature. Os passos abaixo valem **depois** de `/speckit-implement`.

---

## Pré-requisitos

- Repo em `c:\DELPHI\PROJETOS\poker-trainer` (ou clone equivalente).
- Node.js com `node --test` (já usado pelas features 001–007).
- Servidor estático em `http://` (não `file://`):

```powershell
python -m http.server 8080
```

ou `npx serve`. Abrir `http://localhost:8080/`.

- Navegador evergreen. Desktop de referência 1280×720 CSS px; repetir ranks no estreito (HUD abaixo da mesa).
- DevTools → Application → Local Storage da origem. Única chave de produto: `poker-trainer:evolucao`.

---

## Testes automatizados

Na raiz do repo:

```powershell
node --test tests/contract/motor.test.js tests/contract/quiz.test.js tests/contract/storage.test.js tests/contract/hud-session.test.js tests/contract/layout-responsivo.test.js
```

Esperado: exit 0. Os casos 005 (47/46, “adversário não desconta”, CA-014–017) **não** devem mais passar como gabarito vigente — foram substituídos por CA-033+.

Âncoras mínimas do motor (ver contrato):

- CA-033 / CA-040 / CA-041 / CA-042: K♣ Q♦ + 10♠ 9♦ 5♣ → Par+Straight, N=10, ranks Rei/Dama/Valete, odd 4:1.
- CA-044: N=4 → 11:1; N=9 → 5:1.
- CA-045: Valetes mistos → N conta só limpos; rank continua verdadeiro.

---

## Cenário A — CA-033 no flop até a odd (feliz)

1. Nova mão até o flop pousar. Acertar **Qual mão você tem agora?**.
2. HUD pergunta **Quais mãos melhoram o seu jogo com chance de ganhar o pote?** com a linha **Suponha que o adversário já tem o par mais alto da mesa.** (quando a textura for essa). A e B fechados; 0 cartas assumidas visíveis.
3. Marcar o conjunto verdadeiro (no fixture CA-033: **Par** e **Straight**) e **Confirmar**. Feedback **Você acertou**. O turn **ainda não** abriu.
4. HUD vira **Quantas outs você tem?** — 6 totais, incluindo **10**. Clique em 10. A linha de suposição MAY permanecer; o número 10 MUST NOT virar chip na pergunta seguinte.
5. **Quais ranks são outs?** — exatamente 13 rótulos. Conjunto verdadeiro: **Rei**, **Dama**, **Valete**. 9 e 5 não. **Confirmar**.
6. **Qual é a sua odd?** — correta **4:1**, 6 razões distintas. Clique. Só então o turn pode abrir.
7. DevTools: JSON tem os cinco buckets; **não** contém cartas, vilão, N, ranks nem razão.

---

## Cenário B — skip (CA-036 / CA-043)

1. Street cuja lista RN-057 é vazia (já à frente ou nenhuma carta vence).
2. Após a 5.3: **Não há mão que vire o pote.** + **Continuar**. Sem grade. Sem “Quantas outs”.
3. `upgrade` / `outs` / `odds` inalterados. A frase antiga **Não há upgrade possível.** não aparece.

---

## Cenário C — retry e buckets (CA-037 / CA-046)

1. 5.4 com Flush verdadeiro e Par distratora: marcar os dois na 1ª Confirmar → Flush +1 acerto, Par +1 erro, Par morta, pergunta aberta.
2. Quantidade: errar na 1ª, acertar depois → `outs` +1 erro e +0 acerto nessa exposição.
3. 1ª Confirmar dos ranks é outra exposição em `outs`.
4. Odd escreve só `odds`.

---

## Cenário D — turn remonta o vilão (CA-048 / clarify)

1. Mão com 5.4 não vazia no flop **e** no turn.
2. As 1ªs tentativas das duas streets incrementam `upgrade`/`outs`/`odds` **em separado**.
3. A linha de suposição do turn é a do board de **quatro** cartas — não a frase congelada do flop.

---

## Cenário E — river e showdown (CA-018 / SC-024)

1. Abrir o river. 0 perguntas de upgrades, outs ou odd.
2. Showdown usa hole **reais** de A e B (feature 006). O vilão assumido não decide o pote.

---

## Cenário F — layout dos 13 ranks (SC-031)

1. Abrir “quais ranks” no desktop, no tablet e no estreito.
2. 0 comunitárias, 0 hole do herói e 0 assentos cobertos. No estreito o HUD está abaixo da mesa; os ranks quebram em linhas.

---

## Cenário G — fail-open e LGPD

1. Com a chave existente da 003 (três buckets), jogar uma 5.8. O bloco permanece legível; `outs`/`odds` nascem em 0 e depois incrementam; `mao_atual` antigo **não** zera.
2. Recusar storage / quota: a mesa não trava; sem `alert`.
3. Recarregar no meio da 5.8: mão aborta; contadores já gravados permanecem.
4. Procurar relatório, zerar, Pot Odds, regra do 4, “flush draw”, mute, login: 0 ocorrências.
5. Colinha ocultada: continua sem chave própria.

---

## Cenário H — falha do motor (SC-022)

Se o vilão não montar ou N/X não fechar: HUD `ociosa` + **Nova mão**. 0 skip falso. 0 invenção de 0 outs.

---

## Fora desta validação

- Pasta `specs/005-maos-ainda-possiveis/` — histórica; não reabrir para “consertar” CA-014.
- Pot Odds, regra do 4, apostas.
- Implementação / `tasks.md` — `/speckit-tasks` e `/speckit-implement`.
