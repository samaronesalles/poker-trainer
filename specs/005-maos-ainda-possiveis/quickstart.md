# Quickstart: validar mãos ainda possíveis no flop e no turn (feature 005)

Guia de validação ponta a ponta do **enumerador** e da **pergunta de upgrades**. A mão atual (004) e o showdown stub (003/006) não são o alvo — só o ponto em que esta feature os toca.

Contratos: [motor-upgrades.md](./contracts/motor-upgrades.md), [quiz-upgrades.md](./contracts/quiz-upgrades.md). Modelo: [data-model.md](./data-model.md).

---

## Pré-requisitos

- Navegador atual (Chrome, Edge ou Firefox).
- Node.js 18+ para os testes de contrato.
- Python 3 ou `npx serve` para HTTP local.
- **Não** abrir `index.html` via `file://`.
- DevTools → Application → Local Storage da origem (chave `poker-trainer:evolucao`).

Arquivos esperados **após** `/speckit-implement` (ainda não precisam existir neste `/speckit-plan`):

- `js/motor.js` com `snapshotDesconhecido`, `enumerarUpgrades`, `conjuntoOpcoesUpgrade`
- `js/quiz.js` preparando a lista no pouso e consumindo-a em `flop_upgrade` / `turn_upgrade`
- `js/mesa.js` com skip real no flop, pergunta real no turn e aborto `ociosa` se a enumeração falhar
- `tests/contract/motor.test.js` estendido; `quiz.test.js` e `hud-session.test.js` sem Flush-stub nem skip forçado do turn

Casco 001 + baralho 002 + quiz/storage 003 + avaliador 004 já existentes. **Não** deve existir dependência npm de poker. **Não** deve existir backend.

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

- [motor-upgrades.md](./contracts/motor-upgrades.md) §6 (47/46, exatamente C, 7 vs 6, teto de 6, as 9 categorias, falha ≠ lista vazia).
- [quiz-upgrades.md](./contracts/quiz-upgrades.md) §8 (CA-014..017, duas exposições, river sem 5.4, aborto `ociosa`).
- Testes 002/003/004 de baralho, storage, mão atual e river stub **continuam** passando.
- MUST NOT reembaralhar as 52 ao enumerar nem ao permutar opções.

---

## Cenários manuais

Marcar cada item. Falha = feature incompleta.  
Não assumir Flush verdadeiro no flop nem skip no turn: ler o feltro e o que ainda pode ser a **melhor** mão.

### S1 — Grade real no flop (SC-012, FR-001)

1. **Nova mão** até o flop pousar. Enquanto a 5.3 está aberta: **0** pergunta de upgrades, **0** Confirmar de upgrades, **0** skip.
2. Acertar **Qual mão você tem agora?**. Após o beat (≤1 s; 0 se reduzir movimento): ou a 5.4 ou o skip — **não** vira o turn.
3. Se houver grade: enunciado exatamente **Quais mãos você ainda não tem, mas ainda pode formar?**; **6** rótulos canônicos; CTA **Confirmar**; marcar **não** submete.
4. **Flush** só é obrigatório se algum desfecho tiver melhor mão **exatamente Flush** (não é mais o stub).

### S2 — Teto de 6 no flop em Carta alta (CA-014, SC-001)

1. Encontrar (ou usar fixture de teste) flop em **Carta alta** com 7 ou mais upgrades.
2. Opções = exatamente **Royal flush, Straight flush, Quadra, Full house, Flush, Straight**; 0 distratora; **Par / Dois pares / Trinca** não aparecem mesmo que também sejam possíveis.
3. As 6 devem ser marcadas. DevTools: só essas 6 recebem exposição na 1ª Confirmar.

### S3 — Turn deixa o skip forçado (CA-015, SC-002)

1. Concluir o flop (5.3 + 5.4 ou skip).
2. Turn pousa → de novo a 5.3; **0** upgrade ainda.
3. Após o beat: se a lista tiver exatamente 2 upgrades, a grade tem esses 2 + 4 distratoras. **Não** cai em “Não há upgrade possível.” só porque é o turn.
4. Acerto do conjunto → river pode abrir; **0** segunda 5.4; **0** 5.4 no river.

### S4 — Skip verdadeiro (CA-017, SC-004, SC-005)

1. Herói com **Royal flush** no flop (ex.: A-K de copas e flop Q-J-10 de copas), após acertar a 5.3.
2. Sem múltipla seleção; frase exatamente **Não há upgrade possível.** + **Continuar**.
3. DevTools: 0 célula de `upgrade` muda. **Continuar** abre o turn.

### S5 — Primeira Confirmar e retry (CA-016, SC-003, SC-006, SC-007)

1. Street com Flush verdadeiro e Par distratora nas 6.
2. Marcar os dois e **Confirmar**: Flush +1 acerto, Par +1 erro; Par morta; Flush travada; pergunta **aberta**.
3. Corrigir até o conjunto exibido ficar perfeito. 2ª Confirmar: 0 delta novo.
4. Distratora **não** marcada na 1ª: 0 incremento nela.
5. Sem “pular”, sem “mostrar quais faltam”, sem “marcar todas”.

### S6 — Exatamente C e ponto de vista do herói (SC-009, SC-016, SC-021, SC-022)

1. Caso em que os únicos “flushes” do runout são royal: **Flush** e **Straight flush** **não** sobem só por conter o naipe.
2. Herói com trinca: **Par** não é upgrade.
3. Holes de A/B fechadas continuam no desconhecido (não “saíram do baralho” para esta lista).
4. Quem “ganharia” no desfecho hipotético **não** some categoria da lista.

### S7 — Falha e honestidade do baralho (SC-018, SC-019, SC-015)

1. No caminho feliz, após a lista ficar pronta: as 11 de jogo e burns visuais são os mesmos (faces e slots).
2. Se a enumeração falhar (fixture de teste): HUD `ociosa` + **Nova mão**; texto **Não foi possível continuar esta mão. Tente de novo.**; **não** é skip; DevTools sem runouts na chave de evolução.
3. Recarregar no meio da 5.4 aborta a mão; contadores já gravados permanecem. 0 pedido de dado pessoal.

### S8 — Teclado e idioma (SC-010, SC-024, SC-025)

1. Ao abrir a 5.4, o foco está na primeira opção visual; Tab percorre ativáveis e depois **Confirmar**.
2. Enter/Espaço na opção liga/desliga e **não** submete.
3. 0 controle “marcar todas”. 0 “draw / gutshot / outs / par de ases” na UI.

---

## DevTools (só contadores)

Chave: `poker-trainer:evolucao`.

Permitido inspecionar: `upgrade.<categoria>.acertos|erros|exposicoes` após a 1ª Confirmar das opções **exibidas**.

Proibido na chave: cartas, runouts, snapshot, information set, `chaveDesempate`, enunciado, timestamp, e-mail, apelido digitado, session id.

---

## Fora desta validação

- Relatório visual, botão zerar, apostas, quiz preflop, login, mute.
- Showdown (mão de A/B, vencedor) — feature 006.
- Redesenhar a 5.3 (004).
