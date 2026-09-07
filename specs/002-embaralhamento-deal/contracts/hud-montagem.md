# Contract: HUD na montagem do baralho

**Feature**: `002-embaralhamento-deal`  
**Tipo**: contrato de UI / máquina de estados (delta da 001)  
**Base**: [hud-session.md](../../001-mesa-imersiva/contracts/hud-session.md)  
**Copy nova**: somente a linha de erro abaixo  
**MUST NOT**: sexto `HudEstado`; alterar CTAs, apelidos ou quiz stub

---

## 1. Eventos (deltas)

| Evento | HUD deve estar | Efeito |
|--------|----------------|--------|
| Gesto **Nova mão** | `ociosa` | Se `montagemEmCurso`, **ignora**. Senão, monta o baralho **sem** sair de `ociosa`. Sucesso → `INICIAR_MAO` com `cartasJogo` → `deal`. Falha → §3. |
| Gesto **Próxima mão** | `resultado` | Recolhe feltro até limpo; depois o mesmo fluxo de montagem. Sucesso → novo `deal`. Falha → `ociosa` + §3 (mão anterior já recolhida). |
| `INICIAR_MAO` | `ociosa` + payload válido | Entra `deal`; incrementa `indiceMaoSessao`; `linhaErro = null`. Sem payload válido, **não** entra em `deal`. |
| `FALHA_MONTAGEM` | `ociosa` | Permanece `ociosa`; `mao = null`; §3. Nunca transita por `deal`. |
| `FALHA_DEAL` (001) | `deal` | Exceção **após** deal iniciado (animação). Volta `ociosa` + **Nova mão**. **Não** usar para baralho incompleto. |

Cinco estados apenas: `ociosa` | `deal` | `perguntando` | `sem_upgrade` | `resultado`.

---

## 2. Copy canônica (pt-BR) — acréscimo

| Contexto | Texto exato |
|----------|-------------|
| Falha de montagem (`ociosa`) | Não foi possível embaralhar. Tente de novo. |

Substitui a linha de propósito (`Treine ler as mãos. Sem apostas.`) só até:

- próxima montagem **bem-sucedida**, ou
- reload (volta a linha de propósito).

CTA permanece **Nova mão**. MUST NOT `alert()`. MUST NOT jargão (`crypto`, `TypeError`, stack).

Demais copies da 001 (enunciados, acerto/erro, **Próxima mão**, **Continuar**) **não mudam**.

---

## 3. Falha de montagem

Condições: baralho incompleto, duplicata na montagem, mapeamento impossível.

**Não** é falha: cursor parado; `crypto.getRandomValues` ausente.

UI:

- `hud.estado === 'ociosa'`
- `hud.cta.nome === 'Nova mão'`
- `hud.opcoes.length === 0`
- `mao === null`
- linha visível = copy §2
- sentiu-se em menos de 3 s (SC-009)
- 0 passagem por `deal` nesta tentativa

---

## 4. Sucesso

- HUD entra em `deal` **somente** depois de `montarMao` → `ok`.
- Deal visível das holes começa em < 1 s ([deal-visivel.md](./deal-visivel.md)).
- Quiz stub e G008 (ordem das opções) **não** disparam novo Fisher–Yates das 52 (FR-021).

---

## 5. Privacidade no gesto

O gesto **Nova mão** / **Próxima mão** MUST NOT:

- pedir nome, e-mail, CPF, apelido digitado, foto;
- mostrar trajetória do cursor;
- gravar baralho ou pool fora da memória da visita.

---

## 6. Casos de contrato (automatizáveis na FSM)

1. `INICIAR_MAO` sem cartas válidas → permanece `ociosa` (ou `FALHA_MONTAGEM` explícita); `mao === null`.
2. `INICIAR_MAO` com 11 cartas RN-044 → `deal`; após `FIM_ANIMACAO_STREET` `holes`, board vazio, herói face, A verso.
3. Mapeamento: `assentos.adversarioA.hole` = índices 0–1 da lista de jogo; `voce` = 4–5.
4. `CONTINUAR` / streets **não** substituem `mao.cartasJogo`.
5. Segunda intenção de iniciar enquanto `montagemEmCurso` não incrementa `indiceMaoSessao` duas vezes.
6. Copy de erro exatamente igual a §2; CTA **Nova mão**.
