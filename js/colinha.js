/**
 * colinha de classificação — lenda estática, sem motor, sem storage
 */

import { criarElementoCarta } from './carta.js';
import { colinhaExisteNoViewport } from './layout.js';

export const ROTULO_TITULO = 'Classificação de mãos';
export const ROTULO_MELHOR = 'Melhor';
export const ROTULO_PIOR = 'Pior';
export const ROTULO_OCULTAR = 'Ocultar';
export const ROTULO_COLINHA = 'Colinha';

function cartaExemplo(rank, naipe) {
  return Object.freeze({ rank, naipe });
}

function linhaCategoria(ordem, id, rotulo, cartas, indicesEsmaecidos) {
  return Object.freeze({
    ordem,
    id,
    rotulo,
    cartas: Object.freeze(cartas.map((carta) => Object.freeze({ ...carta }))),
    indicesEsmaecidos: Object.freeze([...indicesEsmaecidos]),
  });
}

export const LINHAS_COLINHA = Object.freeze([
  linhaCategoria(
    1,
    'royal_flush',
    'Royal flush',
    [
      cartaExemplo('A', 'espadas'),
      cartaExemplo('K', 'espadas'),
      cartaExemplo('Q', 'espadas'),
      cartaExemplo('J', 'espadas'),
      cartaExemplo('10', 'espadas'),
    ],
    [],
  ),
  linhaCategoria(
    2,
    'straight_flush',
    'Straight flush',
    [
      cartaExemplo('9', 'copas'),
      cartaExemplo('8', 'copas'),
      cartaExemplo('7', 'copas'),
      cartaExemplo('6', 'copas'),
      cartaExemplo('5', 'copas'),
    ],
    [],
  ),
  linhaCategoria(
    3,
    'quadra',
    'Quadra',
    [
      cartaExemplo('8', 'espadas'),
      cartaExemplo('8', 'copas'),
      cartaExemplo('8', 'ouros'),
      cartaExemplo('8', 'paus'),
      cartaExemplo('K', 'espadas'),
    ],
    [4],
  ),
  linhaCategoria(
    4,
    'full_house',
    'Full house',
    [
      cartaExemplo('K', 'espadas'),
      cartaExemplo('K', 'copas'),
      cartaExemplo('K', 'ouros'),
      cartaExemplo('4', 'espadas'),
      cartaExemplo('4', 'copas'),
    ],
    [],
  ),
  linhaCategoria(
    5,
    'flush',
    'Flush',
    [
      cartaExemplo('A', 'paus'),
      cartaExemplo('J', 'paus'),
      cartaExemplo('9', 'paus'),
      cartaExemplo('6', 'paus'),
      cartaExemplo('3', 'paus'),
    ],
    [],
  ),
  linhaCategoria(
    6,
    'straight',
    'Straight',
    [
      cartaExemplo('9', 'espadas'),
      cartaExemplo('8', 'copas'),
      cartaExemplo('7', 'ouros'),
      cartaExemplo('6', 'paus'),
      cartaExemplo('5', 'espadas'),
    ],
    [],
  ),
  linhaCategoria(
    7,
    'trinca',
    'Trinca',
    [
      cartaExemplo('Q', 'espadas'),
      cartaExemplo('Q', 'copas'),
      cartaExemplo('Q', 'ouros'),
      cartaExemplo('9', 'paus'),
      cartaExemplo('4', 'espadas'),
    ],
    [3, 4],
  ),
  linhaCategoria(
    8,
    'dois_pares',
    'Dois pares',
    [
      cartaExemplo('J', 'espadas'),
      cartaExemplo('J', 'copas'),
      cartaExemplo('6', 'ouros'),
      cartaExemplo('6', 'paus'),
      cartaExemplo('2', 'espadas'),
    ],
    [4],
  ),
  linhaCategoria(
    9,
    'par',
    'Par',
    [
      cartaExemplo('10', 'espadas'),
      cartaExemplo('10', 'copas'),
      cartaExemplo('A', 'ouros'),
      cartaExemplo('8', 'paus'),
      cartaExemplo('3', 'espadas'),
    ],
    [2, 3, 4],
  ),
  linhaCategoria(
    10,
    'carta_alta',
    'Carta alta',
    [
      cartaExemplo('A', 'espadas'),
      cartaExemplo('K', 'ouros'),
      cartaExemplo('9', 'paus'),
      cartaExemplo('7', 'copas'),
      cartaExemplo('4', 'espadas'),
    ],
    [1, 2, 3, 4],
  ),
]);

export function estadoInicial() {
  return { visibilidade: 'visivel' };
}

export function ocultar(_estado) {
  return { visibilidade: 'oculto' };
}

export function reabrir(_estado) {
  return { visibilidade: 'visivel' };
}

let visita = estadoInicial();
let ultimaLargura = 1280;
let nos = { aside: null, ocultar: null, reabrir: null };

function removerRestos(host) {
  if (!host || typeof host.querySelectorAll !== 'function') return;
  for (const no of host.querySelectorAll('[data-colinha], [data-colinha-acao]')) {
    no.remove();
  }
}

function ausentarControle(el, ausente) {
  if (!el) return;
  el.hidden = ausente;
  if (ausente) {
    el.setAttribute('inert', '');
    el.tabIndex = -1;
  } else {
    el.removeAttribute('inert');
    el.tabIndex = 0;
  }
}

function ausentarPainel(el, ausente) {
  if (!el) return;
  el.hidden = ausente;
  if (ausente) {
    el.setAttribute('inert', '');
  } else {
    el.removeAttribute('inert');
  }
}

function aplicarUi(width = ultimaLargura) {
  if (!nos.aside || !nos.reabrir) return;
  nos.aside.dataset.estado = visita.visibilidade;
  const existe = colinhaExisteNoViewport({ width });
  if (!existe) {
    ausentarPainel(nos.aside, true);
    ausentarControle(nos.reabrir, true);
    if (nos.ocultar) nos.ocultar.tabIndex = -1;
    return;
  }
  const visivel = visita.visibilidade === 'visivel';
  ausentarPainel(nos.aside, !visivel);
  ausentarControle(nos.reabrir, visivel);
  if (nos.ocultar) {
    nos.ocultar.hidden = !visivel;
    nos.ocultar.tabIndex = visivel ? 0 : -1;
  }
}

function preencherSlot(carta, esmaecida) {
  const slot = document.createElement('div');
  slot.className = 'colinha__slot';
  const el = criarElementoCarta({
    rank: carta.rank,
    suit: carta.naipe,
    papel: 'exemplo',
    visibilidade: 'face',
  });
  if (!el) {
    throw new Error('colinha-carta');
  }
  el.classList.add('carta--exemplo');
  if (esmaecida) {
    el.classList.add('carta--esmaecida');
    el.dataset.esmaecida = 'true';
  }
  slot.append(el);
  return slot;
}

function criarLinha(linha) {
  const li = document.createElement('li');
  li.dataset.categoria = linha.id;
  li.dataset.ordem = String(linha.ordem);

  const ordem = document.createElement('span');
  ordem.className = 'colinha__ordem';
  ordem.textContent = String(linha.ordem);

  const rotulo = document.createElement('span');
  rotulo.className = 'colinha__rotulo';
  rotulo.textContent = linha.rotulo;

  const mao = document.createElement('div');
  mao.className = 'colinha__cartas';
  linha.cartas.forEach((carta, indice) => {
    mao.append(preencherSlot(carta, linha.indicesEsmaecidos.includes(indice)));
  });

  li.append(ordem, rotulo, mao);
  return li;
}

function aoOcultar() {
  visita = ocultar(visita);
  aplicarUi();
  nos.reabrir?.focus();
}

function aoReabrir() {
  visita = reabrir(visita);
  aplicarUi();
  nos.ocultar?.focus();
}

function montarNos() {
  const aside = document.createElement('aside');
  aside.dataset.colinha = '';
  aside.dataset.estado = 'visivel';
  aside.setAttribute('role', 'complementary');
  aside.setAttribute('aria-label', ROTULO_TITULO);

  const cabeca = document.createElement('header');
  cabeca.className = 'colinha__cabeca';

  const titulo = document.createElement('h2');
  titulo.className = 'colinha__titulo';
  titulo.textContent = ROTULO_TITULO;

  const btnOcultar = document.createElement('button');
  btnOcultar.type = 'button';
  btnOcultar.dataset.colinhaAcao = 'ocultar';
  btnOcultar.className = 'colinha__ocultar';
  btnOcultar.textContent = ROTULO_OCULTAR;
  btnOcultar.addEventListener('click', aoOcultar);

  cabeca.append(titulo, btnOcultar);

  const melhor = document.createElement('p');
  melhor.dataset.colinhaSentido = 'melhor';
  melhor.className = 'colinha__sentido';
  melhor.textContent = ROTULO_MELHOR;

  const lista = document.createElement('ol');
  lista.dataset.colinhaLista = '';
  lista.className = 'colinha__lista';
  for (const linha of LINHAS_COLINHA) {
    lista.append(criarLinha(linha));
  }

  const pior = document.createElement('p');
  pior.dataset.colinhaSentido = 'pior';
  pior.className = 'colinha__sentido';
  pior.textContent = ROTULO_PIOR;

  aside.append(cabeca, melhor, lista, pior);

  const btnReabrir = document.createElement('button');
  btnReabrir.type = 'button';
  btnReabrir.dataset.colinhaAcao = 'reabrir';
  btnReabrir.className = 'colinha__reabrir';
  btnReabrir.textContent = ROTULO_COLINHA;
  btnReabrir.hidden = true;
  btnReabrir.tabIndex = -1;
  btnReabrir.addEventListener('click', aoReabrir);

  return { aside, ocultar: btnOcultar, reabrir: btnReabrir };
}

export function montarColinha(host) {
  if (typeof document === 'undefined') {
    return { ok: false };
  }
  try {
    if (!host) {
      return { ok: false };
    }
    removerRestos(host);
    visita = estadoInicial();
    const montados = montarNos();
    const hud = typeof host.querySelector === 'function' ? host.querySelector('#hud') : null;
    if (hud && hud.parentNode === host) {
      hud.after(montados.aside, montados.reabrir);
    } else {
      host.append(montados.aside, montados.reabrir);
    }
    nos = montados;
    ultimaLargura = typeof window !== 'undefined' ? Number(window.innerWidth) || 1280 : 1280;
    aplicarUi(ultimaLargura);
    return { ok: true, el: montados.aside };
  } catch {
    try {
      if (host) removerRestos(host);
    } catch {
      nos = { aside: null, ocultar: null, reabrir: null };
    }
    nos = { aside: null, ocultar: null, reabrir: null };
    return { ok: false };
  }
}

export function sincronizarViewport(width) {
  ultimaLargura = Number(width);
  aplicarUi(ultimaLargura);
}
