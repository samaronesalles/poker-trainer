import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  LINHAS_COLINHA,
  ROTULO_COLINHA,
  ROTULO_MELHOR,
  ROTULO_OCULTAR,
  ROTULO_PIOR,
  ROTULO_TITULO,
  estadoInicial,
  montarColinha,
  ocultar,
  reabrir,
} from '../../js/colinha.js';
import { colinhaExisteNoViewport } from '../../js/layout.js';

const raiz = dirname(fileURLToPath(import.meta.url));
const fonteColinha = readFileSync(join(raiz, '../../js/colinha.js'), 'utf8');
const fonteMesa = readFileSync(join(raiz, '../../js/mesa.js'), 'utf8');
const cssColinha = readFileSync(join(raiz, '../../css/colinha.css'), 'utf8');

const RANKS = new Set(['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']);
const NAIPES = new Set(['espadas', 'copas', 'ouros', 'paus']);

const ROTULOS = [
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

const ESMAECIDOS = [[], [], [4], [], [], [], [3, 4], [4], [2, 3, 4], [1, 2, 3, 4]];

test('copy canônica da colinha', () => {
  assert.equal(ROTULO_TITULO, 'Classificação de mãos');
  assert.equal(ROTULO_MELHOR, 'Melhor');
  assert.equal(ROTULO_PIOR, 'Pior');
  assert.equal(ROTULO_OCULTAR, 'Ocultar');
  assert.equal(ROTULO_COLINHA, 'Colinha');
});

test('colinhaExisteNoViewport só acima de 900', () => {
  assert.equal(colinhaExisteNoViewport({ width: 901 }), true);
  assert.equal(colinhaExisteNoViewport({ width: 900 }), false);
  assert.equal(colinhaExisteNoViewport({ width: 480 }), false);
});

test('CSS esconde colinha em max-width 900px', () => {
  assert.match(cssColinha, /max-width:\s*900px/);
  assert.match(cssColinha, /\[data-colinha\]/);
  assert.match(cssColinha, /\[data-colinha-acao\]/);
});

test('catálogo tem 10 linhas canônicas e faces no alfabeto', () => {
  assert.equal(LINHAS_COLINHA.length, 10);
  LINHAS_COLINHA.forEach((linha, indice) => {
    assert.equal(linha.ordem, indice + 1);
    assert.equal(linha.rotulo, ROTULOS[indice]);
    assert.equal(linha.cartas.length, 5);
    assert.deepEqual([...linha.indicesEsmaecidos], ESMAECIDOS[indice]);
    for (const carta of linha.cartas) {
      assert.ok(RANKS.has(carta.rank), carta.rank);
      assert.ok(NAIPES.has(carta.naipe), carta.naipe);
    }
  });
});

test('faces inequívocas entre categorias', () => {
  const royal = LINHAS_COLINHA[0].cartas;
  const sf = LINHAS_COLINHA[1].cartas;
  assert.notDeepEqual(royal, sf);
  const flushRanks = LINHAS_COLINHA[4].cartas.map((carta) => carta.rank);
  assert.deepEqual(flushRanks, ['A', 'J', '9', '6', '3']);
  const straightNaipes = new Set(LINHAS_COLINHA[5].cartas.map((carta) => carta.naipe));
  assert.ok(straightNaipes.size > 1);
  const altaRanks = LINHAS_COLINHA[9].cartas.map((carta) => carta.rank);
  assert.deepEqual(altaRanks, ['A', 'K', '9', '7', '4']);
});

test('colinha não importa motor nem baralho', () => {
  assert.doesNotMatch(fonteColinha, /from ['"]\.\/motor\.js['"]/);
  assert.doesNotMatch(fonteColinha, /from ['"]\.\/baralho\.js['"]/);
});

test('máquina de visita é pura e começa visível', () => {
  const inicial = estadoInicial();
  assert.deepEqual(inicial, { visibilidade: 'visivel' });
  const escondido = ocultar(inicial);
  assert.deepEqual(escondido, { visibilidade: 'oculto' });
  assert.deepEqual(inicial, { visibilidade: 'visivel' });
  assert.deepEqual(reabrir(escondido), { visibilidade: 'visivel' });
  assert.deepEqual(reabrir(ocultar(estadoInicial())), { visibilidade: 'visivel' });
});

test('fonte da colinha e gancho da mesa sem persistência', () => {
  const gancho = fonteMesa.slice(fonteMesa.indexOf('export function bootMesa'));
  assert.doesNotMatch(fonteColinha, /localStorage/);
  assert.doesNotMatch(fonteColinha, /sessionStorage/);
  assert.doesNotMatch(fonteColinha, /document\.cookie/);
  assert.doesNotMatch(fonteColinha, /indexedDB/i);
  assert.doesNotMatch(gancho, /localStorage/);
  assert.doesNotMatch(gancho, /sessionStorage/);
  assert.doesNotMatch(gancho, /document\.cookie/);
  assert.doesNotMatch(gancho, /indexedDB/i);
  assert.match(fonteMesa, /montarColinha\(\$\('#clube'\)\)/);
});

test('colinha não registra Escape para ocultar', () => {
  assert.doesNotMatch(fonteColinha, /Escape/);
});

test('colinha isolada do quiz, motor e evolução', () => {
  assert.doesNotMatch(fonteColinha, /from ['"]\.\/quiz\.js['"]/);
  assert.doesNotMatch(fonteColinha, /from ['"]\.\/storage\.js['"]/);
  assert.doesNotMatch(fonteColinha, /from ['"]\.\/motor\.js['"]/);
  assert.doesNotMatch(fonteColinha, /aplicar\(/);
  assert.doesNotMatch(fonteColinha, /poker-trainer:evolucao/);
  assert.doesNotMatch(fonteColinha, /data-certa/);
  assert.doesNotMatch(fonteColinha, /aria-current/);
  assert.doesNotMatch(fonteColinha, /ESCOLHER_OPCAO/);
  assert.doesNotMatch(fonteColinha, /ALTERNAR_OPCAO/);
  assert.doesNotMatch(fonteColinha, /CONFIRMAR/);
});

test('linhas não são documentadas como controle', () => {
  assert.doesNotMatch(fonteColinha, /createElement\('li'\)[\s\S]{0,220}tabIndex/);
  assert.doesNotMatch(fonteColinha, /createElement\('li'\)[\s\S]{0,220}button/);
});

test('montarColinha falha aberto sem document', () => {
  assert.equal(typeof document, 'undefined');
  assert.doesNotThrow(() => {
    assert.deepEqual(montarColinha({}), { ok: false });
  });
});

test('fonte sem alert na colinha', () => {
  assert.doesNotMatch(fonteColinha, /alert\(/);
  const gancho = fonteMesa.slice(fonteMesa.indexOf('function bootMesa'));
  assert.doesNotMatch(gancho, /alert\(/);
});
