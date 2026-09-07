/**
 * Motor de avaliação: melhor 5 + RN-017; sem enumerador; sem quemGanhou.
 * MUST NOT persistir Melhor5, kickers, cartas ou chaveDesempate.
 */

import { NAIPES, RANKS } from './baralho.js';

const RANK_VALOR = Object.freeze(
  Object.fromEntries(RANKS.map((rank, indice) => [rank, 14 - indice])),
);

export const CATEGORIAS = Object.freeze([
  Object.freeze({ id: 'royal_flush', rotulo: 'Royal flush', ordem: 1 }),
  Object.freeze({ id: 'straight_flush', rotulo: 'Straight flush', ordem: 2 }),
  Object.freeze({ id: 'quadra', rotulo: 'Quadra', ordem: 3 }),
  Object.freeze({ id: 'full_house', rotulo: 'Full house', ordem: 4 }),
  Object.freeze({ id: 'flush', rotulo: 'Flush', ordem: 5 }),
  Object.freeze({ id: 'straight', rotulo: 'Straight', ordem: 6 }),
  Object.freeze({ id: 'trinca', rotulo: 'Trinca', ordem: 7 }),
  Object.freeze({ id: 'dois_pares', rotulo: 'Dois pares', ordem: 8 }),
  Object.freeze({ id: 'par', rotulo: 'Par', ordem: 9 }),
  Object.freeze({ id: 'carta_alta', rotulo: 'Carta alta', ordem: 10 }),
]);

export const SEQUENCIAS_LEGAIS = Object.freeze([
  Object.freeze(['A', '2', '3', '4', '5']),
  Object.freeze(['2', '3', '4', '5', '6']),
  Object.freeze(['3', '4', '5', '6', '7']),
  Object.freeze(['4', '5', '6', '7', '8']),
  Object.freeze(['5', '6', '7', '8', '9']),
  Object.freeze(['6', '7', '8', '9', '10']),
  Object.freeze(['7', '8', '9', '10', 'J']),
  Object.freeze(['8', '9', '10', 'J', 'Q']),
  Object.freeze(['9', '10', 'J', 'Q', 'K']),
  Object.freeze(['10', 'J', 'Q', 'K', 'A']),
]);

const FORCA = Object.freeze({
  royal_flush: 9,
  straight_flush: 8,
  quadra: 7,
  full_house: 6,
  flush: 5,
  straight: 4,
  trinca: 3,
  dois_pares: 2,
  par: 1,
  carta_alta: 0,
});

const ROTULO_POR_ID = Object.freeze(
  Object.fromEntries(CATEGORIAS.map((item) => [item.id, item.rotulo])),
);

function valorRank(rank) {
  return RANK_VALOR[rank];
}

function topoSequencia(seq) {
  if (seq[0] === 'A' && seq[1] === '2') return 5;
  return Math.max(...seq.map(valorRank));
}

function sequenciaLegalDe(cartas) {
  const ranks = new Set(cartas.map((carta) => carta.rank));
  if (ranks.size !== 5) return null;
  for (const seq of SEQUENCIAS_LEGAIS) {
    if (seq.every((rank) => ranks.has(rank))) return seq;
  }
  return null;
}

function eFlush(cartas) {
  const naipe = cartas[0].naipe;
  return cartas.every((carta) => carta.naipe === naipe);
}

function contarRanks(cartas) {
  const mapa = new Map();
  for (const carta of cartas) {
    mapa.set(carta.rank, (mapa.get(carta.rank) || 0) + 1);
  }
  return mapa;
}

function ranksPorContagem(cartas) {
  return [...contarRanks(cartas).entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return valorRank(b[0]) - valorRank(a[0]);
  });
}

function kickersExceto(cartas, excluidos) {
  const ban = new Set(excluidos);
  return cartas
    .map((carta) => carta.rank)
    .filter((rank) => !ban.has(rank))
    .map(valorRank)
    .sort((a, b) => b - a);
}

function pontuar5(cartas) {
  const flush = eFlush(cartas);
  const seq = sequenciaLegalDe(cartas);
  const straight = seq != null;

  if (flush && straight) {
    const royal =
      seq[0] === '10' && seq[1] === 'J' && seq[2] === 'Q' && seq[3] === 'K' && seq[4] === 'A';
    if (royal) {
      return { categoriaId: 'royal_flush', chaveDesempate: [FORCA.royal_flush, 14] };
    }
    return {
      categoriaId: 'straight_flush',
      chaveDesempate: [FORCA.straight_flush, topoSequencia(seq)],
    };
  }

  const grupos = ranksPorContagem(cartas);
  const [primeiro, segundo] = grupos;

  if (primeiro[1] === 4) {
    return {
      categoriaId: 'quadra',
      chaveDesempate: [FORCA.quadra, valorRank(primeiro[0]), valorRank(segundo[0])],
    };
  }

  if (primeiro[1] === 3 && segundo?.[1] === 2) {
    return {
      categoriaId: 'full_house',
      chaveDesempate: [FORCA.full_house, valorRank(primeiro[0]), valorRank(segundo[0])],
    };
  }

  if (flush) {
    const kickers = cartas.map((carta) => valorRank(carta.rank)).sort((a, b) => b - a);
    return { categoriaId: 'flush', chaveDesempate: [FORCA.flush, ...kickers] };
  }

  if (straight) {
    return { categoriaId: 'straight', chaveDesempate: [FORCA.straight, topoSequencia(seq)] };
  }

  if (primeiro[1] === 3) {
    return {
      categoriaId: 'trinca',
      chaveDesempate: [FORCA.trinca, valorRank(primeiro[0]), ...kickersExceto(cartas, [primeiro[0]])],
    };
  }

  if (primeiro[1] === 2 && segundo?.[1] === 2) {
    const kicker = grupos[2][0];
    return {
      categoriaId: 'dois_pares',
      chaveDesempate: [
        FORCA.dois_pares,
        valorRank(primeiro[0]),
        valorRank(segundo[0]),
        valorRank(kicker),
      ],
    };
  }

  if (primeiro[1] === 2) {
    return {
      categoriaId: 'par',
      chaveDesempate: [FORCA.par, valorRank(primeiro[0]), ...kickersExceto(cartas, [primeiro[0]])],
    };
  }

  const kickers = cartas.map((carta) => valorRank(carta.rank)).sort((a, b) => b - a);
  return { categoriaId: 'carta_alta', chaveDesempate: [FORCA.carta_alta, ...kickers] };
}

function compararChave(a, b) {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    const da = a[i] ?? 0;
    const db = b[i] ?? 0;
    if (da !== db) return da - db;
  }
  return 0;
}

function combinacoes5(cartas) {
  const n = cartas.length;
  if (n === 5) return [cartas.slice()];
  const out = [];
  for (let a = 0; a < n - 4; a += 1) {
    for (let b = a + 1; b < n - 3; b += 1) {
      for (let c = b + 1; c < n - 2; c += 1) {
        for (let d = c + 1; d < n - 1; d += 1) {
          for (let e = d + 1; e < n; e += 1) {
            out.push([cartas[a], cartas[b], cartas[c], cartas[d], cartas[e]]);
          }
        }
      }
    }
  }
  return out;
}

function identidade(carta) {
  return { rank: carta.rank, naipe: carta.naipe };
}

export function avaliarMelhor5(cartas) {
  if (!Array.isArray(cartas) || ![5, 6, 7].includes(cartas.length)) {
    throw new Error('avaliarMelhor5: aridade deve ser 5, 6 ou 7');
  }

  let vencedora = null;
  for (const cinco of combinacoes5(cartas)) {
    const pontuacao = pontuar5(cinco);
    if (!vencedora || compararChave(pontuacao.chaveDesempate, vencedora.chaveDesempate) > 0) {
      vencedora = {
        cartas: cinco.map(identidade),
        categoriaId: pontuacao.categoriaId,
        rotulo: ROTULO_POR_ID[pontuacao.categoriaId],
        chaveDesempate: pontuacao.chaveDesempate,
      };
    }
  }
  return vencedora;
}

function ranksDistintos(cartas) {
  return [...new Set(cartas.map((carta) => carta.rank))];
}

function conectado(ranks) {
  const distinct = [...new Set(ranks)];
  if (distinct.length < 3) return false;
  for (const seq of SEQUENCIAS_LEGAIS) {
    const janela = new Set(seq);
    let cabem = 0;
    for (const rank of distinct) {
      if (janela.has(rank)) cabem += 1;
    }
    if (cabem >= 3) return true;
  }
  return false;
}

function texturaBoard(board) {
  const cartas = Array.isArray(board) ? board : [];
  const porNaipe = new Map();
  const porRank = new Map();
  for (const carta of cartas) {
    porNaipe.set(carta.naipe, (porNaipe.get(carta.naipe) || 0) + 1);
    porRank.set(carta.rank, (porRank.get(carta.rank) || 0) + 1);
  }

  let doisMaisMesmoNaipe = false;
  let sfTentadora = false;
  for (const naipe of NAIPES) {
    const qtd = porNaipe.get(naipe) || 0;
    if (qtd >= 2) doisMaisMesmoNaipe = true;
    if (qtd >= 3) {
      const ranksDoNaipe = cartas.filter((carta) => carta.naipe === naipe).map((carta) => carta.rank);
      if (conectado(ranksDoNaipe)) sfTentadora = true;
    }
  }

  let trincaOuMais = false;
  let pareadoSemTrinca = false;
  for (const qtd of porRank.values()) {
    if (qtd >= 3) trincaOuMais = true;
    if (qtd === 2) pareadoSemTrinca = true;
  }
  if (trincaOuMais) pareadoSemTrinca = false;

  return {
    doisMaisMesmoNaipe,
    conectado: conectado(ranksDistintos(cartas)),
    sfTentadora,
    trincaOuMais,
    pareadoSemTrinca,
  };
}

export function conjuntoOpcoesMaoAtual({ categoriaId, board } = {}) {
  const ids = [];
  const visto = new Set();

  function incluir(id) {
    if (!id || visto.has(id) || ids.length >= 6) return;
    visto.add(id);
    ids.push(id);
  }

  incluir(categoriaId);

  const indice = CATEGORIAS.findIndex((item) => item.id === categoriaId);
  if (indice > 0) incluir(CATEGORIAS[indice - 1].id);
  if (indice >= 0 && indice < CATEGORIAS.length - 1) incluir(CATEGORIAS[indice + 1].id);

  const textura = texturaBoard(board);
  if (textura.doisMaisMesmoNaipe) incluir('flush');
  if (textura.conectado) incluir('straight');
  if (textura.sfTentadora) incluir('straight_flush');
  if (textura.trincaOuMais) {
    incluir('quadra');
    incluir('full_house');
    incluir('trinca');
    incluir('dois_pares');
  } else if (textura.pareadoSemTrinca) {
    incluir('full_house');
    incluir('trinca');
    incluir('dois_pares');
  }

  for (const item of CATEGORIAS) {
    incluir(item.id);
    if (ids.length >= 6) break;
  }

  return ids;
}
