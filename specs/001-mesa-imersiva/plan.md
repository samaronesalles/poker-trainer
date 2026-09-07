# Implementation Plan: Mesa imersiva e sessão de treino

**Branch**: `001-mesa-imersiva` (identidade Spec Kit; git de trabalho: `main`) | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-mesa-imersiva/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Entregar o **casco** do Poker Trainer: uma única tela de mesa de Texas Hold’em (feltro de clube, três assentos, cinco slots, pote cênico, HUD estilo barra de ações) e o **ciclo de sessão** `ociosa → deal → perguntando → sem_upgrade → resultado`, percorrível com um quiz **stub** (enunciados e 6 opções canônicas, retry visual, sem motor de mãos). Deal real de 52 cartas é a feature 002; persistência e correção autoritativa são 003–006.

Abordagem: site estático na raiz (`index.html` + CSS + ES modules), cartas DOM+SVG com flip CSS, Web Audio sintetizado fail-open, estado só em memória, burn cênico que não consome carta de jogo. Sem bundler, sem backend, sem `localStorage` nesta feature.

Artefatos de pesquisa/design: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: HTML5 + CSS3 + JavaScript ES2020+ (ES modules nativos no browser). Sem TypeScript no MVP.

**Primary Dependencies**: Nenhuma biblioteca de runtime. APIs nativas: DOM, CSS Transforms/Animations, Web Audio API, `matchMedia('(prefers-reduced-motion: reduce)')`. Desenvolvimento: servidor estático (`python -m http.server` ou `npx serve`). Produção: GitHub Pages.

**Storage**: N/A nesta feature — sessão só em memória. Reload aborta a mão e volta a `ociosa`. `localStorage` (ADR-002) fica para a feature 003; se no futuro o storage falhar, fail-open (treino segue). MUST NOT escrever chaves agora.

**Testing**: Validação manual no browser via [quickstart.md](./quickstart.md). Testes de contrato da FSM do HUD com `node --test` em ES modules puros (sem bundler, sem framework de UI). Sem Playwright/Cypress no MVP.

**Target Platform**: Navegadores evergreen no desktop (Chrome/Edge/Firefox atuais); layout de referência 1280×720 CSS px; tablet usável; celular básico (HUD MAY empilhar). Servir só `http://` ou HTTPS — `file://` fora do modo suportado.

**Project Type**: Aplicação web estática single-page (cliente único, sem backend).

**Performance Goals**: Tela ociosa pronta em < 3 s (SC-001). Animação por street ≤ 2 s na primeira mão da sessão e ≈ 1 s da segunda em diante, depois o quiz habilita (SC-010). **Próxima mão** inicia novo deal em < 3 s (SC-006). 0 opções clicáveis enquanto cartas voam (SC-002).

**Constraints**: Constitution I–VII e ADRs 001–007. Sem bundler, backend, lib de poker, PNG de face como carta principal, Unicode de baralho, API paga, mute na UI, cadastro, telemetria. Áudio e (futuro) storage fail-open. UI em pt-BR. Custo operacional zero.

**Scale/Scope**: Um treinando, uma mesa, 3 assentos, 5 slots, 5 estados de HUD, 11 cartas visuais stub + burn cênico. Sem multi-sala, sem sync.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constituição: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0.

### Pré-design (antes da Phase 0) — PASS

Nenhuma violação. Complexity Tracking vazio.

#### Princípios I–VII

| Princípio | Resultado | Nota |
|-----------|-----------|------|
| I. Idioma pt-BR | PASS | Copy, CTAs, apelidos e rótulos RN-014/RN-030 em português; termos de clube MAY em inglês |
| II. LGPD / privacidade local | PASS | Sem cadastro, sem PII, sem envio a servidor; avatares/apelidos de produto; sem persistir evolução nesta feature |
| III. Custo zero | PASS | Estático + Pages; sem API paga; HTTP local |
| IV. Escopo treino ≠ jogo | PASS | Sem apostas, preflop quiz, relatório, mute, desistir, zerar, multiplayer |
| V. RN-G001..G008 | PASS | Tabela abaixo |
| VI. Desktop-first | PASS | 1280×720 de referência; degradação documentada |
| VII. Fail-open | PASS | Áudio falha em silêncio; deal não espera som; storage N/A agora (não trava) |

#### RN-G001 .. RN-G008

| Gate | Aplicável? | Conformidade |
|------|------------|--------------|
| **RN-G001** Uma pergunta por vez | Sim | HUD `perguntando` mostra no máximo uma; river em quatro passos sequenciais |
| **RN-G002** Não avançar street sem acertar a street | Sim (casco) | Flop/turn: acerto da mão atual + `sem_upgrade`/`Continuar` antes da próxima street. River: quatro acertos até `resultado`. Stub substitui o motor 5.4 vazio |
| **RN-G003** Empates de pote | Sim (visual) | Gerador que não evita boards empatados = feature 002. Nesta feature, mão stub 2+ força split visual **Você e Adversário A** |
| **RN-G004** Kickers nunca em texto de opção | Sim | Só rótulos RN-014 / RN-030 |
| **RN-G005** Sem pular pergunta / sem revelar a certa | Sim | Retry; copy de erro sem “a resposta era X”; sem CTA pular |
| **RN-G006** Single-player; adversários não jogam | Sim | A/B estáticos; sem bot |
| **RN-G007** Burn opcional; se existir, fora do board e sem consumir carta de jogo | Sim | Pesquisa escolheu **incluir** burn cênico no turn/river |
| **RN-G008** Ordem visual embaralhada | Sim | Stub permuta a grade a cada pergunta |

#### ADRs 001–007

| ADR | Nesta feature | Conformidade |
|-----|---------------|--------------|
| 001 Pages / sem backend | Shell estático | PASS — MUST NOT API/auth |
| 002 localStorage | Não persiste evolução | PASS — não usa storage; fail-open fica para 003 |
| 003 Motor próprio | Fora de escopo | PASS — não puxa lib de poker; stub não avalia melhor-5 |
| 004 Shuffle crypto+pool | Fora de escopo (002) | PASS — 11 faces stub; `Math.random` só em G008 das opções |
| 005 Cartas HTML/CSS/SVG | Núcleo visual | PASS — flip CSS; sem Unicode/emoji de baralho |
| 006 ES modules sem bundler | `index.html` + `css/` + `js/` | PASS — módulos `mesa`, `carta`, `audio` + `quiz-stub`; não criar `baralho`/`motor`/`storage`/`quiz` ainda |
| 007 Web Audio sintetizado | SFX fail-open | PASS — unlock no gesto; sem samples; sem mute UI |

#### Escopo negativo do MVP

Plan MUST NOT incluir: relatório visual, botão zerar, apostas, multiplayer, login, mute na UI, quiz preflop. **PASS.**

### Pós-design (depois da Phase 1) — PASS

Reavaliado contra [data-model.md](./data-model.md), [contracts/hud-session.md](./contracts/hud-session.md), [contracts/mesa-visual.md](./contracts/mesa-visual.md), [contracts/audio-failopen.md](./contracts/audio-failopen.md), [quickstart.md](./quickstart.md).

- Modelo não introduz PII, contas nem schema de `localStorage`.
- Contratos reforçam G001–G008, CTAs canônicos e fail-open de áudio.
- Burn explícito no contrato visual (G007 aplicável e satisfeito).
- Stub de vencedor cobre pote único e split (G003 visual) sem gerador.
- Quickstart valida CA-001..005, CA-026, teclado, reload, viewport e privacidade (sem chaves de evolução).
- Nenhuma dependência nova, bundler, backend ou lib de poker.

**GATE PASS.** Pode seguir para `/speckit-tasks`. Este comando **não** executa tasks nem implementa código da aplicação.

## Project Structure

### Documentation (this feature)

```text
specs/001-mesa-imersiva/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── hud-session.md
│   ├── mesa-visual.md
│   └── audio-failopen.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Layout concreto do site estático (ADR-006). Arquivos de aplicação **ainda não existem**; `/speckit-implement` os cria. Módulos entre parênteses são de features posteriores — **não** criar nesta 001.

```text
index.html                 # shell da mesa (script type="module")
css/
├── mesa.css               # feltro, rail, holofote, assentos, pote, viewport
├── cartas.css             # face/verso, flip, deal, burn cênico
└── hud.css                # faixa de ação, opções, foco, feedback
js/
├── mesa.js                # sessão + FSM do HUD
├── carta.js               # componente DOM + SVG de naipe
├── audio.js               # Web Audio sintetizado, unlock, fail-open
└── quiz-stub.js           # cadência e correção provisória (sai nas 003–006)
assets/
└── avatares/              # SVG ilustrados (não fotos reais)
tests/
└── contract/
    └── hud-session.test.js
# Reservado (não nesta feature):
# js/baralho.js            # 002
# js/motor.js              # 004–006
# js/quiz.js               # 003+
# js/storage.js            # 003
```

**Structure Decision**: Um projeto estático na raiz do repositório (não `frontend/` + `backend/`). Escolha alinhada a ADR-001/006 e ao README (`python -m http.server` na raiz). `quiz-stub.js` isola o casco para não colidir com o `quiz.js` futuro.

## Complexity Tracking

Nenhuma violação da constitution — tabela não se aplica.

## Phase 0 & Phase 1

- Phase 0: [research.md](./research.md) — stack, stub, burn, G008, áudio, testes; zero `NEEDS CLARIFICATION`.
- Phase 1: modelo, contratos, quickstart (caminhos acima).

## Escolhas registradas (ambíguo → padrão)

Ver tabela no final de [research.md](./research.md). Destaques: git permanece em `main`; burn cênico incluído; 11 faces stub sem ADR-004; vencedor mão 1 = Você, mão 2+ = split Você+A; sem `localStorage` nesta feature.
