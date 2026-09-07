# Feature Specification: Colinha de classificação de mãos

**Feature Branch**: `007-colinha-classificacao`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "Implementar a colinha de classificação das 10 categorias de Texas Hold’em no canto superior direito do desktop: overlay miniatura visível ao abrir, título Classificação de mãos, ordem RN-014 com rótulos exatos, cada linha com número + 5 cartas-exemplo fixas (extras esmaecidas, idioma visual da mesa, sem PNG de terceiros), ocultável na visita com botão Colinha no mesmo canto, sem localStorage/sessionStorage da preferência (reload restaura visível), estática em relação ao quiz (não destaca a mão da mesa, clique não responde), ausente em viewport ≤900 px, fail-open se o overlay falhar — conforme PRD §5.7 (RN-048, RN-049, RN-050, RN-051, RN-052, RN-053, RN-054, CA-028, CA-029, CA-030, CA-031, CA-032)"

## User Scenarios & Testing *(mandatory)*

Esta feature é o **auxílio visual de consulta** no desktop: quem ainda não decorou a hierarquia de Texas Hold’em olha, no canto da mesa, qual categoria ganha de qual — sem sair do clube, sem revelar a resposta do quiz e sem transformar o treino em prova escolar. O casco da mesa (001), o deal (002), o contrato de quiz (003) e as perguntas de rua (004–006) já existem. Aqui o valor é a lenda estática das 10 categorias canônicas, ocultável nesta visita, ausente no viewport estreito.

### User Story 1 - Ver a classificação ao abrir no desktop (Priority: P1)

O treinando abre o produto no computador. Sem wizard e sem cadastro, no canto **superior direito** já está um overlay compacto no cromo do clube: título **Classificação de mãos**, sentido Melhor (topo) → Pior (base) e as 10 linhas da hierarquia. Comunitárias, hole cards, assentos e HUD permanecem visíveis e usáveis. A mesa continua o herói; a colinha é chrome que se consulta.

**Why this priority**: Sem o overlay visível no desktop o critério CA-028 falha e o motivo da feature (consultar a hierarquia sem sair da mesa) não existe. É o primeiro instante e RN-050.

**Independent Test**: Abrir o app no viewport desktop de referência 1280×720, em primeira visita ou após recarregar, em qualquer estado do HUD, e verificar o overlay no canto superior direito com título, 10 linhas e zero obstrução de comunitárias, assentos ou HUD.

**Acceptance Scenarios**:

1. **Given** o app acaba de abrir no desktop 1280×720 (primeira visita ou após recarregar) com o HUD `ociosa`, **When** o treinando olha a tela, **Then** a colinha está visível no canto superior direito com o título **Classificação de mãos**, as 10 linhas canônicas (rótulos exatos, ordem 1→10) e cinco cartas-exemplo em cada linha, sem cobrir comunitárias, assentos nem o HUD (CA-028, RN-050).
2. **Given** o HUD em `deal`, `perguntando`, `sem_upgrade` ou `resultado` no desktop, **When** o treinando olha o canto superior direito, **Then** a colinha (ou o botão **Colinha**, se ele a tiver ocultado nesta visita) permanece nesse canto, fora do HUD, e o treino continua no painel inferior.
3. **Given** a colinha visível no desktop, **When** o treinando lê o painel, **Then** há um indicador discreto de **Melhor** no topo e **Pior** na base, a lista é vertical e compacta, e o visual é de clube (escuro, feltro/rail) — não um infográfico vermelho de site.
4. **Given** o viewport de referência 1280×720, **When** o treinando consulta as linhas, **Then** os rótulos e as cartas-exemplo permanecem legíveis a cerca de 70 cm do monitor (RN-050).

---

### User Story 2 - Consultar as 10 categorias com exemplos fixos (Priority: P1)

O treinando lê a lista de cima para baixo. Cada linha tem o número de ordem (1 a 10), o rótulo canônico e cinco cartas-exemplo. As cartas são ilustrativas e **fixas**: não são as da mão em curso e não mudam de uma mão para outra nem entre visitas. Cartas que não entram no conjunto principal daquela categoria (kicker da quadra, kickers de par, cartas de carta alta que não são a mais alta, etc.) ficam esmaecidas. Os nomes são exatamente os do quiz — sem “Sequência”, “Um par” ou “Straight flush real”.

**Why this priority**: A consulta só treina o vocabulário certo se os rótulos e a ordem forem os de RN-014. É RN-048, RN-049 e o núcleo da §5.7.

**Independent Test**: Com a colinha visível, conferir as 10 linhas na ordem 1→10, os dez rótulos canônicos, cinco cartas-exemplo por linha no idioma visual da mesa, extras esmaecidas, e que os exemplos não coincidem com a mão do feltro nem mudam ao pedir **Nova mão** / **Próxima mão**.

**Acceptance Scenarios**:

1. **Given** a colinha visível, **When** o treinando lê as linhas de cima para baixo, **Then** há **exatamente** estas 10 categorias, nesta ordem, com estes rótulos e nenhum sinônimo (RN-048):

   | # | Rótulo |
   |---|--------|
   | 1 | Royal flush |
   | 2 | Straight flush |
   | 3 | Quadra |
   | 4 | Full house |
   | 5 | Flush |
   | 6 | Straight |
   | 7 | Trinca |
   | 8 | Dois pares |
   | 9 | Par |
   | 10 | Carta alta |

2. **Given** qualquer linha da lista, **When** o treinando olha as cartas, **Then** vê **cinco** cartas-exemplo no mesmo idioma visual da mesa (baralho clássico, índices e naipes legíveis em miniatura; sem emoji nem caracteres de baralho como carta principal) (RN-049).
3. **Given** uma linha cuja categoria tem cartas que não definem o conjunto principal (kicker da **Quadra**, kickers de **Trinca** / **Dois pares** / **Par**, cartas de **Carta alta** que não são a mais alta), **When** o treinando compara as cinco cartas, **Then** essas extras estão esmaecidas e o conjunto que define a categoria permanece em destaque (RN-049).
4. **Given** as linhas **Royal flush**, **Straight flush**, **Full house**, **Flush** e **Straight**, **When** o treinando olha as cinco cartas, **Then** as cinco formam o conjunto da categoria e **não** há extra esmaecida nessas linhas.
5. **Given** uma mão em curso no feltro, **When** o treinando compara as cartas da colinha com o board e as hole cards, **Then** os exemplos da colinha **não** são as cartas daquela mão (RN-049).
6. **Given** o treinando aciona **Nova mão** ou **Próxima mão**, **When** a nova mão é distribuída, **Then** as dez linhas e as cartas-exemplo da colinha permanecem as mesmas (não embaralham a cada mão) (RN-049).
7. **Given** a colinha visível, **When** o treinando procura arte copiada ou carregada de um infográfico de terceiros, **Then** essa arte **não** está incorporada nem reproduzida pixel a pixel (RN-054).

---

### User Story 3 - Ocultar e reabrir na mesma visita (Priority: P2)

O treinando quer o canto livre. Aciona **Ocultar**: o painel some e resta só um controle discreto **Colinha** no mesmo canto superior direito, sem competir com **Nova mão** / **Próxima mão**. Aciona **Colinha**: o painel volta com as mesmas 10 linhas. Recarregar a página no desktop traz a colinha **visível** de novo — a preferência não é lembrada.

**Why this priority**: A colinha é chrome, não palco. Sem ocultar, ela compete com a mesa; sem restaurar no reload, violaria RN-051 e a constitution (nada além dos contadores de treino no dispositivo). É CA-029 e CA-032.

**Independent Test**: No desktop, ocultar, confirmar só **Colinha** no canto, reabrir e ver as mesmas 10 linhas; recarregar e ver a colinha visível; inspecionar o armazenamento da origem e confirmar que não há chave de preferência.

**Acceptance Scenarios**:

1. **Given** a colinha visível no desktop, **When** o treinando aciona **Ocultar**, **Then** o painel some e resta **somente** o controle discreto **Colinha** no mesmo canto superior direito (CA-029, RN-051).
2. **Given** a colinha ocultada, **When** o treinando aciona **Colinha**, **Then** o painel volta no mesmo canto com o título **Classificação de mãos** e as mesmas 10 linhas e cartas-exemplo (CA-029).
3. **Given** a colinha ocultada no desktop, **When** o treinando recarrega a página, **Then** a colinha está **visível** de novo; a evolução persistida (se houver) permanece inalterada (CA-029, RN-051).
4. **Given** a colinha ocultada no desktop, **When** se inspeciona o armazenamento da origem, **Then** a única chave de produto continua a da evolução (`mao_atual`, `upgrade`, `vencedor_pote`); **não** existe chave de preferência da colinha em armazenamento local, de sessão, cookie ou equivalente (CA-032, RN-051).
5. **Given** o painel visível ou o botão **Colinha**, **When** o treinando usa só o teclado, **Then** alcança **Ocultar** ou **Colinha** com Tab e ativa com Enter ou Espaço, com foco visível (RN-054).
6. **Given** o estado oculto, **When** o treinando compara o botão **Colinha** com os CTAs do HUD, **Then** **Colinha** é mínimo e **não** compete visualmente com **Nova mão** / **Próxima mão**.

---

### User Story 4 - Olhar sem interferir no quiz (Priority: P2)

O treinando está em `perguntando`. Olha a colinha para lembrar a ordem. Nenhuma linha acende como “a certa” da mesa. Clicar ou focar uma linha **não** escolhe opção, **não** muda o enunciado e **não** altera contadores. A colinha não é pergunta, não entra no HUD e não incrementa evolução.

**Why this priority**: Se a colinha destacasse a mão da mesa ou respondesse no clique, quebraria RN-G005 e o treino viraria cola. É CA-030 e RN-052.

**Independent Test**: Com um quiz ativo, olhar a colinha (visível ou reaberta), clicar/ativar cada linha e confirmar que enunciado, opções, estados de opção e contadores permanecem iguais; nenhuma linha marcada como resposta.

**Acceptance Scenarios**:

1. **Given** o HUD em `perguntando`, **When** o treinando olha a colinha, **Then** **nenhuma** linha está destacada como a categoria da mesa ou como “a certa” do quiz (CA-030, RN-052).
2. **Given** um quiz ativo, **When** o treinando clica ou aciona por tecla uma linha da lista, **Then** enunciado, opções, estados de opção e contadores **não** mudam; nada é submetido (CA-030, RN-052).
3. **Given** a colinha visível ou reaberta, **When** o treinando procura um controle que revele a resposta da pergunta atual, **Then** esse controle **não** existe; RN-G005 continua válido (RN-052).
4. **Given** qualquer acerto ou erro no HUD, **When** a evolução é gravada, **Then** a colinha **não** incrementa `mao_atual`, `upgrade` nem `vencedor_pote` e **não** persiste cartas nem information set (RN-054).
5. **Given** o HUD em qualquer estado, **When** o treinando oculta ou reabre a colinha, **Then** o estado do HUD e o andamento da mão **não** mudam.

---

### User Story 5 - Sem colinha no viewport estreito; mesa segue se o overlay falhar (Priority: P3)

No celular ou em janela com largura ≤ 900 px, a colinha **não existe**: nem o painel nem o botão. Se o overlay não puder ser montado no desktop, a mesa e o quiz seguem — sem modal, sem diálogo de erro; a colinha pode simplesmente ausentar-se nesta visita.

**Why this priority**: Desktop-first e fail-open são gates da constitution. O celular do MVP não ganha chrome extra; uma falha da lenda não pode abortar o treino. É CA-031 e RN-053.

**Independent Test**: Abrir o app com largura ≤ 900 px e confirmar ausência total; no desktop, simular falha de montagem e confirmar que a mão/quiz continuam sem modal.

**Acceptance Scenarios**:

1. **Given** viewport com largura ≤ 900 px, **When** se abre o app (qualquer estado do HUD), **Then** **não** há painel de classificação nem botão **Colinha** (CA-031, RN-053).
2. **Given** o treinando redimensiona de desktop largo para ≤ 900 px, **When** o layout compacto entra, **Then** painel e botão **Colinha** desaparecem; a mesa e o HUD continuam usáveis.
3. **Given** o overlay da colinha falha ao montar no desktop, **When** o treinando inicia ou continua uma mão, **Then** mesa e quiz seguem, **não** aparece modal nem diálogo nativo de erro, e a colinha MAY ausentar-se nesta visita.
4. **Given** falha da colinha ou ausência no viewport estreito, **When** o treinando recarrega no desktop largo com o overlay saudável, **Then** a colinha volta **visível** (comportamento padrão de abertura).

---

### Edge Cases

- Recarregar com a colinha ocultada: no desktop, a colinha reaparece visível; a mão em curso aborta (contrato da 001); a evolução persistida **não** é apagada nem alterada por este reset.
- Redimensionar de largo para estreito (≤ 900 px) e de volta ao largo na **mesma visita**: no estreito, painel e botão somem; ao voltar ao largo, vale o estado de visita (se tinha ocultado, só **Colinha**; se não, o painel visível). Redimensionar **não** é recarregar.
- Abrir já no viewport estreito e depois alargar: a colinha aparece **visível** (nunca foi ocultada nesta visita).
- Clique ou tecla em linha da lista: ignora quanto ao quiz; não submete, não destaca, não avança a mão.
- Falha ao montar o overlay: mesa e quiz seguem; sem modal; colinha pode ausentar-se nesta visita; sem jargão técnico no HUD.
- Armazenamento da origem recusado ou cheio: irrelevante para a colinha (ela não grava preferência); o contrato fail-open da evolução (feature 003) permanece.
- Duas abas da mesma origem: cada visita/aba tem o próprio estado visível/oculto em memória; nenhuma escreve preferência da colinha.
- Preferência por reduzir movimento: a colinha não exige animação; aparecer/sumir MAY ser imediato; o treino não espera a colinha.
- Primeira visita e visita seguinte (após reload): ambas abrem com a colinha **visível** no desktop; não há onboarding da colinha.
- Tentativa de usar a colinha como “cola” na mesa ao vivo: fora do recorte desta feature e do MVP (continuar proibido no produto); esta colinha é só lenda na tela de treino em casa.
- Arte de referência de composição (infográfico de terceiros): MUST NOT ser incorporada, copiada pixel a pixel nem carregada por endereço externo.
- Título ou controles em outro idioma / sinônimo de categoria: proibidos. Controles exatamente **Ocultar** e **Colinha**; título exatamente **Classificação de mãos**.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A colinha MUST listar **exatamente** as 10 categorias canônicas, da mais forte para a mais fraca, com os **rótulos exatos**: **Royal flush**, **Straight flush**, **Quadra**, **Full house**, **Flush**, **Straight**, **Trinca**, **Dois pares**, **Par**, **Carta alta**. MUST NOT usar sinônimos (`Sequência`, `Um par`, `Straight flush real`, etc.) (RN-048).
- **FR-002**: Cada linha MUST mostrar o número de ordem (1 a 10), o rótulo canônico e **cinco** cartas-exemplo ilustrativas. As cartas do exemplo MUST NOT ser as da mão em curso. O exemplo de cada categoria MUST ser estável entre mãos e entre visitas (não embaralha a cada rodada) (RN-049).
- **FR-003**: Cartas que não entram no conjunto principal da categoria MUST ficar **esmaecidas**; o conjunto que define a categoria permanece em destaque. Em **Royal flush**, **Straight flush**, **Full house**, **Flush** e **Straight**, as cinco cartas formam o conjunto — sem extra esmaecida. Em **Quadra**, o kicker esmaece. Em **Trinca**, os dois kickers esmaecem. Em **Dois pares**, o kicker esmaece. Em **Par**, os três kickers esmaecem. Em **Carta alta**, as cartas que não são a mais alta esmaecem (RN-049).
- **FR-004**: As cartas-exemplo MUST usar o mesmo idioma visual das cartas da mesa (baralho clássico, índices e naipes; sem emoji nem caracteres de baralho como carta principal). MUST NOT incorporar, copiar pixel a pixel nem carregar por endereço externo a arte de terceiros usada só como referência de composição (RN-049, RN-054).
- **FR-005**: No layout largo da mesa (largura acima de 900 px, o mesmo recorte da mesa imersiva), a colinha MUST iniciar **visível** no canto **superior direito**, em overlay que **não** empurra o feltro. MUST NOT cobrir comunitárias, hole cards, assentos nem o HUD. No viewport de referência **1280×720** os rótulos e as cartas-exemplo MUST permanecer legíveis (RN-050, CA-028).
- **FR-006**: O título visível MUST ser exatamente **Classificação de mãos**. MUST haver indicador discreto de Melhor (topo) → Pior (base). A lista MUST ser vertical e compacta. O cromo MUST ser de clube (escuro, feltro/rail), não infográfico vermelho de site (RN-054).
- **FR-007**: O treinando MUST poder ocultar e reabrir a colinha na **mesma visita**. Oculta → só o controle discreto **Colinha** no mesmo canto. Visível → controle **Ocultar** no painel. MUST NOT gravar essa preferência em armazenamento local, de sessão, cookie ou outra persistência. Recarregar a página no desktop MUST restaurar a colinha **visível** (RN-051, CA-029, CA-032).
- **FR-008**: A colinha MUST ser **estática** em relação ao treino: MUST NOT destacar a categoria da mesa, MUST NOT marcar a opção certa do quiz, MUST NOT submeter resposta. Clique ou tecla em uma linha da lista MUST NOT alterar o HUD, as opções, os contadores nem o andamento da mão (RN-052, CA-030, RN-G005).
- **FR-009**: Em viewport com largura ≤ 900 px, MUST NOT existir o painel de classificação nem o botão **Colinha** (RN-053, CA-031).
- **FR-010**: A colinha MUST NOT ser pergunta, MUST NOT entrar no HUD, MUST NOT incrementar evolução e MUST NOT persistir cartas, information set, snapshot, runout ou dump de resultado. Controles visíveis MUST estar em português brasileiro: **Ocultar** e **Colinha**, alcançáveis por Tab e ativáveis com Enter ou Espaço; o mouse permanece o caminho principal. Linhas da lista MUST NOT entrar no ciclo de Tab como se fossem opções de quiz (RN-054).
- **FR-011**: Falha ao montar o overlay MUST NOT abortar a mão nem o quiz. MUST NOT haver modal agressivo nem diálogo nativo de erro. A colinha MAY ausentar-se nesta visita; a mesa segue (fail-open).
- **FR-012**: O botão **Colinha** (estado oculto) MUST ser mínimo e MUST NOT competir com **Nova mão** / **Próxima mão**.
- **FR-013**: MUST NOT coletar, solicitar ou persistir CPF, e-mail, nome real, apelido digitado, telefone, endereço ou qualquer identificador pessoal. MUST NOT enviar mãos, respostas, preferência da colinha ou telemetria a servidor.
- **FR-014**: MUST NOT haver tela de relatório, gráfico, ranking de desempenho ou botão de zerar stats. A colinha MUST NOT ser apresentada como relatório nem como ranking de desempenho (CA-024).
- **FR-015**: A colinha MUST permanecer no canto, fora do HUD, em todos os estados `ociosa`, `deal`, `perguntando`, `sem_upgrade` e `resultado` enquanto o viewport for largo (visível ou só o botão, conforme o estado da visita).

### Key Entities

- **Colinha**: overlay compacto de consulta no canto superior direito do desktop. Atributos: título **Classificação de mãos**, visibilidade de visita (`visível` | `oculto`), dez linhas canônicas. Não é pergunta, não é HUD e não é relatório.
- **Linha de categoria**: uma entrada da hierarquia. Atributos: número de ordem (1–10), rótulo canônico, cinco cartas-exemplo fixas, quais cartas estão esmaecidas. Relaciona-se à tabela canônica do produto, não à mão em curso.
- **Carta-exemplo**: face ilustrativa (rank + naipe) no idioma visual da mesa. Não pertence ao baralho da mão; não muda entre rodadas.
- **Estado de visita**: memória só desta abertura da página (`visível` por padrão; `oculto` após **Ocultar**). Some no recarregar. Não é entidade persistida.
- **Viewport da mesa**: largo (acima de 900 px — colinha existe) ou estreito (≤ 900 px — colinha não existe).

### Fora de escopo (esta feature)

- Colinha no viewport estreito (≤ 900 px) e persistir se está oculta depois de recarregar (pós-MVP; exigiria emenda de persistência).
- Destacar na colinha a mão atual da mesa ou clicar nela para responder o quiz.
- Uso como “cola” na mesa ao vivo (abrir o app no clube para colar) — recorte distinto, continua fora do MVP.
- Relatório, gráfico, ranking de desempenho, botão zerar, mute na UI.
- Alterar rótulos canônicos, contrato de quiz, motor, deal, HUD ou persistência das features 001–006.
- Apostas, estratégia, quiz preflop, multiplayer, login, outras variantes de poker.
- Incorporar ou hospedar o infográfico de terceiros usado só como referência de composição.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das aberturas no desktop de referência 1280×720 (primeira visita ou após reload), o treinando vê a colinha no canto superior direito com as 10 linhas canônicas e cinco cartas-exemplo cada, em menos de 3 segundos após a tela estar pronta, sem cobrir comunitárias, assentos ou HUD (CA-028).
- **SC-002**: Em 100% dos ciclos ocultar → reabrir na mesma visita desktop, o painel some deixando só **Colinha** no mesmo canto e volta com as mesmas 10 linhas; em 100% dos reloads no desktop a colinha reaparece visível (CA-029).
- **SC-003**: Em 100% das perguntas ativas, 0 linhas da colinha aparecem marcadas como “a certa”; 0 cliques ou teclas em linha alteram enunciado, opções ou contadores (CA-030).
- **SC-004**: Em 100% das aberturas com largura ≤ 900 px, há 0 painéis de classificação e 0 botões **Colinha** (CA-031).
- **SC-005**: Após ocultar a colinha no desktop, a inspeção do armazenamento da origem encontra 0 chaves de preferência da colinha; a única chave de produto permanece a da evolução, com os três buckets já existentes (CA-032).
- **SC-006**: Quando o overlay não pode ser montado, 100% das sessões de treino continuam; 0 modais agressivos ou diálogos nativos de erro da colinha.
- **SC-007**: 100% dos controles visíveis **Ocultar** e **Colinha** podem ser focados via Tab e ativados via Enter ou Espaço, sem mouse.
- **SC-008**: Em 100% das linhas, o rótulo visível é um dos 10 canônicos na ordem 1→10; 0 sinônimos aparecem na colinha.
- **SC-009**: Em 100% das novas mãos, as cartas-exemplo da colinha permanecem as mesmas da abertura da visita (não acompanham o baralho da mesa).

## Assumptions

- **Git / numeração**: o diretório da feature é `specs/007-colinha-classificacao/` (ShortName `colinha-classificacao`, número 007, sequential). A branch de trabalho é `007-colinha-classificacao`. Identidade da spec: `007-colinha-classificacao`. As specs 001–006 **não** são alteradas por esta invocação.
- **Fonte de verdade**: comportamento desta spec = PRD §5.7 (RN-048..054, CA-028..032) + gates globais da constitution (I–VII, RN-G001..G008) + CR-001. Nenhum `[NEEDS CLARIFICATION]` remanescente.
- **Rótulos**: cópia exata da tabela RN-014 já usada no quiz (features 004–006). Grafia e acentuação congeladas; “Straight” e “Royal flush” permanecem em inglês porque o PRD os fixa.
- **Breakpoint**: 900 px é o mesmo recorte compacto da mesa imersiva (PRD §5.1 / RN-007). Largo = acima de 900 px; estreito = ≤ 900 px.
- **Viewport de referência**: desktop = **1280×720** (o mesmo da feature 001). Nesse tamanho a colinha cabe no canto sem roubar o holofote das comunitárias.
- **Exemplos de cartas**: esta spec não congela rank/naipe de cada linha. O implementador escolhe **um** conjunto ilustrativo estável por categoria que deixe a categoria inequívoca (royal ≠ straight flush; wheel suited é straight flush; straight não circular). O conjunto não muda entre visitas. Detalhe visual das faces fica para o plan (mesmo idioma da mesa).
- **Esmaecer**: a regra de quais cartas são “extras” é a de FR-003; não depende da mão do feltro.
- **Estado de visita vs. resize**: oculto/visível vive só na memória desta abertura. Redimensionar para o estreito esconde o componente (ele não existe lá); voltar ao largo restaura o último estado da visita. Só o reload descarta o estado e volta a visível.
- **Duas abas**: cada aba é uma visita; não há sincronização da colinha.
- **Overlay**: a colinha flutua no canto e **não** desloca feltro, assentos nem HUD. Ajuste fino de espaçamento da mesa, se o implement 007 precisar, é converge posterior da 001 — não altera o contrato CA-001 nem esta spec.
- **Teclado**: só **Ocultar** e **Colinha** entram no ciclo de Tab da colinha. As linhas são consulta visual, não controles de quiz.
- **Som**: a colinha não exige som próprio. Eventos da mesa (feature 001) permanecem inalterados.
- **Privacidade**: nenhum dado pessoal; nenhuma chave nova no dispositivo. A inspeção de CA-032 lê o mesmo armazenamento da feature 003.
- **Constitution como constraint**: sem backend, sem cadastro, custo zero, escopo de treino (não jogo), desktop-first, fail-open. Cola ao vivo continua proibida. Detalhe de stack fica para `/speckit-plan` (ADRs 001, 002, 005, 006).
- **Documentos locais**: `docs/prd.md` §5.7, `docs/context.md`, `docs/speckit-roadmap.md` e `docs/changes/CR-001.md` já descrevem esta feature e viajam na branch; esta invocação não os reescreve nem descarta.
