# Context — Poker Trainer

> Documento de visão macro. Descreve **por quê** o sistema existe, não **como** implementá-lo.
> Última atualização: 2026-09-07 (CR-001 — colinha de classificação)

## Objetivo geral

O Poker Trainer é um treinador de **leitura de mãos** de Texas Hold’em no navegador. Simula uma mesa online com três jogadores para o usuário praticar, em múltipla escolha, identificar a **categoria** da mão que já tem, as categorias ainda possíveis de completar (só mudança de categoria, não “par mais forte”) e, no showdown, as mãos de todos e quem leva o pote — até essa leitura ficar rápida o bastante para uma mesa presencial. Não há perguntas antes do flop.

## Contexto de negócio

O produto nasce de uma necessidade pessoal, não de um mercado a explorar neste momento: o autor joga em mesas presenciais e perde confiança (e, no limite, fichas) porque não lê as mãos com velocidade. Não há dealer confiável em todas as mesas caseiras. O software existe para treinar essa habilidade em casa, com volume de mãos e feedback imediato que a mesa ao vivo não oferece.

## Problema que resolve

Na mesa ao vivo, duas falhas se repetem:

1. **No flop (e no turn):** o dealer espalha as comunitárias e o jogador não consegue, com rapidez, dizer qual mão já completou nem quais categorias ainda pode completar se vierem o turn e o river.
2. **No showdown:** as mãos abrem e o jogador não identifica depressa o que cada um formou — inclusive a própria mão. Fica dependente do dealer humano, que pode errar ou, em mesas sem profissional, de jogadores que “decidem” o pote. Sem a habilidade de leitura, ele não consegue questionar e pode ser prejudicado.

O treino precisa parecer **mesa**, não prova escolar: o cérebro deve ensaiar o mesmo contexto visual (feltro, cartas, posições) em que a habilidade será usada.

## Público-alvo

| Persona / Segmento | Contexto de uso | Objetivo principal |
|--------------------|-----------------|-------------------|
| Jogador amador em mesas presenciais (usuário único neste MVP) | Em casa, no computador (desktop primeiro), sessões de treino antes ou depois de jogar ao vivo | Identificar mãos e o vencedor do pote com rapidez e confiança, sem depender do dealer |

Não há papéis de administrador, professor ou multi-usuário no MVP.

## Proposta de valor

- Treino repetível de leitura de mão **na mesma cadência da mesa** (flop → turn → river → showdown), sem apostas para não desviar a atenção.
- Feedback imediato com nova chance até acertar, para gravar o padrão certo — e estatística pela **primeira tentativa**, para medir habilidade real.
- O quiz pede só a categoria; o motor usa ranking completo (kickers e empates) para o pote.
- Experiência visual de poker online, para transferir o treino para a mesa presencial.
- Histórico local da facilidade por categoria de mão, pronto para um relatório futuro.

## Escopo de alto nível

### Dentro do escopo (MVP)

- Simulação de uma mão de Texas Hold’em com o herói e dois adversários (sem quiz preflop).
- Embaralhamento de alta entropia e distribuição das cartas a cada rodada (11 cartas de jogo; burn só visual).
- Flop e turn: mão atual (uma categoria) + mãos ainda possíveis (múltipla seleção).
- River/showdown: uma vez a mão do herói, a de cada adversário e quem ganha o pote (incluindo empate).
- Cartas dos adversários ocultas até o river.
- Feedback de acerto/erro; opção errada desabilitada; nova tentativa até acertar; só a 1ª tentativa vale na evolução.
- Persistência no dispositivo da evolução por categoria (sem tela de relatório).
- Encerramento da rodada com resultado e **Próxima mão**.
- Interface imersiva de mesa de poker online (feltro, cartas animadas, avatares, fichas, som suave).
- Colinha de classificação das 10 categorias (miniatura com cartas-exemplo) no canto da mesa no desktop, ocultável na visita.

### Fora do escopo (MVP)

- Apostas, blinds, raises, fold, side pots e qualquer decisão de estratégia.
- Quiz preflop; desistir da mão em curso (exceto recarregar a página).
- Draws nomeados (flush draw, gutshot, open-ended, overcards) — o treino usa só a **categoria** (rótulos canônicos do PRD).
- Kickers e enunciados do tipo “par de ases”; melhorar *dentro* da mesma categoria não é pergunta.
- Relatório visual, botão de zerar stats, mute/volume na UI.
- Multiplayer, contas, login, sincronização entre dispositivos.
- Outras variantes (Omaha, Stud, short deck); mais de três jogadores; torneios.
- App nativo, backend, servidor de jogo.
- Uso como “cola” na mesa ao vivo (abrir o app no clube para colar). A colinha da tela de treino (desktop) é outro recorte — ver PRD §5.7.
- Colinha no celular; lembrar oculto/visível depois de recarregar a página.

### Futuro (pós-MVP, sem compromisso)

- Relatório de evolução por categoria de mão (acerto na primeira tentativa, volume, tendência).
- Draws nomeados como modo de treino extra.
- Granularidade com ranking (“par de ases”) e kickers.
- Mais adversários, posições e tipos de board.
- Som/tema configuráveis; modo rápido (cronômetro visível).
- Sincronização da evolução entre dispositivos.
- Colinha no viewport estreito; persistir a preferência de visibilidade (exigiria emenda à constitution / ADR-002).

## Limitações gerais

- Arquitetura mínima: HTML, CSS e JavaScript no navegador; sem backend (ver ADRs).
- Persistência só no dispositivo (não sobrevive a outro computador, outra origem, nem à limpeza do site).
- Publicação: site estático no GitHub Pages ([ADR-001](adr/ADR-001-entrega-estatica-github-pages.md)). Desenvolvimento local deve usar um servidor estático (`http://`), não `file://` — ES modules e áudio quebram em arquivo aberto direto ([ADR-006](adr/ADR-006-es-modules-sem-bundler.md)).
- Um único usuário por navegador; sem perfil nem dados cadastrais.
- Desktop é o alvo de imersão; tablet usável; celular básico no MVP.

## Métricas de sucesso (macro)

| Métrica | Meta | Como medir |
|---------|------|------------|
| Leitura na primeira tentativa | Acurácia por categoria de mão sobe com o volume de rodadas | Contadores locais de acerto/erro na 1ª tentativa |
| Conclusão da rodada | O usuário consegue terminar flop → river sem travar no fluxo | Rodadas concluídas até o botão “Próxima mão” |
| Transferência para a mesa | O autor relata mais confiança para questionar o pote ao vivo | Autoavaliação qualitativa (não instrumentada no MVP) |

## Stakeholders

| Papel | Interesse |
|-------|-----------|
| Autor / único usuário | Treinar leitura de mãos e não depender do dealer |
| Desenvolvedor | Entregar o MVP simples, fiel às regras e imersivo na UI |

## Dados e privacidade

Não há cadastro, e-mail, nome real nem identificadores pessoais. O que permanece no dispositivo são contadores de desempenho de treino (categorias de mão). Não há envio a servidor. Limpar os dados do site no navegador apaga a evolução.

## Documentos relacionados

- PRD: [prd.md](prd.md)
- Roadmap Spec Kit: [speckit-roadmap.md](speckit-roadmap.md)
- ADRs:
  - [ADR-001 — Entrega estática no GitHub Pages](adr/ADR-001-entrega-estatica-github-pages.md)
  - [ADR-002 — Persistência no localStorage](adr/ADR-002-persistencia-localstorage.md)
  - [ADR-003 — Motor próprio de avaliação](adr/ADR-003-motor-avaliacao-maos.md)
  - [ADR-004 — Shuffle Web Crypto + pool](adr/ADR-004-embaralhamento-webcrypto-pool.md)
  - [ADR-005 — Cartas HTML/CSS + SVG](adr/ADR-005-cartas-html-css-svg.md)
  - [ADR-006 — ES modules sem bundler](adr/ADR-006-es-modules-sem-bundler.md)
  - [ADR-007 — Web Audio sintetizado](adr/ADR-007-webaudio-sintetizado.md)
- Change Requests: [CR-001 — Colinha de classificação de mãos](changes/CR-001.md)

## Histórico de revisões

| Data | Autor | Resumo |
|------|-------|--------|
| 2026-09-07 | Samarone Salles | Criação inicial |
| 2026-09-07 | Samarone Salles | Revisão de consistência com o PRD (preflop, river uma vez, burns, labels, limites de UI) |
| 2026-09-07 | Samarone Salles | CR-001: colinha de classificação no desktop (escopo MVP); cola ao vivo continua fora |
