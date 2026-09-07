# Data Model: Feedback de resposta e persistência da evolução

**Feature**: `003-feedback-persistencia`  
**Escopo**: contrato de pergunta no HUD, primeira tentativa e evolução no `localStorage`. Sem motor de melhor-5. Sem relatório visual. Sem PII.

Estende o modelo da [001-mesa-imersiva](../001-mesa-imersiva/data-model.md) e **não** altera o baralho da [002-embaralhamento-deal](../002-embaralhamento-deal/data-model.md). O estado da mão em curso continua **só em memória**; o que passa a sobreviver ao fechar a aba é **somente** `EvolucaoTreino`.

Tipos abaixo são o contrato lógico; identificadores de código MAY estar em inglês. Rótulos visíveis MUST ser pt-BR canônicos.

---

## Enums

### HudEstado

`ociosa` | `deal` | `perguntando` | `sem_upgrade` | `resultado`

Inalterado. Não existe sexto estado. Multi-select ocorre **dentro** de `perguntando` (passo `flop_upgrade`). Skip de upgrade permanece `sem_upgrade`.

### Street

Inalterado: `nenhuma` | `preflop` | `flop` | `turn` | `river`. Quiz preflop continua proibido.

### PassoQuiz

Substitui `PassoQuizStub` da 001.

| Passo | Street | HudEstado | ModoPergunta | Enunciado / copy |
|-------|--------|-----------|--------------|------------------|
| `flop_hero` | flop | `perguntando` | `unica` | Qual mão você tem agora? |
| `flop_upgrade` | flop | `perguntando` | `multipla` | Quais mãos você ainda não tem, mas ainda pode formar? |
| `turn_hero` | turn | `perguntando` | `unica` | Qual mão você tem agora? |
| `turn_skip` | turn | `sem_upgrade` | — | Não há upgrade possível. |
| `river_hero` | river | `perguntando` | `unica` | Qual mão você tem agora? |
| `river_a` | river | `perguntando` | `unica` | Qual mão o Adversário A completou? |
| `river_b` | river | `perguntando` | `unica` | Qual mão o Adversário B completou? |
| `river_vencedor` | river | `perguntando` | `unica` | Quem ganhou o pote? |

`flop_skip` **não** existe mais nesta feature. `resultado` não é passo de pergunta.

### ModoPergunta

`unica` | `multipla`

### CategoriaId

Ids estáveis (JSON + código), 1:1 com RN-014:

| id | Rótulo visível |
|----|----------------|
| `royal_flush` | Royal flush |
| `straight_flush` | Straight flush |
| `quadra` | Quadra |
| `full_house` | Full house |
| `flush` | Flush |
| `straight` | Straight |
| `trinca` | Trinca |
| `dois_pares` | Dois pares |
| `par` | Par |
| `carta_alta` | Carta alta |

As **10** MUST existir em `mao_atual` e `upgrade` desde a primeira gravação (valor 0 até haver exposição). Categoria nunca vista = 0, **não** ausente.

### TipoOpcao

`categoria` | `vencedor`

### EstadoOpcaoVisual

`padrao` | `hover` | `foco` | `selecionada` | `acertada` | `eliminada`

- `selecionada`: só `multipla`, antes (ou entre) confirmações, ainda desmarcável.
- `acertada`: marca ✓ visível; em `unica` após o clique certo; em `multipla` após upgrade verdadeiro marcado ser avaliado (trava).
- `eliminada`: marca ✕ visível; não ativável; fora de Tab.

Substitui `errado_desabilitado` / `correto` da 001 pelos nomes acima (mesmo significado visual, marcas explícitas).

### FaseTentativa

`aguardando_primeira` | `primeira_registrada` | `aguardando_beat`

A 1ª tentativa (clique que submete **ou** 1ª **Confirmar**) transita `aguardando_primeira` → `primeira_registrada` **e** grava evolução **antes** de qualquer avanço de passo. Acerto transita a `aguardando_beat` até `FIM_BEAT_ACERTO`.

### BucketEvolucao

`mao_atual` | `upgrade` | `vencedor_pote`

---

## Entities

### PerguntaDaMesa

Uma exposição no HUD `perguntando`.

| Campo | Tipo | Regras |
|-------|------|--------|
| `passo` | PassoQuiz | Obrigatório; um por vez (RN-G001) |
| `modo` | ModoPergunta | `unica` ou `multipla` |
| `enunciado` | string | Copy canônica da tabela PassoQuiz |
| `opcoes` | Opcao[] | 1–6 visíveis; nesta feature stub: exatamente 6 |
| `ordemVisual` | Opcao[] | Permutação de `opcoes` no **apresentar**; congelada após erro |
| `corretaUnica` | CategoriaId \| VencedorId \| null | Preenchido se `unica`; stub: ver contrato |
| `conjuntoCorreto` | CategoriaId[] | Preenchido se `multipla`; stub: `['flush']` |
| `faseTentativa` | FaseTentativa | Ver enum |
| `bucket` | BucketEvolucao | `flop_hero`/`turn_hero`/`river_*` categoria → `mao_atual`; `flop_upgrade` → `upgrade`; `river_vencedor` → `vencedor_pote` |

**Validação:**

- `unica` ⇒ CTA **Confirmar** ausente.
- `multipla` ⇒ CTA **Confirmar** presente enquanto `faseTentativa ≠ aguardando_beat`.
- MUST NOT pular pergunta; MUST NOT revelar a certa antes do acerto.
- Embaralhar opções MUST NOT permutar o baralho da mão.

### Opcao

| Campo | Tipo | Regras |
|-------|------|--------|
| `id` | CategoriaId \| VencedorId | Estável; testes afirmam por id/rótulo, nunca por índice na grade |
| `rotulo` | string | RN-014 ou RN-030; sem kicker, sem sinônimo |
| `tipo` | TipoOpcao | |
| `verdadeira` | boolean | Faz parte do conjunto/opção correta **deste** contrato (stub ou motor futuro) |
| `estadoVisual` | EstadoOpcaoVisual | |
| `ativavel` | boolean | `false` se eliminada ou travada-acertada; Tab só se `true` |
| `marca` | `nenhuma` \| `acerto` \| `corte` | `acerto` = ✓ só depois de escolhida/travada; `corte` = ✕ |

**Invariantes:** Distinção acerto/erro MUST incluir `marca` + texto do HUD, não só cor. Eliminada permanece no **mesmo** índice visual da pergunta.

### PrimeiraTentativa

Evento único por `PerguntaDaMesa`.

| Campo | Tipo | Regras |
|-------|------|--------|
| `passo` | PassoQuiz | |
| `instantaneo` | — | Gravado **imediatamente** no `localStorage` (ou memória se fail-open); MUST NOT esperar `resultado` nem unload |
| `efeito` | ver regras de bucket | Tentativas seguintes MUST NOT alterar contadores |

**Regras de efeito:**

- `unica` + categoria: +1 acerto **ou** +1 erro na `CategoriaId` **correta** da pergunta (`mao_atual`). Chute distrator **não** incrementa a distratora.
- `unica` + vencedor: +1 acerto **ou** +1 erro em `vencedor_pote` (grupo único).
- `multipla` (1ª Confirmar), para **cada opção exibida**:
  - verdadeira marcada → +1 acerto em `upgrade[id]`
  - verdadeira não marcada → +1 erro em `upgrade[id]`
  - distratora marcada → +1 erro em `upgrade[id]` (falso positivo)
  - distratora não marcada → não incrementa
- Skip `turn_skip`: **não** gera `PrimeiraTentativa` de `upgrade`.

### ContadoresCategoria

| Campo | Tipo | Regras |
|-------|------|--------|
| `acertos` | int ≥ 0 | 1ª tentativa |
| `erros` | int ≥ 0 | 1ª tentativa |
| `exposicoes` | int ≥ 0 | MVP: MUST igual a `acertos + erros` |

### EvolucaoTreino

Memória no dispositivo, origem do app. Único dado persistido.

| Campo | Tipo | Regras |
|-------|------|--------|
| `mao_atual` | map CategoriaId → ContadoresCategoria | Sempre as 10 chaves |
| `upgrade` | map CategoriaId → ContadoresCategoria | Sempre as 10 chaves |
| `vencedor_pote` | ContadoresCategoria | Grupo único, presente desde a 1ª gravação |

**Proibido no JSON:** nome, e-mail, CPF, apelido, foto, cartas, enunciados, trajetória, `Date`, session id, `versao`, qualquer chave fora dos três buckets (extras na leitura = ignora).

**Retenção:** enquanto o usuário não limpar dados do site nessa origem. Reload da página **não** apaga. Trocar de origem = outras chaves (não é bug).

### FeedbackHud

| Campo | Tipo | Regras |
|-------|------|--------|
| `kind` | `acerto` \| `erro` \| null | |
| `texto` | string \| null | Acerto: exatamente `Você acertou`. Erro: exatamente `Não é essa. Tente de novo.` |
| `canal` | HUD da mesa | MUST NOT `alert` / `confirm` / `prompt` |

Durante `aguardando_beat`: `kind = acerto`, opções visíveis, sem tela de parabéns.

### CtaSessao (extensão)

Valores visíveis: `Nova mão` | `Próxima mão` | `Continuar` | **`Confirmar`**.

- `Confirmar`: só `multipla` em `perguntando`, fora do beat.
- `Continuar`: só `sem_upgrade` (`turn_skip`).
- MUST NOT **Continuar** no acerto de pergunta.
- MUST NOT botão zerar, mute, desistir, Embaralhar.

### Mesa / HUD / MaoTreino (deltas vs 001)

| Campo | Mudança |
|-------|---------|
| `HUD.cta` | Pode ser **Confirmar** |
| `HUD.opcoes` | Estados `selecionada` / `acertada` / `eliminada`; marcas |
| `MaoTreino.passo` | Enum `PassoQuiz` (inclui `flop_upgrade`; sem `flop_skip`) |
| `MaoTreino.faseTentativa` | Novo |
| `Mesa.evolucao` | Cache em memória de `EvolucaoTreino`; hidrata na 1ª leitura; escrita só via `storage.js` |

Pool de cursor da 002 **não** entra em `EvolucaoTreino`.

---

## Relacionamentos

```text
Mesa 1 ── 1 HUD
Mesa 1 ── 0..1 MaoTreino          (null em ociosa; aborta no reload)
MaoTreino 1 ── 1 PerguntaDaMesa   (a da vez; RN-G001)
PerguntaDaMesa 1 ── 1..6 Opcao
PerguntaDaMesa 0..1 ── PrimeiraTentativa
PrimeiraTentativa ── grava ── EvolucaoTreino     (imediato)
EvolucaoTreino ── localStorage chave única
MaoTreino ── Baralho 002 (só leitura; G008 não permuta)
```

---

## State transitions

### Pergunta (seleção única)

```text
apresentar (shuffle) → aguardando_primeira
  clique distratora → eliminada + erro HUD; permanece aguardando_primeira
                      (se ainda não houve 1ª: registra erro na correta + grava)
  clique já eliminada → ignora
  clique verdadeira → acertada + “Você acertou” → (se 1ª: registra acerto + grava)
                      → aguardando_beat → FIM_BEAT_ACERTO → próximo passo
```

Se a 1ª tentativa já foi **erro**, o clique certo **não** incrementa acerto.

### Pergunta (múltipla seleção)

```text
apresentar (shuffle) → aguardando_primeira
  ALTERNAR_OPCAO → selecionada/padrao; não avalia
  CONFIRMAR (1ª) → aplica RN-024 + grava; se conjunto exibido perfeito → beat
                   senão → erro HUD; distratoras marcadas eliminadas;
                   verdadeiras marcadas travadas (acertada);
                   verdadeiras omitidas e distratoras não marcadas seguem ativáveis
                   → primeira_registrada
  CONFIRMAR (2ª+) → só corrige UI (RN-025); MUST NOT gravar
  conjunto perfeito → “Você acertou” → aguardando_beat → deal turn
```

### Skip

```text
turn_hero acertado → beat → sem_upgrade (turn_skip)
Continuar → deal river
(nenhum contador upgrade)
```

### Persistência (fail-open)

```text
ler → normalizar | zero em memória
gravar 1ª tentativa → setItem(blob completo) | falha → só memória
reload → MaoTreino = null (ociosa); EvolucaoTreino relida da chave
limpar dados do site → chave some → zeros
```

---

## Validation rules (resumo testável)

1. Exposições MVP = acertos + erros por célula.
2. 10+10 categorias sempre presentes no blob gravado.
3. JSON sem PII, sem timestamp, sem replay.
4. 1ª tentativa única por pergunta; imediata.
5. Falso positivo: distratora marcada → erro em `upgrade[id]`; não marcada → 0.
6. Omissão: verdadeira não marcada na 1ª Confirmar → erro nessa categoria.
7. LWW entre abas; sem mescla.
8. Corrupção dura → zero; campo faltante → 0 sem zerar o resto.
9. `unica` sem botão Confirmar; `multipla` sem submit no toggle.
10. G008 ao apresentar; ordem estável no retry.
