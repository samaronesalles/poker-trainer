# Feature Specification: Desconto de outs (upgrades que vencem o pote e odd da próxima carta)

**Feature Branch**: `008-desconto-outs`

**Created**: 2026-09-13

**Status**: Draft

**Input**: User description: "Substituir o gabarito da §5.4: depois da 5.3 no flop/turn, perguntar “Quais mãos melhoram o seu jogo com chance de ganhar o pote?” só com categorias que, na próxima carta, são exatamente C, mais fortes que a atual e vencem estritamente o vilão assumido (receita pessimista RN-055, HUD declara a suposição, hole reais de A/B fora); skip “Não há mão que vire o pote.” sem §5.8; se acertar a 5.4, perguntar quantas outs (6 totais), quais ranks (sempre 13) e qual odd (regra do 2, tabela X:1); buckets outs e odds na mesma chave; sem Pot Odds, sem regra do 4, sem persistir cartas/vilão/outs — conforme PRD §5.4 revista e §5.8 (RN-055, RN-056, RN-057, RN-059, RN-060, RN-061, RN-062, RN-063, RN-064, RN-065, RN-066, RN-067, RN-068, RN-069, RN-070, RN-071, RN-074, CA-033, CA-034, CA-035, CA-036, CA-037, CA-038, CA-039, CA-040, CA-041, CA-042, CA-043, CA-044, CA-045, CA-046, CA-047, CA-048) e converge de storage da 003"

## User Scenarios & Testing *(mandatory)*

Esta feature **substitui o gabarito** da pergunta de upgrades (histórico em `005-maos-ainda-possiveis`) e **acrescenta** o treino de outs e odd da próxima carta. O casco, o baralho, o contrato de quiz, a mão atual, o showdown e a colinha já existem. O valor é o treinando passar a marcar só o que **vira o pote** contra um vilão assumido pessimista — e, se houver o que marcar, contar **quantas** outs limpas, **quais ranks** e a **odd** da próxima carta (regra do 2). Pot Odds, regra do 4 e decisão de pagar **não** entram. A pasta 005 permanece histórica e **não** se reabre.

### User Story 1 - Marcar só o que vira o pote no flop (Priority: P1)

O flop pousa. O treinando acerta **“Qual mão você tem agora?”**. Só então o HUD pergunta **“Quais mãos melhoram o seu jogo com chance de ganhar o pote?”** e mostra uma linha de suposição (ex.: o adversário já tem o par mais alto da mesa). Uma categoria C só é verdadeira se, **na próxima carta** (o turn hipotético), a melhor 5 do herói puder ser **exatamente C**, C for **estritamente mais forte** que a atual, e essa melhor 5 **vencer estritamente** o vilão assumido. Um par menor que perde do assumido **não** conta. Runner-runner **não** conta. As hole reais de A e B **não** entram na conta e **não** aparecem abertas. O treinando marca e aperta **Confirmar**. O turn **não** abre ainda: depois do acerto desta grade vem a §5.8 da mesma street.

**Why this priority**: É o novo objetivo da §5.4 no flop. Sem isto o flop continua cobrando “ainda possível” sem desconto de outs.

**Independent Test**: No caso CA-033 (herói K♣ Q♦, flop 10♠ 9♦ 5♣, vilão = par mais alto), o enunciado e a linha de suposição são os canônicos; **Par** e **Straight** são verdadeiros; um par de 9 ou de 5 sozinho **não** torna **Par** falso. O turn ainda não abriu.

**Acceptance Scenarios**:

1. **Given** o flop pousado e a mão atual do herói **ainda não** acertada, **When** o treinando olha o HUD, **Then** **não** há pergunta de upgrades, **não** há linha de suposição, **não** há **Confirmar** de upgrades e **não** há skip de upgrade (RN-G002).
2. **Given** a mão atual do flop **acertada** e o beat encerrado, **When** a lista de upgrades vencedores (RN-057) **não** é vazia, **Then** o HUD entra em `perguntando` com o enunciado exatamente **“Quais mãos melhoram o seu jogo com chance de ganhar o pote?”**, a linha de suposição de RN-059, múltipla seleção, CTA **Confirmar**, e marcar/desmarcar **não** submete (RN-047).
3. **Given** herói **K♣ Q♦**, board **10♠ 9♦ 5♣** e vilão assumido = par mais alto da mesa, **When** a 5.4 abre, **Then** a linha é **“Suponha que o adversário já tem o par mais alto da mesa.”**, **Par** e **Straight** são verdadeiros, e um par de 9 ou de 5 **sozinho** não torna **Par** falso (CA-033).
4. **Given** a única forma de completar **Par** na próxima carta perde do vilão assumido, **When** a 5.4 abre, **Then** **Par** **não** é upgrade verdadeiro (CA-034).
5. **Given** um flop em que Flush só existe runner-runner, **When** a 5.4 abre, **Then** **Flush** **não** é verdadeiro (CA-039, RN-069).
6. **Given** o conjunto das opções **exibidas** correto, **When** o treinando aciona **Confirmar**, **Then** o HUD diz **“Você acertou”** e, após o beat, abre a §5.8 da **mesma** street — **não** abre o turn ainda (RN-068).
7. **Given** a 5.4 aberta, **When** se olham os assentos, **Then** Adversário A e Adversário B continuam fechados e as 2 cartas assumidas **não** aparecem como hole cards (CA-038, RN-071).
8. **Given** o flop ainda voando, **When** o treinando procura a pergunta de upgrades, **Then** o HUD permanece em `deal` sem opções.

---

### User Story 2 - Marcar só o que vira o pote no turn (Priority: P1)

O turn pousa. O herói vê 6 cartas. Depois de acertar de novo a mão atual, a mesa aplica a **mesma** regra da 5.4 com o baralho da próxima carta do turn (cada restante como **river**). O que ainda virava o pote no flop pode ter morrido. A linha de suposição é recalculada com o board de quatro cartas. Se ainda houver upgrade vencedor, múltipla seleção + **Confirmar**; o acerto abre a §5.8 do turn. O river **não** abre enquanto esta street não terminar. **Não** há 5.4 nem 5.8 no river.

**Why this priority**: O turn é a outra street da §5.4 revista. Sem isto o treinando só pratica desconto de outs com uma carta a mais.

**Independent Test**: Num turn com exatamente 2 upgrades vencedores, a grade tem esses 2 + 4 distratoras (CA-035). O river não abre no acerto da 5.4 — abre a §5.8.

**Acceptance Scenarios**:

1. **Given** o turn pousado e a mão atual do turn **ainda não** acertada, **When** o treinando olha o HUD, **Then** **não** há pergunta de upgrades nem skip de upgrade desta street.
2. **Given** a mão atual do turn acertada e o beat encerrado, **When** a lista RN-057 do turn tem upgrades vencedores, **Then** o HUD pergunta **“Quais mãos melhoram o seu jogo com chance de ganhar o pote?”** com a linha de suposição do board atual (RN-059).
3. **Given** um turn com **exatamente 2** upgrades vencedores, **When** o quiz abre, **Then** esses 2 estão nas opções e há **4** distratoras (total 6) (CA-035, RN-023).
4. **Given** o conjunto exibido correto no turn, **When** o treinando confirma, **Then** após o beat abre a §5.8 do turn — **não** há segunda 5.4 nesta street e **não** abre o river ainda.
5. **Given** o river já aberto, **When** o treinando procura 5.4 ou 5.8, **Then** isso **não** existe; a cadência segue o showdown (feature 006).
6. **Given** o flop e o turn da **mesma** mão, ambos com lista não vazia, **When** se lêem as 1ªs tentativas, **Then** são exposições independentes em `upgrade`, `outs` e `odds` — MUST NOT fundir os deltas das duas streets (CA-048).

---

### User Story 3 - Pular a grade e a §5.8 quando nada vira o pote (Priority: P1)

Às vezes o herói já está à frente do vilão assumido, ou nenhuma próxima carta vence. O HUD **não** inventa 6 botões e **não** cobra outs. Mostra **“Não há mão que vire o pote.”** e **Continuar**. Nenhum contador `upgrade`, `outs` ou `odds` muda. A próxima street pode abrir.

**Why this priority**: CA-036 e RN-060. Cobrar outs depois de um skip treinaria a lição errada (N = 0 inventado).

**Independent Test**: Lista vazia de upgrades vencedores: skip com a frase nova + **Continuar**; zero §5.8; `upgrade`/`outs`/`odds` inalterados (CA-036, CA-043).

**Acceptance Scenarios**:

1. **Given** lista vazia de upgrades vencedores (já à frente do assumido, ou nenhuma próxima carta vence) e a 5.3 acertada, **When** seria a 5.4, **Then** o HUD vai a `sem_upgrade` com **“Não há mão que vire o pote.”** + **Continuar**; **não** há múltipla seleção; `upgrade`, `outs` e `odds` não mudam; **não** há §5.8 (CA-036, RN-060).
2. **Given** skip da 5.4, **When** a street segue, **Then** **não** há “Quantas outs”, “Quais ranks” nem “Qual é a sua odd”; `outs`/`odds` permanecem iguais (CA-043, RN-068).
3. **Given** `sem_upgrade`, **When** o treinando aciona **Continuar**, **Then** a próxima street pode abrir.
4. **Given** lista **não** vazia, **When** o HUD reage, **Then** MUST NOT usar o skip — a grade de até 6 opções é obrigatória.
5. **Given** a frase antiga **“Não há upgrade possível.”**, **When** o skip desta feature aparece, **Then** essa frase **não** é mais o copy canônico desta pergunta.

---

### User Story 4 - Dizer quantas outs limpas (Priority: P1)

Depois do beat de acerto da 5.4 (lista não vazia), o HUD pergunta **“Quantas outs você tem?”**. Há sempre **6** totais distintos, incluindo o N correto. Clique submete. Uma carta só é out se, ao abri-la, o herói **vence estritamente** o vilão assumido: carta que só “melhora” sem virar o pote, ou que também dá jogo ainda melhor ao assumido, **não** conta. Cada carta conta no máximo uma vez. O turn/river **não** abre nesta pergunta.

**Why this priority**: Primeiro passo da §5.8. Sem a quantidade o treinando não chega à odd.

**Independent Test**: No exemplo CA-033 após acertar a 5.4, a correta é **10** (3 Reis + 3 Damas + 4 Valetes, descontando assumidas e visíveis); há 6 totais incluindo 10; o turn ainda não abriu (CA-040).

**Acceptance Scenarios**:

1. **Given** a 5.4 da street acertada (lista não vazia) e o beat encerrado, **When** a §5.8 abre, **Then** o enunciado é **“Quantas outs você tem?”**, seleção única, 6 inteiros distintos no intervalo 1–47 incluindo o N correto, e a street seguinte **ainda não** abriu (CA-040, RN-063, RN-068).
2. **Given** o exemplo CA-033 no flop, **When** se avalia N, **Then** a correta é **10**.
3. **Given** 4 Valetes no baralho da próxima carta dos quais 2 são outs e 2 são sujos, **When** se avalia N, **Then** N inclui **2** (não 4) (CA-045, RN-062).
4. **Given** clique no total correto, **When** o feedback aparece, **Then** o HUD diz **“Você acertou”** e, após o beat, abre **“Quais ranks são outs?”**.
5. **Given** clique num total errado, **When** o feedback aparece, **Then** o HUD diz **“Não é essa. Tente de novo.”**, a opção morre no lugar, a certa **não** é revelada, e `outs` recebe +1 erro na 1ª tentativa (RN-035, RN-067).
6. **Given** skip da 5.4 ou river, **When** se procura esta pergunta, **Then** ela **não** existe.

---

### User Story 5 - Marcar quais ranks são outs (Priority: P1)

Depois de acertar a quantidade, o HUD pergunta **“Quais ranks são outs?”** com os **13** rótulos canônicos (2 … 10, Valete, Dama, Rei, Ás), ordem visual embaralhada. Um rank é verdadeiro se existe **pelo menos uma** carta-out desse rank. Ranks que melhoram dentro da mesma categoria (par melhor quando o herói já tem par) **entram** se a carta for out — mesmo sem terem sido chip na 5.4. Múltipla seleção + **Confirmar**. Sem teto de 6. Sem “marcar todas”.

**Why this priority**: Segunda pergunta da §5.8. Treina *quais* cartas limpas, não só o número.

**Independent Test**: Após acertar 10 no exemplo CA-033, os 13 rótulos aparecem; o conjunto verdadeiro é **Rei**, **Dama** e **Valete**; 9 e 5 não são verdadeiros (CA-041).

**Acceptance Scenarios**:

1. **Given** o acerto da quantidade, **When** “quais ranks” abre, **Then** há exatamente os 13 rótulos de RN-064, múltipla seleção, CTA **Confirmar**, e o foco inicial está na primeira opção da ordem visual (RN-064).
2. **Given** o exemplo CA-033 com N = 10 acertado, **When** a grade abre, **Then** o conjunto verdadeiro é **Rei**, **Dama** e **Valete**; **9** e **5** **não** são verdadeiros (CA-041).
3. **Given** 2 de 4 Valetes sujos e 2 limpos, **When** se avalia o gabarito, **Then** **Valete** continua verdadeiro (CA-045, RN-062).
4. **Given** o herói já tem Par e um Rei faria um par melhor que o do vilão, **When** se avalia ranks, **Then** **Rei** é verdadeiro **se** essa carta for out, mesmo **Par** não tendo sido chip na 5.4 (RN-074, RN-046).
5. **Given** o conjunto das 13 correto, **When** o treinando confirma, **Then** o HUD diz **“Você acertou”** e, após o beat, abre **“Qual é a sua odd?”**.
6. **Given** a 1ª **Confirmar** com conjunto incompleto ou com distratora marcada, **When** se lê a memória, **Then** `outs` recebe +1 erro (não há acerto por rank); ranks verdadeiros omitidos continuam selecionáveis; distratoras marcadas morrem; a pergunta não fecha (RN-025, RN-067).
7. **Given** a pergunta aberta, **When** o treinando procura “marcar todas”, **Then** isso **não** existe.

---

### User Story 6 - Escolher a odd da próxima carta (Priority: P1)

Depois de acertar o conjunto de ranks, o HUD pergunta **“Qual é a sua odd?”**. Sempre **6** razões distintas no formato **X:1**, incluindo a correta da tabela da regra do **2**. Clique submete. Sempre a próxima carta — no flop **e** no turn. Acerto avança a street. Pot Odds e regra do 4 **não** aparecem.

**Why this priority**: Fecha a §5.8. Sem a odd o treino para na contagem.

**Independent Test**: Com N = 10, a correta é **4:1** e há 6 razões distintas (CA-042). Com N = 4, **11:1**; com N = 9, **5:1** (não 4:1) (CA-044).

**Acceptance Scenarios**:

1. **Given** o conjunto de ranks acertado com N = 10, **When** a odd abre, **Then** o enunciado é **“Qual é a sua odd?”**, a correta é **4:1**, há 6 razões distintas no formato X:1, e a street seguinte **ainda não** abriu (CA-042, RN-066).
2. **Given** N = 4, **When** a odd é cobrada, **Then** a correta é **11:1**. **Given** N = 9, **Then** a correta é **5:1** e **não** 4:1 (CA-044, RN-065).
3. **Given** clique na razão correta, **When** o beat encerra, **Then** a street avança (turn após o flop; river após o turn).
4. **Given** clique numa razão errada, **When** o feedback aparece, **Then** a opção morre, o HUD pede de novo, e `odds` recebe +1 erro na 1ª tentativa (RN-067).
5. **Given** enunciado, opções e feedback desta pergunta, **When** se lê o texto, **Then** **não** há “Pot Odds”, “regra do 4”, “flush draw” nem “gutshot” (RN-027).
6. **Given** flop ou turn, **When** se calcula a odd, **Then** vale só a regra do **2**; MUST NOT usar a regra do 4 (RN-065).

---

### User Story 7 - Entender o vilão assumido sem ver A e B (Priority: P1)

O treinando lê uma frase só: o adversário **já tem** o par mais alto, a trinca do par, Straight, Flush ou o rótulo que o board empurrar. Não vê as 2 cartas assumidas, não vê kicker por extenso e não vê as hole reais de A e B. A receita é pessimista e fixa pela textura do board; se duas texturas se aplicam, fica a mão assumida **mais forte** já feita. Um único vilão abstrato vale até o showdown desta mão — e no showdown o pote usa as hole **reais**, não as assumidas.

**Why this priority**: Sem a suposição declarada o desconto de outs vira chute. Sem esconder as assumidas o treino vaza a receita.

**Independent Test**: No CA-033 a linha é a do par mais alto; A e B fechados; assumidas invisíveis (CA-038). No showdown, o vencedor continua o da feature 006.

**Acceptance Scenarios**:

1. **Given** board sem 3+ do mesmo naipe, sem 4 ranks em sequência e sem par, **When** se monta o vilão, **Then** a suposição é o **par mais alto da mesa** e a linha é **“Suponha que o adversário já tem o par mais alto da mesa.”** (RN-055, RN-059).
2. **Given** board pareado, **When** se monta o vilão, **Then** a suposição é **trinca do par mais alto** (dois pares na mesa: o par de rank maior) e a linha é **“Suponha que o adversário já tem trinca do par da mesa.”**.
3. **Given** 4 ranks únicos em sequência (wheel A-2-3-4 permitido, wrap K-A-2-3 proibido), **When** se monta o vilão, **Then** a suposição é **Straight** feito e a linha é **“Suponha que o adversário já tem Straight.”**.
4. **Given** 3 ou mais cartas do mesmo naipe, **When** se monta o vilão, **Then** a suposição é **Flush** feito e a linha é **“Suponha que o adversário já tem Flush.”**.
5. **Given** duas ou mais texturas aplicáveis, **When** se escolhe, **Then** fica a cuja melhor 5 **atual** (2 assumidas + board, sem a próxima carta) for a **mais forte** no ranking completo já vigente.
6. **Given** a linha de suposição, **When** o treinando lê, **Then** é **uma** frase, **sem** listar as 2 cartas, **sem** kicker por extenso e **sem** revelar A/B (RN-059).
7. **Given** a 5.8 da mesma street, **When** o treinando olha o HUD, **Then** a linha de suposição da 5.4 **pode** permanecer visível só para leitura — **não** é nova pergunta (RN-G001).
8. **Given** o showdown, **When** se decide o pote, **Then** valem as hole **reais** de A e B; o vilão assumido MUST NOT vazar para o vencedor (feature 006).

---

### User Story 8 - Guardar só contadores outs e odds na mesma memória (Priority: P2)

A memória de treino no dispositivo ganha dois grupos únicos: `outs` e `odds`, na **mesma** chave de evolução já usada por `mao_atual`, `upgrade` e `vencedor_pote`. Quantidade e ranks são **duas** exposições independentes em `outs`. A odd escreve só `odds`. Não se grava N, lista de ranks, razão, cartas, vilão assumido nem information set. Sem tela de relatório e sem botão zerar. Se o armazenamento falhar, o treino segue.

**Why this priority**: Converge obrigatório da 003 (CR-002). Sem os dois buckets a §5.8 não tem memória; com PII ou dump da mão, viola LGPD.

**Independent Test**: Erro na 1ª quantidade e acerto depois: `outs` +1 erro e +0 acerto nessa exposição; a 1ª Confirmar dos ranks é outra exposição em `outs`; a odd escreve só `odds` (CA-046). Acerto de primeira nas três: o bloco tem os cinco buckets e **não** contém cartas, ranks, N, razão, vilão nem information set (CA-047).

**Acceptance Scenarios**:

1. **Given** erro na 1ª tentativa de quantidade e acerto depois, **When** se lê a persistência, **Then** `outs` tem +1 erro e +0 acerto nessa exposição; tentativas seguintes dessa pergunta não mudam o bucket (CA-046, RN-067).
2. **Given** a 1ª **Confirmar** dos ranks, **When** o conjunto das 13 está perfeito, **Then** `outs` recebe +1 acerto (exposição independente da quantidade); senão +1 erro em `outs` — **não** há acerto por rank (RN-067).
3. **Given** a 1ª tentativa da odd, **When** é acerto ou erro, **Then** só `odds` incrementa (um grupo); `outs` não muda por causa da odd.
4. **Given** um acerto de primeira nas três perguntas da §5.8, **When** se inspeciona o armazenamento da origem, **Then** o bloco tem os cinco buckets (`mao_atual`, `upgrade`, `vencedor_pote`, `outs`, `odds`) e **não** contém cartas, ranks, N, razão, vilão assumido nem information set (CA-047, RN-071).
5. **Given** a colinha ocultada no desktop, **When** se inspeciona o armazenamento, **Then** a única chave de produto continua a da evolução; **não** existe chave de preferência da colinha; `outs` e `odds` passam a fazer parte do mesmo bloco (CA-032 atualizado).
6. **Given** armazenamento recusado ou dado corrompido, **When** o treinando segue a mão, **Then** o quiz não trava; bloco ilegível zera os cinco buckets; bucket faltando num bloco legível vale 0 sem zerar o resto (fail-open da 003).
7. **Given** a UI do MVP, **When** se procura relatório, gráfico ou botão zerar, **Then** isso **não** existe.

---

### User Story 9 - Confirmar upgrades no contrato já conhecido (Priority: P2)

A grade da 5.4 continua o contrato da 003: até 6 rótulos, 1–5 upgrades vencedores + distratoras, ou os 6 mais fortes sem distratora; 1ª **Confirmar** grava `upgrade` só das opções **exibidas**; falso positivo mata a distratora; omissão cobra erro; retry sem spoiler. O que muda é **quem é verdadeiro** (RN-057) e o que vem **depois** do acerto (a §5.8, não a próxima street).

**Why this priority**: RN-023 a RN-026 e CA-037. Reusar o contrato evita um segundo jeito de marcar categorias.

**Independent Test**: Flush verdadeiro (vencedor) e Par distratora: marcar os dois na 1ª **Confirmar** → Flush +1 acerto, Par +1 erro, Par desabilita, pergunta aberta (CA-037).

**Acceptance Scenarios**:

1. **Given** 1 a 5 upgrades vencedores, **When** o quiz abre, **Then** todos estão nas opções e o total visível é **6** (RN-023).
2. **Given** 6 ou mais upgrades vencedores, **When** o quiz abre, **Then** as opções são **só os 6 mais fortes** na tabela canônica, **sem** distratora; os que não couberam **não** geram estatística.
3. **Given** Flush verdadeiro (vencedor) e Par distratora na 1ª confirmação, **When** o usuário marca os dois, **Then** Flush recebe acerto, Par recebe erro de falso positivo, Par desabilita, e a pergunta não fecha até o conjunto estar correto (CA-037).
4. **Given** já houve a 1ª **Confirmar**, **When** o treinando confirma de novo, **Then** `upgrade` **não** muda (RN-026).
5. **Given** dez perguntas **novas** de upgrades, **When** se observa a posição dos rótulos, **Then** o conjunto obrigatório **não** ocupa a mesma ordem visual em todas; após um erro na **mesma** pergunta, a ordem **não** muda (RN-G008).

---

### Edge Cases

- Só depois da 5.3 **da mesma street** acertada. MUST NOT empilhar mão atual, 5.4 e 5.8 (RN-G001). Flop/turn = 5.3 + (5.4 ou skip) + (§5.8 **só** se a 5.4 não foi skip) (RN-G002).
- River: **não** há 5.4 nem 5.8. A cadência segue o showdown (006). MUST NOT perguntar upgrades, outs ou odd após a quinta comunitária.
- Preflop: **não** há quiz (já excluído).
- Horizonte único da 5.4 e da 5.8 = **a próxima carta** (RN-069). Flop: cada carta do baralho da próxima carta como **turn**. Turn: cada uma como **river**. Runner-runner **não** conta. MUST NOT voltar ao runout de **duas** cartas da spec 005.
- Baralho da próxima carta = 52 − 2 hole do herói − comunitárias já abertas − 2 assumidas (RN-056). Hole reais de A/B que **não** coincidam com as assumidas **permanecem** nesse baralho. Burns cênicos **não** consomem carta.
- As 2 cartas assumidas **não** são cartas de jogo: MUST NOT ocupar slot de hole de A/B, MUST NOT sair do baralho vivo das 11, MUST NOT aparecer face-up.
- Vilão: duas cartas concretas, legais (não repetem hole do herói nem o board), receita pessimista RN-055. Se uma textura não puder ser montada com 2 cartas livres, descarta-a e tenta a seguinte na ordem de força. Descer o rank do “par mais alto” (2º do board, etc.) só se o herói tiver esgotado as cartas do rank alvo.
- Empate hipotético com o vilão **não** é out nem upgrade vencedor (RN-070).
- “Exatamente C”: um desfecho cuja melhor 5 é Royal flush **não** torna Flush (nem Straight flush) verdadeiro.
- Categoria igual ou mais fraca que a atual: nunca upgrade. **Carta alta** nunca é upgrade (RN-021, RN-022).
- Par fraco → par forte, flush baixo → flush alto: **não** é chip na 5.4 (RN-046); **pode** ser out na 5.8 se a carta vencer estritamente o assumido (RN-074).
- Com 0 upgrades vencedores: skip com a frase nova; 0 opções; 0 estatística `upgrade`/`outs`/`odds`; 0 §5.8.
- Com 1–5 upgrades vencedores: todos + distratoras até 6. Distratoras = categorias que **não** são upgrade vencedor **nesta** street. Preenchimento: da mais forte para a mais fraca na tabela canônica, sem repetir.
- Com 6 ou mais: só os 6 mais fortes; zero distratora; as que não couberam não são cobradas.
- N nesta seção é **≥ 1** (a 5.8 só abre se houve upgrade vencedor). MUST NOT inventar 0 outs. Se o motor não fechar N, ranks ou X, a mão aborta (`ociosa` + **Nova mão**).
- Quantidade: 6 inteiros distintos em 1–47, incluindo N. Distratoras: preferir N±1, N±2 e {4, 5, 8, 9, 12, 15}, sem repetir; o que faltar = inteiro mais próximo ainda livre. Ordem visual embaralhada.
- Ranks: sempre os 13 rótulos de RN-064; sem teto de 6; distratora = rank sem out limpo. 1ª **Confirmar** avalia o **conjunto** (um grupo `outs`), não cada rank.
- Odd: P(ganho) = min(2 × N, 100)%; X = 50/N − 1; X inteiro, 0,5 para baixo. Tabela canônica RN-065. Sempre regra do 2. N > 20 usa a mesma fórmula. 6 razões distintas X:1; distratoras: X±1 e {2:1, 3:1, 4:1, 5:1, 9:1, 11:1}, sem repetir.
- Confirmar upgrades vazio com upgrade nas opções: erro de omissão na 1ª vez em cada upgrade **exibido** omitido.
- Confirmar ranks vazio ou incompleto: +1 erro em `outs` na 1ª vez; ranks omitidos continuam selecionáveis; distratoras marcadas morrem.
- Segunda tentativa e seguintes de qualquer pergunta desta feature: não alteram o bucket correspondente.
- Recarregar no meio da pergunta: a mão aborta (casco); contadores já gravados nesta visita permanecem. MUST NOT pedir dado pessoal para retomar.
- Armazenamento indisponível: quiz e avaliação seguem; a evolução MAY perder-se ao fechar.
- MUST NOT persistir cartas, vilão assumido, baralho da próxima carta, lista de outs, ranks, N, razão, snapshot, dump de comparação, information set, pool de cursor, enunciado, carimbo de data/hora ou identificador pessoal.
- Falha ao montar o vilão assumido: a mão aborta (`ociosa` + **Nova mão**); MUST NOT fingir lista vazia; contadores já gravados permanecem.
- Showdown: **não** muda o contrato da 006; o vilão assumido MUST NOT substituir as hole reais.
- A pergunta de mão atual (004) **não** é redesenhada. Esta feature só **consome** o acerto dela.
- Colinha (007): sem chave própria; CA-032 passa a admitir os cinco buckets na mesma chave.
- Vocabulário: na 5.4, opções são só rótulos RN-014. Na 5.8, os termos **outs**, **odd** e **ranks** são permitidos. MUST NOT usar “Pot Odds”, “flush draw”, “gutshot”, “overcards” como rótulo.
- Preferência por reduzir movimento: beat de acerto permanece o da 003 (≤1 s, 0 s se movimento reduzido). Skip continua exigindo **Continuar**.
- Foco: ao abrir 5.4 ou “quais ranks”, primeira opção da ordem visual; Tab só no ativável; depois **Confirmar**. Quantidade e odd: clique (ou Enter/Espaço na opção) submete; sem **Confirmar**.
- Lista da 5.4 e o gabarito da 5.8 MUST estar determinados assim que as comunitárias da street pousarem, com o baralho daquele instante. MUST NOT aparecer pergunta nem skip enquanto a 5.3 não estiver acertada e o beat não tiver encerrado.
- Avaliação MUST usar um **snapshot** em memória. MUST NOT consumir, reordenar nem reembaralhar o baralho vivo. MUST NOT virar carta hipotética no feltro.
- Depois do beat da 5.3, pergunta ou skip MUST aparecer na hora se já estiver pronto. Se não estiver, o HUD MAY permanecer no acerto no máximo 1 s extra. MUST NOT haver spinner, “calculando” nem skip falso de espera.
- Depois do beat da 5.4 (não-skip), a §5.8 MUST aparecer na hora se N/ranks/X já estiverem prontos; o mesmo teto de 1 s extra; MUST NOT inventar N = 0 enquanto espera.
- Layout: quantidade e odd usam a grade de 6 já conhecida. Ranks cabem no HUD em faixa compacta (duas ou três linhas); MUST NOT forçar 2×3; no desktop de referência MUST NOT cobrir comunitárias.
- Cada uma das nove categorias Royal flush … Par MUST poder ser upgrade **vencedor** em pelo menos um caso de flop ou turn; **Carta alta** MUST NOT.
- A spec 005 (RN-020, CA-014–017, “adversário não desconta”, enunciado antigo, skip antigo, runout de duas cartas no flop) **não** vale mais como contrato desta pergunta.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No flop, só depois de a identificação da mão atual dessa street estar acertada e o beat encerrado, a mesa MUST apresentar a pergunta de upgrades vencedores **ou** o skip `sem_upgrade`. MUST NOT abrir o turn ainda.
- **FR-002**: No turn, só depois de a identificação da mão atual dessa street estar acertada e o beat encerrado, a mesa MUST apresentar a pergunta de upgrades vencedores **ou** o skip `sem_upgrade`. MUST NOT abrir o river ainda. MUST NOT existir 5.4 nem 5.8 no river.
- **FR-003**: A mesa MUST sintetizar um **vilão assumido** de duas cartas concretas e legais (não repetem hole do herói nem o board) pela receita pessimista RN-055. As hole reais de Adversário A e Adversário B MUST NOT entrar nessa receita. Se duas ou mais texturas se aplicam, MUST ficar a suposição cuja melhor 5 **atual** (2 assumidas + board, sem a próxima carta) for a mais forte no ranking completo já vigente. Se uma textura não puder ser montada com 2 cartas livres, MUST descartá-la e tentar a seguinte nessa ordem de força.
- **FR-004**: Enquanto a 5.4 ou a 5.8 estiver aberta, o HUD MUST declarar a suposição com **exatamente uma** das frases de RN-059, conforme a categoria da mão assumida já feita no board atual. MUST NOT listar as 2 cartas, MUST NOT escrever kicker por extenso e MUST NOT revelar A/B. A e B MUST permanecer fechados. As 2 assumidas MUST NOT aparecer como hole cards (CA-038, RN-071).
- **FR-005**: O baralho da próxima carta MUST ser 52 − 2 hole do herói − comunitárias já abertas − 2 assumidas. No flop, cada restante MUST ser avaliada como **turn**. No turn, cada restante MUST ser avaliada como **river**. Runner-runner MUST NOT contar. Hole reais de A/B que não coincidam com as assumidas MUST permanecer nesse baralho. Burns cênicos MUST NOT remover carta. As 2 assumidas MUST NOT ser cartas de jogo das 11.
- **FR-006**: A categoria C MUST ser upgrade vencedor se e somente se existe pelo menos uma carta do baralho da próxima carta tal que, após ela abrir: (1) a melhor 5 do herói tem categoria **exatamente C**; (2) C é **estritamente mais forte** que a mão atual na tabela canônica; (3) a melhor 5 do herói **vence estritamente** a melhor 5 do vilão assumido (2 assumidas + board + essa carta) (RN-057, RN-070). Empate com o vilão MUST NOT tornar C verdadeira.
- **FR-007**: Categoria igual à atual ou mais fraca MUST NOT ser upgrade. Melhorar só a força **dentro** da mesma categoria MUST NOT ser chip nesta pergunta (RN-021, RN-046). **Carta alta** MUST NEVER ser upgrade (RN-022). Um desfecho cuja melhor 5 é D MUST testemunhar **somente** D.
- **FR-008**: Se a lista de upgrades vencedores for vazia, o HUD MUST ir a `sem_upgrade` com a frase exatamente **“Não há mão que vire o pote.”** e o CTA **Continuar**. MUST NOT haver grade, **Confirmar**, §5.8 nem alteração de `upgrade`, `outs` ou `odds` (RN-060, CA-036, CA-043).
- **FR-009**: Se a lista **não** for vazia, o HUD MUST perguntar exatamente **“Quais mãos melhoram o seu jogo com chance de ganhar o pote?”** em múltipla seleção com CTA **Confirmar**. Marcar ou desmarcar MUST NOT submeter. Só **Confirmar** avalia o conjunto das opções **exibidas**.
- **FR-010**: A montagem das opções da 5.4 MUST ser (RN-023): 1 a 5 upgrades vencedores → todos + distratoras até 6; 6 ou mais → só os 6 mais fortes na tabela canônica, sem distratoras; os que não couberam MUST NOT ser cobrados nem gerar estatística. MUST NOT haver menos de 6 opções quando a lista não é vazia. MUST NOT haver skip quando a lista não é vazia.
- **FR-011**: Distratora da 5.4 MUST ser uma categoria canônica que **não** é upgrade vencedor **nesta** street. Com 1 a 5 upgrades, as vagas restantes MUST ser preenchidas da mais forte para a mais fraca na tabela canônica, sem repetir. O conjunto (sem a ordem visual) MUST ser determinístico para o mesmo baralho da próxima carta, a mesma mão atual e o mesmo vilão assumido.
- **FR-012**: As categorias oficiais, **rótulo exato na UI**, da mais forte para a mais fraca, MUST ser exatamente: **Royal flush**, **Straight flush**, **Quadra**, **Full house**, **Flush**, **Straight**, **Trinca**, **Dois pares**, **Par**, **Carta alta**. MUST NOT exibir sinônimos, kicker, naipe por extenso nem vocabulário de draws como rótulo de opção (RN-014, RN-027, RN-G004).
- **FR-013**: Na **primeira Confirmar** da 5.4, cada opção **exibida** MUST ser avaliada no bucket `upgrade` assim (RN-024): upgrade verdadeiro marcado → +1 acerto nessa categoria; upgrade verdadeiro não marcado → +1 erro nessa categoria; distratora marcada → +1 erro nessa categoria; distratora não marcada → não incrementa. A gravação MUST ser imediata. Tentativas seguintes MUST NOT alterar `upgrade` (RN-026).
- **FR-014**: Depois da 1ª **Confirmar** da 5.4 (e da 1ª **Confirmar** de ranks): distratoras marcadas MUST desabilitar; distratoras não marcadas MUST permanecer selecionáveis; verdadeiros já marcados MUST travar; verdadeiros ainda não marcados MUST permanecer selecionáveis. Novas **Confirmar** até o conjunto exibido estar perfeito (RN-025).
- **FR-015**: Após o beat de acerto do conjunto **exibido** da 5.4 (lista não vazia), a mesa MUST abrir a §5.8 da **mesma** street. MUST NOT avançar de street nesse instante (RN-068).
- **FR-016**: A §5.8 MUST ocorrer só se a 5.4 da mesma street teve lista não vazia e o conjunto exibido foi acertado. MUST NOT abrir após skip nem no river (RN-068).
- **FR-017**: Uma carta do baralho da próxima carta MUST ser **out** se e somente se, ao abri-la, a melhor 5 do herói vence **estritamente** a melhor 5 do vilão assumido (RN-061, RN-070). Cartas que só melhoram o herói sem virar o pote, ou que também dão ao vilão um jogo ainda melhor, MUST NOT ser outs. Cada carta MUST contar no máximo uma vez. N MUST ser a quantidade dessas cartas (N ≥ 1 nesta seção).
- **FR-018**: Um rank MUST ser out se existe pelo menos uma carta-out desse rank. Se parte das cartas daquele rank for suja, o rank MUST permanecer verdadeiro e N MUST incluir só as limpas (RN-062, CA-045). Ranks que melhoram dentro da mesma categoria MUST entrar na 5.8 se a carta for out, mesmo sem chip na 5.4 (RN-074).
- **FR-019**: A primeira pergunta da §5.8 MUST ser exatamente **“Quantas outs você tem?”**, seleção única, clique submete, sempre **6** inteiros distintos no intervalo 1–47 incluindo N. Distratoras MUST preferir N±1, N±2 e os totais comuns {4, 5, 8, 9, 12, 15}, sem repetir, preenchendo o que faltar com o inteiro mais próximo ainda livre. Ordem visual embaralhada (RN-063, RN-G008).
- **FR-020**: A segunda pergunta da §5.8 MUST ser exatamente **“Quais ranks são outs?”**, sempre os **13** rótulos **2**, **3**, **4**, **5**, **6**, **7**, **8**, **9**, **10**, **Valete**, **Dama**, **Rei**, **Ás** (identidade fixa; ordem visual embaralhada). Múltipla seleção + **Confirmar**. MUST NOT haver teto de 6 nem controle “marcar todas”. O foco inicial MUST ir à primeira opção da ordem visual (RN-064).
- **FR-021**: A terceira pergunta da §5.8 MUST ser exatamente **“Qual é a sua odd?”**, seleção única, clique submete, sempre **6** razões distintas no formato **X:1** incluindo a correta. Distratoras MUST preferir X±1 e {2:1, 3:1, 4:1, 5:1, 9:1, 11:1}, sem repetir. Ordem visual embaralhada (RN-066).
- **FR-022**: A odd correta MUST seguir a regra do **2**: P(ganho) = min(2 × N, 100)%; X = 50/N − 1; X inteiro com 0,5 arredondado para baixo; gabarito canônico da tabela RN-065 (N = 4 → 11:1; N = 9 → 5:1, não 4:1; N = 10 → 4:1). MUST valer no flop e no turn. MUST NOT usar a regra do 4. MUST NOT cobrar Pot Odds nem decisão de pagar (RN-065).
- **FR-023**: A 1ª tentativa de **quantas** MUST gravar +1 acerto ou +1 erro em `outs` (grupo único). A 1ª **Confirmar** de **quais ranks** MUST gravar +1 acerto em `outs` se o conjunto das 13 estiver perfeito; senão +1 erro em `outs` (sem acerto por rank). A 1ª tentativa da odd MUST gravar +1 acerto ou +1 erro só em `odds`. Tentativas seguintes MUST NOT mudar esses buckets. MUST NOT gravar N, lista de ranks, razão, cartas ou vilão assumido (RN-067, CA-046).
- **FR-024**: Após o beat de acerto da odd, a mesa MUST avançar a street (turn após o flop; river após o turn).
- **FR-025**: Feedback, retry, opção morta, marca de acerto, beat de acerto (≤1 s, 0 s se movimento reduzido), teclado e fail-open de persistência MUST reusar o contrato já vigente da 003. Textos canônicos: acerto **“Você acertou”**; erro **“Não é essa. Tente de novo.”**. MUST NOT haver `alert()`, pular pergunta nem revelar a certa antes do acerto (RN-034, RN-035, RN-G005).
- **FR-026**: A ordem **visual** das opções MUST ser embaralhada ao **apresentar** cada pergunta nova (5.4, quantidade, ranks, odd). MUST NOT reembaralhar após erro na mesma pergunta. MUST NOT reembaralhar o baralho da mão ao embaralhar opções (RN-G008).
- **FR-027**: O flop e o turn da **mesma** mão MUST ser exposições independentes em `upgrade`, `outs` e `odds` quando ambos tiverem 5.4 não vazia. MUST NOT fundir os deltas das duas streets (CA-048). Skip numa street MUST NOT criar exposição nesses buckets.
- **FR-028**: MUST haver no máximo uma pergunta por vez no HUD (RN-G001). MUST NOT avançar de street enquanto a 5.3, a 5.4 (ou skip) e — se houve 5.4 — a §5.8 dessa street não estiverem concluídas (RN-G002).
- **FR-029**: A evolução persistida MUST passar a ter **cinco** buckets na **mesma** chave já vigente da 003: `mao_atual` e `upgrade` (as 10 categorias, zeros até haver exposição), `vencedor_pote` (grupo único), `outs` (grupo único; quantidade e ranks são duas exposições), `odds` (grupo único). Desde a primeira gravação após esta feature, os cinco MUST constar. Bucket faltando num bloco legível MUST valer 0 sem zerar o resto. Bloco ilegível MUST ser descartado e zerado. Chaves extras desconhecidas MUST ser ignoradas. MUST NOT criar chave nova de overlay, de colinha, de vilão ou de mão. No MVP, exposições MUST ser iguais a acertos + erros daquele bucket/categoria (RN-037).
- **FR-030**: MUST NOT persistir cartas, vilão assumido, baralho da próxima carta, lista de outs, ranks, N, razão, snapshot, dump de comparação, information set, pool de cursor, enunciado, carimbo de data/hora, identificador de sessão ou qualquer dado pessoal. MUST NOT enviar mãos, respostas, contadores ou telemetria a servidor (RN-039, RN-071, CA-047).
- **FR-031**: MUST NOT haver tela de relatório, gráfico, ranking, tabela de desempenho nem botão de zerar. MUST NOT introduzir apostas, Pot Odds, regra do 4, quiz preflop, desistir da mão, mute na UI, cadastro, login, multiplayer, draws nomeados como rótulo, nem alterar apelidos (**Você**, **Adversário A**, **Adversário B**) ou a honestidade do baralho.
- **FR-032**: Se a memória de treino falhar, a avaliação e o quiz MUST continuar; a evolução MAY perder-se ao fechar. MUST NOT haver `alert()` nem jargão que bloqueie o HUD.
- **FR-033**: Se o vilão assumido não puder ser montado, ou se N / ranks / X não puderem ser fechados, a mão em curso MUST abortar: HUD `ociosa` com **Nova mão**. MUST NOT fingir lista vazia. MUST NOT inventar 0 outs. MUST NOT permanecer indefinidamente em “Você acertou”. Contadores já persistidos nesta visita MUST permanecer.
- **FR-034**: A lista da 5.4 e o gabarito da 5.8 da street MUST ser determinados assim que as comunitárias dessa street tiverem pousado. MUST NOT apresentar 5.4, skip ou 5.8 antes de a 5.3 dessa street estar acertada e o beat encerrado. Após o beat da 5.3 (e, se couber, da 5.4), o próximo passo MUST ficar visível imediatamente se já estiver pronto; se não estiver, o HUD MAY permanecer no acerto no máximo **1 segundo** extra. MUST NOT exibir spinner, percentual, “calculando” nem skip/zero falso de espera.
- **FR-035**: A avaliação MUST operar sobre um **snapshot** em memória. MUST NOT consumir, reordenar, retirar nem reembaralhar o baralho vivo. MUST NOT distribuir cartas hipotéticas nos slots. As 11 cartas de jogo e burns visuais MUST permanecer onde estão.
- **FR-036**: O showdown MUST continuar usando as hole **reais** de A e B e o contrato da feature 006. O vilão assumido MUST NOT substituir essas hole nem decidir o pote.
- **FR-037**: Esta feature MUST substituir o gabarito, o enunciado, a frase de skip e o horizonte da spec 005 para a pergunta da §5.4. MUST NOT reabrir a pasta `005-maos-ainda-possiveis`. MUST NOT redesenhar a identificação da mão atual (004) nem o showdown (006). RN-020 e CA-014–CA-017 MUST NOT ser reutilizados como gabarito.
- **FR-038**: Toda interface visível desta feature (enunciados, linha de suposição, 10 rótulos, 13 ranks, razões X:1, skip, **Confirmar**, **Continuar**, feedback herdado) MUST estar em português brasileiro, com termos de clube flop/turn/river/outs/odd/ranks permitidos. MUST NOT escrever “Pot Odds” na UI.
- **FR-039**: MUST NOT existir controle para marcar todas as opções de uma vez (5.4 ou ranks).
- **FR-040**: Quando o HUD entra em `perguntando` na 5.4 ou em “quais ranks”, o foco de teclado MUST ir à primeira opção na ordem visual. Tab MUST percorrer só opções ainda ativáveis e em seguida o **Confirmar**. Enter/Espaço na opção MUST ligar/desligar (não submete). Em “quantas outs” e “qual odd”, Enter/Espaço na opção MUST submeter; MUST NOT haver **Confirmar**.
- **FR-041**: As nove categorias **Royal flush**, **Straight flush**, **Quadra**, **Full house**, **Flush**, **Straight**, **Trinca**, **Dois pares** e **Par** MUST ser, cada uma, upgrade vencedor em pelo menos um caso de flop ou turn. **Carta alta** MUST NEVER ser upgrade vencedor.
- **FR-042**: No caso CA-033, N MUST ser **10** e os ranks verdadeiros MUST ser **Rei**, **Dama** e **Valete** (CA-040, CA-041). A odd correspondente MUST ser **4:1** (CA-042).
- **FR-043**: A linha de suposição da 5.4 MAY permanecer visível (só leitura) durante a §5.8 da mesma street e MUST NOT contar como segunda pergunta (RN-G001).
- **FR-044**: Quantidade e odd MUST caber na grade de 6 já usada nas outras perguntas. Os 13 ranks MUST caber no HUD em faixa compacta (quebra em duas ou três linhas); MUST NOT forçar grade 2×3; no desktop de referência MUST NOT cobrir comunitárias, hole do herói nem assentos.

### Key Entities

- **Vilão assumido**: duas cartas sintéticas da receita pessimista (RN-055), legais em relação ao herói e ao board. Não são as hole reais de A/B. Não são cartas de jogo. Vivem só na memória da visita.
- **Linha de suposição**: frase única de RN-059 exibida no HUD na 5.4 (e, se desejado, só leitura na 5.8). Não lista cartas nem kickers.
- **Baralho da próxima carta**: cartas ainda elegíveis como o próximo comunitário, depois de retirar hole do herói, board aberto e as 2 assumidas (RN-056).
- **Upgrade vencedor**: rótulo canônico estritamente mais forte que a atual, que não é **Carta alta**, para o qual existe pelo menos uma próxima carta cuja melhor 5 do herói é **exatamente** esse rótulo **e** vence estritamente o vilão assumido (RN-057).
- **Lista de upgrades vencedores**: o conjunto RN-057 da street, **antes** do teto de 6. Pode ser vazia.
- **Conjunto de opções exibidas (5.4)**: até 6 rótulos visíveis. Único conjunto cobrado na pergunta de categorias.
- **Out**: carta do baralho da próxima carta que, ao abrir, faz o herói vencer estritamente o vilão assumido (RN-061). N = quantidade de outs.
- **Rank out**: um dos 13 rótulos de RN-064 para o qual existe pelo menos uma out (RN-062).
- **Odd da próxima carta**: razão **X:1** da regra do 2 aplicada a N (RN-065). Não é Pot Odds.
- **Pergunta de upgrades vencedores**: múltipla seleção no HUD; enunciado **“Quais mãos melhoram o seu jogo com chance de ganhar o pote?”**; CTA **Confirmar**.
- **Skip `sem_upgrade`**: frase **“Não há mão que vire o pote.”** + **Continuar**. Não é pergunta; não gera estatística; bloqueia a §5.8.
- **Pergunta de quantidade**: seleção única; **“Quantas outs você tem?”**; 6 totais; 1ª tentativa em `outs`.
- **Pergunta de ranks**: múltipla seleção; **“Quais ranks são outs?”**; 13 rótulos; 1ª **Confirmar** em `outs` (exposição independente).
- **Pergunta de odd**: seleção única; **“Qual é a sua odd?”**; 6 razões X:1; 1ª tentativa em `odds`.
- **Evolução de treino (converge 003)**: memória no dispositivo, mesma chave já vigente. Cinco buckets: `mao_atual`, `upgrade`, `vencedor_pote`, `outs`, `odds`. Só contadores. Sem PII e sem dump da mão.
- **Snapshot da visita**: cópia em memória do vilão, do baralho da próxima carta, da lista de upgrades, das outs e da odd. Não se persiste.

### Fora de escopo (esta feature)

- Casco da mesa, cinco estados do HUD, deal, burns cênicos, áudio (features 001–002) — o estado `perguntando` precisa **caber** 13 ranks; os cinco estados **não** aumentam.
- Contrato visual de retry, feedback, ordem visual, CTAs **Confirmar** / **Continuar** e fail-open (feature 003) — esta feature **estende** o modelo persistido com `outs` e `odds` e **reusa** seleção única e múltipla.
- Identificação da mão atual do herói no flop/turn (feature 004) — enunciado da 5.3 inalterado.
- Pasta histórica `005-maos-ainda-possiveis` — contrato invalidado; **não** reabrir.
- River: virada de A e B, categorias do showdown, vencedor do pote com hole **reais** (feature 006).
- Colinha de classificação (feature 007) — sem chave própria; só o bloco de evolução passa a ter cinco buckets.
- Pot Odds, regra do 4, apostas, call/fold, draws nomeados como rótulo, quiz preflop, relatório visual, botão zerar, login, multiplayer, outras variantes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dado o caso CA-033, em 100% das aberturas da 5.4 o enunciado é **“Quais mãos melhoram o seu jogo com chance de ganhar o pote?”**, a linha é a do par mais alto, **Par** e **Straight** são verdadeiros, e um par de 9 ou de 5 sozinho não torna **Par** falso.
- **SC-002**: Dado que a única forma de completar **Par** perde do vilão assumido, em 100% dos casos **Par** não é upgrade verdadeiro (CA-034).
- **SC-003**: Em 100% dos turns com exatamente 2 upgrades vencedores, a grade tem esses 2 + 4 distratoras (CA-035).
- **SC-004**: Em 100% das listas vazias de upgrades vencedores, o HUD usa **“Não há mão que vire o pote.”** + **Continuar**, 0 contadores `upgrade`/`outs`/`odds` mudam e 0 perguntas da §5.8 aparecem (CA-036, CA-043).
- **SC-005**: Dado Flush verdadeiro (vencedor) e Par distratora na 1ª **Confirmar** com os dois marcados, em 100% dos casos Flush em `upgrade` tem +1 acerto, Par tem +1 erro, Par desabilita e a pergunta permanece aberta (CA-037).
- **SC-006**: Em 100% das 5.4 abertas, A e B permanecem fechados e 0 cartas assumidas aparecem como hole (CA-038).
- **SC-007**: Em 100% dos flops em que Flush só existe runner-runner, **Flush** não é verdadeiro (CA-039).
- **SC-008**: Dado o caso CA-033 com a 5.4 acertada, em 100% das aberturas da §5.8 a primeira pergunta é **“Quantas outs você tem?”**, a correta é **10**, há 6 totais incluindo 10, e o turn ainda não abriu (CA-040).
- **SC-009**: Após acertar 10 nesse caso, em 100% das grades de ranks há exatamente os 13 rótulos; o conjunto verdadeiro é **Rei**, **Dama** e **Valete**; 9 e 5 não são verdadeiros (CA-041).
- **SC-010**: Com N = 10 e ranks acertados, em 100% das perguntas de odd a correta é **4:1** e há 6 razões distintas (CA-042).
- **SC-011**: Com N = 4, a odd cobrada é **11:1** em 100% dos casos; com N = 9, é **5:1** e não 4:1 (CA-044).
- **SC-012**: Dado 4 Valetes no baralho da próxima carta com 2 limpos e 2 sujos, em 100% dos gabaritos N inclui 2 (não 4) e **Valete** é rank verdadeiro (CA-045).
- **SC-013**: Dado erro na 1ª quantidade e acerto depois, em 100% dos casos `outs` tem +1 erro e +0 acerto nessa exposição; a 1ª Confirmar dos ranks é outra exposição em `outs`; a odd escreve só `odds` (CA-046).
- **SC-014**: Dado acerto de primeira nas três perguntas da §5.8, em 100% das inspeções o bloco persistido tem os cinco buckets e 0 cartas, 0 ranks, 0 N, 0 razão, 0 vilão assumido e 0 information set (CA-047).
- **SC-015**: Em 100% das mãos com 5.4 não vazia no flop **e** no turn, as 1ªs tentativas são exposições independentes em `upgrade`, `outs` e `odds` (CA-048).
- **SC-016**: Em 100% dos acertos da 5.3 no flop, a mesa segue para 5.4 ou skip da **mesma** street; 0 desses acertos abrem o turn ainda.
- **SC-017**: Em 100% dos acertos da 5.4 (não-skip), a mesa abre a §5.8 da mesma street; 0 desses acertos avançam de street nesse instante.
- **SC-018**: Em 100% das mãos, o river apresenta 0 perguntas de upgrades, outs ou odd.
- **SC-019**: Em 100% das UIs desta feature há 0 ocorrências de “Pot Odds”, 0 usos da regra do 4, 0 rótulos `flush draw` / `gutshot` / `overcards` e 0 kickers por extenso.
- **SC-020**: Em qualquer sequência de 10 perguntas novas (5.4, quantidade, ranks ou odd), o conjunto obrigatório **não** ocupa a mesma ordem visual em todas; após erro, 100% das retries da mesma pergunta mantêm a ordem.
- **SC-021**: 0 coletas de dado pessoal; 0 persistência de cartas, vilão, outs, ranks, razão ou snapshot; o único efeito que sobrevive ao fechar a aba continua sendo a evolução de treino, agora com cinco buckets na mesma chave.
- **SC-022**: Em 100% das falhas ao montar o vilão ou ao fechar N/ranks/X, o HUD volta a `ociosa` com **Nova mão**; 0 skips falsos; 0 invenções de 0 outs.
- **SC-023**: Em 100% das avaliações, as 11 cartas de jogo e burns visuais permanecem inalterados (mesmas faces, mesmos slots).
- **SC-024**: Em 100% dos showdowns, o pote usa as hole reais de A e B; 0 vencedores decididos pelo vilão assumido.
- **SC-025**: Em 100% das UIs desta feature há 0 controles “marcar todas”.
- **SC-026**: Cada uma das nove categorias Royal flush … Par é upgrade vencedor em ≥1 caso de flop ou turn; **Carta alta** é upgrade vencedor em 0 casos.
- **SC-027**: Em 100% das aberturas da 5.4 e de “quais ranks”, o foco de teclado começa na primeira opção visual; Enter/Espaço nessa opção não submete.
- **SC-028**: Em 100% das streets, a lista da 5.4 e o gabarito da 5.8 já estão determinados quando as comunitárias dela pousam; em 0% dos casos pergunta, skip ou §5.8 aparecem antes do acerto e do beat da 5.3.
- **SC-029**: Em 100% dos acertos da 5.3 (e da 5.4 quando couber), o próximo passo fica visível no fim do beat ou em no máximo 1 segundo extra; 0 spinners, 0 textos “calculando”, 0 skips/zeros só por espera.
- **SC-030**: Em 100% das travessias da UI do MVP, há 0 telas de relatório, 0 gráficos de desempenho e 0 botões de zerar.

## Assumptions

- **Git / numeração**: o diretório da feature é `specs/008-desconto-outs/` (ShortName `desconto-outs`, número **008**, sequential). Não há `.specify/extensions.yml` nem hook `before_specify`; a branch Git corrente (`feature/issue-4`) **não** precisa mudar. Identidade da spec: `008-desconto-outs`. **Não** houve commit nesta invocação.
- **Fonte de verdade**: comportamento desta spec = PRD §5.4 revista + §5.8 (RN-055, RN-056, RN-057, RN-059, RN-060, RN-061, RN-062, RN-063, RN-064, RN-065, RN-066, RN-067, RN-068, RN-069, RN-070, RN-071, RN-074 e RN-021, RN-022, RN-023, RN-024, RN-025, RN-026, RN-027, RN-037, RN-046, RN-047 reiterados; CA-033 a CA-048) + RN-G001, RN-G002, RN-G004, RN-G005, RN-G007, RN-G008 + converge de storage da feature 003 + avaliador de melhor 5 da feature 004 + showdown da 006 (hole reais) + gates da constitution 1.1.0 (idioma, LGPD com cinco buckets, custo zero, treino e não jogo, fail-open) + CR-002 + estudo pedagógico `docs/studies/outs-and-odds.md` **só** no desconto de outs e na regra do 2 (Pot Odds do estudo **fora**). Nenhum `[NEEDS CLARIFICATION]` residual.
- **005 histórica**: RN-020, CA-014–017, o enunciado “Quais mãos você ainda não tem, mas ainda pode formar?”, a frase “Não há upgrade possível.”, o runout de duas cartas no flop e a decisão “adversário não desconta” **deixam de valer** para o produto. A pasta 005 não se edita nesta invocação.
- **Escolha autônoma — distratoras da 5.4**: o PRD define *o que* é distratora e o teto 6; a ordem de preenchimento quando sobram várias permanece a da 005: da mais forte para a mais fraca na tabela canônica, sem repetir. Determinístico.
- **Escolha autônoma — “exatamente C”**: um desfecho testemunha só a categoria da melhor 5. Não se promove categoria inferior “embutida”.
- **Escolha autônoma — duas streets**: flop e turn são exposições independentes em `upgrade`, `outs` e `odds` quando ambos têm 5.4 não vazia (CA-048).
- **Escolha autônoma — avaliador**: reusa o critério de melhor 5 da 004 (ranking completo, kickers só por dentro; wheel legal, wrap ilegal, royal ≠ straight flush). Kickers MUST NOT vazar na UI.
- **Escolha autônoma — momento da lista**: determinar 5.4 e 5.8 no pouso das comunitárias da street, não depois do beat, para o HUD não congelar. Mostrar continua gated por RN-G002 / RN-068.
- **Escolha autônoma — falha**: abortar a mão (`ociosa` + **Nova mão`) se o vilão não montar ou N/ranks/X não fecharem. Skip falso ou N = 0 inventado treinaria a lição errada.
- **Escolha autônoma — snapshot**: avaliar sem tocar no baralho vivo preserva as 11 cartas de jogo (feature 002). As 2 assumidas não entram nesse mapeamento.
- **Escolha autônoma — espera**: teto de 1 s extra no estado de acerto, alinhado ao beat da 003; sem spinner e sem skip/zero de espera.
- **Escolha autônoma — linha na 5.8**: o PRD permite permanecer visível; adota-se **permanece** (só leitura) para o treinando não esquecer a suposição ao contar outs.
- **Escolha autônoma — N ≥ 1**: se a 5.4 não é skip, existe pelo menos uma próxima carta que vence; essa carta é out. A 5.8 nunca pede 0.
- **Escolha autônoma — ranks sem teto**: o PRD já fixa os 13; não se recorta aos 6 mais frequentes.
- **Escolha autônoma — `outs` como grupo único**: quantidade e ranks incrementam o mesmo bucket em exposições distintas (RN-037, RN-067), não dez categorias de rank.
- **Escolha autônoma — converge 003**: mesma chave, mesmo fail-open, mesmos textos de feedback; só se acrescentam os dois grupos. Bloco antigo sem `outs`/`odds` (três buckets) é **legível**: os dois novos valem 0, o restante permanece — não é corrupção.
- **Escolha autônoma — CA-032**: a colinha continua sem chave; o bloco de evolução passa a listar cinco buckets. A pasta 007 não se reabre; o critério atualizado vive aqui.
- **Copy canônica**: 5.4 = “Quais mãos melhoram o seu jogo com chance de ganhar o pote?”; skip = “Não há mão que vire o pote.”; quantidade = “Quantas outs você tem?”; ranks = “Quais ranks são outs?”; odd = “Qual é a sua odd?”; acerto = “Você acertou”; erro = “Não é essa. Tente de novo.”; CTAs = **Confirmar** e **Continuar**. Frases de RN-059 sem sinônimo.
- **Privacidade**: apelidos fixos **Você**, **Adversário A**, **Adversário B**; avatares ilustrados. Recarregar aborta a mão e não apaga evolução já gravada. Coordenadas de ponteiro da 002, vilão, outs, ranks, razão e snapshot MUST NOT ser persistidos.
- **Constitution como constraint**: sem backend, sem cadastro, custo zero, sem relatório/zerar, desktop-first, fail-open, RN-G001..G008, constitution 1.1.0 (buckets `outs` e `odds`; Pot Odds fora). Detalhe de implementação fica para `/speckit-plan`.
- **Idioma**: UI em pt-BR; identificadores internos podem estar em inglês.
- **Clarify / plan / tasks / implement**: esta invocação **não** executa plan/tasks/implement, **não** altera código de produção e **não** faz commit.
