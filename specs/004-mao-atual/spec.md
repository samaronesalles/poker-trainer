# Feature Specification: Identificação da mão atual (flop e turn)

**Feature Branch**: `004-mao-atual`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "Implementar a pergunta “Qual mão você tem agora?” só no flop e no turn (o river do herói fica no 006) em seleção única com exatamente 6 rótulos canônicos RN-014, melhor 5 cartas (wheel permitido, wrap proibido, royal ≠ SF), distratoras pela heurística RN-017, retry até acertar, 1ª tentativa grava acerto ou erro na categoria correta em mao_atual — conforme PRD §5.3 (RN-013, RN-014, RN-015, RN-016, RN-017, RN-018, RN-019, RN-046, CA-010, CA-011, CA-012, CA-013)"

## Clarifications

### Session 2026-09-07

- Q: Quando o board da street tem três ou mais cartas do mesmo rank, a Quadra entra como categoria tentadora nas distratoras? → A: Sim: com 3+ do mesmo rank no board, as tentadoras de pares são Quadra, Full house, Trinca e Dois pares, nessa ordem; com só um par (sem trinca), permanecem Full house, Trinca e Dois pares — sem Quadra por tentadora.
- Q: Quando o board tem três ou mais cartas do mesmo naipe e está conectado, o Straight flush entra como tentadora? → A: Sim: incluir Straight flush como tentadora logo após Flush e Straight, antes das tentadoras de par; Royal flush continua só por vizinha ou preenchimento.
- Q: O flop e o turn da mesma mão contam como duas exposições independentes em mao_atual? → A: Sim: cada street tem a própria 1ª tentativa; a pergunta do turn ocorre mesmo se a categoria não mudou; os dois deltas não se fundem.
- Q: Quais conjuntos de 5 ranks contam como wrap, a sequência circular ilegal? → A: Qualquer 5 ranks que só seriam consecutivos se o Ás valesse ao mesmo tempo como alto e baixo; as únicas sequências legais são A-2-3-4-5 e 2-3-4-5-6 até 10-J-Q-K-A.
- Q: O avaliador desta feature precisa apontar também quais 5 cartas vencem, com kickers, ou só o rótulo da categoria? → A: Determinar a melhor combinação de 5 (as cinco cartas + categoria + ranks de kicker); o HUD mostra só o rótulo; kickers nunca vazam na UI.

### Session 2026-09-07 (2)

- Q: Para o Straight flush ser tentadora, o board inteiro precisa estar conectado ou só as cartas do mesmo naipe? → A: Só as cartas daquele naipe: 3+ do mesmo naipe e os ranks desse naipe satisfazem “conectado”; um connector offsuit não basta.
- Q: O preenchimento de cima para baixo deve pular categorias impossíveis com o board visível? → A: Não: preenche na ordem RN-014 sem filtrar possibilidade; “ainda possível” é da feature 005.
- Q: O avaliador de melhor 5 já precisa aceitar 7 cartas visíveis, ou só as 5 do flop e as 6 do turn? → A: O mesmo critério classifica 5, 6 ou 7 cartas visíveis; o HUD desta feature só pergunta com 5 ou 6.
- Q: Um board 2-4-6 (dois buracos) conta como conectado para a tentadora Straight? → A: Sim: 3 ranks distintos numa janela de 5 consecutivos; 2-4-6 é conectado, 2-4-7 e 2-3-8 não são.
- Q: O avaliador precisa acertar as dez categorias canônicas, ou só as mais comuns do flop e do turn? → A: As dez: cada rótulo RN-014 MUST ser a única certa em pelo menos um caso de flop ou turn.

## User Scenarios & Testing *(mandatory)*

Esta feature substitui a correção **provisória** da pergunta de mão atual do herói no **flop** e no **turn**. Até aqui o casco (001), o baralho honesto (002) e o contrato de quiz (003) já existem — enunciado, clique que submete, retry, opção morta, ordem visual embaralhada e memória de treino no dispositivo. A “certa” do flop/turn do herói ainda é um stub (Flush). O valor desta feature é o treinando passar a ler a **melhor categoria já completa** com as cartas que ele vê, na taxonomia canônica, sem kickers no texto e sem pular o river do herói (esse fica para o showdown).

### User Story 1 - Reconhecer a mão já completa no flop (Priority: P1)

O flop pousa. O HUD pergunta **“Qual mão você tem agora?”** com exatamente 6 categorias canônicas, seleção única. A certa é a única melhor categoria das **cinco** cartas já visíveis ao herói (2 hole + 3 flop). Ele clica; o clique submete. Se acertou, o HUD diz **“Você acertou”** e, após o beat, segue a pergunta de upgrades da mesma street (ou o skip de “sem upgrade”) — **não** abre o turn ainda. Se errou, o HUD pede de novo sem revelar a certa; a opção errada fica morta no lugar. A primeira escolha grava acerto ou erro na categoria **correta** da memória `mao_atual`.

**Why this priority**: É o objetivo do §5.3 e o critério CA-010 / CA-012. Sem isto o flop continua treinando um rótulo stub que mente sobre o feltro.

**Independent Test**: Abrir um flop em que a melhor mão do herói é um par; a única opção correta é **Par**; acertá-la de primeira incrementa acerto em Par em `mao_atual`; após o beat, a mesa permanece na street (upgrades ou skip), sem virar o turn.

**Acceptance Scenarios**:

1. **Given** o flop acabou de pousar e as hole cards do herói estão abertas, **When** o HUD entra em `perguntando` na mão atual, **Then** o enunciado é exatamente **“Qual mão você tem agora?”**, há **exatamente 6** rótulos distintos da tabela canônica, seleção única, sem botão **Confirmar**, e a certa é a melhor categoria das 5 cartas visíveis ao herói (RN-013, RN-014, CA-013).
2. **Given** essas 5 cartas formam um par como melhor mão, **When** o treinando lê as opções, **Then** a única opção correta é **Par** — não **Dois pares**, não **Trinca**, não um rótulo com “par de reis” (CA-010, RN-016).
3. **Given** o herói tem um par e acerta **Par** de primeira, **When** se lê a memória de treino, **Then** a categoria **Par** em `mao_atual` tem +1 acerto e +0 erro nessa exposição (CA-010, RN-019).
4. **Given** o acerto no flop e o beat de feedback encerrado, **When** a mesa avança, **Then** segue a pergunta de upgrades da mesma street ou o skip **“Não há upgrade possível.”** — **não** abre o turn ainda (CA-012).
5. **Given** o flop ainda voando, **When** o treinando procura opções clicáveis, **Then** não há pergunta; o quiz só habilita depois das três comunitárias pousarem.
6. **Given** o herói já respondeu a mão atual no flop, **When** o turn pousa, **Then** o HUD pergunta de novo **“Qual mão você tem agora?”** — mesmo que a categoria correta continue a mesma — e essa 1ª tentativa é uma exposição nova em `mao_atual`.

---

### User Story 2 - Reconhecer a melhor 5 no turn (Priority: P1)

O turn pousa. O herói vê 6 cartas (2 hole + 4 comunitárias). O HUD pergunta de novo **“Qual mão você tem agora?”**, com o mesmo contrato de 6 opções. A certa é a categoria da **melhor combinação de 5** entre as 6 — pode usar as duas hole, ou só uma hole mais as quatro do board. Jogar “quase a mesa” é legal; no turn ainda não há quinta comunitária, então não existe mão só com o board. Depois do acerto, a street segue para upgrades ou skip, não para o river.

**Why this priority**: O turn é a outra street desta feature. Sem avaliador de melhor-5 entre 6 cartas, o treino para no flop ou continua mentindo com o stub.

**Independent Test**: Abrir um turn em que a melhor 5 usa só uma hole card (as quatro comunitárias + 1 hole ganham da outra combinação); a opção correta é a categoria dessa melhor 5, não a da combinação mais fraca; o river ainda não abre.

**Acceptance Scenarios**:

1. **Given** o turn acabou de pousar, **When** o HUD pergunta a mão atual, **Then** o enunciado é **“Qual mão você tem agora?”**, há exatamente 6 rótulos canônicos distintos incluindo a certa, e a certa é a melhor 5 entre as 6 cartas visíveis ao herói (RN-013, CA-013).
2. **Given** uma das combinações de 5 é **Dois pares** e outra é só **Par**, **When** se avalia a mão atual, **Then** a correta é **Dois pares**.
3. **Given** a melhor 5 do turn usa 1 hole + as 4 comunitárias, **When** o treinando escolhe a categoria dessa combinação, **Then** é acerto; escolher a categoria de uma combinação pior é erro.
4. **Given** o acerto no turn e o beat encerrado, **When** a mesa avança, **Then** segue upgrades ou skip da **mesma** street — **não** abre o river e **não** pergunta de novo a mão do herói nesta street.
5. **Given** o turn ainda não pousou, **When** o treinando espera o quiz, **Then** o HUD permanece em `deal` sem opções clicáveis.

---

### User Story 3 - Ver seis categorias canônicas, com distratoras do board (Priority: P1)

Cada vez que a pergunta de mão atual do flop ou do turn aparece, o treinando vê **sempre 6** nomes oficiais — nunca 5, nunca 7, nunca “Sequência” no lugar de **Straight**. A certa está sempre no conjunto. As outras cinco são distratoras montadas de forma estável: primeiro as vizinhas na tabela de força; depois o que o **board** (comunitárias já abertas) torna visualmente tentador; se ainda faltar, preenche da mais forte para a mais fraca, sem repetir. A ordem dos botões muda a cada pergunta nova; depois de um erro, os botões **não** trocam de lugar.

**Why this priority**: Sem 6 rótulos estáveis o treino vira caça ao botão ou prova com sinônimo. É RN-017, RN-018, RN-G008 e CA-013.

**Independent Test**: Em várias mãos de flop/turn, contar 6 rótulos distintos da lista oficial, confirmar que a certa está entre eles, e verificar que a posição da certa não é a mesma em todas as perguntas novas; após um erro, a ordem permanece.

**Acceptance Scenarios**:

1. **Given** o quiz de mão atual no flop ou no turn, **When** as opções aparecem, **Then** há exatamente 6 rótulos distintos da tabela canônica, a certa está inclusa, e **não** há sinônimo, kicker, naipe por extenso nem “par de reis” (RN-016, RN-018, CA-013).
2. **Given** a mesma street com as mesmas cartas visíveis, **When** se monta o conjunto de opções (ignorando a ordem dos botões), **Then** o conjunto de 6 rótulos é o mesmo — a heurística é determinística.
3. **Given** o board tem duas ou mais cartas do mesmo naipe e a certa **não** é **Flush**, **When** as opções aparecem, **Then** **Flush** está entre as distratoras, salvo se as 5 vagas já tiverem sido preenchidas por vizinhas e por outras tentadoras de prioridade igual ou maior (RN-017).
4. **Given** o board está conectado (definição em Assumptions, inclusive textura com dois buracos como 2-4-6) e a certa **não** é **Straight**, **When** as opções aparecem, **Then** **Straight** entra pelo critério de board tentador, com a mesma regra de vaga (RN-017).
5. **Given** o board é 2-4-7 ou 2-3-8 (não conectado) e a certa **não** é **Straight**, **When** as opções aparecem, **Then** **Straight** **não** entra como tentadora de board (só por vizinha ou preenchimento).
6. **Given** o board tem três ou mais cartas do mesmo naipe cujos ranks estão conectados, e a certa **não** é **Straight flush**, **When** as opções aparecem, **Then** **Straight flush** concorre como tentadora, depois de **Flush** e **Straight** e antes das tentadoras de par; **Royal flush** **não** entra só por esse critério (RN-017).
7. **Given** o board tem três ou mais cartas do mesmo naipe cujos ranks **não** estão conectados, mesmo que o board inteiro esteja conectado por um connector de outro naipe, e a certa **não** é **Straight flush**, **When** as opções aparecem, **Then** **Straight flush** **não** entra como tentadora (só por vizinha ou preenchimento).
8. **Given** o board está pareado **sem** trinca e a certa **não** é **Trinca**, **Dois pares** nem **Full house**, **When** as opções aparecem, **Then** essas três categorias tentadoras concorrem às vagas de distratora na ordem fixada em Assumptions — **Quadra** **não** entra só por haver um par (RN-017).
9. **Given** o board tem três ou mais cartas do mesmo rank e a certa **não** é **Quadra**, **When** as opções aparecem, **Then** **Quadra** concorre como tentadora, à frente de **Full house**, **Trinca** e **Dois pares** (RN-017).
10. **Given** dez perguntas **novas** de mão atual (flop ou turn), **When** se observa a posição da certa, **Then** ela **não** ocupa o mesmo botão em todas; após um erro na **mesma** pergunta, a ordem **não** muda (RN-G008).

---

### User Story 4 - Errar, tentar de novo e gravar só a primeira vez na categoria certa (Priority: P2)

O treinando chuta **Flush** quando a melhor mão é **Par**. O HUD diz **“Não é essa. Tente de novo.”**, **Flush** fica morta no lugar, a certa **não** é revelada, e a memória já registrou **erro em Par** — não em Flush. Ele clica de novo até acertar **Par**. Esse segundo clique **não** vira a exposição em acerto. Não há “pular pergunta” nem botão que mostre a resposta.

**Why this priority**: É RN-019, RN-G005 e CA-011. O contrato de retry já existe (003); aqui o que muda é a **categoria correta** deixar de ser o stub.

**Independent Test**: Errar de primeira numa mão cuja certa é Par, clicar de novo, acertar; ler a memória: Par tem +1 erro e +0 acerto; Flush não recebe o erro.

**Acceptance Scenarios**:

1. **Given** um erro na primeira opção, **When** o treinando olha o HUD e as opções, **Then** o texto é **“Não é essa. Tente de novo.”**, a opção errada está desabilitada no mesmo lugar, pediu-se nova tentativa, e `mao_atual` da categoria **correta** já tem +1 erro (CA-011).
2. **Given** o chute **Flush** quando a certa é **Par**, **When** se lê a memória, **Then** o erro foi em **Par**, não em Flush (RN-019).
3. **Given** erro depois acerto na mesma pergunta, **When** se lê a exposição, **Then** a categoria correta tem +1 erro e +0 acerto; tentativas seguintes não alteram contadores (RN-019).
4. **Given** a pergunta em curso, **When** o treinando procura “pular” ou “mostrar resposta”, **Then** isso **não** existe; a certa só aparece como certa quando ele a escolhe (RN-G005).
5. **Given** clique numa opção já morta ou fora das opções, **When** o gesto ocorre, **Then** a pergunta não avança e os contadores não mudam.

---

### User Story 5 - Distinguir royal, wheel e wrap sem kickers no texto (Priority: P2)

O treinando encontra as armadilhas clássicas de leitura: A-K-Q-J-10 do mesmo naipe é **Royal flush**, nunca **Straight flush**. A-2-3-4-5 suited é **Straight flush**, nunca royal. A-2-3-4-5 de naipes mistos é **Straight** (wheel). K-A-2-3-4 **não** é sequência. Par de dois e par de Ás são os dois **Par** — a força dentro da categoria não muda o rótulo.

**Why this priority**: RN-015, RN-016 e RN-046 são o que separa treino de vocabulário correto de um avaliador “quase certo”. Sem estes casos o motor mente nos extremos.

**Independent Test**: Percorrer (ou montar) flop/turn com royal, wheel suited, wheel offsuit, wrap e dois pares de forças diferentes; conferir o rótulo correto e a ausência de kicker no enunciado e nas opções.

**Acceptance Scenarios**:

1. **Given** as 5 cartas do flop são A-K-Q-J-10 do mesmo naipe, **When** o quiz avalia, **Then** a única certa é **Royal flush**, não **Straight flush** (RN-015).
2. **Given** A-2-3-4-5 do mesmo naipe como melhor 5, **When** o quiz avalia, **Then** a certa é **Straight flush**, nunca **Royal flush** (RN-015).
3. **Given** A-2-3-4-5 de naipes mistos como melhor 5, **When** o quiz avalia, **Then** a certa é **Straight** (wheel permitido).
4. **Given** as únicas “quase sequências” visíveis são wrap (K-A-2-3-4, Q-K-A-2-3, J-Q-K-A-2 ou A-2-3-4-K), **When** o quiz avalia, **Then** isso **não** conta como **Straight** nem como **Straight flush** se forem do mesmo naipe; a certa é a melhor categoria que realmente existe.
5. **Given** o herói tem par de dois no flop e, noutra mão, par de Ás no flop, **When** se comparam as respostas corretas, **Then** as duas são **Par**; o enunciado e as opções **não** dizem “par de ases” nem nomeiam kicker (RN-016, RN-046).
6. **Given** 5 cartas do mesmo naipe que **não** são consecutivas o bastante para straight flush/royal, **When** o quiz avalia, **Then** a certa é **Flush**, não **Straight flush**.
7. **Given** a melhor 5 é **Quadra**, **Full house**, **Trinca**, **Dois pares** ou **Carta alta**, **When** o quiz avalia, **Then** a única certa é exatamente esse rótulo — o avaliador MUST cobrir as 10 categorias, não só par/flush/straight.

---

### Edge Cases

- Sempre existe exatamente uma melhor categoria nas cartas visíveis ao herói. MUST NOT haver skip nesta pergunta. As 10 categorias canônicas são alcançáveis como resposta correta em algum flop ou turn.
- Flop: exatamente uma combinação de 5 (2 hole + 3 flop). Não há escolha de quais 5.
- Turn: 6 cartas visíveis → melhor 5 entre as 6. Combinações possíveis: 2 hole + 3 comunitárias, ou 1 hole + 4 comunitárias. **Não** existe melhor 5 só com o board no turn (só 4 comunitárias).
- Duas combinações do turn na **mesma** categoria (par fraco vs par forte): a resposta do quiz continua o mesmo rótulo; a força interna não muda a opção (RN-046).
- Duas combinações do turn em categorias **diferentes**: a correta é a mais forte na tabela canônica.
- Royal e straight flush nunca empatam no rótulo: royal ganha o nome **Royal flush**.
- Wheel (A-2-3-4-5) é sequência legal; wrap é qualquer 5 ranks que só seriam consecutivos com Ás alto e baixo ao mesmo tempo (K-A-2-3-4, Q-K-A-2-3, J-Q-K-A-2, A-2-3-4-K e os demais fora da lista legal de FR-006). Wrap suited também não é straight flush.
- Board com dois+ do mesmo naipe, board conectado e board pareado ao mesmo tempo: as tentadoras entram na ordem fixa de Assumptions até completar 5 distratoras; o excedente **não** aparece.
- Board com trinca ou quadra (3+ do mesmo rank): **Quadra** é tentadora se não for a certa. Board só com um par (sem trinca): **Quadra** **não** entra como tentadora — só por vizinha ou preenchimento.
- Board com 3+ do mesmo naipe **e** os ranks **desse naipe** conectados: **Straight flush** é tentadora se não for a certa. 3+ do mesmo naipe com connector só offsuit: **Straight flush** **não** é tentadora. **Royal flush** não entra só por textura de board.
- Categoria tentadora que **é** a certa: conta como a correta, não como distratora extra; as vagas restantes enchem por vizinhas e preenchimento.
- Categoria vizinha que também é tentadora do board: entra uma vez só.
- Preenchimento de cima para baixo: **não** filtra categorias “impossíveis” com o board (ex.: **Royal flush** pode preencher vaga mesmo num flop 2-7-8 rainbow). “Ainda possível” é da 005.
- River do herói, mão de A, mão de B e “quem ganhou”: **não** mudam nesta feature; continuam o contrato stub da 003 até a 006 (CA-027).
- Após acerto no flop: upgrades stub da 003 (múltipla seleção) ou skip — não o turn (CA-012). Esta feature **não** substitui o stub de upgrades (005).
- Recarregar no meio da pergunta: a mão aborta (casco); contadores já gravados nesta visita permanecem (003). MUST NOT pedir dado pessoal para retomar.
- Flop e turn da mesma mão: duas 1ª tentativas independentes em `mao_atual`. Categoria igual nas duas streets ainda gera dois deltas. Recarregar antes do turn preserva só o que já foi gravado no flop.
- Armazenamento indisponível: o quiz e o avaliador seguem; a evolução MAY perder-se ao fechar (fail-open da 003).
- Clique em morta / fora das opções: ignora.
- Preferência por reduzir movimento: o contrato de correção não depende de animação; o beat de acerto permanece o da 003 (≤1 s, 0 s se movimento reduzido).
- MUST NOT persistir cartas, pool de cursor, enunciado, carimbo de data/hora ou identificador pessoal. Só os contadores já definidos em `mao_atual` (e os demais buckets intocados por esta pergunta).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No flop, depois das três comunitárias pousarem, o HUD MUST perguntar **“Qual mão você tem agora?”** em seleção única. A categoria correta MUST ser a da única combinação de 5 cartas já visíveis ao herói (2 hole + 3 flop) (RN-013).
- **FR-002**: No turn, depois da quarta comunitária pousar, o HUD MUST perguntar **“Qual mão você tem agora?”** em seleção única. A categoria correta MUST ser a da melhor combinação de 5 entre as 6 cartas visíveis ao herói. Essa melhor 5 MAY usar 2 hole + 3 comunitárias ou 1 hole + 4 comunitárias. MUST NOT exigir 0 hole no turn (o board ainda tem 4 cartas).
- **FR-003**: MUST existir exatamente uma melhor categoria em cada uma dessas perguntas. MUST NOT haver skip, “não sei” nem avançar a street sem acertar (RN-013, RN-G002, RN-G005).
- **FR-004**: As categorias oficiais, **rótulo exato na UI**, da mais forte para a mais fraca, MUST ser exatamente: **Royal flush**, **Straight flush**, **Quadra**, **Full house**, **Flush**, **Straight**, **Trinca**, **Dois pares**, **Par**, **Carta alta** (RN-014). MUST NOT exibir sinônimos (“Sequência”, “Straight flush real”, “um par”). O avaliador MUST classificar cada um dos 10 rótulos quando essa for a melhor 5 — inclusive **Royal flush** e **Carta alta**, não só as categorias “comuns” de flop/turn.
- **FR-005**: **Royal flush** MUST ser A, K, Q, J, 10 do mesmo naipe. Se a melhor 5 é royal, a correta MUST ser **Royal flush**, nunca **Straight flush**. Se a melhor 5 é A-2-3-4-5 suited, a correta MUST ser **Straight flush**, nunca **Royal flush** (RN-015).
- **FR-006**: **Straight** MUST aceitar Ás-alto (10-J-Q-K-A) e **wheel** (A-2-3-4-5, Ás baixo). MUST NOT aceitar **wrap**: qualquer conjunto de 5 ranks que só seria consecutivo se o Ás valesse ao mesmo tempo como alto (ao lado do Rei) e como baixo (ao lado do 2). As únicas sequências legais de ranks são A-2-3-4-5, 2-3-4-5-6, 3-4-5-6-7, 4-5-6-7-8, 5-6-7-8-9, 6-7-8-9-10, 7-8-9-10-J, 8-9-10-J-Q, 9-10-J-Q-K e 10-J-Q-K-A. Exemplos de wrap (ilegais): K-A-2-3-4, Q-K-A-2-3, J-Q-K-A-2, A-2-3-4-K. **Flush** MUST ser 5 do mesmo naipe que **não** sejam consecutivas o bastante para straight flush ou royal. **Straight flush** MUST ser 5 consecutivas do mesmo naipe que **não** sejam royal (a consecutividade do SF usa as mesmas sequências legais; wrap suited também **não** é SF).
- **FR-007**: Enunciado e opções MUST NOT incluir kicker, naipe por extenso, rank da mão (“par de reis”, “flush ao Ás”) nem força dentro da categoria. Só o rótulo RN-014. Par de dois e par de Ás MUST ter a mesma resposta **Par**. Flush ao 9 e flush ao Ás MUST ter a mesma resposta **Flush** (RN-016, RN-046, RN-G004).
- **FR-008**: Cada pergunta de mão atual do flop e do turn MUST exibir **exatamente 6** rótulos distintos de RN-014, a correta sempre inclusa, 1 correta + 5 distratoras (RN-017, RN-018, CA-013). MUST NOT haver menos de 6.
- **FR-009**: O conjunto das 6 opções (sem a ordem visual) MUST ser determinístico para o mesmo conjunto de cartas visíveis ao herói e o mesmo board da street, montado assim:
  1. incluir sempre a categoria correta;
  2. incluir as **vizinhas imediatas** na tabela RN-014 (a imediatamente mais forte e a imediatamente mais fraca, quando existirem);
  3. incluir categorias que o **board da street** (só comunitárias já abertas — 3 no flop, 4 no turn) torna visualmente tentadoras, nesta ordem, sem repetir: **Flush** se houver duas ou mais cartas do mesmo naipe; **Straight** se o board estiver conectado; **Straight flush** se houver três ou mais cartas do mesmo naipe **e** os ranks **desse naipe** estiverem conectados (a mesma definição de conectado, aplicada só a essas cartas; um connector de outro naipe MUST NOT bastar); se o board tiver **três ou mais** cartas do mesmo rank: **Quadra**, **Full house**, **Trinca** e **Dois pares**, nessa ordem; senão, se o board estiver pareado (um rank aparece duas vezes, sem trinca): **Full house**, **Trinca** e **Dois pares**, nessa ordem. **Royal flush** MUST NOT entrar só por tentadora de board — só como vizinha ou preenchimento;
  4. se ainda faltar vaga, preencher de cima para baixo na RN-014, sem repetir. MUST NOT omitir uma categoria do preenchimento só porque ela seria impossível com as comunitárias já abertas. A filtragem de “ainda possível” é da feature 005.
  Se os passos 2–3 passarem de 5 distratoras, MUST manter a correta, depois as vizinhas já incluídas, depois as tentadoras na ordem do passo 3, e MUST descartar o excedente. MUST NOT usar as hole cards do herói como “board” para tentadoras.
- **FR-010**: A ordem **visual** das 6 opções MUST ser embaralhada ao **apresentar** cada pergunta nova. A correta MUST NOT ficar sempre no mesmo botão. MUST NOT reembaralhar após erro na mesma pergunta. MUST NOT reembaralhar o baralho da mão ao embaralhar opções (RN-G008).
- **FR-011**: O clique numa opção disponível MUST submeter na hora. MUST NOT existir **Confirmar** nesta pergunta. Erro e acerto MUST reusar o contrato já vigente: textos **“Não é essa. Tente de novo.”** / **“Você acertou”**, opção morta visível no lugar, certa só marcada como certa quando escolhida, retry até acertar, beat de acerto e avanço da 003 (RN-047, RN-034, RN-035, RN-036, RN-G005).
- **FR-012**: Só a **primeira** tentativa altera `mao_atual`. O registro MUST ser na categoria **correta** daquela pergunta (acerto ou erro), imediatamente, ainda nesta pergunta. Chutar um rótulo distrator MUST NOT incrementar esse rótulo. Tentativas seguintes MUST NOT alterar contadores (RN-019, CA-011). O flop e o turn da **mesma** mão MUST ser duas exposições independentes: cada street tem a própria 1ª tentativa na categoria correta daquela street. MUST NOT omitir a pergunta do turn só porque a categoria não mudou em relação ao flop. MUST NOT fundir os dois deltas num só.
- **FR-013**: Dado acerto no flop, quando o beat termina, a mesa MUST seguir para a pergunta de upgrades da mesma street (contrato 5.4 já existente, ainda stub até a 005) ou para o skip **“Não há upgrade possível.”** — MUST NOT abrir o turn (CA-012).
- **FR-014**: Dado acerto no turn, quando o beat termina, a mesa MUST seguir para upgrades ou skip da mesma street — MUST NOT abrir o river e MUST NOT repetir a identificação da mão do herói nesta street.
- **FR-015**: Esta feature MUST NOT apresentar a pergunta de mão atual do herói no river, nem as de Adversário A, Adversário B ou “quem ganhou”. Esses passos MUST permanecer como na 003 até a feature 006 (CA-027).
- **FR-016**: A classificação da mão atual MUST usar só as cartas **já visíveis ao herói** no flop e no turn. MUST NOT consultar as hole cards dos adversários (elas estão fechadas). O avaliador MUST identificar a **melhor combinação de 5** — as cinco cartas vencedoras, a categoria canônica e os ranks que desempatam (kickers) segundo o ranking completo de RN-029 (categoria primeiro; wheel vale 5 no topo da sequência) — para um conjunto de **5, 6 ou 7** cartas visíveis. O HUD desta feature MUST perguntar só com 5 (flop) ou 6 (turn). MUST NOT apresentar a pergunta com 7 cartas (river fica na 006). O HUD MUST exibir só o rótulo da categoria. Kickers MUST NEVER aparecer na UI e MUST NOT criar pergunta de pote nesta feature.
- **FR-017**: MUST haver no máximo uma pergunta por vez no HUD (RN-G001). MUST NOT avançar de street enquanto a identificação da mão atual dessa street não estiver acertada (RN-G002).
- **FR-018**: Toda interface visível desta pergunta (enunciado, 10 rótulos, feedback herdado) MUST estar em português brasileiro, com termos de clube flop/turn/river permitidos.
- **FR-019**: MUST NOT persistir cartas, pool de cursor, enunciado, opções, carimbo de data/hora, identificador de sessão ou qualquer dado pessoal. O único efeito persistido desta pergunta MUST ser o delta de 1ª tentativa em `mao_atual` da categoria correta, no mesmo bloco de evolução já definido (sem novos buckets, sem relatório, sem botão zerar).
- **FR-020**: MUST NOT introduzir apostas, quiz preflop, desistir da mão, mute na UI, cadastro, login, multiplayer, relatório visual, botão zerar, draws nomeados, nem alterar apelidos (**Você**, **Adversário A**, **Adversário B**) ou a honestidade do baralho.
- **FR-021**: Se a memória de treino falhar, o avaliador e o quiz MUST continuar; a evolução MAY perder-se ao fechar. MUST NOT haver `alert()` nem jargão que bloqueie o HUD.
- **FR-022**: Até existir a feature 005, o caminho **depois** do acerto desta pergunta MUST permanecer o da 003 (múltipla seleção stub no flop; skip no turn). Esta feature substitui só a correção e as 6 opções da mão atual do herói no flop e no turn — não o stub de upgrades.

### Key Entities

- **Cartas visíveis ao herói**: no flop, as 2 hole abertas + as 3 comunitárias do flop (5 cartas). No turn, essas mais a quarta comunitária (6 cartas). Não inclui hole dos adversários nem burns cênicos. O avaliador de melhor 5 também classifica 7 cartas (2 hole + 5 comunitárias), sem o HUD desta feature usar esse caso.
- **Board da street**: só as comunitárias já abertas (3 no flop, 4 no turn). É a base das distratoras “tentadoras”, não as hole do herói.
- **Melhor 5**: a combinação vencedora de 5 cartas entre as visíveis ao herói. Atributos: as cinco cartas, a categoria canônica e os ranks de desempate (kickers). Empate de categoria no turn resolve-se pela força interna; o rótulo do quiz permanece o da categoria vencedora. O HUD consome só a categoria.
- **Categoria canônica**: um dos 10 rótulos RN-014. Atributos: ordem de força (1 = Royal flush … 10 = Carta alta), rótulo exato na UI.
- **Pergunta de mão atual**: exposição de seleção única no HUD, enunciado **“Qual mão você tem agora?”**, 6 opções, uma correta. Ocorre só no flop e no turn nesta feature.
- **Conjunto de 6 opções**: 1 correta + 5 distratoras distintas, montado pela heurística RN-017. A ordem visual é embaralhada à parte.
- **Distratora**: rótulo canônico exibido que não é a melhor categoria atual. Vizinha, tentadora de board, ou preenchimento de cima para baixo.
- **Primeira tentativa**: o primeiro clique que submete nesta pergunta; único evento que altera `mao_atual` da categoria correta (contrato da 003).

### Fora de escopo (esta feature)

- Casco da mesa, estados do HUD, deal, burns cênicos, áudio (features 001–002).
- Contrato de retry, feedback, ordem visual, persistência dos três buckets e stub de múltipla seleção / skip de upgrades (feature 003) — esta feature **consome** esse contrato e só troca a correção e o conjunto de opções da mão atual do herói no flop/turn.
- Enumeração real de upgrades no information set (47/46), lista 1–5 + distratoras, ou skip autoritativo (feature 005 / §5.4).
- River: virada de A e B, mão do herói no showdown, mãos dos adversários, vencedor do pote, ranking completo para o pote, split visual autoritativo (feature 006 / §5.5 / CA-027). O avaliador desta feature **não** precisa responder “quem ganhou”.
- Tela de relatório, botão zerar, apostas, quiz preflop, login, multiplayer, draws nomeados, outras variantes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos flops em que a melhor mão do herói é um par, a única opção correta é **Par**, e acertá-la de primeira registra acerto em Par em `mao_atual` (CA-010).
- **SC-002**: Em 100% dos erros de primeira nesta pergunta, a opção errada fica desabilitada no lugar, o HUD pede nova tentativa sem revelar a certa, e `mao_atual` da categoria correta já tem +1 erro antes do segundo clique (CA-011).
- **SC-003**: Em 100% dos acertos no flop, após o beat de feedback a mesa segue para upgrades ou skip da **mesma** street; 0 desses acertos abrem o turn ainda (CA-012).
- **SC-004**: Em 100% das perguntas de mão atual do flop e do turn, há exatamente 6 rótulos distintos da tabela canônica, incluindo o correto, e em qualquer sequência de 10 perguntas novas a certa **não** ocupa a mesma posição em todas (CA-013, RN-G008).
- **SC-005**: Em 100% dos casos royal visível como melhor 5, a certa é **Royal flush** e **não** **Straight flush**. Em 100% dos wheels suited como melhor 5, a certa é **Straight flush** e **não** royal (RN-015).
- **SC-006**: Em 100% dos wheels offsuit como melhor 5, a certa é **Straight**. Em 100% dos wraps (qualquer 5 ranks ilegais de FR-006, inclusive K-A-2-3-4, Q-K-A-2-3 e J-Q-K-A-2) como única “quase sequência”, a certa **não** é **Straight** nem **Straight flush**.
- **SC-007**: Em 100% dos chutes numa distratora, o erro incrementa a categoria **correta** e 0 vezes a distratora chutada (RN-019).
- **SC-008**: Em 100% das perguntas desta feature, enunciado e opções têm 0 kickers, 0 ranks (“par de reis”) e 0 sinônimos fora dos 10 rótulos (RN-016, RN-046).
- **SC-009**: Em 100% dos turns, a certa coincide com a melhor 5 entre as 6 cartas visíveis (incluindo o caso em que 1 hole + board ganha de 2 hole + 3 comunitárias).
- **SC-010**: Em 100% das mãos, o river do herói **não** ganha uma pergunta extra desta feature; a identificação no showdown permanece uma vez só, no passo já existente do casco (CA-027).
- **SC-011**: 0 coletas de dado pessoal; 0 persistência de cartas ou replay; o único efeito que sobrevive ao fechar a aba continua sendo a evolução de treino já definida, com `mao_atual` atualizado na 1ª tentativa.
- **SC-012**: Em 100% das mãos que concluem a pergunta de mão atual no flop **e** no turn, há duas 1ª tentativas gravadas em `mao_atual` (uma por street), mesmo quando a categoria correta é a mesma nas duas streets.
- **SC-013**: Em 100% das 10 categorias RN-014 existe pelo menos um conjunto de cartas de flop ou turn em que essa categoria é a única opção correta.

## Assumptions

- **Git / numeração**: o diretório da feature é `specs/004-mao-atual/` (ShortName `mao-atual`, número **004**, sequential). Não há `.specify/extensions.yml` nem hook `before_specify`; o repositório permanece em `main` (pedido explícito). Identidade da spec: `004-mao-atual`. O campo `BRANCH_NAME` do script de bootstrap é só o slug do diretório — **não** se criou branch Git.
- **Fonte de verdade**: comportamento desta spec = PRD §5.3 (RN-013, RN-014, RN-015, RN-016, RN-017, RN-018, RN-019, RN-046, CA-010, CA-011, CA-012, CA-013) + RN-G001, RN-G002, RN-G004, RN-G005, RN-G008 + contrato de quiz/persistência da feature 003 + gates da constitution (idioma, LGPD, custo zero, treino e não jogo, fail-open). Nenhum `[NEEDS CLARIFICATION]` residual.
- **Motor vs. quiz do river (escolha autônoma + clarificação)**: esta feature cria o avaliador de **melhor 5** (cartas + categoria + kickers) para um conjunto de **5, 6 ou 7** cartas visíveis e o **consome só** no flop (5) e no turn (6) do herói. Comparar três jogadores, kickers como desempate de **pote** e a pergunta do herói no river ficam na 006, reusando o mesmo critério de categoria. Enumerar o baralho desconhecido para upgrades fica na 005. Esta spec **não** exige que o HUD da 006 já exista.
- **Turn e “jogar a mesa” (escolha autônoma)**: o PRD permite 0, 1 ou 2 hole no turn/river. No turn só há 4 comunitárias, então 0 hole não forma 5 cartas. Interpretação adotada: no turn as únicas combinações legais são 2+3 e 1+4; “jogar a mesa” de verdade (0+5) é do river / 006.
- **Board tentador (escolha autônoma, RN-017)**: “board” = comunitárias já abertas da street, sem hole do herói. **Conectado** = existem pelo menos 3 ranks distintos no board que cabem numa janela de 5 ranks consecutivos, aceitando a janela do wheel (A-2-3-4-5) e **recusando** wrap (K-A-2-3-4). Exemplos: 2-4-6 é conectado (janela 2-3-4-5-6); 9-8-6 é conectado; 2-4-7 e 2-3-8 **não** são; A-2-3 é conectado (wheel); K-A-2 **não** é (wrap / só 2 ranks em cada janela legal). **Pareado** = pelo menos um rank aparece duas ou mais vezes no board. **Trinca ou mais no board** = pelo menos um rank aparece três ou mais vezes. **Dois+ do mesmo naipe** = pelo menos um naipe aparece duas ou mais vezes no board. Ordem de inclusão das tentadoras e descarte do excedente: FR-009. Com 3+ do mesmo rank, as tentadoras de pares incluem **Quadra** antes de Full house / Trinca / Dois pares; com só um par, **Quadra** não é tentadora. **Straight flush** é tentadora só quando um naipe aparece 3+ vezes **e** os ranks **desse naipe** estão conectados (depois de Flush e Straight); um connector offsuit não basta. **Royal flush** não é tentadora de board.
- **Vizinhas (escolha autônoma)**: só a imediatamente acima e a imediatamente abaixo na tabela de 10. **Royal flush** tem uma vizinha (**Straight flush**). **Carta alta** tem uma vizinha (**Par**).
- **Kickers internos (escolha autônoma + clarificação)**: o avaliador MUST devolver a melhor combinação de 5 (cartas + categoria + ranks de kicker), não só o rótulo. No turn, isso escolhe qual das combinações 2+3 / 1+4 vence. O ranking é o completo de RN-029 (categoria, depois ranks que definem a mão; wheel vale 5 no topo). Isso **não** vaza para a UI e **não** cria pergunta de pote nesta feature. Duas combinações na mesma categoria produzem o mesmo rótulo de quiz.
- **Dependências**: 001 (palco e cadência), 002 (11 cartas honestas), 003 (clique-submete, retry, G008, `mao_atual` na 1ª tentativa, stub de upgrades no flop e skip no turn). Esta feature **não** redesenha esses contratos.
- **Stub que some / stub que fica**: a correta **Flush** fixa de `flop_hero` e `turn_hero` some. As corretas stub do river (herói Flush, A/B Par) e o conjunto stub de upgrades do flop **permanecem** até 005/006. Até lá, o feltro já é honesto no flop/turn da mão do herói; o restante da cadência MAY continuar provisório.
- **Copy canônica herdada**: acerto = “Você acertou”; erro = “Não é essa. Tente de novo.”; skip = “Não há upgrade possível.”; enunciado = “Qual mão você tem agora?”. Sem sinônimos.
- **Privacidade**: apelidos fixos **Você**, **Adversário A**, **Adversário B**; avatares ilustrados. Recarregar aborta a mão e não apaga evolução já gravada. Coordenadas de ponteiro da 002 continuam só em memória da visita.
- **Constitution como constraint**: sem backend, sem cadastro, custo zero, sem relatório/zerar, desktop-first, fail-open, RN-G001..G008. Stack do avaliador (motor próprio no cliente, sem lib de poker) já está decidida no **ADR-003**; esta spec descreve o **quê** (melhor 5, taxonomia, distratoras, só flop/turn do herói). Detalhe de implementação fica para `/speckit-plan`.
- **Idioma**: UI em pt-BR; identificadores internos podem estar em inglês.
