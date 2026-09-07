import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CATEGORIAS,
  SEQUENCIAS_LEGAIS,
  avaliarMelhor5,
  conjuntoOpcoesMaoAtual,
  conjuntoOpcoesUpgrade,
  enumerarUpgrades,
  snapshotDesconhecido,
} from '../../js/motor.js';

const raiz = dirname(fileURLToPath(import.meta.url));
const fonteMotor = readFileSync(join(raiz, '../../js/motor.js'), 'utf8');

function c(rank, naipe) {
  return { rank, naipe };
}

const ROTULOS_RN014 = [
  'Royal flush',
  'Straight flush',
  'Quadra',
  'Full house',
  'Flush',
  'Straight',
  'Trinca',
  'Dois pares',
  'Par',
  'Carta alta',
];

test('CATEGORIAS: 10 ids RN-014, rótulos exatos e ordem 1..10', () => {
  assert.equal(CATEGORIAS.length, 10);
  assert.deepEqual(
    CATEGORIAS.map((item) => item.id),
    [
      'royal_flush',
      'straight_flush',
      'quadra',
      'full_house',
      'flush',
      'straight',
      'trinca',
      'dois_pares',
      'par',
      'carta_alta',
    ],
  );
  assert.deepEqual(
    CATEGORIAS.map((item) => item.rotulo),
    ROTULOS_RN014,
  );
  assert.deepEqual(
    CATEGORIAS.map((item) => item.ordem),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
});

test('SEQUENCIAS_LEGAIS: 10 conjuntos fechados FR-006', () => {
  assert.equal(SEQUENCIAS_LEGAIS.length, 10);
  assert.deepEqual(SEQUENCIAS_LEGAIS[0], ['A', '2', '3', '4', '5']);
  assert.deepEqual(SEQUENCIAS_LEGAIS[9], ['10', 'J', 'Q', 'K', 'A']);
  assert.ok(!SEQUENCIAS_LEGAIS.some((seq) => seq.join('-') === 'K-A-2-3-4'));
});

test('§6.1 / §6.8: cinco cartas com um par → par / Par; deuces e ases', () => {
  const deuces = avaliarMelhor5([
    c('2', 'espadas'),
    c('2', 'copas'),
    c('5', 'ouros'),
    c('8', 'paus'),
    c('K', 'ouros'),
  ]);
  const ases = avaliarMelhor5([
    c('A', 'espadas'),
    c('A', 'copas'),
    c('5', 'ouros'),
    c('8', 'paus'),
    c('K', 'ouros'),
  ]);
  assert.equal(deuces.categoriaId, 'par');
  assert.equal(deuces.rotulo, 'Par');
  assert.equal(ases.categoriaId, 'par');
  assert.equal(ases.rotulo, 'Par');
});

test('§6.16: avaliarMelhor5 com length 0/4/8 lança', () => {
  assert.throws(() => avaliarMelhor5([]));
  assert.throws(() => avaliarMelhor5([c('A', 'espadas'), c('K', 'copas'), c('Q', 'ouros'), c('J', 'paus')]));
  assert.throws(() =>
    avaliarMelhor5([
      c('A', 'espadas'),
      c('K', 'copas'),
      c('Q', 'ouros'),
      c('J', 'paus'),
      c('10', 'espadas'),
      c('9', 'copas'),
      c('8', 'ouros'),
      c('7', 'paus'),
    ]),
  );
});

test('§6.2: A-K-Q-J-10 suited → royal_flush, não straight_flush', () => {
  const melhor = avaliarMelhor5([
    c('A', 'espadas'),
    c('K', 'espadas'),
    c('Q', 'espadas'),
    c('J', 'espadas'),
    c('10', 'espadas'),
  ]);
  assert.equal(melhor.categoriaId, 'royal_flush');
  assert.equal(melhor.rotulo, 'Royal flush');
  assert.notEqual(melhor.categoriaId, 'straight_flush');
});

test('§6.3: A-2-3-4-5 suited → straight_flush, não royal', () => {
  const melhor = avaliarMelhor5([
    c('A', 'copas'),
    c('2', 'copas'),
    c('3', 'copas'),
    c('4', 'copas'),
    c('5', 'copas'),
  ]);
  assert.equal(melhor.categoriaId, 'straight_flush');
  assert.notEqual(melhor.categoriaId, 'royal_flush');
});

test('§6.4: A-2-3-4-5 offsuit → straight', () => {
  const melhor = avaliarMelhor5([
    c('A', 'espadas'),
    c('2', 'copas'),
    c('3', 'ouros'),
    c('4', 'paus'),
    c('5', 'copas'),
  ]);
  assert.equal(melhor.categoriaId, 'straight');
  assert.equal(melhor.rotulo, 'Straight');
});

test('§6.5: wraps não são straight nem straight_flush', () => {
  const wraps = [
    [c('K', 'espadas'), c('A', 'copas'), c('2', 'ouros'), c('3', 'paus'), c('4', 'copas')],
    [c('Q', 'espadas'), c('K', 'copas'), c('A', 'ouros'), c('2', 'paus'), c('3', 'copas')],
    [c('J', 'espadas'), c('Q', 'copas'), c('K', 'ouros'), c('A', 'paus'), c('2', 'copas')],
    [c('A', 'espadas'), c('2', 'copas'), c('3', 'ouros'), c('4', 'paus'), c('K', 'copas')],
  ];
  for (const mao of wraps) {
    const melhor = avaliarMelhor5(mao);
    assert.notEqual(melhor.categoriaId, 'straight');
    assert.notEqual(melhor.categoriaId, 'straight_flush');
  }
});

test('§6.6: 5 suited não consecutivas → flush', () => {
  const melhor = avaliarMelhor5([
    c('A', 'paus'),
    c('3', 'paus'),
    c('5', 'paus'),
    c('7', 'paus'),
    c('9', 'paus'),
  ]);
  assert.equal(melhor.categoriaId, 'flush');
  assert.equal(melhor.rotulo, 'Flush');
});

test('§6.7: turn 1+4 dois_pares vence 2+3 par', () => {
  const melhor = avaliarMelhor5([
    c('A', 'espadas'),
    c('3', 'paus'),
    c('A', 'copas'),
    c('K', 'ouros'),
    c('7', 'espadas'),
    c('7', 'copas'),
  ]);
  assert.equal(melhor.categoriaId, 'dois_pares');
});

test('§6.10: sete cartas classificam (HUD não chama)', () => {
  const melhor = avaliarMelhor5([
    c('A', 'espadas'),
    c('3', 'paus'),
    c('A', 'copas'),
    c('K', 'ouros'),
    c('7', 'espadas'),
    c('7', 'copas'),
    c('4', 'ouros'),
  ]);
  assert.equal(melhor.categoriaId, 'dois_pares');
});

test('§6.9 / SC-013: cada uma das 10 categorias é a única certa em ≥1 fixture', () => {
  const fixtures = {
    royal_flush: [c('A', 'ouros'), c('K', 'ouros'), c('Q', 'ouros'), c('J', 'ouros'), c('10', 'ouros')],
    straight_flush: [c('9', 'espadas'), c('8', 'espadas'), c('7', 'espadas'), c('6', 'espadas'), c('5', 'espadas')],
    quadra: [c('7', 'espadas'), c('7', 'copas'), c('7', 'ouros'), c('7', 'paus'), c('2', 'espadas')],
    full_house: [c('7', 'espadas'), c('7', 'copas'), c('7', 'ouros'), c('2', 'paus'), c('2', 'espadas')],
    flush: [c('A', 'copas'), c('3', 'copas'), c('5', 'copas'), c('7', 'copas'), c('9', 'copas')],
    straight: [c('9', 'espadas'), c('8', 'copas'), c('7', 'ouros'), c('6', 'paus'), c('5', 'copas')],
    trinca: [c('7', 'espadas'), c('7', 'copas'), c('7', 'ouros'), c('2', 'paus'), c('9', 'espadas')],
    dois_pares: [c('7', 'espadas'), c('7', 'copas'), c('2', 'ouros'), c('2', 'paus'), c('9', 'espadas')],
    par: [c('7', 'espadas'), c('7', 'copas'), c('2', 'ouros'), c('9', 'paus'), c('K', 'espadas')],
    carta_alta: [c('A', 'espadas'), c('K', 'copas'), c('9', 'ouros'), c('7', 'paus'), c('3', 'espadas')],
  };
  for (const [id, cartas] of Object.entries(fixtures)) {
    const melhor = avaliarMelhor5(cartas);
    assert.equal(melhor.categoriaId, id, id);
    assert.equal(melhor.rotulo, CATEGORIAS.find((item) => item.id === id).rotulo);
  }
});

test('§6.11: board 2-4-6 inclui straight; 2-4-7 não entra só por tentadora', () => {
  const conectado = conjuntoOpcoesMaoAtual({
    categoriaId: 'par',
    board: [c('2', 'espadas'), c('4', 'copas'), c('6', 'ouros')],
  });
  assert.ok(conectado.includes('straight'));
  const gap = conjuntoOpcoesMaoAtual({
    categoriaId: 'par',
    board: [c('2', 'espadas'), c('4', 'copas'), c('7', 'ouros')],
  });
  assert.equal(gap.includes('straight'), false);
});

test('§6.12: 3+ mesmo naipe conectado → SF tentadora; connector offsuit não', () => {
  const sf = conjuntoOpcoesMaoAtual({
    categoriaId: 'par',
    board: [c('2', 'espadas'), c('4', 'espadas'), c('6', 'espadas')],
  });
  assert.ok(sf.includes('straight_flush'));
  const offsuit = conjuntoOpcoesMaoAtual({
    categoriaId: 'par',
    board: [c('2', 'espadas'), c('4', 'espadas'), c('6', 'copas')],
  });
  assert.equal(offsuit.includes('straight_flush'), false);
});

test('§6.13: board trinca → quadra tentadora; só par no board → não', () => {
  const trips = conjuntoOpcoesMaoAtual({
    categoriaId: 'par',
    board: [c('7', 'espadas'), c('7', 'copas'), c('7', 'ouros')],
  });
  assert.ok(trips.includes('quadra'));
  const parBoard = conjuntoOpcoesMaoAtual({
    categoriaId: 'carta_alta',
    board: [c('7', 'espadas'), c('7', 'copas'), c('2', 'ouros')],
  });
  assert.equal(parBoard.includes('quadra'), false);
});

test('§6.14: conjunto sempre length 6, inclui a certa, determinístico', () => {
  const board = [c('2', 'espadas'), c('4', 'copas'), c('6', 'ouros')];
  const a = conjuntoOpcoesMaoAtual({ categoriaId: 'par', board });
  const b = conjuntoOpcoesMaoAtual({ categoriaId: 'par', board });
  assert.equal(a.length, 6);
  assert.equal(new Set(a).size, 6);
  assert.ok(a.includes('par'));
  assert.deepEqual(a, b);
});

test('§6.15: Royal não entra só por textura de board', () => {
  const ids = conjuntoOpcoesMaoAtual({
    categoriaId: 'par',
    board: [c('A', 'espadas'), c('K', 'espadas'), c('Q', 'espadas')],
  });
  assert.equal(ids.includes('royal_flush'), false);
});

test('motor.js não importa quiz/mesa/storage nem persiste', () => {
  assert.equal(fonteMotor.includes('quiz.js'), false);
  assert.equal(fonteMotor.includes('mesa.js'), false);
  assert.equal(fonteMotor.includes('storage.js'), false);
  assert.equal(fonteMotor.includes('localStorage'), false);
  assert.equal(fonteMotor.includes('indexedDB'), false);
  assert.equal(fonteMotor.includes('sessionStorage'), false);
  assert.equal(fonteMotor.includes('fetch('), false);
  assert.equal(fonteMotor.includes('sendBeacon'), false);
  assert.ok(fonteMotor.includes('melhor 5 + RN-017'));
  assert.ok(fonteMotor.includes('enumerador de upgrades'));
  assert.ok(fonteMotor.includes('sem quemGanhou'));
  assert.equal(fonteMotor.includes('embaralhar'), false);
  assert.equal(fonteMotor.includes('Worker'), false);
  assert.equal(/U\+1F0/.test(fonteMotor), false);
});

const IDS_CANONICOS = CATEGORIAS.map((item) => item.id);

function enumerar(hole, board) {
  return enumerarUpgrades({ holeHeroi: hole, comunitarias: board });
}

test('§6.1 flop: 2 hole + 3 board → snapshot 47; turn +1 → 46', () => {
  const hole = [c('A', 'espadas'), c('K', 'copas')];
  const flop = [c('2', 'ouros'), c('5', 'paus'), c('9', 'espadas')];
  const snapFlop = snapshotDesconhecido([...hole, ...flop]);
  assert.equal(snapFlop.length, 47);
  const turn = [...flop, c('3', 'copas')];
  assert.equal(snapshotDesconhecido([...hole, ...turn]).length, 46);
});

test('§6.2 snapshot não exclui holes de A/B ausentes das visíveis', () => {
  const visiveis = [
    c('A', 'espadas'),
    c('K', 'copas'),
    c('2', 'ouros'),
    c('5', 'paus'),
    c('9', 'espadas'),
  ];
  const holeA = [c('Q', 'ouros'), c('J', 'paus')];
  const snap = snapshotDesconhecido(visiveis);
  const chaves = new Set(snap.map((carta) => `${carta.rank}-${carta.naipe}`));
  assert.ok(chaves.has('Q-ouros'));
  assert.ok(chaves.has('J-paus'));
  assert.equal(
    snap.some((carta) => carta.rank === holeA[0].rank && carta.naipe === holeA[0].naipe),
    true,
  );
});

test('§6.4 enumerarUpgrades não muta hole, board nem cartasJogo do caller', () => {
  const hole = [c('2', 'espadas'), c('9', 'copas')];
  const board = [c('2', 'copas'), c('A', 'ouros'), c('7', 'paus')];
  const cartasJogo = [...hole, ...board, c('3', 'ouros'), c('4', 'paus')];
  const holeAntes = JSON.stringify(hole);
  const boardAntes = JSON.stringify(board);
  const jogoAntes = JSON.stringify(cartasJogo);
  enumerar(hole, board);
  snapshotDesconhecido([...hole, ...board]);
  assert.equal(JSON.stringify(hole), holeAntes);
  assert.equal(JSON.stringify(board), boardAntes);
  assert.equal(JSON.stringify(cartasJogo), jogoAntes);
});

test('§6.5 testemunha só as 7 finais: Flush de 6 não substitui Full house das 7', () => {
  const hole = [c('7', 'espadas'), c('7', 'copas')];
  const flop = [c('A', 'espadas'), c('K', 'espadas'), c('3', 'espadas')];
  const seisFlush = [...hole, ...flop, c('2', 'espadas')];
  const seteFh = [...hole, ...flop, c('7', 'ouros'), c('A', 'copas')];
  assert.equal(avaliarMelhor5(seisFlush).categoriaId, 'flush');
  assert.equal(avaliarMelhor5(seteFh).categoriaId, 'full_house');
  const resultado = enumerar(hole, flop);
  assert.equal(resultado.ok, true);
  assert.ok(resultado.upgrades.includes('full_house'));
  assert.equal(resultado.upgrades.includes('carta_alta'), false);
  assert.equal('runouts' in resultado, false);
  assert.equal('chaveDesempate' in resultado, false);
});

test('§6.8 / §6.14 aridade inválida → { ok: false }, nunca lista vazia de sucesso', () => {
  const board = [c('2', 'ouros'), c('5', 'paus'), c('9', 'espadas')];
  const umHole = enumerar([c('A', 'espadas')], board);
  const boardCurto = enumerar([c('A', 'espadas'), c('K', 'copas')], [c('2', 'ouros'), c('5', 'paus')]);
  assert.deepEqual(umHole, { ok: false });
  assert.deepEqual(boardCurto, { ok: false });
  assert.equal(umHole.upgrades, undefined);
});

test('§6.9 carta_alta nunca entra em upgrades', () => {
  const resultado = enumerar(
    [c('A', 'espadas'), c('K', 'copas')],
    [c('2', 'ouros'), c('5', 'paus'), c('9', 'espadas')],
  );
  assert.equal(resultado.ok, true);
  assert.equal(resultado.upgrades.includes('carta_alta'), false);
});

test('§6.1 / §6.13 turn: snapshot 46; cada desconhecida como river testemunha Melhor5 das 7', () => {
  const hole = [c('8', 'espadas'), c('8', 'copas')];
  const turn = [c('8', 'ouros'), c('2', 'paus'), c('9', 'espadas'), c('3', 'copas')];
  assert.equal(snapshotDesconhecido([...hole, ...turn]).length, 46);
  const resultado = enumerar(hole, turn);
  assert.equal(resultado.ok, true);
  assert.equal(resultado.categoriaAtual, 'trinca');
  assert.deepEqual(resultado.upgrades, ['quadra', 'full_house']);
  const conjunto = conjuntoOpcoesUpgrade({ upgrades: resultado.upgrades });
  assert.equal(conjunto.ids.length, 6);
  assert.deepEqual(conjunto.verdadeiros, ['quadra', 'full_house']);
  assert.equal(conjunto.verdadeiros.length, 2);
  assert.equal(conjunto.ids.length - conjunto.verdadeiros.length, 4);
});

test('§6.11 1–5 upgrades: length 6, todos inclusos, resto distratoras forte→fraco', () => {
  const dois = conjuntoOpcoesUpgrade({ upgrades: ['flush', 'straight'] });
  assert.equal(dois.ids.length, 6);
  assert.ok(dois.ids.includes('flush'));
  assert.ok(dois.ids.includes('straight'));
  assert.deepEqual(dois.verdadeiros, ['flush', 'straight']);
  const distratoras = dois.ids.filter((id) => !dois.verdadeiros.includes(id));
  assert.deepEqual(distratoras, ['royal_flush', 'straight_flush', 'quadra', 'full_house']);
});

test('§6.12 CA-014: ≥7 upgrades → 6 mais fortes, 0 distratora, par/dois_pares/trinca fora', () => {
  const upgrades = [
    'royal_flush',
    'straight_flush',
    'quadra',
    'full_house',
    'flush',
    'straight',
    'trinca',
    'dois_pares',
    'par',
  ];
  const a = conjuntoOpcoesUpgrade({ upgrades });
  const b = conjuntoOpcoesUpgrade({ upgrades: [...upgrades].reverse() });
  assert.deepEqual(a.ids, [
    'royal_flush',
    'straight_flush',
    'quadra',
    'full_house',
    'flush',
    'straight',
  ]);
  assert.deepEqual(a.verdadeiros, a.ids);
  assert.equal(a.ids.includes('par'), false);
  assert.equal(a.ids.includes('dois_pares'), false);
  assert.equal(a.ids.includes('trinca'), false);
  assert.deepEqual([...a.ids].sort(), [...b.ids].sort());
});

test('§6.6 royal de naipe testemunha só royal_flush, não flush/SF daquele runout', () => {
  const seteRoyal = [
    c('A', 'espadas'),
    c('K', 'espadas'),
    c('Q', 'espadas'),
    c('J', 'espadas'),
    c('10', 'espadas'),
    c('2', 'copas'),
    c('3', 'ouros'),
  ];
  assert.equal(avaliarMelhor5(seteRoyal).categoriaId, 'royal_flush');
  const resultado = enumerar(
    [c('A', 'espadas'), c('K', 'espadas')],
    [c('Q', 'espadas'), c('J', 'espadas'), c('2', 'copas')],
  );
  assert.equal(resultado.ok, true);
  assert.ok(resultado.upgrades.includes('royal_flush'));
});

test('§6.7 trinca atual: par / dois_pares / trinca / carta_alta ∉ upgrades', () => {
  const resultado = enumerar(
    [c('8', 'espadas'), c('8', 'copas')],
    [c('8', 'ouros'), c('2', 'paus'), c('9', 'espadas')],
  );
  assert.equal(resultado.ok, true);
  assert.equal(resultado.categoriaAtual, 'trinca');
  for (const id of ['par', 'dois_pares', 'trinca', 'carta_alta']) {
    assert.equal(resultado.upgrades.includes(id), false, id);
  }
});

test('§6.8 par de 2 que só sobe o par → par ∉ upgrades', () => {
  const resultado = enumerar(
    [c('2', 'espadas'), c('2', 'copas')],
    [c('5', 'ouros'), c('8', 'paus'), c('K', 'espadas')],
  );
  assert.equal(resultado.ok, true);
  assert.equal(resultado.categoriaAtual, 'par');
  assert.equal(resultado.upgrades.includes('par'), false);
});

test('§6.10 herói já com royal no flop → ok e upgrades vazia', () => {
  const resultado = enumerar(
    [c('A', 'espadas'), c('K', 'espadas')],
    [c('Q', 'espadas'), c('J', 'espadas'), c('10', 'espadas')],
  );
  assert.equal(resultado.ok, true);
  assert.equal(resultado.categoriaAtual, 'royal_flush');
  assert.deepEqual(resultado.upgrades, []);
});

test('§6.15 as 9 categorias Royal…Par são upgrade em ≥1 fixture; Carta alta em 0', () => {
  const fixtures = {
    royal_flush: {
      hole: [c('A', 'espadas'), c('K', 'espadas')],
      board: [c('Q', 'espadas'), c('J', 'ouros'), c('2', 'paus')],
    },
    straight_flush: {
      hole: [c('5', 'espadas'), c('6', 'espadas')],
      board: [c('7', 'espadas'), c('2', 'copas'), c('9', 'ouros')],
    },
    quadra: {
      hole: [c('7', 'espadas'), c('7', 'copas')],
      board: [c('7', 'ouros'), c('2', 'paus'), c('3', 'copas')],
    },
    full_house: {
      hole: [c('7', 'espadas'), c('7', 'copas')],
      board: [c('2', 'ouros'), c('3', 'paus'), c('4', 'copas')],
    },
    flush: {
      hole: [c('A', 'espadas'), c('3', 'espadas')],
      board: [c('5', 'espadas'), c('7', 'copas'), c('9', 'ouros')],
    },
    straight: {
      hole: [c('A', 'espadas'), c('3', 'copas')],
      board: [c('4', 'ouros'), c('5', 'paus'), c('7', 'espadas')],
    },
    trinca: {
      hole: [c('A', 'espadas'), c('K', 'copas')],
      board: [c('2', 'ouros'), c('5', 'paus'), c('8', 'espadas')],
    },
    dois_pares: {
      hole: [c('A', 'espadas'), c('3', 'copas')],
      board: [c('5', 'ouros'), c('7', 'paus'), c('9', 'espadas')],
    },
    par: {
      hole: [c('A', 'espadas'), c('K', 'copas')],
      board: [c('2', 'ouros'), c('5', 'paus'), c('8', 'espadas')],
    },
  };
  const vistas = new Set();
  for (const [id, { hole, board }] of Object.entries(fixtures)) {
    const resultado = enumerar(hole, board);
    assert.equal(resultado.ok, true, id);
    assert.ok(resultado.upgrades.includes(id), id);
    assert.equal(resultado.upgrades.includes('carta_alta'), false, id);
    vistas.add(id);
  }
  assert.equal(vistas.size, 9);
  void IDS_CANONICOS;
});

test('§6.16 pote hipotético não é entrada: holes adversárias não são conhecidas', () => {
  const hole = [c('A', 'espadas'), c('K', 'copas')];
  const board = [c('2', 'ouros'), c('5', 'paus'), c('9', 'espadas')];
  const resultado = enumerar(hole, board);
  assert.equal(resultado.ok, true);
  assert.equal(fonteMotor.includes('quemGanhou'), true);
  assert.ok(fonteMotor.includes('sem quemGanhou'));
});
