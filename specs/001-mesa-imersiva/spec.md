# Feature Specification: Mesa imersiva e sessão de treino

**Feature Branch**: `001-mesa-imersiva`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "Implementar a mesa imersiva de Texas Hold’em no navegador com estados de HUD ociosa/deal/perguntando/sem_upgrade/resultado, CTA Nova mão (ociosa) e Próxima mão (desfecho), feltro de clube, três assentos (Você, Adversário A, Adversário B), slots das cinco comunitárias, hole cards do herói abertas ao pousar e das dos adversários fechadas até o showdown, pote cênico sem apostas, HUD estilo barra de ação, desktop-first, sem quiz preflop, sem desistir da mão, som sintético fail-open — conforme PRD §5.1 (RN-001, RN-002, RN-003, RN-004, RN-005, RN-006, RN-007, RN-041, RN-042, RN-043, CA-001, CA-002, CA-003, CA-004, CA-005, CA-026)"

## User Scenarios & Testing *(mandatory)*

Esta feature é o **casco da sessão**: a mesa de clube, os três assentos, o board, o pote cênico e o HUD que conduz o treino. O valor é fazer o cérebro ensaiar leitura **dentro** de uma mesa de poker online, não ao lado dela. O conteúdo das perguntas, o embaralhamento das 11 cartas de jogo e a memória de desempenho pertencem a features posteriores; aqui define-se o palco, a cadência e os estados visíveis.

### User Story 1 - Abrir a mesa ociosa de clube (Priority: P1)

O treinando abre o produto no computador e, sem wizard nem cadastro, vê uma mesa de Texas Hold’em pronta: feltro oval de clube, três assentos ocupados (Você embaixo, Adversário A e Adversário B), slots vazios das cinco comunitárias, pote de fichas só como cenografia e um HUD com uma linha de propósito (“Treine ler as mãos. Sem apostas.”) mais o botão **Nova mão**. Não há opções de quiz.

**Why this priority**: Sem este quadro, o produto falha o motivo de existir (treino na cadência da mesa). É o primeiro instante e o critério CA-001.

**Independent Test**: Abrir o app no layout de referência desktop, em primeira visita ou após recarregar, e verificar feltro, três assentos com avatar e apelido, slots de comunitárias, pote cênico, HUD em `ociosa` e CTA **Nova mão**, sem opções de quiz.

**Acceptance Scenarios**:

1. **Given** o app acaba de abrir no desktop (primeira visita), **When** o treinando olha a tela, **Then** há feltro de clube, três assentos com avatar e nome (**Você**, **Adversário A**, **Adversário B**), slots das cinco comunitárias vazios, pote decorativo e CTA **Nova mão** — sem opções de quiz (CA-001, RN-002, RN-043).
2. **Given** o HUD está `ociosa`, **When** o treinando lê o painel, **Then** vê exatamente a linha de propósito “Treine ler as mãos. Sem apostas.” e **não** vê tutorial em etapas.
3. **Given** a mesa ociosa, **When** o treinando procura ações de aposta, fold, dealer button funcional ou timer, **Then** não encontra nenhuma dessas ações (RN-003).

---

### User Story 2 - Iniciar a mão sem quiz preflop (Priority: P1)

O treinando aciona **Nova mão**. As hole cards são distribuídas aos três assentos. Enquanto as cartas ainda voam, o HUD fica em `deal` e **não** apresenta opções clicáveis. Com o board ainda vazio, nenhuma pergunta ocorre.

**Why this priority**: Quiz em cima do deal ou antes do flop treina o contexto errado (prova escolar, não mesa). É RN-041 e CA-026.

**Independent Test**: Acionar **Nova mão** a partir de `ociosa` e, durante o voo das hole cards, confirmar HUD `deal` sem opções clicáveis; com o board vazio, confirmar que nenhuma pergunta aparece.

**Acceptance Scenarios**:

1. **Given** a mesa `ociosa`, **When** o treinando aciona **Nova mão**, **Then** inicia-se o deal das hole cards e o HUD passa a `deal` (RN-043).
2. **Given** o deal em andamento, **When** as hole cards ainda voam, **Then** o HUD **não** apresenta opções clicáveis (CA-026).
3. **Given** as hole cards já pousaram e o board ainda está vazio, **When** o treinando espera a próxima ação, **Then** **não** há pergunta (RN-041).
4. **Given** uma mão em curso, **When** o treinando procura **Desistir**, **Nova mão** ou equivalente para abandonar, **Then** esse CTA não existe; abandonar a mão é recarregar a página (RN-042).

---

### User Story 3 - Ver as próprias cartas e as dos adversários no momento certo (Priority: P1)

Ao pousar, as duas hole cards do herói abrem no assento inferior. As dos adversários permanecem fechadas no flop e no turn. No início do showdown (river aberto + virada), as hole cards de A e B abrem nos respectivos assentos.

**Why this priority**: É o contrato visual de Hold’em no treino (RN-001, RN-005, RN-006) e os critérios CA-003 e CA-004. Sem isso a mesa mente sobre informação.

**Independent Test**: Percorrer uma mão até o flop/turn e conferir adversários fechados e herói aberto; no início do showdown, conferir as seis hole cards abertas.

**Acceptance Scenarios**:

1. **Given** o deal acabou de pousar, **When** o treinando olha o assento inferior, **Then** as duas hole cards de **Você** estão abertas (RN-006).
2. **Given** o flop ou o turn já abriu, **When** o treinando olha os assentos adversários, **Then** as hole cards deles estão viradas para baixo (CA-003, RN-005).
3. **Given** o início do showdown (river aberto e primeira pergunta do river), **When** o treinando olha A e B, **Then** as hole cards dos dois adversários estão abertas nos respectivos assentos (CA-004).
4. **Given** qualquer momento da mão, **When** o treinando olha o centro, **Then** existem cinco slots fixos de comunitárias (flop nas três primeiras posições; turn e river nos slots 4 e 5); slots ainda não da street permanecem visíveis e vazios (RN-001).

---

### User Story 4 - Treinar pelo HUD da mesa, não por um questionário solto (Priority: P2)

Perguntas, feedback e o botão de desfecho entram como HUD da própria mesa (faixa inferior / painel sobre o feltro), no estilo da barra de ações de um client de poker. O HUD tem exatamente os estados `ociosa`, `deal`, `perguntando`, `sem_upgrade` e `resultado`. Uma pergunta por vez. O quiz da street só habilita **depois** das cartas dessa street pousarem.

**Why this priority**: A imersão é requisito de produto, não ornamentação. Sem o HUD integrado, o treino não transfere para a mesa presencial.

**Independent Test**: Observar o HUD em cada estado da sessão; no flop recém-pousado, confirmar `perguntando` com opções habilitadas e enunciado da mão atual do herói (CA-002), sem `alert()` e sem cartões de prova escolar.

**Acceptance Scenarios**:

1. **Given** o flop acabou de pousar, **When** o HUD pergunta, **Then** as três cartas do flop estão no centro, as opções estão habilitadas e o enunciado é o da mão atual do herói (CA-002).
2. **Given** o HUD em `perguntando`, **When** o treinando lê o painel, **Then** vê enunciado + até 6 opções, uma pergunta por vez, sobre fundo de HUD (não formulário branco nem popup do navegador).
3. **Given** no flop ou turn não há upgrade possível, **When** essa condição ocorre, **Then** o HUD entra em `sem_upgrade` com a frase de que não há upgrade e o CTA **Continuar**.
4. **Given** o vencedor do pote foi acertado, **When** o desfecho aparece, **Then** o HUD está em `resultado`: quem levou o pote, as três categorias já identificadas e o CTA **Próxima mão** (RN-043).
5. **Given** cartas de uma street ainda estão animando, **When** o treinando tenta responder, **Then** o quiz ainda não está habilitado; habilita só após pousarem.

---

### User Story 5 - Encerrar a rodada e pedir a próxima mão na mesma mesa (Priority: P2)

Ao acertar quem ganhou, o treinando vê o desfecho na mesa (incluindo divisão visual do bolo de fichas se houver empate, sem contas). Aciona **Próxima mão**: a mesa permanece, as cartas são recolhidas e uma nova mão é distribuída, de novo sem quiz preflop e sem recarregar a página de forma perceptível.

**Why this priority**: O volume de treino depende de encadear mãos sem sair do clube (CA-005).

**Independent Test**: Chegar a `resultado`, acionar **Próxima mão** e verificar recolhimento, novo deal na mesma mesa, HUD `deal` e ausência de pergunta com board vazio.

**Acceptance Scenarios**:

1. **Given** o fim da rodada no HUD `resultado`, **When** o treinando aciona **Próxima mão**, **Then** a mesa permanece, as cartas são recolhidas e uma nova mão é distribuída, de novo sem quiz preflop (CA-005, RN-041, RN-043).
2. **Given** empate no pote, **When** o desfecho é exibido, **Then** o bolo de fichas divide-se visualmente entre os vencedores — sem valores em bb e sem contabilidade (RN-003).
3. **Given** o treinando está em `resultado` ou `ociosa`, **When** procura um botão chamado **Embaralhar**, **Then** esse nome de CTA não existe (RN-043).

---

### User Story 6 - Mesa usável mesmo muda, no desktop primeiro (Priority: P3)

O som de shuffle, deal, flop, virada de showdown, acerto e erro existe, em mix baixo, sem trilha contínua e sem controle de mute na interface. Se o navegador bloquear o áudio, a mesa segue muda: o treino não para e não há modal agressivo. O layout de referência é desktop; tablet mantém mesa + HUD sem cortar cartas até ficarem ilegíveis; no celular o HUD pode empilhar abaixo, com cartas ainda legíveis.

**Why this priority**: Fail-open e desktop-first são gates da constitution; o som apoia a imersão, mas a habilidade treinada é a leitura.

**Independent Test**: Iniciar mãos com áudio permitido e com áudio bloqueado; conferir ausência de modal e de mute; conferir desktop completo e degradação previsível em viewport estreita.

**Acceptance Scenarios**:

1. **Given** o navegador bloqueia o áudio, **When** o treinando inicia ou continua uma mão, **Then** a mesa segue muda, o treino continua e não aparece modal agressivo nem diálogo nativo de erro.
2. **Given** o áudio está permitido após o primeiro gesto (**Nova mão** ou **Próxima mão**), **When** ocorrem shuffle, deal, flop, virada de showdown, acerto ou erro, **Then** há um som curto correspondente; não há trilha contínua.
3. **Given** o layout desktop de referência, **When** o treinando usa a mesa, **Then** feltro, três assentos, cinco slots de comunitárias e HUD cabem sem cortar cartas até ficarem ilegíveis (RN-007).
4. **Given** viewport estreita demais, **When** o layout se adapta, **Then** o HUD pode descer/empilhar e as cartas da mesa não se sobrepõem até ficarem ilegíveis (RN-007).

---

### Edge Cases

- Recarregar no meio da mão: a mão em curso perde-se; o HUD volta a `ociosa` com **Nova mão**; não se pede dado pessoal para “retomar”. A evolução de desempenho, quando existir (feature posterior), não é apagada por este reset de sessão.
- Áudio bloqueado, contexto de som indisponível ou unlock não ocorrido: mesa muda; treino segue; sem `alert()`, sem modal agressivo, sem botão de mute/volume.
- Animações pesadas ou dispositivo lento: as cartas ainda chegam aos lugares certos; o quiz só habilita depois de pousarem. Teto de ritmo: cerca de 1 segundo de animação por street depois da primeira mão da sessão (a primeira pode ser um pouco mais lenta). “Não travar a interface” não significa permitir clique enquanto a carta ainda voa.
- Tela estreita demais: HUD desce; cartas permanecem legíveis; a imersão no celular não precisa igualar o desktop.
- Primeira visita: a mesma mesa `ociosa` da visita seguinte; sem onboarding de vários passos.
- Usuário tenta abandonar a mão sem recarregar: não há CTA **Desistir** nem **Nova mão** durante a mão; a única saída é recarregar a página.
- Empate de pote no desfecho: celebração visual de split; fichas se dividem na cenografia; não há contas nem valores em bb.
- Falha ao iniciar o deal: o HUD volta a `ociosa` e oferece **Nova mão** de novo; a mesa não fica presa em `deal`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A variante MUST ser Texas Hold’em: cada jogador recebe 2 hole cards; o board tem 5 comunitárias (flop 3, turn 1, river 1). “Fechadas” no padrão Hold’em não esconde as cartas do herói de si mesmo (RN-001, RN-006).
- **FR-002**: A mesa MUST ter sempre 3 jogadores, sem assentos vazios: herói no assento inferior (frente à câmera), Adversário A e Adversário B (RN-002). Apelidos estáveis na UI: **Você**, **Adversário A**, **Adversário B**.
- **FR-003**: MUST NOT existir apostas, blinds, raises, fold, side pots, dealer button funcional nem timer de ação. Fichas e pote MUST ser cenografia, sem valor em bb. Em split, o bolo de fichas MUST dividir-se visualmente, sem contas (RN-003).
- **FR-004**: Toda interface visível ao treinando MUST estar em português brasileiro. Termos de clube (flop, turn, river, showdown) MAY permanecer em inglês, com rótulo claro. Os nomes de categoria do quiz, quando o HUD os exibir, MUST ser os rótulos canônicos do produto, sem sinônimos misturados na UI (RN-004).
- **FR-005**: As hole cards dos adversários MUST permanecer fechadas até o início do showdown (river aberto + virada) (RN-005, CA-003, CA-004).
- **FR-006**: O herói MUST ver as próprias hole cards desde o fim do deal, abertas no assento inferior (RN-006).
- **FR-007**: O layout de referência MUST ser desktop. Tablet MUST manter mesa + HUD sem cortar cartas até ficarem ilegíveis. Celular no MVP MAY empilhar o HUD abaixo; cartas ainda MUST ser legíveis; a imersão NÃO precisa igualar o desktop (RN-007).
- **FR-008**: MUST NOT haver quiz preflop. Nenhuma pergunta MUST ocorrer com o board ainda vazio (RN-041).
- **FR-009**: MUST NOT haver CTA **Desistir** nem **Nova mão** durante uma mão em curso. Abandonar a mão MUST ser recarregar a página (RN-042).
- **FR-010**: Labels de CTA MUST ser **Nova mão** na mesa ociosa e **Próxima mão** após o desfecho. MUST NOT usar “Embaralhar” como nome de botão (RN-043).
- **FR-011**: O HUD MUST implementar exatamente os estados `ociosa`, `deal`, `perguntando`, `sem_upgrade` e `resultado`, com o conteúdo abaixo:
  - `ociosa`: linha de propósito + CTA **Nova mão** (app aberto, após reload no meio da mão, ou ainda não iniciou).
  - `deal`: cartas voando; sem opções clicáveis (CA-026).
  - `perguntando`: street aberta e quiz ativo; enunciado + até 6 opções.
  - `sem_upgrade`: não há upgrade possível no flop/turn; frase de que não há upgrade + **Continuar**.
  - `resultado`: vencedor acertado; quem levou o pote, as 3 categorias já identificadas, CTA **Próxima mão**.
- **FR-012**: A tela principal MUST ser a mesa (feltro oval de clube, rail, posições, cartas, avatares, pote decorativo). Perguntas, feedback e **Próxima mão** MUST entrar como HUD da mesa (faixa inferior / painel sobre o feltro), estilo barra de ações de client de poker. MUST NOT usar `alert()`, formulário branco institucional nem cartões de questionário escolar soltos sobre fundo genérico.
- **FR-013**: Após **Nova mão** ou **Próxima mão**, o fluxo visível MUST ser: deal das hole cards (ainda sem pergunta) → abre o flop e só então HUD `perguntando` → após o flop completo, abre o turn e o quiz do turn → após o turn completo, abre o river, vira as hole cards adversárias e segue o showdown → ao acertar quem ganhou, HUD `resultado`.
- **FR-014**: Dado o flop recém-pousado, o HUD MUST perguntar com as três comunitárias no centro, opções habilitadas e enunciado da mão atual do herói (CA-002). O quiz MUST habilitar só depois das cartas da street pousarem.
- **FR-015**: **Próxima mão** MUST recolher as cartas e distribuir uma nova mão na mesma mesa, sem reload perceptível da página e de novo sem quiz preflop (CA-005).
- **FR-016**: Recarregar no meio da mão MUST perder a mão em curso e voltar o HUD a `ociosa`. MUST NOT solicitar dado pessoal para retomar. MUST NOT depender de cadastro, login, conta ou perfil.
- **FR-017**: Feltro MUST parecer clube: verde-mesa profundo (não verde lima de clipart), rail em madeira ou borracha escura, vinco oval, iluminação tipo holofote no centro (comunitárias no ponto mais claro). Ambiente escuro; chrome de página (header, rodapé, créditos) mínima ou inexistente durante o treino.
- **FR-018**: Cartas MUST ser baralho clássico de poker: índices grandes e contrastados, naipes vermelho/preto inequívocos, um único verso para cartas fechadas, tamanho suficiente para ler rank e naipe a cerca de 70 cm do monitor. MUST NOT usar emoji nem caracteres Unicode de baralho como carta principal.
- **FR-019**: Cada assento MUST ter avatar (ilustração ou ficha de personagem — MUST NOT foto de pessoa real), apelido estável e um pequeno stack de fichas decorativo. O herói MUST ser visualmente o lugar do player (maior, mais perto, HUD ancorado nele).
- **FR-020**: O board MUST ter cinco slots fixos no centro (três do flop alinhados; turn e river nos slots 4 e 5). Slots vazios MUST permanecer visíveis antes da street.
- **FR-021**: O HUD MUST ter tipografia nítida sobre fundo escuro/translúcido, alto contraste, uma pergunta por vez, opções em botões grandes. Estados visíveis das opções: padrão, hover, foco de teclado, selecionado, correto, errado-desabilitado. Feedback de acerto/erro MUST ser reação da mesa (flash no HUD, som curto, texto “Você acertou” / “Não é essa. Tente de novo.”), nunca popup do browser. Erro vs acerto MUST aparecer também em texto, não só por cor.
- **FR-022**: Movimento MUST incluir deal em leque/deslize até o assento; flop abrindo as três em sequência rápida; turn e river MAY ter queima visual breve (verso teatral, depois a street abre) sem que essa queima faça parte do board nem consuma carta de jogo. Teto: cerca de 1 s de animação por street depois da primeira mão da sessão.
- **FR-023**: Som MUST existir nos eventos shuffle, deal, flop, virada de showdown, acerto e erro; mix baixo; sem trilha contínua. MUST NOT haver controle de mute ou volume na UI. Se o áudio for bloqueado, falhar ou não for liberado, a mesa MUST seguir muda e o treino MUST continuar, sem modal agressivo.
- **FR-024**: MUST NOT haver: fundo branco de landing page; logo gigante; cartões estilo dashboard; lista nua de prova; baralho de Unicode; confetes infantis; mascote falante; tutorial de 8 passos; chat; emotes; rake; lobby; botão de zerar evolução; tela de relatório.
- **FR-025**: MUST NOT coletar, solicitar ou persistir CPF, e-mail, nome real, apelido digitado, telefone, endereço ou qualquer identificador pessoal. Avatares e apelidos são de produto, não de cadastro. MUST NOT enviar mãos, respostas ou telemetria pessoal a servidor.
- **FR-026**: O produto MUST operar como sessão local de um único treinando no navegador, sem adversários que “joguem” e sem segunda tela que tire o usuário do clube durante o treino.

### Key Entities

- **Mesa**: palco único da sessão; feltro, rail, holofote central, três assentos, board de cinco slots, pote cênico e HUD. Não há lobby nem rota paralela de quiz.
- **HUD**: painel de pergunta/ação integrado à mesa. Atributo de estado: `ociosa` | `deal` | `perguntando` | `sem_upgrade` | `resultado`. Mostra no máximo uma pergunta por vez.
- **Assento**: posição de um dos três jogadores. Atributos: apelido estável, avatar ilustrado (não foto real), stack cênico, duas hole cards (abertas ou fechadas conforme a regra de visibilidade).
- **Carta**: face (rank + naipe) ou verso padronizado. Relaciona-se a um assento (hole) ou a um slot do board (comunitária). Burn, se existir, é só verso teatral — não é carta da mão.
- **Board**: cinco slots fixos; flop ocupa 1–3, turn o 4, river o 5. Slots futuros ficam visíveis e vazios.
- **Pote cênico**: bolo de fichas sem valor; no desfecho pode caminhar ao(s) vencedor(es) ou dividir-se visualmente.
- **Mão de treino**: ciclo da sessão desde o deal até `resultado` (ou até o reload, que a aborta). Não inclui fase de perguntas preflop.
- **CTA de sessão**: **Nova mão** só em `ociosa`; **Próxima mão** só em `resultado`; **Continuar** só em `sem_upgrade`.

### Fora de escopo (esta feature)

- Algoritmo de embaralhamento, fontes de entropia e mapeamento das 11 cartas de jogo (PRD §5.2 / feature 002).
- Motor de avaliação de mãos, kickers, empates lógicos e enumeração de upgrades (PRD §5.3–5.5).
- Contrato completo de retry, desabilitar opção errada, ordem embaralhada das opções e persistência de contadores (PRD §5.6 / feature 003) — esta feature só reserva o HUD e o texto de feedback visível.
- Conteúdo e correção das perguntas de mão atual, upgrades e vencedor (features 004–006), salvo a cadência e os estados do HUD descritos aqui.
- Apostas, estratégia, quiz preflop, desistir da mão, mute na UI, relatório, zerar stats, multiplayer, login, outras variantes de poker.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das aberturas no desktop (primeira visita ou após reload), o treinando vê feltro, três assentos com avatar/nome, slots de comunitárias e CTA **Nova mão**, com zero opções de quiz visíveis, em menos de 3 segundos após a tela estar pronta (CA-001).
- **SC-002**: Durante o deal, 0% das sessões exibe opção de quiz clicável enquanto as hole cards ainda voam (CA-026).
- **SC-003**: Em 100% das mãos, após o deal pousar, as hole cards de **Você** estão abertas e as de A e B permanecem fechadas até o início do showdown; nesse início, as de A e B estão abertas (CA-003, CA-004).
- **SC-004**: Em 100% das mãos, nenhuma pergunta ocorre com o board vazio (RN-041).
- **SC-005**: Após o flop pousar, o treinando consegue ver as três comunitárias e o HUD `perguntando` com opções habilitadas sem sair do layout da mesa (CA-002); o quiz não habilita antes das cartas pousarem.
- **SC-006**: Acionar **Próxima mão** no desfecho recolhe as cartas e inicia novo deal na mesma mesa, sem sensação de ter saído do clube e de novo sem quiz preflop, em menos de 3 segundos até o novo deal estar em andamento (CA-005).
- **SC-007**: Quando o áudio está indisponível, 100% das sessões de treino continuam; 0 modais agressivos ou diálogos nativos de erro de som.
- **SC-008**: No layout desktop de referência, mesa + HUD + cinco slots + três assentos permanecem visíveis sem cortar cartas até ficarem ilegíveis a cerca de 70 cm; em viewport estreita, o HUD pode empilhar abaixo e as cartas continuam legíveis.
- **SC-009**: 0 ocorrências de CTA **Desistir** / **Nova mão** / **Embaralhar** durante uma mão em curso; os únicos nomes de CTA de sessão são **Nova mão** (ociosa) e **Próxima mão** (desfecho), além de **Continuar** em `sem_upgrade`.
- **SC-010**: Depois da primeira mão da sessão, a animação de cada street conclui em cerca de 1 segundo antes de o quiz da street habilitar; a mesa não trava à espera de som ou de movimento do ponteiro.

## Assumptions

- **Git / numeração**: o diretório da feature é `specs/001-mesa-imersiva/` (ShortName `mesa-imersiva`, número 001, sequential). Não há hook `before_specify`; o repositório permanece em `main` (o roadmap implementa as features em sequência nesta branch). Identidade da spec: `001-mesa-imersiva`.
- **Fonte de verdade**: comportamento desta spec = PRD §5.1 (RN-001..007, RN-041..043, CA-001..005, CA-026) + gates globais aplicáveis da constitution. Nenhum `[NEEDS CLARIFICATION]`: o PRD já decide copy, estados, CTAs, layout e fail-open.
- **Linha de propósito**: texto exatamente “Treine ler as mãos. Sem apostas.” (PRD §5.1).
- **Cadência vs. motor**: esta feature exige que o HUD entre em `perguntando` / `sem_upgrade` / `resultado` nos momentos certos. A geração das opções, a correção e o retry completo vêm das features 003–006; até lá, o casco pode usar conteúdo provisório desde que os estados, CTAs e a vedação de quiz preflop sejam reais.
- **Deal vs. shuffle**: o ritual visual do deal (voo, pouso, herói aberto, adversários fechados) é desta feature. Qual baralho permutado e o mapeamento das 11 cartas de jogo são da feature 002. Queima visual é **opcional** (permitida, não obrigatória); se existir, não entra no board e não consome carta de jogo (RN-G007).
- **Reload vs. evolução**: voltar a `ociosa` no reload é desta feature. Preservar contadores de desempenho no dispositivo é da feature 003; esta spec apenas proíbe apagar evolução como efeito colateral do reset visual e proíbe pedir dado pessoal para retomar.
- **Som**: eventos exatamente os do PRD (shuffle, deal, flop, virada de showdown, acerto, erro). Unlock no primeiro gesto **Nova mão** / **Próxima mão**. Sem samples obrigatórios e sem controle de mute — silenciar = política do navegador ou do sistema. Falha de som nunca impede o treino (constitution VII).
- **Privacidade**: avatares ilustrados e apelidos fixos de produto evitam dado pessoal. Não há campo para o usuário digitar nome.
- **Idioma**: UI em pt-BR; identificadores internos podem estar em inglês.
- **Uma tela**: a sessão inteira ocorre sobre a mesa; não há fluxo de “página de quiz”.
- **Constitution como constraint (não como stack desta spec)**: sem backend, sem cadastro, custo operacional zero, escopo de treino (não jogo), desktop-first, fail-open. Cartas clássicas (não Unicode/emoji). Áudio sintetizado e falível. Detalhe de stack fica para `/speckit-plan` (ADRs 001, 005, 006, 007).
