# Research: Feedback de resposta e persistência da evolução

**Feature**: `003-feedback-persistencia`  
**Date**: 2026-09-07  
**Status**: Completo — nenhum `NEEDS CLARIFICATION` remanescente no Technical Context.

Fontes: [spec.md](./spec.md), [constitution](../../.specify/memory/constitution.md) v1.0.0, [PRD §5.6](../../docs/prd.md) (+ RN-019/024/025/026/032/038 e enunciado 5.4), [ADR-002](../../docs/adr/ADR-002-persistencia-localstorage.md), [ADR-006](../../docs/adr/ADR-006-es-modules-sem-bundler.md), casco [001-mesa-imersiva](../001-mesa-imersiva/), baralho [002-embaralhamento-deal](../002-embaralhamento-deal/).

A stack **não se reabre**. Escolhas ambíguas foram resolvidas pela opção recomendada/padrão e registradas no final.

---

## 1. Stack do cliente (já decidida)

**Decision:** HTML + CSS + JavaScript ES modules nativos; `index.html` na raiz; GitHub Pages; sem bundler, sem framework, sem backend, sem `file://`. Persistência só em `localStorage` da origem (JSON). Sem IndexedDB, sem nuvem, sem `sessionStorage` como banco.

**Rationale:** Constitution I–III, ADR-001, ADR-002, ADR-006. O contrato de quiz e a evolução cabem em dois módulos de domínio; o casco e o baralho já existem.

**Alternatives considered:** IndexedDB (excesso para dezenas de inteiros; ADR-002 rejeitou); `sessionStorage` (morre ao fechar a aba — falha CA-023); backend/sync (custo + LGPD).

---

## 2. Organização dos módulos nesta feature

**Decision:** Criar **`js/quiz.js`** e **`js/storage.js`**. **Substituir** `js/quiz-stub.js`: o stub da 001 **evolui** para o contrato real de responder/feedback/1ª tentativa; o **conteúdo** das perguntas de mão (rótulos, correta provisória, conjunto de upgrades) permanece stub até 004–006. **Não** criar `js/motor.js`.

| Módulo | Nesta feature |
|--------|----------------|
| `js/quiz.js` | **Novo.** Contrato §5.3/5.4/5.5/5.6: modo única vs múltipla, submissão, opção morta/travada, G008, 1ª tentativa, cadência de passos, conteúdo stub. Único escritor dos contadores (via `storage`). |
| `js/storage.js` | **Novo.** Ler/gravar/normalizar o JSON no `localStorage`; fail-open; sem PII. Sem lógica de pergunta. |
| `js/mesa.js` | Orquestra HUD: importa `quiz.js` (não `quiz-stub.js`); novos eventos `ALTERNAR_OPCAO`, `CONFIRMAR`, `FIM_BEAT_ACERTO`; flop acertado → multi-select (não skip); **não** chama `localStorage` direto. |
| `js/quiz-stub.js` | **Remover** após migrar imports (mesa + testes). Não manter os dois em paralelo. |
| `css/hud.css` | Estender: **Confirmar**, marca ✕ da morta, marca ✓ da acertada, `aria-pressed` no multi-select. Distinção acerto/erro MUST NOT depender só de cor. |
| `js/baralho.js` / `carta.js` / `audio.js` | Intocados no contrato de shuffle/cartas/SFX. Quiz MUST NOT reembaralhar as 52. |
| `js/motor.js` | **Não criar.** |

**Rationale:** ADR-006 reserva `quiz` e `storage` para esta feature. A 001 isolou o stub precisamente para esta substituição. YAGNI: motor é 004–006.

**Alternatives considered:** Manter `quiz-stub.js` + `quiz.js` fino (duplica cadência); embutir storage em `quiz.js` (quebra o domínio ADR-006); já criar `motor.js` (fora de escopo).

---

## 3. Cadência: flop com upgrades stub, turn com skip

**Decision:** Depois do acerto de `flop_hero`, o HUD **não** vai a `sem_upgrade`. Abre `flop_upgrade` (`perguntando`, múltipla seleção, CTA **Confirmar**). Acerto do conjunto → beat → deal do turn (sem **Continuar**). Depois do acerto de `turn_hero`, permanece o skip `turn_skip` do casco (**“Não há upgrade possível.”** + **Continuar**). River inalterado (três categorias + vencedor, seleção única).

Passos:

| Passo | Modo | Após acerto |
|-------|------|-------------|
| `flop_hero` | seleção única | `flop_upgrade` |
| `flop_upgrade` | múltipla seleção | deal turn |
| `turn_hero` | seleção única | `turn_skip` (`sem_upgrade`) |
| `turn_skip` | skip (não é pergunta) | deal river (**Continuar**) |
| `river_hero` / `river_a` / `river_b` | seleção única | próxima pergunta |
| `river_vencedor` | seleção única | `resultado` |

`flop_skip` **sai** da cadência (o flop desta feature sempre tem o stub 5.4). 005 substituirá o stub e poderá reintroduzir skip no flop quando RN-020 for vazio.

**Rationale:** FR-020 + clarificação: US2 testável sem o motor; os dois caminhos (Confirmar vs skip) continuam observáveis. CA-012 do PRD: após 5.3 do flop vem 5.4 **ou** skip — aqui escolhemos 5.4 no flop e skip no turn.

**Alternatives considered:** Multi-select também no turn (esconde o skip; viola FR-020); esperar a 005 (bloqueia a feature).

---

## 4. Conteúdo stub (até 004–006)

**Decision:** Contadores seguem a correta **do contrato da pergunta em vigor**, não o feltro (ainda honesto pela 002). Inconsistência pedagógica entre mão atual e upgrades é aceita até o motor.

**Mão atual (seleção única):** o mesmo conjunto visual de 6 rótulos da 001 (Par, Carta alta, Dois pares, Trinca, Flush, Straight). Correta do **herói** (`flop_hero`, `turn_hero`, `river_hero`) = **Flush** (`id`: `flush`) — CA-023.testável na primeira pergunta. Correta de **Adversário A** e **Adversário B** = **Par** (`id`: `par`).

**Upgrades do flop (múltipla seleção):** exatamente as **mesmas 6** categorias visíveis. Conjunto correto provisório = só **Flush**. **Par** é distratora. As outras quatro (Carta alta, Dois pares, Trinca, Straight) também são distratoras. Enunciado canônico do PRD §5.4: **“Quais mãos você ainda não tem, mas ainda pode formar?”**

**Vencedor:** inalterado (mão 1 = Você; mão 2+ = Você e Adversário A).

**Rationale:** Um verdadeiro (Flush) + Par distratora satisfaz FR-020 e CA-016/US3 sem inventar um segundo upgrade. Reusar as 6 faces da 001 evita nova grade. Carta alta como distratora antecipa RN-022 (nunca é upgrade) sem implementar o motor. Herói=Flush e upgrade verdadeiro=Flush **não** batem com RN-021 — documentado; 005 corrige.

**Alternatives considered:** Dois upgrades verdadeiros (Flush+Straight) — mais casos de omissão, desnecessário para FR-010; correta do herói continuar Par — falha CA-023 nesta feature; opções diferentes no multi-select (ruído visual).

---

## 5. Submissão: clique vs Confirmar

**Decision:**

- **Seleção única:** `ESCOLHER_OPCAO` submete. MUST NOT renderizar **Confirmar**. Enter/Espaço na opção focada = clique.
- **Múltipla seleção:** clique/Enter/Espaço **alterna** `aria-pressed` (`ALTERNAR_OPCAO`) e **não** avalia. Só `CONFIRMAR` avalia o conjunto das opções **exibidas**.
- Opção `eliminada` ou `travada`: gesto ignorado; fora da ordem de Tab.
- Clique no feltro: não submete.
- Durante o beat de acerto: ignorar `ESCOLHER_OPCAO` / `ALTERNAR_OPCAO` / `CONFIRMAR`.

Regras RN-024/025 na 1ª **Confirmar** e seguintes: ver [contracts/quiz.md](./contracts/quiz.md). Skip `sem_upgrade` não chama storage de `upgrade`.

**Rationale:** RN-047, FR-001/002/011. Separar eventos deixa a FSM testável sem DOM.

**Alternatives considered:** Um único evento “clique” com branch interno (confunde o contrato); submeter multi-select no segundo clique (viola RN-047).

---

## 6. Marcas visuais e teclado (não só cor)

**Decision:** Acerto e erro distinguem-se por **texto do HUD** (copy canônica) **e** marca na opção:

- **Morta:** permanece no lugar; marca visível **✕** (ou equivalente CSS/SVG, não só mudança de cor); ênfase reduzida (opacidade + peso); `disabled` / não focável; `estadoVisual = eliminada`.
- **Acertada:** marca visível **✓** **só depois** de escolhida (única) ou travada como verdadeira (multi); `estadoVisual = acertada`.
- **Selecionada** (só multi, ainda não confirmada): `aria-pressed="true"`, contorno; desmarcar permitido até travar.

Tab: esquerda→direita, cima→baixo nas **ainda ativáveis**, depois o CTA visível (**Confirmar** ou **Continuar** / **Próxima mão**). Eliminadas e travadas (não desmarcáveis) saem do Tab. Travada verdadeira permanece visível com ✓ mas não recebe foco (não há ação). Mouse continua o caminho principal.

**Rationale:** Clarificação + CA-025 + FR-024. Cor sozinha falha daltonismo.

**Alternatives considered:** Só `opacity` (depende de cor/contraste); ícone Unicode de baralho (vedado como carta; ✕/✓ de UI são texto de estado, não face de carta).

---

## 7. Beat de acerto

**Decision:** Após “Você acertou”, a grade **permanece** visível com o estado de acerto. A FSM **não** usa timer interno: emite estado `aguardando_beat` (ainda `perguntando`) e o *adapter* do browser agenda `FIM_BEAT_ACERTO`.

- Padrão: **400 ms** (beat curto < 1 s).
- `prefers-reduced-motion: reduce`: **0 ms** (o adapter dispara na hora).
- Sem botão **Continuar** no acerto.
- Testes Node disparam `FIM_BEAT_ACERTO` na hora (sem `setTimeout` na FSM).

**Rationale:** Clarificação (teto 1 s / 0 se movimento reduzido). 400 ms é o padrão curto, não espera o teto. FSM síncrona = `node --test` estável (padrão da 001/002).

**Alternatives considered:** 1000 ms sempre (lento; viola o espírito de “beat curto”); avanço imediato para todos (ignora o beat pedido salvo movimento reduzido); `setTimeout` dentro de `aplicar()` (quebra testes).

---

## 8. Schema e chave do localStorage

**Decision:**

- Chave única: `poker-trainer:evolucao` (produto, sem identificador de pessoa).
- Valor: JSON **somente** com os três buckets. MUST NOT `versao`, MUST NOT timestamp, MUST NOT session id (FR-012).
- Chaves das 10 categorias: **ids estáveis** já usados no stub (`royal_flush`, `straight_flush`, `quadra`, `full_house`, `flush`, `straight`, `trinca`, `dois_pares`, `par`, `carta_alta`), mapeados 1:1 aos rótulos RN-014.
- Cada célula: `{ acertos, erros, exposicoes }` inteiros ≥ 0; no MVP `exposicoes === acertos + erros`.
- `vencedor_pote`: um grupo `{ acertos, erros, exposicoes }`, sem as 10 categorias.
- **Escrita preguiçosa:** não gravar zeros no load (evita uma aba ociosa sobrescrever evolução de outra). Primeira mutação de 1ª tentativa grava o bloco **completo** (10+10+1, zeros nas não tocadas).
- Duas abas: **read → mutate → write** do blob inteiro; última gravação válida ganha; **sem** mescla de incrementos; **sem** aviso na UI.

`quiz.js` é o único chamador de escrita. `storage.js` aceita um `Storage` injetável (default `window.localStorage`) para testes Node.

**Rationale:** ADR-002 + FR-012/015/017. Ids ASCII evitam problema de encoding; o relatório futuro (pós-MVP) mapeia id→rótulo. LWW é a clarificação.

**Alternatives considered:** Chaves = rótulos pt-BR (ok, mas ids já existem no código); gravar zeros no boot (risco de wipe entre abas); `sessionStorage` backup (vira segundo banco — vedado).

---

## 9. Fail-open e corrupção

**Decision:** Qualquer falha de `getItem`/`setItem`/`removeItem`/`JSON.parse` (quota, recusa, SecurityError, indisponível): a mesa **segue**; evolução da visita MAY perder-se; **sem** `alert()`, **sem** linha extra no HUD, **sem** jargão, **sem** pedido de PII.

Normalização na leitura:

| Bloco | Ação |
|-------|------|
| Ausente / `null` | Contadores em memória = zero; **não** escreve |
| Ilegível (parse falha) ou estrutura incompatível (não é objeto com os três buckets reconhecíveis) | Descarta; memória = zero; **não** precisa gravar o zero (próxima 1ª tentativa reescreve) |
| Legível, falta categoria ou bucket | Campo faltante = 0; **preserva** o resto; chaves extras **ignora** |
| Célula com não-inteiro / negativo | Trata aquela célula como 0; não zera os outros buckets |

Escrita: se `setItem` lançar, o incremento **desta visita** permanece só em memória até o fechamento.

**Rationale:** Constitution VII, FR-017/018, clarificação bloco incompleto vs corrompido. Degradação **silenciosa** (diferente da copy de falha de embaralhar da 002).

**Alternatives considered:** Banner “cookies bloqueados” (jargão + não é cookie); mesclar abas com `storage` event (complexo; spec pede LWW sem aviso).

---

## 10. LGPD, relatório e zerar

**Decision:** O único persistido é o JSON de contadores. MUST NOT: CPF, e-mail, nome, apelido digitado, foto, trajetória do pool da 002, replay de cartas, enunciados, origem da aba, user-agent. MUST NOT enviar payload a servidor. MUST NOT tela de relatório, gráfico, ranking, tabela de stats, botão zerar. Limpar dados do site no navegador zera a chave. Apelidos continuam **Você / Adversário A / Adversário B**.

**Rationale:** Principle II/IV, RN-039/040, CA-024, workspace LGPD (feature 003 = só contadores, fail-open).

**Alternatives considered:** Exportar JSON (pós-MVP); botão zerar “para testes” (veda CA-024).

---

## 11. G008 isolado do baralho

**Decision:** Embaralhar opções **ao apresentar** cada pergunta, com RNG **injetável** (default `Math.random`). MUST NOT chamar `js/baralho.js` nem o pool de cursor. MUST NOT reembaralhar após erro na mesma pergunta. MUST NOT reembaralhar as 52.

**Rationale:** Continuidade da 001/002 (G008 ≠ ADR-004). Injeção permite teste de “não é sempre o mesmo botão” sem floco.

**Alternatives considered:** Reusar Web Crypto nas opções (mistura preocupações); ordem fixa (viola G008).

---

## 12. Testes sem bundler

**Decision:** (1) [quickstart.md](./quickstart.md) no browser `http://`. (2) `node --test`: `tests/contract/quiz.test.js`, `tests/contract/storage.test.js`, e **atualizar** `tests/contract/hud-session.test.js` (correta Flush, flop→upgrade não skip, Confirmar, beat). Storage mockado. Sem Playwright/Cypress.

**Rationale:** Mesmo padrão 001/002; custo zero; FSM + schema cobrem CA-022 e fail-open; CA-023 precisa do browser (fechar/reabrir).

**Alternatives considered:** Só quickstart (fraco para RN-024); Playwright (dependência contra o mínimo).

---

## Registro de escolhas (ambíguo → padrão)

| Tema | Escolha |
|------|---------|
| Branch git | Permanecer em `main`. Identidade Spec Kit: `003-feedback-persistencia`. |
| Módulos | Criar `js/quiz.js` + `js/storage.js`; remover `js/quiz-stub.js`; **não** criar `js/motor.js`. |
| Cadência flop | `flop_hero` → `flop_upgrade` (não `sem_upgrade`). |
| Cadência turn | Skip `sem_upgrade` inalterado. |
| Herói stub | Correta = **Flush**. A/B = **Par**. |
| Upgrade stub | 6 iguais à 001; verdadeiro = só Flush; Par distratora. |
| Enunciado 5.4 | “Quais mãos você ainda não tem, mas ainda pode formar?” |
| Chave storage | `poker-trainer:evolucao` |
| Chaves de categoria | ids snake_case; sem `versao`/timestamp no JSON |
| Escrita | Preguiçosa (só na 1ª tentativa); LWW sem mescla |
| Beat | 400 ms; 0 se movimento reduzido; evento `FIM_BEAT_ACERTO` |
| Marcas | ✕ morta, ✓ acertada; Tab só ativáveis |
| Fail-open | Silencioso; sem linha extra no HUD |
| RNG opções | `Math.random` injetável; isolado do baralho |
| Relatório / zerar | Ausentes (YAGNI / constitution IV) |
