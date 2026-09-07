# Implementation Plan: Identificação de mãos ainda possíveis (flop e turn)

**Branch**: `005-maos-ainda-possiveis` (identidade Spec Kit; git de trabalho: `main`) | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-maos-ainda-possiveis/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Substituir o **stub** de upgrades (Flush verdadeiro no flop; skip forçado no turn) por um enumerador próprio no information set do herói: 47 desconhecidas no flop (pares) e 46 no turn (rios). Categoria C é upgrade se existe runout cuja **melhor** 5 das **7** finais é **exatamente** C e C é estritamente mais forte que a atual. Grade de até 6 (1–5 + distratoras, ou os 6 mais fortes); lista vazia → skip; falha → `ociosa` + **Nova mão**. Sem river, sem draws nomeados, sem persistir runouts.

Abordagem: estender **`js/motor.js`** (ADR-003) com snapshot + `enumerarUpgrades` + `conjuntoOpcoesUpgrade`. `js/quiz.js` prepara a lista no pouso da street e troca a correção de `flop_upgrade` / novo `turn_upgrade`. `js/mesa.js` só altera a cadência — **não** importa o motor. Retry e bucket `upgrade` reusam a 003.

Artefatos: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: HTML5 + CSS3 + JavaScript ES2020+ (ES modules nativos). Sem TypeScript no MVP.

**Primary Dependencies**: Nenhuma biblioteca de runtime. Sem lib de poker (CDN ou vendored). Reuso de `avaliarMelhor5` já em `js/motor.js`. APIs nativas: DOM do casco. Desenvolvimento: servidor estático (`python -m http.server` ou `npx serve`). Produção: GitHub Pages.

**Storage**: Sem chave nova. Continua só `poker-trainer:evolucao` (três buckets, ADR-002) via `js/storage.js`. Enumerador **stateless** em memória. MUST NOT persistir cartas, runouts, snapshot, kickers, pool, enunciado ou timestamp.

**Testing**: [quickstart.md](./quickstart.md) no browser `http://`. `node --test` estendendo `tests/contract/motor.test.js` + atualização de `quiz.test.js` e `hud-session.test.js`. Sem Playwright/Cypress, sem bundler.

**Target Platform**: Navegadores evergreen desktop (Chrome/Edge/Firefox); layout 1280×720 CSS px (casco). Servir só `http://` ou HTTPS — `file://` fora do modo suportado.

**Project Type**: Aplicação web estática single-page (cliente único, sem backend).

**Performance Goals**: Enumeração síncrona no pouso da street: flop C(47,2)×C(7,5) ≈ 22 701 avaliações de 5; alvo < 50 ms no desktop de referência, sempre antes do beat da 5.3. Fallback: HUD permanece no acerto ≤ 1 s extra, sem spinner. Feedback/beat permanecem os da 003 (< 1 s / ≤ 400 ms).

**Constraints**: Constitution I–VII e ADRs 001–007. Sem bundler, backend, Worker, lib de poker, PNG de face como carta principal, Unicode de baralho, API paga, mute na UI, cadastro, telemetria, relatório visual, botão zerar, quiz preflop, draws nomeados. UI em pt-BR. Custo operacional zero. MUST estender `js/motor.js`. MUST NOT perguntar upgrades no river. MUST NOT persistir runouts. Kickers MUST NEVER na UI (RN-G004). `mesa.js` MUST NOT importar `motor.js`.

**Scale/Scope**: Um treinando, uma mesa, 10 categorias, pergunta de upgrades só em duas streets. Enumerador reusável depois só como fonte da lista — showdown (006) não entra nesta entrega.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constituição: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0.

### Pré-design (antes da Phase 0) — PASS

Nenhuma violação. Complexity Tracking vazio.

#### Princípios I–VII

| Princípio | Resultado | Nota |
|-----------|-----------|------|
| I. Idioma pt-BR | PASS | Enunciado 5.4, 10 rótulos RN-014, skip e copy de falha em português; flop/turn/river MAY em inglês |
| II. LGPD / privacidade local | PASS | Só delta `upgrade` já definido; sem PII; sem envio; sem persistir runouts/snapshot; apelidos de produto |
| III. Custo zero | PASS | Estático + Pages; enumerador vanilla no motor existente; sem API / CDN / Worker pago |
| IV. Escopo treino ≠ jogo | PASS | Sem apostas, preflop, relatório, zerar, mute, desistir, multiplayer, draws nomeados |
| V. RN-G001..G008 | PASS | Tabela abaixo |
| VI. Desktop-first | PASS | Palco 001 inalterado; só conteúdo/cadência da 5.4 muda |
| VII. Fail-open | PASS | Storage 003 inalterado; enumeração síncrona não pede entropia; falha de enumeração aborta a mão (não mente no quiz); sem `alert` |

#### RN-G001 .. RN-G008

| Gate | Aplicável? | Conformidade |
|------|------------|--------------|
| **RN-G001** Uma pergunta por vez | Sim | 5.4 só depois do beat da 5.3; não empilha; river sem 5.4 |
| **RN-G002** Não avançar street sem acertar | Sim | Flop = 5.3 + (5.4 ou skip); turn = 5.3 + (5.4 ou skip); acerto da 5.3 **não** abre a próxima street |
| **RN-G003** Empates de pote | Indireto | Gerador 002 inalterado; enumerador **não** filtra board que empataria; pote hipotético não remove C |
| **RN-G004** Kickers nunca em texto de opção | **Sim** | Reusa Melhor5 da 004; HUD só rótulo RN-014 |
| **RN-G005** Sem pular / sem revelar a certa | Sim | Reuso 003; skip só se lista **realmente** vazia; sem “marcar todas”; falha ≠ skip |
| **RN-G006** Single-player; A/B não jogam | Sim | Holes A/B permanecem desconhecidas; sem bot de estratégia |
| **RN-G007** Burn cênico fora do board / 11 | Sim | Snapshot = alfabeto − visíveis; burn **não** retira carta; baralho vivo intocado |
| **RN-G008** Ordem visual embaralhada | Sim | Shuffle ao apresentar (quiz); conjunto do motor é estável; retry não reembaralha |

#### ADRs 001–007

| ADR | Nesta feature | Conformidade |
|-----|---------------|--------------|
| 001 Pages / sem backend | Cliente-only | PASS — MUST NOT API/auth/sync |
| 002 localStorage | Reuso | PASS — sem chave nova; sem IndexedDB; sem zerar; 0 runouts na chave |
| 003 Motor próprio | **Núcleo** | PASS — estender `js/motor.js`; MUST NOT lib de poker |
| 004 Shuffle crypto+pool | Intocado | PASS — snapshot não embaralha; G008 das opções ≠ Fisher–Yates das 52 |
| 005 Cartas HTML/CSS/SVG | Reuso | PASS — feltro 001/002; runout hipotético **não** vira no feltro |
| 006 ES modules sem bundler | `motor` / `quiz` | PASS — sem webpack/vite; sem módulo extra de upgrades |
| 007 Web Audio | Intocado | PASS — SFX da 003 |

#### Escopo negativo do MVP

Plan MUST NOT incluir: relatório visual, botão zerar, apostas, multiplayer, login, mute na UI, quiz preflop, draws nomeados. **PASS.**

#### Idioma, custo, retenção (explícito)

- **Idioma:** UI pt-BR; ids `snake_case` alinhados a `storage.js`.
- **Custo:** zero servidor; zero lib/CDN de poker; zero Worker.
- **Retenção:** só a chave de evolução na origem; limpar dados do site zera; reload aborta a mão e **não** zera contadores já gravados; runouts/snapshot/Melhor5 não são persistidos.

#### River

Esta feature MUST NOT adicionar pergunta de upgrades no river (não resta carta). O passo `river_hero` stub da 003 permanece. **PASS.**

### Pós-design (depois da Phase 1) — PASS

Reavaliado contra [data-model.md](./data-model.md), [contracts/motor-upgrades.md](./contracts/motor-upgrades.md), [contracts/quiz-upgrades.md](./contracts/quiz-upgrades.md), [quickstart.md](./quickstart.md), [research.md](./research.md).

- Modelo: `SnapshotDesconhecido`, `ListaUpgrades`, `ConjuntoOpcoesUpgrade`, `FalhaEnumeracao`; kickers só por dentro da Melhor5; river fora; falha ≠ skip.
- Contratos: API 47/46, testemunha só das 7, conjunto determinístico, quiz prepara no pouso, mesa sem importar motor, 1ª Confirmar no bucket `upgrade` das exibidas, aborto `ociosa`.
- Quickstart: CA-014..017, SC-001..026 relevantes, DevTools só contadores, 0 lib/backend.
- Nenhuma dependência nova, bundler, backend, lib de poker, Worker, relatório ou botão zerar.

**GATE PASS.** Pode seguir para `/speckit-tasks`. Este comando **não** executa tasks nem implementa código da aplicação.

## Project Structure

### Documentation (this feature)

```text
specs/005-maos-ainda-possiveis/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── motor-upgrades.md
│   └── quiz-upgrades.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Layout concreto do site estático (ADR-006). Cadência de skip/pergunta/falha em `mesa.js`; enumerador em `motor.js`.

```text
index.html                 # inalterado (module → mesa.js)
css/                       # inalterado
js/
├── mesa.js                # ALTER cadência: flop_skip, turn_upgrade, aborto ociosa
│                          # NÃO importa motor.js; NÃO localStorage
├── quiz.js                # ALTER: prepara lista no pouso; flop_upgrade/turn_upgrade reais
├── motor.js               # ALTER: snapshot + enumerarUpgrades + conjuntoOpcoesUpgrade
├── storage.js             # inalterado
├── carta.js               # inalterado
├── baralho.js             # inalterado (motor MAY importar só RANKS/NAIPES)
└── audio.js               # inalterado
tests/contract/
├── motor.test.js          # ALTER: 47/46, exatamente C, teto 6, as 9, falha
├── quiz.test.js           # ALTER: sem Flush-stub; turn_upgrade; flop_skip
├── hud-session.test.js    # ALTER: cadência real; aborto ociosa
├── storage.test.js        # inalterado
├── baralho.test.js        # inalterado
└── audio-failopen.test.js # inalterado
```

**Structure Decision**: Continuar o projeto estático na raiz (não `frontend/` + `backend/`). Estender o módulo de domínio que o ADR-006 reservou (`motor`). O quiz da 003 permanece o único escritor da evolução e o único integrador HUD. Showdown **não** entra neste plan.

## Complexity Tracking

Nenhuma violação da constitution — tabela não se aplica.

## Phase 0 & Phase 1

- Phase 0: [research.md](./research.md) — snapshot pelo alfabeto, enumeração síncrona, testemunha só das 7, teto de 6, falha → ociosa, fixtures das 9; zero `NEEDS CLARIFICATION`.
- Phase 1: modelo, contratos, quickstart (caminhos acima).

## Escolhas registradas (ambíguo → padrão)

Ver tabela no final de [research.md](./research.md). Destaques: git permanece em `main`; estender `js/motor.js`; lista no pouso, mostra após a 5.3; sync no thread da UI; snapshot sem tocar no baralho vivo; `turn_upgrade` + `flop_skip`; falha `{ ok: false }` → ociosa; 0 persistência de runouts.
