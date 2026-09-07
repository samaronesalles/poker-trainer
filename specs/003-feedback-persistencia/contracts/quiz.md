# Contract: Quiz da mesa (responder, feedback, stub)

**Feature**: `003-feedback-persistencia`  
**Tipo**: contrato de UI / domínio no cliente (sem HTTP)  
**Módulo**: `js/quiz.js` (substitui `js/quiz-stub.js`)  
**Consumidores**: `js/mesa.js`, testes `tests/contract/quiz.test.js` e `hud-session.test.js`, [quickstart.md](../quickstart.md)  
**Modelo**: [data-model.md](../data-model.md)  
**Persistência**: [storage.md](./storage.md) — o quiz é o **único escritor** dos contadores

Não há API de rede. Correção autoritativa do feltro é 004–006; aqui a correta é a do **stub**.

---

## 1. Copy canônica (pt-BR)

| Contexto | Texto exato |
|----------|-------------|
| Feedback acerto | Você acertou |
| Feedback erro | Não é essa. Tente de novo. |
| Skip body | Não há upgrade possível. |
| CTA multi-select | Confirmar |
| CTA skip | Continuar |
| Enunciado mão herói | Qual mão você tem agora? |
| Enunciado upgrades | Quais mãos você ainda não tem, mas ainda pode formar? |
| Enunciado A | Qual mão o Adversário A completou? |
| Enunciado B | Qual mão o Adversário B completou? |
| Enunciado pote | Quem ganhou o pote? |

MUST NOT: “a resposta era …”, “Sequência” no lugar de Straight, `alert()`.

Rótulos de categoria: só os 10 de RN-014. Vencedor: RN-030.

---

## 2. Eventos de pergunta (além da sessão 001/002)

| Evento | Origem | HUD | Efeito |
|--------|--------|-----|--------|
| `ESCOLHER_OPCAO` | Clique / Enter / Espaço em opção ativável | `perguntando` + modo `unica` | Submete (§3) |
| `ALTERNAR_OPCAO` | Clique / Enter / Espaço em opção ativável | `perguntando` + modo `multipla` | Toggle seleção; **não** avalia |
| `CONFIRMAR` | CTA **Confirmar** | `perguntando` + modo `multipla` | Avalia conjunto (§4) |
| `FIM_BEAT_ACERTO` | Adapter 400 ms / 0 se movimento reduzido; testes: imediato | `perguntando` + `aguardando_beat` | Avança passo ([hud-cadencia.md](./hud-cadencia.md)) |

`ESCOLHER_OPCAO` em modo `multipla` MUST ser tratado como `ALTERNAR_OPCAO` **ou** ignorado se a mesa só emitir `ALTERNAR_OPCAO` — o gesto de marcar MUST NOT submeter.

Durante `aguardando_beat`: os três primeiros eventos **ignoram**.

Opção não ativável: ignora; não avança; não altera contadores.

---

## 3. Seleção única

MUST NOT existir botão **Confirmar**.

| Gesto | HUD | Opção | Contadores (só se `aguardando_primeira`) | Avanço |
|-------|-----|-------|------------------------------------------|--------|
| id distratora | “Não é essa. Tente de novo.” | `eliminada` + marca ✕ no **mesmo** lugar; demais intactas | +1 erro e +0 acerto na **correta** da pergunta (`mao_atual` ou `vencedor_pote`) | Não |
| id já eliminado | inalterado | inalterado | Não | Não |
| id verdadeira | “Você acertou”; marca ✓ | `acertada` | +1 acerto se ainda 1ª; se 1ª já foi erro: 0 acerto extra | Após `FIM_BEAT_ACERTO` |
| clique fora | inalterado | — | Não | Não |

MUST NOT revelar a certa por destaque antecipado, texto ou posição fixa.

---

## 4. Múltipla seleção (flop_upgrade stub)

Marcar/desmarcar MUST NOT submeter.

### 4.1 Primeira Confirmar (RN-024)

Para **cada** opção **exibida**:

| Situação | UI | `upgrade[id]` |
|----------|----|---------------|
| Verdadeira marcada | trava; marca ✓; não desmarcar | +1 acerto |
| Verdadeira não marcada | permanece ativável | +1 erro (omissão) |
| Distratora marcada | `eliminada` + ✕ | +1 erro (falso positivo) |
| Distratora não marcada | permanece ativável (MUST NOT matar — spoiler) | não incrementa |

Se o conjunto das exibidas já está perfeito → acerto + beat. Senão → copy de erro; pede de novo. Gravação **imediata** (todas as células tocadas num único `setItem` do blob).

**Confirmar** vazio com ≥1 verdadeira exibida = omissão em cada verdadeira.

Marcar todas havendo distratora = cada distratora marcada recebe erro e morre; verdadeiras marcadas travam; pede correção.

### 4.2 Confirmar seguintes (RN-025 / RN-026)

- MUST NOT alterar contadores.
- Distratora restante marcada → elimina + copy de erro.
- Tentativa de desmarcar travada ou reativar morta → ignora.
- Quando o conjunto **exibido** fica perfeito → “Você acertou” + beat.

### 4.3 Skip (`turn_skip`)

Não é pergunta. **Continuar** MUST NOT chamar escrita em `upgrade`.

---

## 5. Conteúdo stub (determinístico)

A **ordem visual** é embaralhada a cada `apresentar`. Testes/quickstart afirmam por **id/rótulo**, nunca por índice.

### 5.1 Seis categorias visíveis (mão atual e upgrades)

1. Par (`par`)
2. Carta alta (`carta_alta`)
3. Dois pares (`dois_pares`)
4. Trinca (`trinca`)
5. Flush (`flush`)
6. Straight (`straight`)

### 5.2 Correta — seleção única de categoria

| Passo | id correto | rótulo |
|-------|------------|--------|
| `flop_hero`, `turn_hero`, `river_hero` | `flush` | Flush |
| `river_a`, `river_b` | `par` | Par |

`resultado.categoriasIdentificadas`: Você = Flush; A = Par; B = Par.

### 5.3 Correta — múltipla seleção (`flop_upgrade`)

- `conjuntoCorreto` = `['flush']`
- Distratoras = as outras cinco, **incluindo Par**
- Até 005, Flush verdadeiro aqui **não** precisa ser consistente com RN-021 vs. mão atual stub (também Flush)

### 5.4 Vencedor (inalterado vs 001)

- `indiceMaoSessao === 1` → `voce` (Você)
- `indiceMaoSessao >= 2` → `voce_a` (Você e Adversário A)

Seis opções RN-031 como na 001.

### 5.5 G008

RNG injetável; default `Math.random`. MUST NOT importar `baralho.js`. MUST NOT reembaralhar no retry da **mesma** pergunta. Em 10 apresentações da mesma pergunta nova, a correta MUST NOT ocupar o mesmo índice em todas.

---

## 6. Marcas e foco

- Morta: ✕ visível + ênfase reduzida + `ativavel=false` + `tabIndex=-1` (ou fora da ordem).
- Acertada: ✓ visível só **depois** de escolhida/travada.
- Feedback textual no HUD **além** das marcas (CA-025).
- Tab: só ativáveis, depois CTA **Confirmar** (se houver).

---

## 7. Integração com storage

No instante em que `faseTentativa` sai de `aguardando_primeira`:

1. Calcular deltas da §3 ou §4.1.
2. Chamar `storage` (blob completo com 10+10+1).
3. Só então pintar retry ou entrar em `aguardando_beat`.

Se `storage` falhar: deltas ficam no cache em memória da visita; HUD segue (§ fail-open em [storage.md](./storage.md)).

`quiz.js` MUST NOT escrever chaves além de `poker-trainer:evolucao`.

---

## 8. Proibições

- `alert` / `confirm` / `prompt`
- Botão pular / revelar resposta
- Quiz preflop
- Kickers no rótulo
- Relatório / zerar
- `js/motor.js`
- Persistir cartas, pool de cursor, apelido digitado
- Reembaralhar o baralho ao embaralhar opções

---

## 9. Casos de contrato (automatizáveis)

1. `unica`: 0 botão Confirmar; clique distratora submete; clique verdadeira submete.
2. Erro: copy exata; opção ✕ no mesmo índice; demais na mesma ordem; certa ainda não marcada como certa.
3. Erro depois acerto na mesma pergunta de herói: `mao_atual.flush` +1 erro, +0 acerto, exposicoes 1.
4. Acerto de primeira em `flop_hero`: `mao_atual.flush` +1 acerto.
5. `multipla`: toggle não muda feedback nem contadores; só `CONFIRMAR` avalia.
6. 1ª Confirmar Flush+Par: `upgrade.flush` +1 acerto; `upgrade.par` +1 erro; Par eliminada; Flush travado; pergunta não fecha.
7. 1ª Confirmar vazio: `upgrade.flush` +1 erro; Flush continua ativável; distratoras não incrementam.
8. 2ª Confirmar: contadores inalterados; distratora nova marcada morre.
9. Conjunto só Flush marcado (sem distratora) na 1ª: acerto; beat.
10. `turn_skip` / Continuar: `upgrade` inalterado.
11. G008: 10 `apresentar` independentes → índice da correta não constante; retry não permuta.
12. Vencedor 1ª tentativa alimenta só `vencedor_pote`.
13. River: três exposições `mao_atual` independentes (Flush, Par, Par) + uma `vencedor_pote`.
14. Zero `alert`; zero escrita fora da chave de evolução.
