# Implementation Plan: Embaralhamento e distribuição das cartas

**Branch**: `002-embaralhamento-deal` (identidade Spec Kit; git de trabalho: `main`) | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-embaralhamento-deal/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Substituir as **11 faces stub** da feature 001 por um **baralho francês de 52** permutado **uma vez por mão** (Fisher–Yates + Web Crypto misturado a pool local de cursor, data/hora e tick), com mapeamento **RN-044** e deal visível **Adversário A → Adversário B → Você**. Flop/turn/river já determinados; slots comunitários vazios até a street; burn só cênico; adversários viram no showdown as mesmas cartas do deal. Sem motor, sem quiz real, sem `localStorage`.

Abordagem: novo ES module `js/baralho.js`; `js/mesa.js` consome a montagem **antes** de entrar em `deal`; `js/carta.js` deixa de ser a fonte das 11. Fail-open se crypto faltar; falha de montagem permanece `ociosa` com copy canônico. Sem bundler, sem backend, sem API paga.

Artefatos: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: HTML5 + CSS3 + JavaScript ES2020+ (ES modules nativos). Sem TypeScript no MVP.

**Primary Dependencies**: Nenhuma biblioteca de runtime. APIs nativas: `crypto.getRandomValues` (quando houver), `performance.now()` / `Date.now()`, `pointermove`, DOM/CSS do casco 001. Desenvolvimento: servidor estático (`python -m http.server` ou `npx serve`). Produção: GitHub Pages (HTTPS).

**Storage**: N/A nesta feature — permutação, 11 de jogo e mistura compacta **só em memória da visita**. Reload aborta a mão e apaga o pool. MUST NOT `localStorage` / cookies / `sessionStorage` como banco. Evolução (ADR-002) permanece feature 003.

**Testing**: [quickstart.md](./quickstart.md) no browser `http://`. `node --test` em `tests/contract/baralho.test.js` + extensão de `tests/contract/hud-session.test.js`. RNG injetável. Sem Playwright/Cypress, sem bundler.

**Target Platform**: Navegadores evergreen desktop (Chrome/Edge/Firefox); layout 1280×720 CSS px (casco). Servir só `http://` ou HTTPS — `file://` fora do modo suportado.

**Project Type**: Aplicação web estática single-page (cliente único, sem backend).

**Performance Goals**: Permutação síncrona pronta **antes** do deal visível. Deal das hole cards **começa em < 1 s** após **Nova mão** (ou após feltro limpo em **Próxima mão**) (SC-012). Falha de montagem visível em < 3 s sem passar por `deal` (SC-009). Teto de animação por street permanece o da 001 (2 s / ≈ 1 s).

**Constraints**: Constitution I–VII e ADRs 001–007. Sem bundler, backend, lib de poker, PNG de face como carta principal, Unicode de baralho, API paga, mute na UI, cadastro, telemetria, persistência de baralho/cursor. UI em pt-BR. Custo operacional zero. MUST NOT criar `js/motor.js`, `js/quiz.js`, `js/storage.js`. MUST NOT filtrar empates (RN-G003). Shuffle MUST NOT travar à espera de mouse ou crypto (VII).

**Scale/Scope**: Um treinando, uma mesa, 52 cartas, 11 de jogo por mão, pool por visita. Sem multi-sala, sem sync, sem histórico de mãos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constituição: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0.

### Pré-design (antes da Phase 0) — PASS

Nenhuma violação. Complexity Tracking vazio.

#### Princípios I–VII

| Princípio | Resultado | Nota |
|-----------|-----------|------|
| I. Idioma pt-BR | PASS | Copy nova só `Não foi possível embaralhar. Tente de novo.`; CTAs **Nova mão** / **Próxima mão**; apelidos inalterados; sem CTA **Embaralhar** |
| II. LGPD / privacidade local | PASS | Sem cadastro/PII; cursor só mistura compacta em memória; sem trajetória; sem envio; sem `localStorage` nesta feature; retenção = visita (reload apaga) |
| III. Custo zero | PASS | Estático + Pages; Web Crypto nativo; sem API de entropia paga |
| IV. Escopo treino ≠ jogo | PASS | Sem apostas, preflop quiz, relatório, mute, desistir, zerar, multiplayer |
| V. RN-G001..G008 | PASS | Tabela abaixo |
| VI. Desktop-first | PASS | Palco 001 inalterado (1280×720) |
| VII. Fail-open | PASS | Sem mouse → shuffle segue; sem Web Crypto → pool; falha de montagem não trava (ociosa + CTA); sem `alert()` |

#### RN-G001 .. RN-G008

| Gate | Aplicável? | Conformidade |
|------|------------|--------------|
| **RN-G001** Uma pergunta por vez | Não altera quiz | PASS — casco 001 permanece; esta feature não empilha perguntas |
| **RN-G002** Não avançar street sem acertar | Cadência 001 | PASS — avanço de street não sorteia cartas; quiz stub inalterado |
| **RN-G003** Empates de pote | **Sim (gerador)** | PASS — Fisher–Yates honesto; MUST NOT filtrar boards que empatam; CA-006 não vira reject-and-retry |
| **RN-G004** Kickers nunca em texto de opção | Não altera opções | PASS — quiz stub intocado |
| **RN-G005** Sem pular / sem revelar | Não altera HUD de pergunta | PASS |
| **RN-G006** Single-player; A/B não jogam | Sim | PASS — A/B só recebem cartas reais; sem bot |
| **RN-G007** Burn opcional; fora do board; não consome 11 | **Sim** | PASS — burn cênico 001 permanece; `[11]…[51]` não entram; 0 décima-segunda carta de jogo |
| **RN-G008** Ordem visual das opções embaralhada | Indireto | PASS — stub continua embaralhando opções; FR-021: isso MUST NOT reembaralhar as 52 |

#### ADRs 001–007

| ADR | Nesta feature | Conformidade |
|-----|---------------|--------------|
| 001 Pages / sem backend | Shuffle 100% cliente | PASS — MUST NOT API/auth/entropy service |
| 002 localStorage | Não persiste evolução nem baralho | PASS — não usa storage |
| 003 Motor próprio | Fora de escopo | PASS — **não** criar `js/motor.js`; sem lib de poker |
| 004 Shuffle crypto+pool | **Núcleo** | PASS — Fisher–Yates + `getRandomValues` XOR pool; fallback pool; RN-044; uma permutação/mão |
| 005 Cartas HTML/CSS/SVG | Reuso | PASS — `js/carta.js`; sem Unicode/emoji/PNG como face principal |
| 006 ES modules sem bundler | `js/baralho.js` novo | PASS — **não** criar motor/quiz/storage; sem webpack/vite |
| 007 Web Audio | Intocado | PASS — unlock no gesto já existe; fail-open |

#### Escopo negativo do MVP

Plan MUST NOT incluir: relatório visual, botão zerar, apostas, multiplayer, login, mute na UI, quiz preflop. **PASS.**

#### Idioma, custo, retenção (explícito)

- **Idioma:** UI pt-BR; termos de clube flop/turn/river/showdown; erro canônico em português.
- **Custo:** zero servidor, zero CDN paga, zero API de aleatoriedade.
- **Retenção:** mistura e permutação só na visita; limpar dados do site irrelevante aqui (nada gravado); 003 tratará contadores.

### Pós-design (depois da Phase 1) — PASS

Reavaliado contra [data-model.md](./data-model.md), [contracts/baralho.md](./contracts/baralho.md), [contracts/deal-visivel.md](./contracts/deal-visivel.md), [contracts/hud-montagem.md](./contracts/hud-montagem.md), [quickstart.md](./quickstart.md).

- Modelo: `MisturaVisita` sem histórico de coordenadas; `PermutacaoRodada` efêmera; zero schema de `localStorage`; `BurnCenico` sem FK para `[11+]`.
- Contratos: RN-044, fail-open de crypto, falha de montagem **sem** passar por `deal`, G003 (sem filtro), G007 (burn), LGPD.
- Quickstart: CA-006..009, SC-008..012, privacidade, ordem A→B→Você, feltro limpo em **Próxima mão**.
- Nenhuma dependência nova, bundler, backend, lib de poker, PNG de carta ou sexto estado de HUD.

**GATE PASS.** Pode seguir para `/speckit-tasks`. Este comando **não** executa tasks nem implementa código da aplicação.

## Project Structure

### Documentation (this feature)

```text
specs/002-embaralhamento-deal/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── baralho.md
│   ├── deal-visivel.md
│   └── hud-montagem.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Layout concreto do site estático (ADR-006). `js/baralho.js` e o teste de baralho **ainda não existem**; `/speckit-implement` os cria. Módulos entre parênteses **não** criar nesta 002.

```text
index.html                 # shell existente (001)
css/                       # inalterado nesta feature
js/
├── mesa.js                # orquestra montagem + deal A→B→Você (alterar)
├── carta.js               # componente DOM; remover CARTAS_JOGO_STUB como fonte
├── baralho.js             # NOVO: 52, pool, Fisher–Yates, RN-044
├── audio.js               # inalterado
└── quiz-stub.js           # inalterado (G008 do stub)
assets/avatares/           # inalterado
tests/contract/
├── hud-session.test.js    # estender (montagem, mapeamento)
├── audio-failopen.test.js # inalterado
└── baralho.test.js        # NOVO
# Reservado (não nesta feature):
# js/motor.js              # 004–006
# js/quiz.js               # 003+
# js/storage.js            # 003
```

**Structure Decision**: Continuar o projeto estático na raiz (não `frontend/` + `backend/`). Um módulo de domínio `baralho` como o ADR-006 reserva. O casco 001 permanece o palco.

## Complexity Tracking

Nenhuma violação da constitution — tabela não se aplica.

## Phase 0 & Phase 1

- Phase 0: [research.md](./research.md) — algoritmo, pool/LGPD, RN-044 vs stub 001, HUD ociosa, G003/G007, testes; zero `NEEDS CLARIFICATION`.
- Phase 1: modelo, contratos, quickstart (caminhos acima).

## Escolhas registradas (ambíguo → padrão)

Ver tabela no final de [research.md](./research.md). Destaques: git permanece em `main`; rejection sampling no Fisher–Yates; pool 32 bytes sem trajetória; **não** adicionar teatro visual de shuffle; quiz-stub intocado; CA-006 é teste, não filtro; `CARTAS_JOGO_STUB` deixa de ser fonte; falha de montagem ≠ `FALHA_DEAL` pós-deal.
