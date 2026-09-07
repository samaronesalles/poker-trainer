# Quickstart: validar o showdown autoritativo (feature 006)

Guia de validação ponta a ponta da **virada**, das **quatro perguntas do river** e do **vencedor do pote**. Flop/turn (004/005) não são o alvo — só o ponto em que esta feature os toca (turn completo antes do river; 0 upgrades no river).

Contratos: [motor-showdown.md](./contracts/motor-showdown.md), [quiz-showdown.md](./contracts/quiz-showdown.md), [hud-resultado.md](./contracts/hud-resultado.md). Modelo: [data-model.md](./data-model.md).

---

## Pré-requisitos

- Navegador atual (Chrome, Edge ou Firefox).
- Node.js 18+ para os testes de contrato.
- Python 3 ou `npx serve` para HTTP local.
- **Não** abrir `index.html` via `file://`.
- DevTools → Application → Local Storage da origem (chave `poker-trainer:evolucao`).

Arquivos esperados **após** `/speckit-implement` (ainda não precisam existir neste `/speckit-plan`):

- `js/motor.js` com `quemGanhou`, `conjuntoOpcoesVencedor`, `UNIVERSO_POTE`
- `js/quiz.js` preparando o showdown no pouso e consumindo-o em `river_hero` / `river_a` / `river_b` / `river_vencedor`
- `js/mesa.js` com virada simultânea, aborto `ociosa` se a comparação falhar, desfecho autoritativo **só** em `resultado`
- `index.html` com grupo de fichas `data-para="adversarioB"`
- `tests/contract/motor.test.js` estendido; `quiz.test.js` e `hud-session.test.js` sem Flush/Par-stub nem split por `indiceMaoSessao`

Casco 001 + baralho 002 + quiz/storage 003 + avaliador 004 + upgrades 005 já existentes. **Não** deve existir dependência npm de poker. **Não** deve existir backend.

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

- [motor-showdown.md](./contracts/motor-showdown.md) §7 (kicker, split, royal no board, wheel, wrap, RN-031, falha ≠ `tres`).
- [quiz-showdown.md](./contracts/quiz-showdown.md) §6 (CA-019, CA-027, três `mao_atual` + um `vencedor_pote`, 0 5.4).
- [hud-resultado.md](./contracts/hud-resultado.md) §8 (CA-018, CA-020, CA-021, pote centro durante as perguntas, aborto).
- Testes 002/003/004/005 de baralho, storage, mão atual e upgrades **continuam** passando.
- MUST NOT reembaralhar as 52 ao permutar opções de pote.

---

## Cenários manuais

Marcar cada item. Falha = feature incompleta.  
Não assumir Flush no herói nem Par em A/B: ler as **onze** cartas abertas.

### S1 — Virada e uma só 5.3 do herói (CA-018, CA-027, SC-002)

1. Concluir flop e turn (mão atual + upgrades ou skip). A/B ainda fechados enquanto o river voa.
2. River no slot 5; em seguida A e B viram **juntos**. Só então: **Qual mão você tem agora?**
3. 6 hole + 5 comunitárias face-up. Exatamente **6** rótulos canônicos. 0 **Confirmar**. 0 pergunta de upgrades.
4. A certa é a melhor 5 das 7 do herói — **não** Flush fixo.

### S2 — Mão de A (CA-019)

1. Acertar o herói. HUD vira **Qual mão o Adversário A completou?** — o rótulo do herói **não** fica grudado.
2. Se A tem Flush e o herói tem Par: a única certa é **Flush**; retry até acertar.
3. B e “quem ganhou” **não** estão visíveis.

### S3 — Quem ganhou, kicker e split (CA-020, SC-009)

1. Acertar A e B. Só então: **Quem ganhou o pote?** Exatamente **6** textos do universo de 7. 0 categorias como opção. 0 kickers.
2. Mesma categoria com kicker melhor → um único vencedor (não split).
3. Empate verdadeiro herói vs A → certa **Você e Adversário A**. Durante a pergunta: bolo no centro, 0 destaque de assento.
4. Após acertar o split: HUD `resultado`, fichas **dividem-se** entre Você e A, **Próxima mão** já clicável.

### S4 — Desfecho e Próxima mão (CA-021, SC-020)

1. Único vencedor acertado: texto canônico, destaque só nesse assento, perdedores **legíveis**, três rótulos no HUD na ordem Você / A / B, **Próxima mão** imediato.
2. Acionar **Próxima mão** mesmo com fichas a caminhar: mesa permanece, bolo volta ao centro, novo deal, 0 quiz preflop. 0 botão **Embaralhar**.

### S5 — Royal no board (SC-008)

1. Encontrar (ou fixture) 5 comunitárias A-K-Q-J-10 suited.
2. Três certas **Royal flush**. Pote **Os três empatam**. Opções incluem os três e **não** cobram **Adversário A e Adversário B**.

### S6 — Persistência (SC-011, SC-012)

1. Errar de primeira a mão de A e depois acertar: em DevTools, `mao_atual` da categoria **correta de A** tem +1 erro e +0 acerto.
2. Errar de primeira o pote e acertar: só `vencedor_pote` +1 erro; nenhuma categoria RN-014 muda por essa pergunta.
3. Recarregar no meio do showdown: mão aborta (`ociosa`); contadores já gravados **permanecem**. JSON da chave: **somente** `mao_atual`, `upgrade`, `vencedor_pote`. 0 cartas, 0 Melhor5, 0 chave.

### S7 — Falha e fail-open (SC-019, FR-024)

1. Fixture / defesa com classificação impossível após o river pousar: HUD volta a `ociosa` + **Nova mão** **antes** da 1ª pergunta. 0 quiz. 0 spinner.
2. Bloquear `localStorage`: as quatro perguntas e o desfecho continuam; a evolução MAY perder-se ao fechar.

---

## Fora desta validação

- Relatório visual, botão zerar, apostas, login, mute, quiz preflop, draws nomeados.
- Reabrir a heurística RN-017 do flop/turn ou o enumerador 005.
- Servidor, bundler, lib de poker.
