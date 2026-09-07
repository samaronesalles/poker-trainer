# Feature Specification: Showdown — mãos dos adversários e vencedor do pote

**Feature Branch**: `006-showdown-vencedor`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "Implementar o river com virada das hole cards adversárias e exatamente quatro perguntas em sequência (mão do herói uma vez só, mão de A, mão de B, quem ganhou), reusando o contrato 5.3 nas três categorias, vencedor pelo ranking completo RN-029 incluindo split e board que joga para todos, opções de pote montadas pela prioridade RN-031 (sempre 6 quando o universo permitir), desfecho visual e Próxima mão — conforme PRD §5.5 (RN-028, RN-029, RN-030, RN-031, RN-032, RN-033, RN-038, CA-018, CA-019, CA-020, CA-021, CA-027)"

## User Scenarios & Testing *(mandatory)*

Esta feature substitui o **stub** do showdown (mão do herói no river ainda Flush fixo; A e B ainda Par fixo; vencedor ainda provisório). O casco (001), o baralho honesto (002), o contrato de quiz (003), o avaliador da melhor 5 (004) e os upgrades reais do flop/turn (005) já existem. O valor é o treinando ler, com as **onze** cartas abertas, a categoria de cada um e **quem leva o pote** — inclusive empate e mesa que joga para todos — sem kickers no texto, sem segunda pergunta da mão do herói e sem upgrades no river.

### User Story 1 - Virar o showdown e identificar a mão do herói uma vez só (Priority: P1)

O turn termina. A quinta comunitária pousa no slot 5. As hole cards de **Adversário A** e **Adversário B** viram nos assentos. Só então o HUD pergunta **“Qual mão você tem agora?”** — a **única** identificação da mão do herói nesta street. O contrato é o da 5.3: seleção única, exatamente 6 rótulos canônicos, clique submete, retry até acertar. A certa é a categoria da **melhor 5** entre as 7 cartas do herói (2 hole + 5 comunitárias). Jogar a mesa (0 hole) é legal. **Não** há pergunta de upgrades no river. Depois do acerto, o HUD **não** abre o turn de novo nem pergunta a mão do herói outra vez: segue para a mão de A.

**Why this priority**: Sem a virada e sem a única 5.3 do herói no river, o showdown não começa e CA-018 / CA-027 falham. É o primeiro passo do §5.5.

**Independent Test**: Percorrer até o river: A e B ainda fechados enquanto a quinta comunitária voa; depois da virada, as 6 hole e as 5 comunitárias face-up; exatamente uma pergunta **“Qual mão você tem agora?”**; a certa é a melhor 5 das 7 do herói, não o stub Flush; zero pergunta de upgrades.

**Acceptance Scenarios**:

1. **Given** o turn ainda não terminou (mão atual ou upgrades/skip do turn em curso), **When** o treinando procura o river ou as hole de A/B abertas, **Then** o river **não** abre e A/B permanecem fechados (RN-G002, RN-005).
2. **Given** o turn completo, **When** a street river corre, **Then** o river pousa no slot 5 (burn visual opcional antes, se existir), **depois** as hole de A e B viram nos assentos, e **só então** o HUD sai de `deal` e a primeira pergunta fica respondível (CA-004, CA-018).
3. **Given** a primeira pergunta do showdown visível, **When** o treinando olha a mesa, **Then** as 6 hole cards e as 5 comunitárias estão face-up nos lugares certos; o treinando **não** precisa lembrar carta já virada (CA-018, RN-033).
4. **Given** essa primeira pergunta, **When** o HUD entra em `perguntando`, **Then** o enunciado é exatamente **“Qual mão você tem agora?”**, há **exatamente 6** rótulos distintos da tabela canônica, seleção única, sem **Confirmar**, e a certa é a melhor categoria das 7 cartas do herói (2 hole + 5 comunitárias) (contrato 5.3, RN-013/028, CA-013, CA-027).
5. **Given** o herói no river, **When** se conta as perguntas de categoria do herói nesta street, **Then** há **exatamente uma** — esta — e **não** uma segunda “mão atual” nem uma 5.4 (CA-027, RN-G002).
6. **Given** a melhor 5 do herói usa 0 hole (as 5 comunitárias vencem qualquer combinação com 1 ou 2 hole), **When** o quiz avalia, **Then** a certa é a categoria dessa mesa; jogar o board é legal (RN-028).
7. **Given** o acerto nesta pergunta e o beat encerrado, **When** a mesa avança, **Then** segue **“Qual mão o Adversário A completou?”** — **não** há upgrades, **não** há **Continuar** de skip de upgrade e **não** se repete a mão do herói.
8. **Given** o river ainda voando ou A/B ainda virando, **When** o treinando tenta responder, **Then** o HUD permanece em `deal` sem opções clicáveis.

---

### User Story 2 - Identificar as mãos de A e de B, uma de cada vez (Priority: P1)

Depois de acertar a mão do herói no river, o HUD pergunta **“Qual mão o Adversário A completou?”**. A certa é a melhor 5 de A (2 hole de A + as 5 comunitárias). O contrato é o mesmo da 5.3: 6 rótulos canônicos, clique submete, retry. Só depois do acerto de A aparece **“Qual mão o Adversário B completou?”**, com o mesmo contrato na melhor 5 de B. As duas perguntas **não** aparecem juntas. Cada uma grava a própria 1ª tentativa em `mao_atual` na categoria **correta daquele jogador**. Board que joga para todos implica a **mesma** categoria nas três perguntas.

**Why this priority**: CA-019 e RN-028. Sem isto o treinando nunca lê as mãos abertas dos adversários; o pote ainda não pode ser cobrado.

**Independent Test**: Montar um river em que A tem Flush e o herói tem Par; na pergunta de A a única certa é **Flush**, com 6 opções e retry. Percorrer herói → A → B: uma pergunta por vez; B não aparece antes do acerto de A.

**Acceptance Scenarios**:

1. **Given** a mão do herói no river **ainda não** acertada, **When** o treinando olha o HUD, **Then** **não** há pergunta de A, **não** há pergunta de B e **não** há “quem ganhou” (RN-G001, RN-G002).
2. **Given** a mão do herói acertada e o beat encerrado, **When** o HUD avança, **Then** o enunciado é exatamente **“Qual mão o Adversário A completou?”**, 6 rótulos canônicos distintos incluindo a certa, seleção única, e a certa é a melhor 5 de A (2 hole de A + 5 comunitárias) (RN-028, CA-013).
3. **Given** Adversário A com Flush e herói com Par, **When** a pergunta da mão de A aparece, **Then** a única certa é **Flush**, há 6 opções e o treinando retenta até acertar (CA-019).
4. **Given** a mão de A **ainda não** acertada, **When** o treinando procura a mão de B ou o vencedor, **Then** essas perguntas **não** estão no HUD.
5. **Given** a mão de A acertada e o beat encerrado, **When** o HUD avança, **Then** o enunciado é exatamente **“Qual mão o Adversário B completou?”**, com o mesmo contrato 5.3 na melhor 5 de B.
6. **Given** um board que joga para todos (ex.: royal nas cinco comunitárias), **When** as três perguntas de categoria aparecem, **Then** a certa é o **mesmo** rótulo canônico nas três (RN-028).
7. **Given** A e B com categorias diferentes, **When** se comparam as duas perguntas, **Then** cada uma tem a própria certa (a de A não vale como certa na de B) e cada 1ª tentativa é uma exposição independente em `mao_atual` (RN-038).
8. **Given** qualquer uma das três perguntas de categoria, **When** as opções aparecem, **Then** **não** há kicker, “par de reis”, naipe por extenso nem sinônimo fora dos 10 rótulos (RN-016, RN-G004).

---

### User Story 3 - Dizer quem ganhou o pote, inclusive split (Priority: P1)

Só depois das três categorias acertadas o HUD pergunta **“Quem ganhou o pote?”**. Seleção única, clique submete, retry. A certa usa o **ranking completo** das três melhores 5 — categoria primeiro, depois os ranks que definem a mão (kickers por dentro). Empate verdadeiro (as 5 cartas efetivas iguais) divide o pote entre os empatados. As opções vêm do universo fixo de sete textos; a correta entra sempre; completa-se até **6** pela prioridade RN-031, sem repetir. Kickers **nunca** aparecem no texto. O gerador **não** evita boards que empatam.

**Why this priority**: É o objetivo do §5.5 e os critérios CA-020 / RN-029 / RN-031. Sem ranking completo o treino ensina o rótulo e erra o pote.

**Independent Test**: Empate verdadeiro herói vs A (mesmas 5 efetivas, B atrás): a certa é **Você e Adversário A**, o conjunto tem 6 textos do universo, a ordem visual não é constante entre perguntas novas. Um único vencedor com kicker melhor **não** empata só porque a categoria é a mesma.

**Acceptance Scenarios**:

1. **Given** qualquer uma das três categorias do river ainda não acertada, **When** o treinando procura “quem ganhou”, **Then** o HUD simplesmente **não** mostra essa pergunta.
2. **Given** as três categorias acertadas e o beat de B encerrado, **When** o HUD avança, **Then** o enunciado é exatamente **“Quem ganhou o pote?”**, seleção única, sem **Confirmar**, e as opções são textos do universo RN-030 — **não** rótulos de categoria.
3. **Given** essa pergunta, **When** as opções aparecem, **Then** há **exatamente 6** textos distintos do universo de 7, a correta está inclusa, o conjunto (ignorando a ordem dos botões) segue a prioridade RN-031, e a ordem visual está embaralhada (RN-031, RN-G008).
4. **Given** empate verdadeiro herói vs A (mesmas 5 cartas efetivas) e B atrás, **When** “quem ganhou” aparece, **Then** a única certa é **Você e Adversário A** (CA-020).
5. **Given** as 5 comunitárias são a melhor 5 dos três (board que joga para todos, mesmas 5 efetivas), **When** se avalia o pote, **Then** a certa é **Os três empatam**.
6. **Given** os três com a **mesma** categoria e o herói com kicker estritamente melhor, **When** se avalia o pote, **Then** a certa é **Você** — empate de rótulo **não** empata o pote (RN-029, RN-G004).
7. **Given** um único vencedor (Você, A ou B), **When** o treinando acerta de primeira ou após retry, **Then** o HUD vai a `resultado` depois do beat (CA-021).
8. **Given** o enunciado e as opções de “quem ganhou”, **When** o treinando lê o texto, **Then** há 0 kickers, 0 ranks (“par de ases”) e 0 categorias RN-014 como opção (RN-G004).
9. **Given** várias mãos cujo board empata dois ou três, **When** essas mãos ocorrem, **Then** o gerador **não** as substitui por um board que evite o empate (RN-G003).

---

### User Story 4 - Ver o desfecho e seguir com Próxima mão (Priority: P1)

Ao acertar quem ganhou, o HUD vai a `resultado`. A mesa destaca o(s) vencedor(es), o bolo de fichas caminha até o assento único ou **divide-se visualmente** no split, e as três categorias já acertadas podem ser reiteradas pelos rótulos canônicos. O CTA é **Próxima mão**. Acioná-lo recolhe as cartas e distribui uma nova mão na mesma mesa, sem reload perceptível e sem quiz preflop.

**Why this priority**: CA-021 e o fechamento da sessão. Sem desfecho o acerto do pote não ensina; sem **Próxima mão** o ciclo da mesa quebra.

**Independent Test**: Acertar um vencedor único e ver destaque + fichas + **Próxima mão**. Acertar split herói vs A e ver o bolo dividir-se entre os dois. Acionar **Próxima mão** e confirmar novo deal na mesma mesa.

**Acceptance Scenarios**:

1. **Given** um único vencedor acertado, **When** o HUD vai a `resultado`, **Then** indica quem levou com o texto canônico RN-030, destaca esse assento, as fichas caminham até ele, reitera as três categorias já identificadas e habilita **Próxima mão** (CA-021).
2. **Given** empate verdadeiro herói vs A acertado, **When** o desfecho aparece, **Then** o resultado celebra o empate (não um único champion), as fichas se dividem visualmente entre **Você** e **Adversário A**, e **Próxima mão** está habilitado (CA-020).
3. **Given** **Os três empatam** acertado, **When** o desfecho aparece, **Then** os três assentos são celebrados e o bolo divide-se visualmente entre os três — sem valores em bb e sem contabilidade.
4. **Given** o HUD em `resultado`, **When** o treinando lê as três categorias reiteradas, **Then** são exatamente os três rótulos RN-014 já acertados (herói, A, B), sem kicker e sem “par de reis”.
5. **Given** o fim da rodada em `resultado`, **When** o treinando aciona **Próxima mão**, **Then** a mesa permanece, as cartas são recolhidas e uma nova mão é distribuída, de novo sem quiz preflop (CA-005, RN-043).
6. **Given** `resultado` ou `ociosa`, **When** o treinando procura um botão **Embaralhar**, **Then** esse nome de CTA **não** existe.

---

### User Story 5 - Errar, tentar de novo e gravar só a primeira vez (Priority: P2)

O contrato de retry da 003 vale nas quatro perguntas. Errou: **“Não é essa. Tente de novo.”**, opção morta no lugar, certa não revelada. Cada uma das três categorias incrementa `mao_atual` da categoria **correta daquele jogador** na 1ª tentativa. “Quem ganhou” incrementa o único grupo `vencedor_pote` — sem dez categorias. Retry posterior não altera contadores. Não há “pular pergunta” nem botão que mostre a resposta.

**Why this priority**: RN-032, RN-038, RN-G005. Sem isto o showdown treina e esquece, ou vaza a resposta.

**Independent Test**: Errar de primeira a mão de A (certa Flush) e depois acertar: Flush em `mao_atual` tem +1 erro e +0 acerto. Errar de primeira o vencedor e depois acertar: `vencedor_pote` tem +1 erro; nenhuma categoria RN-014 muda por essa pergunta.

**Acceptance Scenarios**:

1. **Given** um erro na primeira opção de qualquer uma das quatro perguntas, **When** o treinando olha o HUD, **Then** o texto é **“Não é essa. Tente de novo.”**, a opção errada está desabilitada no mesmo lugar, a certa **não** foi nomeada e a pergunta **não** avançou (RN-035, RN-G005).
2. **Given** chute **Par** quando a certa de A é **Flush**, **When** se lê a memória, **Then** o erro foi em **Flush** em `mao_atual`, não em Par (RN-019, RN-038).
3. **Given** as três perguntas de categoria do mesmo river, **When** se lêem as 1ªs tentativas, **Then** há **três** exposições independentes em `mao_atual`, cada uma na categoria correta **daquele** jogador — mesmo que dois jogadores compartilhem o rótulo (RN-038).
4. **Given** a primeira tentativa de “quem ganhou”, **When** é acerto ou erro, **Then** incrementa-se só `vencedor_pote` (um grupo); **não** há dez categorias nesse bucket e **não** se incrementa `mao_atual` por essa pergunta (RN-032).
5. **Given** erro depois acerto na mesma pergunta, **When** se lê a exposição, **Then** aquela pergunta tem +1 erro e +0 acerto; tentativas seguintes não alteram contadores.
6. **Given** a pergunta em curso, **When** o treinando procura “pular” ou “mostrar resposta”, **Then** isso **não** existe.
7. **Given** recarregar no meio do showdown depois de pelo menos uma 1ª tentativa, **When** o HUD volta a `ociosa`, **Then** a mão aborta e os contadores já gravados nesta visita **permanecem**.

---

### User Story 6 - Ler ranking completo, wheel, wrap e royal no pote (Priority: P2)

O treinando encontra os extremos que o stub escondia. Royal no board é **Royal flush** para os três e **Os três empatam**. Wheel (A-2-3-4-5) é sequência legal com topo 5 e perde para um six-high. Wrap (K-A-2-3-4) não é straight. Dois flushes com o mesmo rótulo decidem-se pelos cinco ranks, sem o naipe desempatar. A UI continua mostrando só categorias e textos de pote.

**Why this priority**: RN-015, RN-029 e RN-046. Sem estes casos o motor mente no showdown mesmo acertando o rótulo.

**Independent Test**: Percorrer (ou montar) rivers com royal na mesa, wheel vs six-high, wrap que não é straight, e dois flushes de ranks diferentes; conferir categoria e vencedor, com 0 kickers na UI.

**Acceptance Scenarios**:

1. **Given** as 5 comunitárias são A-K-Q-J-10 do mesmo naipe, **When** as três perguntas de categoria e o pote são avaliados, **Then** as três certas de categoria são **Royal flush** (nunca **Straight flush**) e a certa do pote é **Os três empatam** (RN-015, RN-028, RN-029).
2. **Given** A-2-3-4-5 de naipes mistos como melhor 5 de um jogador e 2-3-4-5-6 como melhor 5 de outro, **When** se compara o pote, **Then** o six-high vence (wheel vale 5 no topo) e as categorias são ambas **Straight**.
3. **Given** as únicas “quase sequências” de um jogador são wrap (K-A-2-3-4 e afins), **When** se avalia a categoria, **Then** isso **não** conta como **Straight** nem como **Straight flush**; a certa é a melhor categoria que realmente existe.
4. **Given** dois jogadores com **Flush** e ranks efetivos diferentes, **When** se avalia o pote, **Then** vence quem tem a melhor sequência de cinco ranks; o naipe **não** desempatar; a UI das duas perguntas de categoria mostra só **Flush**.
5. **Given** dois jogadores com a mesma categoria e os mesmos ranks efetivos (naipes diferentes), **When** se avalia o pote, **Then** esses dois empatam — naipe **não** quebra empate.
6. **Given** A-2-3-4-5 do mesmo naipe como melhor 5, **When** o quiz de categoria avalia, **Then** a certa é **Straight flush**, nunca **Royal flush**.

---

### Edge Cases

- Sempre existe exatamente uma melhor categoria por jogador nas 7 cartas (2 hole daquele jogador + 5 comunitárias). MUST NOT haver skip em nenhuma das quatro perguntas.
- Melhor 5 no river MAY usar 0, 1 ou 2 hole cards. As 5 comunitárias sozinhas são legais quando vencem as combinações com hole.
- Board que joga para todos: mesma categoria nas três perguntas; o pote empata os três **somente** se as 5 efetivas também empatam (quase sempre, quando as cinco da mesa são a melhor 5 de cada um). Se um jogador monta uma 5 estritamente melhor que a mesa, ele vence mesmo com board “forte”.
- Mesma categoria, kickers diferentes: um único vencedor (ou split só entre os que empatam o ranking completo). O rótulo do quiz de categoria não muda.
- Empate de dois: os textos **Você e Adversário A**, **Você e Adversário B** ou **Adversário A e Adversário B**. Empate dos três: **Os três empatam**. MUST NOT existir “empate” genérico fora desses quatro textos.
- Universo de pote tem 7 textos; cada pergunta exibe 6. A sétima (a de menor prioridade que sobrou) **não** aparece e **não** é cobrada.
- Se a correta for **Os três empatam**, ela entra no passo inicial e as outras 5 seguem a lista RN-031 a partir de **Você** — **Adversário A e Adversário B** fica de fora.
- Se a correta for qualquer uma das outras seis, **Os três empatam** é o 7º da lista e fica de fora.
- Royal e straight flush nunca empatam no rótulo: royal ganha o nome **Royal flush**. Dois royais (mesmos cinco ranks) empatam no pote; naipe não desempatar.
- Wheel é sequência legal; wrap é ilegal, inclusive suited (não é straight flush).
- Distratoras das três perguntas de categoria usam o **board de 5 comunitárias**, nunca as hole do jogador da pergunta. A heurística é a mesma da 004, agora com cinco cartas de board.
- Categoria tentadora que **é** a certa: conta como a correta, não como distratora extra.
- Preenchimento de cima para baixo **não** filtra “impossível” com o board. “Ainda possível” é da 005 e **não** ocorre no river.
- As quatro perguntas **nunca** aparecem juntas (RN-G001). Tentar o vencedor antes das três categorias: o HUD simplesmente ainda não mostra “quem ganhou”.
- Recarregar no meio do showdown: a mão aborta (casco); contadores já gravados permanecem. MUST NOT pedir dado pessoal para retomar.
- Armazenamento indisponível: o quiz e a comparação do pote seguem; a evolução MAY perder-se ao fechar (fail-open da 003).
- Se a classificação de uma das três mãos ou a comparação do pote não puder ser concluída, a mão aborta: HUD `ociosa` + **Nova mão**. MUST NOT inventar vencedor, MUST NOT fingir **Os três empatam**, MUST NOT persistir cartas nem dump da comparação.
- Clique em morta / fora das opções: ignora.
- Preferência por reduzir movimento: o contrato de correção não depende de animação; virada e caminhada de fichas MAY cortar para o estado final; o beat de acerto permanece o da 003.
- MUST NOT persistir cartas, Melhor5, chave de desempate, pool de cursor, enunciado, carimbo de data/hora ou identificador pessoal. Só os deltas já definidos em `mao_atual` (três exposições) e `vencedor_pote` (uma exposição).
- Áudio de virada de showdown, acerto e erro permanece o da 001 (fail-open). Esta feature **não** adiciona mute nem trilha.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Depois de o turn estar completo (mão atual acertada e upgrades ou skip encerrados), a mesa MUST abrir o river no slot 5 e, em seguida, virar as hole cards de **Adversário A** e **Adversário B** nos respectivos assentos. O HUD MUST permanecer em `deal` sem opções clicáveis até a virada terminar. MUST NOT habilitar a primeira pergunta com A ou B ainda fechados (RN-005, CA-018).
- **FR-002**: Quando a primeira pergunta do showdown aparecer, as 6 hole cards e as 5 comunitárias MUST estar face-up nos lugares certos (CA-018, RN-033). Burns cênicos MUST NOT entrar no board nem nas 7 cartas de ninguém.
- **FR-003**: O river MUST apresentar **exatamente quatro** perguntas, nesta ordem, cada uma só depois da anterior acertada e do beat encerrado: (1) mão do herói, (2) mão de A, (3) mão de B, (4) quem ganhou o pote. MUST haver no máximo uma pergunta por vez (RN-G001). MUST NOT existir pergunta de upgrades (5.4) no river (RN-G002).
- **FR-004**: A pergunta do herói no river MUST ser a **única** identificação de categoria do herói nesta street. O enunciado MUST ser exatamente **“Qual mão você tem agora?”**. MUST NOT haver uma segunda pergunta de mão atual do herói no river (CA-027).
- **FR-005**: O enunciado de A MUST ser exatamente **“Qual mão o Adversário A completou?”**. O enunciado de B MUST ser exatamente **“Qual mão o Adversário B completou?”**. O enunciado do pote MUST ser exatamente **“Quem ganhou o pote?”**.
- **FR-006**: Cada uma das três perguntas de categoria MUST reusar o contrato 5.3 já vigente: seleção única, clique submete, sem **Confirmar**, exatamente 6 rótulos distintos de RN-014 incluindo a certa, ordem visual embaralhada só ao apresentar a pergunta nova, retry até acertar, textos **“Não é essa. Tente de novo.”** / **“Você acertou”**, opção morta visível no lugar, certa só marcada como certa quando escolhida (RN-047, RN-034, RN-035, RN-036, RN-G005, RN-G008, CA-013).
- **FR-007**: A categoria correta de cada jogador MUST ser a da **melhor 5** usando as **2 hole daquele jogador + as 5 comunitárias**. A melhor 5 MAY usar 0, 1 ou 2 hole cards. MUST existir exatamente uma melhor categoria por jogador. MUST NOT haver skip, “não sei” nem avançar sem acertar (RN-028, RN-013).
- **FR-008**: A classificação MUST reusar o critério de melhor 5 já vigente (feature 004): as dez categorias canônicas com rótulo exato **Royal flush**, **Straight flush**, **Quadra**, **Full house**, **Flush**, **Straight**, **Trinca**, **Dois pares**, **Par**, **Carta alta**; royal ≠ straight flush; wheel legal (A-2-3-4-5, Ás baixo); wrap ilegal (qualquer 5 ranks que só seriam consecutivos com Ás alto e baixo ao mesmo tempo); ranking interno com as cinco cartas + categoria + ranks de kicker. O HUD MUST exibir só o rótulo. Kickers MUST NEVER aparecer na UI (RN-014, RN-015, RN-016, RN-046, RN-G004).
- **FR-009**: O conjunto das 6 opções de cada pergunta de categoria (sem a ordem visual) MUST ser determinístico para o mesmo jogador e as mesmas 7 cartas, montado com a heurística RN-017 já especificada na 004, com a seguinte adaptação de street: o **board** das tentadoras MUST ser as **5 comunitárias**, nunca as hole do jogador da pergunta. Vizinhas, tentadoras de naipe/conexão/pares/trinca e preenchimento de cima para baixo MUST seguir a mesma ordem e as mesmas definições de conectado, pareado e 3+ do mesmo rank da 004. MUST NOT usar “ainda possível” da 005. MUST NOT haver menos de 6.
- **FR-010**: Quando a melhor 5 de cada um dos três for a mesma combinação efetiva das 5 comunitárias (board que joga para todos), as três perguntas de categoria MUST ter o **mesmo** rótulo correto (RN-028). A igualdade de categoria MUST NOT, por si só, decidir o pote — o pote só empata se a chave RN-029 também empatar (FR-011).
- **FR-011**: O vencedor do pote MUST ser decidido pelo **ranking completo** de Texas Hold’em sobre as 5 cartas da melhor mão de cada um, nesta ordem: (1) categoria RN-014 da mais forte para a mais fraca; (2) se a categoria empatar, os ranks que definem a mão, do mais significativo ao menos: **Royal flush** — os cinco ranks são sempre A-K-Q-J-10 (empate se dois ou três tiverem royal); **Straight flush** — topo da sequência, wheel vale 5; **Quadra** — rank da quadra, depois kicker; **Full house** — rank da trinca, depois rank do par; **Flush** — os cinco ranks do mais alto ao mais baixo; **Straight** — topo da sequência, wheel vale 5; **Trinca** — rank da trinca, depois os dois kickers do mais alto ao mais baixo; **Dois pares** — par maior, par menor, kicker; **Par** — rank do par, depois os três kickers do mais alto ao mais baixo; **Carta alta** — os cinco ranks do mais alto ao mais baixo. Se as 5 cartas efetivas (essa chave de comparação) forem iguais, esses jogadores **empatam** e o pote divide-se entre eles (RN-029). Naipe MUST NOT desempatar.
- **FR-012**: O universo de enunciados de “quem ganhou” MUST ser **exatamente** estes sete textos, sem sinônimo: **Você**; **Adversário A**; **Adversário B**; **Você e Adversário A**; **Você e Adversário B**; **Adversário A e Adversário B**; **Os três empatam** (RN-030). MUST NOT haver opção “empate” genérica, nome de categoria ou kicker nessa pergunta.
- **FR-013**: A pergunta do pote MUST exibir **exatamente 6** textos distintos do universo. A correta MUST entrar sempre. As demais MUST ser preenchidas, **sem repetir**, nesta prioridade, pulando a que já é a correta se ela já está inclusa: (1) Você (2) Adversário A (3) Adversário B (4) Você e Adversário A (5) Você e Adversário B (6) Adversário A e Adversário B (7) Os três empatam. Se a correta for **Os três empatam**, ela entra no passo inicial e as outras 5 seguem a mesma lista a partir de (1). O texto de menor prioridade que não couber MUST NOT aparecer e MUST NOT ser cobrado. A ordem **visual** MUST ser embaralhada ao apresentar a pergunta nova e MUST NOT ser reembaralhada após erro. MUST NOT reembaralhar o baralho da mão ao embaralhar opções (RN-031, RN-G008).
- **FR-014**: A pergunta do pote MUST ser seleção única, clique submete, sem **Confirmar**, retry até acertar, com o mesmo contrato visual da 003 (RN-047, RN-G005).
- **FR-015**: Só a **primeira** tentativa de cada uma das três perguntas de categoria MUST alterar `mao_atual`, na categoria **correta daquele jogador** (acerto ou erro), imediatamente. Chutar um rótulo distrator MUST NOT incrementar esse rótulo. As três exposições MUST ser independentes. MUST NOT fundir deltas só porque dois jogadores compartilham o rótulo (RN-038, RN-019).
- **FR-016**: Só a **primeira** tentativa de “quem ganhou” MUST alterar `vencedor_pote` (acerto ou erro). Esse bucket MUST permanecer um único grupo — MUST NOT ter dez categorias. Tentativas seguintes MUST NOT alterar contadores. Esta pergunta MUST NOT alterar `mao_atual` nem `upgrade` (RN-032).
- **FR-017**: Dado o acerto do vencedor e o beat encerrado, o HUD MUST ir a `resultado`: texto canônico de quem levou (RN-030), destaque visual no(s) assento(s) vencedor(es), caminhada do bolo de fichas até o vencedor único **ou** divisão visual entre os empatados, reiteração das três categorias já identificadas (rótulos RN-014) e CTA **Próxima mão** (CA-021, CA-020). MUST NOT exibir valores em bb, contabilidade, kicker ou chave de desempate.
- **FR-018**: **Próxima mão** MUST recolher as cartas e distribuir uma nova mão na mesma mesa, sem reload perceptível e de novo sem quiz preflop. MUST NOT usar “Embaralhar” como nome de botão (RN-043, CA-005).
- **FR-019**: O gerador da mão MUST NOT evitar boards que empatam dois ou três jogadores. Empates de pote MUST fazer parte do treino (RN-G003).
- **FR-020**: Cada um dos sete textos RN-030 MUST ser a resposta correta do pote em pelo menos um showdown alcançável. Cada um dos dez rótulos RN-014 MUST ser a certa de pelo menos um jogador (herói, A ou B) em algum river.
- **FR-021**: MUST NOT persistir cartas, Melhor5, ranks de kicker, chave de desempate, enunciado, opções, pool de cursor, carimbo de data/hora, identificador de sessão ou qualquer dado pessoal. O único efeito persistido desta feature MUST ser o delta de 1ª tentativa em `mao_atual` (três perguntas) e em `vencedor_pote` (uma pergunta), no mesmo bloco de evolução já definido — sem novos buckets, sem relatório, sem botão zerar.
- **FR-022**: Toda interface visível desta feature (enunciados, 10 rótulos, 7 textos de pote, feedback herdado, desfecho, CTAs) MUST estar em português brasileiro, com termos de clube flop/turn/river/showdown permitidos. Apelidos MUST permanecer **Você**, **Adversário A**, **Adversário B**.
- **FR-023**: MUST NOT introduzir apostas, quiz preflop, desistir da mão, mute na UI, cadastro, login, multiplayer, relatório visual, botão zerar, draws nomeados, nem alterar a honestidade do baralho ou o contrato de upgrades da 005.
- **FR-024**: Se a memória de treino falhar, a virada, as quatro perguntas e o desfecho MUST continuar; a evolução MAY perder-se ao fechar. MUST NOT haver `alert()` nem jargão que bloqueie o HUD.
- **FR-025**: Se a classificação de qualquer uma das três mãos ou a comparação do pote não puder ser concluída, a mesa MUST abortar a mão: HUD `ociosa` + **Nova mão**. MUST NOT inventar categoria, MUST NOT inventar vencedor, MUST NOT fingir lista vazia nem **Os três empatam** por falha. Contadores já gravados nesta visita MUST permanecer. MUST NOT persistir dump da comparação.
- **FR-026**: Esta feature MUST substituir as corretas stub do river (herói Flush, A/B Par, vencedor provisório). MUST NOT redesenhar a identificação da mão atual do flop/turn (004) nem os upgrades (005). MUST NOT alterar `upgrade` por causa do showdown.
- **FR-027**: Todos os CTAs visíveis desta feature (**Próxima mão**, e **Nova mão** se a mão abortar) e as opções das quatro perguntas MUST permanecer alcançáveis por Tab e ativáveis com Enter/Espaço, com foco visível, como no casco. Ao abrir cada pergunta, o foco MUST ir para a primeira opção na ordem visual.
- **FR-028**: Preferência por reduzir movimento MUST permitir que a virada e a caminhada/divisão de fichas apareçam já no estado final; o quiz MUST tratar as cartas como abertas. O beat de acerto MUST permanecer o já vigente (≤1 s; 0 s se movimento reduzido).

### Key Entities

- **Showdown**: momento em que o river já pousou e as 6 hole + 5 comunitárias estão abertas. Atributos: as 11 cartas de jogo, as três melhores 5, o conjunto vencedor do pote. Não inclui burns cênicos.
- **Melhor 5 de um jogador**: combinação vencedora de 5 cartas entre as 7 daquele jogador (2 hole + 5 comunitárias). Atributos: as cinco cartas, a categoria canônica, os ranks de desempate. O HUD consome só a categoria nas perguntas 1–3.
- **Cinco cartas efetivas**: a chave de comparação RN-029 da melhor 5 (categoria + ranks que definem a mão). Iguais ⇒ empate daqueles jogadores. Naipe não faz parte da chave.
- **Pergunta de categoria do river**: exposição de seleção única no HUD (herói, A ou B). Enunciado canônico daquele assento, 6 rótulos RN-014, uma correta. Três exposições independentes em `mao_atual`.
- **Pergunta do pote**: exposição de seleção única no HUD, enunciado **“Quem ganhou o pote?”**, 6 textos RN-030, uma correta. Uma exposição em `vencedor_pote`.
- **Universo de pote**: os 7 textos fixos de RN-030. O conjunto exibido é um recorte de 6 pela prioridade RN-031.
- **Conjunto vencedor**: um, dois ou três assentos cuja chave RN-029 é máxima e empatada entre si. Mapeia 1-para-1 a um texto RN-030.
- **Desfecho**: estado `resultado` após acertar o pote. Atributos: texto de quem levou, assentos destacados, movimento do pote cênico (caminha ou divide), três rótulos já acertados, CTA **Próxima mão**.
- **Primeira tentativa**: o primeiro clique que submete naquela pergunta; único evento que altera o bucket correspondente.

### Fora de escopo (esta feature)

- Casco da mesa, estados do HUD, deal, burns cênicos, áudio, **Próxima mão** como CTA de sessão (já na 001) — esta feature **consome** a virada e o `resultado` e só torna **autoritativos** o conteúdo, a correção e o desfecho visual do pote.
- Embaralhamento e as 11 cartas honestas (feature 002) — MUST NOT passar a evitar empates.
- Contrato de retry, feedback, ordem visual e persistência dos três buckets (feature 003) — esta feature **consome** esse contrato e só troca a correção do river.
- Identificação da mão atual do herói no flop e no turn (feature 004).
- Enumeração de upgrades no flop/turn (feature 005) — **não** ocorre no river.
- Tela de relatório, botão zerar, apostas, quiz preflop, login, multiplayer, draws nomeados, outras variantes, mais de três jogadores.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das mãos que chegam à primeira pergunta do river, as 6 hole cards e as 5 comunitárias estão face-up nos lugares certos (CA-018).
- **SC-002**: Em 100% dos rivers, há exatamente **uma** pergunta de categoria do herói e **zero** perguntas de upgrades (CA-027).
- **SC-003**: Dado Adversário A com Flush e herói com Par, em 100% desses showdowns a certa da pergunta de A é **Flush**, com 6 opções e retry até acertar (CA-019).
- **SC-004**: Dado empate verdadeiro herói vs A (mesmas 5 efetivas, B atrás), em 100% dos casos a certa de “quem ganhou” é **Você e Adversário A** e, após o acerto, as fichas se dividem visualmente entre os dois (CA-020).
- **SC-005**: Dado um único vencedor acertado, em 100% dos casos o HUD vai a `resultado`, indica quem levou e habilita **Próxima mão** (CA-021).
- **SC-006**: Em 100% das três perguntas de categoria do river, há exatamente 6 rótulos distintos da tabela canônica, incluindo o correto, e em qualquer sequência de 10 perguntas novas a certa **não** ocupa a mesma posição em todas (CA-013, RN-G008).
- **SC-007**: Em 100% das perguntas do pote, há exatamente 6 textos distintos do universo de 7, a correta está inclusa, o conjunto obedece RN-031 e 0 kickers / 0 categorias aparecem como opção.
- **SC-008**: Em 100% dos boards em que as 5 comunitárias são royal, as três certas de categoria são **Royal flush** e a certa do pote é **Os três empatam**.
- **SC-009**: Em 100% dos casos em que dois jogadores têm a mesma categoria e um tem kicker estritamente melhor, o pote tem um único vencedor (não split).
- **SC-010**: Em 100% dos wheels vs six-high no pote, o six-high vence; em 100% dos wraps como única “quase sequência”, a categoria **não** é **Straight** nem **Straight flush**.
- **SC-011**: Em 100% das 1ªs tentativas das três categorias, `mao_atual` incrementa só a categoria correta **daquele** jogador; em 100% das 1ªs tentativas do pote, só `vencedor_pote` muda (RN-038, RN-032).
- **SC-012**: Em 100% dos erros de primeira nas quatro perguntas, a opção errada fica desabilitada no lugar, o HUD pede nova tentativa sem revelar a certa, e o contador correspondente já registrou erro antes do segundo clique.
- **SC-013**: Em 100% dos acertos da mão do herói no river, a mesa segue para a pergunta de A; 0 desses acertos abrem upgrades ou repetem a mão do herói.
- **SC-014**: Em 100% das tentativas de ver “quem ganhou” antes das três categorias, essa pergunta **não** está visível.
- **SC-015**: Cada um dos 7 textos RN-030 é a certa do pote em ≥1 showdown; cada um dos 10 rótulos RN-014 é a certa de ≥1 jogador em algum river.
- **SC-016**: Em 100% dos desfechos, há 0 valores em bb, 0 kickers e 0 chaves de desempate visíveis; split de dois ou três celebra empate, não um único champion.
- **SC-017**: Em 100% das UIs desta feature, enunciados e opções têm 0 kickers, 0 “par de reis” e 0 sinônimos fora dos rótulos/textos canônicos.
- **SC-018**: 0 coletas de dado pessoal; 0 persistência de cartas, Melhor5, kicker ou replay; o único efeito que sobrevive ao fechar a aba continua sendo a evolução de treino já definida.
- **SC-019**: Em 100% das falhas de classificação ou comparação do pote, o HUD volta a `ociosa` com **Nova mão**; 0 vencedores inventados; 0 dumps persistidos.
- **SC-020**: Em 100% das mãos que concluem o showdown, acionar **Próxima mão** inicia um novo deal na mesma mesa sem quiz preflop e sem reload perceptível.
- **SC-021**: Em 100% das perguntas novas desta feature, o foco de teclado começa na primeira opção visual; após erro, 100% das retries mantêm a ordem dos botões.

## Assumptions

- **Git / numeração**: o diretório da feature é `specs/006-showdown-vencedor/` (ShortName `showdown-vencedor`, número **006**, sequential). Não há `.specify/extensions.yml` nem hook `before_specify`; o repositório permanece em `main` (pedido explícito). Identidade da spec: `006-showdown-vencedor`. O campo `BRANCH_NAME` do script de bootstrap é só o slug do diretório — **não** se criou branch Git. **Não** houve commit nesta invocação.
- **Fonte de verdade**: comportamento desta spec = PRD §5.5 (RN-028, RN-029, RN-030, RN-031, RN-032, RN-033, RN-038, CA-018, CA-019, CA-020, CA-021, CA-027) + contrato 5.3 reusado (RN-013, RN-014, RN-015, RN-016, RN-017, RN-018, RN-019, RN-046, CA-013) + RN-G001, RN-G002, RN-G003, RN-G004, RN-G005, RN-G008 + contrato de quiz/persistência da feature 003 + avaliador de melhor 5 da feature 004 + cadência e virada da feature 001 + gates da constitution (idioma, LGPD, custo zero, treino e não jogo, fail-open). Nenhum `[NEEDS CLARIFICATION]` residual.
- **Escolha autônoma — copy do herói no river**: o fluxo narrativo do §5.5 diz “Qual mão você completou?”; o contrato 5.3 e o casco 001 já fixam **“Qual mão você tem agora?”** como 1ª pergunta do river. Adotado: manter **“Qual mão você tem agora?”** para o herói (reuso literal do 5.3) e **“completou”** só nos enunciados de A e B já gravados na 001.
- **Escolha autônoma — ranking que o PRD não lista por extenso**: RN-029 detalha quadra, full house, flush, straight, dois pares, par e carta alta. Completado pelo desempate padrão de Hold’em: **Trinca** = rank da trinca + dois kickers; **Straight flush** = topo (wheel = 5); **Royal flush** = sempre A-K-Q-J-10 (empate se mais de um tiver royal). Naipe **não** desempatar em categoria alguma. Alinha-se ao ADR-003 e a CA-020.
- **Escolha autônoma — “5 cartas efetivas”**: empate verdadeiro = a chave RN-029 (categoria + ranks que definem a mão) é idêntica, não necessariamente as mesmas peças físicas. Dois jogadores que jogam a mesma mesa, ou que formam a mesma chave com hole diferentes, empatam.
- **Escolha autônoma — RN-031 sempre 6**: o universo tem 7 textos; “sempre 6 quando o universo permitir” implica **sempre 6** nesta pergunta. A sétima de menor prioridade fica de fora e não é cobrada. Conjunto determinístico para a mesma resposta correta.
- **Escolha autônoma — distratoras no river**: reusa RN-017 da 004 com board = 5 comunitárias. As hole do jogador da pergunta **não** entram como textura tentadora (mesmo recorte “board ≠ hole” da 004). Não se inventa heurística nova.
- **Escolha autônoma — motor do pote**: a 004 já classifica 7 cartas (cartas + categoria + kickers) e **não** comparava três jogadores. Esta feature **reusa** esse critério em cada assento e acrescenta a comparação do pote (vencedor único ou split de dois/três), inclusive quando o board joga para todos. Detalhe de implementação (nome interno da comparação) fica para `/speckit-plan`. Esta spec descreve o **quê**.
- **Escolha autônoma — falha de comparação**: abortar a mão (`ociosa` + **Nova mão`), no mesmo espírito da falha de montagem (002) e da falha de enumeração (005). Inventar vencedor ou fingir empate treinaria a lição errada. Fail-open de áudio/storage **não** autoriza mentir no quiz.
- **Escolha autônoma — cobertura**: os 7 textos de pote e as 10 categorias precisam ser a certa em pelo menos um caso, no mesmo espírito da 004/005, para o stub não sobreviver em algum canto.
- **Escolha autônoma — foco**: primeira opção visual ao abrir cada pergunta, alinhado ao HUD `perguntando` da 001/003/005.
- **Escolha autônoma — desfecho**: reiterar as três categorias já acertadas com os rótulos RN-014; destacar assento(s); fichas caminham ou se dividem. Sem bb. Herda o pote cênico da 001; esta feature torna o destino das fichas **autoritativo** (único vs split).
- **Dependências**: 001 (palco, virada, estados, **Próxima mão**, teclado), 002 (11 cartas honestas; burns não consomem; gerador não evita empate), 003 (clique-submete, retry, G008, `mao_atual` / `vencedor_pote` na 1ª tentativa), 004 (melhor 5, RN-017, taxonomia), 005 (turn completo antes do river; 0 upgrades no river). Esta feature **não** redesenha esses contratos.
- **Stub que some**: as corretas provisórias do river (herói Flush, A/B Par, vencedor do casco) **deixam** de valer. A certa passa a ser a melhor 5 de cada um e o ranking completo do pote. A cadência de quatro passos e o `resultado` permanecem observáveis, agora autoritativos.
- **Copy canônica herdada**: herói = “Qual mão você tem agora?”; A = “Qual mão o Adversário A completou?”; B = “Qual mão o Adversário B completou?”; pote = “Quem ganhou o pote?”; acerto = “Você acertou”; erro = “Não é essa. Tente de novo.”; CTA de desfecho = **Próxima mão**. Sem sinônimos.
- **Privacidade**: apelidos fixos **Você**, **Adversário A**, **Adversário B**; avatares ilustrados. Recarregar aborta a mão e não apaga evolução já gravada. Coordenadas de ponteiro da 002 continuam só em memória da visita. Melhor5, kickers, chave de desempate e cartas MUST NOT ser persistidos.
- **Constitution como constraint**: sem backend, sem cadastro, custo zero, sem relatório/zerar, desktop-first, fail-open, RN-G001..G008. Comparar três mãos no cliente, sem lib de poker, já está decidido no **ADR-003**. Detalhe de implementação fica para `/speckit-plan`.
- **Idioma**: UI em pt-BR; identificadores internos podem estar em inglês.
- **Clarify / plan / tasks / implement**: esta invocação é só `/speckit-specify`. **Não** executa clarify/plan/tasks/implement, **não** altera código de produção e **não** cria commit. Diante de ambiguidade, adotou-se o padrão acima e registrou-se aqui.
