# Implementation Plan: Identificação da mão atual (flop e turn)

**Branch**: `004-mao-atual` (identidade Spec Kit; git de trabalho: `main`) | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-mao-atual/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Substituir a correção **stub Flush** da pergunta **“Qual mão você tem agora?”** no **flop** e no **turn** do herói por um avaliador próprio: melhor combinação de 5 (cartas + categoria RN-014 + kickers internos), wheel legal, wrap proibido, royal ≠ straight flush. O HUD mostra só o rótulo; 6 opções via heurística RN-017; retry e `mao_atual` reusam a 003. **MUST NOT** perguntar o river do herói nesta feature (006). Sem lib de poker. Sem backend.

Abordagem: ES module **`js/motor.js`** (ADR-003). `js/quiz.js` consome o motor só em `flop_hero` / `turn_hero`. Cadência da mesa inalterada (upgrade stub no flop, skip no turn, river stub).

Artefatos: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: HTML5 + CSS3 + JavaScript ES2020+ (ES modules nativos). Sem TypeScript no MVP.

**Primary Dependencies**: Nenhuma biblioteca de runtime. Sem lib de poker (CDN ou vendored). APIs nativas: DOM já usado pelo casco. Desenvolvimento: servidor estático (`python -m http.server` ou `npx serve`). Produção: GitHub Pages.

**Storage**: Sem chave nova. Continua só `poker-trainer:evolucao` (três buckets, ADR-002) via `js/storage.js`. Motor **stateless** em memória. MUST NOT persistir cartas, kickers, pool, enunciado ou timestamp.

**Testing**: [quickstart.md](./quickstart.md) no browser `http://`. `node --test` em `tests/contract/motor.test.js` (novo) + atualização de `quiz.test.js` e `hud-session.test.js`. Sem Playwright/Cypress, sem bundler.

**Target Platform**: Navegadores evergreen desktop (Chrome/Edge/Firefox); layout 1280×720 CSS px (casco). Servir só `http://` ou HTTPS — `file://` fora do modo suportado.

**Project Type**: Aplicação web estática single-page (cliente único, sem backend).

**Performance Goals**: Avaliação síncrona de `C(n,5)` (n≤7) **antes** de pintar as 6 opções, imperceptível no HUD (< 50 ms no desktop de referência). Feedback/beat permanecem os da 003 (< 1 s / ≤ 400 ms).

**Constraints**: Constitution I–VII e ADRs 001–007. Sem bundler, backend, lib de poker, PNG de face como carta principal, Unicode de baralho, API paga, mute na UI, cadastro, telemetria, relatório visual, botão zerar, quiz preflop. UI em pt-BR. Custo operacional zero. MUST criar `js/motor.js`. MUST NOT perguntar o river do herói (além do passo stub 003). MUST NOT enumerar upgrades (005). Kickers MUST NEVER na UI (RN-G004).

**Scale/Scope**: Um treinando, uma mesa, 10 categorias, pergunta de mão atual só em duas streets. Avaliador reusável depois em 005/006 sem API extra nesta entrega.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constituição: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0.

### Pré-design (antes da Phase 0) — PASS

Nenhuma violação. Complexity Tracking vazio.

#### Princípios I–VII

| Princípio | Resultado | Nota |
|-----------|-----------|------|
| I. Idioma pt-BR | PASS | Enunciado e 10 rótulos RN-014 em português; flop/turn MAY em inglês |
| II. LGPD / privacidade local | PASS | Só delta `mao_atual` já definido; sem PII; sem envio; apelidos de produto |
| III. Custo zero | PASS | Estático + Pages; motor vanilla; sem API / CDN paga |
| IV. Escopo treino ≠ jogo | PASS | Sem apostas, preflop, relatório, zerar, mute, desistir, multiplayer, draws nomeados |
| V. RN-G001..G008 | PASS | Tabela abaixo |
| VI. Desktop-first | PASS | Palco 001 inalterado; só conteúdo das 6 opções muda |
| VII. Fail-open | PASS | Storage 003 inalterado; motor síncrono não bloqueia a mesa; sem `alert` |

#### RN-G001 .. RN-G008

| Gate | Aplicável? | Conformidade |
|------|------------|--------------|
| **RN-G001** Uma pergunta por vez | Sim | `flop_hero` / `turn_hero` substituem o stub no mesmo slot; não empilha river |
| **RN-G002** Não avançar street sem acertar | Sim | Flop = mão atual + upgrade stub; turn = mão atual + skip; river inalterado |
| **RN-G003** Empates de pote | Indireto | Gerador 002 inalterado (não filtra); esta feature não escolhe o pote |
| **RN-G004** Kickers nunca em texto de opção | **Sim** | Motor guarda chave interna; HUD só rótulo RN-014 |
| **RN-G005** Sem pular / sem revelar a certa | Sim | Reuso 003; sem skip nesta pergunta (sempre há melhor categoria) |
| **RN-G006** Single-player; A/B não jogam | Sim | Motor não lê estratégia; holes A/B fechadas e **não** entram na avaliação desta pergunta |
| **RN-G007** Burn cênico fora do board / 11 | Não altera | PASS — motor MUST NOT consumir burn |
| **RN-G008** Ordem visual embaralhada | Sim | Shuffle ao apresentar (quiz); conjunto RN-017 é estável; retry não reembaralha |

#### ADRs 001–007

| ADR | Nesta feature | Conformidade |
|-----|---------------|--------------|
| 001 Pages / sem backend | Cliente-only | PASS — MUST NOT API/auth/sync |
| 002 localStorage | Reuso | PASS — sem chave nova; sem IndexedDB; sem zerar |
| 003 Motor próprio | **Núcleo** | PASS — criar `js/motor.js`; MUST NOT lib de poker |
| 004 Shuffle crypto+pool | Intocado | PASS — G008 das opções ≠ Fisher–Yates das 52 |
| 005 Cartas HTML/CSS/SVG | Reuso | PASS — feltro 001/002; motor não pinta carta |
| 006 ES modules sem bundler | `motor` | PASS — criar `js/motor.js`; quiz importa; sem webpack/vite |
| 007 Web Audio | Intocado | PASS — SFX da 003 |

#### Escopo negativo do MVP

Plan MUST NOT incluir: relatório visual, botão zerar, apostas, multiplayer, login, mute na UI, quiz preflop. **PASS.**

#### Idioma, custo, retenção (explícito)

- **Idioma:** UI pt-BR; ids `snake_case` alinhados a `storage.js`.
- **Custo:** zero servidor; zero lib/CDN de poker.
- **Retenção:** só a chave de evolução na origem; limpar dados do site zera; reload aborta a mão e **não** zera contadores já gravados; Melhor5 não é persistida.

#### River (CA-027)

Esta feature MUST NOT adicionar pergunta de mão atual do herói no river. O passo `river_hero` stub da 003 permanece. **PASS.**

### Pós-design (depois da Phase 1) — PASS

Reavaliado contra [data-model.md](./data-model.md), [contracts/motor.md](./contracts/motor.md), [contracts/quiz-mao-atual.md](./contracts/quiz-mao-atual.md), [quickstart.md](./quickstart.md), [research.md](./research.md).

- Modelo: `Melhor5` + `ConjuntoOpcoesMaoAtual`; kickers só em `chaveDesempate`; 7 cartas no avaliador sem HUD; river fora.
- Contratos: API 5/6/7, lista fechada de sequências, RN-017 determinístico, quiz extrai RN-044, 1ª tentativa na correta real, stub 003 no river/upgrades.
- Quickstart: CA-010..013, SC-001..013, DevTools só contadores, 0 lib/backend.
- Nenhuma dependência nova, bundler, backend, lib de poker, relatório ou botão zerar.

**GATE PASS.** Pode seguir para `/speckit-tasks`. Este comando **não** executa tasks nem implementa código da aplicação.

## Project Structure

### Documentation (this feature)

```text
specs/004-mao-atual/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── motor.md
│   └── quiz-mao-atual.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Layout concreto do site estático (ADR-006). `js/motor.js` **ainda não existe**; `/speckit-implement` o cria. Cadência em `mesa.js` permanece.

```text
index.html                 # inalterado (module → mesa.js)
css/                       # inalterado
js/
├── mesa.js                # inalterado na cadência; NÃO importa motor.js; NÃO localStorage
├── quiz.js                # ALTER: flop_hero/turn_hero → motor; river/upgrade stub 003
├── motor.js               # NOVO: melhor 5, kickers, RN-017 (sem shuffle)
├── storage.js             # inalterado
├── carta.js               # inalterado
├── baralho.js             # inalterado (motor MAY importar só RANKS/NAIPES)
└── audio.js               # inalterado
tests/contract/
├── motor.test.js          # NOVO
├── quiz.test.js           # ALTER: correta real no flop/turn; river stub
├── hud-session.test.js    # ALTER: sem Flush cego no flop/turn
├── storage.test.js        # inalterado
├── baralho.test.js        # inalterado
└── audio-failopen.test.js # inalterado
```

**Structure Decision**: Continuar o projeto estático na raiz (não `frontend/` + `backend/`). Um módulo de domínio que o ADR-006 reservou (`motor`). O quiz da 003 permanece o único escritor da evolução e o único integrador HUD. Enumerador de upgrades e showdown **não** entram neste plan.

## Complexity Tracking

Nenhuma violação da constitution — tabela não se aplica.

## Phase 0 & Phase 1

- Phase 0: [research.md](./research.md) — motor vanilla, C(n,5), wheel/wrap/royal, RN-017 no motor, river excluído, fixtures de teste; zero `NEEDS CLARIFICATION`.
- Phase 1: modelo, contratos, quickstart (caminhos acima).

## Escolhas registradas (ambíguo → padrão)

Ver tabela no final de [research.md](./research.md). Destaques: git permanece em `main`; criar `js/motor.js`; quiz consome só flop/turn; API 5/6/7 sem HUD no 7; sequências legais fechadas; kickers internos; RN-017 no motor + shuffle no quiz; river stub 003; testes por fixture/`corretaUnica`.
