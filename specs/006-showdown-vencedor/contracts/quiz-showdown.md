# Contract: Quiz consome o showdown (river autoritativo)

**Feature**: `006-showdown-vencedor`  
**Tipo**: contrato de UI / domínio no cliente (sem HTTP)  
**Módulo**: `js/quiz.js` (**alter**; contrato 003 permanece para retry/storage)  
**Consumidores**: `js/mesa.js`, testes `quiz.test.js` / `hud-session.test.js`  
**Motor**: [motor-showdown.md](./motor-showdown.md)  
**HUD / desfecho**: [hud-resultado.md](./hud-resultado.md)  
**Persistência**: inalterada — [003 storage](../../003-feedback-persistencia/contracts/storage.md)

Não há API de rede. Cadência flop/turn da 004/005 **não** muda.

---

## 1. O que muda vs. 003/005

| Passo | Antes (stub 003) | 006 |
|-------|------------------|-----|
| `river_hero` | 6 faces fixas; certa = Flush | Motor: Melhor5 das 7 do herói + RN-017 com board de 5 |
| `river_a` | certa = Par | Melhor5 das 7 de A + RN-017 board de 5 |
| `river_b` | certa = Par | Melhor5 das 7 de B + RN-017 board de 5 |
| `river_vencedor` | 6 textos; certa = `voce` ou `voce_a` conforme `indiceMaoSessao` | `quemGanhou` + RN-031 (universo de **7**, exibe **6**) |
| 5.4 no river | já ausente | MUST permanecer ausente |

Copy canônica, clique-submete, morta, G008, beat, 1ª tentativa imediata: **iguais** à 003.

MUST remover como fonte de verdade: `CATEGORIAS_STUB`, `CATEGORIA_CORRETA_*`, `CATEGORIA_ADVERSARIO_*`, `VENCEDORES_STUB`, `idVencedorCorreto`, `rotuloVencedorCorreto`.

---

## 2. `prepararShowdown(sessao)`

Chamado pela mesa **quando o river pousa** (11 cartas conhecidas; MAY durante a virada). MUST NOT ser chamado por `mesa.js` via import de `motor.js`.

A partir de `sessao.mao.cartasJogo` (RN-044):

| Campo | Índices |
|-------|---------|
| `holeA` | `[0],[1]` |
| `holeB` | `[2],[3]` |
| `holeVoce` | `[4],[5]` |
| `comunitarias` | `[6],[7],[8],[9],[10]` |

Fluxo:

1. `r = quemGanhou({ holeVoce, holeA, holeB, comunitarias })`.
2. Se `!r.ok`: `sessao.mao.showdown = { ok: false, maos: null, vencedorId: null, vencedores: [], conjuntoPote: null }`.
3. Se `r.ok`: guardar `maos`, `vencedorId`, `vencedores` e `conjuntoPote = conjuntoOpcoesVencedor(r.vencedorId)`.
4. MUST NOT copiar `chaveDesempate` para `sessao.hud`, `aria-*`, feedback ou storage.
5. MUST NOT abrir pergunta daqui — só preencher memória.

MUST NOT incluir burns. MUST NOT chamar `enumerarUpgrades` no river.

---

## 3. `apresentarPergunta` nos quatro passos

Ordem obrigatória (a mesa só chama o próximo após acerto + beat): `river_hero` → `river_a` → `river_b` → `river_vencedor`.

### 3.1 Categorias (`river_hero` / `river_a` / `river_b`)

1. Extrair as 7 cartas daquele jogador + board de 5.
2. Preferir `sessao.mao.showdown.maos.*` já preparado; se ausente (defesa), `avaliarMelhor5` das 7.
3. `ids = conjuntoOpcoesMaoAtual({ categoriaId, board: comunitarias })`.
4. Mapear ids → opções `{ id, rotulo }` via `CATEGORIAS`. Tipo `categoria`.
5. `shuffleOpcoes`. MUST NOT chamar `baralho.js`.
6. `sessao.mao.corretaUnica = categoriaId` daquele jogador.
7. Sem CTA **Confirmar**. Enunciados exatos:
   - herói: **Qual mão você tem agora?**
   - A: **Qual mão o Adversário A completou?**
   - B: **Qual mão o Adversário B completou?**

MUST NOT chamar `prepararUpgradesStreet` no river. MUST NOT grudar o rótulo acertado no HUD/assento ao avançar.

### 3.2 Pote (`river_vencedor`)

1. `corretaUnica = showdown.vencedorId`.
2. Opções = `conjuntoPote` mapeado por `UNIVERSO_POTE` (rótulo RN-030). Tipo `vencedor`.
3. `shuffleOpcoes` uma vez. Retry MUST NOT reembaralhar.
4. Enunciado: **Quem ganhou o pote?**
5. 0 categorias RN-014 como opção. 0 kickers.

Se `showdown.ok !== true` neste ponto: a mesa MUST ter abortado **antes**; o quiz MUST NOT inventar opções.

---

## 4. Primeira tentativa

Contrato 003.

| Passo | Delta |
|-------|-------|
| `river_hero` | `mao_atual` / categoria **do herói** |
| `river_a` | `mao_atual` / categoria **de A** (não a chutada) |
| `river_b` | `mao_atual` / categoria **de B** |
| `river_vencedor` | `vencedor_pote` (um grupo: acertos/erros/exposições). MUST NOT ter `categoria`. MUST NOT tocar `mao_atual` nem `upgrade`. |

Três exposições de categoria são independentes (RN-038). Retry posterior não altera contadores. Fail-open de storage: o quiz segue (003).

---

## 5. O que o HUD / quiz MUST NOT fazer nesta feature

- Empilhar as quatro perguntas (RN-G001).
- Abrir 5.4 / skip / **Continuar** de upgrade no river.
- Segunda “mão atual” do herói no river (CA-027).
- Usar `indiceMaoSessao` para decidir o pote.
- Mostrar kicker, “par de reis”, “Sequência”, naipe por extenso.
- Botão Confirmar nas quatro perguntas.
- Pular / revelar a certa.
- `alert()`.
- Importar lib de poker.
- `mesa.js` chamar `localStorage` ou `motor.js`.
- Persistir Melhor5 / chave / dump.

---

## 6. Casos de contrato (automatizáveis)

1. Fixture herói Par / A Flush / B qualquer: `river_a` tem certa **Flush**, 6 opções, retry (CA-019). `river_hero` **não** é Flush-cego.
2. Empate verdadeiro herói vs A: `river_vencedor` certa = **Você e Adversário A**; conjunto length 6; inclui a certa; exclui `tres` (CA-020 + RN-031).
3. Royal no board: três certas **Royal flush**; pote **Os três empatam**; conjunto inclui `tres` e exclui `a_b`.
4. Acerto de `river_hero` → passo `river_a`; 0 upgrade; 0 repetição da mão do herói (SC-013).
5. `river_vencedor` invisível enquanto qualquer categoria do river não foi acertada (SC-014).
6. 1ª tentativa de A (erro Flush) incrementa `mao_atual.flush.erros`, não `par` (SC-011).
7. 1ª tentativa do pote incrementa só `vencedor_pote`; `mao_atual` inalterado nessa submissão.
8. G008: 10 apresentações novas da mesma certa de pote **não** colocam a certa sempre no mesmo índice visual.
9. Retry: ordem dos botões estável; morta no lugar; copy **Não é essa. Tente de novo.**
10. `prepararShowdown` com cartas inválidas → `showdown.ok === false`; apresentar os quatro passos MUST NOT ocorrer (a mesa aborta).
11. Foco: ao abrir cada pergunta, o primeiro controle visual habilitado recebe foco (FR-027).
