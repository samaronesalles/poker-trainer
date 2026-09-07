# Contract: Quiz consome o enumerador (flop/turn)

**Feature**: `005-maos-ainda-possiveis`  
**Tipo**: contrato de UI / domínio no cliente (sem HTTP)  
**Módulo**: `js/quiz.js` + cadência em `js/mesa.js` (**alter**; retry/storage da 003 permanecem)  
**Consumidores**: `js/mesa.js`, testes `quiz.test.js` / `hud-session.test.js`  
**Motor**: [motor-upgrades.md](./motor-upgrades.md)  
**Persistência**: inalterada — [003 storage](../../003-feedback-persistencia/contracts/storage.md)

Não há API de rede. Showdown stub da 003 **não** muda.

---

## 1. O que muda vs. 003 / 004

| Passo | 003 / 004 | 005 |
|-------|-----------|-----|
| `flop_hero` / `turn_hero` | Motor 004; no pouso só a 5.3 | **Também** prepara `sessao.mao.upgradesStreet` (oculto) |
| `flop_upgrade` | Stub Flush verdadeiro + 5 distratoras fixas | Lista RN-020 real + teto de 6 |
| `flop_skip` | Não existia (flop sempre tinha grade) | **Novo** se lista vazia |
| `turn_hero` → depois | Skip forçado `turn_skip` | `turn_upgrade` **ou** `turn_skip` |
| `turn_upgrade` | Não existia | **Novo** — mesma 5.4 do flop |
| `river_*` | Stub 003 | **Inalterado** — 0 upgrade |

Copy canônica, Confirmar, morta, G008, beat, 1ª Confirmar em `upgrade`, fail-open de storage: **iguais** à 003.

---

## 2. Extração e preparo no pouso

A partir de `sessao.mao.cartasJogo` (RN-044):

| Street | Hole | Comunitárias |
|--------|------|----------------|
| flop | `[4],[5]` | `[6],[7],[8]` |
| turn | `[4],[5]` | `[6],[7],[8],[9]` |

MUST NOT passar `[0]..[3]`, `[10]` no flop, nem burns.

Fluxo ao `apresentarPergunta(flop_hero|turn_hero)` (depois de montar a 5.3):

1. `resultado = enumerarUpgrades({ holeHeroi, comunitarias })`.
2. Se `resultado.ok`: guardar `{ ok: true, lista: resultado.upgrades, categoriaAtual, street }`. Se `lista.length ≥ 1`, MAY pré-calcular `conjuntoOpcoesUpgrade({ upgrades: lista })` e guardar em memória.
3. Se `!ok`: guardar `{ ok: false, lista: null, street }`. MUST NOT abrir skip. MAY abortar já no pouso (preferível se a falha é síncrona) **ou** deixar o aborto para o beat da 5.3 — ambos legais; o HUD MUST NOT mostrar a 5.4.
4. MUST NOT copiar runouts, snapshot ou `chaveDesempate` para `sessao.hud` / storage.
5. MUST NOT apresentar enunciado 5.4 nem `sem_upgrade` neste instante.

`mesa.js` lê só `sessao.mao.upgradesStreet` (ou helper do quiz `decidirPosMaoAtual(sessao)` → `'pergunta' | 'skip' | 'falha' | 'pendente'`). MUST NOT importar `motor.js`.

---

## 3. Cadência após o beat da 5.3

Estende [hud-cadencia.md da 003](../../003-feedback-persistencia/contracts/hud-cadencia.md).

| Passo acertado | Próximo |
|----------------|---------|
| `flop_hero` | ver tabela `upgradesStreet` do flop |
| `flop_upgrade` | `deal` turn (inalterado) |
| `flop_skip` + `CONTINUAR` | `deal` turn |
| `turn_hero` | ver tabela `upgradesStreet` do turn |
| `turn_upgrade` | `deal` river |
| `turn_skip` + `CONTINUAR` | `deal` river |
| `river_*` | inalterado (003) |

### 3.1 Decisão `upgradesStreet`

| Estado | HUD | CTA |
|--------|-----|-----|
| `ok === false` | `ociosa`; mão abortada; linha **Não foi possível continuar esta mão. Tente de novo.** | **Nova mão** |
| `ok` e lista vazia | `sem_upgrade`; frase **Não há upgrade possível.** | **Continuar** |
| `ok` e lista ≥ 1 | `perguntando`; enunciado **Quais mãos você ainda não tem, mas ainda pode formar?**; 6 opções; modo `multipla` | **Confirmar** |
| ainda `pendente` | permanece no acerto da 5.3 ≤ **1 s**; depois disso trata como falha | nenhum spinner |

MUST NOT: skip falso por espera ou falha; abrir a próxima street no acerto da 5.3; 5.4 no river; `alert()`.

`CONTINUAR` fica habilitado em `flop_skip` **e** `turn_skip`. MUST NOT gravar `upgrade` no skip.

Se a falha for detectada ainda no pouso, abortar **antes** da 5.3 é permitido (mesmo espírito de montagem que falhou).

---

## 4. Apresentar `flop_upgrade` / `turn_upgrade`

1. `conjunto = sessao.mao.upgradesStreet.conjunto` (ou recalcular com `conjuntoOpcoesUpgrade`).
2. Mapear `ids` → opções `{ id, rotulo }` via `CATEGORIAS` do motor (rótulo RN-014).
3. `verdadeira === verdadeiros.includes(id)`.
4. `shuffleOpcoes` (RNG injetável). MUST NOT importar `baralho.js`. MUST NOT reembaralhar no retry.
5. `sessao.mao.conjuntoCorreto = verdadeiros`. `corretaUnica = null`.
6. CTA **Confirmar**. Foco: primeira opção da ordem visual (`focarPrimeiroHabilitado` já existente). Tab: ativáveis → **Confirmar**.
7. MUST NOT haver controle “marcar todas”.
8. MUST NOT haver “draw”, “gutshot”, “flush draw”, “outs”, kicker ou “par de ases” em enunciado, opções, `aria-*` ou feedback.

---

## 5. Primeira Confirmar (`upgrade`)

Contrato 003 §4, agora com o conjunto **real** das opções **exibidas**:

| Situação | `upgrade[id]` |
|----------|----------------|
| Upgrade verdadeiro marcado | +1 acerto |
| Upgrade verdadeiro não marcado | +1 erro |
| Distratora marcada | +1 erro |
| Distratora não marcada | não incrementa |

Upgrades que **não couberam** nos 6: 0 acerto, 0 erro, 0 exposição nesta pergunta.

Confirmar seguintes: 0 escrita. Flop e turn da mesma mão = duas exposições independentes se ambas não-skip.

Fail-open: se `storage` falhar, enumeração e quiz seguem (003). Falha de enumeração **não** é fail-open: aborta a mão.

MUST NOT alterar `mao_atual` nem `vencedor_pote` nesta pergunta.

---

## 6. O que o HUD MUST NOT fazer nesta feature

- Perguntar upgrades no river.
- Abrir turn no acerto de `flop_hero` (ainda falta 5.4 ou skip).
- Abrir river no acerto de `turn_hero`.
- Tratar falha de enumeração como `sem_upgrade`.
- Spinner, percentual, “calculando”.
- Mostrar kicker, draws nomeados, “Sequência”, naipe por extenso.
- Controle “marcar todas”.
- `alert()`.
- Importar lib de poker.
- `mesa.js` chamar `localStorage` ou `motor.js`.
- Persistir runouts, snapshot, lista ou dump.

---

## 7. Copy de falha

| Constante sugerida | Texto exato |
|--------------------|-------------|
| `LINHA_ERRO_ENUMERACAO` | Não foi possível continuar esta mão. Tente de novo. |

MUST NOT reusar “Não foi possível embaralhar…” se a falha for da enumeração (lição errada). MUST NOT anexar stack, ids de carta ou JSON.

---

## 8. Casos de contrato (automatizáveis da integração)

1. Flop pousado → `flop_hero` visível; 0 grade de upgrades; `upgradesStreet` já `ok` ou `falha` em memória.
2. Acerto 5.3 + beat + lista ≥ 1 → `flop_upgrade`, enunciado 5.4, 6 opções, **Confirmar**; turn ainda fechado.
3. Flush só é `verdadeira` se RN-020 o disser — o stub `CONJUNTO_UPGRADE_STUB` MUST NOT restar nestes dois passos.
4. Lista vazia no flop (royal) → `flop_skip`, 0 `upgrade` muda, **Continuar** abre o turn (CA-017).
5. Turn com exatamente 2 upgrades → 2 verdadeiras + 4 distratoras (CA-015); **não** cai em `turn_skip`.
6. Conjunto exibido correto + Confirmar → beat → próxima street; 0 segunda 5.4 na mesma street.
7. 1ª Confirmar Flush marcado + Par distratora → `upgrade.flush` +1 acerto, `upgrade.par` +1 erro; pergunta aberta (CA-016).
8. 2ª Confirmar: 0 delta.
9. Distratora não marcada na 1ª: 0 incremento.
10. Flop e turn ambos não-skip: duas 1ªs Confirmar em `upgrade`.
11. River: 0 passo `*_upgrade`.
12. `enumerarUpgrades` `!ok` → `ociosa` + Nova mão; 0 `sem_upgrade`; evolução prévia intacta.
13. Após enumerar, as 11 de `cartasJogo` e burns visuais são as mesmas identidades/slots.
14. 10 perguntas novas: ordem visual do conjunto obrigatório não é constante; retry não reembaralha.
15. Abertura da 5.4: primeiro `button` habilitado é a primeira opção; Enter nela não submete.
16. 0 controle cujo rótulo/ação seja marcar todas.
17. UI desta pergunta: 0 ocorrências de draw/gutshot/outs/kicker.
