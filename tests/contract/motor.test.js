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
  assert.ok(fonteMotor.includes('sem enumerador'));
  assert.ok(fonteMotor.includes('sem quemGanhou'));
});
