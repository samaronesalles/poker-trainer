# ADR-002: Persistência da evolução no localStorage do navegador

**Status:** Aceito  
**Data:** 2026-09-07  
**Decisor:** Usuário (pré-decidido na entrevista de kickoff)  
**Recomendação do agente:** localStorage — único armazenamento que atende “banco no navegador”, CA-023 e RN-039 sem servidor.

### Requisitos que fundamentam a decisão

| ID / Origem | Tipo | Como influenciou a análise |
|-------------|------|----------------------------|
| Entrevista | Funcional | Usar o localStorage como “banco” da evolução |
| RN-037, RN-040 | Funcional | Contadores por categoria e tipo de pergunta, suficientes para relatório futuro |
| RN-019, RN-024, RN-026 | Funcional | Só a primeira tentativa altera contadores |
| RN-039 | Funcional | Sem nome, e-mail ou identificador pessoal |
| CA-022, CA-023 | Funcional | Erro-depois-acerto não vira acerto; reload preserva Flush |
| CA-024 | Funcional | Sem UI de relatório no MVP — só gravar |
| NFR persistência | Não-funcional | Sobrevive a reload na mesma origem |
| ADR-001 | Restrição | Não há servidor para gravar |

**Drivers arquiteturais identificados:** persistência local-only; modelo pequeno (contadores, não replay de mãos); degradação se o armazenamento falhar (treino continua).

**Critérios de avaliação usados:** sobrevive a reload; sem backend; cabe o modelo RN-037; falha não derruba a mesa; sem dados pessoais.

### Contexto

A seção 5.6 exige memória da facilidade por tipo de mão e proíbe relatório visual no MVP. Com ADR-001, a única origem confiável é o próprio navegador. O volume é irrisório (dezenas de inteiros), não um histórico de cada carta.

### Opções consideradas

| Opção | Prós (vs requisitos) | Contras (vs requisitos) |
|-------|----------------------|-------------------------|
| localStorage — escolhida | Atende o pedido; chave/valor JSON para RN-037; sincrônico e simples; mesma origem do GitHub Pages | Quota limitada (irrelevante aqui); não persiste entre origens/`file://` vs Pages |
| IndexedDB | Melhor para volumes grandes e índices | Excesso para contadores; mais código contra “arquitetura mais simples possível” |
| sessionStorage | Simples | Morre ao fechar a aba — falha CA-023 |
| Arquivo baixado / sem persistir | Zero API | Falha CA-023 e o pedido de evolução |

### Decisão

**Escolha do usuário:** localStorage do navegador como banco da evolução.

Os contadores de `mao_atual`, `upgrade` e `vencedor_pote` (acertos/erros/exposições na primeira tentativa) ficam em JSON no localStorage da origem do app. No MVP, **exposições = acertos + erros** daquele bucket (PRD RN-037). Falso positivo em upgrade (distratora marcada) incrementa **erro** daquela categoria; distratora não marcada não incrementa (RN-024). Não há chave de “zerar” na UI. Não há sync. Dados corrompidos são descartados e zerados sem quebrar a mesa.

### Consequências

**Positivas:**
- Implementação mínima para CA-023.
- Relatório futuro lê as mesmas chaves (RN-040).
- Alinhado a RN-039 (nada sai do dispositivo).

**Negativas / trade-offs aceitos:**
- Limpar dados do site apaga a evolução (documentado no context).
- Trocar de domínio GitHub Pages (usuário vs projeto) zera as chaves.

**Impacto em outras decisões:**
- Nenhuma biblioteca de estado de servidor.
- O módulo de quiz (PRD §5.6) é o único escritor desses contadores.

### Relacionados

- PRD: [docs/prd.md](../prd.md) §5.6
- context.md: Dados e privacidade
- ADRs: [ADR-001](ADR-001-entrega-estatica-github-pages.md)
