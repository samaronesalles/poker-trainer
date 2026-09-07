# Contract: Cadência do HUD (quiz real + skip)

**Feature**: `003-feedback-persistencia`  
**Tipo**: contrato de UI / FSM (sem HTTP)  
**Consumidores**: `js/mesa.js`, `js/quiz.js`, `tests/contract/hud-session.test.js`, [quickstart.md](../quickstart.md)  
**Estende**: [hud-session.md da 001](../../001-mesa-imersiva/contracts/hud-session.md) e [hud-montagem.md da 002](../../002-embaralhamento-deal/contracts/hud-montagem.md)  
**Pergunta**: [quiz.md](./quiz.md)

Os cinco `HudEstado` e a montagem **antes** de `deal` **não mudam**. Este contrato substitui o avanço `flop_hero` → `sem_upgrade` da 001 e adiciona **Confirmar** + beat.

---

## 1. Eventos de sessão (delta)

| Evento | Continua? | Nota |
|--------|-----------|------|
| `INICIAR_MAO` / `PROXIMA_MAO` | Sim | 002: montagem válida antes de `deal` |
| `CONTINUAR` | Sim | **Só** `turn_skip`. MUST NOT após acerto de pergunta |
| `ESCOLHER_OPCAO` | Sim | Só modo `unica` (submete) |
| `ALTERNAR_OPCAO` | **Novo** | Só modo `multipla` |
| `CONFIRMAR` | **Novo** | Só modo `multipla` |
| `FIM_BEAT_ACERTO` | **Novo** | Avança após “Você acertou” |
| `FIM_ANIMACAO_STREET` / `FALHA_DEAL` / `FALHA_MONTAGEM` | Sim | 001/002 |
| `RELOAD` | Sim | `ociosa`; evolução **não** zera |

Gestos que continuam **proibidos**: Desistir, Nova mão no meio da mão, Embaralhar, mute, **zerar**, pular pergunta, revelar resposta.

**Confirmar** passa a ser permitido — só em `flop_upgrade`.

---

## 2. Avanço após `FIM_BEAT_ACERTO`

| Passo acertado | Próximo |
|----------------|---------|
| `flop_hero` | `perguntando` `flop_upgrade` (nova grade embaralhada, CTA **Confirmar**, enunciado 5.4) |
| `flop_upgrade` | `deal` turn (burn cênico + slot 4). Sem **Continuar** |
| `turn_hero` | `sem_upgrade` `turn_skip` + **Continuar** |
| `turn_skip` + `CONTINUAR` | `deal` river (não é beat de acerto de pergunta) |
| `river_hero` | `perguntando` `river_a` |
| `river_a` | `perguntando` `river_b` |
| `river_b` | `perguntando` `river_vencedor` |
| `river_vencedor` | `resultado` + **Próxima mão** |

Durante o beat: estado HUD permanece `perguntando`; opções visíveis com marcas de acerto; 0 CTA **Continuar**.

Adapter browser: `400` ms, ou `0` se `prefers-reduced-motion: reduce`. Testes: disparar o evento na hora.

---

## 3. Habilitação do quiz (inalterada vs 001/002)

Só sair de `deal` para `perguntando` / `sem_upgrade` se cartas da street pousaram (e virada A/B no river). Board vazio = 0 perguntas. Uma pergunta por vez (RN-G001). Não avançar street sem completar a street (RN-G002): flop = `flop_hero` **e** `flop_upgrade`; turn = `turn_hero` **e** `turn_skip`.

---

## 4. Teclado (delta)

Ordem Tab em `flop_upgrade`: opções **ativáveis** (grade) → **Confirmar**.

Eliminadas e travadas-acertadas: fora do Tab.

Enter/Espaço: opção única submete; opção múltipla alterna; **Confirmar** avalia.

---

## 5. `resultado`

Reitera categorias **já acertadas** nesta mão (Você = Flush stub; A = Par; B = Par). Isso **não** é spoiler da pergunta corrente. Pote visual: mão 1 Você; mão 2+ split Você+A (001).

MUST NOT: tabela de desempenho, gráfico, botão zerar.

---

## 6. Casos de contrato (automatizáveis da FSM)

Substitui/estende a §8 da 001:

1. Estado inicial `ociosa` (inalterado).
2. Flop pousado → `flop_hero`, 6 opções, correta `flush` (não mais `par`).
3. Escolha errada → ainda `flop_hero`; opção eliminada.
4. Escolha `flush` + `FIM_BEAT_ACERTO` → `flop_upgrade`, CTA **Confirmar**, 0 `sem_upgrade`.
5. Em `flop_upgrade`, `ALTERNAR_OPCAO` → ainda `perguntando`; feedback null.
6. `CONFIRMAR` com só `flush` + beat → `deal` (turn), não `sem_upgrade`.
7. `turn_hero` + `flush` + beat → `sem_upgrade` + **Continuar**.
8. Continuar → `deal` river (002 inalterado).
9. River uma a uma; vencedor mão 1 `voce` → `resultado`.
10. Reload no meio (após 1ª tentativa gravada nos testes com fake storage) → próxima `ler()` preserva contadores; HUD `ociosa`.
11. 0 Confirmar em `flop_hero` / `river_*`.
12. 0 botão zerar / relatório no modelo da sessão.
13. `FALHA_MONTAGEM` / `FALHA_DEAL` inalterados (002).
