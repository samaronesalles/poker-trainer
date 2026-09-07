# ADR-004: Embaralhamento com Web Crypto e pool de entropia do cliente

**Status:** Aceito  
**Data:** 2026-09-07  
**Decisor:** Usuário (escolha registrada na entrevista de arquitetura)  
**Recomendação do agente:** Web Crypto `getRandomValues` + pool de entropia (mouse, data/hora, tick) misturado no shuffle.

### Requisitos que fundamentam a decisão

| ID / Origem | Tipo | Como influenciou a análise |
|-------------|------|----------------------------|
| RN-010 | Funcional | Cursor, data/hora e tick; não só um PRNG ingênuo |
| RN-008, RN-011 | Funcional | 52 cartas, uma permutação por mão, streets já determinadas |
| CA-006, CA-007 | Funcional | Rodadas seguidas não sistematicamente iguais; 11 cartas distintas |
| §5.2 exceção | Funcional | Sem movimento de mouse, ainda assim embaralha com as outras fontes |
| §5.1 ritmo | UX | Deal não espera ritual de “gerar caos” |
| ADR-001 | Restrição | HTTPS no GitHub Pages habilita `crypto.getRandomValues` |

**Drivers arquiteturais identificados:** imprevisibilidade do deal; permutação sem viés; latência zero na mesa.

**Critérios de avaliação usados:** RN-010 literal; Fisher–Yates com inteiros uniformes; não bloqueia o HUD; funciona em Pages.

### Contexto

O treino só é honesto se o usuário não puder prever o board. O PRD pede fontes de entropia do ambiente (mouse, relógio, tick). Ao mesmo tempo, um ritual de “mexa o mouse 3 segundos” quebra o ritmo da mesa. Web Crypto, disponível no alvo de deploy (HTTPS), gera inteiros adequados para Fisher–Yates; o pool mistura as fontes pedidas para o requisito não ser teatro.

### Opções consideradas

| Opção | Prós (vs requisitos) | Contras (vs requisitos) |
|-------|----------------------|-------------------------|
| Web Crypto + pool — escolhida | Inteiros sem viés; RN-010 cumprido; fallback se `crypto` faltar | Implementação um pouco maior que `Math.random()` |
| Só PRNG semeado com mouse/hora | Atende as fontes do PRD | Qualidade depende do mix; mais fácil enviesar o Fisher–Yates |
| Só `Math.random()` | Mínimo de código | Falha RN-010; CA-006 mais frágil |
| Ritual de mouse obrigatório | Entropia “sentida” | Conflita com o ritmo do §5.1 e com a 1ª mão sem mouse |

### Decisão

**Escolha do usuário:** Web Crypto `getRandomValues` + pool de entropia (mouse, data/hora, tick) misturado no shuffle (Recomendado).

O cliente mantém um pool atualizado com movimento do cursor, `Date.now()` e relógio de alta resolução (`performance.now()` ou equivalente). A cada mão, gera-se uma permutação Fisher–Yates das 52 cartas usando bytes de `crypto.getRandomValues`, misturados (XOR ou equivalente) com o pool. Se Web Crypto não existir, o shuffle usa só o pool — a mesa não trava. O shuffle ocorre **uma vez** no início da mão (RN-011). A atribuição às posições segue **RN-044** (11 cartas de jogo). Burns visuais **não** tiram cartas extras (RN-045). A mesma fonte pode embaralhar a **ordem visual das opções** (RN-G008), sem reembaralhar o baralho da mão.

### Consequências

**Positivas:**
- RN-010 e CA-006 atendidos sem cerimônia na UI.
- Baralho honesto para o motor (ADR-003) consumir.

**Negativas / trade-offs aceitos:**
- Não é um HSM nem um dealer certificado; é o máximo razoável no browser, como o PRD pede.
- Em `file://` o `crypto` pode ser limitado — o alvo de verdade é o GitHub Pages.

**Impacto em outras decisões:**
- Nenhuma API de rede para “entropy as a service”.
- A UI pode mostrar um shuffle animado; a permutação real já está pronta antes do deal visível.

### Relacionados

- PRD: [docs/prd.md](../prd.md) §5.2
- ADRs: [ADR-001](ADR-001-entrega-estatica-github-pages.md), [ADR-003](ADR-003-motor-avaliacao-maos.md)
