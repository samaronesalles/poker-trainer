/** Contrato de pergunta, feedback e 1ª tentativa. Motor só em flop_hero / turn_hero. */

import { CATEGORIAS, avaliarMelhor5, conjuntoOpcoesMaoAtual } from './motor.js';

export const COPY = Object.freeze({
  linhaProposito: 'Treine ler as mãos. Sem apostas.',
  ctaNovaMao: 'Nova mão',
  ctaProximaMao: 'Próxima mão',
  ctaContinuar: 'Continuar',
  ctaConfirmar: 'Confirmar',
  semUpgrade: 'Não há upgrade possível.',
  enunciadoHero: 'Qual mão você tem agora?',
  enunciadoUpgrades: 'Quais mãos você ainda não tem, mas ainda pode formar?',
  enunciadoA: 'Qual mão o Adversário A completou?',
  enunciadoB: 'Qual mão o Adversário B completou?',
  enunciadoPote: 'Quem ganhou o pote?',
  acerto: 'Você acertou',
  erro: 'Não é essa. Tente de novo.',
});

export const APELIDOS = Object.freeze({
  voce: 'Você',
  adversarioA: 'Adversário A',
  adversarioB: 'Adversário B',
});

export const PASSOS = Object.freeze({
  flop_hero: 'flop_hero',
  flop_upgrade: 'flop_upgrade',
  turn_hero: 'turn_hero',
  turn_skip: 'turn_skip',
  river_hero: 'river_hero',
  river_a: 'river_a',
  river_b: 'river_b',
  river_vencedor: 'river_vencedor',
});

export const CATEGORIAS_STUB = Object.freeze([
  Object.freeze({ id: 'par', rotulo: 'Par' }),
  Object.freeze({ id: 'carta_alta', rotulo: 'Carta alta' }),
  Object.freeze({ id: 'dois_pares', rotulo: 'Dois pares' }),
  Object.freeze({ id: 'trinca', rotulo: 'Trinca' }),
  Object.freeze({ id: 'flush', rotulo: 'Flush' }),
  Object.freeze({ id: 'straight', rotulo: 'Straight' }),
]);

export const VENCEDORES_STUB = Object.freeze([
  Object.freeze({ id: 'voce', rotulo: 'Você' }),
  Object.freeze({ id: 'adversarioA', rotulo: 'Adversário A' }),
  Object.freeze({ id: 'adversarioB', rotulo: 'Adversário B' }),
  Object.freeze({ id: 'voce_a', rotulo: 'Você e Adversário A' }),
  Object.freeze({ id: 'voce_b', rotulo: 'Você e Adversário B' }),
  Object.freeze({ id: 'a_b', rotulo: 'Adversário A e Adversário B' }),
]);

export const CATEGORIA_CORRETA_ID = 'flush';
export const CATEGORIA_CORRETA_ROTULO = 'Flush';
export const CATEGORIA_ADVERSARIO_ID = 'par';
export const CATEGORIA_ADVERSARIO_ROTULO = 'Par';
export const CONJUNTO_UPGRADE_STUB = Object.freeze(['flush']);

export function idVencedorCorreto(indiceMaoSessao) {
  return indiceMaoSessao >= 2 ? 'voce_a' : 'voce';
}

export function rotuloVencedorCorreto(indiceMaoSessao) {
  return indiceMaoSessao >= 2 ? 'Você e Adversário A' : 'Você';
}

export function modoDoPasso(passo) {
  if (passo === PASSOS.flop_upgrade) return 'multipla';
  if (passo === PASSOS.turn_skip) return null;
  return 'unica';
}

export function shuffleOpcoes(opcoes, rng = Math.random) {
  const arr = opcoes.map((item) => ({ ...item }));
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function baseOpcao(item, tipo, verdadeira) {
  return {
    id: item.id,
    rotulo: item.rotulo,
    tipo,
    verdadeira,
    correta: verdadeira,
    estadoVisual: 'padrao',
    ativavel: true,
    desabilitada: false,
    marca: 'nenhuma',
    selecionada: false,
  };
}

const INDICES_VISIVEIS_HEROI = Object.freeze({
  [PASSOS.flop_hero]: Object.freeze([4, 5, 6, 7, 8]),
  [PASSOS.turn_hero]: Object.freeze([4, 5, 6, 7, 8, 9]),
});

const INDICES_BOARD_STREET = Object.freeze({
  [PASSOS.flop_hero]: Object.freeze([6, 7, 8]),
  [PASSOS.turn_hero]: Object.freeze([6, 7, 8, 9]),
});

function identidadeCarta(carta) {
  return { rank: carta.rank, naipe: carta.naipe };
}

export function extrairVisiveisHeroi(cartasJogo, passo) {
  const indices = INDICES_VISIVEIS_HEROI[passo];
  if (!indices || !Array.isArray(cartasJogo)) return [];
  return indices.map((indice) => identidadeCarta(cartasJogo[indice]));
}

export function extrairBoardStreet(cartasJogo, passo) {
  const indices = INDICES_BOARD_STREET[passo];
  if (!indices || !Array.isArray(cartasJogo)) return [];
  return indices.map((indice) => identidadeCarta(cartasJogo[indice]));
}

function rotuloCategoria(id) {
  return CATEGORIAS.find((item) => item.id === id)?.rotulo ?? id;
}

function criarOpcoesMaoAtual(cartasJogo, passo, rng) {
  const visiveis = extrairVisiveisHeroi(cartasJogo, passo);
  const board = extrairBoardStreet(cartasJogo, passo);
  const melhor = avaliarMelhor5(visiveis);
  const ids = conjuntoOpcoesMaoAtual({ categoriaId: melhor.categoriaId, board });
  return {
    melhor,
    opcoes: shuffleOpcoes(
      ids.map((id) => baseOpcao({ id, rotulo: rotuloCategoria(id) }, 'categoria', id === melhor.categoriaId)),
      rng,
    ),
  };
}

function idCategoriaCorreta(passo) {
  if (passo === PASSOS.river_a || passo === PASSOS.river_b) return CATEGORIA_ADVERSARIO_ID;
  return CATEGORIA_CORRETA_ID;
}

export function criarOpcoesCategoria(passo = PASSOS.flop_hero, rng = Math.random) {
  const corretaId = idCategoriaCorreta(passo);
  return shuffleOpcoes(
    CATEGORIAS_STUB.map((item) => baseOpcao(item, 'categoria', item.id === corretaId)),
    rng,
  );
}

export function criarOpcoesUpgrade(rng = Math.random) {
  const verdadeiras = new Set(CONJUNTO_UPGRADE_STUB);
  return shuffleOpcoes(
    CATEGORIAS_STUB.map((item) => baseOpcao(item, 'categoria', verdadeiras.has(item.id))),
    rng,
  );
}

export function criarOpcoesVencedor(indiceMaoSessao, rng = Math.random) {
  const corretaId = idVencedorCorreto(indiceMaoSessao);
  return shuffleOpcoes(
    VENCEDORES_STUB.map((item) => baseOpcao(item, 'vencedor', item.id === corretaId)),
    rng,
  );
}

export function enunciadoDoPasso(passo) {
  switch (passo) {
    case PASSOS.flop_hero:
    case PASSOS.turn_hero:
    case PASSOS.river_hero:
      return COPY.enunciadoHero;
    case PASSOS.flop_upgrade:
      return COPY.enunciadoUpgrades;
    case PASSOS.river_a:
      return COPY.enunciadoA;
    case PASSOS.river_b:
      return COPY.enunciadoB;
    case PASSOS.river_vencedor:
      return COPY.enunciadoPote;
    default:
      return null;
  }
}

function persistirPrimeira(sessao, deltas) {
  if (sessao.mao?.faseTentativa !== 'aguardando_primeira') return;
  const storage = sessao.storage;
  if (storage?.aplicarDeltas) {
    sessao.evolucao = storage.aplicarDeltas(deltas);
  }
  sessao.mao.faseTentativa = 'primeira_registrada';
}

function opcaoPorId(sessao, id) {
  return sessao.hud.opcoes.find((item) => item.id === id);
}

function marcadaNaGrade(opcao) {
  if (opcao.estadoVisual === 'acertada') return true;
  if (opcao.estadoVisual === 'eliminada') return false;
  return opcao.selecionada === true || opcao.estadoVisual === 'selecionada';
}

function conjuntoExibidoPerfeito(opcoes) {
  const todasVerdadeiras = opcoes
    .filter((item) => item.verdadeira)
    .every((item) => marcadaNaGrade(item));
  const nenhumaDistratora = opcoes
    .filter((item) => !item.verdadeira && item.ativavel)
    .every((item) => !marcadaNaGrade(item));
  return todasVerdadeiras && nenhumaDistratora;
}

function limparFeedback(sessao) {
  sessao.hud.feedback = null;
  sessao.hud.feedbackTexto = null;
}

function pintarErro(sessao) {
  sessao.hud.feedback = 'erro';
  sessao.hud.feedbackTexto = COPY.erro;
}

function pintarAcertoBeat(sessao) {
  sessao.hud.feedback = 'acerto';
  sessao.hud.feedbackTexto = COPY.acerto;
  sessao.hud.cta = null;
  sessao.mao.faseTentativa = 'aguardando_beat';
}

export function apresentarPergunta(sessao, passo, rng = Math.random) {
  sessao.mao.passo = passo;
  sessao.mao.faseTentativa = 'aguardando_primeira';
  sessao.mao.modo = modoDoPasso(passo);
  sessao.mao.cartasDaStreetPousadas = true;
  sessao.hud.estado = 'perguntando';
  sessao.hud.enunciado = enunciadoDoPasso(passo);
  sessao.hud.linhaProposito = null;
  sessao.hud.linhaErro = null;
  limparFeedback(sessao);

  if (passo === PASSOS.river_vencedor) {
    sessao.mao.corretaUnica = idVencedorCorreto(sessao.indiceMaoSessao);
    sessao.mao.conjuntoCorreto = [];
    sessao.hud.opcoes = criarOpcoesVencedor(sessao.indiceMaoSessao, rng);
    sessao.hud.cta = null;
    return;
  }

  if (passo === PASSOS.flop_upgrade) {
    sessao.mao.corretaUnica = null;
    sessao.mao.conjuntoCorreto = [...CONJUNTO_UPGRADE_STUB];
    sessao.hud.opcoes = criarOpcoesUpgrade(rng);
    sessao.hud.cta = { nome: COPY.ctaConfirmar };
    return;
  }

  if (passo === PASSOS.flop_hero || passo === PASSOS.turn_hero) {
    const montagem = criarOpcoesMaoAtual(sessao.mao.cartasJogo, passo, rng);
    sessao.mao.corretaUnica = montagem.melhor.categoriaId;
    sessao.mao.conjuntoCorreto = [];
    sessao.hud.opcoes = montagem.opcoes;
    sessao.hud.cta = null;
    return;
  }

  sessao.mao.corretaUnica = idCategoriaCorreta(passo);
  sessao.mao.conjuntoCorreto = [];
  sessao.hud.opcoes = criarOpcoesCategoria(passo, rng);
  sessao.hud.cta = null;
}

function deltasUnica(sessao, acerto) {
  const passo = sessao.mao.passo;
  if (passo === PASSOS.river_vencedor) {
    return [
      {
        bucket: 'vencedor_pote',
        acertos: acerto ? 1 : 0,
        erros: acerto ? 0 : 1,
      },
    ];
  }
  return [
    {
      bucket: 'mao_atual',
      categoria: sessao.mao.corretaUnica,
      acertos: acerto ? 1 : 0,
      erros: acerto ? 0 : 1,
    },
  ];
}

export function avaliarUnica(sessao, id) {
  if (sessao.hud.estado !== 'perguntando' || !sessao.mao) return;
  if (sessao.mao.faseTentativa === 'aguardando_beat') return;
  if (modoDoPasso(sessao.mao.passo) !== 'unica') return;
  if (id == null) return;
  const opcao = opcaoPorId(sessao, id);
  if (!opcao || !opcao.ativavel) return;

  const primeira = sessao.mao.faseTentativa === 'aguardando_primeira';
  if (!opcao.verdadeira) {
    opcao.ativavel = false;
    opcao.desabilitada = true;
    opcao.estadoVisual = 'eliminada';
    opcao.marca = 'corte';
    pintarErro(sessao);
    if (primeira) persistirPrimeira(sessao, deltasUnica(sessao, false));
    return;
  }

  opcao.estadoVisual = 'acertada';
  opcao.marca = 'acerto';
  opcao.ativavel = false;
  opcao.desabilitada = true;
  if (primeira) persistirPrimeira(sessao, deltasUnica(sessao, true));
  pintarAcertoBeat(sessao);
}

export function alternarOpcao(sessao, id) {
  if (sessao.hud.estado !== 'perguntando' || !sessao.mao) return;
  if (sessao.mao.faseTentativa === 'aguardando_beat') return;
  if (modoDoPasso(sessao.mao.passo) !== 'multipla') return;
  const opcao = opcaoPorId(sessao, id);
  if (!opcao || !opcao.ativavel) return;
  opcao.selecionada = !opcao.selecionada;
  opcao.estadoVisual = opcao.selecionada ? 'selecionada' : 'padrao';
}

export function confirmarMultipla(sessao) {
  if (sessao.hud.estado !== 'perguntando' || !sessao.mao) return;
  if (sessao.mao.faseTentativa === 'aguardando_beat') return;
  if (modoDoPasso(sessao.mao.passo) !== 'multipla') return;

  const primeira = sessao.mao.faseTentativa === 'aguardando_primeira';
  const perfeito = conjuntoExibidoPerfeito(sessao.hud.opcoes);
  const deltas = [];

  for (const opcao of sessao.hud.opcoes) {
    if (opcao.estadoVisual === 'eliminada') continue;
    const marcada = marcadaNaGrade(opcao);
    if (opcao.verdadeira) {
      if (marcada) {
        opcao.selecionada = true;
        opcao.estadoVisual = 'acertada';
        opcao.marca = 'acerto';
        opcao.ativavel = false;
        opcao.desabilitada = true;
        if (primeira) {
          deltas.push({ bucket: 'upgrade', categoria: opcao.id, acertos: 1 });
        }
      } else if (primeira) {
        deltas.push({ bucket: 'upgrade', categoria: opcao.id, erros: 1 });
      }
      continue;
    }
    if (marcada) {
      opcao.selecionada = false;
      opcao.estadoVisual = 'eliminada';
      opcao.marca = 'corte';
      opcao.ativavel = false;
      opcao.desabilitada = true;
      if (primeira) {
        deltas.push({ bucket: 'upgrade', categoria: opcao.id, erros: 1 });
      }
    }
  }

  if (primeira) persistirPrimeira(sessao, deltas);

  if (perfeito) {
    pintarAcertoBeat(sessao);
    return;
  }

  pintarErro(sessao);
  sessao.hud.cta = { nome: COPY.ctaConfirmar };
}
