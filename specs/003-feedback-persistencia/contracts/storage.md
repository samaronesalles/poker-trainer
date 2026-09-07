# Contract: Persistência da evolução (localStorage)

**Feature**: `003-feedback-persistencia`  
**Tipo**: contrato de armazenamento no cliente (sem HTTP)  
**Módulo**: `js/storage.js`  
**Consumidores**: **somente** `js/quiz.js` (único escritor). Testes `tests/contract/storage.test.js`. Mesa MUST NOT chamar `localStorage` direto.  
**Modelo**: [data-model.md](../data-model.md)  
**ADR**: [ADR-002](../../../docs/adr/ADR-002-persistencia-localstorage.md)

Não há API de rede. Não há IndexedDB. Não há `sessionStorage` como banco.

---

## 1. Superfície

Injeção: `criarStorage({ api } = { api: window.localStorage })`.

Em testes Node, `api` é um fake síncrono `{ getItem, setItem, removeItem }` ou um modo `indisponivel: true`.

| Função | Contrato |
|--------|----------|
| `ler()` | Devolve `EvolucaoTreino` normalizada. Nunca lança para a mesa. |
| `gravar(evolucao)` | `JSON.stringify` + `setItem`. Falha → `false`; sucesso → `true`. Nunca lança. |
| `aplicarDeltas(deltas)` | `ler` → somar inteiros nas células citadas → garantir 10+10+1 → `gravar`. LWW do blob. |
| `evolucaoZerada()` | Factory pura: 10+10 categorias em 0 + `vencedor_pote` em 0. Sem I/O. |

MUST NOT exportar `clear()` / `zerar()` para a UI. `removeItem` só entra em testes, não na mesa.

---

## 2. Chave e JSON

- Chave: exatamente `poker-trainer:evolucao`
- Origem: a do app (`http://localhost:…` ou Pages). Outra origem = outro armazenamento (não é bug).

Schema gravado (exemplo mínimo após um acerto de primeira em Flush como mão atual):

```json
{
  "mao_atual": {
    "royal_flush": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "straight_flush": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "quadra": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "full_house": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "flush": { "acertos": 1, "erros": 0, "exposicoes": 1 },
    "straight": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "trinca": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "dois_pares": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "par": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "carta_alta": { "acertos": 0, "erros": 0, "exposicoes": 0 }
  },
  "upgrade": {
    "royal_flush": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "straight_flush": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "quadra": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "full_house": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "flush": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "straight": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "trinca": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "dois_pares": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "par": { "acertos": 0, "erros": 0, "exposicoes": 0 },
    "carta_alta": { "acertos": 0, "erros": 0, "exposicoes": 0 }
  },
  "vencedor_pote": { "acertos": 0, "erros": 0, "exposicoes": 0 }
}
```

**MUST:** as 10 chaves em `mao_atual` e `upgrade` em **toda** gravação.  
**MUST:** `exposicoes === acertos + erros` em cada célula no MVP (o escritor corrige se o delta vier só com acerto ou erro: `exposicoes += 1` junto).  
**MUST NOT:** `versao`, timestamp, session, cartas, nomes, e-mail, trajetória.

---

## 3. Deltas

Forma lógica (não precisa ser o nome da API):

```text
{ bucket: 'mao_atual' | 'upgrade' | 'vencedor_pote',
  categoria?: CategoriaId,   // omitido se vencedor_pote
  acertos?: n, erros?: n }
```

Várias células de `upgrade` na mesma 1ª Confirmar = **um** `ler` + somas + **um** `gravar` (evita LWW parcial no meio da Confirmar).

Escrita **preguiçosa:** `ler()` de chave ausente **não** chama `setItem`.

---

## 4. Normalização na leitura

| Entrada | Saída |
|---------|--------|
| `null` / `''` / chave ausente | `evolucaoZerada()` em memória; não grava |
| `JSON.parse` lança | idem (corrupção dura) |
| Não-objeto, array, ou nenhum dos três buckets reconhecível como objeto | corrupção dura → zeros; não grava |
| Bloco legível, falta um bucket (`mao_atual` / `upgrade` / `vencedor_pote`) | esse bucket = zeros; **preserva** os demais |
| Bucket presente, falta `CategoriaId` | essa categoria = `{0,0,0}`; resto preservado |
| Chave extra no root ou dentro do bucket | ignora |
| `acertos`/`erros` não inteiro ≥ 0 | aquela célula 0 |
| `exposicoes` divergente no disco | ao **gravar de novo**, repor `acertos+erros`; na leitura, para testes de CA-022, usar acertos/erros como fonte e tratar exposicoes como derivada no MVP |

“Estrutura incompatível” (corrupção dura) = o valor não é um objeto de evolução: parse falha, não-objeto, ou nenhum bucket `mao_atual` / `upgrade` / `vencedor_pote` reconhecível. Um JSON `{ "foo": 1 }` é corrupção dura. Um JSON com pelo menos um bucket válido e outro ausente, ou com `upgrade.flush` faltando, é **incompleto**: completa com 0 e **não** zera o resto.

---

## 5. Fail-open (Constitution VII)

`getItem` / `setItem` / `JSON.stringify` / quota / SecurityError / api `null`:

- Funções devolvem zeros ou `false`.
- MUST NOT `alert`, MUST NOT throw para `mesa.js`.
- MUST NOT texto técnico no HUD (nem “localStorage”, “quota”, “cookie”).
- MUST NOT pedir CPF, e-mail, nome, apelido.
- Treino (quiz + feltro) continua. Evolução MAY perder-se ao fechar.

Duas abas: último `setItem` válido prevalece. MUST NOT mesclar incrementos. MUST NOT `storage` event de conflito na UI.

---

## 6. LGPD e escopo negativo

- Único dado persistido = contadores de treino.
- Reload aborta a **mão** (casco) e **não** apaga esta chave.
- Pool de cursor da 002 MUST NOT ser lido nem escrito aqui.
- Sem botão zerar na UI; sem tela de relatório lendo este JSON no MVP (o módulo MAY ser lido só por testes / DevTools).
- Sem envio a servidor (`fetch`/`sendBeacon` ausentes neste módulo).

---

## 7. Casos de contrato (automatizáveis)

1. `evolucaoZerada()` tem 10+10+1, todos 0, `exposicoes === acertos + erros`.
2. Chave ausente: `ler()` = zeros; 0 chamadas a `setItem`.
3. Delta acerto Flush `mao_atual`: blob gravado contém as 10 chaves; `flush.acertos === 1`; `par` permanece 0 (não ausente).
4. Segundo delta erro na mesma célula: acertos 1, erros 1, exposicoes 2 — **não** é o caso CA-022 (CA-022 é 1ª tentativa única). Este caso só prova soma; o quiz garante uma 1ª por pergunta.
5. JSON `{` ilegível → zeros; mesa não quebra.
6. JSON com `mao_atual` válido e **sem** chave `upgrade` → `upgrade` completo em 0; `mao_atual` **preservado** (incompleto ≠ corrupção dura). `upgrade: {}` → idem (10 categorias 0).
7. JSON `{ "foo": 1 }` (nenhum bucket reconhecível) → corrupção dura → zeros.
8. Chave extra `"debug": true` → ignora; contadores preservados.
9. `setItem` lança: `gravar` → `false`; `ler` seguinte ainda pode ser zeros se nada foi persistido; **não** throw.
10. Módulo MUST NOT referenciar `document`, `alert`, `indexedDB`, `sessionStorage`.
11. Fake de duas escritas: a segunda substitui a primeira por completo (LWW).
