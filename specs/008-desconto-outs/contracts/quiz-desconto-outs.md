# Contract: Quiz — §5.4 revista e §5.8 (outs / ranks / odd)

**Feature**: `008-desconto-outs`  
**Tipo**: contrato de UI / domínio no cliente (sem HTTP)  
**Módulo**: `js/quiz.js` + cadência em `js/mesa.js` (**alter**; retry da 003 permanece)  
**Consumidores**: `js/mesa.js`, testes `quiz.test.js` / `hud-session.test.js`  
**Motor**: [motor-desconto-outs.md](./motor-desconto-outs.md)  
**Persistência**: [storage-outs-odds.md](./storage-outs-odds.md)  
**Substitui como contrato vigente**: [quiz-upgrades.md da 005](../../005-maos-ainda-possiveis/contracts/quiz-upgrades.md)

Não há API de rede. `mesa.js` MUST NOT importar `motor.js`. Showdown da 006 **não** muda. Colinha da 007 **não** ganha chave.

---

## 1. O que muda vs. 005 / 003

| Passo | 005 / vigente | 008 |
|-------|---------------|-----|
| `flop_hero` / `turn_hero` | Prepara `upgradesStreet` via `enumerarUpgrades` | Prepara `DescontoStreet` via `avaliarDescontoStreet` (oculto) |
| Enunciado 5.4 | Quais mãos você ainda não tem, mas ainda pode formar? | **Quais mãos melhoram o seu jogo com chance de ganhar o pote?** |
| Skip | Não há upgrade possível. | **Não há mão que vire o pote.** |
| Após acerto 5.4 | Abre a próxima street | Abre a §5.8 da **mesma** street |
| Após skip | Próxima street | Próxima street; **0** §5.8 |
| `flop_outs` / `turn_outs` | Não existia | **Novo** — seleção única |
| `flop_ranks` / `turn_ranks` | Não existia | **Novo** — 13 rótulos, múltipla |
| `flop_odds` / `turn_odds` | Não existia | **Novo** — 6 razões X:1 |
| Linha de suposição | Não existia | RN-059 na 5.4; MAY permanecer só leitura na 5.8 |
| `river_*` | 006 | **Inalterado** — 0 upgrade/outs/odd |

Copy de feedback, Confirmar, morta, G008, beat (≤1 s / 0 se movimento reduzido), fail-open: **iguais** à 003.

---

## 2. Copy canônica (`quiz.js` `COPY`)

| Chave | Texto |
|-------|-------|
| `enunciadoUpgrades` | Quais mãos melhoram o seu jogo com chance de ganhar o pote? |
| `semUpgrade` | Não há mão que vire o pote. |
| `enunciadoOuts` | Quantas outs você tem? |
| `enunciadoRanks` | Quais ranks são outs? |
| `enunciadoOdd` | Qual é a sua odd? |
| `acerto` / `erro` | Você acertou / Não é essa. Tente de novo. |
| `ctaConfirmar` / `ctaContinuar` | Confirmar / Continuar |
| `linhaErroEnumeracao` | Não foi possível continuar esta mão. Tente de novo. |

Linhas RN-059 (quiz mapeia `linhaId`):

| `linhaId` | Texto |
|-----------|-------|
| `par_mais_alto` | Suponha que o adversário já tem o par mais alto da mesa. |
| `trinca_do_par` | Suponha que o adversário já tem trinca do par da mesa. |
| `straight` | Suponha que o adversário já tem Straight. |
| `flush` | Suponha que o adversário já tem Flush. |
| `rotulo` | Suponha que o adversário já tem {rótulo RN-014}. |

MUST NOT: “Pot Odds”, “regra do 4”, “flush draw”, “gutshot”, “overcards”, kickers por extenso, “Não há upgrade possível.”, “Embaralhar”, “marcar todas”.

---

## 3. Extração e preparo no pouso

A partir de `sessao.mao.cartasJogo` (RN-044):

| Street | Hole | Comunitárias |
|--------|------|----------------|
| flop | `[4],[5]` | `[6],[7],[8]` |
| turn | `[4],[5]` | `[6],[7],[8],[9]` |

MUST NOT passar `[0]..[3]`, `[10]` no flop, nem burns. MUST NOT passar o snapshot do flop ao preparar o turn.

Fluxo ao `apresentarPergunta(flop_hero|turn_hero)` (depois de montar a 5.3):

1. `resultado = avaliarDescontoStreet({ holeHeroi, comunitarias })`.
2. Se `ok`: guardar em `sessao.mao.descontoStreet` (ou evoluir `upgradesStreet`) o snapshot: `lista`, `conjunto`, `vilao` (só o necessário à linha), `outs`/`n`/`ranks`/`odd` e conjuntos de opções. MUST NOT colocar cartas do vilão no HUD.
3. Se `!ok`: `{ ok: false }`. MUST NOT abrir skip. Abortar no pouso **ou** no beat da 5.3 — ambos legais; o HUD MUST NOT mostrar 5.4/5.8.
4. MUST NOT copiar vilão/outs/N/razão/snapshot para `storage`.
5. MUST NOT apresentar 5.4, skip ou 5.8 neste instante.

`mesa.js` lê só a decisão do quiz (`decidirPosMaoAtual` → `'pergunta' | 'skip' | 'falha' | 'pendente'` e, após a 5.4, os passos da 5.8). MUST NOT importar `motor.js`.

---

## 4. Cadência após beats

Estende [hud-cadencia.md da 003](../../003-feedback-persistencia/contracts/hud-cadencia.md). **Substitui** a tabela da 005 (onde acerto da 5.4 abria a street).

| Passo acertado | Próximo |
|----------------|---------|
| `flop_hero` | 5.4 ou skip do flop |
| `flop_upgrade` | `flop_outs` |
| `flop_outs` | `flop_ranks` |
| `flop_ranks` | `flop_odds` |
| `flop_odds` | `deal` turn |
| `flop_skip` + `CONTINUAR` | `deal` turn |
| `turn_hero` | 5.4 ou skip do turn |
| `turn_upgrade` | `turn_outs` |
| `turn_outs` | `turn_ranks` |
| `turn_ranks` | `turn_odds` |
| `turn_odds` | `deal` river |
| `turn_skip` + `CONTINUAR` | `deal` river |
| `river_*` | inalterado (006) |

### 4.1 Decisão após a 5.3

| Estado | HUD | CTA |
|--------|-----|-----|
| `ok === false` | `ociosa`; linha de erro de enumeração | **Nova mão** |
| `ok` e lista vazia | `sem_upgrade`; frase nova | **Continuar** |
| `ok` e lista ≥ 1 | `perguntando`; enunciado 5.4; linha RN-059; 6 opções; modo `multipla` | **Confirmar** |
| ainda `pendente` | permanece no acerto da 5.3 ≤ **1 s**; depois disso = falha | nenhum spinner |

### 4.2 Após acerto da 5.4 (lista não vazia)

Se N/ranks/X já prontos: abrir `*_outs` na hora. Senão: permanecer no acerto ≤ **1 s**; depois = falha (`ociosa`). MUST NOT inventar N = 0. MUST NOT abrir a próxima street.

### 4.3 Uma pergunta por vez (RN-G001)

Cada passo da 5.8 **substitui** enunciado e opções. O inteiro N MUST NOT permanecer como chip, dica ou segunda pergunta. A linha de suposição MAY permanecer só leitura e MUST NOT contar como pergunta.

---

## 5. Modos e teclado

| Passo | Modo | Submete | Foco inicial |
|-------|------|---------|--------------|
| `*_upgrade` | múltipla | só **Confirmar** | primeira opção visual |
| `*_outs` | única | clique / Enter / Espaço na opção | (reuso 003) |
| `*_ranks` | múltipla | só **Confirmar** | primeira opção visual |
| `*_odds` | única | clique / Enter / Espaço na opção | (reuso 003) |
| skip | — | **Continuar** | CTA |

Tab percorre só opções ainda ativáveis e em seguida **Confirmar** (quando houver). Enter/Espaço na opção da 5.4/ranks **liga/desliga** (não submete). Sem controle “marcar todas”.

---

## 6. Montagem das opções

### 6.1 5.4

Reuso `criarOpcoesUpgrade` + `conjuntoOpcoesUpgrade`. Rótulos RN-014. Hint “Pode ser mais de uma.” permitido. 1ª Confirmar → deltas `upgrade` só das **exibidas** (RN-024). Retry RN-025. G008 ao apresentar; retry não reembaralha.

### 6.2 Quantidade

6 botões com rótulo do inteiro. `verdadeira` só o N. Clique submete. 1ª tentativa → `{ bucket: 'outs', acertos|erros: 1 }`.

### 6.3 Ranks

13 botões, rótulos RN-064, ordem visual embaralhada. Faixa compacta (2–3 linhas); MUST NOT forçar 2×3; MUST NOT cobrir comunitárias, hole do herói nem assentos em nenhum viewport. 1ª Confirmar avalia o **conjunto** das 13 → um delta `outs` (acerto se perfeito; senão erro). Sem acerto por rank. Retry: distratoras marcadas morrem; verdadeiros omitidos continuam selecionáveis.

### 6.4 Odd

6 botões com rótulo `X:1`. Clique submete. 1ª tentativa → `{ bucket: 'odds', acertos|erros: 1 }`. `outs` MUST NOT mudar por causa da odd.

---

## 7. Assentos e feltro

Enquanto 5.4 ou 5.8 estiver aberta: Adversário A e Adversário B **fechados**. As 2 assumidas MUST NOT aparecer como hole cards. Cartas hipotéticas MUST NOT virar no feltro. As 11 de jogo e burns permanecem onde estão.

Showdown: hole **reais**; highlight da 006 inalterado.

---

## 8. Persistência (único escritor = quiz)

| Evento | Deltas |
|--------|--------|
| 1ª Confirmar 5.4 | células `upgrade` das exibidas (RN-024) |
| Skip | nenhum |
| 1ª tentativa quantidade | `outs` ±1 |
| 1ª Confirmar ranks | `outs` ±1 (conjunto) |
| 1ª tentativa odd | `odds` ±1 |
| 2ª+ tentativa de qualquer uma | nenhum |
| Flop e turn da mesma mão | exposições **independentes** (CA-048) |

MUST NOT gravar N, ranks, razão, vilão, cartas ou snapshot. Storage fail-open: quiz segue; sem `alert` / jargão.

---

## 9. Layout

- Quantidade e odd: grade de 6 já vigente.
- Ranks: `css/hud.css` — faixa que quebra; no estreito o HUD já empilha abaixo da mesa.
- Cinco estados do HUD **não** aumentam.
- Linha de suposição: texto só leitura no HUD (`data` ou parágrafo); não é opção.

---

## 10. Casos de contrato (automatizáveis)

1. Enunciado 5.4 e skip são os canônicos novos; a frase/enunciado da 005 **não** aparecem.
2. Após `flop_hero` acertado + lista ≥ 1: HUD `perguntando` 5.4; turn **não** abriu.
3. Após `flop_upgrade` acertado: passo `flop_outs`; turn **não** abriu; N não fica como chip depois de abrir ranks.
4. Após skip: 0 passos `*_outs`/`*_ranks`/`*_odds`; `outs`/`odds` inalterados.
5. River: `modoDoPasso` / `enunciadoDoPasso` não devolvem 5.4/5.8.
6. CA-037: Flush verdadeiro + Par distratora marcados na 1ª Confirmar → Flush +1 acerto, Par +1 erro, Par morta, pergunta aberta.
7. CA-038: A/B fechados; 0 assumidas no DOM de hole.
8. CA-046: erro na 1ª quantidade + acerto depois → `outs.erros += 1`, `outs.acertos` inalterado nessa exposição; 1ª Confirmar ranks é outra exposição; odd só `odds`.
9. Dez perguntas novas (qualquer tipo desta feature): o conjunto obrigatório **não** ocupa a mesma ordem visual em todas; retry da mesma pergunta mantém a ordem.
10. `mesa.js` source MUST NOT conter `import` de `motor.js` nem `localStorage`.
11. Foco: ao abrir 5.4 e ranks, a primeira opção visual recebe o foco.
12. Confirmar ranks vazio na 1ª vez → +1 erro `outs`; pergunta aberta.
13. Falha `ok: false` → `ociosa` + Nova mão; 0 skip falso.
14. Turn da mesma mão com 5.4 não vazia: deltas **não** fundem com o flop.
