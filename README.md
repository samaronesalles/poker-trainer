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

O projeto usa ES modules e Web Audio — **não abra `index.html` via `file://`**. Use um servidor estático local:

```bash
# Exemplo com Python
python -m http.server 8080

# Exemplo com Node (npx)
npx serve .
```

Depois acesse `http://localhost:8080` (ou a porta equivalente).

## Deploy

Publicação prevista via **GitHub Pages** a partir da branch `main`. Detalhes em [ADR-001](docs/adr/ADR-001-entrega-estatica-github-pages.md).

## Privacidade

Não há cadastro, login nem envio de dados a servidor. Apenas contadores de desempenho de treino ficam no `localStorage` do navegador. Limpar os dados do site apaga a evolução.

## Licença

A definir.
