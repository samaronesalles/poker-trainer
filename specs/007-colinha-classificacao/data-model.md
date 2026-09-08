# Data Model: Colinha de classificação de mãos

**Feature**: `007-colinha-classificacao`  
**Date**: 2026-09-07  
**Fonte**: [spec.md](./spec.md) Key Entities + FR-001..015  
**Contratos**: [colinha-catalogo.md](./contracts/colinha-catalogo.md), [colinha-overlay.md](./contracts/colinha-overlay.md), [colinha-visita.md](./contracts/colinha-visita.md)

Nenhuma entidade deste modelo é persistida. Nenhuma é PII. Nenhuma entra em `poker-trainer:evolucao`.

---

## 1. CartaExemplo

Face ilustrativa. **Não** pertence ao baralho da mão (`cartasJogo` / RN-044).

| Campo | Tipo | Regras |
|-------|------|--------|
| `rank` | `'A'\|'K'\|'Q'\|'J'\|'10'\|'9'\|…\|'2'` | Alfabeto do baralho francês do produto |
| `naipe` | `'espadas'\|'copas'\|'ouros'\|'paus'` | Mesmos ids de `js/baralho.js`, sem importá-lo |
| `esmaecida` | `boolean` | `true` se a carta **não** entra no conjunto principal da categoria (FR-003) |

Validação: 5 cartas por linha; ranks/naipes do alfabeto; MUST NOT Unicode de baralho.

Identidade visual no DOM: `data-rank` + `data-suit` (= `naipe`) via `criarElementoCarta`.

---

## 2. LinhaCategoria

Uma entrada da hierarquia RN-014.

| Campo | Tipo | Regras |
|-------|------|--------|
| `ordem` | `1..10` | 1 = mais forte; 10 = mais fraca |
| `id` | string estável | `royal_flush` … `carta_alta` (vocabulário de produto; **não** importado de `motor.js`) |
| `rotulo` | string | **Exato** RN-014 (tabela abaixo). MUST NOT sinônimo |
| `cartas` | `CartaExemplo[5]` | Comprimento exatamente 5; conjunto congelado |
| `indicesEsmaecidos` | `number[]` | Índices 0..4; vazio nas linhas sem extra |

### Tabela canônica (rótulo + esmaecer)

| ordem | id | rótulo | indicesEsmaecidos |
|------:|----|--------|-------------------|
| 1 | `royal_flush` | Royal flush | `[]` |
| 2 | `straight_flush` | Straight flush | `[]` |
| 3 | `quadra` | Quadra | `[4]` (kicker) |
| 4 | `full_house` | Full house | `[]` |
| 5 | `flush` | Flush | `[]` |
| 6 | `straight` | Straight | `[]` |
| 7 | `trinca` | Trinca | `[3, 4]` (dois kickers) |
| 8 | `dois_pares` | Dois pares | `[4]` (kicker) |
| 9 | `par` | Par | `[2, 3, 4]` (três kickers) |
| 10 | `carta_alta` | Carta alta | `[1, 2, 3, 4]` (não são a mais alta) |

Faces concretas: [colinha-catalogo.md](./contracts/colinha-catalogo.md) §2. Imutáveis entre mãos e visitas.

Relacionamentos: a linha **não** se relaciona à `Melhor5` da mesa nem ao `passo` do quiz.

---

## 3. Colinha (overlay)

Chrome de consulta. Não é pergunta, não é HUD, não é relatório, não é diálogo modal.

| Campo | Tipo | Regras |
|-------|------|--------|
| `titulo` | const | exatamente `Classificação de mãos` |
| `sentidoTopo` | const | exatamente `Melhor` |
| `sentidoBase` | const | exatamente `Pior` |
| `linhas` | `LinhaCategoria[10]` | ordem 1→10; comprimento exatamente 10 |
| `visibilidade` | `EstadoVisita.visibilidade` | ver §4 |
| `existente` | `boolean` | `true` ↔ largura do viewport > 900 px |

Estados de apresentação (derivados, não persistidos):

| `existente` | `visibilidade` | UI |
|-------------|---------------|-----|
| `false` | (ignorada) | 0 painel, 0 botão **Colinha** |
| `true` | `visivel` | painel + **Ocultar** |
| `true` | `oculto` | só botão **Colinha** |

---

## 4. EstadoVisita

Memória **desta** abertura da página. Some no reload. Não sincroniza abas.

| Campo | Tipo | Default | Transições |
|-------|------|---------|------------|
| `visibilidade` | `'visivel' \| 'oculto'` | `'visivel'` | `Ocultar` → `oculto`; `Colinha` → `visivel` |

Regras:

- Escape, clique no feltro/cartas/HUD: **não** transicionam.
- Reload / nova montagem: volta a `'visivel'`.
- Resize para ≤ 900 px: `existente = false` (UI some); `visibilidade` **permanece** (ao alargar, restaura).
- Abrir já no estreito e depois alargar: `visibilidade` ainda é o default `'visivel'`.
- MUST NOT gravar em armazenamento da origem.

---

## 5. ViewportMesa (recorte desta feature)

Reuso do recorte já existente da mesa (PRD §5.1 / RN-007). **Não** substitui `composicaoDoViewport`.

| Predicado | Condição | Colinha |
|-----------|----------|---------|
| largo | `width > 900` | existe |
| estreito | `width ≤ 900` | não existe |

`composicao === 'paisagem'` com `width > 900` é **largo** para a colinha.

Referência visual: 1280×720 CSS px a 100% — 10 linhas cabem sem rolagem e sem cobrir comunitárias.

---

## 6. O que este modelo MUST NOT conter

- CPF, e-mail, nome real, apelido digitado, telefone, foto, session id.
- Preferência `colinha_oculta` em `localStorage` / `sessionStorage` / cookie.
- `cartasJogo`, `Melhor5`, `chaveDesempate`, runouts, snapshot, dump de `quemGanhou`.
- Destaque `linhaCorreta` / `categoriaDaMesa`.
- Contadores (`mao_atual`, `upgrade`, `vencedor_pote`) incrementados pela colinha.

---

## 7. Relação com entidades 001–006

```text
EstadoVisita (memória 007) ──não toca──► Sessao / HUD / quiz
LINHAS_COLINHA (constante) ──não lê──► cartasJogo / motor
Overlay 007 ──não escreve──► poker-trainer:evolucao
criarElementoCarta ──reuso visual──► miniatura (papel exemplo)
composicaoDoViewport ──não decide──► existência (só width > 900)
```

A evolução (003) permanece o único JSON persistido. A colinha é lenda estática.

---

## 8. Validação cruzada (FR)

| FR | Entidade / campo |
|----|------------------|
| FR-001 | `LinhaCategoria.rotulo` + ordem 1→10 |
| FR-002 / FR-003 | `cartas[5]` + `indicesEsmaecidos` |
| FR-004 | `CartaExemplo` via componente ADR-005 |
| FR-005 / FR-009 | `Colinha.existente` |
| FR-006 | `titulo`, `sentidoTopo`, `sentidoBase` |
| FR-007 / FR-012 | `EstadoVisita` + controles |
| FR-008 / FR-010 | sem campo de destaque; linhas não são controle |
| FR-011 | montagem fail-open (não é campo) |
| FR-013 / FR-014 | §6 |
| FR-015 | overlay independente do estado do HUD |
