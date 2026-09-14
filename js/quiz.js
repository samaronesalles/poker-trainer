/** Contrato de pergunta, feedback e 1ª tentativa. Motor em flop/turn + desconto no pouso + showdown no river. */

import { rotuloPoteCurto, streetVisivel } from './layout.js';
import {
  CATEGORIAS,
  UNIVERSO_POTE,
  avaliarDescontoStreet,
  avaliarMelhor5,
  conjuntoOpcoesMaoAtual,
  conjuntoOpcoesOdd,
  conjuntoOpcoesQuantidade,
  conjuntoOpcoesUpgrade,
  conjuntoOpcoesVencedor,
  quemGanhou,
} from './motor.js';

export const COPY = Object.freeze({
  linhaProposito: 'Treine ler as mãos. Sem apostas.',
  ctaNovaMao: 'Nova mão',
  ctaProximaMao: 'Próxima mão',
  ctaContinuar: 'Continuar',
  ctaConfirmar: 'Confirmar',
  ctaNenhuma: 'Nenhuma',
  semUpgrade: 'Não há mão que vire o pote.',
  linhaErroEnumeracao: 'Não foi possível continuar esta mão. Tente de novo.',
  enunciadoHero: 'Qual mão você tem agora?',
  enunciadoUpgrades: 'Quais mãos melhoram o seu jogo com chance de ganhar o pote?',
  enunciadoOuts: 'Quantas outs você tem?',
  enunciadoRanks: 'Quais ranks são outs?',
  enunciadoOdd: 'Qual é a sua odd?',
  enunciadoA: 'Qual mão o Adversário A completou?',
  enunciadoB: 'Qual mão o Adversário B completou?',
  enunciadoPote: 'Quem ganhou o pote?',
  hintMultipla: 'Pode ser mais de uma.',
  acerto: 'Você acertou',
  erro: 'Não é essa. Tente de novo.',
  revelado: 'Estas são as mãos ainda possíveis.',
  linhaParMaisAlto: 'Suponha que o adversário já tem o par mais alto da mesa.',
  linhaTrincaDoPar: 'Suponha que o adversário já tem trinca do par da mesa.',
  linhaStraight: 'Suponha que o adversário já tem Straight.',
  linhaFlush: 'Suponha que o adversário já tem Flush.',
});

export const APELIDOS = Object.freeze({
  voce: 'Você',
  adversarioA: 'Adversário A',
  adversarioB: 'Adversário B',
});

export const PASSOS = Object.freeze({
  flop_hero: 'flop_hero',
  flop_upgrade: 'flop_upgrade',
  flop_skip: 'flop_skip',
  flop_outs: 'flop_outs',
  flop_ranks: 'flop_ranks',
  flop_odds: 'flop_odds',
  turn_hero: 'turn_hero',
  turn_upgrade: 'turn_upgrade',
  turn_skip: 'turn_skip',
  turn_outs: 'turn_outs',
  turn_ranks: 'turn_ranks',
  turn_odds: 'turn_odds',
  river_hero: 'river_hero',
  river_a: 'river_a',
  river_b: 'river_b',
  river_vencedor: 'river_vencedor',
});

export const ROTULOS_RANKS = Object.freeze({
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  J: 'Valete',
  Q: 'Dama',
  K: 'Rei',
  A: 'Ás',
});

const IDS_RANKS = Object.freeze(['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']);

const INDICES_HOLE_RIVER = Object.freeze({
  voce: Object.freeze([4, 5]),
  adversarioA: Object.freeze([0, 1]),
  adversarioB: Object.freeze([2, 3]),
});

const ASSENTO_DO_PASSO_RIVER = Object.freeze({
  [PASSOS.river_hero]: 'voce',
  [PASSOS.river_a]: 'adversarioA',
  [PASSOS.river_b]: 'adversarioB',
});

export function rotuloVencedor(vencedorId) {
  return UNIVERSO_POTE.find((item) => item.id === vencedorId)?.rotulo ?? '';
}

export function modoDoPasso(passo) {
  if (
    passo === PASSOS.flop_upgrade ||
    passo === PASSOS.turn_upgrade ||
    passo === PASSOS.flop_ranks ||
    passo === PASSOS.turn_ranks
  ) {
    return 'multipla';
  }
  if (passo === PASSOS.flop_skip || passo === PASSOS.turn_skip) return null;
  if (
    passo === PASSOS.flop_outs ||
    passo === PASSOS.turn_outs ||
    passo === PASSOS.flop_odds ||
    passo === PASSOS.turn_odds
  ) {
    return 'unica';
  }
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
    rotuloCurto: tipo === 'vencedor' ? rotuloPoteCurto(item.id) : item.rotulo,
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

function comunitariasRiver(cartasJogo) {
  return [6, 7, 8, 9, 10].map((indice) => identidadeCarta(cartasJogo[indice]));
}

function holeDoAssento(cartasJogo, assento) {
  return INDICES_HOLE_RIVER[assento].map((indice) => identidadeCarta(cartasJogo[indice]));
}

function melhorDoRiver(sessao, assento) {
  const pronta = sessao.mao.showdown?.ok === true ? sessao.mao.showdown.maos?.[assento] : null;
  if (pronta?.categoriaId) return pronta;
  const cartas = sessao.mao.cartasJogo;
  return avaliarMelhor5([...holeDoAssento(cartas, assento), ...comunitariasRiver(cartas)]);
}

function criarOpcoesCategoriaRiver(sessao, passo, rng) {
  const assento = ASSENTO_DO_PASSO_RIVER[passo];
  const melhor = melhorDoRiver(sessao, assento);
  const board = comunitariasRiver(sessao.mao.cartasJogo);
  const ids = conjuntoOpcoesMaoAtual({ categoriaId: melhor.categoriaId, board });
  return {
    melhor,
    opcoes: shuffleOpcoes(
      ids.map((id) =>
        baseOpcao({ id, rotulo: rotuloCategoria(id) }, 'categoria', id === melhor.categoriaId),
      ),
      rng,
    ),
  };
}

function criarOpcoesPote(sessao, rng) {
  const showdown = sessao.mao.showdown;
  if (showdown?.ok !== true || !showdown.vencedorId) {
    return { vencedorId: null, opcoes: [] };
  }
  const ids = showdown.conjuntoPote ?? conjuntoOpcoesVencedor(showdown.vencedorId);
  return {
    vencedorId: showdown.vencedorId,
    opcoes: shuffleOpcoes(
      ids.map((id) =>
        baseOpcao({ id, rotulo: rotuloVencedor(id) }, 'vencedor', id === showdown.vencedorId),
      ),
      rng,
    ),
  };
}

export function prepararShowdown(sessao) {
  if (!sessao?.mao) return;
  const cartas = sessao.mao.cartasJogo;
  if (!Array.isArray(cartas) || cartas.length < 11) {
    sessao.mao.showdown = {
      ok: false,
      maos: null,
      vencedorId: null,
      vencedores: [],
      conjuntoPote: null,
    };
    return;
  }

  const resultado = quemGanhou({
    holeA: holeDoAssento(cartas, 'adversarioA'),
    holeB: holeDoAssento(cartas, 'adversarioB'),
    holeVoce: holeDoAssento(cartas, 'voce'),
    comunitarias: comunitariasRiver(cartas),
  });

  if (!resultado.ok) {
    sessao.mao.showdown = {
      ok: false,
      maos: null,
      vencedorId: null,
      vencedores: [],
      conjuntoPote: null,
    };
    return;
  }

  sessao.mao.showdown = {
    ok: true,
    maos: resultado.maos,
    vencedorId: resultado.vencedorId,
    vencedores: resultado.vencedores,
    conjuntoPote: conjuntoOpcoesVencedor(resultado.vencedorId),
  };
}

export function decidirAposShowdown(sessao) {
  const estado = sessao?.mao?.showdown;
  if (!estado) return 'pendente';
  if (estado.ok === true) return 'pergunta';
  if (estado.ok === false) return 'falha';
  return 'pendente';
}

export function criarOpcoesUpgrade(conjunto, rng = Math.random) {
  const verdadeiros = new Set(conjunto?.verdadeiros ?? []);
  const ids = Array.isArray(conjunto?.ids) ? conjunto.ids : [];
  return shuffleOpcoes(
    ids.map((id) => baseOpcao({ id, rotulo: rotuloCategoria(id) }, 'categoria', verdadeiros.has(id))),
    rng,
  );
}

export function streetVisivelDoPasso(passo) {
  if (
    passo === PASSOS.flop_hero ||
    passo === PASSOS.flop_upgrade ||
    passo === PASSOS.flop_skip ||
    passo === PASSOS.flop_outs ||
    passo === PASSOS.flop_ranks ||
    passo === PASSOS.flop_odds
  ) {
    return streetVisivel('flop');
  }
  if (
    passo === PASSOS.turn_hero ||
    passo === PASSOS.turn_upgrade ||
    passo === PASSOS.turn_skip ||
    passo === PASSOS.turn_outs ||
    passo === PASSOS.turn_ranks ||
    passo === PASSOS.turn_odds
  ) {
    return streetVisivel('turn');
  }
  if (
    passo === PASSOS.river_hero ||
    passo === PASSOS.river_a ||
    passo === PASSOS.river_b ||
    passo === PASSOS.river_vencedor
  ) {
    return streetVisivel('river');
  }
  return null;
}

function rotuloCategoria(id) {
  return CATEGORIAS.find((item) => item.id === id)?.rotulo ?? id;
}

export function linhaSuposicaoDe(linhaId, categoriaFeita) {
  if (linhaId === 'par_mais_alto') return COPY.linhaParMaisAlto;
  if (linhaId === 'trinca_do_par') return COPY.linhaTrincaDoPar;
  if (linhaId === 'straight') return COPY.linhaStraight;
  if (linhaId === 'flush') return COPY.linhaFlush;
  if (linhaId === 'rotulo') {
    return `Suponha que o adversário já tem ${rotuloCategoria(categoriaFeita)}.`;
  }
  return null;
}

export function enunciadoDoPasso(passo) {
  switch (passo) {
    case PASSOS.flop_hero:
    case PASSOS.turn_hero:
    case PASSOS.river_hero:
      return COPY.enunciadoHero;
    case PASSOS.flop_upgrade:
    case PASSOS.turn_upgrade:
      return COPY.enunciadoUpgrades;
    case PASSOS.flop_outs:
    case PASSOS.turn_outs:
      return COPY.enunciadoOuts;
    case PASSOS.flop_ranks:
    case PASSOS.turn_ranks:
      return COPY.enunciadoRanks;
    case PASSOS.flop_odds:
    case PASSOS.turn_odds:
      return COPY.enunciadoOdd;
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

function snapshotFalho(street) {
  return {
    ok: false,
    street,
    lista: null,
    conjunto: null,
    categoriaAtual: null,
    vilao: null,
    outs: null,
    n: null,
    ranks: null,
    odd: null,
    quantidade: null,
    opcoesOdd: null,
  };
}

export function prepararUpgradesStreet(sessao) {
  if (!sessao?.mao || !Array.isArray(sessao.mao.cartasJogo)) {
    if (sessao?.mao) {
      sessao.mao.descontoStreet = snapshotFalho(null);
      sessao.mao.upgradesStreet = { ok: false, lista: null, conjunto: null, categoriaAtual: null, street: null };
    }
    return;
  }

  const passo = sessao.mao.passo;
  const street = passo === PASSOS.turn_hero ? 'turn' : 'flop';
  const holeHeroi = [4, 5].map((indice) => identidadeCarta(sessao.mao.cartasJogo[indice]));
  const indicesBoard = street === 'turn' ? [6, 7, 8, 9] : [6, 7, 8];
  const comunitarias = indicesBoard.map((indice) => identidadeCarta(sessao.mao.cartasJogo[indice]));
  const resultado = avaliarDescontoStreet({ holeHeroi, comunitarias });

  if (!resultado.ok) {
    sessao.mao.descontoStreet = snapshotFalho(street);
    sessao.mao.upgradesStreet = {
      ok: false,
      lista: null,
      conjunto: null,
      categoriaAtual: null,
      street,
    };
    return;
  }

  const lista = resultado.upgrades;
  const conjunto = lista.length >= 1 ? conjuntoOpcoesUpgrade({ upgrades: lista }) : null;
  const quantidade =
    lista.length >= 1 && resultado.n >= 1 ? conjuntoOpcoesQuantidade({ n: resultado.n }) : null;
  const opcoesOdd =
    lista.length >= 1 && resultado.odd ? conjuntoOpcoesOdd({ x: resultado.odd.x }) : null;

  sessao.mao.descontoStreet = {
    ok: true,
    street,
    lista,
    conjunto,
    categoriaAtual: resultado.categoriaAtual,
    vilao: {
      categoriaFeita: resultado.vilao.categoriaFeita,
      linhaId: resultado.vilao.linhaId,
    },
    outs: resultado.outs,
    n: resultado.n,
    ranks: resultado.ranks,
    odd: resultado.odd,
    quantidade,
    opcoesOdd,
  };
  sessao.mao.upgradesStreet = {
    ok: true,
    lista,
    conjunto,
    categoriaAtual: resultado.categoriaAtual,
    street,
  };
}

export function decidirPosMaoAtual(sessao) {
  const estado = sessao?.mao?.descontoStreet ?? sessao?.mao?.upgradesStreet;
  if (!estado) return 'pendente';
  if (estado.ok === false) return 'falha';
  if (!Array.isArray(estado.lista)) return 'falha';
  if (estado.lista.length === 0) return 'skip';
  return 'pergunta';
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

export function revelacaoCompleta(opcoes) {
  return Array.isArray(opcoes) && opcoes.length > 0 && opcoes.every((item) => !item.ativavel);
}

export function atualizarCtaMultipla(sessao) {
  if (!sessao?.hud || !sessao.mao) return;
  if (revelacaoCompleta(sessao.hud.opcoes)) {
    sessao.hud.cta = { nome: COPY.ctaContinuar, desabilitado: false };
    return;
  }
  const alguma = sessao.hud.opcoes.some((item) => item.ativavel && item.selecionada);
  sessao.hud.cta = { nome: COPY.ctaConfirmar, desabilitado: !alguma };
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

function aplicarLinhaSuposicao(sessao, passo) {
  const comLinha = new Set([
    PASSOS.flop_upgrade,
    PASSOS.turn_upgrade,
    PASSOS.flop_outs,
    PASSOS.turn_outs,
    PASSOS.flop_ranks,
    PASSOS.turn_ranks,
    PASSOS.flop_odds,
    PASSOS.turn_odds,
  ]);
  if (!comLinha.has(passo)) {
    sessao.hud.linhaSuposicao = null;
    return;
  }
  const vilao = sessao.mao.descontoStreet?.vilao;
  sessao.hud.linhaSuposicao = linhaSuposicaoDe(vilao?.linhaId, vilao?.categoriaFeita);
}

function criarOpcoesQuantidade(desconto, rng) {
  const conjunto = desconto?.quantidade ?? conjuntoOpcoesQuantidade({ n: desconto?.n });
  const n = desconto?.n;
  return shuffleOpcoes(
    (conjunto.ids ?? []).map((valor) =>
      baseOpcao({ id: valor, rotulo: String(valor) }, 'quantidade', valor === n),
    ),
    rng,
  );
}

function criarOpcoesRanks(desconto, rng) {
  const verdadeiros = new Set(desconto?.ranks ?? []);
  return shuffleOpcoes(
    IDS_RANKS.map((id) =>
      baseOpcao({ id, rotulo: ROTULOS_RANKS[id] }, 'rank', verdadeiros.has(id)),
    ),
    rng,
  );
}

function criarOpcoesOdd(desconto, rng) {
  const conjunto = desconto?.opcoesOdd ?? conjuntoOpcoesOdd({ x: desconto?.odd?.x });
  const x = desconto?.odd?.x;
  return shuffleOpcoes(
    (conjunto.ids ?? []).map((item) =>
      baseOpcao({ id: item.valor, rotulo: item.rotulo }, 'odd', item.valor === x),
    ),
    rng,
  );
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
  sessao.hud.hint = null;
  sessao.hud.street = streetVisivelDoPasso(passo);
  limparFeedback(sessao);
  aplicarLinhaSuposicao(sessao, passo);

  if (passo === PASSOS.river_vencedor) {
    const montagem = criarOpcoesPote(sessao, rng);
    sessao.mao.corretaUnica = montagem.vencedorId;
    sessao.mao.conjuntoCorreto = [];
    sessao.hud.opcoes = montagem.opcoes;
    sessao.hud.cta = null;
    return;
  }

  if (passo === PASSOS.flop_upgrade || passo === PASSOS.turn_upgrade) {
    const snap = sessao.mao.descontoStreet ?? sessao.mao.upgradesStreet;
    const conjunto = snap?.conjunto ?? conjuntoOpcoesUpgrade({
      upgrades: snap?.lista ?? [],
    });
    sessao.mao.corretaUnica = null;
    sessao.mao.conjuntoCorreto = [...(conjunto.verdadeiros ?? [])];
    sessao.hud.opcoes = criarOpcoesUpgrade(conjunto, rng);
    sessao.hud.hint = COPY.hintMultipla;
    atualizarCtaMultipla(sessao);
    return;
  }

  if (passo === PASSOS.flop_outs || passo === PASSOS.turn_outs) {
    const snap = sessao.mao.descontoStreet;
    sessao.mao.corretaUnica = snap?.n;
    sessao.mao.conjuntoCorreto = [];
    sessao.hud.opcoes = criarOpcoesQuantidade(snap, rng);
    sessao.hud.cta = null;
    return;
  }

  if (passo === PASSOS.flop_ranks || passo === PASSOS.turn_ranks) {
    const snap = sessao.mao.descontoStreet;
    sessao.mao.corretaUnica = null;
    sessao.mao.conjuntoCorreto = [...(snap?.ranks ?? [])];
    sessao.hud.opcoes = criarOpcoesRanks(snap, rng);
    sessao.hud.hint = COPY.hintMultipla;
    atualizarCtaMultipla(sessao);
    return;
  }

  if (passo === PASSOS.flop_odds || passo === PASSOS.turn_odds) {
    const snap = sessao.mao.descontoStreet;
    sessao.mao.corretaUnica = snap?.odd?.x;
    sessao.mao.conjuntoCorreto = [];
    sessao.hud.opcoes = criarOpcoesOdd(snap, rng);
    sessao.hud.cta = null;
    return;
  }

  if (passo === PASSOS.flop_hero || passo === PASSOS.turn_hero) {
    const montagem = criarOpcoesMaoAtual(sessao.mao.cartasJogo, passo, rng);
    sessao.mao.corretaUnica = montagem.melhor.categoriaId;
    sessao.mao.conjuntoCorreto = [];
    sessao.hud.opcoes = montagem.opcoes;
    sessao.hud.cta = null;
    prepararUpgradesStreet(sessao);
    return;
  }

  if (passo === PASSOS.river_hero || passo === PASSOS.river_a || passo === PASSOS.river_b) {
    const montagem = criarOpcoesCategoriaRiver(sessao, passo, rng);
    sessao.mao.corretaUnica = montagem.melhor.categoriaId;
    sessao.mao.conjuntoCorreto = [];
    sessao.hud.opcoes = montagem.opcoes;
    sessao.hud.cta = null;
  }
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
  if (passo === PASSOS.flop_outs || passo === PASSOS.turn_outs) {
    return [{ bucket: 'outs', acertos: acerto ? 1 : 0, erros: acerto ? 0 : 1 }];
  }
  if (passo === PASSOS.flop_odds || passo === PASSOS.turn_odds) {
    return [{ bucket: 'odds', acertos: acerto ? 1 : 0, erros: acerto ? 0 : 1 }];
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
  atualizarCtaMultipla(sessao);
}

function passoDeRanks(passo) {
  return passo === PASSOS.flop_ranks || passo === PASSOS.turn_ranks;
}

export function confirmarMultipla(sessao) {
  if (sessao.hud.estado !== 'perguntando' || !sessao.mao) return;
  if (sessao.mao.faseTentativa === 'aguardando_beat') return;
  if (modoDoPasso(sessao.mao.passo) !== 'multipla') return;

  const primeira = sessao.mao.faseTentativa === 'aguardando_primeira';
  const perfeito = conjuntoExibidoPerfeito(sessao.hud.opcoes);
  const ranks = passoDeRanks(sessao.mao.passo);
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
        if (primeira && !ranks) {
          deltas.push({ bucket: 'upgrade', categoria: opcao.id, acertos: 1 });
        }
      } else if (primeira && !ranks) {
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
      if (primeira && !ranks) {
        deltas.push({ bucket: 'upgrade', categoria: opcao.id, erros: 1 });
      }
    }
  }

  if (primeira) {
    if (ranks) {
      persistirPrimeira(sessao, [
        { bucket: 'outs', acertos: perfeito ? 1 : 0, erros: perfeito ? 0 : 1 },
      ]);
    } else {
      persistirPrimeira(sessao, deltas);
    }
  }

  if (perfeito) {
    pintarAcertoBeat(sessao);
    return;
  }

  if (revelacaoCompleta(sessao.hud.opcoes)) {
    sessao.hud.feedback = 'acerto';
    sessao.hud.feedbackTexto = COPY.revelado;
    sessao.hud.cta = { nome: COPY.ctaContinuar, desabilitado: false };
    return;
  }

  pintarErro(sessao);
  atualizarCtaMultipla(sessao);
}
