# Contract: HUD e sessão de treino

**Feature**: `001-mesa-imersiva`  
**Tipo**: contrato de UI / máquina de estados (sem HTTP)  
**Consumidores**: `js/mesa.js`, `js/quiz-stub.js`, testes `tests/contract/`, [quickstart.md](../quickstart.md)  
**Modelo**: [data-model.md](../data-model.md)

Este é o contrato público da sessão no cliente. Não há API de rede.

---

## 1. Eventos de entrada (gestos)

| Evento | Origem | HUD deve estar | Efeito |
|--------|--------|----------------|--------|
| `INICIAR_MAO` | CTA **Nova mão** (click / Enter / Espaço) | `ociosa` | Unlock áudio (best-effort); incrementa `indiceMaoSessao`; entra `deal`; distribui hole cards stub |
| `PROXIMA_MAO` | CTA **Próxima mão** | `resultado` | Unlock áudio; recolhe cartas; incrementa índice; novo `deal` na mesma mesa; sem reload perceptível |
| `CONTINUAR` | CTA **Continuar** | `sem_upgrade` | Abre street seguinte em `deal` (turn após flop skip; river após turn skip) |
| `ESCOLHER_OPCAO` | Clique / Enter / Espaço numa opção habilitada | `perguntando` | Ver §3 |
| `FIM_ANIMACAO_STREET` | `animationend` ou corte por movimento reduzido / teto | `deal` | Avalia se o quiz da street pode habilitar |
| `FALHA_DEAL` | Deal não inicia | `deal` | Volta `ociosa` + **Nova mão** |
| `RELOAD` | Recarregar página | qualquer | Estado inicial: `ociosa` (não é evento JS persistido) |

Gestos **MUST NOT** existir: Desistir, Nova mão no meio da mão, Embaralhar, mute, zerar, Confirmar (multi-select).

Durante `deal`, CTAs de sessão e opções **MUST NOT** estar no DOM visível/acionável.

---

## 2. Copy canônica (pt-BR)

| Contexto | Texto exato |
|----------|-------------|
| Linha de propósito (`ociosa`) | Treine ler as mãos. Sem apostas. |
| CTA ociosa | Nova mão |
| CTA desfecho | Próxima mão |
| CTA skip upgrade | Continuar |
| Skip body | Não há upgrade possível. |
| Enunciado mão herói (flop, turn, 1ª do river) | Qual mão você tem agora? |
| Enunciado A | Qual mão o Adversário A completou? |
| Enunciado B | Qual mão o Adversário B completou? |
| Enunciado pote | Quem ganhou o pote? |
| Feedback acerto | Você acertou |
| Feedback erro | Não é essa. Tente de novo. |
| Apelidos | Você, Adversário A, Adversário B |

Termos de clube MAY permanecer em inglês no chrome mínimo (flop, turn, river, showdown) se precisarem de rótulo; **não** misturar sinônimos de categoria.

### Rótulos de categoria permitidos (RN-014)

Royal flush, Straight flush, Quadra, Full house, Flush, Straight, Trinca, Dois pares, Par, Carta alta.

### Rótulos de vencedor permitidos (RN-030)

Você; Adversário A; Adversário B; Você e Adversário A; Você e Adversário B; Adversário A e Adversário B; Os três empatam.

---

## 3. Stub de correção

Seleção única: o clique **submete**. Sem botão Confirmar.

| Resultado | HUD | Opção clicada | Avanço |
|-----------|-----|---------------|--------|
| `id` ≠ correta | `perguntando` (mesmo passo) | `errado_desabilitado`; demais habilitadas intactas | Não |
| `id` já desabilitado | ignora | inalterado | Não |
| `id` = correta | feedback acerto | `correto` | Sim, após beat curto |

MUST NOT: texto “a resposta era …”; pular pergunta; revelar a certa por posição fixa.

Avanço após acerto:

| Passo acertado | Próximo |
|----------------|---------|
| `flop_hero` | `sem_upgrade` (`flop_skip`) |
| `turn_hero` | `sem_upgrade` (`turn_skip`) |
| `river_hero` | `perguntando` `river_a` (nova grade embaralhada) |
| `river_a` | `perguntando` `river_b` |
| `river_b` | `perguntando` `river_vencedor` |
| `river_vencedor` | `resultado` |

---

## 4. Conjuntos stub (determinísticos para teste)

A **ordem visual** é embaralhada a cada abertura. Testes e quickstart afirmam pelo **rótulo**, nunca pelo índice na grade.

### Categorias (6 opções, uma correta)

Usar o mesmo conjunto nas perguntas de categoria desta feature:

1. Par *(correta — `id`: `par`)*  
2. Carta alta  
3. Dois pares  
4. Trinca  
5. Flush  
6. Straight  

(Conjunto válido RN-014; a correta **não** precisa bater com o feltro.)

### Vencedor — mão 1 da sessão (`indiceMaoSessao === 1`)

Opções (completar 6 via prioridade RN-031; correta = Você):

1. Você *(correta — `id`: `voce`)*  
2. Adversário A  
3. Adversário B  
4. Você e Adversário A  
5. Você e Adversário B  
6. Adversário A e Adversário B  

`resultado`: pote `para_vencedor` → assento Você. Categorias reiteradas: as três acertadas no river (todas “Par” neste stub).

### Vencedor — mão 2+ (`indiceMaoSessao >= 2`)

Mesmas 6 opções; correta = **Você e Adversário A** (`id`: `voce_a`).

`resultado`: pote `split` entre Você e Adversário A. Sem valores em bb.

---

## 5. Regras de habilitação do quiz

O HUD só sai de `deal` para `perguntando` ou `sem_upgrade` se:

1. As cartas da street atual pousaram **ou** movimento reduzido aplicou corte imediato.
2. No river, **além** do pouso no slot 5: hole cards de A e B já viraram (`viradaShowdownConcluida`).
3. Não é preflop / board vazio.

Teto de espera de animação: 2 s (primeira mão da sessão) ou ≈ 1 s (demais), salvo movimento reduzido (0 s).

---

## 6. Teclado

Tab cycle (quando visíveis): opções da esquerda para a direita, de cima para baixo, depois o CTA daquele estado.

- `Enter` e `Espaço` ativam o controle focado.
- Foco visível obrigatório (`:focus-visible`).
- MUST NOT prender o foco num controle desabilitado.

---

## 7. Proibições (contrato negativo)

- `alert()`, `confirm()`, `prompt()`.
- Formulário branco / cartões de prova escolar soltos.
- Empilhar perguntas do river.
- Quiz com board vazio.
- Kickers ou ranks no rótulo da opção.
- Envio de eventos a servidor; analytics de identificação.
- Escrita em `localStorage` nesta feature.

---

## 8. Casos de contrato (aceitação automatizável da FSM)

1. Estado inicial = `ociosa`, CTA Nova mão, 0 opções.
2. `INICIAR_MAO` → `deal`, 0 opções.
3. Board vazio + hole pousadas → permanece sem `perguntando`.
4. Flop pousado → `perguntando` flop_hero, 6 opções, uma correta `par`.
5. Escolha errada → ainda `perguntando`; opção morta; copy de erro.
6. Escolha `par` → `sem_upgrade` + Continuar.
7. Continuar → `deal` (turn).
8. Após turn_hero acertado → `sem_upgrade`; Continuar → `deal` river.
9. River pousado sem virada → ainda `deal`.
10. Virada concluída → `perguntando` river_hero (não as quatro juntas).
11. Sequência A → B → vencedor uma a uma.
12. Vencedor mão 1 `voce` → `resultado` + Próxima mão; pote não-split.
13. Segunda mão, vencedor `voce_a` → `resultado` split.
14. `FALHA_DEAL` → `ociosa`.
