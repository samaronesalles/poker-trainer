/**
 * Baralho francês, pool da visita e Fisher–Yates (ADR-004 / ADR-006).
 * MUST NOT importar quiz-stub, audio ou o DOM.
 * Sem persistência de origem: só memória da visita (pool compacto).
 * Gerador honesto: MUST NOT rejeitar permutação por qualidade de board (RN-G003).
 */

export const RANKS = Object.freeze([
  'A',
  'K',
  'Q',
  'J',
  '10',
  '9',
  '8',
  '7',
  '6',
  '5',
  '4',
  '3',
  '2',
]);

export const NAIPES = Object.freeze(['espadas', 'copas', 'ouros', 'paus']);

const POOL_BYTES = 32;
const UINT32_RANGE = 0x100000000;

const RANKS_SET = new Set(RANKS);
const NAIPES_SET = new Set(NAIPES);

const PAPEIS_JOGO = Object.freeze([
  Object.freeze({ papel: 'hole', dono: 'adversarioA' }),
  Object.freeze({ papel: 'hole', dono: 'adversarioA' }),
  Object.freeze({ papel: 'hole', dono: 'adversarioB' }),
  Object.freeze({ papel: 'hole', dono: 'adversarioB' }),
  Object.freeze({ papel: 'hole', dono: 'voce' }),
  Object.freeze({ papel: 'hole', dono: 'voce' }),
  Object.freeze({ papel: 'comunitaria', dono: 'flop' }),
  Object.freeze({ papel: 'comunitaria', dono: 'flop' }),
  Object.freeze({ papel: 'comunitaria', dono: 'flop' }),
  Object.freeze({ papel: 'comunitaria', dono: 'turn' }),
  Object.freeze({ papel: 'comunitaria', dono: 'river' }),
]);

function identityKey(carta) {
  return `${carta.rank}-${carta.naipe}`;
}

function writeUint32Bytes(value) {
  const v = value >>> 0;
  return [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff];
}

function xorMixBytes(buffer, bytes) {
  let acc = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    acc = (acc + buffer[i]) >>> 0;
  }
  for (let i = 0; i < bytes.length; i += 1) {
    const idx = i % buffer.length;
    const rot = i % 8;
    const mixed = ((bytes[i] << rot) | (bytes[i] >>> (8 - rot))) & 0xff;
    buffer[idx] ^= mixed ^ (acc & 0xff);
    acc = (acc * 1664525 + bytes[i] + 1013904223) >>> 0;
    buffer[(idx + 7) % buffer.length] ^= (acc >>> 16) & 0xff;
    buffer[(idx + 13) % buffer.length] ^= (acc >>> 24) & 0xff;
  }
}

function mixNumber(buffer, value) {
  if (!Number.isFinite(value)) return;
  const abs = Math.abs(value);
  const hi = Math.floor(abs / UINT32_RANGE) >>> 0;
  const lo = Math.floor(abs % UINT32_RANGE) >>> 0;
  const frac = Math.floor((abs % 1) * 0xffffffff) >>> 0;
  xorMixBytes(buffer, [...writeUint32Bytes(hi), ...writeUint32Bytes(lo), ...writeUint32Bytes(frac)]);
}

export function criarBaralhoPadrao() {
  const cartas = [];
  for (const naipe of NAIPES) {
    for (const rank of RANKS) {
      cartas.push({ rank, naipe });
    }
  }
  return cartas;
}

export function criarMisturaVisita() {
  const mistura = {
    buffer: new Uint8Array(POOL_BYTES),
    maos: 0,
    draw: 0,
  };
  const agora = Date.now();
  const tick =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : agora;
  misturarRelogio(mistura, agora, tick);
  return mistura;
}

export function misturarCursor(mistura, clientX, clientY) {
  if (!mistura?.buffer) return;
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
  mixNumber(mistura.buffer, clientX);
  mixNumber(mistura.buffer, clientY);
}

export function misturarRelogio(mistura, agoraMs, tickMs) {
  if (!mistura?.buffer) return;
  mixNumber(mistura.buffer, Number.isFinite(agoraMs) ? agoraMs : 0);
  mixNumber(mistura.buffer, Number.isFinite(tickMs) ? tickMs : 0);
  xorMixBytes(mistura.buffer, writeUint32Bytes((mistura.maos ?? 0) >>> 0));
}

function poolUint32(mistura) {
  mistura.draw = (mistura.draw ?? 0) + 1;
  const salt = mistura.draw >>> 0;
  const b = mistura.buffer;
  const i = (salt * 4) % (b.length - 3);
  let v = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  v ^= ((v << (7 + (salt % 13))) | (v >>> (32 - (7 + (salt % 13))))) >>> 0;
  v ^= ((b[(i + 7) % b.length] << 16) | b[(i + 11) % b.length]) >>> 0;
  v ^= salt;
  xorMixBytes(b, writeUint32Bytes(v));
  return v >>> 0;
}

function cryptoFill(rng) {
  if (typeof rng !== 'function') return null;
  try {
    const buf = new Uint32Array(1);
    rng(buf);
    return buf[0] >>> 0;
  } catch {
    return null;
  }
}

function resolveRng(rng) {
  if (typeof rng === 'function') return rng;
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    return (arr) => cryptoObj.getRandomValues(arr);
  }
  return null;
}

function uniformIndex(n, mistura, rngFn) {
  const threshold = Math.floor(UINT32_RANGE / n) * n;
  for (let attempt = 0; attempt < 128; attempt += 1) {
    const pooled = poolUint32(mistura);
    let x = cryptoFill(rngFn);
    x = x === null ? pooled : (x ^ pooled) >>> 0;
    if (x < threshold) return x % n;
  }
  return poolUint32(mistura) % n;
}

export function embaralhar(baralho52, mistura, rng) {
  const copia = (baralho52 ?? []).map((carta) => ({
    rank: carta.rank,
    naipe: carta.naipe,
  }));
  const pool = mistura ?? criarMisturaVisita();
  const rngFn = resolveRng(rng);
  for (let i = copia.length - 1; i >= 1; i -= 1) {
    const j = uniformIndex(i + 1, pool, rngFn);
    const tmp = copia[i];
    copia[i] = copia[j];
    copia[j] = tmp;
  }
  return copia;
}

export function cartasDeJogo(permutacao52) {
  const origem = Array.isArray(permutacao52) ? permutacao52 : [];
  return origem.slice(0, 11).map((carta, indice) => ({
    idVisual: `jogo-${indice}`,
    rank: carta.rank,
    naipe: carta.naipe,
    indicePermutacao: indice,
    visibilidade: 'verso',
    papel: PAPEIS_JOGO[indice].papel,
    dono: PAPEIS_JOGO[indice].dono,
    animando: true,
  }));
}

export function validarPermutacao(cartas) {
  if (!Array.isArray(cartas) || cartas.length !== 52) return 'incompleto';
  const seen = new Set();
  for (const carta of cartas) {
    if (!carta || !RANKS_SET.has(carta.rank) || !NAIPES_SET.has(carta.naipe)) {
      return 'mapeamento_impossivel';
    }
    const key = identityKey(carta);
    if (seen.has(key)) return 'duplicata';
    seen.add(key);
  }
  if (seen.size !== 52) return 'incompleto';
  return 'ok';
}

function congelarPermutacao(cartas) {
  return Object.freeze(cartas.map((carta) => Object.freeze({ rank: carta.rank, naipe: carta.naipe })));
}

export function montarMao(mistura, rng) {
  const pool = mistura ?? criarMisturaVisita();
  const agora = Date.now();
  const tick =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : agora;
  misturarRelogio(pool, agora, tick);
  pool.maos = (pool.maos ?? 0) + 1;
  const permutacao = embaralhar(criarBaralhoPadrao(), pool, rng);
  const status = validarPermutacao(permutacao);
  if (status !== 'ok') {
    return { status, permutacao: null, cartasJogo: null };
  }
  return {
    status: 'ok',
    permutacao: congelarPermutacao(permutacao),
    cartasJogo: cartasDeJogo(permutacao),
  };
}
