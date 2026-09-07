# ADR-006: Cliente em ES modules sem bundler

**Status:** Aceito  
**Data:** 2026-09-07  
**Decisor:** Usuário (escolha registrada na entrevista de arquitetura)  
**Recomendação do agente:** `index.html` + CSS + JS em ES modules por domínio, sem bundler.

### Requisitos que fundamentam a decisão

| ID / Origem | Tipo | Como influenciou a análise |
|-------------|------|----------------------------|
| Pedido original / context | Não-funcional | HTML, CSS e JS; arquitetura mais simples possível |
| ADR-001 | Restrição | GitHub Pages, artefatos estáticos, HTTPS |
| ADR-003, ADR-004, ADR-005 | Arquitetura | Motor, shuffle e carta já são peças distintas |
| speckit-roadmap 001–006 | Processo | Implementação incremental por funcionalidade |
| CA-001 | Funcional | Um shell de mesa, não um app de muitas rotas |

**Drivers arquiteturais identificados:** zero build obrigatório; separação de domínio; carga confiável em Pages.

**Critérios de avaliação usados:** estático; arquivos mapeáveis ao roadmap; um `index.html`; baixa barreira.

### Contexto

Um único `app.js` aguentaria o dia 1 e quebraria no showdown. Um bundler resolveria imports, mas introduz Node, `dist/` e um passo que o PRD não pede. ES modules nativos no browser, servidos por HTTPS, cobrem o meio-termo.

### Opções consideradas

| Opção | Prós (vs requisitos) | Contras (vs requisitos) |
|-------|----------------------|-------------------------|
| ES modules sem bundler — escolhida | Sem build; um módulo por domínio (mesa, carta, baralho, motor, quiz, storage, audio); Pages OK | `file://` **não suportado** — usar `http://` local ou Pages |
| Três arquivos (`html`/`css`/`js`) | Muito simples | `app.js` vira monolito nas features 004–006 |
| HTML único inline | Máxima simplicidade inicial | Conflito eterno no Spec Kit; ilegível |
| Vite + `dist` no Pages | DX e concatenação | Ferramenta a mais contra “mínimo possível” |

### Decisão

**Escolha do usuário:** `index.html` + CSS + JS em ES modules por domínio, sem bundler (Recomendado).

O `index.html` é o shell da mesa (`<script type="module">`). CSS em `css/` (mesa, cartas, HUD). JavaScript em `js/` com módulos no mínimo: `mesa` (sessão/HUD estados), `carta`, `baralho` (shuffle RN-044), `motor` (ADR-003), `quiz` (contrato 5.3/5.4/5.5), `storage` (ADR-002), `audio` (ADR-007). Sem webpack/vite no MVP. Servir em `http://` ou HTTPS (Pages). `file://` está fora do modo suportado.

### Consequências

**Positivas:**
- Cada bloco do roadmap pode tocar um módulo sem reescrever o app inteiro.
- Deploy = commit dos estáticos.

**Negativas / trade-offs aceitos:**
- Abrir o HTML como arquivo local **não é suportado** — treinar pela URL do Pages ou `npx serve` / equivalente em `http://localhost`.
- Sem tree-shaking; irrelevante neste tamanho.

**Impacto em outras decisões:**
- Áudio (próximo ADR) entra como mais um módulo, não uma lib global obrigatória.

### Relacionados

- PRD: [docs/prd.md](../prd.md) §5.1, §7
- Roadmap: [docs/speckit-roadmap.md](../speckit-roadmap.md)
- ADRs: [ADR-001](ADR-001-entrega-estatica-github-pages.md)
