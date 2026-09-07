# Contract: Estado de visita, teclado e fail-open

**Feature**: `007-colinha-classificacao`  
**Tipo**: contrato de sessão no cliente (sem HTTP, sem persistência)  
**Módulo**: `js/colinha.js`  
**Orquestrador**: `js/mesa.js` (`bootMesa` + `resize` apenas)  
**Storage**: [storage.md](../../003-feedback-persistencia/contracts/storage.md) — **intocado**  
**Modelo**: [data-model.md](../data-model.md)

---

## 1. Superfície pura (testável sem DOM)

| Função | Contrato |
|--------|----------|
| `estadoInicial()` | `{ visibilidade: 'visivel' }` |
| `ocultar(estado)` | `{ visibilidade: 'oculto' }` (não muta o argumento se o estilo do módulo for imutável) |
| `reabrir(estado)` | `{ visibilidade: 'visivel' }` |
| `colinhaExisteNoViewport({ width })` | `width > 900` (em `js/layout.js`) |

MUST NOT haver `persistir(estado)` / `lerPreferencia()`.

---

## 2. Superfície DOM

| Função | Contrato |
|--------|----------|
| `montarColinha(host)` | Cria overlay + botão no `host` (`#clube`). Sucesso → `{ ok: true, el }`. Falha → `{ ok: false }`, remove restos, **não** lança. |
| `sincronizarViewport(width)` | `width ≤ 900` → some painel e botão (`hidden`/`inert`). `width > 900` → restaura UI conforme `visibilidade` atual. |
| clique/Enter/Espaço em `[data-colinha-acao="ocultar"]` | `ocultar` + foca **Colinha** |
| clique/Enter/Espaço em `[data-colinha-acao="reabrir"]` | `reabrir` + foca **Ocultar** |

`bootMesa` chama `montarColinha` em `try/catch` (cinto extra). Falha MUST NOT impedir `renderHud`.

MUST NOT registrar listener global de `Escape` para ocultar. MUST NOT ocultar em clique no feltro, cartas ou HUD.

---

## 3. Máquina de visita

```text
[montagem] ──► visivel
visivel --Ocultar--> oculto
oculto  --Colinha--> visivel
*       --reload--► visivel   (nova instância)
visivel|oculto --width≤900--> (UI ausente; estado preservado)
(UI ausente) --width>900--> UI conforme visibilidade preservada
```

Duas abas = duas instâncias. MUST NOT `BroadcastChannel` / `storage` event.

---

## 4. Teclado e foco

| Evento | Foco |
|--------|------|
| Load / reload | MUST NOT estar em **Ocultar** nem **Colinha** |
| Primeira Tab em `ociosa` (após skip-link da 001) | **Nova mão** — não **Ocultar** |
| Tab a partir do HUD | alcança **Ocultar** ou **Colinha** (depois dos CTAs/opções) |
| Ativar **Ocultar** | foco → **Colinha** |
| Ativar **Colinha** | foco → **Ocultar** |
| Tab a partir de **Ocultar** | sai da colinha (ciclo da página; sem trap) |

Controles: `type="button"`, `tabIndex` 0 quando visíveis, `-1` ou `hidden` quando o outro estado os esconde. Enter e Espaço ativam. Foco visível (`:focus-visible`).

Linhas da lista: fora do Tab.

Skip-link “Ir para a pergunta” da 001 permanece o primeiro controle do documento. A colinha MUST NOT ser inserida antes de `#hud`.

---

## 5. Isolamento do quiz (RN-G005 / RN-052)

`js/colinha.js` MUST NOT:

- importar `quiz.js` / `motor.js` / `storage.js`;
- chamar `aplicar(sessao, …)`;
- incrementar `mao_atual` / `upgrade` / `vencedor_pote`;
- ler `sessao.mao` para destacar linha.

Clique em `li[data-categoria]` é no-op para o treino.

Ocultar/reabrir MUST NOT mudar `data-hud-estado`, enunciado, opções ou `mao`.

---

## 6. Persistência e LGPD

| Origem | Permitido |
|--------|-----------|
| Memória da instância | sim (visibilidade) |
| `localStorage` / `sessionStorage` / cookie / IndexedDB | **não** (preferência) |
| `poker-trainer:evolucao` | somente o contrato 003; colinha MUST NOT ler/escrever |
| Payload a servidor / `fetch` / analytics | **não** |
| PII (CPF, e-mail, nome, apelido digitado, foto) | **não** |

CA-032: após ocultar no desktop, a inspeção da origem encontra 0 chaves de preferência da colinha.

---

## 7. Fail-open (FR-011)

| Falha | Comportamento |
|-------|----------------|
| Exceção ao criar DOM / importar carta | `{ ok: false }`; mesa segue; sem `alert` / modal |
| `document` ausente (teste Node) | funções puras continuam; fábrica DOM retorna `ok: false` ou `null` |
| Storage recusado/cheio | irrelevante — colinha não grava |
| Overlay falhou nesta visita; reload saudável | colinha visível de novo (default) |

Copy de erro da colinha MUST NOT aparecer no HUD.

---

## 8. Testes de contrato (Node)

1. `estadoInicial` / `ocultar` / `reabrir` conforme §1.
2. `colinhaExisteNoViewport` conforme overlay.
3. Fonte de `js/colinha.js` e o gancho em `js/mesa.js`: sem `localStorage`, sem `sessionStorage`, sem `./motor.js`, sem `./storage.js`.
4. Fonte de `js/colinha.js`: sem `Escape` que chame `ocultar` (regex / ausência de listener).
5. Foco, Tab, resize visual: [quickstart.md](../quickstart.md).
