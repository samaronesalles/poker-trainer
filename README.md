# Poker Trainer

Treinador de **leitura de mãos** de Texas Hold'em no navegador. Simula uma mesa online com três jogadores para você praticar identificar a mão atual, quais categorias viram o pote, outs, odd da próxima carta e o vencedor do showdown — com feedback imediato e estatísticas locais de evolução.

> **Status:** MVP implementado (features 001–008 do [Spec Kit roadmap](docs/speckit-roadmap.md)).

## Por que existe

Na mesa presencial, duas falhas se repetem: não identificar com rapidez a mão já completada (ou as categorias ainda possíveis) no flop/turn, e não ler depressa todas as mãos no showdown. O Poker Trainer treina essa habilidade em casa, com volume de mãos e feedback imediato, numa interface que **parece mesa de poker online** — não um quiz escolar.

## O que faz (MVP)

- Mesa imersiva com herói + 2 adversários (sem apostas, blinds ou fold)
- Deal animado com baralho de 52 cartas e embaralhamento de alta entropia
- Quiz no **flop**, **turn** e **showdown** (sem perguntas preflop)
- §5.4: **quais mãos viram o pote** contra um vilão assumido (só a próxima carta); skip **“Não há mão que vire o pote.”**
- §5.8 (após acertar a 5.4): quantidade de outs, 13 ranks e odd da próxima carta (regra do 2, X:1)
- Showdown: mãos dos adversários e vencedor do pote (holes reais)
- Retry até acertar; só a **primeira tentativa** conta na evolução
- Persistência local da evolução (sem login, sem nuvem)
- Som suave, avatares, fichas decorativas e animações de carta

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML, CSS, JavaScript (ES modules) |
| Deploy | GitHub Pages (site estático, sem backend) |
| Persistência | `localStorage` no navegador |
| Áudio | Web Audio API (sintetizado) |
| Cartas | HTML/CSS + SVG |

Sem bundler, sem framework, sem servidor de aplicação. Ver [ADRs](docs/adr/) para detalhes das decisões arquiteturais.

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [context.md](docs/context.md) | Visão macro, escopo e métricas de sucesso |
| [prd.md](docs/prd.md) | Requisitos funcionais (fonte da verdade do comportamento) |
| [speckit-roadmap.md](docs/speckit-roadmap.md) | Roadmap de implementação (6 features, ordem de execução) |
| [docs/adr/](docs/adr/) | Architecture Decision Records (7 ADRs) |

## Desenvolvimento local

O projeto usa ES modules e Web Audio — **não abra `index.html` via `file://`** (módulos e áudio não são modo suportado nesse protocolo). Use um servidor HTTP local na raiz do repositório:

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Depois acesse `http://localhost:8080`. Viewport de referência desktop: **1280×720** pixels CSS (DevTools). Abaixo disso o HUD pode empilhar; as cartas permanecem legíveis.

Testes de contrato (Node 18+, sem bundler): motor de melhor 5, vilão assumido, desconto de outs e `quemGanhou` em `tests/contract/motor.test.js`, FSM do HUD em `tests/contract/hud-session.test.js`, quiz em `tests/contract/quiz.test.js`, persistência em `tests/contract/storage.test.js`, áudio fail-open e o gerador em `tests/contract/baralho.test.js`. Módulos de domínio: `js/motor.js` (`avaliarMelhor5`, `sintetizarVilaoAssumido`, `avaliarDescontoStreet`, `oddDaProximaCarta`, `quemGanhou`, `conjuntoOpcoesVencedor`, `UNIVERSO_POTE`), `js/quiz.js` e `js/storage.js`. No flop e no turn do herói a certa é a melhor 5 real. A §5.4 usa upgrades que **viram o pote**; lista vazia → skip; enumeração inválida aborta a mão. A §5.8 só abre se a 5.4 não foi skip. No river, as quatro perguntas (`river_hero` / `river_a` / `river_b` / `river_vencedor`) usam a Melhor5 de cada jogador e o ranking completo do pote — sem 5.4/5.8. Sem Playwright. Sem Pot Odds, sem regra do 4.

```bash
node --test tests/contract/*.test.js
```

## Deploy

Site público no GitHub Pages: **https://samaronesalles.github.io/poker-trainer/**

O workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) publica só `index.html`, `css/`, `js/` e `assets/` (sem testes nem docs). Dispara ao:

- subir uma tag `v*` (`git tag v1.0.0 && git push origin v1.0.0`);
- publicar um **Release** no GitHub;
- rodar **Actions → Deploy GitHub Pages → Run workflow** (manual).

A fonte do Pages no repositório deve ser **GitHub Actions** (Settings → Pages → Build and deployment → Source). Detalhes da escolha de hospedagem em [ADR-001](docs/adr/ADR-001-entrega-estatica-github-pages.md). A evolução no `localStorage` é por origem: o treino em `localhost` e o do Pages não compartilham contadores.

## Privacidade

Não há cadastro, login nem envio de dados a servidor. Avatares e apelidos (**Você**, **Adversário A**, **Adversário B**) são de produto, não de cadastro. A sessão da mesa vive só em memória (recarregar aborta a mão e volta à mesa ociosa). O único dado persistido é o JSON de contadores de treino (`mao_atual`, `upgrade`, `vencedor_pote`, `outs`, `odds`) na chave `poker-trainer:evolucao` do `localStorage` da origem — sem PII, sem cartas, sem vilão assumido, sem lista de outs, sem ranks, sem N, sem razão, sem timestamp. Limpar os dados do site apaga a evolução. Não há botão zerar nem tela de relatório.

## Licença

A definir.
