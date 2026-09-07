/**
 * Composição da mesa e geometria cênica. Só memória — sem storage, sem PII.
 */

export const COMPOSICOES = Object.freeze(['desktop', 'retrato', 'estreito', 'paisagem']);

export const STREETS = Object.freeze(['flop', 'turn', 'river']);

export const ROTULOS_POTE_CURTOS = Object.freeze({
  voce: 'Você',
  adversarioA: 'A',
  adversarioB: 'B',
  voce_a: 'Você e A',
  voce_b: 'Você e B',
  a_b: 'A e B',
  tres: 'Os três',
});

export function colinhaExisteNoViewport({ width } = {}) {
  return Number(width) > 900;
}

export function composicaoDoViewport({ width, height } = {}) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return 'desktop';
  }
  if (h <= 520 && w > h) return 'paisagem';
  if (w <= 480) return 'estreito';
  if (w <= 900) return 'retrato';
  return 'desktop';
}

export function streetVisivel(street) {
  if (street === 'flop' || street === 'turn' || street === 'river') return street;
  return null;
}

export function rotuloPoteCurto(id) {
  return ROTULOS_POTE_CURTOS[id] ?? '';
}

export function caixaCentro(caixa) {
  return {
    x: caixa.left + caixa.width / 2,
    y: caixa.top + caixa.height / 2,
  };
}

export function offsetPote({ origem, destino, bounds, margem = 12 } = {}) {
  if (!origem || !destino) return { dx: 0, dy: 0 };
  const de = caixaCentro(origem);
  const para = caixaCentro(destino);
  let dx = para.x - de.x;
  let dy = para.y - de.y;
  if (!bounds) return { dx, dy };

  const halfW = origem.width / 2;
  const halfH = origem.height / 2;
  const minX = bounds.left + margem + halfW;
  const maxX = bounds.right - margem - halfW;
  const minY = bounds.top + margem + halfH;
  const maxY = bounds.bottom - margem - halfH;
  const nx = Math.min(maxX, Math.max(minX, de.x + dx));
  const ny = Math.min(maxY, Math.max(minY, de.y + dy));
  return { dx: nx - de.x, dy: ny - de.y };
}

export function chavesCartasVencedoras(showdown, vencedores) {
  const chaves = [];
  for (const id of vencedores ?? []) {
    for (const carta of showdown?.maos?.[id]?.cartas ?? []) {
      if (carta?.rank && carta?.naipe) {
        chaves.push(`${carta.rank}-${carta.naipe}`);
      }
    }
  }
  return [...new Set(chaves)];
}

export function assentoEmFoco(passo) {
  switch (passo) {
    case 'river_a':
      return 'adversarioA';
    case 'river_b':
      return 'adversarioB';
    case 'flop_hero':
    case 'turn_hero':
    case 'river_hero':
      return 'voce';
    default:
      return null;
  }
}
