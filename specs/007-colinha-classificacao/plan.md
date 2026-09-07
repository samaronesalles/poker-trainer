# Implementation Plan: Colinha de classificação de mãos

**Branch**: `007-colinha-classificacao` | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-colinha-classificacao/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Entregar a **colinha de classificação** (PRD §5.7): overlay compacto no canto superior direito do desktop com as **10 categorias canônicas** (RN-014), cinco cartas-exemplo **fixas** por linha no idioma visual da mesa, ocultável só nesta visita, ausente em viewport ≤ 900 px, estática em relação ao quiz e **sem persistir preferência**.

Abordagem: módulo de domínio `js/colinha.js` + `css/colinha.css`, montado em fail-open por `js/mesa.js`. Cartas-exemplo reusam `criarElementoCarta` (ADR-005). Catálogo ilustrativo congelado em memória — **não** vem do baralho da mão e **não** passa pelo motor (ADR-003 intocado). Estado `visível`/`oculto` só na visita. Sem chave nova no `localStorage` (ADR-002). Specs 001–006 **não** são alteradas.

Artefatos: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: HTML5 + CSS3 + JavaScript ES2020+ (ES modules nativos no browser). Sem TypeScript no MVP.

**Primary Dependencies**: Nenhuma biblioteca de runtime. Reuso de `js/carta.js` (`criarElementoCarta`) e do breakpoint 900 px já em `js/layout.js` / `css/mesa.css`. APIs nativas: DOM, `matchMedia`, `resize`. Desenvolvimento: servidor estático (`python -m http.server` ou `npx serve`). Produção: GitHub Pages.

**Storage**: N/A para a colinha. Preferência **não** é gravada. Continua só `poker-trainer:evolucao` (três buckets, ADR-002) via `js/storage.js` — esta feature **não** lê nem escreve essa chave. MUST NOT `sessionStorage`, cookie, IndexedDB.

**Testing**: Validação manual no browser via [quickstart.md](./quickstart.md). Testes de contrato com `node --test` em `tests/contract/colinha.test.js` (catálogo, estado de visita, predicado de viewport, auditoria de fonte: sem `localStorage` / sem import de `motor.js`). Sem Playwright/Cypress, sem bundler.

**Target Platform**: Navegadores evergreen no desktop (Chrome/Edge/Firefox atuais); layout de referência 1280×720 CSS px. Overlay só quando largura > 900 px. Servir só `http://` ou HTTPS — `file://` fora do modo suportado.

**Project Type**: Aplicação web estática single-page (cliente único, sem backend).

**Performance Goals**: Overlay pronto em < 3 s após a tela estar pronta (SC-001). Toggle ocultar/reabrir imediato (sem animação obrigatória). 0 impacto na cadência do quiz. Catálogo é constante — 0 recálculo por mão.

**Constraints**: Constitution I–VII e ADRs 001–007. Sem bundler, backend, lib de poker, PNG de face como carta principal, Unicode de baralho, API paga, mute na UI, cadastro, telemetria, relatório, botão zerar, quiz preflop. UI em pt-BR. Custo operacional zero. MUST NOT persistir preferência da colinha. MUST NOT importar `js/motor.js`. MUST NOT destacar a categoria da mesa. Overlay MUST NOT cobrir comunitárias/assentos/HUD nem empurrar o feltro. Specs 001–006 intocadas.

**Scale/Scope**: Um treinando, uma mesa, 10 linhas fixas, 50 faces ilustrativas (10×5), 2 controles (**Ocultar** / **Colinha**), 1 estado de visita. Sem colinha no estreito. Sem sync entre abas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constituição: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0.

### Pré-design (antes da Phase 0) — PASS

Nenhuma violação. Complexity Tracking vazio.

#### Princípios I–VII

| Princípio | Resultado | Nota |
|-----------|-----------|------|
| I. Idioma pt-BR | PASS | Título **Classificação de mãos**; controles **Ocultar** / **Colinha**; sentido **Melhor** / **Pior**; 10 rótulos RN-014 exatos (Royal flush / Straight permanecem em inglês porque o PRD os fixa) |
| II. LGPD / privacidade local | PASS | Sem PII, sem cadastro, sem envio; estado só em memória; MUST NOT gravar preferência; evolução 003 intocada |
| III. Custo zero | PASS | Estático + Pages; sem API / CDN / lib nova |
| IV. Escopo treino ≠ jogo | PASS | Colinha = lenda de consulta, não relatório/ranking (CA-024); sem apostas, preflop, zerar, mute, cola ao vivo |
| V. RN-G001..G008 | PASS | Tabela abaixo (G001–G008, inclusive G007/G008) |
| VI. Desktop-first | PASS | Overlay só largura > 900 px; 1280×720 cabe sem cobrir a mesa; estreito = ausência total |
| VII. Fail-open | PASS | Falha ao montar → mesa/quiz seguem; sem modal/`alert`; storage irrelevante (não grava) |

#### RN-G001 .. RN-G008

| Gate | Aplicável? | Conformidade |
|------|------------|--------------|
| **RN-G001** Uma pergunta por vez | Não altera o HUD | PASS — colinha **não** é pergunta e **não** entra no HUD; MUST NOT empilhar quizzes |
| **RN-G002** Não avançar street sem acertar | Não avança street | PASS — ocultar/reabrir MUST NOT mudar estado do HUD nem a mão |
| **RN-G003** Empates de pote | Não gera board | PASS — gerador 002 intocado; exemplos fixos não filtram empate |
| **RN-G004** Kickers nunca em texto de opção | Sim (copy) | PASS — kickers só como carta esmaecida; 0 texto “kicker” / “par de ases” |
| **RN-G005** Sem pular / sem revelar a certa | **Sim** | PASS — 0 destaque da categoria da mesa; clique em linha não submete; sem controle que revele a resposta |
| **RN-G006** Single-player; A/B não jogam | Não adiciona bot | PASS — A/B permanecem estáticos |
| **RN-G007** Burn cênico fora do board / 11 | Não desenha burn | PASS (N/A operacional) — 11 cartas de jogo e burn 002 intocados; exemplos **não** consomem o baralho |
| **RN-G008** Ordem visual embaralhada | Não é pergunta | PASS (N/A operacional) — a lista da colinha é a hierarquia fixa 1→10; G008 continua valendo só nas opções do HUD |

#### ADRs 001–007

| ADR | Nesta feature | Conformidade |
|-----|---------------|--------------|
| 001 Pages / sem backend | Shell estático | PASS — MUST NOT API/auth/sync |
| 002 localStorage só evolução | **Proibição de chave nova** | PASS — MUST NOT gravar preferência; MUST NOT IndexedDB/`sessionStorage` como banco |
| 003 Motor próprio | **Intocado** | PASS — catálogo ilustrativo próprio; MUST NOT importar `js/motor.js`; MUST NOT lib de poker |
| 004 Shuffle crypto+pool | Intocado | PASS — exemplos **não** embaralham; 002 permanece |
| 005 Cartas HTML/CSS/SVG | Núcleo visual da miniatura | PASS — reuso de `criarElementoCarta`; MUST NOT Unicode/emoji/PNG de terceiros como face |
| 006 ES modules sem bundler | Novo domínio `colinha` | PASS — `js/colinha.js` + `css/colinha.css`; sem webpack/vite |
| 007 Web Audio | Intocado | PASS — sem SFX próprio; unlock 001 permanece |

#### Escopo negativo do MVP

Plan MUST NOT incluir: relatório visual, botão zerar, apostas, multiplayer, login, mute na UI, quiz preflop, persistir oculto, colinha no ≤ 900 px, destacar a mão da mesa, cola ao vivo, alterar specs 001–006. **PASS.**

### Pós-design (depois da Phase 1) — PASS

Reavaliado contra [data-model.md](./data-model.md), [contracts/colinha-catalogo.md](./contracts/colinha-catalogo.md), [contracts/colinha-overlay.md](./contracts/colinha-overlay.md), [contracts/colinha-visita.md](./contracts/colinha-visita.md), [quickstart.md](./quickstart.md).

- Modelo: estado de visita só em memória; catálogo constante; 0 PII; 0 chave de preferência.
- Catálogo: 10 rótulos RN-014; extras esmaecidas por regra FR-003; faces inequívocas; coincidência com o feltro permitida.
- Overlay: canto superior direito; não empurra feltro; 1280×720 sem cobrir comunitárias; ≤ 900 px ausente; cromo de clube.
- Visita: só **Ocultar** dispensa; Tab depois do HUD; sem modal; fail-open; auditoria sem `localStorage`.
- Quickstart valida CA-028..032, SC-001..009, teclado, resize e inspeção de armazenamento.
- Nenhuma dependência nova, bundler, backend, lib de poker ou toque em `js/motor.js`.

**GATE PASS.** Pode seguir para `/speckit-tasks`. Este comando **não** executa tasks nem implementa código da aplicação.

## Project Structure

### Documentation (this feature)

```text
specs/007-colinha-classificacao/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── colinha-catalogo.md
│   ├── colinha-overlay.md
│   └── colinha-visita.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Layout concreto do site estático (ADR-006). Arquivos **novos** desta feature e pontos de gancho. Specs e contratos 001–006 permanecem.

```text
index.html                 # + <link> css/colinha.css; overlay criado em JS (após #hud)
css/
├── mesa.css               # intocado (breakpoint 900 px já existe)
├── cartas.css             # + modificadores .carta--exemplo / .carta--esmaecida (miniatura)
├── hud.css                # intocado
└── colinha.css            # NOVO — overlay, lista, cromo de clube, @media ≤900px
js/
├── mesa.js                # gancho fail-open: montarColinha no boot + resize; FSM intocada
├── carta.js               # reuso criarElementoCarta; MAY aceitar papel 'exemplo'
├── layout.js              # + predicado colinhaExisteNoViewport(width > 900)
├── colinha.js             # NOVO — catálogo, estado de visita, montagem, toggle, foco
├── baralho.js             # intocado
├── motor.js               # intocado (MUST NOT importar)
├── quiz.js                # intocado
├── storage.js             # intocado
└── audio.js               # intocado
tests/
└── contract/
    └── colinha.test.js    # NOVO — catálogo, visita, viewport, auditoria de fonte
```

**Structure Decision**: Continua um projeto estático na raiz (ADR-001/006). A colinha é **domínio novo** (`colinha`), isolada para fail-open e para não acoplar mesa/quiz/motor. `layout.js` recebe só o predicado de largura (já é dono do 900 px). `carta.js` só ganha o papel visual de miniatura — as 11 cartas de jogo não mudam.

## Complexity Tracking

Nenhuma violação da constitution — tabela não se aplica.

## Phase 0 & Phase 1

- Phase 0: [research.md](./research.md) — módulo, catálogo, overlay, visita, teclado, fail-open, testes; zero `NEEDS CLARIFICATION`.
- Phase 1: modelo, contratos, quickstart (caminhos acima).

## Escolhas registradas (ambíguo → padrão)

Ver tabela no final de [research.md](./research.md). Destaques: módulo `js/colinha.js`; catálogo ilustrativo congelado (não motor); existência = largura > 900 px (não `composicao === 'desktop'`); overlay criado em JS após o HUD; 0 persistência.
