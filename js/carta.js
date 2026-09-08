/**
 * Componente DOM de carta (ADR-005). Sem Unicode/emoji de baralho como face.
 * Faces de jogo vêm de js/baralho.js (RN-044). MUST NOT servir stub como fonte.
 */

const SUIT_META = {
  copas: { label: 'copas', color: 'vermelho' },
  ouros: { label: 'ouros', color: 'vermelho' },
  espadas: { label: 'espadas', color: 'preto' },
  paus: { label: 'paus', color: 'preto' },
};

const SUIT_PATHS = {
  copas:
    'M12 21S3 14.2 3 8.6C3 5.5 5.4 3.2 8.2 3.2c1.6 0 3 .8 3.8 2.1.8-1.3 2.2-2.1 3.8-2.1C18.6 3.2 21 5.5 21 8.6 21 14.2 12 21 12 21z',
  ouros: 'M12 2.4 L20.2 12 12 21.6 3.8 12z',
  espadas:
    'M12 2.2C12 2.2 4.2 9.4 4.2 13.4c0 2.4 1.8 4.2 4.1 4.2 1.1 0 2.1-.4 2.8-1.1-.2 1.4-.8 2.7-2.3 3.7h6.4c-1.5-1-2.1-2.3-2.3-3.7.7.7 1.7 1.1 2.8 1.1 2.3 0 4.1-1.8 4.1-4.2C19.8 9.4 12 2.2 12 2.2z',
  paus:
    'M12 11.2c1.9-2.6 5.8-2.4 7.2.4 1.2 2.3-.1 5-2.6 5.6-1 .2-2 0-2.8-.6.1 1.6.7 3 2.2 4.2H8c1.5-1.2 2.1-2.6 2.2-4.2-.8.6-1.8.8-2.8.6-2.5-.6-3.8-3.3-2.6-5.6 1.4-2.8 5.3-3 7.2-.4z',
};

function svgNaipe(suit) {
  const meta = SUIT_META[suit];
  const d = SUIT_PATHS[suit];
  const fill = meta.color === 'vermelho' ? '#c41e3a' : '#141414';
  return `<svg class="carta__suit" viewBox="0 0 24 24" aria-hidden="true"><path fill="${fill}" d="${d}"/></svg>`;
}

function papelDataset(papel) {
  if (papel === 'exemplo') return 'exemplo';
  if (papel === 'comunitaria') return 'community';
  if (papel === 'burn_cenico') return 'burn';
  return 'hole';
}

function faceDataset(visibilidade) {
  if (visibilidade === 'face') return 'up';
  if (visibilidade === 'verso') return 'down';
  return 'empty';
}

/**
 * Fábrica DOM: rank tipográfico + naipe SVG, atributos de teste estáveis.
 * visibilidade: vazia | verso | face
 */
export function criarElementoCarta({
  rank = null,
  suit = null,
  papel = 'hole',
  visibilidade = 'vazia',
} = {}) {
  if (typeof document === 'undefined') {
    return null;
  }

  const el = document.createElement('div');
  el.className = 'carta';
  el.dataset.cardRole = papelDataset(papel);
  el.dataset.face = faceDataset(visibilidade);
  el.dataset.rank = rank ?? '';
  el.dataset.suit = suit ?? '';
  if (visibilidade === 'vazia') {
    el.classList.add('carta--vazia');
  }

  const inner = document.createElement('div');
  inner.className = 'carta__inner';

  const face = document.createElement('div');
  face.className = 'carta__face';
  if (suit && SUIT_META[suit]) {
    face.dataset.color = SUIT_META[suit].color;
  }

  const back = document.createElement('div');
  back.className = 'carta__back';
  back.setAttribute('aria-hidden', 'true');
  back.innerHTML =
    '<span class="carta__back-pattern"></span><span class="carta__back-diamond"></span>';

  if (rank && suit && SUIT_META[suit]) {
    const indexHtml = `<span class="carta__rank">${rank}</span>${svgNaipe(suit)}`;
    face.innerHTML = `
      <div class="carta__index carta__index--tl">${indexHtml}</div>
      <div class="carta__pip">${svgNaipe(suit)}</div>
      <div class="carta__index carta__index--br">${indexHtml}</div>
    `;
  }

  inner.append(face, back);
  el.append(inner);
  return el;
}

export function aplicarVisibilidade(el, visibilidade) {
  if (!el) return;
  el.dataset.face = faceDataset(visibilidade);
  el.classList.toggle('carta--vazia', visibilidade === 'vazia');
}

export function criarBurnCenico() {
  return criarElementoCarta({
    rank: null,
    suit: null,
    papel: 'burn_cenico',
    visibilidade: 'verso',
  });
}
