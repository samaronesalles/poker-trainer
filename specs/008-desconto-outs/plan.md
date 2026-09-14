# Implementation Plan: Desconto de outs (upgrades que vencem o pote e odd da próxima carta)

**Branch**: `008-desconto-outs` (identidade Spec Kit; git de trabalho: `feature/issue-4`) | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-desconto-outs/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Substituir o gabarito histórico da §5.4 (spec `005-maos-ainda-possiveis`: “ainda possível”, runout de duas cartas no flop, adversário não desconta) por **upgrades que viram o pote** contra um **vilão assumido** pessimista (RN-055), horizonte = **só a próxima carta**. Se a lista RN-057 não for vazia, após o acerto abre a **§5.8**: quantas outs, quais ranks (13) e odd da próxima carta (regra do 2, X:1). Skip com **“Não há mão que vire o pote.”** bloqueia a 5.8. Buckets `outs` e `odds` na mesma chave `poker-trainer:evolucao`. Sem Pot Odds, sem regra do 4, sem persistir vilão/outs/cartas. A pasta 005 **não** se reabre.

Abordagem: estender **`js/motor.js`** (ADR-003 emendado) com receita do vilão + baralho da próxima carta + enumeração de upgrades vencedores + outs/odd. **`js/quiz.js`** troca copy/gabarito da 5.4, prepara o snapshot no pouso da street e acrescenta os três passos da 5.8. **`js/storage.js`** (ADR-002 emendado) ganha os dois grupos únicos; bloco antigo de três buckets permanece **legível**. **`js/mesa.js`** só altera a cadência (acerto da 5.4 → 5.8, não a próxima street) — **não** importa o motor. `quemGanhou` (006) permanece com hole **reais**.

Artefatos: [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: HTML5 + CSS3 + JavaScript ES2020+ (ES modules nativos). Sem TypeScript no MVP.

**Primary Dependencies**: Nenhuma biblioteca de runtime. Sem lib de poker (CDN ou vendored). Reuso de `avaliarMelhor5` e `quemGanhou` já em `js/motor.js`. APIs nativas: DOM do casco, `localStorage` via `js/storage.js`. Desenvolvimento: servidor estático (`python -m http.server` ou `npx serve`). Produção: GitHub Pages.

**Storage**: Sem chave nova. Continua só `poker-trainer:evolucao` via `js/storage.js` (ADR-002). JSON passa a ter **cinco** buckets: `mao_atual`, `upgrade`, `vencedor_pote`, `outs`, `odds`. `outs` e `odds` são grupos únicos (não por categoria). Motor **stateless** em memória. MUST NOT persistir cartas, vilão assumido, lista de outs, ranks, N, razão, snapshot, information set, pool, enunciado ou timestamp. Bloco antigo (três buckets) é **legível**: os dois novos valem 0.

**Testing**: [quickstart.md](./quickstart.md) no browser `http://`. `node --test` estendendo `tests/contract/motor.test.js`, `quiz.test.js`, `storage.test.js`, `hud-session.test.js` e, se o layout dos 13 ranks exigir, `layout-responsivo.test.js`. Sem Playwright/Cypress, sem bundler.

**Target Platform**: Navegadores evergreen desktop (Chrome/Edge/Firefox); layout 1280×720 CSS px (casco). Tablet e estreito: HUD empilha abaixo; 13 ranks quebram dentro do HUD e MUST NOT cobrir feltro. Servir só `http://` ou HTTPS — `file://` fora do modo suportado.

**Project Type**: Aplicação web estática single-page (cliente único, sem backend).

**Performance Goals**: Enumeração síncrona no pouso da street: uma avaliação de melhor 5 por carta do baralho da próxima carta (flop ≈ 45; turn ≈ 44) × 2 (herói e vilão) + receita do vilão. Alvo ≪ 50 ms no desktop de referência, sempre antes do beat da 5.3. Fallback: HUD permanece no acerto ≤ 1 s extra, sem spinner. Feedback/beat permanecem os da 003 (< 1 s / ≤ 400 ms / 0 se movimento reduzido).

**Constraints**: Constitution I–VII v1.1.0 e ADRs 001–007 (002 e 003 emendados pelo CR-002). Sem bundler, backend, Worker, lib de poker, PNG de face como carta principal, Unicode de baralho, API paga, mute na UI, cadastro, telemetria, relatório visual, botão zerar, quiz preflop, Pot Odds, regra do 4, draws nomeados como rótulo. UI em pt-BR. Custo operacional zero. MUST estender `js/motor.js`, `js/quiz.js`, `js/storage.js` e a cadência em `js/mesa.js`. MUST NOT reabrir a pasta 005. MUST NOT perguntar 5.4/5.8 no river. MUST NOT persistir vilão/outs. Kickers MUST NEVER na UI (RN-G004). `mesa.js` MUST NOT importar `motor.js`. `motor.js` MUST NOT persistir. `colinha.js` MUST NOT ganhar chave.

**Scale/Scope**: Um treinando, uma mesa, 10 categorias, 5.4 + 5.8 só em duas streets. Um vilão abstrato **por street** (receita remonta no turn). Showdown (006) e colinha (007) não mudam de contrato — só o bloco persistido passa a listar cinco buckets.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constituição: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.1.0 (Last Amended 2026-09-13, CR-002).

### Pré-design (antes da Phase 0) — PASS

Nenhuma violação. Complexity Tracking vazio. Nenhum `NEEDS CLARIFICATION` no Technical Context.

#### Princípios I–VII

| Princípio | Resultado | Nota |
|-----------|-----------|------|
| I. Idioma pt-BR | PASS | Enunciados 5.4/5.8, 10 rótulos RN-014, 13 ranks RN-064, razões X:1, skip, linha RN-059 e copy de falha em português; flop/turn/river/outs/odd/ranks MAY em inglês |
| II. LGPD / privacidade local | PASS | Só deltas nos cinco buckets; sem PII; sem envio; sem persistir vilão/outs/ranks/N/razão/snapshot; apelidos de produto |
| III. Custo zero | PASS | Estático + Pages; enumerador vanilla no motor existente; sem API / CDN / Worker pago |
| IV. Escopo treino ≠ jogo | PASS | Outs/odd = leitura de equidade; **sem** Pot Odds, regra do 4, apostas, call/fold, preflop, relatório, zerar, mute, desistir, multiplayer, draws nomeados como rótulo |
| V. RN-G001..G008 | PASS | Tabela abaixo |
| VI. Desktop-first | PASS | Palco 001 inalterado; 13 ranks quebram no HUD; no estreito o HUD empilha abaixo; MUST NOT cobrir feltro |
| VII. Fail-open | PASS | Storage 003 + dois grupos; enumeração síncrona não pede entropia; falha de vilão/N/X aborta a mão (não mente no quiz); sem `alert` |

#### RN-G001 .. RN-G008

| Gate | Aplicável? | Conformidade |
|------|------------|--------------|
| **RN-G001** Uma pergunta por vez | Sim | 5.4 só depois do beat da 5.3; cada passo da 5.8 **substitui** o HUD; N/ranks/X MUST NOT empilhar; linha de suposição MAY ficar só leitura (não é pergunta); river sem 5.4/5.8 |
| **RN-G002** Não avançar street sem acertar | Sim | Flop/turn = 5.3 + (5.4 ou skip) + (§5.8 **só** se a 5.4 não foi skip); acerto da 5.3 **não** abre 5.4 antes do beat; acerto da 5.4 **não** abre a próxima street |
| **RN-G003** Empates de pote | Indireto | Gerador 002 inalterado; empate **hipotético** com o vilão **não** é out nem upgrade (RN-070); showdown 006 inalterado (hole reais) |
| **RN-G004** Kickers nunca em texto de opção | **Sim** | Reusa Melhor5 da 004; HUD só rótulo RN-014 / ranks RN-064 / X:1; linha RN-059 sem kicker por extenso |
| **RN-G005** Sem pular / sem revelar a certa | Sim | Reuso 003; skip só se lista **realmente** vazia; sem “marcar todas”; falha ≠ skip; N = 0 inventado proibido |
| **RN-G006** Single-player; A/B não jogam | Sim | Vilão é sintético; holes A/B permanecem fechadas e **fora** da receita; sem bot de estratégia |
| **RN-G007** Burn cênico fora do board / 11 | Sim | Baralho da próxima carta = 52 − herói − board − 2 assumidas; burn **não** retira carta; assumidas **não** são cartas de jogo; baralho vivo intocado |
| **RN-G008** Ordem visual embaralhada | Sim | Shuffle ao apresentar 5.4, quantidade, ranks e odd; conjunto do motor é estável; retry não reembaralha |

#### ADRs 001–007

| ADR | Nesta feature | Conformidade |
|-----|---------------|--------------|
| 001 Pages / sem backend | Cliente-only | PASS — MUST NOT API/auth/sync |
| 002 localStorage | **Converge** | PASS — mesma chave; +`outs` +`odds`; sem IndexedDB; sem zerar; 0 vilão/outs/N/razão na chave |
| 003 Motor próprio | **Núcleo** | PASS — estender `js/motor.js` (vilão, próxima carta, outs, odd); MUST NOT lib de poker |
| 004 Shuffle crypto+pool | Intocado | PASS — snapshot não embaralha; G008 das opções ≠ Fisher–Yates das 52 |
| 005 Cartas HTML/CSS/SVG | Reuso | PASS — feltro 001/002; carta hipotética **não** vira no feltro; assumidas **não** ocupam slot de A/B |
| 006 ES modules sem bundler | `motor` / `quiz` / `storage` | PASS — sem webpack/vite; sem módulo extra de outs |
| 007 Web Audio | Intocado | PASS — SFX da 003 |

#### Escopo negativo do MVP

Plan MUST NOT incluir: relatório visual, botão zerar, apostas, Pot Odds, regra do 4, multiplayer, login, mute na UI, quiz preflop, draws nomeados como rótulo. **PASS.**

#### Idioma, custo, retenção (explícito)

- **Idioma:** UI pt-BR; ids `snake_case` alinhados a `storage.js`.
- **Custo:** zero servidor; zero lib/CDN de poker; zero Worker.
- **Retenção:** só a chave de evolução na origem; limpar dados do site zera; reload aborta a mão e **não** zera contadores já gravados; vilão/outs/ranks/N/razão/snapshot/Melhor5 não são persistidos.

#### River e 005 histórica

Esta feature MUST NOT adicionar 5.4 nem 5.8 no river. `quemGanhou` continua com hole reais (006). A pasta `005-maos-ainda-possiveis` MUST NOT ser editada; RN-020 / CA-014–017 deixam de ser contrato. **PASS.**

### Pós-design (depois da Phase 1) — PASS

Reavaliado contra [data-model.md](./data-model.md), [contracts/motor-desconto-outs.md](./contracts/motor-desconto-outs.md), [contracts/quiz-desconto-outs.md](./contracts/quiz-desconto-outs.md), [contracts/storage-outs-odds.md](./contracts/storage-outs-odds.md), [quickstart.md](./quickstart.md), [research.md](./research.md).

- Modelo: `VilaoAssumido` (por street), `BaralhoProximaCarta` (45/44), `UpgradeVencedor` (RN-057), `ListaOuts` / `OddProximaCarta`, skip com frase nova, `EvolucaoTreino` com cinco buckets; kickers só por dentro; river fora; falha ≠ skip; snapshot só em memória.
- Contratos: receita RN-055 + naipe canônico; horizonte = próxima carta; `quemGanhou` intocado; quiz prepara no pouso; acerto da 5.4 abre 5.8 (não a street); mesa sem importar motor; 1ª tentativa em `outs`/`odds` sem gravar N/ranks/razão/vilão; bloco de 3 buckets é incompleto (não corrupto).
- Quickstart: CA-033..048, SC relevantes, DevTools só contadores, 0 lib/backend/Pot Odds/regra do 4.
- Nenhuma dependência nova, bundler, backend, lib de poker, Worker, relatório, botão zerar, chave extra ou persistência de vilão/outs.

Princípios I–VII, RN-G001..G008, ADRs 001–007 e escopo negativo do MVP: **reconfirmados PASS** (mesmas tabelas do pré-design; o design não introduziu violação).

**GATE PASS.** Pode seguir para `/speckit-tasks`. Este comando **não** executa tasks nem implementa código da aplicação. Este comando **não** faz commit.

## Project Structure

### Documentation (this feature)

```text
specs/008-desconto-outs/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── motor-desconto-outs.md
│   ├── quiz-desconto-outs.md
│   └── storage-outs-odds.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Layout concreto do site estático (ADR-006). Cadência de skip/pergunta/5.8/falha em `mesa.js`; enumerador + vilão em `motor.js`; único escritor da evolução = `quiz.js`.

```text
index.html                 # inalterado (module → mesa.js)
css/
├── mesa.css               # inalterado (feltro)
├── cartas.css             # inalterado
└── hud.css                # ALTER: faixa compacta dos 13 ranks; linha de suposição só leitura
js/
├── mesa.js                # ALTER cadência: 5.4 → 5.8 → street; novos PASSOS; aborto ociosa
│                          # NÃO importa motor.js; NÃO localStorage
├── quiz.js                # ALTER: copy 5.4/5.8; snapshot no pouso; outs/ranks/odd; deltas outs/odds
├── motor.js               # ALTER: vilão RN-055 + próxima carta + upgrades vencedores + outs/odd
├── storage.js             # ALTER: evolucaoZerada + ler/gravar/deltas com outs e odds
├── carta.js               # inalterado
├── baralho.js             # inalterado (motor MAY importar só RANKS/NAIPES)
├── colinha.js             # inalterado (sem chave; CA-032 admite cinco buckets)
├── layout.js              # MAY ALTER se o teste de cobertura dos ranks exigir métrica
└── audio.js               # inalterado
tests/contract/
├── motor.test.js          # ALTER: CA-033..045, receita, N=10, odd 4:1/11:1/5:1; 005 histórico sai
├── quiz.test.js           # ALTER: enunciado novo; skip novo; cadência 5.8; sem §5.8 no skip/river
├── storage.test.js        # ALTER: cinco buckets; bloco de 3 é legível; outs/odds grupo único
├── hud-session.test.js    # ALTER: 5.4 não abre street; 5.8; aborto ociosa
├── layout-responsivo.test.js  # MAY ALTER: 13 ranks não cobrem feltro
├── baralho.test.js        # inalterado
├── colinha.test.js        # inalterado (sem chave)
└── audio-failopen.test.js # inalterado
# NÃO editar:
# specs/005-maos-ainda-possiveis/**
```

**Structure Decision**: Continuar o projeto estático na raiz (não `frontend/` + `backend/`). Estender os módulos de domínio que o ADR-006 já reservou (`motor`, `quiz`, `storage`). Sem módulo novo de outs. Showdown e colinha **não** mudam de contrato; o vilão assumido MUST NOT vazar para `quemGanhou`.

## Complexity Tracking

Nenhuma violação da constitution — tabela não se aplica.

## Phase 0 & Phase 1

- Phase 0: [research.md](./research.md) — vilão por street, próxima carta, desconto, regra do 2, converge storage, cadência 5.8; zero `NEEDS CLARIFICATION`.
- Phase 1: modelo, contratos, quickstart (caminhos acima). Pós-design do Constitution Check neste arquivo, após os artefatos.

## Escolhas registradas (ambíguo → padrão)

Ver tabela no final de [research.md](./research.md). Destaques: git permanece em `feature/issue-4`; estender `motor`/`quiz`/`storage`/`mesa`; uma API de street no pouso; receita remonta no turn; naipe canônico; bloco de 3 buckets é incompleto (não corrupto); 5.4 acertada abre 5.8; falha `{ ok: false }` → ociosa; 0 persistência de vilão/outs; pasta 005 intocada.
