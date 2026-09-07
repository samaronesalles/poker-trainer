# Implementation Plan: Feedback de resposta e persistência da evolução

**Branch**: `003-feedback-persistencia` (identidade Spec Kit; git de trabalho: `main`) | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-feedback-persistencia/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Endurecer o **contrato de treino** da mesa: seleção única submete no clique, múltipla seleção só em **Confirmar**, feedback canônico no HUD (sem `alert`, sem spoiler), opção morta visível com marca ✕, ordem visual embaralhada (G008), e **evolução** só de contadores no `localStorage` (`mao_atual` / `upgrade` / `vencedor_pote`, 1ª tentativa imediata, exposições = acertos + erros). Sem tela de relatório, sem botão zerar, fail-open se o storage falhar.

Abordagem: ES modules `js/quiz.js` (o stub da 001 **evolui** para este contrato; conteúdo das mãos ainda stub até 004–006) e `js/storage.js` (ADR-002). `js/mesa.js` passa a consumir o quiz real. **Não** criar `js/motor.js`. Flop ganha multi-select stub (Flush verdadeiro, Par distratora); turn permanece `sem_upgrade`.

Artefatos: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: HTML5 + CSS3 + JavaScript ES2020+ (ES modules nativos). Sem TypeScript no MVP.

**Primary Dependencies**: Nenhuma biblioteca de runtime. APIs nativas: DOM, `localStorage`, `matchMedia('(prefers-reduced-motion: reduce)')`. Desenvolvimento: servidor estático (`python -m http.server` ou `npx serve`). Produção: GitHub Pages.

**Storage**: `localStorage` da origem, chave `poker-trainer:evolucao`, JSON só dos três buckets de contadores (ADR-002). Sem IndexedDB, sem nuvem, sem `sessionStorage` como banco. Sessão da mão continua só em memória (reload → `ociosa`). Fail-open se recusa/quota/corrupção.

**Testing**: [quickstart.md](./quickstart.md) no browser `http://`. `node --test` em `tests/contract/quiz.test.js`, `storage.test.js` (API injetável) e atualização de `hud-session.test.js`. Sem Playwright/Cypress, sem bundler.

**Target Platform**: Navegadores evergreen desktop (Chrome/Edge/Firefox); layout 1280×720 CSS px (casco). Servir só `http://` ou HTTPS — `file://` fora do modo suportado.

**Project Type**: Aplicação web estática single-page (cliente único, sem backend).

**Performance Goals**: Feedback de acerto/erro no HUD em < 1 s após a submissão (SC-001/002). Beat de acerto ≤ 400 ms (0 se movimento reduzido), depois avança sozinho. Gravação da 1ª tentativa síncrona **antes** do próximo passo ou de um reload. Deal/teto de animação permanecem os da 001/002.

**Constraints**: Constitution I–VII e ADRs 001–007. Sem bundler, backend, lib de poker, PNG de face como carta principal, Unicode de baralho, API paga, mute na UI, cadastro, telemetria, relatório visual, botão zerar, quiz preflop. UI em pt-BR. Custo operacional zero. MUST criar `js/quiz.js` e `js/storage.js`. MUST NOT criar `js/motor.js`. MUST NOT persistir PII, cartas, pool de cursor ou timestamp. MUST NOT reembaralhar as 52 ao permutar opções.

**Scale/Scope**: Um treinando, uma mesa, uma chave de evolução, 10+10 categorias + 1 grupo `vencedor_pote`. Sem sync entre dispositivos, sem histórico de mãos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constituição: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0.

### Pré-design (antes da Phase 0) — PASS

Nenhuma violação. Complexity Tracking vazio.

#### Princípios I–VII

| Princípio | Resultado | Nota |
|-----------|-----------|------|
| I. Idioma pt-BR | PASS | Copy de feedback, **Confirmar**, enunciado 5.4 e rótulos RN-014 em português; termos de clube MAY em inglês |
| II. LGPD / privacidade local | PASS | Só contadores no `localStorage`; sem PII; sem envio; apelidos de produto; retenção = dados do site |
| III. Custo zero | PASS | Estático + Pages; `localStorage` nativo; sem API |
| IV. Escopo treino ≠ jogo | PASS | Sem apostas, preflop quiz, **sem relatório**, **sem zerar**, mute, desistir, multiplayer |
| V. RN-G001..G008 | PASS | Tabela abaixo |
| VI. Desktop-first | PASS | Palco 001 inalterado (1280×720); HUD ganha **Confirmar** na faixa |
| VII. Fail-open | PASS | Storage recusado/corrompido → treino segue; sem `alert`/jargão; áudio intocado |

#### RN-G001 .. RN-G008

| Gate | Aplicável? | Conformidade |
|------|------------|--------------|
| **RN-G001** Uma pergunta por vez | Sim | `perguntando` mostra no máximo uma; `flop_upgrade` substitui o skip do flop, não empilha com `flop_hero` |
| **RN-G002** Não avançar street sem acertar | Sim | Flop = mão atual **e** multi-select stub; turn = mão atual **e** skip; river = quatro acertos |
| **RN-G003** Empates de pote | Indireto | Gerador 002 inalterado (não filtra); pergunta do pote continua seleção única; bucket `vencedor_pote` |
| **RN-G004** Kickers nunca em texto de opção | Sim | Só RN-014 / RN-030 no stub |
| **RN-G005** Sem pular / sem revelar a certa | Sim | Retry; copy de erro sem spoiler; morta sem revelar o resto; sem CTA pular |
| **RN-G006** Single-player; A/B não jogam | Sim | Inalterado |
| **RN-G007** Burn cênico fora do board / 11 | Não altera | PASS — 002 permanece; quiz MUST NOT consumir carta |
| **RN-G008** Ordem visual embaralhada | **Sim** | Shuffle ao apresentar; retry estável; isolado do baralho |

#### ADRs 001–007

| ADR | Nesta feature | Conformidade |
|-----|---------------|--------------|
| 001 Pages / sem backend | Cliente-only | PASS — MUST NOT API/auth/sync |
| 002 localStorage | **Núcleo** | PASS — JSON de contadores; sem IndexedDB; sem chave zerar; fail-open |
| 003 Motor próprio | Fora de escopo | PASS — **não** criar `js/motor.js`; sem lib de poker |
| 004 Shuffle crypto+pool | Intocado | PASS — G008 das opções ≠ Fisher–Yates das 52 |
| 005 Cartas HTML/CSS/SVG | Reuso | PASS — feltro 001/002; marcas ✕/✓ são UI de opção, não face de carta |
| 006 ES modules sem bundler | `quiz` + `storage` | PASS — criar `js/quiz.js` e `js/storage.js`; sem webpack/vite |
| 007 Web Audio | Intocado | PASS — SFX de acerto/erro já existem; fail-open |

#### Escopo negativo do MVP

Plan MUST NOT incluir: relatório visual, botão zerar, apostas, multiplayer, login, mute na UI, quiz preflop. **PASS.**

#### Idioma, custo, retenção (explícito)

- **Idioma:** UI pt-BR; ids internos em inglês/`snake_case`.
- **Custo:** zero servidor; zero CDN paga.
- **Retenção:** só a chave de evolução na origem; limpar dados do site zera; reload **não** zera contadores já gravados; mão em curso aborta.

### Pós-design (depois da Phase 1) — PASS

Reavaliado contra [data-model.md](./data-model.md), [contracts/quiz.md](./contracts/quiz.md), [contracts/storage.md](./contracts/storage.md), [contracts/hud-cadencia.md](./contracts/hud-cadencia.md), [quickstart.md](./quickstart.md).

- Modelo: `EvolucaoTreino` = três buckets; 10 categorias sempre presentes; sem PII/timestamp/replay; `PrimeiraTentativa` imediata; `flop_upgrade` vs `turn_skip`.
- Contratos: RN-047, RN-024/025, G005/G008, LWW sem mescla, incompleto ≠ corrupção dura, fail-open silencioso, único escritor = quiz.
- Quickstart: CA-022..025, SC-001..012, DevTools da chave, 0 relatório/zerar.
- Nenhuma dependência nova, bundler, backend, lib de poker, `motor.js`, tela de stats ou botão zerar.

**GATE PASS.** Pode seguir para `/speckit-tasks`. Este comando **não** executa tasks nem implementa código da aplicação.

## Project Structure

### Documentation (this feature)

```text
specs/003-feedback-persistencia/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── quiz.md
│   ├── storage.md
│   └── hud-cadencia.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Layout concreto do site estático (ADR-006). `js/quiz.js` e `js/storage.js` **ainda não existem**; `/speckit-implement` os cria. `js/motor.js` **não** criar.

```text
index.html                 # shell existente (script type="module" → mesa.js)
css/
├── mesa.css               # inalterado
├── cartas.css             # inalterado
└── hud.css                # ALTER: Confirmar, marcas ✕/✓, selecionada, eliminada
js/
├── mesa.js                # ALTER: importa quiz.js; ALTERNAR_OPCAO, CONFIRMAR, FIM_BEAT_ACERTO
├── quiz.js                # NOVO: contrato real (absorve quiz-stub.js)
├── storage.js             # NOVO: localStorage fail-open, só contadores
├── carta.js               # inalterado
├── baralho.js             # inalterado (G008 MUST NOT chamar)
└── audio.js               # inalterado
# REMOVER após migrar imports:
# js/quiz-stub.js
assets/avatares/           # inalterado
tests/contract/
├── hud-session.test.js    # ALTER: Flush, flop_upgrade, beat
├── quiz.test.js           # NOVO
├── storage.test.js        # NOVO
├── baralho.test.js        # inalterado
└── audio-failopen.test.js # inalterado
# Reservado (não nesta feature):
# js/motor.js              # 004–006
```

**Structure Decision**: Continuar o projeto estático na raiz (não `frontend/` + `backend/`). Dois módulos de domínio que o ADR-006 reservou (`quiz`, `storage`). O stub da 001 não permanece em paralelo: `quiz.js` é a evolução do contrato; o conteúdo das perguntas continua provisório até o motor.

## Complexity Tracking

Nenhuma violação da constitution — tabela não se aplica.

## Phase 0 & Phase 1

- Phase 0: [research.md](./research.md) — módulos, cadência, stub Flush/Par, beat 400 ms, schema, fail-open, LGPD; zero `NEEDS CLARIFICATION`.
- Phase 1: modelo, contratos, quickstart (caminhos acima).

## Escolhas registradas (ambíguo → padrão)

Ver tabela no final de [research.md](./research.md). Destaques: git permanece em `main`; criar `quiz.js`+`storage.js` e remover `quiz-stub.js`; **não** criar motor; flop → multi-select stub (Flush verdadeiro, Par distratora); turn skip; herói correto = Flush; chave `poker-trainer:evolucao`; ids snake_case; escrita preguiçosa; LWW sem mescla; beat 400 ms via `FIM_BEAT_ACERTO`; fail-open silencioso.
