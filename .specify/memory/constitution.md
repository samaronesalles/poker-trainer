<!--
Sync Impact Report
==================
Version change: unversioned template placeholder → 1.0.0
Bump rationale: first ratification. Placeholder tokens replaced with
Poker Trainer non-negotiable principles. MAJOR 1.0.0 (initial adoption).

Modified principles (template slot → ratified title):
- [PRINCIPLE_1_NAME] → I. Idioma em português brasileiro
- [PRINCIPLE_2_NAME] → II. Privacidade local e LGPD (NON-NEGOTIABLE)
- [PRINCIPLE_3_NAME] → III. Custo zero operacional
- [PRINCIPLE_4_NAME] → IV. Escopo MVP: treino de leitura, não jogo
- [PRINCIPLE_5_NAME] → V. Regras globais de treino RN-G001..RN-G008 (NON-NEGOTIABLE)
  Template had five principle slots; two more were added from product gates:
- (added) VI. Desktop-first
- (added) VII. Fail-open: a mesa não trava

Added sections:
- Contrato Técnico (ADRs 001–007)
- Constitution Check

Removed sections: none (template SECTION_2 / SECTION_3 slots filled)

Follow-up TODOs: none

Recorded choices (ambiguous → default):
- Constitution language: pt-BR (matches PRD, context, ADRs, product UI).
- Ratification date: 2026-09-07 (same day as context/PRD/ADR set).
- Constitution Check validates RN-G001 through RN-G008, not only G001–G006
  (roadmap: all eight apply to every spec; G007/G008 are applicable globals).
-->

# Poker Trainer Constitution

## Core Principles

### I. Idioma em português brasileiro

Toda interface visível ao usuário e todo texto de produto (HUD, enunciados,
opções, feedback, CTAs, apelidos de assento) MUST ser em português brasileiro.

Termos de clube MAY permanecer em inglês quando o PRD os fixa (flop, turn,
river, showdown). Os **10 nomes de categoria do quiz** MUST ser exatamente os
rótulos canônicos de RN-014, sem sinônimos na UI (não misturar “Sequência” e
“Straight”). CTAs MUST usar **Nova mão** (mesa ociosa) e **Próxima mão**
(desfecho) — nunca “Embaralhar” como nome de botão.

Código, comentários de implementação e ADRs MAY usar identificadores em
inglês; o que o treinando lê MUST estar em português.

**Rationale:** o único usuário do MVP treina para mesas presenciais no Brasil;
vocabulário instável no quiz treina o rótulo errado.

### II. Privacidade local e LGPD (NON-NEGOTIABLE)

O produto MUST operar sem cadastro, sem login, sem conta e sem perfil.
MUST NOT coletar, solicitar ou persistir CPF, e-mail, nome real, apelido
digitado pelo usuário, telefone, endereço ou qualquer identificador pessoal.

O único dado persistido MUST ser contadores de desempenho de treino
(`mao_atual`, `upgrade`, `vencedor_pote`: acertos, erros e exposições da
primeira tentativa, por categoria quando aplicável), exclusivamente no
`localStorage` da origem do app no navegador do usuário.

MUST NOT enviar mãos, respostas, contadores, telemetria pessoal ou qualquer
payload a servidor. Não há backend; não há analytics de identificação; não há
sincronização entre dispositivos.

**Retenção:** os contadores permanecem só enquanto o usuário não limpar os
dados do site naquela origem. Limpar dados do site apaga a evolução. Não há
botão “zerar” na UI (ver princípio IV). Dados corrompidos MUST ser
descartados e zerados sem quebrar a mesa.

**Rationale:** LGPD (Lei nº 13.709/2018) e RN-039. Sem dado pessoal, a base
legal de cadastro não se aplica; a evolução é memória de treino no dispositivo.

### III. Custo zero operacional

O MVP MUST ser um site estático publicado no GitHub Pages. MUST NOT haver
servidor de aplicação, API própria, banco remoto, funções serverless, CDN de
libs pagas nem APIs pagas (entropia, identidade, áudio, avaliação de mãos).

Desenvolvimento local MUST usar servidor estático em `http://`. Abrir
`index.html` via `file://` NÃO é modo suportado (ES modules e áudio).

**Rationale:** um usuário, time mínimo, ADR-001. Qualquer backend aumenta
custo e superfície sem servir o escopo.

### IV. Escopo MVP: treino de leitura, não jogo

O produto é um treinador **single-player** de leitura de mãos de Texas
Hold’em (herói + dois adversários). A tela principal MUST ser uma mesa
imersiva (feltro, cartas, assentos, HUD integrado) — nunca um quiz escolar
ao lado de um baralho.

MUST NOT no MVP:

- apostas, blinds, raises, fold, side pots ou decisão de estratégia
- quiz preflop (RN-041)
- multiplayer, contas, lobby ou adversários que “jogam”
- tela de relatório, gráfico, ranking ou tabela de desempenho
- botão de zerar evolução (limpar dados do site no navegador basta)
- controle de mute/volume na UI
- CTA “Desistir” / “Nova mão” no meio da mão (abandonar = recarregar)
- draws nomeados, enunciados com kickers ou “par de ases”
- outras variantes (Omaha, Stud, short deck), mais de três jogadores
- app nativo ou “cola” para mesa ao vivo

Pós-MVP (relatório, draws, sync) exige emenda a esta constitution e ADRs
novos — não entra por atalho numa spec.

**Rationale:** o treino existe para gravar leitura na cadência da mesa;
aposta, conta e dashboard desviam atenção e violam custo/LGPD.

### V. Regras globais de treino RN-G001..RN-G008 (NON-NEGOTIABLE)

Estas regras são gates de produto. Nenhuma spec, plan ou implementação MAY
violá-las. O detalhe operacional vive no PRD; o texto abaixo é o contrato
mínimo testável.

- **RN-G001:** Uma pergunta de cada vez no HUD. MUST NOT empilhar os quatro
  quizzes do river.
- **RN-G002:** MUST NOT avançar de street enquanto as perguntas da street
  não estiverem acertadas. Flop/turn = identificação da mão atual +
  (upgrades ou skip). River = as quatro perguntas do showdown (sem
  pergunta de upgrade).
- **RN-G003:** Empates de pote fazem parte do treino. O gerador MUST NOT
  evitar boards que empatam.
- **RN-G004:** Kickers decidem o pote no motor e MUST NEVER aparecer como
  texto de opção.
- **RN-G005:** MUST NOT existir “pular pergunta” nem botão que revele a
  resposta. Retry até acertar; a certa só aparece quando o usuário a
  escolhe (ou o conjunto multi-select fica correto).
- **RN-G006:** Single-player local; adversários MUST NOT “jogar” (sem bot
  de estratégia, sem servidor de oponente).
- **RN-G007:** Burn é opcional na cenografia. Se existir, MUST NOT entrar
  no board e MUST NOT consumir carta das 11 de jogo (RN-044 / RN-045).
- **RN-G008:** A ordem visual das opções de cada pergunta MUST ser
  embaralhada. A correta MUST NOT ficar sempre no mesmo botão.

**Rationale:** sem esses gates o MVP vira prova escolar, jogo de apostas
ou vazamento de resposta — e deixa de treinar a leitura.

### VI. Desktop-first

O layout de referência MUST ser desktop. Tablet MUST manter mesa + HUD
sem cortar cartas até ficarem ilegíveis. Celular no MVP MAY empilhar o
HUD abaixo; cartas ainda MUST ser legíveis; a imersão NÃO precisa igualar
o desktop.

**Rationale:** o autor treina em casa no computador; RN-007.

### VII. Fail-open: a mesa não trava

Falha de áudio ou de `localStorage` MUST NOT impedir o treino.

- **Áudio:** se o browser bloquear, o contexto falhar ou o unlock não
  ocorrer, a mesa segue muda. MUST NOT haver modal agressivo nem
  `alert()`. Não há mute na UI; silenciar = política do browser ou do SO.
- **Persistência:** se o armazenamento for recusado ou indisponível, o
  treino continua; a evolução MAY perder-se ao fechar. MUST NOT exibir
  jargão técnico que bloqueie o HUD.
- **Shuffle:** sem movimento de mouse, o embaralhamento segue com relógio
  e demais fontes (ADR-004). MUST NOT travar a UI à espera de entropia.
- **Web Crypto ausente:** o shuffle usa o pool local; a mesa MUST NOT
  travar.

**Rationale:** a habilidade treinada é a leitura; som e stats são apoio.
ADR-002 e ADR-007.

## Contrato Técnico

A stack do MVP é o contrato dos ADRs **001–007** (status Aceito). Plans e
código MUST implementá-los; MUST NOT substituir a stack por outra “equivalente”
sem emenda desta constitution e novo ADR.

| ADR | Contrato |
|-----|----------|
| **ADR-001** | Entrega estática no GitHub Pages; sem backend, sem API, sem auth. |
| **ADR-002** | Evolução só em `localStorage` (JSON). Sem IndexedDB, sem nuvem, sem `sessionStorage` como banco. Sem chave de zerar na UI. |
| **ADR-003** | Motor próprio em JavaScript no cliente (melhor 5, kickers, empates, enumeração de upgrades no information set do herói). MUST NOT depender de lib de poker em runtime (CDN ou vendored). |
| **ADR-004** | Shuffle Fisher–Yates com `crypto.getRandomValues` misturado a pool (cursor, data/hora, tick). Uma permutação por mão; 11 cartas de jogo via RN-044; burns visuais não consomem carta. |
| **ADR-005** | Cartas HTML/CSS com naipes SVG; flip/deal em CSS. MUST NOT usar Unicode de baralho (U+1F0A0…) nem emoji como carta principal. |
| **ADR-006** | `index.html` + CSS + ES modules por domínio (`mesa`, `carta`, `baralho`, `motor`, `quiz`, `storage`, `audio`). MUST NOT exigir bundler (webpack/vite) no MVP. |
| **ADR-007** | Web Audio sintetizado; unlock no primeiro gesto (Nova mão / Próxima mão); fail-open. MUST NOT exigir samples MP3/OGG nem lib de áudio no MVP. |

Fontes de verdade: `docs/prd.md` (comportamento), `docs/adr/*.md` (como
construir), `docs/context.md` (por quê). Em conflito pontual de detalhe,
o PRD manda no comportamento e o ADR manda na stack — e esta constitution
manda nos gates acima.

## Constitution Check

Todo `/speckit-plan` MUST incluir a seção **Constitution Check** e MUST
passá-la **antes** da Phase 0 (research) e de novo **depois** da Phase 1
(design). Um plan que falhe o check MUST NOT avançar para `/speckit-tasks`
nem `/speckit-implement`.

O check MUST validar, no mínimo:

1. **RN-G001 .. RN-G008** — todos os oito, com nota explícita de
   conformidade ou de “não aplicável nesta feature” + justificativa
   (ex.: burn cênico só toca G007 se a spec desenhar burn).
2. **Princípios I–VII** desta constitution (idioma, LGPD, custo, escopo,
   globais, desktop-first, fail-open).
3. **ADRs 001–007** — a abordagem técnica do plan MUST citar os ADRs
   tocados e MUST NOT introduzir backend, bundler, lib de poker, PNG de
   carta como face principal, API paga ou persistência fora do
   `localStorage`.
4. **Escopo negativo do MVP** — o plan MUST NOT incluir relatório visual,
   botão zerar, apostas, multiplayer, login, mute na UI ou quiz preflop.

Qualquer violação é **GATE FAIL**. Exceções só por emenda versionada desta
constitution (não por comentário no plan).

## Governance

Esta constitution prevalece sobre prática informal, preferência de
implementação e atalhos de spec. PRD e ADRs detalham; não autorizam
violar os princípios.

**Emenda:** alterar princípio, gate ou contrato técnico exige (1) editar
este arquivo, (2) bump de versão semântico, (3) Sync Impact Report no topo,
(4) `Last Amended` = data ISO do dia, (5) ADR novo ou revisão de ADR se a
stack mudar. Mudança de comportamento de produto exige CR em `docs/changes/`
e atualização do PRD; a constitution só muda se o gate mudar.

**Versionamento:**

- **MAJOR:** remoção ou redefinição incompatível de princípio/gate
  (ex.: passar a ter login, backend, ou relaxar RN-G00x).
- **MINOR:** novo princípio/seção ou expansão material de guidance.
- **PATCH:** clarificação, typo, refinamento sem mudar o significado.

**Compliance:** reviews e PRs MUST verificar os gates. Complexidade extra
(bundler, framework, servidor, lib) MUST ser recusada no MVP salvo emenda.
YAGNI aplica-se: não construir relatório, sync ou mute “para depois” dentro
da entrega atual.

**Fluxo Spec Kit:** `/speckit-specify` → `/speckit-clarify` →
`/speckit-plan` (este check) → `/speckit-tasks` → `/speckit-implement`,
na ordem do `docs/speckit-roadmap.md`. Este comando de constitution NÃO
implementa código da aplicação.

**Version**: 1.0.0 | **Ratified**: 2026-09-07 | **Last Amended**: 2026-09-07
