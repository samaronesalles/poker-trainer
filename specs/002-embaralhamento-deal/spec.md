# Feature Specification: Embaralhamento e distribuição das cartas

**Feature Branch**: `002-embaralhamento-deal`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "Implementar o ciclo de uma mão: baralho de 52, shuffle a cada rodada com Web Crypto + pool (cursor, data/hora, tick), mapeamento fixo RN-044 das 11 cartas de jogo, deal visível (A, B, herói), flop/turn/river abrindo só na street, burns só cênicos sem consumir carta, adversários fechados até o river, sem reembaralhar entre streets — conforme PRD §5.2 (RN-008, RN-009, RN-010, RN-011, RN-012, RN-044, RN-045, CA-006, CA-007, CA-008, CA-009)"

## User Scenarios & Testing *(mandatory)*

Esta feature substitui as **11 faces stub** do casco (feature 001) por um **baralho honesto de 52 cartas**. O valor é cada rodada parecer — e ser — uma mão nova, como um dealer humano com baralho completo, **antes** de qualquer pergunta. O palco, a cadência do HUD e o quiz stub já existem; aqui define-se **quais** cartas entram na mesa, **quando** cada street abre e **o que não pode** acontecer (reembaralhar no meio, queima que “come” carta, flop visível cedo demais).

### User Story 1 - Começar uma mão com baralho completo e imprevisível (Priority: P1)

O treinando aciona **Nova mão** (mesa ociosa) ou **Próxima mão** (desfecho). O sistema mistura fontes do próprio ambiente (pelo menos cursor, data/hora e relógio de alta resolução) e produz uma ordem nova do baralho padrão de 52. As 11 cartas de jogo são atribuídas pelo mapeamento fixo da rodada e o deal das hole cards começa. Não há ritual de “mexa o mouse para gerar caos”: a mesa não espera entropia extra.

**Why this priority**: Sem baralho completo e sem shuffle a cada rodada, o treino vicia num feltro previsível. É o objetivo do §5.2 e o critério CA-006.

**Independent Test**: Iniciar duas ou mais mãos seguidas a partir do casco já existente e conferir: 52 cartas possíveis, 11 de jogo distintas, conjuntos de 11 cartas não sistematicamente iguais entre rodadas, deal das hole cards sem a mesa travar à espera do ponteiro.

**Acceptance Scenarios**:

1. **Given** a mesa `ociosa`, **When** o treinando aciona **Nova mão**, **Then** uma permutação nova do baralho de 52 é feita **antes** do deal visível e as hole cards seguem o mapeamento da rodada (RN-008, RN-010, RN-044).
2. **Given** o HUD em `resultado`, **When** o treinando aciona **Próxima mão**, **Then** o baralho é refeito para **esta** rodada (não se reutiliza a ordem da mão anterior) e um novo deal começa na mesma mesa (RN-010).
3. **Given** duas rodadas seguidas, **When** se comparam as 11 cartas de jogo, **Then** elas não são sistematicamente iguais (CA-006).
4. **Given** o ponteiro ainda não se moveu nesta visita, **When** o treinando inicia a mão, **Then** o embaralhamento segue com data/hora e relógio; a UI **não** trava e **não** pede um gesto extra de “gerar aleatoriedade”.

---

### User Story 2 - Ver o deal das hole cards (A, B, Você) com cartas reais (Priority: P1)

As seis hole cards saem do baralho permutado — não de um conjunto stub nem de mãos pré-montadas. O deal visível cobre os três assentos: Adversário A, Adversário B e Você. Ao pousar, as de **Você** abrem; as de A e B permanecem fechadas. O flop ainda **não** está face-up e não há quiz.

**Why this priority**: O herói precisa ler as próprias cartas reais; os adversários precisam ter cartas reais (o showdown usará essas mesmas). É RN-012, RN-006/RN-005 do casco e CA-008.

**Independent Test**: Iniciar uma mão, observar o deal das hole cards na ordem visível A → B → herói, conferir herói aberto / adversários fechados, board ainda sem flop face-up e ausência de pergunta.

**Acceptance Scenarios**:

1. **Given** o embaralhamento da rodada concluído, **When** o deal das hole cards corre, **Then** Adversário A recebe as duas primeiras cartas de jogo, Adversário B as duas seguintes e **Você** as duas seguintes, conforme o mapeamento da rodada (RN-044, RN-012).
2. **Given** o deal das hole cards recém-concluído e o flop ainda não aberto, **When** o treinando olha o board, **Then** os três slots do flop **não** estão face-up e **não** há quiz (CA-008, RN-041 do casco).
3. **Given** as hole cards já pousaram, **When** o treinando olha os assentos, **Then** as duas de **Você** estão abertas e as de A e B estão fechadas (continuidade do casco; as faces agora são as do baralho real).
4. **Given** qualquer momento após o deal, **When** se listam as 6 hole cards, **Then** são seis cartas distintas do baralho padrão, sem coringa e sem repetir naipe+rank na mesma mão (RN-008, RN-009).

---

### User Story 3 - Abrir flop, turn e river só na street, sem reembaralhar (Priority: P1)

Depois do shuffle, flop, turn e river **já estão determinados**. O flop abre as três comunitárias (face-up) só quando a street flop começa. O turn abre exatamente a carta já reservada ao slot 4, sem alterar o flop. O river abre a carta já reservada ao slot 5. Não se mistura o baralho de novo entre streets.

**Why this priority**: Reembaralhar no meio da mão (ou “sortear” o turn na hora) quebra a honestidade do dealer e impede o treino de leitura sobre um board estável. É RN-011, CA-009 e o fluxo principal do §5.2.

**Independent Test**: Percorrer uma mão até o turn (cadência stub do casco basta) e conferir: flop só abre na street flop; no início do turn, a carta do slot 4 é a já mapeada como turn; o flop permanece igual.

**Acceptance Scenarios**:

1. **Given** as hole cards já pousaram, **When** o flop ainda não começou, **Then** as três cartas do flop existem só como reserva da rodada — não estão face-up nos slots (CA-008).
2. **Given** a street flop começa, **When** as três comunitárias abrem, **Then** ocupam os slots 1–3 com as três cartas já mapeadas como flop, face-up, sem sorteio extra (RN-011, RN-044).
3. **Given** o quiz do flop concluído (acerto da cadência do casco), **When** começa o turn, **Then** exatamente a carta reservada ao turn abre no slot 4, sem alterar as três do flop (CA-009).
4. **Given** o quiz do turn concluído, **When** começa o river, **Then** a carta reservada ao river abre no slot 5, sem alterar flop nem turn (RN-011).
5. **Given** uma mão em curso, **When** uma street avança, **Then** **não** há novo embaralhamento do baralho daquela mão (RN-011).

---

### User Story 4 - Confiar que as 11 cartas são distintas e que a queima não “come” carta (Priority: P2)

As 11 cartas de jogo (6 hole + 5 comunitárias) são sempre distintas e pertencem ao baralho francês padrão. As outras 41 daquela permutação **não** entram nesta mão. Se houver queima visual no turn ou no river, é só um verso teatral: não ocupa slot do board e não consome uma 12ª carta de jogo.

**Why this priority**: Uma 12ª carta “queimada” de verdade mudaria o board e mentiria sobre o mapeamento. É RN-045, RN-G007 e CA-007.

**Independent Test**: Completar o deal e as três streets; listar as 11 cartas visíveis de jogo; se a queima aparecer, confirmar que é verso cênico e que as 11 permanecem as mesmas.

**Acceptance Scenarios**:

1. **Given** o deal, **When** se listam as 11 cartas de jogo (6 hole + 5 board), **Then** todas são distintas e pertencem ao baralho padrão de 52, sem coringa (CA-007, RN-008, RN-009).
2. **Given** queima visual no turn ou no river (se existir, como no casco), **When** a street abre, **Then** o verso teatral **não** entra nos cinco slots e **não** cria uma 12ª carta de jogo (RN-045, CA-007).
3. **Given** a permutação da mão, **When** a rodada termina, **Then** as cartas além das 11 de jogo permaneceram fora da mesa (não usadas nesta mão) (RN-044).

---

### User Story 5 - Só ver as cartas adversárias no showdown, e elas serem as do deal (Priority: P2)

Até o river, as hole cards de A e B continuam fechadas. No início do showdown, viram **as mesmas** cartas que receberam no deal — não um par sorteado na hora. O treinando lê o board real e, no showdown, as mãos reais dos três.

**Why this priority**: RN-012 exige cartas reais nos adversários; o casco já fixou o momento da virada. Esta feature garante que o que vira é o que foi dado.

**Independent Test**: Seguir uma mão até o river; confirmar verso em A e B no flop/turn; no showdown, as faces abertas coincidem com as duas cartas atribuídas a cada um no mapeamento da rodada.

**Acceptance Scenarios**:

1. **Given** flop ou turn já aberto, **When** o treinando olha A e B, **Then** as hole cards deles estão fechadas (continuidade do casco com faces reais por baixo).
2. **Given** o início do showdown (river pousado + virada), **When** as hole cards de A e B abrem, **Then** são exatamente as quatro cartas que o mapeamento da rodada atribuiu a A e a B no deal (RN-012, RN-044).
3. **Given** o showdown, **When** se comparam as 11 cartas, **Then** continuam as mesmas 11 determinadas no shuffle — ninguém “troca de mão” na virada.

---

### User Story 6 - A mesa não trava se faltar movimento ou se o embaralhamento falhar (Priority: P3)

Sem movimento de mouse, a mão ainda começa. Se não for possível montar o baralho, a mão **não** inicia: o HUD volta a `ociosa` e oferece **Nova mão**. Nada disso pede dado pessoal nem grava a trajetória do cursor.

**Why this priority**: Fail-open e privacidade são gates da constitution; o §5.2 já define as duas exceções.

**Independent Test**: Iniciar uma mão sem mover o ponteiro; simular falha ao montar o baralho e conferir retorno a `ociosa` com **Nova mão**, sem modal agressivo e sem formulário.

**Acceptance Scenarios**:

1. **Given** entropia de cursor ainda vazia, **When** o treinando aciona **Nova mão**, **Then** o shuffle ocorre com as demais fontes e o deal segue (exceção do §5.2).
2. **Given** falha ao montar o baralho, **When** a mão deveria começar, **Then** a mão **não** inicia, o HUD volta a `ociosa` e o CTA **Nova mão** permanece disponível — sem `alert()` e sem pedir identificação.
3. **Given** qualquer início de mão, **When** o treinando observa a UI, **Then** não há pedido de nome, e-mail ou outro identificador; o movimento do cursor, se usado, não é exibido nem persistido.

---

### Edge Cases

- Ponteiro parado ou ainda não movido nesta visita: embaralha com data/hora e relógio; não espera gesto; não mostra tutorial de “mexa o mouse”.
- Falha ao montar o baralho (baralho incompleto, duplicata na montagem, mapeamento impossível): não inicia a mão; HUD `ociosa` + **Nova mão**; a mesa não fica presa em `deal`.
- Recarregar no meio da mão: a mão — inclusive a permutação — perde-se; HUD volta a `ociosa`. Não se pede dado pessoal para “retomar”. Não se grava o baralho da mão em curso.
- **Próxima mão**: recolhe o feltro e **refaz** o embaralhamento; é outra permutação, outro conjunto de 11 cartas (não um deslocamento da ordem anterior).
- Avanço de street: flop, turn e river já estavam reservados; avançar **não** sorteia de novo nem troca cartas já visíveis.
- Queima visual presente (casco): verso teatral fora dos cinco slots; as 11 de jogo permanecem as do mapeamento.
- Queima visual ausente (se o casco for usado sem ela): a mão continua válida; burn é opcional na cenografia (RN-G007).
- Preferência por reduzir movimento: as cartas da street aparecem já no lugar, **com as faces já determinadas**; o shuffle não depende do voo.
- Duas rodadas seguidas com o mesmo conjunto de 11 cartas: pode ocorrer por acaso raro; **não** pode ser o padrão (mesmo baralho stub, mesma ordem, ou “nova mão” que não reembaralha).
- Empates de pote no board: o gerador **não** evita combinações que empatam; honestidade do baralho prevalece sobre “mão mais didática” (RN-G003).
- Cartas além das 11: existem na permutação e **não** aparecem como hole nem comunitária nesta mão.
- Quiz stub do casco: a opção “certa” do stub ainda **pode** não coincidir com o feltro real até as features 003–006; esta feature **não** corrige o quiz — só troca as faces stub pelas 11 cartas honestas.
- Clique durante `deal`: continua impossível (casco); esta feature não reabre estados de HUD.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada rodada MUST usar um baralho único de **52** cartas francesas (13 ranks × 4 naipes), sem coringa e sem repetir a mesma carta (rank+naipe) na mesma mão (RN-008).
- **FR-002**: As hole cards dos três jogadores e as 5 comunitárias MUST ser **11 cartas distintas** extraídas desse baralho (RN-009).
- **FR-003**: O embaralhamento MUST ser refeito a **cada** rodada (**Nova mão** ou **Próxima mão**). MUST incorporar **pelo menos**: posição/movimento do cursor, data e hora, e relógio de alta resolução (tick). O objetivo é imprevisibilidade percebida e real — MUST NOT depender só de um gerador ingênuo e isolado (RN-010).
- **FR-004**: Sem movimento de cursor ainda, o embaralhamento MUST seguir com as demais fontes. MUST NOT travar a UI à espera de entropia. MUST NOT exigir um ritual visível de “gerar aleatoriedade” antes do deal.
- **FR-005**: Depois do shuffle da rodada, flop, turn e river MUST já estar determinados. MUST NOT reembaralhar nem sortear cartas novas entre streets da mesma mão (RN-011).
- **FR-006**: Adversário A e Adversário B MUST receber cartas reais do baralho (não mãos pré-montadas, não faces decorativas fixas). O showdown MUST virar essas mesmas cartas (RN-012).
- **FR-007**: Após a permutação, o mapeamento **de dados** das 11 cartas de jogo MUST ser exatamente (RN-044):
  - posições `[0]` e `[1]` → Adversário A
  - `[2]` e `[3]` → Adversário B
  - `[4]` e `[5]` → Herói (**Você**)
  - `[6]`, `[7]` e `[8]` → flop (slots 1–3)
  - `[9]` → turn (slot 4)
  - `[10]` → river (slot 5)
  - `[11]` … `[51]` → restante, **não usado** nesta mão  
  A ordem visual do leque MAY diferir da ordem de dados; o que cada assento/slot **é** MUST seguir este mapeamento.
- **FR-008**: O deal visível das hole cards MUST cobrir os três assentos na ordem **Adversário A**, **Adversário B**, **Você**, usando as cartas do FR-007. Ao pousar: herói aberto; A e B fechados até o início do showdown.
- **FR-009**: Dado o deal das hole cards recém-concluído, os três slots do flop MUST NOT estar face-up e MUST NOT haver quiz (CA-008).
- **FR-010**: A street flop MUST abrir face-up exatamente as cartas `[6]`, `[7]` e `[8]` nos slots 1–3, e só quando essa street começa.
- **FR-011**: Dado o quiz do flop concluído, quando começa o turn, exatamente a carta `[9]` MUST abrir no slot 4, **sem** alterar o flop (CA-009).
- **FR-012**: Quando começa o river, exatamente a carta `[10]` MUST abrir no slot 5, **sem** alterar flop nem turn.
- **FR-013**: Queima (burn) MUST ser só cenografia, se existir. MUST NOT entrar no board. MUST NOT consumir carta extra do baralho de dados. A mão MUST usar exatamente as 11 cartas da RN-044. Um verso teatral de burn MUST NOT ser uma 12ª carta de jogo (RN-045, RN-G007, CA-007).
- **FR-014**: Dado o deal, as 11 cartas (6 hole + 5 board) MUST ser distintas e pertencer ao baralho padrão; burns visuais, se houver, MUST NOT criar 12ª carta de jogo (CA-007).
- **FR-015**: Dado duas rodadas seguidas, as 11 cartas MUST NOT ser sistematicamente iguais (CA-006). **Próxima mão** MUST produzir nova permutação, não um deslocamento óbvio da anterior.
- **FR-016**: As 11 faces stub da feature 001 MUST ser substituídas, em toda mão iniciada nesta feature, pelas cartas reais do mapeamento. MUST NOT permanecer um baralho visual fixo ou ciclo determinístico como fonte das 11 de jogo.
- **FR-017**: Se falhar a montagem do baralho, a mão MUST NOT iniciar; o HUD MUST voltar a `ociosa` e oferecer **Nova mão**. MUST NOT usar `alert()` nem jargão que bloqueie a mesa.
- **FR-018**: MUST NOT evitar boards que empatam o pote. Empate faz parte do treino; o gerador MUST NOT filtrar a permutação para “ficar mais fácil” (RN-G003).
- **FR-019**: MUST NOT persistir a permutação, as 11 cartas, a trajetória do cursor nem qualquer identificador. Estado da mão MUST permanecer só em memória de sessão. Recarregar aborta a mão. MUST NOT coletar CPF, e-mail, nome real, apelido digitado, telefone, foto ou equivalente. MUST NOT enviar mãos ou entropia a servidor.
- **FR-020**: Esta feature MUST NOT alterar apelidos (**Você**, **Adversário A**, **Adversário B**), CTAs (**Nova mão** / **Próxima mão**), estados do HUD, quiz stub, apostas ou persistência de desempenho. O casco da mesa permanece o palco; o que muda é a origem e o revelar das cartas.
- **FR-021**: A ordem visual das opções do quiz (já embaralhada no casco) MUST NOT reembaralhar o baralho da mão. Fontes de aleatoriedade da rodada MAY ser reutilizadas só para opções, sem nova permutação das 52.

### Key Entities

- **Baralho da rodada**: conjunto fechado das 52 cartas francesas, sem coringa, permutado **uma vez** no início da mão.
- **Carta de jogo**: uma das 11 posições mapeadas (6 hole + 5 comunitárias). Atributos: rank, naipe, dono ou slot, visibilidade (aberta/fechada/ainda não revelada na street).
- **Mapeamento da rodada**: atribuição fixa das posições `[0]`…`[10]` aos assentos e ao board (RN-044). Não muda no meio da mão.
- **Restante**: as 41 cartas `[11]`…`[51]` da permutação; existem para o baralho ser completo e **não** entram na mesa nesta mão.
- **Street comunitária**: flop (três cartas já reservadas), turn (uma), river (uma). Abrir a street é **revelar** o que já estava determinado, não sortear.
- **Burn cênico**: verso teatral opcional; não é entidade de jogo; não tem rank.
- **Mão de treino**: ciclo desde o shuffle+deal até o desfecho (ou reload). Uma permutação por mão.

### Fora de escopo (esta feature)

- Casco visual da mesa, estados do HUD, CTAs, som de evento, layout desktop-first e cadência stub do quiz (já na feature 001). Esta feature **reusa** esse palco.
- Correção autoritativa das perguntas, motor de melhor-5, kickers, enumeração de upgrades e vencedor lógico (features 003–006). O feltro passa a ser honesto; o stub ainda pode “acertar” uma categoria que não bate com o board.
- Persistência de contadores (`mao_atual`, `upgrade`, `vencedor_pote`) e `localStorage` (feature 003).
- Apostas, blinds, fold, estratégia, quiz preflop, desistir da mão, mute na UI, relatório, zerar stats, multiplayer, login, outras variantes de poker.
- Reabrir a stack já decidida (entrega estática, cartas clássicas no feltro, ausência de backend). O **como** construir o gerador fica para `/speckit-plan` sob o contrato já aceito.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das mãos iniciadas com sucesso, as 11 cartas de jogo são distintas, pertencem ao baralho padrão de 52 (sem coringa) e ocupam os três assentos + cinco slots conforme o mapeamento da rodada (CA-007, RN-044).
- **SC-002**: Em uma sequência de rodadas seguidas, o conjunto das 11 cartas **não** se repete de forma sistemática (não é a mesma mão stub / a mesma ordem em todas as rodadas) (CA-006).
- **SC-003**: Em 100% das mãos, após o deal das hole cards e antes da street flop, zero slots do flop estão face-up e zero perguntas aparecem (CA-008).
- **SC-004**: Em 100% das transições flop → turn, a carta que abre no slot 4 é a já reservada ao turn e as três do flop permanecem iguais (CA-009).
- **SC-005**: Em 100% das mãos, flop, turn e river abrem **somente** na respectiva street; 0 reembaralhamentos entre streets da mesma mão (RN-011).
- **SC-006**: Em 100% das queimas visuais observadas, o verso teatral não ocupa slot do board e o conjunto de jogo permanece com exatamente 11 cartas (RN-045).
- **SC-007**: Em 100% dos showdowns, as hole cards abertas de A e B são as mesmas atribuídas no deal; 0 substituições na virada (RN-012).
- **SC-008**: Sem movimento do ponteiro, 100% das tentativas de **Nova mão** ainda produzem deal (ou o retorno controlado a `ociosa` se a montagem falhar); 0 travamentos à espera de cursor.
- **SC-009**: Quando a montagem do baralho falha, 100% das vezes a mão não começa e o treinando volta a ver a mesa `ociosa` com **Nova mão**, em menos de 3 segundos, sem diálogo nativo de erro.
- **SC-010**: Em 100% das mãos, as 41 cartas fora do mapeamento não aparecem como hole nem comunitária; o treinando nunca vê uma 12ª carta de jogo.
- **SC-011**: 0 coletas de dado pessoal e 0 persistência da trajetória do cursor ou do baralho da mão; recarregar a página perde a mão em curso e volta a `ociosa`.

## Assumptions

- **Git / numeração**: o diretório da feature é `specs/002-embaralhamento-deal/` (ShortName `embaralhamento-deal`, número **002**, sequential). Não há hook `before_specify`; o repositório permanece em `main` (roadmap sequencial nesta branch). Identidade da spec: `002-embaralhamento-deal`.
- **Fonte de verdade**: comportamento desta spec = PRD §5.2 (RN-008, RN-009, RN-010, RN-011, RN-012, RN-044, RN-045, CA-006, CA-007, CA-008, CA-009) + gates da constitution (em especial RN-G003, RN-G007, fail-open de shuffle, LGPD). Nenhum `[NEEDS CLARIFICATION]` — o PRD e os ADRs já fecham as decisões.
- **Casco 001**: a mesa, o HUD, a cadência stub, a visibilidade herói/adversários, o burn cênico opcional e o ritmo de animação já existem. Esta feature **substitui** as 11 faces stub pela permutação real; **não** redesenha o clube.
- **Quiz stub**: até 003–006, a correção visível do HUD MAY continuar provisória (a “certa” do stub pode não bater com o board real). O feltro, porém, MUST ser honesto a partir desta feature.
- **Queima**: o casco já pode mostrar burn no turn/river. Esta spec não torna o burn obrigatório nem o remove; só reforça que, se existir, não consome carta de jogo (RN-G007 / RN-045).
- **Ordem visual vs. dados**: o leque do deal MAY animar em sequência diferente da indexação `[0]`…`[10]`; o contrato de produto é o mapeamento de **quem recebe o quê** (FR-007) e o deal visível A → B → herói (FR-008).
- **Contrato de aleatoriedade (não reabrir stack)**: a constitution e o **ADR-004** já decidiram o gerador (fonte criptográfica do navegador misturada a um pool local de cursor, data/hora e tick; se a fonte criptográfica faltar, usa-se o pool; a mesa não trava). Esta spec descreve o **quê** (imprevisível a cada rodada, fontes mínimas, uma permutação por mão) e **não** escolhe de novo o algoritmo. Detalhe de implementação fica para `/speckit-plan`.
- **Cartas no feltro**: o **ADR-005** já decidiu cartas clássicas (não Unicode/emoji como face principal). Esta feature atribui ranks/naipes reais a esse componente; não troca o idioma visual da carta.
- **Fail-open**: alinhado à constitution VII e à tabela de erro do §5.2. Falta de cursor ≠ bloqueio. Falha de montagem ≠ mesa presa em `deal`.
- **Privacidade**: movimento do cursor, se misturado ao embaralhamento, é efêmero e local — não é cadastro, não é identificador persistido, não sai do dispositivo. Sem `localStorage` nesta etapa (evolução é 003, só contadores, sem PII).
- **Empates**: não filtrar permutações que empatam (RN-G003). O desfecho visual de split já é do casco; o gerador honesto é desta feature.
- **Uma mão = uma permutação**: a permutação MUST estar pronta antes do deal visível; uma animação de shuffle, se o casco a tiver, é teatro — não um segundo sorteio.
- **Idioma**: UI em pt-BR; termos de clube (flop, turn, river, showdown) permanecem como no casco. Não existe CTA chamado **Embaralhar**.
- **Constitution como constraint**: sem backend, sem cadastro, custo zero, treino e não jogo, desktop-first, fail-open. Stack completa (ADRs 001–007) não se reabre aqui.
