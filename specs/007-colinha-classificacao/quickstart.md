# Quickstart: validar a colinha de classificação (feature 007)

Guia de validação ponta a ponta da **lenda desktop** (overlay + exemplos fixos + visita + ausência no estreito + fail-open). Não altera o motor, o deal nem a persistência das features 001–006.

Contratos: [colinha-catalogo.md](./contracts/colinha-catalogo.md), [colinha-overlay.md](./contracts/colinha-overlay.md), [colinha-visita.md](./contracts/colinha-visita.md). Modelo: [data-model.md](./data-model.md).

---

## Pré-requisitos

- Navegador atual (Chrome, Edge ou Firefox).
- Node.js 18+ para os testes de contrato.
- Python 3 ou `npx serve` para HTTP local.
- **Não** abrir `index.html` via `file://`.

Arquivos esperados após `/speckit-implement` (ainda não precisam existir neste `/speckit-plan`):

- `css/colinha.css`
- `js/colinha.js`
- gancho em `index.html` (`<link>` do CSS) e `js/mesa.js` (`montarColinha` fail-open)
- `tests/contract/colinha.test.js`
- predicado `colinhaExisteNoViewport` em `js/layout.js`

---

## Subir o site

Na raiz do repositório:

```bash
python -m http.server 8080
```

Abrir `http://localhost:8080`. Viewport de referência: **1280×720** (DevTools, zoom 100%).

---

## Testes de contrato (sem bundler)

```bash
node --test tests/contract/colinha.test.js
```

Esperado: catálogo RN-014 (10 rótulos, 5 cartas, esmaecidas), máquina `visível`/`oculto`, predicado `width > 900`, auditoria de fonte (sem `localStorage`, sem `motor.js`). Os demais `tests/contract/` das 001–006 MUST continuar passando:

```bash
node --test tests/contract/
```

---

## Cenários manuais

Marcar cada item. Falha = feature incompleta.

### S1 — Abertura no desktop (CA-028, SC-001, SC-008)

1. Abrir o app em 1280×720 (primeira visita ou reload), HUD `ociosa`.
2. **Then** overlay no canto superior direito: título **Classificação de mãos**, **Melhor** no topo, **Pior** na base, 10 linhas 1→10 com rótulos exatos e cinco miniaturas cada.
3. Comunitárias (slots vazios), assentos e HUD permanecem descobertos; o feltro **não** foi empurrado.
4. Overlay pronto em < 3 s após a tela útil.
5. Foco inicial **não** está em **Ocultar**.

### S2 — Catálogo fixo (RN-048, RN-049, SC-009)

1. Conferir rótulos: Royal flush → Straight flush → Quadra → Full house → Flush → Straight → Trinca → Dois pares → Par → Carta alta.
2. Quadra: 5ª carta esmaecida. Trinca: 4ª e 5ª. Dois pares: 5ª. Par: 3ª–5ª. Carta alta: 2ª–5ª. As outras cinco linhas: nenhuma extra esmaecida.
3. Faces no idioma da mesa (índice + naipe SVG; sem emoji de baralho).
4. Acionar **Nova mão**, completar ou recarregar o deal: as 10 linhas e as faces **não** mudam.
5. Se alguma face coincidir com o feltro, a linha **permanece**.

### S3 — Ocultar / reabrir / reload (CA-029, CA-032, SC-002, SC-005)

1. **Ocultar** → painel some; só **Colinha** no mesmo canto, menor que **Nova mão**.
2. Escape e clique no feltro/HUD: painel **não** some (repetir com o painel visível).
3. **Colinha** → mesmas 10 linhas.
4. Ocultar de novo. DevTools → Application → Local Storage / Session Storage da origem: 0 chave de preferência da colinha; se existir evolução, só `poker-trainer:evolucao` com `mao_atual`, `upgrade`, `vencedor_pote`.
5. Recarregar: colinha **visível** de novo; evolução inalterada.

### S4 — Teclado (SC-007, FR-010)

1. Reload em `ociosa`. Tab: skip-link (001) e em seguida **Nova mão** — não **Ocultar**.
2. Tab até **Ocultar**. Enter → foco em **Colinha**. Espaço → painel abre, foco em **Ocultar**.
3. Tab a partir de **Ocultar** alcança de novo o ciclo da página (HUD); sem armadilha.
4. Linhas **não** recebem foco nem cursor de ponteiro.

### S5 — Quiz intacto (CA-030, SC-003, RN-G005)

1. Iniciar uma mão até `perguntando`.
2. Olhar a colinha: 0 linhas marcadas como “a certa”.
3. Clicar cada linha: enunciado, opções e (se inspecionar storage) contadores iguais.
4. Ocultar/reabrir: HUD e mão inalterados.

### S6 — Viewport estreito e resize (CA-031, SC-004)

1. Largura 900 px ou 390 px: 0 painel, 0 **Colinha**.
2. Largo → estreito: some tudo; mesa/HUD usáveis.
3. Estreito → largo na mesma visita: se tinha ocultado, só **Colinha**; senão o painel.
4. Abrir já no estreito e alargar: painel **visível**.

### S7 — Fail-open (SC-006)

1. Simular falha (breakpoint em `montarColinha` lançando, ou temporariamente quebrar o import): mesa abre, **Nova mão** funciona, sem `alert` / modal.
2. Restaurar e recarregar no desktop: colinha visível.

### S8 — Paisagem larga baixa / zoom (FR-005)

1. Janela ~1280×560 ou zoom > 100% com largura > 900.
2. Miniaturas encolhem **ou** a lista rola **dentro** do overlay.
3. Board, assentos e HUD descobertos; feltro no mesmo lugar.

---

## Fora deste guia

- Implementação (fica em `tasks.md` / `/speckit-implement`).
- Alterar specs 001–006.
- Persistência da preferência, colinha no celular, destaque da mão da mesa.
