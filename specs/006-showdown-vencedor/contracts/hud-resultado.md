# Contract: HUD e desfecho do showdown

**Feature**: `006-showdown-vencedor`  
**Tipo**: contrato de UI / sessão no cliente (sem HTTP)  
**Módulo**: `js/mesa.js` + `index.html` + `css/mesa.css` (+ ajuste menor em `css/hud.css`)  
**Consumidores**: treinando, testes `hud-session.test.js`  
**Quiz**: [quiz-showdown.md](./quiz-showdown.md)  
**Modelo**: [data-model.md](../data-model.md)

`mesa.js` MUST NOT importar `js/motor.js` nem chamar `localStorage`. Lê só `sessao.mao.showdown` preenchido pelo quiz e o contrato de passos já existente.

---

## 1. Virada simultânea (CA-018, FR-001)

1. Enquanto o turn não terminou: river **não** abre; A/B permanecem verso.
2. River pousa no slot 5 (`cartasJogo[10]`). HUD permanece `deal`. Chamar `prepararShowdown(sessao)`.
3. Em seguida, as quatro hole de A e B viram **no mesmo beat**. MUST NOT existir instante observável com um adversário face e o outro verso **quando o HUD sai de `deal`**.
4. Só então, se `showdown.ok`, abrir `river_hero`. As 6 hole + 5 comunitárias estão face-up.

Burn cênico (se existir) MUST NOT entrar no board. Preferência por reduzir movimento: virada MAY cortar para o estado final; o quiz trata as cartas como abertas.

---

## 2. Espera e aborto (FR-025)

Após a virada:

| `sessao.mao.showdown` | Ação |
|-----------------------|------|
| `ok === true` | Abrir `river_hero` |
| `ok === false` | Abortar já: `ociosa` + **Nova mão**; copy sem jargão (reuso da linha de falha da 005 se existir; senão a mesma família: mão não continua). Quiz **não** abre |
| ausente / `pendente` | Permanecer em `deal` ≤ **1 s**, sem spinner, sem “calculando”. Findo o teto sem `ok` → abortar |

Defesa: se a impossibilidade só for detectada depois, abortar também; contadores já gravados permanecem.

MUST NOT inventar vencedor. MUST NOT fingir **Os três empatam**.

---

## 3. Cadência das quatro perguntas (RN-G001, RN-G002)

- Uma pergunta por vez. Cada uma **substitui** o HUD.
- `river_hero` → `river_a` → `river_b` → `river_vencedor` → `resultado`.
- MUST NOT abrir 5.4 / skip / **Continuar** de upgrade no river.
- MUST NOT grudar rótulo de categoria no assento ou no painel entre perguntas.
- Durante `deal` e as quatro: `pote.modo === 'centro'`; `vencedoresVisuais === []`; 0 `data-vencedor` nos assentos; bolo **não** se move (FR-029).

---

## 4. `resultado` (CA-020, CA-021, FR-017)

Entrada: acerto de `river_vencedor` + beat encerrado. **Próxima mão** habilita **imediatamente**.

HUD, nesta ordem visual:

1. Texto de quem levou: rótulo RN-030 + **“levou o pote.”** (1 vencedor) ou **“dividem o pote.”** (2 ou 3). MUST NOT um único champion no split.
2. Três categorias já acertadas, **no HUD**, exatamente: **Você: {rótulo}** · **Adversário A: {rótulo}** · **Adversário B: {rótulo}**.
3. CTA **Próxima mão** (nunca **Embaralhar**).

Assentos:

- Só os ids em `showdown.vencedores` recebem destaque (`data-vencedor="true"` ou equivalente).
- Perdedores MUST NOT escurecer (`opacity`/filtro que prejudique a leitura das cartas).
- MUST NOT colar rótulo nas cartas. MUST NOT contornar as 5 da melhor mão.

Pote cênico:

- 1 vencedor: `modo = para_vencedor`; fichas caminham **àquele** assento (Você **ou** A **ou** B — o stub que sempre ia ao herói **sai**).
- 2 ou 3: `modo = split`; grupos visíveis só dos empatados. Acrescentar em `index.html` um `.pote-grupo[data-para='adversarioB']`.
- Fichas permanecem no(s) vencedor(es) até **Próxima mão**.
- Cenografia MUST NOT bloquear o CTA. Movimento reduzido: estado final imediato.

---

## 5. **Próxima mão** (FR-018)

Recolhe cartas, restaura bolo `centro`, zera destaque de assento, distribui nova mão na mesma mesa, sem reload perceptível, sem quiz preflop — mesmo se as fichas ainda caminhavam.

Aborto (`ociosa`) usa **Nova mão**, não **Próxima mão**.

---

## 6. Teclado e movimento (FR-027, FR-028)

- Tab alcança opções e CTAs; Enter/Espaço ativam; foco visível (casco 001).
- Ao abrir cada pergunta: foco na primeira opção da ordem visual.
- Beat de acerto: o da 003 (≤1 s; 0 s se movimento reduzido).

---

## 7. Proibições

- Importar `motor.js` / `localStorage` em `mesa.js`
- Mute, apostas, bb, relatório, botão zerar, quiz preflop, desistir
- Destacar vencedor ou mover bolo antes de `resultado`
- Spinner / “calculando”
- Unicode de baralho como face

---

## 8. Casos de contrato (automatizáveis em `hud-session.test.js`)

1. River pousado, virada ainda não: HUD `deal`; A/B verso; pote centro (SC-001 parcial).
2. Após showdown: A e B face no mesmo evento; `passo === river_hero`; 11 faces (CA-018, SC-023).
3. Sequência A → B → vencedor uma a uma; 0 empilhamento (SC-014).
4. Durante as quatro: `pote.modo === 'centro'` e `vencedoresVisuais` vazia (SC-022).
5. Único vencedor acertado → `resultado`, CTA **Próxima mão**, `para_vencedor`, `vencedoresVisuais` = o assento real — **não** sempre `voce` (CA-021).
6. Split herói vs A → `split`, `['voce','adversarioA']`, texto celebra empate (CA-020).
7. `tres` → três assentos destacados; grupo B visível; perdedores N/A.
8. Perdedores: 0 classe/estilo de escurecer (SC-025).
9. `categoriasIdentificadas` na ordem Você / A / B; 0 rótulo nas cartas (SC-024).
10. `showdown.ok === false` após virada → `ociosa` + **Nova mão**; 0 `perguntando` (SC-019).
11. **Próxima mão** com pote ainda `split`/`para_vencedor` → novo deal; pote volta a `centro` (SC-020).
12. 0 passo de upgrade no river; acerto de `river_hero` vai a `river_a` (SC-002, SC-013).
13. 2ª mão da sessão: pote **não** vira split só porque `indiceMaoSessao >= 2`.
