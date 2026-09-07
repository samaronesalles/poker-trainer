# Feature Specification: Identificação de mãos ainda possíveis (flop e turn)

**Feature Branch**: `005-maos-ainda-possiveis`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "Implementar no flop e no turn, só após a 5.3 acertada, a múltipla seleção de upgrades: categoria C possível se existe runout no information set do herói (47 no flop, 46 no turn) cuja melhor mão é exatamente C e C é estritamente mais forte; 1–5 upgrades + distratoras até 6, ou os 6 mais fortes sem distratora; upgrades que não couberam não são cobrados; skip + Continuar se lista vazia; estatística RN-024 na primeira Confirmar — conforme PRD §5.4 (RN-020, RN-021, RN-022, RN-023, RN-024, RN-025, RN-026, RN-027, CA-014, CA-015, CA-016, CA-017)"

## User Scenarios & Testing *(mandatory)*

Esta feature substitui o **stub** de upgrades (Flush verdadeiro no flop; skip forçado no turn). O casco (001), o baralho honesto (002), o contrato de quiz (003) e o avaliador da mão atual (004) já existem. O valor é o treinando passar a marcar, no ponto de vista do herói, **quais categorias mais fortes ainda podem ser a melhor mão** com as cartas que faltam — sem draws nomeados, sem kickers no texto e sem pergunta no river (não resta carta).

### User Story 1 - Marcar upgrades reais no flop (Priority: P1)

O flop pousa. O treinando acerta **“Qual mão você tem agora?”**. Só então o HUD pergunta **“Quais mãos você ainda não tem, mas ainda pode formar?”** em múltipla seleção. As opções deixam de ser o stub (Flush sempre verdadeiro). Uma categoria C só entra como upgrade se, com as cartas que o herói **não vê**, ainda existir pelo menos um desfecho legal cuja **melhor** mão seja **exatamente C** e C seja **estritamente mais forte** do que a mão atual. Ele marca e aperta **Confirmar**. Se a lista de upgrades for vazia, não há grade: o HUD mostra **“Não há upgrade possível.”** e **Continuar**. O turn **não** abre enquanto esta street não terminar.

**Why this priority**: É o objetivo do §5.4 no flop e o que substitui o stub da 003. Sem isto o flop continua cobrando um Flush inventado.

**Independent Test**: Depois de acertar a mão atual num flop em carta alta com upgrades reais, a grade **não** é o conjunto stub Flush-verdadeiro; Flush só aparece como upgrade se algum desfecho tiver melhor mão exatamente Flush. Acerto do conjunto (ou skip) permanece na street — o turn ainda não abre.

**Acceptance Scenarios**:

1. **Given** o flop pousado e a mão atual do herói **ainda não** acertada, **When** o treinando olha o HUD, **Then** **não** há pergunta de upgrades, **não** há **Confirmar** de upgrades e **não** há skip de upgrade (RN-G002).
2. **Given** a mão atual do flop **acertada** e o beat encerrado, **When** a lista de upgrades (RN-020) **não** é vazia, **Then** o HUD entra em `perguntando` com o enunciado exatamente **“Quais mãos você ainda não tem, mas ainda pode formar?”**, múltipla seleção, CTA **Confirmar**, e marcar/desmarcar **não** submete (RN-047, CA-012).
3. **Given** essa pergunta aberta, **When** o treinando compara as opções com o stub antigo, **Then** **Flush** **não** é upgrade só por ser o stub: só é upgrade se existir desfecho legal cuja melhor mão seja **exatamente Flush** e Flush seja mais forte que a atual (RN-020).
4. **Given** o conjunto das opções **exibidas** correto, **When** o treinando aciona **Confirmar**, **Then** o HUD diz **“Você acertou”** e, após o beat, a street termina — **não** abre o turn ainda.
5. **Given** a lista de upgrades vazia no flop, **When** seria a pergunta 5.4, **Then** o HUD vai a `sem_upgrade` com **“Não há upgrade possível.”** + **Continuar**; nenhum contador `upgrade` muda; **Continuar** permite o turn (CA-017 no caso royal; idem para qualquer lista vazia).
6. **Given** o flop ainda voando, **When** o treinando procura a pergunta de upgrades, **Then** o HUD permanece em `deal` sem opções.

---

### User Story 2 - Marcar upgrades reais no turn (Priority: P1)

O turn pousa. O herói vê 6 cartas. Depois de acertar de novo a mão atual, a mesa **deixa** o skip forçado da 003 e aplica a **mesma** regra de upgrades com o information set do turn (46 cartas que o herói não vê; cada uma como river). O que ainda era possível no flop pode ter morrido. Se ainda houver upgrade, múltipla seleção + **Confirmar**. Se a lista for vazia, skip + **Continuar**. O river **não** abre enquanto esta street não terminar. **Não** há pergunta de upgrade no river.

**Why this priority**: O turn é a outra street do §5.4. Sem isto o treinando nunca pratica “ainda possível” com uma carta a menos.

**Independent Test**: Num turn com exatamente 2 upgrades, a grade tem esses 2 mais 4 distratoras (CA-015). Num turn sem upgrade (ex.: herói já com royal), só skip + **Continuar**, sem grade. O river não abre no acerto da mão atual.

**Acceptance Scenarios**:

1. **Given** o turn pousado e a mão atual do turn **ainda não** acertada, **When** o treinando olha o HUD, **Then** **não** há pergunta de upgrades nem skip de upgrade desta street.
2. **Given** a mão atual do turn acertada e o beat encerrado, **When** a lista RN-020 do turn tem upgrades, **Then** o HUD pergunta **“Quais mãos você ainda não tem, mas ainda pode formar?”** em múltipla seleção com **Confirmar** — **não** cai no skip forçado do stub (RN-020, RN-047).
3. **Given** um turn com **exatamente 2** upgrades, **When** o quiz abre, **Then** esses 2 estão nas opções e há **4** distratoras (total 6) (CA-015, RN-023).
4. **Given** o conjunto exibido correto no turn, **When** o treinando confirma, **Then** após o beat a street termina e o river pode abrir — **não** há segunda pergunta de upgrade nesta street e **não** há 5.4 no river.
5. **Given** lista vazia no turn (herói já com royal, ou nenhuma categoria mais forte atingível), **When** seria a 5.4, **Then** há mensagem + **Continuar**; nenhum contador `upgrade` muda; **não** há múltipla seleção (CA-017 aplicado ao turn).
6. **Given** o turn ainda não pousou, **When** o treinando espera o quiz de upgrades, **Then** o HUD não o apresenta.

---

### User Story 3 - Ver até 6 opções: todos os upgrades cabíveis ou os 6 mais fortes (Priority: P1)

Cada pergunta de upgrades tenta **sempre 6** rótulos canônicos, salvo o skip de lista vazia. Com 1 a 5 upgrades, a grade mostra **todos** eles e completa com distratoras (categorias que **não** são upgrade nesta street) até 6. Com 6 ou mais, mostra **só os 6 mais fortes** na tabela oficial, **sem** distratora; o treinando deve marcar as 6. Upgrades que **não couberam** não aparecem, **não** são cobrados e **não** geram estatística nesta pergunta. A ordem dos botões muda a cada pergunta nova; depois de um erro, os botões **não** trocam de lugar.

**Why this priority**: RN-023, RN-027 e CA-014/015. Sem teto de 6 o HUD quebra; sem a regra dos 6 mais fortes o treinando seria cobrado por categorias que a tela omitiu.

**Independent Test**: Flop em carta alta com 7 ou mais upgrades: as opções são exatamente as 6 mais fortes (no extremo: Royal flush, Straight flush, Quadra, Full house, Flush, Straight), todas obrigatórias, zero distratora; Par / Dois pares / Trinca não aparecem mesmo que também sejam possíveis (CA-014).

**Acceptance Scenarios**:

1. **Given** 1 a 5 upgrades nesta street, **When** o quiz abre, **Then** todos esses upgrades estão nas opções e o total visível é **6** (upgrades + distratoras) (RN-023, RN-027).
2. **Given** 6 ou mais upgrades nesta street, **When** o quiz abre, **Then** as opções são **exatamente os 6 mais fortes** na tabela canônica, **não** há distratora, e as 6 devem ser marcadas (RN-023).
3. **Given** um flop em **Carta alta** com **7 ou mais** upgrades, **When** o quiz abre, **Then** as opções são **Royal flush**, **Straight flush**, **Quadra**, **Full house**, **Flush**, **Straight** (no extremo desse recorte), todas devem ser marcadas, **não** há distratora, e **Par** / **Dois pares** / **Trinca** **não** aparecem mesmo que também sejam possíveis (CA-014).
4. **Given** upgrades mais fracos que não couberam nos 6, **When** se lê a memória após a primeira **Confirmar**, **Then** essas categorias **não** recebem acerto, erro nem exposição nesta pergunta (RN-023).
5. **Given** a mesma street com as mesmas cartas visíveis ao herói, **When** se monta o conjunto de opções (ignorando a ordem dos botões), **Then** o conjunto é o mesmo — a montagem é determinística.
6. **Given** dez perguntas **novas** de upgrades (flop ou turn), **When** se observa a posição dos rótulos, **Then** o conjunto obrigatório **não** ocupa a mesma ordem visual em todas; após um erro na **mesma** pergunta, a ordem **não** muda (RN-G008).
7. **Given** lista vazia, **When** o HUD reage, **Then** **não** se forçam 6 opções: há só a frase de skip + **Continuar** (RN-027).

---

### User Story 4 - Confirmar uma vez para a memória; corrigir o conjunto sem spoiler (Priority: P2)

O treinando marca **Flush** (upgrade verdadeiro) e **Par** (distratora) e aperta **Confirmar**. Flush ganha acerto; Par ganha erro de falso positivo; Par morre no lugar; Flush trava (não desmarcar). A pergunta **não** fecha. Ele corrige até o conjunto **exibido** estar perfeito. A segunda **Confirmar** **não** muda os contadores. Confirmar vazio quando há upgrade nas opções cobra erro de omissão em cada upgrade omitido, só na primeira vez. Distratora **não** marcada **não** incrementa.

**Why this priority**: RN-024, RN-025, RN-026 e CA-016. O contrato de retry já existe (003); aqui o que muda é a **lista verdadeira** alimentar o mesmo bucket `upgrade`.

**Independent Test**: Montar (ou encontrar) uma street com Flush verdadeiro e Par distratora; marcar os dois na 1ª **Confirmar**; ler a memória: Flush +1 acerto, Par +1 erro; Par desabilitada; pergunta aberta até o conjunto estar correto (CA-016).

**Acceptance Scenarios**:

1. **Given** Flush verdadeiro e Par como distratora na 1ª confirmação, **When** o treinando marca os dois e confirma, **Then** Flush recebe acerto, Par recebe erro de falso positivo, Par desabilita, Flush trava, e a pergunta **não** fecha até o conjunto estar correto (CA-016, RN-024, RN-025).
2. **Given** upgrade verdadeiro nas opções e **Confirmar** sem marcar nada, **When** é a primeira confirmação, **Then** cada upgrade omitido **exibido** recebe +1 erro; o HUD pede de novo; os omitidos continuam selecionáveis.
3. **Given** distratora **não** marcada na 1ª **Confirmar**, **When** se lê a memória, **Then** essa categoria **não** incrementa (nem acerto nem erro) (RN-024).
4. **Given** já houve a 1ª **Confirmar**, **When** o treinando confirma de novo, **Then** os contadores `upgrade` **não** mudam (RN-026).
5. **Given** já houve a 1ª **Confirmar**, **When** restam distratoras que **não** tinham sido marcadas, **Then** elas continuam selecionáveis (matá-las revelaria que são distratoras); marcá-las depois as elimina sem alterar contadores (RN-025).
6. **Given** a pergunta em curso, **When** o treinando procura “pular” ou “mostrar quais faltam”, **Then** isso **não** existe; o conjunto certo só fica visivelmente completo quando ele o acerta (RN-G005).
7. **Given** o flop e o turn da **mesma** mão, ambos com lista não vazia, **When** se lêem as 1ªs **Confirmar**, **Then** são duas exposições independentes em `upgrade` — MUST NOT fundir os deltas.

---

### User Story 5 - Entender “exatamente C” e o que o herói não vê (Priority: P2)

O treinando aprende dois cortes que o stub escondia. Primeiro: **melhor** mão **exatamente** C — um desfecho em que a melhor 5 é Royal flush **não** torna Flush (nem Straight flush) um upgrade. Segundo: o herói só “não vê” o que ainda não está aberto **para ele** (as comunitárias já pousadas e as duas hole dele saem do conjunto desconhecido). As hole dos adversários **continuam** no desconhecido: o herói não as vê. Melhorar **dentro** da mesma categoria (par fraco → par forte) **não** é upgrade. **Carta alta** nunca é upgrade. Categoria igual ou mais fraca que a atual nunca é upgrade. Nenhum texto fala em draw, gutshot, flush draw ou outs nomeados.

**Why this priority**: RN-020, RN-021, RN-022, RN-027 e RN-046. É o que separa treino de leitura de uma lista de “qualquer coisa que contenha flush”.

**Independent Test**: Caso em que os únicos desfechos “de flush” são na verdade royal: Flush **não** entra como upgrade. Caso em que o herói tem trinca: Par **não** é upgrade. UI sem as palavras de draw da lista excluída do produto.

**Acceptance Scenarios**:

1. **Given** os únicos desfechos que completam cinco do mesmo naipe têm melhor mão **Royal flush**, **When** se monta a lista de upgrades, **Then** **Flush** e **Straight flush** **não** são upgrades por esses desfechos; só **Royal flush** é, se for mais forte que a atual (RN-020).
2. **Given** o herói já tem **Trinca**, **When** se monta a lista, **Then** **Trinca**, **Dois pares**, **Par** e **Carta alta** **não** são upgrades (RN-021, RN-022).
3. **Given** o herói tem par de dois e ainda pode ter par de Ás no runout, **When** se avalia upgrade, **Then** **Par** **não** entra — força dentro da categoria não conta (RN-046).
4. **Given** as hole cards dos adversários, **When** se define o conjunto desconhecido do herói, **Then** essas cartas **não** são removidas: o herói não as vê (RN-020).
5. **Given** burns cênicos, se existirem, **When** se conta o desconhecido, **Then** eles **não** retiram carta do information set (as 11 de jogo continuam a base; burn não consome).
6. **Given** enunciado, opções e feedback desta pergunta, **When** se lê o texto, **Then** **não** há “draw”, “gutshot”, “flush draw”, “straight draw”, “oesd”, “outs” nomeados nem sinônimo de draw (RN-027).
7. **Given** **Carta alta** como categoria, **When** se classifica upgrade, **Then** ela **nunca** é upgrade; MAY aparecer só como distratora (RN-022).

---

### User Story 6 - Pular a grade quando não há upgrade (Priority: P2)

Às vezes não resta categoria mais forte atingível — o caso extremo é o herói já com **Royal flush** no flop. O HUD **não** inventa 6 botões. Mostra a frase única e **Continuar**. Nenhum contador `upgrade` muda. O treinando segue a cadência sem ser cobrado por uma pergunta vazia.

**Why this priority**: CA-017 e o ramo `sem_upgrade` do casco. Sem isto a mesa mentiria com uma grade sem upgrade verdadeiro.

**Independent Test**: Herói com royal no flop, após acertar a mão atual: sem múltipla seleção; mensagem + **Continuar**; `upgrade` inalterado (CA-017).

**Acceptance Scenarios**:

1. **Given** herói com royal no flop e a 5.3 acertada, **When** seria a 5.4, **Then** **não** há múltipla seleção; há **“Não há upgrade possível.”** + **Continuar**; nenhum contador `upgrade` muda (CA-017).
2. **Given** qualquer outra lista RN-020 vazia (flop ou turn), **When** o HUD reage, **Then** o mesmo skip ocorre — sem estatística de categoria.
3. **Given** `sem_upgrade`, **When** o treinando aciona **Continuar**, **Then** a próxima street pode abrir e os contadores `upgrade` permanecem iguais.
4. **Given** lista **não** vazia, **When** o HUD reage, **Then** MUST NOT usar o skip — a grade de até 6 opções é obrigatória.

---

### Edge Cases

- Só depois da 5.3 **da mesma street** acertada. MUST NOT empilhar mão atual e upgrades (RN-G001). MUST NOT abrir a próxima street antes de upgrades ou skip (RN-G002).
- River: **não** há 5.4. Não resta carta; a cadência segue para o showdown (feature 006). MUST NOT perguntar upgrades após a quinta comunitária.
- Preflop: **não** há quiz (já excluído).
- Information set do flop: 52 − 2 hole do herói − 3 comunitárias = **47** desconhecidas. Runout = todos os pares de cartas distintas entre essas 47 (turn e river hipotéticos).
- Information set do turn: 52 − 2 hole do herói − 4 comunitárias = **46** desconhecidas. Runout = cada uma das 46 como river.
- Hole dos adversários **não** saem do desconhecido. Burns cênicos **não** consomem carta do conjunto.
- Depois do runout o herói tem 7 cartas visíveis no critério de avaliação (2 hole + 5 comunitárias do desfecho). A categoria do desfecho é a da **melhor 5** entre essas 7 — o mesmo critério da 004 (wheel legal, wrap ilegal, royal ≠ straight flush).
- “Exatamente C”: se a melhor 5 do desfecho é Royal flush, esse desfecho **não** testemunha Flush nem Straight flush.
- Categoria atual e todas as mais fracas: nunca upgrade. **Carta alta** nunca upgrade.
- Par fraco → par forte, flush baixo → flush alto: nunca upgrade (RN-046).
- Com 0 upgrades: skip; 0 opções; 0 estatística `upgrade`.
- Com 1–5 upgrades: todos + distratoras até 6. Distratoras = categorias que **não** são upgrade **nesta** street (incluindo a atual, as mais fracas, **Carta alta**, e as mais fortes **inatingíveis**). Preenchimento das distratoras: da mais forte para a mais fraca na tabela canônica, sem repetir, até completar 6. Sempre há vagas suficientes (há 10 categorias).
- Com 6 ou mais upgrades: só os 6 mais fortes; zero distratora; as que não couberam não são cobradas.
- Confirmar vazio com upgrade nas opções: erro de omissão na 1ª vez em cada upgrade **exibido** omitido; pede de novo.
- Marcar todas havendo distratora: cada distratora marcada recebe erro na 1ª vez; morre; pede correção; upgrades verdadeiros marcados travam.
- Segunda **Confirmar** e seguintes: não alteram `upgrade`.
- Flop e turn da mesma mão: duas 1ªs **Confirmar** independentes quando ambas têm lista não vazia. Skip numa street não cria exposição. Recarregar antes do turn preserva só o que já foi gravado no flop.
- Recarregar no meio da pergunta: a mão aborta (casco); contadores já gravados nesta visita permanecem (003). MUST NOT pedir dado pessoal para retomar.
- Armazenamento indisponível: o quiz e a enumeração seguem; a evolução MAY perder-se ao fechar (fail-open da 003).
- Clique em morta / fora das opções / Confirmar com opções já no estado de acerto: ignora ou não regrava.
- Preferência por reduzir movimento: o contrato de correção não depende de animação; o beat de acerto permanece o da 003 (≤1 s, 0 s se movimento reduzido). Skip continua exigindo **Continuar**.
- MUST NOT persistir cartas, runouts, information set, pool de cursor, enunciado, carimbo de data/hora ou identificador pessoal. Só os deltas de 1ª **Confirmar** no bucket `upgrade` das categorias **exibidas** e avaliadas.
- Showdown (mão do herói no river, A, B, vencedor): **não** muda nesta feature; permanece o contrato da 003/004 até a 006.
- A pergunta de mão atual (004) **não** é redesenhada. Esta feature só **consome** o acerto dela.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No flop, só depois de a identificação da mão atual dessa street estar acertada e o beat encerrado, a mesa MUST apresentar a pergunta de upgrades **ou** o skip `sem_upgrade`. MUST NOT abrir o turn ainda (RN-G002, CA-012).
- **FR-002**: No turn, só depois de a identificação da mão atual dessa street estar acertada e o beat encerrado, a mesa MUST apresentar a pergunta de upgrades **ou** o skip `sem_upgrade`. MUST NOT abrir o river ainda. MUST NOT existir pergunta de upgrades no river (não resta carta).
- **FR-003**: A lista de upgrades de uma street MUST ser o conjunto das categorias C tais que: (a) C é **estritamente mais forte** que a mão atual do herói nessa street, na tabela canônica; (b) C **não** é **Carta alta**; (c) existe pelo menos um **runout legal** no information set do herói cuja **melhor** mão de 5 cartas do herói, após o runout, tenha categoria **exatamente C** (RN-020, RN-021, RN-022).
- **FR-004**: O information set do herói MUST ser: baralho padrão menos as 2 hole do herói menos as comunitárias **já abertas**. No flop MUST haver **47** desconhecidas; no turn, **46**. As hole dos adversários MUST permanecer no desconhecido. Burns cênicos MUST NOT remover carta desse conjunto.
- **FR-005**: No flop, runout legal MUST ser todo par de cartas distintas entre as 47 (as duas cartas que faltam ao board). No turn, runout legal MUST ser cada uma das 46 como a quinta comunitária. Depois do runout, a categoria testemunhada MUST ser a da melhor 5 entre as 7 cartas do herói (2 hole + 5 comunitárias do desfecho), com wheel legal, wrap ilegal e royal distinta de straight flush — o mesmo critério já vigente da mão atual.
- **FR-006**: Um runout cuja melhor mão é uma categoria D MUST testemunhar **somente** D. MUST NOT contar esse runout como testemunha de categoria mais fraca “contida” (ex.: royal **não** testemunha Flush nem Straight flush).
- **FR-007**: Categoria igual à atual ou mais fraca MUST NOT ser upgrade. Melhorar só a força **dentro** da mesma categoria MUST NOT ser upgrade (RN-021, RN-046). **Carta alta** MUST NEVER ser upgrade (RN-022).
- **FR-008**: Se a lista de upgrades for vazia, o HUD MUST ir a `sem_upgrade` com a frase exatamente **“Não há upgrade possível.”** e o CTA **Continuar**. MUST NOT haver grade, **Confirmar** nem estatística de categoria. **Continuar** MUST avançar a street sem alterar `upgrade` (RN-020, CA-017).
- **FR-009**: Se a lista **não** for vazia, o HUD MUST perguntar exatamente **“Quais mãos você ainda não tem, mas ainda pode formar?”** em múltipla seleção com CTA **Confirmar**. Marcar ou desmarcar MUST NOT submeter. Só **Confirmar** avalia o conjunto das opções **exibidas** (RN-047).
- **FR-010**: A montagem das opções MUST ser (RN-023, RN-027):
  1. 1 a 5 upgrades: exibir **todos** + distratoras até o total 6;
  2. 6 ou mais upgrades: exibir **só os 6 mais fortes** na tabela canônica, **sem** distratoras; o conjunto correto são essas 6;
  3. upgrades que não couberam nos 6 MUST NOT aparecer, MUST NOT ser cobrados e MUST NOT gerar estatística nesta pergunta.
  MUST NOT haver menos de 6 opções quando a lista não é vazia. MUST NOT haver skip quando a lista não é vazia.
- **FR-011**: Distratora MUST ser uma categoria canônica que **não** é upgrade **nesta** street. Com 1 a 5 upgrades, as vagas restantes MUST ser preenchidas da mais forte para a mais fraca na tabela canônica, sem repetir a que já está na grade. O conjunto (sem a ordem visual) MUST ser determinístico para o mesmo information set e a mesma mão atual.
- **FR-012**: As categorias oficiais, **rótulo exato na UI**, da mais forte para a mais fraca, MUST ser exatamente: **Royal flush**, **Straight flush**, **Quadra**, **Full house**, **Flush**, **Straight**, **Trinca**, **Dois pares**, **Par**, **Carta alta**. MUST NOT exibir sinônimos, kicker, naipe por extenso, rank da mão nem vocabulário de draws (gutshot, flush draw, straight draw, oesd, outs nomeados, “draw de …”) (RN-014, RN-016, RN-027, RN-G004).
- **FR-013**: A ordem **visual** das opções MUST ser embaralhada ao **apresentar** cada pergunta nova. O conjunto obrigatório MUST NOT ficar sempre na mesma ordem de botões. MUST NOT reembaralhar após erro na mesma pergunta. MUST NOT reembaralhar o baralho da mão ao embaralhar opções (RN-G008).
- **FR-014**: Na **primeira Confirmar**, cada opção **exibida** MUST ser avaliada no bucket `upgrade` assim (RN-024): upgrade verdadeiro marcado → +1 acerto nessa categoria; upgrade verdadeiro não marcado → +1 erro nessa categoria; distratora marcada (falso positivo) → +1 erro nessa categoria; distratora não marcada → não incrementa. A gravação MUST ser imediata, ainda nesta pergunta.
- **FR-015**: Depois da 1ª **Confirmar**: distratoras marcadas MUST desabilitar (visíveis, mortas); distratoras não marcadas MUST permanecer selecionáveis; upgrades já marcados corretamente MUST travar (não desmarcar); upgrades verdadeiros ainda não marcados MUST permanecer selecionáveis. Novas **Confirmar** até o conjunto exibido estar perfeito MUST NOT alterar os contadores da 1ª vez (RN-025, RN-026).
- **FR-016**: Feedback, retry, opção morta, marca de acerto, beat de acerto (≤1 s, 0 s se movimento reduzido), teclado (Tab só no ativável; Enter/Espaço) e fail-open de persistência MUST reusar o contrato já vigente da 003. Textos canônicos: acerto **“Você acertou”**; erro **“Não é essa. Tente de novo.”**. MUST NOT haver `alert()`, pular pergunta nem revelar o conjunto certo antes do acerto (RN-034, RN-035, RN-G005).
- **FR-017**: O flop e o turn da **mesma** mão MUST ser exposições independentes em `upgrade` quando ambos tiverem lista não vazia. MUST NOT omitir a pergunta do turn só porque a lista do flop foi cobrada. MUST NOT fundir os dois deltas. Skip numa street MUST NOT criar exposição.
- **FR-018**: MUST haver no máximo uma pergunta por vez no HUD (RN-G001). MUST NOT avançar de street enquanto a 5.3 e a 5.4 (ou skip) dessa street não estiverem concluídas (RN-G002).
- **FR-019**: MUST NOT persistir cartas, runouts, information set, pool de cursor, enunciado, opções, carimbo de data/hora, identificador de sessão ou qualquer dado pessoal. O único efeito persistido desta pergunta MUST ser o delta de 1ª **Confirmar** em `upgrade` das categorias **exibidas** e avaliadas, no mesmo bloco de evolução já definido (sem novos buckets, sem relatório, sem botão zerar).
- **FR-020**: MUST NOT introduzir apostas, quiz preflop, desistir da mão, mute na UI, cadastro, login, multiplayer, relatório visual, botão zerar, draws nomeados, nem alterar apelidos (**Você**, **Adversário A**, **Adversário B**) ou a honestidade do baralho.
- **FR-021**: Se a memória de treino falhar, a enumeração e o quiz MUST continuar; a evolução MAY perder-se ao fechar. MUST NOT haver `alert()` nem jargão que bloqueie o HUD.
- **FR-022**: Esta feature MUST substituir o stub de upgrades da 003 (Flush verdadeiro no flop; skip forçado no turn). MUST NOT redesenhar a identificação da mão atual (004) nem o showdown (006). MUST NOT alterar `mao_atual` nem `vencedor_pote` por causa desta pergunta.
- **FR-023**: Toda interface visível desta pergunta (enunciado, 10 rótulos, skip, **Confirmar**, **Continuar**, feedback herdado) MUST estar em português brasileiro, com termos de clube flop/turn/river permitidos.

### Key Entities

- **Information set do herói**: cartas que o herói **não** vê nesta street. Flop: 47. Turn: 46. Inclui as hole dos adversários. Não inclui as 2 hole do herói nem as comunitárias já abertas. Burns cênicos não retiram carta daqui.
- **Runout legal**: no flop, um par de desconhecidas que completaria o board; no turn, uma desconhecida como river. Cada runout produz uma melhor 5 do herói.
- **Upgrade de categoria**: rótulo canônico estritamente mais forte que a mão atual, que não é **Carta alta**, e para o qual existe pelo menos um runout cuja melhor mão é **exatamente** esse rótulo.
- **Lista de upgrades**: o conjunto RN-020 da street, **antes** do teto de 6. Pode ser vazia.
- **Conjunto de opções exibidas**: até 6 rótulos visíveis. Ou todos os upgrades + distratoras até 6, ou os 6 upgrades mais fortes. É o único conjunto cobrado.
- **Distratora**: rótulo canônico exibido que **não** é upgrade nesta street. Só existe quando há 1 a 5 upgrades.
- **Pergunta de upgrades**: exposição de múltipla seleção no HUD, enunciado **“Quais mãos você ainda não tem, mas ainda pode formar?”**, CTA **Confirmar**. Ocorre só no flop e no turn, só após a 5.3 da street.
- **Skip `sem_upgrade`**: estado do HUD quando a lista é vazia. Frase **“Não há upgrade possível.”** + **Continuar**. Não é pergunta; não gera estatística.
- **Primeira Confirmar**: a primeira submissão do conjunto nesta pergunta; único evento que altera `upgrade` das opções exibidas (contrato da 003).

### Fora de escopo (esta feature)

- Casco da mesa, estados do HUD, deal, burns cênicos, áudio (features 001–002).
- Contrato de retry, feedback, ordem visual, persistência dos três buckets e CTAs **Confirmar** / **Continuar** (feature 003) — esta feature **consome** esse contrato e só troca a **correção** e o **conjunto** da pergunta de upgrades no flop e no turn.
- Identificação da mão atual do herói no flop/turn (feature 004) — já autoritativa; esta feature só começa depois do acerto.
- River: virada de A e B, mão do herói no showdown, mãos dos adversários, vencedor do pote (feature 006 / §5.5).
- Tela de relatório, botão zerar, apostas, quiz preflop, login, multiplayer, draws nomeados, outras variantes.
- Ensinar estratégia, odds percentuais ou nomes de projeto de mão (gutshot, flush draw, etc.).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos flops em **Carta alta** com 7 ou mais upgrades, as opções são exatamente as 6 categorias mais fortes da tabela, todas obrigatórias, 0 distratoras, e **Par** / **Dois pares** / **Trinca** não aparecem mesmo que também sejam possíveis (CA-014).
- **SC-002**: Em 100% dos turns com exatamente 2 upgrades, a grade tem esses 2 + 4 distratoras (total 6) (CA-015).
- **SC-003**: Dado Flush verdadeiro e Par distratora na 1ª **Confirmar** com os dois marcados, em 100% dos casos Flush em `upgrade` tem +1 acerto, Par tem +1 erro, Par desabilita e a pergunta permanece aberta até o conjunto estar correto (CA-016).
- **SC-004**: Dado herói com royal no flop após a 5.3, em 100% dos casos **não** há múltipla seleção, há mensagem + **Continuar**, e 0 contadores `upgrade` mudam (CA-017).
- **SC-005**: Em 100% das listas RN-020 vazias (flop ou turn), o HUD usa o skip e 0 vezes apresenta 6 opções inventadas.
- **SC-006**: Em 100% das primeiras **Confirmar** com upgrade omitido nas opções exibidas, cada omitido recebe +1 erro; em 100% das **Confirmar** seguintes, `upgrade` não muda (RN-024, RN-026).
- **SC-007**: Em 100% das distratoras **não** marcadas na 1ª **Confirmar**, a categoria fica com 0 incremento nessa exposição (RN-024).
- **SC-008**: Em 100% dos upgrades que não couberam nos 6, essa pergunta gera 0 acerto, 0 erro e 0 exposição nessas categorias (RN-023).
- **SC-009**: Em 100% dos runouts cuja melhor mão é **Royal flush**, esse desfecho **não** faz **Flush** nem **Straight flush** entrar como upgrade só por “conter” o naipe.
- **SC-010**: Em 100% das UIs desta pergunta (enunciado, opções, skip, feedback), há 0 ocorrências de vocabulário de draws (gutshot, flush draw, straight draw, oesd, outs nomeados) e 0 kickers / “par de ases” (RN-027, RN-016).
- **SC-011**: Em 100% das mãos, o river apresenta 0 perguntas de upgrades.
- **SC-012**: Em 100% dos acertos da 5.3 no flop, a mesa segue para upgrades ou skip da **mesma** street; 0 desses acertos abrem o turn ainda.
- **SC-013**: Em 100% das mãos que concluem upgrades (não-skip) no flop **e** no turn, há duas 1ªs **Confirmar** gravadas em `upgrade` (uma por street).
- **SC-014**: Em qualquer sequência de 10 perguntas novas de upgrades, o conjunto obrigatório **não** ocupa a mesma ordem visual em todas; após erro, 100% das retries da mesma pergunta mantêm a ordem (RN-G008).
- **SC-015**: 0 coletas de dado pessoal; 0 persistência de cartas, runouts ou replay; o único efeito que sobrevive ao fechar a aba continua sendo a evolução de treino já definida, com `upgrade` atualizado só na 1ª **Confirmar** das opções exibidas.
- **SC-016**: Em 100% dos casos em que o herói já tem trinca, **Par** não é opção obrigatória de upgrade (não é upgrade).

## Assumptions

- **Git / numeração**: o diretório da feature é `specs/005-maos-ainda-possiveis/` (ShortName `maos-ainda-possiveis`, número **005**, sequential). Não há `.specify/extensions.yml` nem hook `before_specify`; o repositório permanece em `main` (pedido explícito). Identidade da spec: `005-maos-ainda-possiveis`. O campo `BRANCH_NAME` do script de bootstrap é só o slug do diretório — **não** se criou branch Git. **Não** houve commit nesta invocação.
- **Fonte de verdade**: comportamento desta spec = PRD §5.4 (RN-020, RN-021, RN-022, RN-023, RN-024, RN-025, RN-026, RN-027, CA-014, CA-015, CA-016, CA-017) + RN-046 reiterado + RN-G001, RN-G002, RN-G004, RN-G005, RN-G007, RN-G008 + contrato de quiz/persistência da feature 003 + avaliador de melhor 5 da feature 004 + gates da constitution (idioma, LGPD, custo zero, treino e não jogo, fail-open). Nenhum `[NEEDS CLARIFICATION]` residual.
- **Escolha autônoma — distratoras (RN-023)**: o PRD define *o que* é distratora (categoria que não é upgrade nesta street) e o teto 6, mas não a ordem de escolha quando sobram várias. Adotado: preencher da mais forte para a mais fraca na tabela canônica, sem repetir. Determinístico, alinhado ao recorte “6 mais fortes”, sem heurística extra de “board tentador” (essa é da 004). **Carta alta** e a categoria atual MAY ser distratoras.
- **Escolha autônoma — “exatamente C”**: um desfecho testemunha só a categoria da melhor 5. Não se promove categoria inferior “embutida”. Coerente com ADR-003 e com royal ≠ straight flush da 004.
- **Escolha autônoma — duas streets**: flop e turn são exposições independentes em `upgrade` quando ambos têm lista não vazia (mesmo padrão da 004 em `mao_atual`). Skip não gera exposição.
- **Escolha autônoma — avaliador do desfecho**: reusa o critério de melhor 5 já especificado na 004 (5/6/7 cartas visíveis; no runout sempre 7). Esta spec **não** redefine wheel, wrap, royal nem kickers internos. Kickers continuam só para escolher a melhor 5; MUST NOT vazar na UI.
- **Dependências**: 001 (palco e `sem_upgrade`), 002 (11 cartas honestas; burns não consomem), 003 (múltipla seleção, **Confirmar**, RN-024/025/026, G008, fail-open), 004 (mão atual autoritativa no flop/turn; acerto dispara esta pergunta). Esta feature **não** redesenha esses contratos.
- **Stub que some**: o conjunto provisório “Flush verdadeiro + Par distratora” do flop e o skip forçado do turn **deixam** de valer. Flush e Par só entram se a regra RN-020/023 desta street os colocar. O caminho de **Confirmar** vs. skip permanece observável, agora com lista real nas duas streets. O showdown stub (006) **permanece**.
- **Copy canônica herdada**: enunciado = “Quais mãos você ainda não tem, mas ainda pode formar?”; skip = “Não há upgrade possível.”; acerto = “Você acertou”; erro = “Não é essa. Tente de novo.”; CTAs = **Confirmar** e **Continuar**. Sem sinônimos e sem vocabulário de draws.
- **Privacidade**: apelidos fixos **Você**, **Adversário A**, **Adversário B**; avatares ilustrados. Recarregar aborta a mão e não apaga evolução já gravada. Coordenadas de ponteiro da 002 continuam só em memória da visita. Runouts e o information set MUST NOT ser persistidos.
- **Constitution como constraint**: sem backend, sem cadastro, custo zero, sem relatório/zerar, desktop-first, fail-open, RN-G001..G008. A enumeração no ponto de vista do herói já está decidida no **ADR-003**; esta spec descreve o **quê** (lista RN-020, teto de 6, skip, 1ª **Confirmar**). Detalhe de implementação fica para `/speckit-plan`.
- **Idioma**: UI em pt-BR; identificadores internos podem estar em inglês.
- **Clarify / plan / tasks / implement**: esta invocação **não** executa esses comandos e **não** altera código de produção.
