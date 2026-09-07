import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  cartasDeJogo,
  criarBaralhoPadrao,
  criarMisturaVisita,
  embaralhar,
  montarMao,
  validarPermutacao,
} from '../../js/baralho.js';

const fonteBaralho = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../js/baralho.js'),
  'utf8',
);

function chave(carta) {
  return `${carta.rank}-${carta.naipe}`;
}

function rngConstante(valor) {
  return (arr) => {
    arr[0] = valor >>> 0;
  };
}

test('criarBaralhoPadrao tem 52 identidades francesas únicas, 0 coringas', () => {
  const baralho = criarBaralhoPadrao();
  assert.equal(baralho.length, 52);
  const chaves = new Set(baralho.map(chave));
  assert.equal(chaves.size, 52);
  assert.equal(baralho[0].rank, 'A');
  assert.equal(baralho[0].naipe, 'espadas');
  assert.equal(baralho[12].rank, '2');
  assert.equal(baralho[13].naipe, 'copas');
  assert.ok(baralho.every((c) => c.rank !== 'coringa' && c.naipe !== 'coringa'));
});

test('embaralhar devolve 52 únicas e não muta a fábrica', () => {
  const fabrica = criarBaralhoPadrao();
  const snapshot = fabrica.map(chave).join('|');
  const mistura = criarMisturaVisita();
  const permutada = embaralhar(fabrica, mistura);
  assert.equal(permutada.length, 52);
  assert.equal(new Set(permutada.map(chave)).size, 52);
  assert.equal(fabrica.map(chave).join('|'), snapshot);
  assert.notEqual(permutada, fabrica);
});

test('embaralhar em 10 chamadas não é sempre a ordem de fábrica', () => {
  const fabrica = criarBaralhoPadrao();
  const ordemFabrica = fabrica.map(chave).join('|');
  const mistura = criarMisturaVisita();
  const ordens = [];
  for (let i = 0; i < 10; i += 1) {
    ordens.push(embaralhar(fabrica, mistura).map(chave).join('|'));
  }
  assert.ok(ordens.some((ordem) => ordem !== ordemFabrica));
});

test('cartasDeJogo mapeia RN-044 e omite índices 11–51', () => {
  const permutacao = criarBaralhoPadrao();
  const jogo = cartasDeJogo(permutacao);
  assert.equal(jogo.length, 11);
  assert.equal(jogo[0].dono, 'adversarioA');
  assert.equal(jogo[1].dono, 'adversarioA');
  assert.equal(jogo[2].dono, 'adversarioB');
  assert.equal(jogo[3].dono, 'adversarioB');
  assert.equal(jogo[4].dono, 'voce');
  assert.equal(jogo[5].dono, 'voce');
  assert.equal(jogo[6].papel, 'comunitaria');
  assert.equal(jogo[8].indicePermutacao, 8);
  assert.equal(jogo[9].indicePermutacao, 9);
  assert.equal(jogo[10].indicePermutacao, 10);
  for (let i = 0; i < 11; i += 1) {
    assert.equal(jogo[i].rank, permutacao[i].rank);
    assert.equal(jogo[i].naipe, permutacao[i].naipe);
    assert.equal(jogo[i].indicePermutacao, i);
  }
  const chavesJogo = new Set(jogo.map(chave));
  assert.equal(chavesJogo.size, 11);
  for (let i = 11; i < 52; i += 1) {
    assert.equal(chavesJogo.has(chave(permutacao[i])), false);
  }
});

test('cartasDeJogo devolve 11 identidades distintas do baralho padrão', () => {
  const jogo = cartasDeJogo(criarBaralhoPadrao());
  const padrao = new Set(criarBaralhoPadrao().map(chave));
  assert.equal(jogo.length, 11);
  assert.equal(new Set(jogo.map(chave)).size, 11);
  assert.ok(jogo.every((carta) => padrao.has(chave(carta))));
});

test('duplicata na permutação → validarPermutacao ≠ ok e montagem nula', () => {
  const cartas = criarBaralhoPadrao();
  cartas[51] = { rank: cartas[0].rank, naipe: cartas[0].naipe };
  assert.notEqual(validarPermutacao(cartas), 'ok');
  assert.equal(validarPermutacao(cartas), 'duplicata');
  assert.equal(validarPermutacao(cartas.slice(0, 50)), 'incompleto');
  const impossivel = criarBaralhoPadrao();
  impossivel[0] = { rank: 'A', naipe: 'coringa' };
  assert.equal(validarPermutacao(impossivel), 'mapeamento_impossivel');
});

test('embaralhar / montarMao sem getRandomValues ainda devolvem 52 cartas', () => {
  const original = globalThis.crypto?.getRandomValues;
  try {
    Object.defineProperty(globalThis.crypto, 'getRandomValues', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const mistura = criarMisturaVisita();
    const permutada = embaralhar(criarBaralhoPadrao(), mistura);
    assert.equal(permutada.length, 52);
    assert.equal(new Set(permutada.map(chave)).size, 52);
    const montagem = montarMao(mistura);
    assert.equal(montagem.status, 'ok');
    assert.equal(montagem.permutacao.length, 52);
    assert.equal(montagem.cartasJogo.length, 11);
    assert.notEqual(montagem.status, 'incompleto');
  } finally {
    Object.defineProperty(globalThis.crypto, 'getRandomValues', {
      value: original,
      configurable: true,
    });
  }
});

test('módulo baralho não referencia localStorage nem document', () => {
  assert.equal(fonteBaralho.includes('localStorage'), false);
  assert.equal(fonteBaralho.includes('sessionStorage'), false);
  assert.equal(fonteBaralho.includes('document'), false);
  assert.equal(fonteBaralho.includes('Math.random'), false);
});

test('nenhuma ramificação descarta shuffle por qualidade de board (RN-G003)', () => {
  assert.equal(/if\s*\([^)]*(empat|tie|split)/i.test(fonteBaralho), false);
  assert.equal(/descart\w*\s+(permut|board|mao)/i.test(fonteBaralho), false);
  assert.equal(/reject[-_ ]and[-_ ]retry/i.test(fonteBaralho), false);
});

test('montarMao ok congela permutação RN-044', () => {
  const montagem = montarMao(criarMisturaVisita(), rngConstante(0x9e3779b9));
  assert.equal(montagem.status, 'ok');
  assert.equal(montagem.permutacao.length, 52);
  assert.equal(montagem.cartasJogo.length, 11);
  assert.equal(chave(montagem.cartasJogo[0]), chave(montagem.permutacao[0]));
  assert.equal(chave(montagem.cartasJogo[10]), chave(montagem.permutacao[10]));
  assert.ok(Object.isFrozen(montagem.permutacao));
});
