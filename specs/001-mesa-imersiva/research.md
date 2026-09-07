# Research: Mesa imersiva e sessão de treino

**Feature**: `001-mesa-imersiva`  
**Date**: 2026-09-07  
**Status**: Completo — nenhum `NEEDS CLARIFICATION` remanescente no Technical Context.

Fontes: [spec.md](./spec.md), [constitution](../../.specify/memory/constitution.md), [PRD §5.1](../../docs/prd.md), [context.md](../../docs/context.md), ADRs 001–007.

Escolhas ambíguas foram resolvidas pela opção recomendada/padrão (não reabrem a stack). Cada decisão abaixo é o contrato técnico desta feature.

---

## 1. Stack do cliente (já decidida)

**Decision:** HTML + CSS + JavaScript ES modules no navegador; `index.html` na raiz do repositório; GitHub Pages; sem bundler, sem framework, sem backend, sem `file://`.

**Rationale:** Constitution III, ADR-001 e ADR-006. O casco da mesa é um único shell; a sessão inteira ocorre numa tela. Servir em `http://` local (ex.: `python -m http.server`) ou HTTPS no Pages.

**Alternatives considered:** Vite/`dist` (rejeitado — bundler); app.js monolítico (rejeitado — ADR-006 pede módulos por domínio); `file://` (não suportado).

---

## 2. Organização dos módulos nesta feature

**Decision:** Implementar só o que o casco precisa; reservar os demais nomes do ADR-006 para as features seguintes, sem fingir motor/shuffle/storage.

| Módulo | Nesta feature | Depois |
|--------|---------------|--------|
| `js/mesa.js` | Máquina de estados da sessão/HUD, layout âncora | Permanece o orquestrador |
| `js/carta.js` | Componente DOM frente/verso, flip CSS, slots | Reusado no deal real (002) |
| `js/audio.js` | Web Audio sintetizado, unlock no gesto, fail-open | Permanece |
| `js/quiz-stub.js` | Cadência stub + correção provisória + shuffle visual das opções | Substituído/absorvido por `quiz.js` nas 003–006 |
| `js/baralho.js` | **Não criar** | Feature 002 |
| `js/motor.js` | **Não criar** | Features 004–006 |
| `js/quiz.js` | **Não criar** (evitar colisão com o contrato real) | Feature 003+ |
| `js/storage.js` | **Não criar**; zero escrita em `localStorage` | Feature 003 |

**Rationale:** YAGNI da constitution. Criar `quiz.js` / `baralho.js` vazios agora induziria implementação prematura do motor. O stub fica isolado e descartável.

**Alternatives considered:** Um único `app.js` (rejeitado); já criar `baralho.js` com 52 cartas (escopo da 002); persistir sessão no `localStorage` (viola “esta feature NÃO persiste evolução”).

---

## 3. Cartas visuais sem o shuffle da 002

**Decision:** Deal **cênico** com um conjunto stub de **11 faces distintas** (6 hole + 5 comunitárias), escolhidas de um baralho visual fixo ou de um ciclo determinístico no cliente. **Não** implementar Fisher–Yates, Web Crypto, pool de cursor nem RN-044.

As hole cards do herói abrem ao pousar; as de A e B ficam de verso até o showdown. Flip = `transform` CSS no componente (`rotateY`), não troca de `src` de PNG. Rank em tipografia; naipes SVG vermelho/preto. Um único verso. **Proibido** Unicode U+1F0A0… e emoji como carta principal (ADR-005, FR-018).

**Rationale:** A spec exige o ritual visual (voo, pouso, visibilidade) e declara o baralho permutado como 002. Faces distintas evitam a mesa “mentir” com duplicatas óbvias no casco, sem antecipar o gerador.

**Alternatives considered:** 52 PNGs (rejeitado — ADR-005); Canvas (excesso); cartas Unicode (vedado); shuffle real agora (feature 002).

---

## 4. Burn cênico (RN-G007)

**Decision:** **Incluir** queima visual breve no turn e no river: um verso teatral que **não** ocupa slot do board e **não** consome carta do conjunto stub das 11. Depois o turn/river abre no slot 4 ou 5.

**Rationale:** A spec marca burn como opcional. Incluí-lo torna RN-G007 testável nesta feature (gate da constitution: se existir burn, G007 aplica). Escolha padrão alinhada ao PRD §5.1 (turn/river MAY queimar).

**Alternatives considered:** Omitir burn até 002 (menos superfície, mas G007 ficaria só “N/A”); burn que consome carta (vedado).

---

## 5. Cadência stub do quiz (sem motor)

**Decision:** Percorrer os cinco estados do HUD com conteúdo provisório, uma pergunta por vez, seleção única no clique (sem **Confirmar** — multi-select de upgrades não é desta feature).

Ordem obrigatória após **Nova mão** / **Próxima mão**:

1. Deal hole cards → HUD `deal` → sem pergunta com board vazio.
2. Flop voa (HUD `deal`) → pousa → `perguntando` “Qual mão você tem agora?” (6 rótulos RN-014).
3. Acerto → `sem_upgrade` “Não há upgrade possível.” + **Continuar**.
4. Turn (burn opcional + carta) → `perguntando` mesmo enunciado → acerto → `sem_upgrade` + **Continuar**.
5. River pousa no slot 5 → virada de A e B → só então `perguntando`:
   - “Qual mão você tem agora?”
   - “Qual mão o Adversário A completou?”
   - “Qual mão o Adversário B completou?”
   - “Quem ganhou o pote?”
6. Acerto do vencedor → `resultado` + **Próxima mão**.

Correção do stub: exatamente uma opção exibida é a correta (id interno, não posição). Erro: texto “Não é essa. Tente de novo.”, opção desabilitada, sem revelar a certa. Acerto: “Você acertou” e avança. A correta **pode não coincidir** com o feltro.

**Rationale:** Clarificações da spec: casco testável sozinho; contadores e motor ficam 003–006; RN-G001/G002/G005 no casco.

**Alternatives considered:** HUD `perguntando` vazio até a 004 (rejeitado pela spec); multi-select de upgrades agora (fora de escopo); `alert()` (vedado).

---

## 6. Ordem visual das opções (RN-G008)

**Decision:** A cada abertura de pergunta, embaralhar a **ordem visual** das opções no cliente (`Math.random()` basta no stub; o shuffle de baralho da 002 é outro problema). A opção correta MUST NOT ficar sempre no mesmo botão. O id da correta é estável; só a permutação da grade muda.

**Rationale:** G008 aplica-se a “cada pergunta”, inclusive stub. `Math.random()` aqui não é a aleatoriedade da mão (ADR-004).

**Alternatives considered:** Ordem fixa RN-014 (viola G008); Fisher–Yates com crypto nas opções (overkill para 6 itens).

---

## 7. Rótulos e vencedor no stub

**Decision:** Perguntas de categoria: **exatamente 6** rótulos canônicos de RN-014 (nunca sinônimos; nunca kicker). Pergunta do pote: textos de RN-030 (quem ganhou), não categorias.

Script de vencedor para tornar G003 visível sem gerador:

- **Mão 1 da sessão:** correta = **Você** (pote caminha ao herói).
- **Mão 2 e seguintes:** correta = **Você e Adversário A** (bolo divide-se visualmente).

Opções do pote no stub: 6 textos seguindo a prioridade RN-031 (incluir a correta + completar a lista).

Categorias stub: conjunto fixo de 6 rótulos por passo, com um `correctId` documentado em [contracts/hud-session.md](./contracts/hud-session.md), para o quickstart ser determinístico após o shuffle visual (validar por texto da correta, não por índice).

**Rationale:** FR-011 + RN-G004 (kickers nunca em texto) + RN-G003 (empate faz parte do treino — aqui só o desfecho visual).

**Alternatives considered:** Sempre split (cobre empate, mas não o pote único); vencedor aleatório (quebra o quickstart).

---

## 8. Áudio (ADR-007)

**Decision:** Módulo `js/audio.js` com `AudioContext`. Unlock no primeiro gesto **Nova mão** ou **Próxima mão**. One-shots sintetizados (oscilador / ruído filtrado, mix baixo, sem BGM) nos eventos: shuffle, deal, flop, virada de showdown, acerto, erro. Sem samples MP3/OGG. Sem mute/volume na UI. Qualquer falha (autoplay, contexto suspenso, API ausente) → mesa muda, sem `alert()`, sem modal.

Som MAY tocar mesmo com `prefers-reduced-motion` (spec: movimento some, eventos de som MAY continuar).

**Rationale:** Constitution VII + ADR-007 + FR-023.

**Alternatives considered:** Howler + WAV (lib + assets); silêncio total no MVP (foge do §5.1).

---

## 9. Movimento e teto de ritmo

**Decision:** Animações CSS (`transform` / `@keyframes`) para deal em leque/deslize, flop em sequência rápida, turn/river, virada `rotateY`, recolhimento em **Próxima mão**. Teto: **2 s** por street na **primeira** mão da sessão (contador em memória, reset no reload); **≈ 1 s** da segunda em diante. Quiz só habilita após `animationend` / timeout de segurança do teto — o que ocorrer primeiro sem ultrapassar o teto.

Se `prefers-reduced-motion: reduce`: cartas já nos lugares (0 s de voo); HUD trata como pousadas e MAY habilitar o quiz na hora.

Falha ao iniciar o deal: voltar a `ociosa` + **Nova mão** (spec edge case).

**Rationale:** FR-022, SC-010, clarificação de movimento reduzido.

**Alternatives considered:** Web Animations API obrigatória (desnecessário; CSS cobre); permitir clique durante o voo (veda CA-026).

---

## 10. Layout desktop-first e teclado

**Decision:** Viewport de referência **1280×720 CSS px**. Feltro oval, rail, holofote no centro, três assentos (Você embaixo maior; A e B), cinco slots, pote cênico, HUD faixa inferior. Abaixo do mínimo: HUD MAY empilhar; cartas permanecem legíveis. Chrome de página mínima.

Avatares: ilustração SVG/CSS geométrica — **MUST NOT** foto de pessoa real nem upload. Apelidos fixos de produto.

Acessibilidade desta feature: contraste HUD/cartas; erro vs acerto em **texto e** estado visual; alvos grandes; Tab na ordem de leitura; Enter/Espaço ativam CTAs e opções; foco visível. Mouse permanece o caminho principal. Sem exigir teclado.

**Rationale:** FR-007, FR-019, FR-021, SC-008, SC-011, Principle VI.

**Alternatives considered:** Mobile-first (contraria o produto); skip de teclado (contraria clarificação).

---

## 11. Persistência e LGPD nesta feature

**Decision:** Estado da mão **só em memória**. Reload → `ociosa`; mão abortada. **MUST NOT** escrever `localStorage` / cookies / fingerprint. **MUST NOT** coletar dado pessoal. Apelidos não são editáveis. Nenhum payload a servidor. Quando a 003 chegar, falha de storage será fail-open (já exigido pela constitution); o casco não depende disso.

**Rationale:** Principle II, FR-016, FR-025, ADR-002 (evolução é outra feature), RN-039.

**Alternatives considered:** Salvar mão em curso para retomar (pede identidade ou storage de jogo — fora do MVP); sessionStorage da mesa (não pedido; reload deve perder a mão).

---

## 12. Testes sem bundler

**Decision:** (1) Guia manual [quickstart.md](./quickstart.md) no browser em `http://`. (2) Testes de contrato da FSM do HUD como ES modules com `node --test` (Node 18+), importando a máquina de estados extraída de `js/mesa.js` (funções puras de transição, sem DOM). Sem framework de teste de UI, sem Vite, sem CI obrigatório nesta feature.

**Rationale:** Custo zero; valida G001/G002/CTAs sem abrir o Pages. O visual (feltro, flip, 1280×720) só se prova no browser.

**Alternatives considered:** Playwright/Cypress (dependência pesada contra “mínimo”); zero testes automatizados (FSM ainda assim precisa de contrato escrito).

---

## Registro de escolhas (ambíguo → padrão)

| Tema | Escolha |
|------|---------|
| Branch git | Permanecer em `main` (assumption da spec / roadmap sequencial). Identidade Spec Kit: `001-mesa-imersiva`. |
| Burn | Incluir verso teatral no turn e no river. |
| 11 cartas | Faces stub distintas, sem shuffle ADR-004. |
| Vencedor stub | Mão 1 = Você; mão 2+ = Você e Adversário A. |
| Categorias stub | Sempre 6 rótulos RN-014. |
| `Math.random` nas opções | Permitido só para G008 no stub. |
| Testes | Quickstart + `node --test` da FSM. |
| `localStorage` | Não usar nesta feature. |
| Raiz do site | `index.html` na raiz do repo. |
