# Roadmap Spec Kit — Poker Trainer

> Sequência de comandos para especificar, planejar e implementar as funcionalidades do MVP.
> Base: [PRD §5](./prd.md) | Governança: [constitution](../.specify/memory/constitution.md)
>
> **Como usar:** execute **um bloco por vez**, na ordem. Só avance para o próximo bloco após concluir `/speckit-implement` do anterior (ou decidir conscientemente pular uma etapa).

---

## P1 — Fundação (mesa e deal)

### 001 — Mesa imersiva e sessão de treino (PRD §5.1)

```
/speckit.specify Implementar a mesa imersiva de Texas Hold’em no navegador com estados de HUD ociosa/deal/perguntando/sem_upgrade/resultado, CTA Nova mão (ociosa) e Próxima mão (desfecho), feltro de clube, três assentos (Você, Adversário A, Adversário B), slots das cinco comunitárias, hole cards do herói abertas ao pousar e das dos adversários fechadas até o showdown, pote cênico sem apostas, HUD estilo barra de ação, desktop-first, sem quiz preflop, sem desistir da mão, som sintético fail-open — conforme PRD §5.1 (RN-001, RN-002, RN-003, RN-004, RN-005, RN-006, RN-007, RN-041, RN-042, RN-043, CA-001, CA-002, CA-003, CA-004, CA-005, CA-026)
/speckit-clarify
/speckit-plan
/speckit-tasks
/speckit-implement
```

---

### 002 — Embaralhamento e distribuição das cartas (PRD §5.2)

```
/speckit.specify Implementar o ciclo de uma mão: baralho de 52, shuffle a cada rodada com Web Crypto + pool (cursor, data/hora, tick), mapeamento fixo RN-044 das 11 cartas de jogo, deal visível (A, B, herói), flop/turn/river abrindo só na street, burns só cênicos sem consumir carta, adversários fechados até o river, sem reembaralhar entre streets — conforme PRD §5.2 (RN-008, RN-009, RN-010, RN-011, RN-012, RN-044, RN-045, CA-006, CA-007, CA-008, CA-009)
/speckit-clarify
/speckit-plan
/speckit-tasks
/speckit-implement
```

---

## P2 — Contrato de treino (feedback e memória)

### 003 — Feedback de resposta e persistência da evolução (PRD §5.6)

```
/speckit.specify Implementar o contrato de quiz da mesa: seleção única submete no clique, múltipla seleção exige Confirmar, feedback explícito no HUD sem alert e sem revelar a certa antes do acerto, opção errada visível e morta, ordem visual das opções embaralhada, persistência localStorage de mao_atual/upgrade/vencedor_pote com exposições = acertos + erros na 1ª tentativa, falso positivo de upgrade conta erro, degradação se o storage falhar, sem tela de relatório nem botão zerar — conforme PRD §5.6 (RN-034, RN-035, RN-036, RN-037, RN-039, RN-040, RN-047, RN-G008, CA-022, CA-023, CA-024, CA-025)
/speckit-clarify
/speckit-plan
/speckit-tasks
/speckit-implement
```

---

## P3 — Streets de identificação

### 004 — Identificação da mão atual (PRD §5.3)

```
/speckit.specify Implementar a pergunta “Qual mão você tem agora?” só no flop e no turn (o river do herói fica no 006) em seleção única com exatamente 6 rótulos canônicos RN-014, melhor 5 cartas (wheel permitido, wrap proibido, royal ≠ SF), distratoras pela heurística RN-017, retry até acertar, 1ª tentativa grava acerto ou erro na categoria correta em mao_atual — conforme PRD §5.3 (RN-013, RN-014, RN-015, RN-016, RN-017, RN-018, RN-019, RN-046, CA-010, CA-011, CA-012, CA-013)
/speckit-clarify
/speckit-plan
/speckit-tasks
/speckit-implement
```

---

### 005 — Identificação de mãos ainda possíveis (PRD §5.4)

```
/speckit.specify Implementar no flop e no turn, só após a 5.3 acertada, a múltipla seleção de upgrades: categoria C possível se existe runout no information set do herói (47 no flop, 46 no turn) cuja melhor mão é exatamente C e C é estritamente mais forte; 1–5 upgrades + distratoras até 6, ou os 6 mais fortes sem distratora; upgrades que não couberam não são cobrados; skip + Continuar se lista vazia; estatística RN-024 na primeira Confirmar — conforme PRD §5.4 (RN-020, RN-021, RN-022, RN-023, RN-024, RN-025, RN-026, RN-027, CA-014, CA-015, CA-016, CA-017)
/speckit-clarify
/speckit-plan
/speckit-tasks
/speckit-implement
```

---

### 006 — Showdown: mãos dos adversários e vencedor do pote (PRD §5.5)

```
/speckit.specify Implementar o river com virada das hole cards adversárias e exatamente quatro perguntas em sequência (mão do herói uma vez só, mão de A, mão de B, quem ganhou), reusando o contrato 5.3 nas três categorias, vencedor pelo ranking completo RN-029 incluindo split e board que joga para todos, opções de pote montadas pela prioridade RN-031 (sempre 6 quando o universo permitir), desfecho visual e Próxima mão — conforme PRD §5.5 (RN-028, RN-029, RN-030, RN-031, RN-032, RN-033, RN-038, CA-018, CA-019, CA-020, CA-021, CA-027)
/speckit-clarify
/speckit-plan
/speckit-tasks
/speckit-implement
```

---

## P4 — Auxílio visual (consulta)

### 007 — Colinha de classificação de mãos (PRD §5.7)

```
/speckit.specify Implementar a colinha de classificação das 10 categorias de Texas Hold’em no canto superior direito do desktop: overlay miniatura visível ao abrir, título Classificação de mãos, ordem RN-014 com rótulos exatos, cada linha com número + 5 cartas-exemplo fixas (extras esmaecidas, idioma visual da mesa, sem PNG de terceiros), ocultável na visita com botão Colinha no mesmo canto, sem localStorage/sessionStorage da preferência (reload restaura visível), estática em relação ao quiz (não destaca a mão da mesa, clique não responde), ausente em viewport ≤900 px, fail-open se o overlay falhar — conforme PRD §5.7 (RN-048, RN-049, RN-050, RN-051, RN-052, RN-053, RN-054, CA-028, CA-029, CA-030, CA-031, CA-032)
/speckit-clarify
/speckit-plan
/speckit-tasks
/speckit-implement
```

---

## Mapa: ordem de execução × seção PRD

| Ordem | Feature | Seção PRD | Diretório esperado |
|-------|---------|-----------|-------------------|
| 001 | Mesa imersiva e sessão de treino | §5.1 | `specs/001-mesa-imersiva/` |
| 002 | Embaralhamento e distribuição das cartas | §5.2 | `specs/002-embaralhamento-deal/` |
| 003 | Feedback de resposta e persistência da evolução | §5.6 | `specs/003-feedback-persistencia/` |
| 004 | Identificação da mão atual (flop e turn) | §5.3 | `specs/004-mao-atual/` |
| 005 | Identificação de mãos ainda possíveis | §5.4 | `specs/005-maos-ainda-possiveis/` |
| 006 | Showdown (inclui a única mão do herói no river) | §5.5 | `specs/006-showdown-vencedor/` |
| 007 | Colinha de classificação de mãos | §5.7 | `specs/007-colinha-classificacao/` |

> Os nomes dos diretórios em `specs/` são sugestivos — o Spec Kit gera o prefixo numérico e o slug automaticamente no `/speckit-specify`.

## Notas

- **Ordem vs. numeração PRD:** §5.6 (feedback e persistência) permanece **003**, antes de §5.3–§5.5, porque toda pergunta consome o contrato de retry, estados de opção, RN-G008 e contadores. §5.3 no roadmap **não** implementa o river do herói — isso é o 006, para não duplicar a pergunta (CA-027). §5.7 (colinha) entra como **007** no fim: depende só do casco da 5.1 e não bloqueia o quiz; as specs 001–006 já existem e **não** foram renumeradas (CR-001).
- **Regras globais:** RN-G001 a RN-G008 aplicam-se a todas as specs; cada `/speckit-plan` deve validá-las no Constitution Check.
- **ADRs a respeitar no plan:** [ADR-001](./adr/ADR-001-entrega-estatica-github-pages.md) Pages/sem backend; [ADR-002](./adr/ADR-002-persistencia-localstorage.md) localStorage; [ADR-003](./adr/ADR-003-motor-avaliacao-maos.md) motor próprio; [ADR-004](./adr/ADR-004-embaralhamento-webcrypto-pool.md) shuffle; [ADR-005](./adr/ADR-005-cartas-html-css-svg.md) cartas DOM; [ADR-006](./adr/ADR-006-es-modules-sem-bundler.md) módulos; [ADR-007](./adr/ADR-007-webaudio-sintetizado.md) Web Audio.
- **`/speckit-clarify`:** use quando a spec tiver `[NEEDS CLARIFICATION]`; se a spec já estiver completa, o comando pode encerrar rápido.
- **Documentos relacionados:** [context.md](./context.md) · [prd.md](./prd.md) · [adr/](./adr/) · [CR-001](./changes/CR-001.md)
