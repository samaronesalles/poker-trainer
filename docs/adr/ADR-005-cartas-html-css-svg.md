# ADR-005: Cartas em HTML/CSS com naipes em SVG

**Status:** Aceito  
**Data:** 2026-09-07  
**Decisor:** Usuário (escolha registrada na entrevista de arquitetura)  
**Recomendação do agente:** Cartas HTML/CSS com naipes em SVG — componente único, flip em CSS.

### Requisitos que fundamentam a decisão

| ID / Origem | Tipo | Como influenciou a análise |
|-------------|------|----------------------------|
| PRD §5.1 / §8.1 | UX | Baralho clássico, índices grandes, naipes inequívocos, verso único; nunca emoji como carta |
| CA-001, CA-002, CA-018 | Funcional | Mesa com cartas; flop animado; showdown face-up nos assentos |
| NFR acessibilidade | Não-funcional | Ler rank/naipe a ~70 cm no desktop |
| ADR-001 | Restrição | Site estático; evitar dezenas de binários |

**Drivers arquiteturais identificados:** legibilidade da carta; animação de deal/virada; pouca superfície de assets.

**Critérios de avaliação usados:** contraste de rank/naipe; flip/deal em CSS; poucos arquivos no Pages; vedação a Unicode/emoji de baralho.

### Contexto

A habilidade treinada depende de olhar para **cartas no feltro**. 52 PNGs fotografados dariam realismo de baralho físico, mas o PRD descreve um **client de poker online** (índices clássicos, slots, flip), não um scan de Bicycle. Unicode de baralho falha no Windows e viola o §8.1. Canvas exigiria loop de desenho para algo que o DOM + CSS já fazem (transform, flip).

### Opções consideradas

| Opção | Prós (vs requisitos) | Contras (vs requisitos) |
|-------|----------------------|-------------------------|
| HTML/CSS + naipes SVG — escolhida | Nítido em qualquer DPI; `rotateY` no showdown; um componente para 52 faces; zero PNG | Não parece carta fotografada — aceitável pelo §8.1 (mesa online) |
| SVG completo por carta | Fidelidade vetorial | Markup pesado; manutenção de 52 desenhos |
| PNG/WebP 52+verso | Look de asset de cassino se bem desenhado | Repo inchado; retina; tema difícil |
| `<canvas>` | Controle total | Excesso; acessibilidade e CSS de mesa mais difíceis |

### Decisão

**Escolha do usuário:** Cartas HTML/CSS com naipes em SVG — componente único, flip em CSS (Recomendado).

Cada carta é um componente DOM (frente/verso). Rank em tipografia de baralho; naipes como SVG ou paths vetoriais vermelho/preto. O verso é um padrão único. **Não** usar caracteres Unicode de baralho (U+1F0A0…). Deal, flop e showdown usam transformações CSS (translação + flip), não troca de `src` de imagem. Burn cênico, se existir, é um verso teatral — não uma 12ª carta de dados (PRD RN-045).

### Consequências

**Positivas:**
- Um lugar para ajustar tamanho/contraste (acessibilidade).
- Animação alinhada ao ritmo do §5.1.
- Pages só serve HTML/CSS/JS/SVG leves.

**Negativas / trade-offs aceitos:**
- A qualidade visual depende do CSS (skill de UI), não de um baralho comprado pronto.
- Impressão “carta física” fica para um ADR futuro se o usuário quiser assets raster.

**Impacto em outras decisões:**
- A organização dos arquivos (próximo ADR) deve prever um módulo/componente de carta reutilizável nos três assentos e no board.

### Relacionados

- PRD: [docs/prd.md](../prd.md) §5.1, §8.1
- ADRs: [ADR-001](ADR-001-entrega-estatica-github-pages.md)
