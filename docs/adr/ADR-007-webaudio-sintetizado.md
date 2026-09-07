# ADR-007: SFX via Web Audio sintetizado, fail-open

**Status:** Aceito  
**Data:** 2026-09-07  
**Decisor:** Usuário (escolha registrada na entrevista de arquitetura)  
**Recomendação do agente:** Web Audio sintetizado no cliente, unlock no primeiro clique, silêncio se bloquear.

### Requisitos que fundamentam a decisão

| ID / Origem | Tipo | Como influenciou a análise |
|-------------|------|----------------------------|
| PRD §5.1 | UX | Som suave de shuffle, deal, flop, showdown, acerto e erro; sem BGM |
| PRD §5.1 exceção | Funcional | Áudio bloqueado não impede o treino; sem modal agressivo |
| CA-001 | Funcional | A mesa completa existe visualmente mesmo muda |
| ADR-001, ADR-006 | Restrição | Estático; mais um ES module; sem lib obrigatória |

**Drivers arquiteturais identificados:** imersão opcional; fail-open; zero dependência de samples.

**Critérios de avaliação usados:** silêncio seguro; módulo ES; não atrasa o deal; licença/repo simples.

### Contexto

Autoplay em browser exige gesto. O CTA **Nova mão** é esse gesto. Samples MP3 deixam o som mais “de cassino”, mas trazem licença e arquivos. Howler adiciona lib contra ADR-006. Cortar som no MVP contradiz a escolha de mesa completa (§5.1). Osciladores/ruído filtrado no `AudioContext` cobrem “clique de carta” e “acerto/erro” com alguns milissegundos de som, no mix baixo.

### Opções consideradas

| Opção | Prós (vs requisitos) | Contras (vs requisitos) |
|-------|----------------------|-------------------------|
| Web Audio sintetizado — escolhida | Sem assets; sem copyright; fail-open; módulo único | Menos “real” que um WAV de carta |
| MP3/OGG em `/assets` | Timbre de cassino | Licença e produção de SFX agora |
| Howler + arquivos | DX de som | Lib extra + mesmos arquivos |
| Sem som no MVP | Menos código | Foge do §5.1 já fechado na entrevista |

### Decisão

**Escolha do usuário:** Web Audio sintetizado no cliente, unlock no primeiro clique, silêncio se bloquear (Recomendado).

Um módulo de áudio cria (ou retoma) um `AudioContext` no primeiro gesto (**Nova mão** / **Próxima mão**). Dispara one-shots curtos nos eventos da mesa (shuffle, deal, flop, showdown, acerto, erro). Se o contexto não existir, estiver suspenso ou lançar erro, o treino segue mudo — sem dialog nativo e sem quebrar o HUD. **Não há controle de mute/volume no MVP** (PRD §3.2); “desligar o som” = o browser bloquear ou o usuário silenciar o sistema.

### Consequências

**Positivas:**
- §5.1 atendido sem pipeline de assets.
- Substituição futura por samples não muda o quiz (só o miolo do módulo).

**Negativas / trade-offs aceitos:**
- Timbre sintético, não gravação de baralho.
- Primeira mão pode começar muda até o gesto (política do browser), depois o som entra.

**Impacto em outras decisões:**
- Nenhuma mudança em ADR-003 (motor) nem ADR-004 (shuffle): o som é efeito colateral da UI, não da aleatoriedade.

### Relacionados

- PRD: [docs/prd.md](../prd.md) §5.1, §8
- ADRs: [ADR-001](ADR-001-entrega-estatica-github-pages.md), [ADR-006](ADR-006-es-modules-sem-bundler.md)
