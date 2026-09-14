# Contract: Persistência — buckets `outs` e `odds` (converge 003)

**Feature**: `008-desconto-outs`  
**Tipo**: contrato de armazenamento no cliente (sem HTTP)  
**Módulo**: `js/storage.js` (**alter**)  
**Consumidores**: **somente** `js/quiz.js` (único escritor). Testes `tests/contract/storage.test.js`. Mesa MUST NOT chamar `localStorage` direto.  
**Modelo**: [data-model.md](../data-model.md)  
**ADR**: [ADR-002](../../../docs/adr/ADR-002-persistencia-localstorage.md) (emendado CR-002)  
**Estende**: [storage.md da 003](../../003-feedback-persistencia/contracts/storage.md) — essa pasta **não** se reabre; o contrato vigente dos cinco buckets vive aqui.

Não há API de rede. Não há IndexedDB. Não há `sessionStorage` como banco. Não há chave nova.

---

## 1. Superfície

Inalterada: `criarStorage({ api, indisponivel } = {})` → `{ ler, gravar, aplicarDeltas }`. `evolucaoZerada()` é factory pura.

MUST NOT exportar `clear()` / `zerar()` para a UI.

---

## 2. Chave e JSON

- Chave: exatamente `poker-trainer:evolucao`
- Origem: a do app. Outra origem = outro armazenamento (não é bug).

Schema gravado **desde a primeira escrita após esta feature** (exemplo após acerto de primeira na quantidade e nos ranks, e acerto na odd; demais em 0):

```json
{
  "mao_atual": {
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
  "vencedor_pote": { "acertos": 0, "erros": 0, "exposicoes": 0 },
  "outs": { "acertos": 2, "erros": 0, "exposicoes": 2 },
  "odds": { "acertos": 1, "erros": 0, "exposicoes": 1 }
}
```

**MUST:** as 10 chaves em `mao_atual` e `upgrade` + os três grupos em **toda** gravação após esta feature.  
**MUST:** `exposicoes === acertos + erros` em cada célula.  
**MUST NOT:** `versao`, timestamp, session, cartas, vilão assumido, N, ranks, razão, nomes, e-mail, trajetória, information set.

---

## 3. Deltas

```text
{ bucket: 'mao_atual' | 'upgrade' | 'vencedor_pote' | 'outs' | 'odds',
  categoria?: CategoriaId,   // só mao_atual / upgrade
  acertos?: n, erros?: n }
```

`outs` e `odds` MUST NOT exigir `categoria`. Se `categoria` vier nesses buckets, ignorar o campo (somar na célula do grupo).

Várias células de `upgrade` na mesma 1ª Confirmar = **um** `ler` + somas + **um** `gravar`.

Quantidade e ranks são **duas** chamadas `aplicarDeltas` em momentos diferentes, ambas com `bucket: 'outs'`.

Escrita **preguiçosa:** `ler()` de chave ausente **não** chama `setItem`.

---

## 4. Normalização na leitura

| Entrada | Saída |
|---------|--------|
| `null` / `''` / chave ausente | `evolucaoZerada()` (cinco buckets) em memória; não grava |
| `JSON.parse` lança | corrupção dura → zeros dos cinco; não grava |
| Não-objeto, array, ou **nenhum** dos cinco buckets reconhecível como objeto | corrupção dura → zeros dos cinco |
| Bloco com os **três** buckets históricos e **sem** `outs`/`odds` | **legível** (incompleto): `outs` e `odds` = `{0,0,0}`; `mao_atual`/`upgrade`/`vencedor_pote` **preservados** |
| Bloco legível, falta um dos cinco | esse bucket = zeros; **preserva** os demais |
| Bucket presente, falta `CategoriaId` | essa categoria = `{0,0,0}`; resto preservado |
| Chave extra no root ou dentro do bucket | ignora |
| `acertos`/`erros` não inteiro ≥ 0 | aquela célula 0 |
| `exposicoes` divergente no disco | ao gravar de novo, repor `acertos+erros` |

“Estrutura incompatível” (corrupção dura) = o valor não é um objeto de evolução: parse falha, não-objeto, ou nenhum bucket `mao_atual` / `upgrade` / `vencedor_pote` / `outs` / `odds` reconhecível. Um JSON `{ "foo": 1 }` é corrupção dura. Um JSON só com os três buckets da 003 é **incompleto**, não corrupto.

Critério de “reconhecível”: objeto plano (não array). Célula de grupo (`vencedor_pote` / `outs` / `odds`) = objeto com possível `acertos`/`erros`. Bucket de categorias = objeto plano.

---

## 5. Fail-open (Constitution VII)

`getItem` / `setItem` / `JSON.stringify` / quota / SecurityError / api `null`:

- Funções devolvem zeros ou `false`.
- MUST NOT `alert`, MUST NOT throw para `mesa.js`.
- MUST NOT texto técnico no HUD.
- MUST NOT pedir CPF, e-mail, nome, apelido.
- Treino (quiz + feltro) continua. Evolução MAY perder-se ao fechar.

Duas abas: último `setItem` válido prevalece. MUST NOT mesclar incrementos.

---

## 6. LGPD e escopo negativo

- Único dado persistido = contadores de treino nos cinco buckets.
- Reload aborta a **mão** e **não** apaga esta chave.
- Vilão, baralho da próxima carta, lista de outs, ranks, N, razão, snapshot, dump de `quemGanhou`, pool de cursor, preferência da colinha MUST NOT ser lidos nem escritos aqui.
- Sem botão zerar; sem tela de relatório no MVP.
- Sem envio a servidor (`fetch`/`sendBeacon` ausentes neste módulo).
- Sem chave `poker-trainer:colinha` nem overlay (CA-032 atualizado: a única chave de produto continua esta, agora com cinco buckets).

---

## 7. Casos de contrato (automatizáveis)

1. `evolucaoZerada()` tem 10+10+1+1+1, todos 0, `exposicoes === acertos + erros`.
2. Chave ausente: `ler()` = zeros dos cinco; 0 `setItem`.
3. JSON da 003 (três buckets, Flush `mao_atual.acertos === 1`, sem `outs`/`odds`) → `mao_atual.flush` preservado; `outs` e `odds` = 0; **não** é corrupção dura.
4. Delta `{ bucket: 'outs', erros: 1 }` → `outs.erros === 1`, `outs.acertos === 0`, `outs.exposicoes === 1`; `odds` permanece 0.
5. Segundo delta `{ bucket: 'outs', acertos: 1 }` (exposição de ranks) → `outs.acertos === 1`, `erros === 1`, `exposicoes === 2`.
6. Delta `{ bucket: 'odds', acertos: 1 }` → só `odds` muda; `outs` inalterado.
7. Delta `outs` com `categoria: 'par'` → ignora categoria; soma no grupo.
8. JSON `{` ilegível → zeros dos cinco.
9. JSON `{ "foo": 1 }` → corrupção dura → zeros dos cinco.
10. JSON com `outs` válido e sem `mao_atual` → `mao_atual` completo em 0; `outs` preservado (incompleto ≠ corrupção).
11. Chave extra `"vilao": {"cartas":[]}` → ignora; MUST NOT ecoar `vilao` na próxima gravação.
12. `setItem` lança: `gravar` → `false`; **não** throw.
13. Módulo MUST NOT referenciar `document`, `alert`, `indexedDB`, `sessionStorage`.
14. Após `gravar`, o JSON parseado tem exatamente os cinco buckets de produto (mais chaves extras do caller que o normalizador **não** copia).
