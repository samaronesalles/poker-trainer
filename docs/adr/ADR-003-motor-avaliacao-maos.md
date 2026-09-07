# ADR-003: Motor próprio de avaliação de mãos em JavaScript no cliente

**Status:** Aceito  
**Data:** 2026-09-07  
**Decisor:** Usuário (escolha registrada na entrevista de arquitetura)  
**Recomendação do agente:** Motor próprio em JS no cliente — avalia 5 cartas, kickers e empates, e enumera o baralho restante para “ainda possível”.

### Requisitos que fundamentam a decisão

| ID / Origem | Tipo | Como influenciou a análise |
|-------------|------|----------------------------|
| RN-013 | Funcional | Melhor 5 cartas entre as disponíveis na street |
| RN-014, RN-015 | Funcional | Taxonomia de 10 categorias; royal distinta de straight flush |
| RN-020, RN-023 | Funcional | Upgrade = categoria estritamente mais forte ainda atingível com cartas que o herói **não vê** |
| RN-028 | Funcional | Hold’em 2 hole + 5 comunitárias por jogador no showdown |
| RN-029, RN-G004 | Funcional | Vencedor com ranking completo, kickers e empate verdadeiro; kickers não aparecem no quiz |
| CA-010, CA-019, CA-020 | Funcional | Par, flush e pote dividido têm de sair corretos |
| ADR-001 | Restrição | Sem servidor; tudo estático |

**Drivers arquiteturais identificados:** correção do pote (kickers/empate); regra de produto dos upgrades (ponto de vista do herói); simplicidade operacional sem dependência externa.

**Critérios de avaliação usados:** ranking com kickers e empates; royal ≠ SF; consulta “categoria X ainda é possível?” no flop/turn; cabe em JS estático; risco/custo de integração vs regra customizada.

### Contexto

Bibliotecas de poker resolvem bem “qual a melhor mão de 7 cartas?”. O PRD exige isso **e** uma pergunta que elas não fazem: entre as categorias RN-014 mais fortes que a atual, quais ainda existem no baralho **desconhecido do herói** (52 − hole do herói − board), com 1 ou 2 cartas por vir. Esse enumerador é regra de produto. O espaço é pequeno (combinações de turn/river restantes cabem no browser). Um wrapper em cima de lib ainda teria de reimplementar RN-020/RN-023 e o mapeamento das 10 categorias em português.

### Opções consideradas

| Opção | Prós (vs requisitos) | Contras (vs requisitos) |
|-------|----------------------|-------------------------|
| Motor próprio vanilla — escolhida | Controla RN-014/015; implementa RN-020 nativamente; zero CDN; testável contra CA-020 | Risco de bug em kickers se os testes forem fracos — mitigar com casos de CA-* |
| Lib vendored + camada de upgrades | Kickers maduros no avaliador 7 cartas | Duas semânticas; RN-020 continua nosso; foge um pouco de “só HTML/JS nosso” |
| Lib via CDN | Igual à vendored, ainda mais fácil de puxar | Falha offline (NFR); dependência de terceiros no GitHub Pages |
| Lookup tables (Cactus Kev etc.) | Avaliação 5 cartas muito rápida | Excesso para 1 mão por vez; tabelas grandes; upgrades ainda são código nosso |

### Decisão

**Escolha do usuário:** Motor próprio em JS no cliente: avalia 5 cartas, kickers e empates, e enumera o baralho restante para “ainda possível” (Recomendado).

O cliente contém um módulo de domínio que:

1. Classifica a melhor mão de 5 cartas na taxonomia RN-014 (rótulos canônicos), com desempate por kickers segundo RN-029. Inclui **wheel** (A-2-3-4-5, Ás baixo), **proíbe wrap** (K-A-2-3-4), distingue royal de straight flush, e permite 0/1/2 hole cards no turn/river (jogar a mesa).
2. Compara três mãos de Hold’em (2+5) e declara vencedor único ou empate (dois ou três), inclusive quando o board joga para todos.
3. No flop/turn, enumera o **information set do herói** (52 − hole do herói − board; adversários continuam “desconhecidos”). Flop: combinações de 2 entre 47; turn: 46 rios. Uma categoria C é upgrade se existe runout cuja **melhor** mão é **exatamente C** e C é estritamente mais forte que a atual — não “contém um flush” quando o best é royal.

Nenhuma biblioteca de poker é dependência de runtime. O mapeamento das 11 cartas (RN-044) é responsabilidade do baralho (ADR-004), não deste motor.

### Consequências

**Positivas:**
- Uma única fonte da verdade para quiz, showdown e upgrades.
- Alinhado a ADR-001 (estático) e à arquitetura mínima.
- Categorias em português não dependem de enum de lib em inglês.

**Negativas / trade-offs aceitos:**
- A correção de RN-029 recai 100% em testes do próprio código (CA-020 é o contrato).
- Não se aproveita batalha de bugs já corrigidos em libs maduras.

**Impacto em outras decisões:**
- O shuffle (próximo ADR) só entrega cartas; este motor não gera o baralho.
- UI de cartas não precisa conhecer kickers — só exibe faces; o motor devolve categoria + vencedor.

### Relacionados

- PRD: [docs/prd.md](../prd.md) §5.3, §5.4, §5.5
- ADRs: [ADR-001](ADR-001-entrega-estatica-github-pages.md)
