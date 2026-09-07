# ADR-001: Entrega como site estático no GitHub Pages, sem backend

**Status:** Aceito  
**Data:** 2026-09-07  
**Decisor:** Usuário (pré-decidido na entrevista de kickoff)  
**Recomendação do agente:** Site estático no GitHub Pages, sem servidor de aplicação — alinhado ao pedido de arquitetura mínima.

### Requisitos que fundamentam a decisão

| ID / Origem | Tipo | Como influenciou a análise |
|-------------|------|----------------------------|
| Context — limitações | Não-funcional | HTML, CSS e JS no navegador; sem backend |
| Entrevista — deploy frontend | Não-funcional | Escolha explícita: GitHub Pages |
| Entrevista — backend | Não-funcional | Sem backend; GitHub Pages + persistência no navegador |
| RN-G006 | Funcional | Sessão single-player local; sem adversário humano nem bot em servidor |
| RN-039 | Funcional | Não persistir identificadores pessoais nem enviar dados a servidor |
| NFR disponibilidade | Não-funcional | Funciona como site estático; treino offline após o primeiro carregamento é desejável |
| CA-001 | Funcional | Toda a sessão ocorre numa única tela no cliente (mesa ociosa → deal → streets, sem rota de quiz) |

**Drivers arquiteturais identificados:** simplicidade operacional (um usuário, time mínimo); zero superfície de servidor; privacidade por não transmitir desempenho; entrega pública e estável de arquivos estáticos.

**Critérios de avaliação usados:** atende “sem backend”; publica frontend estático; não exige conta de usuário; custo operacional ~zero; compatível com persistência só no dispositivo.

### Contexto

O MVP é um treinador single-player. Não há multiplayer, login, ranking online nem relatório em nuvem. Qualquer backend aumentaria operação sem servir RN-G006 nem o escopo. O frontend precisa de HTTPS e URL estável para o autor treinar em qualquer máquina — GitHub Pages cobre isso sem pipeline de servidor.

### Opções consideradas

| Opção | Prós (vs requisitos) | Contras (vs requisitos) |
|-------|----------------------|-------------------------|
| GitHub Pages, só estáticos — escolhida | Atende deploy escolhido; sem servidor (RN-039, RN-G006); HTTPS; custo zero | Sem sync entre dispositivos (já fora do MVP) |
| Abrir `file://` local apenas | Ainda mais simples para um único PC | Frágil para áudio/módulos ES em alguns navegadores; não atende a escolha de publicar no GitHub Pages |
| Vercel/Netlify com backend serverless | Fácil de crescer depois | Viola “sem backend” agora; custo e superfície desnecessários |
| VPS com Node | Controle total | Opera servidor sem requisito que o justifique |

### Decisão

**Escolha do usuário:** GitHub Pages (site estático público); sem backend — GitHub Pages + armazenamento no navegador.

O produto é um conjunto de arquivos estáticos servidos pelo GitHub Pages. Não há API, banco remoto nem autenticação. Toda regra de jogo e o HUD rodam no cliente.

### Consequências

**Positivas:**
- Arquitetura mínima, alinhada ao pedido original.
- Nada de dado de treino sai da máquina (RN-039).
- Deploy reduz-se a publicar a pasta do site.

**Negativas / trade-offs aceitos:**
- Evolução não sincroniza entre navegadores/dispositivos (pós-MVP consciente).
- Relatório futuro ou multi-dispositivo exigiria novo ADR de backend.
- Abrir o `index.html` via `file://` não é o modo suportado (ES modules / áudio). Desenvolvimento: servidor estático local em `http://`; produção: GitHub Pages.

**Impacto em outras decisões:**
- [ADR-002](ADR-002-persistencia-localstorage.md) — persistência só pode ser no cliente.
- [ADR-006](ADR-006-es-modules-sem-bundler.md) — sem bundler; HTTPS/http, não `file://`.

### Relacionados

- PRD: [docs/prd.md](../prd.md) §7, §8
- context.md: Limitações gerais; Fora do escopo (backend)
- ADRs dependentes: ADR-002, stack cliente
