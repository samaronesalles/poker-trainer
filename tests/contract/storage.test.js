import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  CATEGORIA_IDS,
  CHAVE_EVOLUCAO,
  criarStorage,
  evolucaoZerada,
} from '../../js/storage.js';

const fonteStorage = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../js/storage.js'),
  'utf8',
);

function memoria() {
  const map = new Map();
  const api = {
    getItem: (chave) => (map.has(chave) ? map.get(chave) : null),
    setItem: (chave, valor) => {
      map.set(chave, String(valor));
    },
    removeItem: (chave) => {
      map.delete(chave);
    },
  };
  return { map, api };
}

function celula(acertos, erros) {
  return { acertos, erros, exposicoes: acertos + erros };
}

test('evolucaoZerada tem 10+10+1 zerados e exposicoes = acertos + erros', () => {
  const zero = evolucaoZerada();
  assert.equal(CATEGORIA_IDS.length, 10);
  assert.deepEqual(Object.keys(zero.mao_atual), [...CATEGORIA_IDS]);
  assert.deepEqual(Object.keys(zero.upgrade), [...CATEGORIA_IDS]);
  for (const id of CATEGORIA_IDS) {
    assert.deepEqual(zero.mao_atual[id], celula(0, 0));
    assert.deepEqual(zero.upgrade[id], celula(0, 0));
    assert.equal(
      zero.mao_atual[id].exposicoes,
      zero.mao_atual[id].acertos + zero.mao_atual[id].erros,
    );
  }
  assert.deepEqual(zero.vencedor_pote, celula(0, 0));
});

test('chave ausente: ler() = zeros e 0 setItem', () => {
  let sets = 0;
  const api = {
    getItem: () => null,
    setItem: () => {
      sets += 1;
    },
    removeItem: () => {},
  };
  const storage = criarStorage({ api });
  const lido = storage.ler();
  assert.deepEqual(lido.mao_atual.flush, celula(0, 0));
  assert.deepEqual(lido.vencedor_pote, celula(0, 0));
  assert.equal(sets, 0);
});

test('delta acerto Flush mao_atual grava as 10 chaves; par permanece 0', () => {
  const { map, api } = memoria();
  const storage = criarStorage({ api });
  storage.aplicarDeltas({ bucket: 'mao_atual', categoria: 'flush', acertos: 1 });
  const bruto = JSON.parse(map.get(CHAVE_EVOLUCAO));
  assert.deepEqual(Object.keys(bruto.mao_atual).sort(), [...CATEGORIA_IDS].sort());
  assert.deepEqual(Object.keys(bruto.upgrade).sort(), [...CATEGORIA_IDS].sort());
  assert.equal(bruto.mao_atual.flush.acertos, 1);
  assert.equal(bruto.mao_atual.flush.erros, 0);
  assert.equal(bruto.mao_atual.flush.exposicoes, 1);
  assert.deepEqual(bruto.mao_atual.par, celula(0, 0));
  assert.ok('par' in bruto.mao_atual);
  assert.equal(Object.keys(bruto).sort().join(','), 'mao_atual,upgrade,vencedor_pote');
});

test('segundo delta na mesma célula soma (não é a regra de 1ª tentativa do quiz)', () => {
  const storage = criarStorage({ api: memoria().api });
  storage.aplicarDeltas({ bucket: 'mao_atual', categoria: 'flush', acertos: 1 });
  storage.aplicarDeltas({ bucket: 'mao_atual', categoria: 'flush', erros: 1 });
  const lido = storage.ler();
  assert.equal(lido.mao_atual.flush.acertos, 1);
  assert.equal(lido.mao_atual.flush.erros, 1);
  assert.equal(lido.mao_atual.flush.exposicoes, 2);
});

test('JSON ilegível vira zeros e não lança', () => {
  const { api } = memoria();
  api.setItem(CHAVE_EVOLUCAO, '{');
  const storage = criarStorage({ api });
  assert.doesNotThrow(() => storage.ler());
  const lido = storage.ler();
  assert.deepEqual(lido.mao_atual.flush, celula(0, 0));
  assert.deepEqual(lido.vencedor_pote, celula(0, 0));
});

test('mao_atual válido sem upgrade preserva mao_atual e zera upgrade', () => {
  const { api } = memoria();
  api.setItem(
    CHAVE_EVOLUCAO,
    JSON.stringify({
      mao_atual: { flush: { acertos: 2, erros: 0, exposicoes: 2 } },
    }),
  );
  const lido = criarStorage({ api }).ler();
  assert.equal(lido.mao_atual.flush.acertos, 2);
  assert.deepEqual(lido.upgrade.flush, celula(0, 0));
  assert.deepEqual(lido.upgrade.par, celula(0, 0));
  assert.equal(Object.keys(lido.upgrade).length, 10);
});

test('upgrade vazio completa as 10 categorias em 0', () => {
  const { api } = memoria();
  api.setItem(
    CHAVE_EVOLUCAO,
    JSON.stringify({
      mao_atual: { flush: { acertos: 1, erros: 0, exposicoes: 1 } },
      upgrade: {},
    }),
  );
  const lido = criarStorage({ api }).ler();
  assert.equal(lido.mao_atual.flush.acertos, 1);
  assert.deepEqual(lido.upgrade.flush, celula(0, 0));
});

test('JSON { foo: 1 } é corrupção dura → zeros', () => {
  const { api } = memoria();
  api.setItem(CHAVE_EVOLUCAO, JSON.stringify({ foo: 1 }));
  const lido = criarStorage({ api }).ler();
  assert.deepEqual(lido.mao_atual.flush, celula(0, 0));
  assert.deepEqual(lido.upgrade.par, celula(0, 0));
  assert.deepEqual(lido.vencedor_pote, celula(0, 0));
});

test('chave extra debug é ignorada e contadores preservados', () => {
  const { api } = memoria();
  api.setItem(
    CHAVE_EVOLUCAO,
    JSON.stringify({
      mao_atual: { flush: { acertos: 1, erros: 0, exposicoes: 1 } },
      upgrade: {},
      vencedor_pote: { acertos: 0, erros: 0, exposicoes: 0 },
      debug: true,
    }),
  );
  const lido = criarStorage({ api }).ler();
  assert.equal(lido.mao_atual.flush.acertos, 1);
  assert.equal('debug' in lido, false);
});

test('setItem lança: gravar false, sem throw', () => {
  const api = {
    getItem: () => null,
    setItem: () => {
      throw new Error('quota');
    },
    removeItem: () => {},
  };
  const storage = criarStorage({ api });
  assert.equal(storage.gravar(evolucaoZerada()), false);
  let evolucao;
  assert.doesNotThrow(() => {
    evolucao = storage.aplicarDeltas({
      bucket: 'mao_atual',
      categoria: 'flush',
      acertos: 1,
    });
  });
  assert.equal(evolucao.mao_atual.flush.acertos, 1);
});

test('módulo não referencia document, alert, indexedDB nem sessionStorage', () => {
  assert.equal(/document/.test(fonteStorage), false);
  assert.equal(/alert/.test(fonteStorage), false);
  assert.equal(/indexedDB/.test(fonteStorage), false);
  assert.equal(/sessionStorage/.test(fonteStorage), false);
});

test('duas escritas: a segunda substitui a primeira (LWW)', () => {
  const { map, api } = memoria();
  const storage = criarStorage({ api });
  const primeiro = evolucaoZerada();
  primeiro.mao_atual.flush = celula(3, 0);
  storage.gravar(primeiro);
  const segundo = evolucaoZerada();
  segundo.upgrade.par = celula(0, 1);
  storage.gravar(segundo);
  const bruto = JSON.parse(map.get(CHAVE_EVOLUCAO));
  assert.deepEqual(bruto.mao_atual.flush, celula(0, 0));
  assert.deepEqual(bruto.upgrade.par, celula(0, 1));
});

test('CHAVE_EVOLUCAO é poker-trainer:evolucao e removeItem só existe no fake de teste', () => {
  assert.equal(CHAVE_EVOLUCAO, 'poker-trainer:evolucao');
  const storage = criarStorage({ api: memoria().api });
  assert.equal(typeof storage.clear, 'undefined');
  assert.equal(typeof storage.zerar, 'undefined');
});

test('célula negativa ou não inteira vira 0 naquela célula só', () => {
  const { api } = memoria();
  api.setItem(
    CHAVE_EVOLUCAO,
    JSON.stringify({
      mao_atual: {
        flush: { acertos: -1, erros: 2, exposicoes: 1 },
        par: { acertos: 4, erros: 1, exposicoes: 5 },
      },
      upgrade: {},
      vencedor_pote: { acertos: 1.5, erros: 0, exposicoes: 1 },
    }),
  );
  const lido = criarStorage({ api }).ler();
  assert.deepEqual(lido.mao_atual.flush, celula(0, 2));
  assert.deepEqual(lido.mao_atual.par, celula(4, 1));
  assert.deepEqual(lido.vencedor_pote, celula(0, 0));
});
