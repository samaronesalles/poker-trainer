# Implementation Plan: Showdown — mãos dos adversários e vencedor do pote

**Branch**: `006-showdown-vencedor` (identidade Spec Kit; git de trabalho: `main`) | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-showdown-vencedor/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Substituir o **stub** do river (herói Flush fixo; A/B Par fixo; vencedor por `indiceMaoSessao`) por showdown autoritativo: virada simultânea de A e B, **exatamente quatro** perguntas (`river_hero` → `river_a` → `river_b` → `river_vencedor`), cada uma reusando o contrato 5.3 nas três categorias, vencedor pelo **ranking completo RN-029** (kickers, split, board que joga), 6 textos RN-031, desfecho visual **só** em `resultado`. **Zero** pergunta 5.4 no river.

Abordagem: estender **`js/motor.js`** (ADR-003) com `quemGanhou` + `conjuntoOpcoesVencedor` + `UNIVERSO_POTE`. `js/quiz.js` prepara o showdown assim que as 11 cartas são conhecidas e troca a correção dos quatro passos. `js/mesa.js` só altera cadência, aborto e cenografia do pote — **não** importa o motor. Retry e buckets `mao_atual` / `vencedor_pote` reusam a 003. Storage intocado.

Artefatos: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: HTML5 + CSS3 + JavaScript ES2020+ (ES modules nativos). Sem TypeScript no MVP.

**Primary Dependencies**: Nenhuma biblioteca de runtime. Sem lib de poker (CDN ou vendored). Reuso de `avaliarMelhor5` e `conjuntoOpcoesMaoAtual` já em `js/motor.js`. APIs nativas: DOM do casco. Desenvolvimento: servidor estático (`python -m http.server` ou `npx serve`). Produção: GitHub Pages.

**Storage**: Sem chave nova. Continua só `poker-trainer:evolucao` (três buckets, ADR-002) via `js/storage.js`. Motor **stateless** em memória. MUST NOT persistir cartas, Melhor5, `chaveDesempate`, dump de `quemGanhou`, enunciado, opções, pool ou timestamp.

**Testing**: [quickstart.md](./quickstart.md) no browser `http://`. `node --test` estendendo `tests/contract/motor.test.js` + atualização de `quiz.test.js` e `hud-session.test.js`. Sem Playwright/Cypress, sem bundler.

**Target Platform**: Navegadores evergreen desktop (Chrome/Edge/Firefox); layout 1280×720 CSS px (casco). Servir só `http://` ou HTTPS — `file://` fora do modo suportado.

**Project Type**: Aplicação web estática single-page (cliente único, sem backend).

**Performance Goals**: Comparação síncrona no pouso do river: 3 × C(7,5) = 63 avaliações de 5; alvo ≪ 50 ms no desktop de referência, sempre antes do fim da virada. Fallback: HUD permanece em `deal` ≤ 1 s extra após a virada, sem spinner. Feedback/beat permanecem os da 003 (< 1 s / 0 s se movimento reduzido).

**Constraints**: Constitution I–VII e ADRs 001–007. Sem bundler, backend, Worker, lib de poker, PNG de face como carta principal, Unicode de baralho, API paga, mute na UI, cadastro, telemetria, relatório visual, botão zerar, quiz preflop, 5.4 no river, destaque de vencedor durante as perguntas. UI em pt-BR. Custo operacional zero. MUST estender `js/motor.js` com `quemGanhou`. Kickers MUST NEVER na UI (RN-G004). `mesa.js` MUST NOT importar `motor.js`. Destaque visual só em `resultado`.

**Scale/Scope**: Um treinando, uma mesa, 10 categorias, 7 textos de pote, quatro perguntas só no river. Flop/turn (004/005) inalterados.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constituição: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0.

### Pré-design (antes da Phase 0) — PASS

Nenhuma violação. Complexity Tracking vazio.

#### Princípios I–VII

| Princípio | Resultado | Nota |
|-----------|-----------|------|
| I. Idioma pt-BR | PASS | Enunciados 5.5, 10 rótulos RN-014, 7 textos RN-030, feedback e CTAs em português; flop/turn/river/showdown MAY em inglês |
| II. LGPD / privacidade local | PASS | Só deltas `mao_atual` (três) e `vencedor_pote` (um) já definidos; sem PII; sem envio; sem persistir Melhor5/chave/dump; apelidos de produto |
| III. Custo zero | PASS | Estático + Pages; comparação vanilla no motor existente; sem API / CDN / Worker pago |
| IV. Escopo treino ≠ jogo | PASS | Sem apostas, preflop, relatório, zerar, mute, desistir, multiplayer, draws nomeados, bb, contabilidade |
| V. RN-G001..G008 | PASS | Tabela abaixo |
| VI. Desktop-first | PASS | Palco 001 inalterado; só conteúdo/cadência/cenografia do river muda |
| VII. Fail-open | PASS | Storage 003 inalterado; comparação síncrona não pede entropia; falha de classificação aborta a mão (não mente no quiz); sem `alert`; áudio 001 inalterado |

#### RN-G001 .. RN-G008

| Gate | Aplicável? | Conformidade |
|------|------------|--------------|
| **RN-G001** Uma pergunta por vez | **Sim** | Quatro passos em sequência; MUST NOT empilhar; cada pergunta substitui o HUD |
| **RN-G002** Não avançar street sem acertar | **Sim** | River = as quatro perguntas; **zero** 5.4; acerto de `turn_*` é que abre o river; acerto de `river_hero` **não** abre upgrades |
| **RN-G003** Empates de pote | **Sim** | Gerador 002 inalterado; motor **não** filtra board que empataria; split é certa legal |
| **RN-G004** Kickers nunca em texto de opção | **Sim** | Ranking completo só por dentro; HUD só rótulo RN-014 ou texto RN-030; MUST NOT acender as 5 cartas |
| **RN-G005** Sem pular / sem revelar a certa | **Sim** | Reuso 003; sem skip nas quatro; destaque/fichas só após acerto de “quem ganhou”; falha ≠ inventar empate |
| **RN-G006** Single-player; A/B não jogam | **Sim** | A/B só viram cartas; sem bot de estratégia |
| **RN-G007** Burn cênico fora do board / 11 | **Sim** | 7 de cada um = 2 hole + 5 comunitárias; burn **não** entra |
| **RN-G008** Ordem visual embaralhada | **Sim** | Shuffle ao apresentar (quiz); conjunto do motor é estável; retry não reembaralha |

#### ADRs 001–007

| ADR | Nesta feature | Conformidade |
|-----|---------------|--------------|
| 001 Pages / sem backend | Cliente-only | PASS — MUST NOT API/auth/sync |
| 002 localStorage | Reuso | PASS — sem chave nova; sem IndexedDB; sem zerar; 0 Melhor5/chave na chave |
| 003 Motor próprio | **Núcleo** | PASS — estender `js/motor.js` com `quemGanhou`; MUST NOT lib de poker |
| 004 Shuffle crypto+pool | Intocado | PASS — G008 das opções ≠ Fisher–Yates das 52; gerador **não** evita empate |
| 005 Cartas HTML/CSS/SVG | Reuso | PASS — virada face-up; MUST NOT contornar as 5 da melhor mão |
| 006 ES modules sem bundler | `motor` / `quiz` | PASS — sem webpack/vite; sem módulo extra de showdown |
| 007 Web Audio | Intocado | PASS — SFX da 001/003; sem mute |

#### Escopo negativo do MVP

Plan MUST NOT incluir: relatório visual, botão zerar, apostas, multiplayer, login, mute na UI, quiz preflop, draws nomeados. **PASS.**

#### Idioma, custo, retenção (explícito)

- **Idioma:** UI pt-BR; ids `snake_case` alinhados a `storage.js` / stub 003 (`voce`, `adversarioA`, `voce_a`, `tres`).
- **Custo:** zero servidor; zero lib/CDN de poker; zero Worker.
- **Retenção:** só a chave de evolução na origem; limpar dados do site zera; reload aborta a mão e **não** zera contadores já gravados; Melhor5/`chaveDesempate`/dump de `quemGanhou` não são persistidos.

#### River / 5.4

Esta feature MUST NOT adicionar pergunta de upgrades no river. Os passos `flop_upgrade` / `turn_upgrade` da 005 permanecem. **PASS.**

### Pós-design (depois da Phase 1) — PASS

Reavaliado contra [data-model.md](./data-model.md), [contracts/motor-showdown.md](./contracts/motor-showdown.md), [contracts/quiz-showdown.md](./contracts/quiz-showdown.md), [contracts/hud-resultado.md](./contracts/hud-resultado.md), [quickstart.md](./quickstart.md), [research.md](./research.md).

- Modelo: `ShowdownMemoria`, `ConjuntoVencedor`, `UniversoPote`, `PerguntaCategoriaRiver`, `PerguntaPote`; kickers só por dentro da Melhor5; 0 5.4; falha ≠ empate inventado; destaque só em `resultado`.
- Contratos: API `quemGanhou` / RN-031, quiz prepara no pouso do river, mesa sem importar motor, 1ª tentativa em `mao_atual`×3 e `vencedor_pote`×1, aborto `ociosa`, virada simultânea, CTA imediato.
- Quickstart: CA-018..021, CA-027, SC-001..026 relevantes, DevTools só contadores, 0 lib/backend.
- Nenhuma dependência nova, bundler, backend, lib de poker, Worker, relatório ou botão zerar.

**GATE PASS.** Pode seguir para `/speckit-tasks`. Este comando **não** executa tasks nem implementa código da aplicação.

## Project Structure

### Documentation (this feature)

```text
specs/006-showdown-vencedor/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── motor-showdown.md
│   ├── quiz-showdown.md
│   └── hud-resultado.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Layout concreto do site estático (ADR-006). Cadência/aborto/cenografia em `mesa.js`; comparação em `motor.js`.

```text
index.html                 # ALTER: grupo de fichas data-para="adversarioB" (split dos três)
css/
├── mesa.css               # ALTER: destaque de assento vencedor; pote para A/B e split 2/3
└── hud.css                # ALTER menor: desfecho reitera 3 rótulos; perdedores não escurecem
js/
├── mesa.js                # ALTER cadência: preparar no pouso; aborto ociosa; resultado autoritativo
│                          # NÃO importa motor.js; NÃO localStorage; destaque só em resultado
├── quiz.js                # ALTER: river_hero/a/b/vencedor reais; some stub Flush/Par/indiceMao
├── motor.js               # ALTER: quemGanhou + conjuntoOpcoesVencedor + UNIVERSO_POTE
├── storage.js             # inalterado
├── carta.js               # inalterado
├── baralho.js             # inalterado (motor MAY importar só RANKS/NAIPES)
└── audio.js               # inalterado
tests/contract/
├── motor.test.js          # ALTER: RN-029, split, board, wheel, wrap, RN-031, falha
├── quiz.test.js           # ALTER: sem Flush/Par-stub no river; 4 passos autoritativos
├── hud-session.test.js    # ALTER: cadência real; sem vazar pote; aborto; Próxima mão
├── storage.test.js        # inalterado
├── baralho.test.js        # inalterado
└── audio-failopen.test.js # inalterado
```

**Structure Decision**: Continuar o projeto estático na raiz (não `frontend/` + `backend/`). Estender o módulo de domínio que o ADR-006 reservou (`motor`). O quiz da 003 permanece o único escritor da evolução e o único integrador HUD. Flop/turn **não** são redesenhados.

## Complexity Tracking

Nenhuma violação da constitution — tabela não se aplica.

## Phase 0 & Phase 1

- Phase 0: [research.md](./research.md) — `quemGanhou` por `chaveDesempate`, RN-031 no motor, preparação no pouso, destaque só em `resultado`, zero 5.4, falha → ociosa; zero `NEEDS CLARIFICATION`.
- Phase 1: modelo, contratos, quickstart (caminhos acima).

## Escolhas registradas (ambíguo → padrão)

Ver tabela no final de [research.md](./research.md). Destaques: git permanece em `main`; estender `js/motor.js` com `quemGanhou`; preparar no pouso do river; sync no thread da UI; `{ ok: false }` → ociosa; id `tres` para **Os três empatam**; destaque/fichas só em `resultado`; 0 persistência de Melhor5/chave.
