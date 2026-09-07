# Research: Embaralhamento e distribuição das cartas

**Feature**: `002-embaralhamento-deal`  
**Date**: 2026-09-07  
**Status**: Completo — nenhum `NEEDS CLARIFICATION` remanescente no Technical Context.

Fontes: [spec.md](./spec.md), [constitution](../../.specify/memory/constitution.md), [PRD §5.2](../../docs/prd.md), ADRs 001–007, casco [001-mesa-imersiva](../001-mesa-imersiva/).

A stack **não se reabre**. Escolhas ambíguas foram resolvidas pela opção recomendada/padrão e registradas no final.

---

## 1. Stack do gerador (já decidida)

**Decision:** Fisher–Yates no cliente com `crypto.getRandomValues` misturado a um pool local (cursor, `Date.now()`, tick de alta resolução). Cartas continuam HTML/CSS + naipes SVG (ADR-005). Módulo novo `js/baralho.js` em ES modules, sem bundler (ADR-006). Sem backend, sem API de entropia, sem lib de poker.

**Rationale:** Constitution III/VII, ADR-004, ADR-005, ADR-006. HTTPS no Pages habilita Web Crypto; `file://` permanece fora do modo suportado.

**Alternatives considered:** Só `Math.random()` (falha RN-010); PRNG semeado só com mouse (qualidade inferior; ritual de “mexa o mouse”); entropy-as-a-service (custo + rede); 52 PNGs (ADR-005).

---

## 2. Organização dos módulos nesta feature

**Decision:** Criar **somente** `js/baralho.js`. Orquestração continua em `js/mesa.js`. Faces vêm de `js/carta.js` (componente já existente). **Não** criar `js/motor.js`, `js/quiz.js` nem `js/storage.js`. **Não** reescrever `js/quiz-stub.js` (FR-020).

| Módulo | Nesta feature |
|--------|----------------|
| `js/baralho.js` | Baralho de 52, pool, Fisher–Yates, mapeamento RN-044, validação de montagem |
| `js/mesa.js` | Passa a consumir a permutação; deal visual A→B→Você; HUD permanece `ociosa` até montagem OK |
| `js/carta.js` | Reuso do componente; **remover** `CARTAS_JOGO_STUB` como fonte das 11 de jogo |
| `js/quiz-stub.js` | Intocado (cadência e correção provisória; G008 continua com `Math.random` do stub) |
| `js/audio.js` | Intocado (unlock no gesto já existe) |

**Rationale:** ADR-006 reserva `baralho` para esta feature. YAGNI: motor/quiz/storage são 003–006. Isolar o gerador permite `node --test` sem DOM.

**Alternatives considered:** Embutir shuffle em `mesa.js` (quebra o contrato de domínio); já criar `motor.js` (fora de escopo); reusar pool no shuffle das opções agora (FR-020 veda alterar o stub; FR-021 só exige não reembaralhar as 52).

---

## 3. Algoritmo Fisher–Yates e mistura com o pool

**Decision:** Permutação **in-place** Fisher–Yates das 52 cartas. A cada índice `i` (de 51 até 1), sortear `j ∈ [0, i]` com inteiro **sem viés de módulo**:

1. Obter 32 bits de `crypto.getRandomValues` (se existir).
2. XOR (ou mistura equivalente byte a byte) com 32 bits derivados do pool compacto.
3. Rejection sampling: rejeitar valores `≥ floor(2^32 / n) * n` e repetir, para `n = i + 1`.
4. Se `crypto` estiver ausente, derivar os 32 bits só do pool (cursor se houver + `Date.now()` + `performance.now()` + um contador de mãos da visita). **Não** é falha de montagem.

O shuffle corre **uma vez** por mão, **síncrono**, **antes** de qualquer deal visível. Streets **não** chamam de novo o gerador.

**Rationale:** ADR-004 pede inteiros adequados ao Fisher–Yates; módulo ingênuo enviesa ranks. Rejection sampling é o padrão recomendado e cabe em poucas linhas. Síncrono cabe em ≪ 1 s (SC-012).

**Alternatives considered:** `Math.random() * n | 0` (viés + falha RN-010); `crypto.getRandomValues` sozinho sem pool (falha RN-010 literal); `shuffle` de lib (dependência).

---

## 4. Pool de entropia e LGPD

**Decision:** Um buffer compacto em memória da visita (ex.: 32 bytes / 8× `Uint32`). **MUST NOT** guardar array de coordenadas, trajetória, timestamps listados ou snapshot do baralho.

- No `pointermove` (window/clube): misturar `clientX` e `clientY` no buffer (XOR + rotate) e **descartar** os números em seguida.
- A cada montagem: misturar `Date.now()` e `performance.now()` (fallback: `Date.now()` se `performance` faltar).
- O buffer **MAY** sobreviver entre mãos da **mesma** visita (clarificação da spec).
- Recarregar **apaga** o buffer. **MUST NOT** `localStorage`, cookies, `sessionStorage` como banco, fingerprint.

Sem movimento de ponteiro: o shuffle segue. Sem ritual visível de “gerar aleatoriedade”. Sem exibir o pool na UI.

**Rationale:** FR-003, FR-004, FR-019, Principle II, clarificação da mistura compacta. Coordenadas instantâneas usadas e descartadas **não** são cadastro nem identificador persistido.

**Alternatives considered:** Histórico de mouse para “melhor caos” (PII-adjacent + retenção); persistir pool (veda FR-019); exigir gesto de mouse (quebra ritmo e fail-open).

---

## 5. Mapeamento RN-044 vs. stub da 001

**Decision:** Depois da permutação, as 11 de jogo **são** as posições `[0]…[10]`:

| Índices | Destino |
|---------|---------|
| `[0]`, `[1]` | Adversário A |
| `[2]`, `[3]` | Adversário B |
| `[4]`, `[5]` | Você (herói) |
| `[6]`, `[7]`, `[8]` | flop (slots 1–3) |
| `[9]` | turn (slot 4) |
| `[10]` | river (slot 5) |
| `[11]…[51]` | restante — existem e **não** entram na mesa |

O casco 001 mapeava o stub como herói = `[0][1]`, A = `[2][3]`, B = `[4][5]`. **Esta feature corrige** `js/mesa.js` para RN-044. Dentro do assento, esquerda/direita do leque **MAY** ser `[par] = esquerda` e `[ímpar] = direita` (padrão recomendado); o contrato de produto é **quem** recebe **quais** cartas.

**Rationale:** FR-007 / PRD RN-044. Deixar o stub da 001 quebraria o showdown e o motor futuro (ADR-003).

**Alternatives considered:** Manter índice “herói primeiro” e só documentar um remap (confunde 003–006); deal round-robin A-B-Você-A-B-Você (veda clarificação).

---

## 6. Deal visível e cadência do casco

**Decision:** Ordem **entre assentos**: Adversário A (duas cartas) → Adversário B (duas) → Você (duas). Ao pousar: herói `face`; A e B `verso` até o showdown. Depois das hole cards, os slots 1–5 permanecem **vazios** (CA-008) — a reserva comunitária existe só nos dados. A street flop do casco **só então** abre `[6][7][8]` face-up; turn abre `[9]`; river abre `[10]`. **Não** reembaralhar. **Não** sortear o turn na hora.

**Próxima mão:** recolher até o feltro limpo (hole recolhidas, slots vazios) e **só então** permutar e deal. MUST NOT pintar faces novas sobre cartas ainda visíveis.

Permutação pronta **antes** do primeiro movimento. Deal visível começa em **< 1 s** após **Nova mão** (ou após feltro limpo em **Próxima mão**). `prefers-reduced-motion: reduce`: corte imediato no lugar; teatro de shuffle **MUST NOT** rodar. O casco 001 **não** tem teatro de misturar no feltro hoje — **não adicionar** um teatro nesta feature (YAGNI). Som de `shuffle` do casco MAY continuar no gesto; não é segundo sorteio.

**Rationale:** FR-008, FR-009–FR-012, FR-015, FR-022, US2/US3. Cadência do quiz stub permanece; só a origem das faces muda.

**Alternatives considered:** Round-robin de uma carta (rejeitado); verso antecipado nos slots do flop (rejeitado pela clarificação); teatro visual de shuffle (não existe no casco; reduced-motion o proibiria).

---

## 7. Montagem, HUD `ociosa` e falhas

**Decision:** **Não** criar sexto estado de HUD. Enquanto a montagem corre, o HUD **permanece** `ociosa`. Só entra em `deal` se as 52 cartas forem válidas (52 distintas, sem coringa, mapeamento possível). Segunda ativação de **Nova mão** durante a montagem é **ignorada** (uma tentativa por vez — o `ritualTrava` do casco cobre o gesto).

Falha de montagem (baralho incompleto, duplicata, mapeamento impossível) — **não** a ausência de Web Crypto:

- mão **não** inicia;
- HUD **permanece** `ociosa` (nunca entra em `deal`);
- linha **exata**: `Não foi possível embaralhar. Tente de novo.`;
- CTA **Nova mão** permanece;
- sem `alert()`, sem jargão.

Essa linha **substitui** “Treine ler as mãos. Sem apostas.” até a próxima montagem bem-sucedida ou reload.

`FALHA_DEAL` da 001 (exceção **depois** de já estar em `deal`, ex. animação) permanece para o casco não ficar preso; **não** é o caminho da falha de montagem.

**Rationale:** FR-017, FR-023, Principle VII, clarificações da 2ª sessão.

**Alternatives considered:** Entrar em `deal` e voltar (veda FR-017); estado HUD `montando` (veda “sem sexto estado”); `alert()`.

---

## 8. Burn, restante e empates (RN-G007 / RN-G003)

**Decision:** Burn cênico do casco **permanece** no turn/river: verso teatral fora dos cinco slots, **sem** rank, **sem** consumir `[11+]`. As 11 de jogo são sempre `[0]…[10]`. O gerador **MUST NOT** filtrar permutações que empatam o pote. CA-006 (janela de 10 mãos) é **critério de aceitação**, não um reject-and-retry no shuffle — filtrar coincidências seria desonesto e chegaria perto de filtrar boards.

**Rationale:** RN-045, RN-G007, RN-G003, FR-013, FR-018. Fisher–Yates honesto torna 10 sequências idênticas de 11 cartas um bug (stub não substituído), não um caso a “corrigir” no gerador.

**Alternatives considered:** Burn que come `[11]` (veda G007); rejeitar boards empatados (veda G003); rejeitar permutação igual à anterior (teatro; não pedido).

---

## 9. Substituição das 11 faces stub

**Decision:** Remover `CARTAS_JOGO_STUB` de `js/carta.js` (ou deixá-lo sem consumidores). Toda mão iniciada com sucesso pinta as faces a partir de `cartasDeJogo(permutacao)`. Repetir A♠ K♥ Q♦ … 4♦ em todas as rodadas é falha de CA-006.

**Rationale:** FR-016. O componente DOM permanece; só a fonte dos `rank`/`suit` muda.

**Alternatives considered:** Manter o stub como fallback visual (mentiria o dealer); ciclo determinístico “para testes manuais” (quebra CA-006 em produção).

---

## 10. Testes sem bundler

**Decision:** (1) [quickstart.md](./quickstart.md) no browser `http://`. (2) `tests/contract/baralho.test.js` com `node --test`: 52 distintas, RN-044, restante fora, crypto ausente ainda permuta, montagem inválida rejeitada, 10 permutações não todas iguais, G003 (nenhum filtro de empate no código de shuffle). (3) Estender `tests/contract/hud-session.test.js`: `INICIAR_MAO` só com montagem OK; falha de montagem permanece `ociosa` com o copy canônico; após holes o board segue vazio; mapeamento A/B/herói.

Injetar `getRandomValues` / pool nos testes via parâmetros opcionais do módulo (funções puras + RNG injetável). Sem Playwright.

**Rationale:** Mesmo padrão da 001; o gerador é testável sem DOM. Visual (ordem A→B→Você, flip, burn) prova-se no quickstart.

**Alternatives considered:** Só teste manual (fraco para Fisher–Yates e RN-044); Cypress (peso contra MVP).

---

## 11. Persistência, custo e idioma

**Decision:** Zero escrita em `localStorage`/cookies. Zero payload a servidor. Copy nova só a linha de erro em pt-BR. CTAs continuam **Nova mão** / **Próxima mão** — nunca **Embaralhar**. Sem API paga de aleatoriedade.

**Rationale:** Principles I–III, FR-019, FR-020.

**Alternatives considered:** Gravar a mão para “retomar” (pede retenção); CTA Embaralhar (veda constitution I).

---

## Registro de escolhas (ambíguo → padrão)

| Tema | Escolha |
|------|---------|
| Branch git | Permanecer em `main` (roadmap sequencial). Identidade Spec Kit: `002-embaralhamento-deal`. |
| Inteiro do Fisher–Yates | Uint32 + rejection sampling; XOR com o pool. |
| Pool | Buffer compacto 32 bytes; XOR+rotate; sem histórico de coordenadas. |
| Mix entre mãos | Permanece na visita; some no reload. |
| Teatro visual de shuffle | **Não** adicionar; o casco não tem; reduced-motion o proibiria. |
| Esquerda/direita no leque | `[0]`/`[2]`/`[4]` = esquerda do assento (padrão). |
| Quiz G008 | Stub inalterado (`Math.random`); fontes da rodada **não** reembaralham as 52. |
| CA-006 | Teste de aceitação; **não** filtro no gerador. |
| `FALHA_DEAL` (001) | Mantida só para exceção **após** `deal`. Montagem usa caminho `ociosa` + copy. |
| RNG nos testes | Injeção opcional; produção usa crypto+pool. |
| `CARTAS_JOGO_STUB` | Remover como fonte; não fallback. |
| `localStorage` | Não usar nesta feature. |
| motor / quiz.js / storage | Não criar. |
