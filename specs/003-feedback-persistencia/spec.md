# Feature Specification: Feedback de resposta e persistência da evolução

**Feature Branch**: `003-feedback-persistencia`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "Implementar o contrato de quiz da mesa: seleção única submete no clique, múltipla seleção exige Confirmar, feedback explícito no HUD sem alert e sem revelar a certa antes do acerto, opção errada visível e morta, ordem visual das opções embaralhada, persistência localStorage de mao_atual/upgrade/vencedor_pote com exposições = acertos + erros na 1ª tentativa, falso positivo de upgrade conta erro, degradação se o storage falhar, sem tela de relatório nem botão zerar — conforme PRD §5.6 (RN-034, RN-035, RN-036, RN-037, RN-039, RN-040, RN-047, RN-G008, CA-022, CA-023, CA-024, CA-025)"

## Clarifications

### Session 2026-09-07

- Q: Quando a primeira tentativa de uma pergunta deve ser gravada na memória do dispositivo? → A: Imediatamente após essa primeira tentativa, ainda nesta pergunta — não esperar o fim da mão nem o desfecho.
- Q: Sem o motor de upgrades da feature 005, quais opções o stub de múltipla seleção do flop precisa mostrar para o contrato ser testável? → A: Exatamente 6 categorias canônicas, incluindo **Flush** como upgrade verdadeiro e **Par** como distratora; o conjunto correto provisório é só os upgrades verdadeiros do stub.
- Q: Se duas abas da mesma origem gravarem a evolução ao mesmo tempo, o que a mesa deve fazer? → A: A última gravação válida prevalece, sem mesclar incrementos e sem aviso na UI.
- Q: Além do texto do HUD, como a opção acertada e a opção morta se distinguem sem depender só de cor? → A: Morta permanece no lugar com marca visível de corte (X ou equivalente) e ênfase reduzida; acertada ganha marca visível de acerto só depois de escolhida; o HUD já traz o texto canônico.
- Q: Depois de o HUD mostrar “Você acertou”, em quanto tempo a mesa avança para a próxima pergunta ou street? → A: Beat curto de no máximo 1 segundo e avança sozinho; com preferência por reduzir movimento, o avanço é imediato (0 s). Sem botão extra de continuar no acerto.

### Session 2026-09-07 (2)

- Q: As dez categorias canônicas precisam constar na evolução mesmo sem nunca terem sido perguntadas? → A: Sim: `mao_atual` e `upgrade` têm as 10 categorias desde a primeira gravação, em zero até haver exposição; `vencedor_pote` é um grupo único já em zero. Categoria nunca vista permanece 0, não ausente.
- Q: Depois da primeira Confirmar, uma distratora que o treinando não tinha marcado ainda pode ser marcada? → A: Sim: permanece selecionável; se marcada numa Confirmar seguinte, elimina-se e o HUD pede de novo; contadores da 1ª vez não mudam.
- Q: Quando o bloco gravado está incompleto mas ainda legível, a mesa trata como corrompido ou completa com zeros? → A: Ilegível ou estrutura incompatível = descarta e zera; categoria ou bucket faltando = zero; chaves extras desconhecidas = ignora sem zerar o resto.
- Q: As opções já eliminadas devem receber foco pelo teclado? → A: Não: Tab percorre só o que ainda é ativável; mortas ficam visíveis no lugar mas fora do foco.
- Q: Enquanto o HUD mostra “Você acertou” e ainda não avançou, as opções da pergunta continuam visíveis? → A: Sim: a grade permanece com o estado de acerto até o avanço automático; sem tela intermediária.

## User Scenarios & Testing *(mandatory)*

Esta feature é o **contrato de treino** que toda pergunta da mesa consome: como se responde, como o HUD reage, o que se lembra no dispositivo e o que **nunca** aparece. O casco (feature 001) e o baralho honesto (feature 002) já existem; o motor que decide a categoria real da mão e os upgrades possíveis vem nas features 004–006. Aqui o valor é fechar o ciclo de aprendizagem **na hora** (acerto explícito, erro sem spoiler, retry com opção morta) e guardar, só no dispositivo, a facilidade na **primeira tentativa** — para um relatório futuro, sem mostrá-lo no MVP.

### User Story 1 - Responder seleção única no clique, com feedback no HUD (Priority: P1)

O treinando vê uma pergunta de seleção única no HUD (mão atual ou “quem ganhou o pote”). Clica numa opção: a resposta **submete na hora**, sem botão **Confirmar**. Se acertou, o HUD diz **“Você acertou”** e a opção correta ganha marca visível de acerto (não só cor) — texto **e** aparência, nunca diálogo nativo do navegador. Se errou, o HUD diz **“Não é essa. Tente de novo.”**, **não** revela qual era a certa, a opção clicada permanece visível no mesmo lugar em estado eliminada (marca de corte/X, ênfase reduzida, não clicável de novo nesta pergunta) e ele escolhe outra até acertar. A certa só aparece como certa quando ele a escolhe.

**Why this priority**: Sem este contrato o treino vira prova escolar (alert, spoiler, avançar no erro) ou fica mudo. É RN-034, RN-035, RN-036, RN-047 e CA-025. Toda pergunta de categoria e a do vencedor depende disto.

**Independent Test**: Com o quiz stub do casco (correção provisória até 004/006), percorrer uma pergunta de seleção única: clique submete; acerto mostra o texto e o estado certos no HUD; erro mostra o texto de retry, mata a opção, não revela a certa; retry até a correta; zero `alert()`.

**Acceptance Scenarios**:

1. **Given** o HUD em `perguntando` numa pergunta de seleção única (mão atual ou vencedor), **When** o treinando clica uma opção, **Then** a resposta é submetida **nesse clique** — **não** há botão **Confirmar** nessa pergunta (RN-047).
2. **Given** o clique na opção correta, **When** o feedback aparece, **Then** o HUD mostra exatamente **“Você acertou”**, no próprio painel da mesa (não no topo da página e não em diálogo nativo), e a opção correta tem marca visível de acerto distinguível do erro por **texto e** aparência, não só por cor (RN-034, CA-025). Em no máximo 1 segundo (ou imediato se o movimento for reduzido) a próxima pergunta ou street inicia, sem **Continuar** no acerto.
3. **Given** o clique numa opção errada, **When** o feedback aparece, **Then** o HUD mostra exatamente **“Não é essa. Tente de novo.”**, **não** nomeia a categoria/vencedor correto, e a pergunta **não** avança (RN-035).
4. **Given** um erro nesta pergunta, **When** o treinando olha as opções, **Then** a opção errada permanece visível no **mesmo lugar**, em estado eliminada (marca de corte/X, ênfase reduzida, não clicável), e as demais opções ainda disponíveis permanecem na mesma ordem visual (RN-036).
5. **Given** opções ainda não escolhidas após um erro, **When** o treinando procura um texto do tipo “a resposta era …” ou um botão que revele a certa, **Then** isso **não** existe; a certa só se torna visivelmente “certa” quando ele a escolhe (RN-035, RN-G005).
6. **Given** uma opção já eliminada, **When** o treinando tenta ativá-la de novo (clique, Enter ou Espaço), **Then** a ação é ignorada e a pergunta não avança. Tab MUST NOT parar nessa opção; o foco segue para a próxima opção ainda ativável ou para o CTA aplicável.
7. **Given** o HUD em `perguntando`, **When** o treinando clica fora das opções, **Then** nada é submetido e a pergunta não avança.

---

### User Story 2 - Marcar várias opções e só submeter em Confirmar (Priority: P1)

Depois de acertar a mão atual no flop, o HUD pergunta quais upgrades ainda são possíveis: até 6 opções, **múltipla seleção**. Marcar ou desmarcar **não** submete. Só o botão **Confirmar** avalia o conjunto. Se o conjunto das opções **exibidas** está correto, o HUD diz **“Você acertou”** e avança. Se não, o feedback de erro é o mesmo texto explícito, **sem** revelar o conjunto certo: distratoras marcadas morrem; distratoras ainda não marcadas **continuam selecionáveis**; upgrades já marcados corretamente travam (não desmarcar); upgrades verdadeiros ainda não marcados continuam selecionáveis. Nova **Confirmar** até o conjunto exibido ficar perfeito.

**Why this priority**: Confundir clique-submete com multi-select quebra o treino de upgrades (falso positivo, omissão). É RN-047 e o contrato que a feature 005 vai consumir. Precisa ser demonstrável nesta feature, sem esperar o motor de upgrades.

**Independent Test**: No flop, após o acerto da mão atual do stub, usar o **stub de múltipla seleção** desta feature (exatamente 6 categorias canônicas, **Flush** verdadeiro e **Par** distratora, conjunto correto provisório): marcar, **Confirmar**, exercitar falso positivo e omissão, ver opções mortas/travadas, retry até o conjunto exibido estar correto; o turn permanece no skip `sem_upgrade` do casco até a feature 005.

**Acceptance Scenarios**:

1. **Given** o HUD em `perguntando` na pergunta de upgrades (múltipla seleção), **When** o treinando marca ou desmarca opções, **Then** a pergunta **não** é avaliada ainda; só **Confirmar** submete (RN-047).
2. **Given** o conjunto das opções **exibidas** está correto, **When** o treinando aciona **Confirmar**, **Then** o HUD mostra **“Você acertou”** (texto e estado visual) e, após o beat curto de no máximo 1 segundo (ou imediato se o movimento for reduzido), a pergunta avança (RN-034).
3. **Given** o treinando marca um upgrade verdadeiro **e** uma distratora, **When** aciona a **primeira Confirmar**, **Then** a distratora fica eliminada (visível, morta, marca de corte/X), o upgrade verdadeiro marcado trava (não desmarcar, marca de acerto persistente), o HUD pede de novo com **“Não é essa. Tente de novo.”** e **não** revela quais das restantes são obrigatórias (RN-035, RN-036).
4. **Given** há upgrade verdadeiro nas opções e o treinando aciona **Confirmar** sem marcar nada, **When** a primeira confirmação ocorre, **Then** conta-se erro de omissão nessa exposição (ver US3), o HUD pede de novo, e os upgrades omitidos continuam selecionáveis.
5. **Given** já houve uma **Confirmar**, **When** o treinando tenta desmarcar um upgrade já travado como correto ou reativar uma distratora morta, **Then** essas ações são ignoradas.
6. **Given** já houve uma **Confirmar** e restam distratoras **não** marcadas naquela primeira vez, **When** o treinando as olha, **Then** elas continuam selecionáveis (não morreram — matá-las revelaria que são distratoras); se as marcar numa **Confirmar** seguinte, ficam eliminadas, o HUD pede de novo e os contadores **não** mudam.
7. **Given** o turn após o acerto da mão atual, **enquanto** o motor de upgrades da feature 005 não existir, **When** o HUD segue a cadência, **Then** permanece o skip `sem_upgrade` (**“Não há upgrade possível.”** + **Continuar**), **sem** múltipla seleção nessa street — os dois caminhos (Confirmar vs. skip) continuam observáveis.
8. **Given** `sem_upgrade`, **When** o treinando aciona **Continuar**, **Then** nenhum contador de `upgrade` muda e a próxima street pode abrir.

---

### User Story 3 - Guardar só a primeira tentativa, e sobreviver a fechar a aba (Priority: P1)

Cada pergunta expõe o treinando uma vez para a memória de desempenho: o **primeiro** clique (seleção única) ou a **primeira Confirmar** (múltipla seleção) atualiza os contadores. Errou e depois acertou na mesma pergunta: aquela exposição é **erro**, não acerto. Chutar “Flush” quando a certa é **Par** registra erro em **Par**, não em Flush. No upgrade, marcar uma distratora (falso positivo) conta **erro** daquela categoria; **não** marcar uma distratora **não** incrementa. Os totais ficam no dispositivo, na mesma origem, **gravados no instante da primeira tentativa** (não no fim da mão): fechar e reabrir o app preserva, por exemplo, um acerto de primeira em **Flush** como mão atual. Não se grava nome, e-mail, apelido digitado, cartas da mão nem replay.

**Why this priority**: É o objetivo do §5.6 e os critérios CA-022 e CA-023. Sem isto o treino não tem memória; com relatório na tela, violaria o MVP.

**Independent Test**: Errar depois acertar a mesma pergunta de categoria e ler os contadores: +1 erro e +0 acerto na categoria **correta**. Acertar de primeira **Flush** em mão atual, fechar e reabrir na mesma origem: o acerto de Flush em `mao_atual` permanece. Percorrer a UI: zero tela de relatório e zero botão de zerar.

**Acceptance Scenarios**:

1. **Given** uma pergunta de categoria (mão atual, inclusive as do showdown quando existirem), **When** a primeira escolha é erro e a posterior é acerto, **Then** a categoria **correta** dessa pergunta tem +1 erro e +0 acerto naquela exposição; tentativas seguintes **não** alteram contadores (CA-022, RN-019).
2. **Given** um acerto de primeira em **Flush** como mão atual, **When** o treinando fecha o app e reabre na **mesma origem**, **Then** o acerto de Flush em `mao_atual` permanece (CA-023).
3. **Given** a primeira tentativa de “quem ganhou o pote”, **When** é acerto ou erro, **Then** incrementa-se o único grupo `vencedor_pote` (acertos/erros/exposições) — **não** há dez categorias nesse bucket (RN-032, RN-037).
4. **Given** a primeira **Confirmar** de upgrades com Flush verdadeiro marcado e Par distratora também marcada, **When** se lêem os contadores, **Then** Flush em `upgrade` tem +1 acerto e Par em `upgrade` tem +1 erro (falso positivo); Par **não** recebe acerto por ter sido “vista e não deixada de fora” (RN-024).
5. **Given** uma distratora de upgrade **não** marcada na primeira **Confirmar**, **When** se lêem os contadores, **Then** essa categoria **não** incrementa (nem acerto nem erro) (RN-024, RN-037).
6. **Given** qualquer bucket (`mao_atual` por categoria, `upgrade` por categoria, `vencedor_pote`), **When** se comparam os totais no MVP, **Then** exposições **=** acertos + erros daquele bucket/categoria (RN-037).
7. **Given** recarregar no meio da mão **depois** da primeira tentativa de pelo menos uma pergunta dessa mão, **When** o HUD volta a `ociosa`, **Then** a mão em curso perde-se (casco), mas os contadores **já gravados nessa visita** (inclusive dessa mão) **não** são apagados por esse reset visual.
8. **Given** a persistência, **When** se inspeciona o que foi guardado, **Then** há só contadores de treino (`mao_atual` e `upgrade` com as **10** categorias canônicas, mesmo as nunca perguntadas em zero; `vencedor_pote` em um grupo); **não** há nome, e-mail, apelido digitado, foto, trajetória, replay de cartas, carimbo de data/hora nem identificador pessoal (RN-039, RN-040).

---

### User Story 4 - Não decorar o botão: ordem visual embaralhada (Priority: P2)

Cada vez que uma pergunta **nova** é apresentada, as opções aparecem em ordem visual embaralhada. A correta **não** fica sempre no mesmo botão. Depois de um erro na **mesma** pergunta, a ordem **não** muda de novo — a opção morta permanece no lugar, para o retry treinar leitura, não caça ao botão que saltou.

**Why this priority**: RN-G008 é gate global; sem isto o treinando memoriza posição. É independente do motor: vale para stub e para as features 004–006.

**Independent Test**: Abrir a mesma pergunta stub em várias mãos (ou várias perguntas da mesma mão) e verificar que a posição da correta não é constante; após um erro, a ordem daquela pergunta permanece.

**Acceptance Scenarios**:

1. **Given** uma pergunta recém-apresentada (seleção única ou múltipla), **When** o treinando vê as opções, **Then** a ordem visual está embaralhada; a correta MUST NOT ocupar sempre o mesmo botão ao longo das perguntas (RN-G008).
2. **Given** um erro já cometido nesta pergunta, **When** o HUD pede nova tentativa, **Then** as opções restantes (e a morta) **não** trocam de lugar.
3. **Given** a próxima pergunta da cadência (outra exposição), **When** as opções aparecem, **Then** a ordem visual é embaralhada de novo, independente da pergunta anterior e **sem** reembaralhar o baralho da mão (continuidade da feature 002).

---

### User Story 5 - Treinar sem dashboard e sem botão zerar (Priority: P2)

O treinando percorre a mesa do deal ao desfecho e **não** encontra tela de relatório, gráfico, ranking, tabela de desempenho nem botão para zerar estatísticas. A evolução existe só como memória no dispositivo. Limpar os dados do site no navegador zera essa memória; a mesa segue. O modelo dos contadores basta para um relatório **futuro** de taxa na 1ª tentativa — esse relatório **não** entra nesta feature nem no MVP.

**Why this priority**: CA-024 e o princípio IV da constitution. Um dashboard no MVP desvia o olhar das cartas e finge produto de conta.

**Independent Test**: Percorrer ociosa → uma mão até `resultado` → `Próxima mão` e procurar relatório/zerar; confirmar ausência. Limpar dados do site (quando o ambiente permitir) e confirmar que a mesa ainda abre e o treino continua com contadores zerados.

**Acceptance Scenarios**:

1. **Given** o MVP, **When** se percorre a UI (ociosa, deal, perguntando, sem_upgrade, resultado), **Then** **não** há tela de relatório, gráfico, ranking, tabela de desempenho nem botão de zerar stats (CA-024).
2. **Given** o treinando quer recomeçar a evolução, **When** procura um CTA na mesa, **Then** não encontra; o caminho documentado é limpar os dados do site no navegador.
3. **Given** os dados do site foram limpos, **When** o app abre de novo na mesma origem, **Then** a mesa funciona (HUD `ociosa`, **Nova mão**) e os contadores partem do zero — sem pedir cadastro para “restaurar”.

---

### User Story 6 - Continuar o treino se a memória do dispositivo falhar (Priority: P3)

Se o armazenamento local for recusado, estiver cheio ou devolver dado corrompido, a mesa **não** trava. O treinando responde, vê feedback e completa a mão. A evolução **pode** perder-se ao fechar. Não há `alert()`, não há jargão técnico que bloqueie o HUD, não se pede permissão de “ativar cookies” com nome, e-mail ou apelido.

**Why this priority**: Fail-open (constitution VII) e a tabela de exceção do §5.6. Stats são apoio; a habilidade é a leitura.

**Independent Test**: Completar uma pergunta com armazenamento indisponível (treino segue, sem modal). Simular dado corrompido: a mesa não quebra; a visita seguinte trata os contadores como zerados. Zero pedido de dado pessoal.

**Acceptance Scenarios**:

1. **Given** o armazenamento local recusado ou indisponível, **When** o treinando acerta ou erra, **Then** o feedback do HUD ocorre normalmente, a mão pode ser concluída, e **não** aparece diálogo nativo nem texto técnico que bloqueie o painel; a evolução MAY não sobreviver ao fechar.
2. **Given** o bloco persistido está corrompido ou ilegível, **When** o app precisa ler a evolução, **Then** descarta o bloco inválido, trata os contadores como zerados e **não** quebra a mesa.
3. **Given** o bloco é legível mas falta uma categoria ou um bucket, **When** o app lê a evolução, **Then** o campo em falta vale 0 e o restante dos contadores **não** é zerado; chaves extras desconhecidas são ignoradas.
4. **Given** falha de persistência, **When** o treinando olha a UI, **Then** **não** há pedido de CPF, e-mail, nome real, apelido digitado ou outro identificador para “salvar o progresso”.
5. **Given** duas abas da mesma origem com a mesa aberta, **When** as duas gravam evolução, **Then** prevalece a última gravação válida; **não** há mesclagem de incrementos, **não** há mensagem de conflito e **não** se pede dado pessoal.

---

### Edge Cases

- Clique ou ativação de teclado em opção já eliminada: ignora; não avança; não altera contadores. Eliminadas estão fora da ordem de Tab.
- Clique fora das opções / no feltro: não submete.
- Seleção única: MUST NOT existir **Confirmar**; o clique (ou Enter/Espaço na opção focada) submete.
- Múltipla seleção: MUST NOT submeter no clique da opção; **Confirmar** vazio quando há upgrade verdadeiro nas opções = erro de omissão na 1ª tentativa em cada upgrade omitido; pede de novo.
- Marcar todas as opções havendo distratora: na 1ª **Confirmar**, cada distratora marcada recebe erro; distratoras morrem; pede correção; upgrades verdadeiros marcados travam.
- Segunda **Confirmar** (e seguintes): não altera `upgrade`; só corrige o conjunto exibido. Distratoras que **não** tinham sido marcadas na 1ª vez permanecem selecionáveis; marcá-las depois as elimina, sem spoiler antecipado e sem mudar contadores.
- Skip `sem_upgrade`: nenhum contador `upgrade` muda (equivalente ao CA-017 quando a lista é vazia).
- Recarregar no meio da mão: mão aborta, HUD `ociosa`; contadores já persistidos permanecem — inclusive a 1ª tentativa desta mão, se já tiver ocorrido nesta visita; MUST NOT pedir dado pessoal para retomar.
- Fechar a aba e reabrir na mesma origem: evolução permanece (CA-023). Trocar de origem (outro endereço do app) = outras chaves; a evolução **não** viaja — não é bug desta feature.
- Limpar dados do site: evolução zera; mesa segue.
- Armazenamento recusado, cota esgotada ou leitura/gravação falha: treino segue; evolução MAY perder-se ao fechar; sem `alert()` e sem jargão que bloqueie.
- Dados corrompidos (ilegíveis ou estrutura incompatível com os três buckets): descarta o bloco, zera contadores, mesa intacta. Categoria ou bucket faltando num bloco **legível** = 0, sem zerar o resto. Chaves extras desconhecidas = ignora.
- Duas abas da mesma origem gravando ao mesmo tempo: a última gravação válida prevalece; MUST NOT mesclar incrementos; MUST NOT mostrar conflito nem jargão; o treino em cada aba segue.
- Acerto no HUD `resultado`: o painel MAY reiterar as categorias **já acertadas** nesta mão; isso **não** é revelar a certa **antes** do acerto.
- Durante o beat de acerto (até 1 s, ou 0 s se movimento reduzido): a grade da pergunta permanece visível com o estado de acerto e o texto **“Você acertou”** no HUD; MUST NOT sumir as opções nem abrir tela de parabéns.
- Preferência por reduzir movimento: o contrato de quiz (submissão, texto, opção morta, persistência) não depende de animação; o beat de acerto MUST ser imediato (0 s) e o HUD avança sem esperar 1 segundo.
- Ordem visual: embaralha **ao apresentar** cada pergunta; MUST NOT reembaralhar após erro na mesma pergunta.
- Stub vs. feltro: até 004–006, a opção “certa” do stub MAY não coincidir com o board real; os contadores desta feature seguem a correta **do contrato da pergunta em vigor** (stub agora; motor depois). Para CA-023 ser testável antes da 004, o stub MUST permitir uma exposição de mão atual cuja correta seja **Flush**. No flop, o stub de múltipla seleção MUST ter exatamente 6 opções, com **Flush** verdadeiro e **Par** distratora, para o falso positivo da US3 ser demonstrável.
- Empate de pote: a pergunta “quem ganhou” continua seleção única; o bucket é `vencedor_pote`, não uma categoria RN-014.
- Três perguntas de categoria no river (quando a cadência do casco as mostra): cada uma é uma exposição independente de `mao_atual` na categoria correta **daquele** jogador (RN-038) — o contrato de 1ª tentativa aplica-se a cada uma, mesmo que o motor autoritativo só exista na 006.
- MUST NOT haver botão “pular pergunta” nem “mostrar resposta” (RN-G005).
- Teclado: **Confirmar**, **Continuar** e as opções **ainda ativáveis** permanecem alcançáveis por Tab e ativáveis com Enter/Espaço (continuidade do casco); opções eliminadas ficam visíveis no lugar mas **fora** da ordem de Tab. O mouse continua o caminho principal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Em perguntas de **seleção única** (identificação de categoria e “quem ganhou o pote”), o clique numa opção disponível MUST submeter a resposta na hora. MUST NOT exigir botão **Confirmar** nessas perguntas (RN-047).
- **FR-002**: Em perguntas de **múltipla seleção** (upgrades / mãos ainda possíveis), marcar ou desmarcar MUST NOT submeter. MUST existir o CTA **Confirmar**. Só **Confirmar** avalia o conjunto das opções exibidas (RN-047).
- **FR-003**: Acerto MUST ser explícito no HUD com o texto **“Você acertou”**. Erro MUST ser explícito no HUD com o texto **“Não é essa. Tente de novo.”**. Feedback MUST ocorrer no HUD da mesa, MUST NOT usar `alert()` nem diálogo nativo equivalente, e MUST distinguir acerto de erro por **texto e** estado visual (não só por cor) (RN-034, RN-035, CA-025). A opção acertada MUST ganhar marca visível de acerto **só depois** de escolhida. A opção morta MUST ter marca visível de corte (X ou equivalente) e ênfase reduzida, além do texto de erro no HUD. Após o acerto, o HUD MUST avançar sozinho para a próxima pergunta ou street em no máximo 1 segundo; MUST NOT exigir **Continuar** no acerto (esse CTA permanece só no skip `sem_upgrade`). Com preferência por reduzir movimento, o avanço MUST ser imediato. Enquanto o beat de acerto corre, a grade da pergunta MUST permanecer visível com o estado de acerto; MUST NOT substituir o HUD por tela de parabéns nem ocultar as opções nesse intervalo.
- **FR-004**: Após erro, a opção incorreta MUST permanecer visível no mesmo lugar, em estado eliminada (marca de corte/X, ênfase reduzida), e MUST NOT ser ativável de novo naquela pergunta. Ativação MUST ser ignorada (RN-036).
- **FR-005**: MUST NOT revelar a resposta certa (rótulo, destaque antecipado, “a resposta era …”, botão de revelar) **antes** de o treinando acertar. Em seleção única, a certa só aparece como certa quando escolhida. Em múltipla seleção, o conjunto certo só se torna visivelmente completo quando o conjunto **exibido** fica correto. O HUD `resultado` MAY reiterar o que já foi acertado nesta mão (RN-035, RN-G005).
- **FR-006**: MUST NOT existir “pular pergunta”. Retry até acertar (seleção única) ou até o conjunto exibido estar correto (múltipla seleção) (RN-G005).
- **FR-007**: A ordem visual das opções MUST ser embaralhada **ao apresentar** cada pergunta. A correta MUST NOT ficar sempre no mesmo botão. MUST NOT reembaralhar as opções após um erro na **mesma** pergunta. MUST NOT reembaralhar o baralho da mão ao embaralhar opções (RN-G008).
- **FR-008**: Só a **primeira tentativa** altera contadores: primeiro clique em seleção única; primeira **Confirmar** em múltipla seleção. Essa atualização MUST ser gravada **imediatamente** após a primeira tentativa, ainda nesta pergunta — MUST NOT esperar o fim da mão, o HUD `resultado` nem o fechamento da aba. Tentativas seguintes MUST NOT alterar contadores (RN-037, RN-019, RN-026).
- **FR-009**: Em pergunta de categoria, a primeira tentativa MUST registrar acerto ou erro na categoria **correta** daquela pergunta (`mao_atual`), não na rótulo chutado se este for distratora. Erro depois acerto na mesma pergunta MUST resultar em +1 erro e +0 acerto naquela exposição para a categoria correta (RN-019, CA-022).
- **FR-010**: Na primeira **Confirmar** de upgrades, cada opção **exibida** MUST ser avaliada assim no bucket `upgrade`: upgrade verdadeiro marcado → +1 acerto nessa categoria; upgrade verdadeiro não marcado → +1 erro nessa categoria; distratora marcada (falso positivo) → +1 erro nessa categoria; distratora não marcada → não incrementa (RN-024).
- **FR-011**: Depois da primeira **Confirmar** de upgrades: distratoras **marcadas** MUST desabilitar (marca de corte/X, ênfase reduzida); distratoras **não** marcadas MUST permanecer selecionáveis (MUST NOT eliminá-las na 1ª confirmação — isso revelaria que são distratoras); upgrades já marcados corretamente MUST travar (não desmarcar, marca visível de acerto); upgrades verdadeiros ainda não marcados MUST permanecer selecionáveis. Se uma distratora restante for marcada numa **Confirmar** seguinte, MUST eliminar-se e o HUD MUST pedir de novo. Novas **Confirmar** até o conjunto exibido estar perfeito MUST NOT alterar os contadores da primeira vez (RN-025, RN-026).
- **FR-012**: O modelo persistido MUST ter exatamente: `mao_atual` (por cada um dos 10 rótulos canônicos — **Royal flush**, **Straight flush**, **Quadra**, **Full house**, **Flush**, **Straight**, **Trinca**, **Dois pares**, **Par**, **Carta alta** — acertos 1ª, erros 1ª, exposições); `upgrade` (idem, as mesmas 10); `vencedor_pote` (um único grupo acertos/erros/exposições). Desde a primeira gravação, as 10 categorias MUST constar em `mao_atual` e em `upgrade` mesmo sem exposição (valores 0). Categoria nunca vista MUST permanecer 0, não ausente. No MVP, exposições MUST ser iguais a acertos + erros daquele bucket/categoria. MUST NOT contar “viu como distratora e não marcou” como exposição (RN-037). MUST NOT gravar carimbo de data/hora, identificador de sessão ou outro metadado além desses contadores.
- **FR-013**: A evolução MUST sobreviver a fechar e reabrir o app na **mesma origem**. Dado acerto de primeira em Flush como mão atual, ao reabrir o acerto de Flush em `mao_atual` MUST permanecer (CA-023).
- **FR-014**: Recarregar no meio da mão MUST abortar a mão (HUD `ociosa`) e MUST NOT apagar os contadores já persistidos, inclusive os da mão abortada se a primeira tentativa já tiver sido gravada nesta visita.
- **FR-015**: MUST NOT persistir nome, e-mail, CPF, telefone, apelido digitado, foto, trajetória de ponteiro, replay de cartas, enunciados, carimbo de data/hora, identificador de sessão ou qualquer identificador pessoal. MUST NOT enviar mãos, respostas, contadores ou telemetria a servidor (RN-039, RN-040).
- **FR-016**: MUST NOT haver tela de relatório, gráfico, ranking, tabela de desempenho nem botão de zerar stats na UI. Limpar os dados do site no navegador basta para zerar a evolução (CA-024).
- **FR-017**: Se o armazenamento local for recusado, indisponível ou falhar ao gravar/ler, o treino MUST continuar; a evolução MAY perder-se ao fechar. MUST NOT haver `alert()`, modal agressivo nem jargão técnico que bloqueie o HUD. MUST NOT haver linha extra de erro de persistência no HUD (degradação silenciosa nesta visita). Se duas abas da mesma origem gravarem ao mesmo tempo, a última gravação válida MUST prevalecer; MUST NOT mesclar incrementos; MUST NOT exibir conflito nem pedir identificador.
- **FR-018**: Dados corrompidos ou ilegíveis (não parseiam ou a estrutura é incompatível com os três buckets de contadores) MUST ser descartados e os contadores tratados como zerados, sem quebrar a mesa. Um bloco **legível** com categoria ou bucket em falta MUST completar o campo com 0 e MUST preservar o restante. Chaves extras desconhecidas MUST ser ignoradas sem zerar o resto.
- **FR-019**: Skip `sem_upgrade` (lista vazia) MUST NOT alterar contadores `upgrade`.
- **FR-020**: Até existir o motor da feature 005, após o acerto da mão atual no **flop** o HUD MUST apresentar um **stub de múltipla seleção** com **exatamente 6** opções de categoria canônica, conjunto correto provisório, CTA **Confirmar**, para este contrato ser testável. Esse stub MUST incluir **Flush** como upgrade verdadeiro e **Par** como distratora (as demais vagas são outras categorias canônicas, verdadeiras ou distratoras conforme o conjunto provisório). Após o acerto da mão atual no **turn**, o HUD MUST permanecer no skip `sem_upgrade` do casco (**“Não há upgrade possível.”** + **Continuar**), para o caminho sem quiz de upgrade continuar observável. A feature 005 substituirá o stub e decidirá skip vs. upgrades reais em cada street.
- **FR-021**: Até existirem as features 004 e 006, a correção das perguntas de seleção única MAY permanecer a do stub do casco (uma opção exibida designada correta). Os contadores MUST seguir essa correta provisória. O stub MUST permitir uma exposição de mão atual cuja correta seja **Flush**, para CA-023 ser demonstrável nesta feature.
- **FR-022**: Cada pergunta de categoria da cadência (flop, turn, e as três do river no casco) MUST ser uma exposição independente de `mao_atual` na categoria correta **daquela** pergunta. A pergunta do vencedor MUST alimentar só `vencedor_pote` (RN-032, RN-038).
- **FR-023**: Toda interface visível (feedback, **Confirmar**, opções, ausência de relatório) MUST estar em português brasileiro. Os rótulos de categoria, quando exibidos, MUST ser os canônicos do produto, sem sinônimos misturados.
- **FR-024**: **Confirmar**, as opções **ainda ativáveis** e os CTAs já existentes do HUD MUST permanecer alcançáveis por Tab e ativáveis com Enter ou Espaço. Opções eliminadas MUST permanecer visíveis no lugar e MUST NOT receber foco de Tab. MUST NOT exigir teclado para treinar.
- **FR-025**: Esta feature MUST NOT introduzir apostas, quiz preflop, desistir da mão, mute na UI, cadastro, login, multiplayer, relatório visual, botão zerar, nem alterar apelidos (**Você**, **Adversário A**, **Adversário B**) ou a honestidade do baralho da feature 002.
- **FR-026**: MUST haver no máximo uma pergunta por vez no HUD (RN-G001). MUST NOT avançar de street enquanto as perguntas da street não estiverem acertadas ou skipped conforme o casco (RN-G002).

### Key Entities

- **Pergunta da mesa**: uma exposição no HUD `perguntando`. Atributos: enunciado, modo (seleção única | múltipla seleção), opções visíveis (até 6), ordem visual, estado de tentativa (ainda sem 1ª tentativa | 1ª já registrada), conjunto/opção correta do contrato em vigor (stub ou motor futuro).
- **Opção**: rótulo visível (categoria canônica ou texto de quem ganhou o pote). Estados: padrão, hover, foco de teclado, selecionada (só multi-select), correta (após acerto, com marca visível de acerto), eliminada/morta (após erro ou falso positivo, com marca de corte/X e ênfase reduzida). Eliminada permanece no lugar, não é ativável nesta pergunta e não recebe foco de Tab. Distinção acerto/erro MUST NOT depender só de cor.
- **Primeira tentativa**: o primeiro clique que submete (seleção única) ou a primeira **Confirmar** (múltipla seleção) daquela pergunta. É o único evento que altera contadores, e essa alteração MUST já estar na memória do dispositivo antes da próxima pergunta ou de um recarregar.
- **Evolução de treino**: memória no dispositivo, na origem do app. Três buckets: `mao_atual` (as 10 categorias canônicas, sempre presentes), `upgrade` (as mesmas 10, sempre presentes), `vencedor_pote` (grupo único, presente desde a primeira gravação). Em cada bucket: acertos de 1ª, erros de 1ª, exposições (= acertos + erros no MVP). Categoria nunca perguntada = 0, não omitida. Sem PII, sem replay de mão, sem carimbo de data/hora.
- **Feedback de HUD**: texto canônico de acerto ou erro + estado visual correspondente, colado ao painel da mesa, nunca diálogo nativo.
- **CTA Confirmar**: só na múltipla seleção; submete o conjunto marcado; alcançável por teclado.
- **Skip de upgrade**: estado `sem_upgrade` já definido no casco; não é pergunta; não gera estatística de categoria.

### Fora de escopo (esta feature)

- Casco visual da mesa, estados do HUD, CTAs de sessão, som de evento, layout desktop-first (já na feature 001). Esta feature **reusa** o palco e **substitui** o contrato provisório de clique/feedback/retry do stub, acrescentando persistência e múltipla seleção no flop.
- Embaralhamento do baralho, mapeamento das 11 cartas e deal (já na feature 002). Embaralhar opções MUST NOT permutar o baralho.
- Motor de melhor-5, kickers, enumeração real de upgrades, montagem autoritativa das 6 opções de categoria e do vencedor (features 004–006). O feltro já é honesto; a “certa” do stub MAY não bater com o board até lá.
- Tela de relatório, gráfico, ranking, exportação, sync entre dispositivos, botão zerar (proibidos no MVP).
- Apostas, estratégia, quiz preflop, desistir da mão, mute na UI, multiplayer, login, outras variantes de poker.
- Reabrir a stack já decidida (entrega estática, persistência só na origem do navegador, ausência de backend). O **como** gravar no armazenamento local fica para `/speckit-plan` sob o contrato já aceito.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos acertos observáveis, o treinando vê **“Você acertou”** no HUD em menos de 1 segundo após a submissão, com marca visível de acerto na opção (não só cor), e 0 diálogos nativos de feedback (CA-025). Em 100% desses acertos, a próxima pergunta ou street inicia em no máximo 1 segundo após o feedback (0 s se o movimento for reduzido), sem CTA extra de continuar no acerto.
- **SC-002**: Em 100% dos erros observáveis, o treinando vê **“Não é essa. Tente de novo.”** no HUD, a opção errada permanece visível e inativa no mesmo lugar com marca de corte/X (não só mudança de cor), e 0 revelações da certa antes do acerto (RN-035, RN-036).
- **SC-003**: Em 100% das perguntas de seleção única, a submissão ocorre no clique (ou equivalente de teclado na opção); 0 dessas perguntas exibem **Confirmar** (RN-047).
- **SC-004**: Em 100% das perguntas de múltipla seleção, marcar opção não encerra a pergunta; 100% das avaliações passam por **Confirmar** (RN-047).
- **SC-005**: Dado erro depois acerto na mesma pergunta de categoria, em 100% dos casos a persistência da categoria correta mostra +1 erro e +0 acerto naquela exposição (CA-022).
- **SC-006**: Dado acerto de primeira em Flush como mão atual, em 100% dos ciclos fechar-e-reabrir na mesma origem o acerto de Flush em `mao_atual` permanece (CA-023).
- **SC-007**: Em 100% das travessias da UI do MVP, há 0 telas de relatório, 0 gráficos de desempenho, 0 tabelas de stats e 0 botões de zerar (CA-024).
- **SC-008**: Em qualquer sequência de 10 perguntas apresentadas, a opção correta **não** ocupa a mesma posição visual em todas; após erro, 100% das retries da **mesma** pergunta mantêm a ordem (RN-G008).
- **SC-009**: Dado falso positivo (distratora de upgrade marcada na 1ª **Confirmar**), em 100% dos casos essa categoria recebe +1 erro em `upgrade` e 0 acerto extra por “não marcar o resto” (RN-024).
- **SC-010**: Quando o armazenamento local está indisponível, 100% das mãos ainda podem ser concluídas; 0 modais agressivos ou diálogos nativos de erro de persistência; 0 pedidos de dado pessoal.
- **SC-011**: 0 coletas de CPF, e-mail, nome real, apelido digitado ou identificador; 0 envio de mãos/respostas/contadores a servidor; o único dado que sobrevive ao fechar a aba é a evolução de treino (três buckets de contadores) na mesma origem.
- **SC-012**: Em 100% dos skips `sem_upgrade`, os contadores `upgrade` não mudam.

## Assumptions

- **Git / numeração**: o diretório da feature é `specs/003-feedback-persistencia/` (ShortName `feedback-persistencia`, número **003**, sequential). Não há `.specify/extensions.yml` nem hook `before_specify`; o repositório permanece em `main` (pedido explícito; roadmap sequencial nesta branch). Identidade da spec: `003-feedback-persistencia`. O campo `BRANCH_NAME` do script de bootstrap é só o slug do diretório — **não** se criou branch Git.
- **Fonte de verdade**: comportamento desta spec = PRD §5.6 (RN-034, RN-035, RN-036, RN-037, RN-039, RN-040, RN-047, CA-022, CA-023, CA-024, CA-025) + RN-G005, RN-G008 e os trechos de 5.3–5.5 que definem **como** a 1ª tentativa grava (`RN-019`, `RN-024`, `RN-025`, `RN-026`, `RN-032`, `RN-038`) + gates da constitution (LGPD só contadores, fail-open, sem relatório/zerar) + decisões em **Clarifications**. Nenhum `[NEEDS CLARIFICATION]` residual.
- **Casco 001 e baralho 002**: o palco, os cinco estados do HUD, os enunciados stub, o teclado e as 11 cartas honestas já existem. Esta feature **não** redesenha o clube; **endurece** o contrato de responder/lembrar.
- **Stub de correção**: até 004–006, uma opção (ou um conjunto) designado pelo stub vale como correta para feedback e para contadores. O feltro já é honesto (002); o quiz ainda MAY “acertar” uma categoria que não bate com o board. O stub MUST incluir pelo menos uma pergunta de mão atual com correta **Flush** para CA-023.
- **Stub de múltipla seleção (escolha autônoma + clarificação 2026-09-07)**: para a US2 ser testável sem a feature 005, o **flop** após acerto da mão atual apresenta multi-select stub + **Confirmar** com **exatamente 6** categorias canônicas, **Flush** verdadeiro e **Par** distratora; o **turn** permanece `sem_upgrade`. 005 substitui o stub e passa a decidir skip vs. lista real nas duas streets. MUST NOT deixar esta feature bloqueada à espera da enumeração de information set.
- **Copy canônica**: acerto = “Você acertou”; erro = “Não é essa. Tente de novo.”; skip = “Não há upgrade possível.”; CTA de multi-select = **Confirmar**. Sem sinônimos na UI.
- **Ordem após erro (escolha autônoma)**: embaralha só na apresentação da pergunta; retry mantém posições (compatível com opção morta visível no lugar, RN-036).
- **Falha de storage (escolha autônoma)**: degradação **silenciosa** — sem linha extra no HUD (diferente da falha de embaralhar da 002, que tem copy própria). Treino segue; evolução pode não sobreviver ao fechar. Duas abas: última gravação válida ganha, sem mescla e sem aviso.
- **Momento da gravação (clarificação 2026-09-07)**: cada primeira tentativa MUST ser persistida na hora, ainda na pergunta corrente. MUST NOT adiar para `resultado` ou para o fechamento da aba — senão recarregar no meio da mão apagaria a exposição recém-feita.
- **Contrato de persistência (não reabrir stack)**: a constitution e o **ADR-002** já decidiram o meio (armazenamento local da origem no navegador, JSON de contadores, sem IndexedDB, sem nuvem, sem `sessionStorage` como banco, sem chave de zerar na UI). Esta spec descreve o **quê** (buckets, 1ª tentativa, exposições = acertos + erros, fail-open, sem PII). Detalhe de implementação fica para `/speckit-plan`.
- **Privacidade**: apelidos fixos **Você**, **Adversário A**, **Adversário B**; avatares ilustrados. Recarregar aborta a mão e **não** apaga evolução. Coordenadas de ponteiro da 002 continuam só em memória da visita — esta feature MUST NOT passá-las à persistência. O bloco gravado MUST ser só os três buckets de contadores (10 categorias em zero até haver exposição); MUST NOT incluir data/hora nem sessão.
- **Relatório futuro**: RN-040 autoriza o **modelo** (taxa na 1ª tentativa). MUST NOT construir a tela nesta feature (YAGNI / constitution IV).
- **Beat de acerto (clarificação 2026-09-07)**: após “Você acertou”, beat curto de no máximo 1 segundo e a próxima pergunta/street — sem tela “Parabéns, fase 2” (PRD §8.1) e sem **Continuar** no acerto. A grade permanece visível com o estado de acerto durante o beat. Com preferência por reduzir movimento, o avanço é imediato. O teto de animação de cartas continua o do casco; este beat é do HUD.
- **Idioma**: UI em pt-BR; identificadores internos podem estar em inglês.
- **Constitution como constraint**: sem backend, sem cadastro, custo zero, treino e não jogo, desktop-first, fail-open, RN-G001..G008. Stack completa (ADRs 001–007) não se reabre aqui; esta feature toca especialmente o ADR-002.
