# Contract: Áudio sintetizado fail-open

**Feature**: `001-mesa-imersiva`  
**Tipo**: contrato de módulo cliente  
**Stack**: ADR-007 (Web Audio API, sem samples, sem lib)

---

## 1. API lógica do módulo `js/audio.js`

O orquestrador (`mesa.js`) chama estas operações. Nomes de função MAY variar; o comportamento MUST coincidir.

| Operação | Quando | Comportamento |
|----------|--------|----------------|
| `unlock()` | Primeiro `INICIAR_MAO` ou `PROXIMA_MAO` | Cria/resume `AudioContext`. Se lançar, recusar ou ficar `suspended` sem poder retomar: marca `mutedByPolicy = true` e **retorna sem throw** |
| `play(evento)` | Evento de mesa | Se contexto usável, dispara one-shot curto (mix baixo). Senão, no-op |
| Falha em `play` | Qualquer | Catch interno; mesa continua; sem `alert` / modal |

MUST NOT exportar UI de mute/volume. MUST NOT carregar MP3/OGG. MUST NOT bloquear o deal à espera do contexto.

---

## 2. Eventos de som (PRD §5.1)

| `evento` | Gatilho visual |
|----------|----------------|
| `shuffle` | Início do ritual de nova mão (recolhimento/embaralhar cênico, se houver; senão no start do deal) |
| `deal` | Hole cards em movimento / pouso (one-shots curtos, não trilha) |
| `flop` | Abertura das três comunitárias |
| `showdown` | Virada das hole cards de A e B |
| `acerto` | Feedback “Você acertou” |
| `erro` | Feedback “Não é essa. Tente de novo.” |

Sem trilha contínua / BGM. Sem som de “vitória de cassino” longo no `resultado` (MAY um beat curto se reutilizar `acerto`; MUST permanecer curto).

`prefers-reduced-motion` NÃO obriga silêncio: som MAY continuar.

Turn e river não têm evento próprio obrigatório além do deal/flop/showdown já listados; MAY reutilizar `deal` na carta única se ajudar o ritmo, sem criar dependência de asset.

---

## 3. Fail-open (constitution VII)

Condições que MUST deixar a mesa jogável e muda:

- Autoplay bloqueado até o gesto (primeira mão pode começar muda até `unlock`).
- `AudioContext` inexistente ou prefixado indisponível.
- `resume()` rejeitado.
- Exceção no oscilador/ruído.
- Aba em background com política restritiva.

MUST NOT: modal “ative o som”, toast bloqueante, jargão técnico no HUD, botão de mute para “resolver” a falha.

Silenciar de propósito = política do browser ou do SO.

---

## 4. Privacidade

O módulo MUST NOT gravar áudio do microfone, MUST NOT enviar buffer a rede, MUST NOT persistir preferência de som (não há preferência nesta feature).
