# Poker Trainer

Treinador de **leitura de mãos** de Texas Hold'em no navegador. Simula uma mesa online com três jogadores para você praticar identificar categorias de mão, upgrades possíveis e o vencedor do pote — com feedback imediato e estatísticas locais de evolução.

> **Status:** documentação e arquitetura definidas; implementação em andamento via [Spec Kit roadmap](docs/speckit-roadmap.md).

## Por que existe

Na mesa presencial, duas falhas se repetem: não identificar com rapidez a mão já completada (ou as categorias ainda possíveis) no flop/turn, e não ler depressa todas as mãos no showdown. O Poker Trainer treina essa habilidade em casa, com volume de mãos e feedback imediato, numa interface que **parece mesa de poker online** — não um quiz escolar.

## O que faz (MVP)

- Mesa imersiva com herói + 2 adversários (sem apostas, blinds ou fold)
- Deal animado com baralho de 52 cartas e embaralhamento de alta entropia
- Quiz no **flop**, **turn** e **showdown** (sem perguntas preflop)
- Perguntas de múltipla escolha: mão atual, upgrades possíveis, mãos dos adversários e vencedor do pote
- Retry até acertar; só a **primeira tentativa** conta na evolução
- Persistência local da evolução por categoria de mão (sem login, sem nuvem)
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

Testes de contrato da FSM (Node 18+, sem bundler):

```bash
node --test tests/contract/*.test.js
```

## Deploy

Publicação prevista via **GitHub Pages** a partir da branch `main`. Detalhes em [ADR-001](docs/adr/ADR-001-entrega-estatica-github-pages.md).

## Privacidade

Não há cadastro, login nem envio de dados a servidor. Avatares e apelidos (**Você**, **Adversário A**, **Adversário B**) são de produto, não de cadastro. A sessão da mesa vive só em memória (recarregar volta à mesa ociosa). Contadores de evolução, quando existirem, ficarão no `localStorage` da origem — esta etapa ainda não grava chaves. Limpar os dados do site apaga a evolução futura.

## Licença

A definir.
