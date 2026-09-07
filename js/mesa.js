/**
 * Sessùo da mesa + FSM do HUD (exportùvel sem DOM).
 * MUST NOT escrever localStorage. MUST NOT criar baralho/motor/quiz/storage.
 */

import { unlock as unlockAudio, play as playAudio } from './audio.js';
import {
  aplicarVisibilidade,
  CARTAS_JOGO_STUB,
  criarBurnCenico,
  criarElementoCarta,
} from './carta.js';
import {
  APELIDOS,
  CATEGORIA_CORRETA_ROTULO,
  COPY,
  criarOpcoesCategoria,
  criarOpcoesVencedor,
  enunciadoDoPasso,
  PASSOS,
  rotuloVencedorCorreto,
} from './quiz-stub.js';

export const EVENTOS = Object.freeze({
  INICIAR_MAO: 'INICIAR_MAO',
  PROXIMA_MAO: 'PROXIMA_MAO',
  CONTINUAR: 'CONTINUAR',
  ESCOLHER_OPCAO: 'ESCOLHER_OPCAO',
  FIM_ANIMACAO_STREET: 'FIM_ANIMACAO_STREET',
  FALHA_DEAL: 'FALHA_DEAL',
});

export function tetoStreetMs(indiceMaoSessao, movimentoReduzido) {
  if (movimentoReduzido) return 0;
  return indiceMaoSessao <= 1 ? 2000 : 1000;
}

function hudOciosa() {
  return {
    estado: 'ociosa',
    enunciado: null,
    linhaProposito: COPY.linhaProposito,
    opcoes: [],
    cta: { nome: COPY.ctaNovaMao },
    feedback: null,
    categoriasIdentificadas: { voce: null, adversarioA: null, adversarioB: null },
  };
}

function cartasJogo() {
  return CARTAS_JOGO_STUB.map((carta, indice) => ({
    idVisual: `jogo-${indice}`,
    rank: carta.rank,
    naipe: carta.suit,
    visibilidade: 'verso',
    papel: indice < 6 ? 'hole' : 'comunitaria',
    animando: true,
  }));
}

function assentosVazios() {
  return [
    { id: 'voce', apelido: APELIDOS.voce, hole: [null, null] },
    { id: 'adversarioA', apelido: APELIDOS.adversarioA, hole: [null, null] },
    { id: 'adversarioB', apelido: APELIDOS.adversarioB, hole: [null, null] },
  ];
}

function boardVazio() {
  return {
    slots: [1, 2, 3, 4, 5].map((indice) => ({ indice, carta: null })),
    burnVisivel: null,
  };
}

export function criarSessao() {
  return {
    hud: hudOciosa(),
    assentos: assentosVazios(),
    board: boardVazio(),
    pote: { modo: 'centro', vencedoresVisuais: [] },
    mao: null,
    indiceMaoSessao: 0,
    movimentoReduzido: false,
  };
}

function entrarDeal(sessao) {
  sessao.hud.estado = 'deal';
  sessao.hud.enunciado = null;
  sessao.hud.linhaProposito = null;
  sessao.hud.opcoes = [];
  sessao.hud.cta = null;
  sessao.hud.feedback = null;
}

function novaMao(sessao) {
  sessao.indiceMaoSessao += 1;
  sessao.pote = { modo: 'centro', vencedoresVisuais: [] };
  sessao.board = boardVazio();
  sessao.assentos = assentosVazios();
  sessao.hud.categoriasIdentificadas = {
    voce: null,
    adversarioA: null,
    adversarioB: null,
  };
  sessao.mao = {
    cartasJogo: cartasJogo(),
    street: 'preflop',
    passo: null,
    cartasDaStreetPousadas: false,
    viradaShowdownConcluida: false,
    falhaDeal: false,
  };
  entrarDeal(sessao);
}

function voltarOciosa(sessao, { reverterIndice = false } = {}) {
  if (reverterIndice && sessao.indiceMaoSessao > 0) {
    sessao.indiceMaoSessao -= 1;
  }
  sessao.mao = null;
  sessao.assentos = assentosVazios();
  sessao.board = boardVazio();
  sessao.pote = { modo: 'centro', vencedoresVisuais: [] };
  sessao.hud = hudOciosa();
}

function sentarHoles(sessao) {
  const cartas = sessao.mao.cartasJogo;
  const mapa = {
    voce: [cartas[0], cartas[1]],
    adversarioA: [cartas[2], cartas[3]],
    adversarioB: [cartas[4], cartas[5]],
  };
  for (const assento of sessao.assentos) {
    const par = mapa[assento.id];
    par[0].animando = false;
    par[1].animando = false;
    par[0].visibilidade = assento.id === 'voce' ? 'face' : 'verso';
    par[1].visibilidade = assento.id === 'voce' ? 'face' : 'verso';
    assento.hole = par;
  }
  sessao.mao.cartasDaStreetPousadas = true;
  sessao.mao.street = 'preflop';
}

function preencherSlots(sessao, de, ate, visibilidade = 'face') {
  const base = 5;
  for (let i = de; i <= ate; i += 1) {
    const carta = sessao.mao.cartasJogo[base + i];
    carta.animando = false;
    carta.visibilidade = visibilidade;
    sessao.board.slots[i - 1].carta = carta;
  }
}

function abrirPergunta(sessao, passo) {
  sessao.mao.passo = passo;
  sessao.mao.cartasDaStreetPousadas = true;
  sessao.hud.estado = 'perguntando';
  sessao.hud.enunciado = enunciadoDoPasso(passo);
  sessao.hud.linhaProposito = null;
  sessao.hud.cta = null;
  sessao.hud.feedback = null;
  sessao.hud.opcoes =
    passo === PASSOS.river_vencedor
      ? criarOpcoesVencedor(sessao.indiceMaoSessao)
      : criarOpcoesCategoria();
}

function abrirSkip(sessao, passo) {
  sessao.mao.passo = passo;
  sessao.hud.estado = 'sem_upgrade';
  sessao.hud.enunciado = null;
  sessao.hud.opcoes = [];
  sessao.hud.cta = { nome: COPY.ctaContinuar };
  sessao.hud.feedback = 'acerto';
}

function abrirResultado(sessao) {
  const split = sessao.indiceMaoSessao >= 2;
  sessao.hud.estado = 'resultado';
  sessao.hud.enunciado = null;
  sessao.hud.opcoes = [];
  sessao.hud.cta = { nome: COPY.ctaProximaMao };
  sessao.hud.feedback = 'acerto';
  sessao.hud.categoriasIdentificadas = {
    voce: CATEGORIA_CORRETA_ROTULO,
    adversarioA: CATEGORIA_CORRETA_ROTULO,
    adversarioB: CATEGORIA_CORRETA_ROTULO,
  };
  sessao.pote = {
    modo: split ? 'split' : 'para_vencedor',
    vencedoresVisuais: split ? ['voce', 'adversarioA'] : ['voce'],
  };
}

function avancarAcerto(sessao) {
  const { passo } = sessao.mao;
  if (passo === PASSOS.flop_hero) {
    abrirSkip(sessao, PASSOS.flop_skip);
    return;
  }
  if (passo === PASSOS.turn_hero) {
    abrirSkip(sessao, PASSOS.turn_skip);
    return;
  }
  if (passo === PASSOS.river_hero) {
    abrirPergunta(sessao, PASSOS.river_a);
    sessao.hud.feedback = 'acerto';
    return;
  }
  if (passo === PASSOS.river_a) {
    abrirPergunta(sessao, PASSOS.river_b);
    sessao.hud.feedback = 'acerto';
    return;
  }
  if (passo === PASSOS.river_b) {
    abrirPergunta(sessao, PASSOS.river_vencedor);
    sessao.hud.feedback = 'acerto';
    return;
  }
  if (passo === PASSOS.river_vencedor) {
    abrirResultado(sessao);
  }
}

function fimAnimacao(sessao, etapa) {
  if (!sessao.mao || sessao.hud.estado !== 'deal') return;
  sessao.board.burnVisivel = null;
  if (etapa === 'holes') {
    sentarHoles(sessao);
    return;
  }
  if (etapa === 'flop') {
    sessao.mao.street = 'flop';
    preencherSlots(sessao, 1, 3);
    abrirPergunta(sessao, PASSOS.flop_hero);
    return;
  }
  if (etapa === 'turn') {
    sessao.mao.street = 'turn';
    preencherSlots(sessao, 4, 4);
    abrirPergunta(sessao, PASSOS.turn_hero);
    return;
  }
  if (etapa === 'river') {
    sessao.mao.street = 'river';
    preencherSlots(sessao, 5, 5);
    sessao.mao.cartasDaStreetPousadas = true;
    sessao.mao.viradaShowdownConcluida = false;
    return;
  }
  if (etapa === 'showdown') {
    for (const assento of sessao.assentos) {
      if (assento.id === 'voce') continue;
      for (const carta of assento.hole) {
        if (carta) carta.visibilidade = 'face';
      }
    }
    sessao.mao.viradaShowdownConcluida = true;
    abrirPergunta(sessao, PASSOS.river_hero);
  }
}

function escolherOpcao(sessao, id) {
  if (sessao.hud.estado !== 'perguntando') return;
  const opcao = sessao.hud.opcoes.find((item) => item.id === id);
  if (!opcao || opcao.desabilitada) return;
  if (!opcao.correta) {
    opcao.desabilitada = true;
    opcao.estadoVisual = 'errado_desabilitado';
    sessao.hud.feedback = 'erro';
    return;
  }
  opcao.estadoVisual = 'correto';
  sessao.hud.feedback = 'acerto';
  avancarAcerto(sessao);
}

function continuar(sessao) {
  if (sessao.hud.estado !== 'sem_upgrade' || !sessao.mao) return;
  if (sessao.mao.passo === PASSOS.flop_skip) {
    sessao.mao.street = 'turn';
    sessao.mao.passo = null;
    sessao.mao.cartasDaStreetPousadas = false;
    sessao.board.burnVisivel = { papel: 'burn_cenico', visibilidade: 'verso' };
    entrarDeal(sessao);
    return;
  }
  if (sessao.mao.passo === PASSOS.turn_skip) {
    sessao.mao.street = 'river';
    sessao.mao.passo = null;
    sessao.mao.cartasDaStreetPousadas = false;
    sessao.mao.viradaShowdownConcluida = false;
    sessao.board.burnVisivel = { papel: 'burn_cenico', visibilidade: 'verso' };
    entrarDeal(sessao);
  }
}

export function aplicar(sessao, evento, payload = {}) {
  switch (evento) {
    case EVENTOS.INICIAR_MAO:
      if (sessao.hud.estado !== 'ociosa') return sessao;
      novaMao(sessao);
      return sessao;
    case EVENTOS.PROXIMA_MAO:
      if (sessao.hud.estado !== 'resultado') return sessao;
      novaMao(sessao);
      return sessao;
    case EVENTOS.CONTINUAR:
      continuar(sessao);
      return sessao;
    case EVENTOS.ESCOLHER_OPCAO:
      escolherOpcao(sessao, payload.id);
      return sessao;
    case EVENTOS.FIM_ANIMACAO_STREET:
      fimAnimacao(sessao, payload.etapa);
      return sessao;
    case EVENTOS.FALHA_DEAL:
      if (sessao.hud.estado === 'deal') {
        voltarOciosa(sessao, { reverterIndice: true });
      }
      return sessao;
    default:
      return sessao;
  }
}

function ambienteBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function reduzirMovimento() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function esperar(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function esperarAnimacao(el, fallbackMs) {
  if (!el || fallbackMs <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    let ok = false;
    const done = () => {
      if (ok) return;
      ok = true;
      el.removeEventListener('animationend', done);
      resolve();
    };
    el.addEventListener('animationend', done);
    setTimeout(done, fallbackMs + 40);
  });
}

let sessao = criarSessao();
let ritualTrava = false;

function $(sel, root = document) {
  return root.querySelector(sel);
}

function $all(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

function holeEl(seat, index) {
  return document.querySelector(`[data-seat="${seat}"] [data-hole="${index}"]`);
}

function slotEl(n) {
  return document.querySelector(`[data-slot="${n}"]`);
}

function limparCartas() {
  for (const el of $all('.carta')) el.remove();
  const burn = $('[data-burn]');
  if (burn) burn.replaceChildren();
}

function pintarCarta(host, spec, visibilidade) {
  if (!host) return null;
  const el = criarElementoCarta({
    rank: spec.rank,
    suit: spec.naipe ?? spec.suit,
    papel: spec.papel,
    visibilidade,
  });
  host.replaceChildren(el);
  return el;
}

function sentarHolesNoDom() {
  const ordem = [
    ['voce', 0, 1, 'face'],
    ['adversarioA', 2, 3, 'verso'],
    ['adversarioB', 4, 5, 'verso'],
  ];
  for (const [seat, a, b, vis] of ordem) {
    const ca = sessao.mao.cartasJogo[a];
    const cb = sessao.mao.cartasJogo[b];
    pintarCarta(holeEl(seat, 0), ca, vis);
    pintarCarta(holeEl(seat, 1), cb, vis);
  }
}

function sentarBoardNoDom(de, ate) {
  for (let i = de; i <= ate; i += 1) {
    const carta = sessao.mao.cartasJogo[5 + i];
    pintarCarta(slotEl(i), carta, 'face');
  }
}

function virarAdversariosNoDom() {
  for (const seat of ['adversarioA', 'adversarioB']) {
    for (const index of [0, 1]) {
      const carta = holeEl(seat, index)?.querySelector('.carta');
      aplicarVisibilidade(carta, 'face');
    }
  }
}

async function voar(el, destino, origem, ms) {
  if (!el || !destino) return;
  destino.append(el);
  if (sessao.movimentoReduzido || ms <= 0) {
    el.classList.remove('carta--voando');
    return;
  }
  const a = origem.getBoundingClientRect();
  const b = destino.getBoundingClientRect();
  el.style.setProperty('--from-x', `${a.left - b.left}px`);
  el.style.setProperty('--from-y', `${a.top - b.top}px`);
  el.style.setProperty('--deal-ms', `${ms}ms`);
  el.classList.add('carta--voando');
  await esperarAnimacao(el, ms);
  el.classList.remove('carta--voando');
}

async function comTeto(trabalho) {
  const ms = tetoStreetMs(sessao.indiceMaoSessao, sessao.movimentoReduzido);
  if (ms === 0) {
    await trabalho(0);
    return;
  }
  await Promise.race([trabalho(ms), esperar(ms)]);
}

async function mostrarBurn(ms) {
  const host = $('[data-burn]');
  if (!host) return;
  const burn = criarBurnCenico();
  host.replaceChildren(burn);
  playAudio('deal');
  if (!sessao.movimentoReduzido && ms > 0) {
    await esperar(Math.min(280, ms * 0.22));
  }
  host.replaceChildren();
}

function atualizarPote() {
  const pote = $('[data-pote]');
  if (!pote) return;
  pote.dataset.modo = sessao.pote.modo;
  const comum = pote.querySelector('[data-para="comum"]');
  const voce = pote.querySelector('[data-para="voce"]');
  const a = pote.querySelector('[data-para="adversarioA"]');
  if (sessao.pote.modo === 'split') {
    if (comum) comum.hidden = true;
    if (voce) voce.hidden = false;
    if (a) a.hidden = false;
  } else {
    if (comum) comum.hidden = false;
    if (voce) voce.hidden = true;
    if (a) a.hidden = true;
  }
}

function textoFeedback() {
  if (sessao.hud.feedback === 'acerto') return COPY.acerto;
  if (sessao.hud.feedback === 'erro') return COPY.erro;
  return '';
}

function renderHud() {
  const hud = $('#hud');
  if (!hud) return;
  hud.dataset.hudEstado = sessao.hud.estado;
  hud.replaceChildren();

  const linha = document.createElement('p');
  linha.className = 'hud__linha';

  const feedback = document.createElement('p');
  feedback.className = 'hud__feedback';
  const fb = textoFeedback();
  if (fb && sessao.hud.estado === 'perguntando') {
    feedback.dataset.kind = sessao.hud.feedback;
    feedback.textContent = fb;
  }

  if (sessao.hud.estado === 'ociosa') {
    linha.textContent = COPY.linhaProposito;
    hud.append(linha, acoesCta(COPY.ctaNovaMao));
    return;
  }

  if (sessao.hud.estado === 'deal') {
    linha.textContent = '';
    hud.append(linha);
    return;
  }

  if (sessao.hud.estado === 'perguntando') {
    linha.textContent = sessao.hud.enunciado ?? '';
    hud.append(linha, feedback, gradeOpcoes());
    focarPrimeiroHabilitado(hud);
    return;
  }

  if (sessao.hud.estado === 'sem_upgrade') {
    linha.textContent = COPY.semUpgrade;
    hud.append(linha, acoesCta(COPY.ctaContinuar));
    focarPrimeiroHabilitado(hud);
    return;
  }

  if (sessao.hud.estado === 'resultado') {
    const bloco = document.createElement('div');
    bloco.className = 'hud__resultado';
    const venceu = document.createElement('p');
    venceu.textContent =
      sessao.pote.modo === 'split'
        ? `${rotuloVencedorCorreto(sessao.indiceMaoSessao)} dividem o pote.`
        : `${rotuloVencedorCorreto(sessao.indiceMaoSessao)} levou o pote.`;
    const cats = document.createElement('p');
    const c = sessao.hud.categoriasIdentificadas;
    cats.textContent = `${APELIDOS.voce}: ${c.voce} ù ${APELIDOS.adversarioA}: ${c.adversarioA} ù ${APELIDOS.adversarioB}: ${c.adversarioB}`;
    bloco.append(venceu, cats);
    hud.append(bloco, acoesCta(COPY.ctaProximaMao));
    focarPrimeiroHabilitado(hud);
  }
}

function acoesCta(nome) {
  const wrap = document.createElement('div');
  wrap.className = 'hud__acoes';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn--cta';
  btn.dataset.cta = nome;
  btn.textContent = nome;
  btn.addEventListener('click', () => onCta(nome));
  wrap.append(btn);
  return wrap;
}

function gradeOpcoes() {
  const wrap = document.createElement('div');
  wrap.className = 'hud__opcoes';
  for (const opcao of sessao.hud.opcoes) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--opcao';
    btn.dataset.opcaoId = opcao.id;
    btn.dataset.estado = opcao.estadoVisual;
    btn.textContent = opcao.rotulo;
    btn.disabled = opcao.desabilitada;
    btn.addEventListener('click', () => onOpcao(opcao.id));
    wrap.append(btn);
  }
  return wrap;
}

function focarPrimeiroHabilitado(hud) {
  const alvo = hud.querySelector('button:not(:disabled)');
  if (alvo) alvo.focus();
}

function flashHud(kind) {
  const hud = $('#hud');
  if (!hud) return;
  hud.classList.remove('hud--flash-acerto', 'hud--flash-erro');
  hud.classList.add(kind === 'acerto' ? 'hud--flash-acerto' : 'hud--flash-erro');
  setTimeout(() => {
    hud.classList.remove('hud--flash-acerto', 'hud--flash-erro');
  }, 420);
}

async function ritualHoles() {
  const origem = $('#sapato') || $('#mesa');
  const teto = tetoStreetMs(sessao.indiceMaoSessao, sessao.movimentoReduzido);
  playAudio('shuffle');
  const destinos = [
    ['voce', 0, 0],
    ['voce', 1, 1],
    ['adversarioA', 0, 2],
    ['adversarioA', 1, 3],
    ['adversarioB', 0, 4],
    ['adversarioB', 1, 5],
  ];
  await comTeto(async (ms) => {
    const cada = destinos.length ? Math.max(90, Math.floor((ms || 0) / destinos.length)) : 0;
    for (const [seat, hole, idx] of destinos) {
      const spec = sessao.mao.cartasJogo[idx];
      const vis = seat === 'voce' ? 'verso' : 'verso';
      const el = criarElementoCarta({
        rank: spec.rank,
        suit: spec.naipe,
        papel: 'hole',
        visibilidade: vis,
      });
      playAudio('deal');
      await voar(el, holeEl(seat, hole), origem, cada);
      if (seat === 'voce') aplicarVisibilidade(el, 'face');
    }
  });
  if (teto === 0) sentarHolesNoDom();
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'holes' });
}

async function ritualFlop() {
  entrarDealVisual();
  const origem = $('#sapato') || $('#mesa');
  playAudio('flop');
  await comTeto(async (ms) => {
    const cada = Math.max(80, Math.floor((ms || 0) / 3));
    for (let i = 1; i <= 3; i += 1) {
      const spec = sessao.mao.cartasJogo[5 + i];
      const el = criarElementoCarta({
        rank: spec.rank,
        suit: spec.naipe,
        papel: 'comunitaria',
        visibilidade: 'verso',
      });
      await voar(el, slotEl(i), origem, cada);
      aplicarVisibilidade(el, 'face');
    }
  });
  sentarBoardNoDom(1, 3);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'flop' });
  renderHud();
}

async function ritualTurnOuRiver(etapa, slot) {
  entrarDealVisual();
  const origem = $('#sapato') || $('#mesa');
  const teto = tetoStreetMs(sessao.indiceMaoSessao, sessao.movimentoReduzido);
  await comTeto(async (ms) => {
    await mostrarBurn(ms);
    const spec = sessao.mao.cartasJogo[5 + slot];
    const el = criarElementoCarta({
      rank: spec.rank,
      suit: spec.naipe,
      papel: 'comunitaria',
      visibilidade: 'verso',
    });
    playAudio('deal');
    await voar(el, slotEl(slot), origem, Math.max(120, (ms || 0) * 0.45));
    aplicarVisibilidade(el, 'face');
    if (etapa === 'river') {
      playAudio('showdown');
      virarAdversariosNoDom();
      if (!sessao.movimentoReduzido) {
        await esperar(Math.min(420, Math.max(160, (ms || 0) * 0.25)));
      }
    }
  });
  sentarBoardNoDom(slot, slot);
  if (etapa === 'river') {
    aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
    aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  } else {
    aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  }
  renderHud();
  void teto;
}

function entrarDealVisual() {
  sessao.hud.estado = 'deal';
  sessao.hud.opcoes = [];
  sessao.hud.cta = null;
  renderHud();
}

async function iniciarMao({ proxima = false } = {}) {
  if (ritualTrava) return;
  ritualTrava = true;
  try {
    sessao.movimentoReduzido = reduzirMovimento();
    await unlockAudio();
    const clube = $('#clube');
    aplicar(sessao, proxima ? EVENTOS.PROXIMA_MAO : EVENTOS.INICIAR_MAO);
    if (clube) {
      clube.dataset.mao = String(sessao.indiceMaoSessao);
      clube.classList.toggle('clube--mao-rapida', sessao.indiceMaoSessao >= 2);
    }
    atualizarPote();
    if (proxima) {
      await recolherCartas();
    }
    limparCartas();
    atualizarPote();
    renderHud();
    if (!sessao.mao) {
      aplicar(sessao, EVENTOS.FALHA_DEAL);
      renderHud();
      return;
    }
    await ritualHoles();
    await ritualFlop();
  } catch {
    aplicar(sessao, EVENTOS.FALHA_DEAL);
    limparCartas();
    atualizarPote();
    renderHud();
  } finally {
    ritualTrava = false;
  }
}

async function recolherCartas() {
  const origem = $('#sapato') || $('#mesa');
  const cartas = $all('.carta');
  if (sessao.movimentoReduzido || cartas.length === 0) {
    limparCartas();
    return;
  }
  playAudio('shuffle');
  const dest = origem.getBoundingClientRect();
  await Promise.all(
    cartas.map((el) => {
      const box = el.getBoundingClientRect();
      el.style.setProperty('--to-x', `${dest.left - box.left}px`);
      el.style.setProperty('--to-y', `${dest.top - box.top}px`);
      el.style.setProperty('--deal-ms', '420ms');
      el.classList.add('carta--recolher');
      return esperarAnimacao(el, 420);
    }),
  );
  limparCartas();
}

function onCta(nome) {
  if (nome === COPY.ctaNovaMao) {
    void iniciarMao({ proxima: false });
    return;
  }
  if (nome === COPY.ctaProximaMao) {
    void iniciarMao({ proxima: true });
    return;
  }
  if (nome === COPY.ctaContinuar) {
    const passo = sessao.mao?.passo;
    aplicar(sessao, EVENTOS.CONTINUAR);
    renderHud();
    if (passo === PASSOS.flop_skip) void ritualTurnOuRiver('turn', 4);
    if (passo === PASSOS.turn_skip) void ritualTurnOuRiver('river', 5);
  }
}

function onOpcao(id) {
  const antes = sessao.hud.estado;
  const passo = sessao.mao?.passo;
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id });
  const depois = sessao.hud.estado;
  if (sessao.hud.feedback === 'erro') {
    playAudio('erro');
    flashHud('erro');
  } else if (sessao.hud.feedback === 'acerto') {
    playAudio('acerto');
    flashHud('acerto');
  }
  renderHud();
  atualizarPote();
  void antes;
  void passo;
  void depois;
}

export function bootMesa() {
  const clube = $('#clube');
  if (!clube || ! $('#hud')) return;
  if (window.location.protocol === 'file:') {
    clube.classList.add('clube--file');
    const aviso = $('.aviso-file');
    if (aviso) aviso.hidden = false;
  }
  sessao = criarSessao();
  sessao.movimentoReduzido = reduzirMovimento();
  renderHud();
  atualizarPote();
}

if (ambienteBrowser()) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootMesa, { once: true });
  } else {
    queueMicrotask(bootMesa);
  }
}
