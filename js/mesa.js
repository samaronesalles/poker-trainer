/**
 * Sess�o da mesa + FSM do HUD (export�vel sem DOM).
 * Consome js/baralho.js (RN-044), js/quiz.js e js/storage.js.
 * MUST NOT chamar localStorage direto. MUST NOT importar js/motor.js.
 */

import { unlock as unlockAudio, play as playAudio } from './audio.js';
import {
  criarMisturaVisita,
  misturarCursor,
  montarMao,
  validarPermutacao,
} from './baralho.js';
import { aplicarVisibilidade, criarBurnCenico, criarElementoCarta } from './carta.js';
import {
  assentoEmFoco,
  chavesCartasVencedoras,
  composicaoDoViewport,
  offsetPote,
  streetVisivel,
} from './layout.js';
import {
  APELIDOS,
  COPY,
  PASSOS,
  apresentarPergunta,
  avaliarUnica,
  alternarOpcao,
  confirmarMultipla,
  decidirAposShowdown,
  decidirPosMaoAtual,
  modoDoPasso,
  prepararShowdown,
  revelacaoCompleta,
  rotuloVencedor,
} from './quiz.js';
import { criarStorage } from './storage.js';

export const LINHA_ERRO_MONTAGEM = 'N\u00e3o foi poss\u00edvel embaralhar. Tente de novo.';
export const BEAT_ACERTO_MS = 400;
export const TETO_SHOWDOWN_EXTRA_MS = 1000;

export const EVENTOS = Object.freeze({
  INICIAR_MAO: 'INICIAR_MAO',
  PROXIMA_MAO: 'PROXIMA_MAO',
  CONTINUAR: 'CONTINUAR',
  ESCOLHER_OPCAO: 'ESCOLHER_OPCAO',
  ALTERNAR_OPCAO: 'ALTERNAR_OPCAO',
  CONFIRMAR: 'CONFIRMAR',
  FIM_BEAT_ACERTO: 'FIM_BEAT_ACERTO',
  FIM_ANIMACAO_STREET: 'FIM_ANIMACAO_STREET',
  FALHA_DEAL: 'FALHA_DEAL',
  FALHA_MONTAGEM: 'FALHA_MONTAGEM',
  FALHA_ENUMERACAO: 'FALHA_ENUMERACAO',
});

export function duracaoBeatMs(movimentoReduzido) {
  return movimentoReduzido ? 0 : BEAT_ACERTO_MS;
}

export function tetoStreetMs(indiceMaoSessao, movimentoReduzido) {
  if (movimentoReduzido) return 0;
  return indiceMaoSessao <= 1 ? 2000 : 1000;
}

function hudOciosa() {
  return {
    estado: 'ociosa',
    enunciado: null,
    linhaProposito: COPY.linhaProposito,
    linhaErro: null,
    hint: null,
    street: null,
    opcoes: [],
    cta: { nome: COPY.ctaNovaMao },
    feedback: null,
    feedbackTexto: null,
    categoriasIdentificadas: { voce: null, adversarioA: null, adversarioB: null },
  };
}

function clonarCartasJogo(cartasJogo) {
  return cartasJogo.map((carta, indice) => ({
    idVisual: carta.idVisual ?? `jogo-${indice}`,
    rank: carta.rank,
    naipe: carta.naipe,
    indicePermutacao: carta.indicePermutacao ?? indice,
    visibilidade: carta.visibilidade ?? 'verso',
    papel: carta.papel ?? (indice < 6 ? 'hole' : 'comunitaria'),
    animando: true,
  }));
}

function congelarPermutacao(permutacao) {
  return Object.freeze(
    permutacao.map((carta) => Object.freeze({ rank: carta.rank, naipe: carta.naipe })),
  );
}

function payloadMontagemOk(payload) {
  if (!payload || !Array.isArray(payload.cartasJogo) || payload.cartasJogo.length !== 11) {
    return false;
  }
  if (!Array.isArray(payload.permutacao) || validarPermutacao(payload.permutacao) !== 'ok') {
    return false;
  }
  const chaves = new Set();
  for (const carta of payload.cartasJogo) {
    if (!carta?.rank || !carta?.naipe) return false;
    chaves.add(`${carta.rank}-${carta.naipe}`);
  }
  return chaves.size === 11;
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

export function criarSessao({ storage } = {}) {
  const store = storage ?? criarStorage();
  return {
    hud: hudOciosa(),
    assentos: assentosVazios(),
    board: boardVazio(),
    pote: { modo: 'centro', vencedoresVisuais: [] },
    mao: null,
    indiceMaoSessao: 0,
    movimentoReduzido: false,
    misturaVisita: criarMisturaVisita(),
    montagemEmCurso: false,
    storage: store,
    evolucao: store.ler(),
  };
}

function entrarDeal(sessao) {
  sessao.hud.estado = 'deal';
  sessao.hud.enunciado = null;
  sessao.hud.linhaProposito = null;
  sessao.hud.linhaErro = null;
  sessao.hud.hint = null;
  sessao.hud.street = streetVisivel(sessao.mao?.street);
  sessao.hud.opcoes = [];
  sessao.hud.cta = null;
  sessao.hud.feedback = null;
  sessao.hud.feedbackTexto = null;
}

function novaMao(sessao, payload) {
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
    permutacao: congelarPermutacao(payload.permutacao),
    cartasJogo: clonarCartasJogo(payload.cartasJogo),
    street: 'preflop',
    passo: null,
    faseTentativa: null,
    modo: null,
    corretaUnica: null,
    conjuntoCorreto: [],
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

function falhaMontagem(sessao) {
  sessao.mao = null;
  sessao.assentos = assentosVazios();
  sessao.board = boardVazio();
  sessao.pote = { modo: 'centro', vencedoresVisuais: [] };
  sessao.hud = hudOciosa();
  sessao.hud.linhaErro = LINHA_ERRO_MONTAGEM;
}

function falhaEnumeracao(sessao) {
  sessao.mao = null;
  sessao.assentos = assentosVazios();
  sessao.board = boardVazio();
  sessao.pote = { modo: 'centro', vencedoresVisuais: [] };
  sessao.hud = hudOciosa();
  sessao.hud.linhaErro = COPY.linhaErroEnumeracao;
}

function tentarIniciar(sessao, payload) {
  if (sessao.montagemEmCurso && !payload?.aceitarMontagem) return;
  if (!payloadMontagemOk(payload)) return;
  novaMao(sessao, payload);
}

function sentarHoles(sessao) {
  const cartas = sessao.mao.cartasJogo;
  const mapa = {
    adversarioA: [cartas[0], cartas[1]],
    adversarioB: [cartas[2], cartas[3]],
    voce: [cartas[4], cartas[5]],
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
  apresentarPergunta(sessao, passo);
  if (
    (passo === PASSOS.flop_hero || passo === PASSOS.turn_hero) &&
    decidirPosMaoAtual(sessao) === 'falha'
  ) {
    falhaEnumeracao(sessao);
  }
}

function abrirSkip(sessao, passo) {
  sessao.mao.passo = passo;
  sessao.hud.estado = 'sem_upgrade';
  sessao.hud.enunciado = null;
  sessao.hud.hint = null;
  sessao.hud.street = streetVisivel(sessao.mao?.street);
  sessao.hud.opcoes = [];
  sessao.hud.cta = { nome: COPY.ctaContinuar };
  sessao.hud.feedback = 'acerto';
}

function abrirResultado(sessao) {
  const showdown = sessao.mao.showdown;
  const vencedores = [...(showdown?.vencedores ?? [])];
  const split = vencedores.length >= 2;
  sessao.hud.estado = 'resultado';
  sessao.hud.enunciado = null;
  sessao.hud.hint = null;
  sessao.hud.street = streetVisivel('river');
  sessao.hud.opcoes = [];
  sessao.hud.cta = { nome: COPY.ctaProximaMao };
  sessao.hud.feedback = 'acerto';
  sessao.hud.categoriasIdentificadas = {
    voce: showdown?.maos?.voce?.rotulo ?? null,
    adversarioA: showdown?.maos?.adversarioA?.rotulo ?? null,
    adversarioB: showdown?.maos?.adversarioB?.rotulo ?? null,
  };
  sessao.pote = {
    modo: split ? 'split' : 'para_vencedor',
    vencedoresVisuais: vencedores,
  };
}

function abrirStreetSeguinte(sessao, street) {
  sessao.mao.street = street;
  sessao.mao.passo = null;
  sessao.mao.faseTentativa = null;
  sessao.mao.cartasDaStreetPousadas = false;
  if (street === 'river') {
    sessao.mao.viradaShowdownConcluida = false;
  }
  sessao.board.burnVisivel = { papel: 'burn_cenico', visibilidade: 'verso' };
  entrarDeal(sessao);
}

// Cad�ncia 005: ap�s a 5.3, decidirPosMaoAtual escolhe pergunta real, skip ou aborto.
function decidirAposMaoAtual(sessao, passoUpgrade, passoSkip) {
  const decisao = decidirPosMaoAtual(sessao);
  if (decisao === 'pergunta') {
    abrirPergunta(sessao, passoUpgrade);
    return;
  }
  if (decisao === 'skip') {
    abrirSkip(sessao, passoSkip);
    return;
  }
  falhaEnumeracao(sessao);
}

function avancarAcerto(sessao) {
  const { passo } = sessao.mao;
  if (passo === PASSOS.flop_hero) {
    decidirAposMaoAtual(sessao, PASSOS.flop_upgrade, PASSOS.flop_skip);
    return;
  }
  if (passo === PASSOS.flop_upgrade) {
    abrirStreetSeguinte(sessao, 'turn');
    return;
  }
  if (passo === PASSOS.turn_hero) {
    decidirAposMaoAtual(sessao, PASSOS.turn_upgrade, PASSOS.turn_skip);
    return;
  }
  if (passo === PASSOS.turn_upgrade) {
    abrirStreetSeguinte(sessao, 'river');
    return;
  }
  if (passo === PASSOS.river_hero) {
    abrirPergunta(sessao, PASSOS.river_a);
    return;
  }
  if (passo === PASSOS.river_a) {
    abrirPergunta(sessao, PASSOS.river_b);
    return;
  }
  if (passo === PASSOS.river_b) {
    abrirPergunta(sessao, PASSOS.river_vencedor);
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
    prepararShowdown(sessao);
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
    const decisao = decidirAposShowdown(sessao);
    if (decisao === 'falha') {
      falhaEnumeracao(sessao);
      return;
    }
    if (decisao === 'pendente') {
      return;
    }
    abrirPergunta(sessao, PASSOS.river_hero);
  }
}

function escolherOpcao(sessao, id) {
  avaliarUnica(sessao, id);
}

function continuar(sessao) {
  if (!sessao.mao) return;
  if (
    sessao.hud.estado === 'perguntando' &&
    modoDoPasso(sessao.mao.passo) === 'multipla' &&
    revelacaoCompleta(sessao.hud.opcoes)
  ) {
    avancarAcerto(sessao);
    return;
  }
  if (sessao.hud.estado !== 'sem_upgrade') return;
  if (sessao.mao.passo === PASSOS.flop_skip) {
    abrirStreetSeguinte(sessao, 'turn');
    return;
  }
  if (sessao.mao.passo === PASSOS.turn_skip) {
    abrirStreetSeguinte(sessao, 'river');
  }
}

function fimBeatAcerto(sessao) {
  if (!sessao.mao || sessao.hud.estado !== 'perguntando') return;
  if (sessao.mao.faseTentativa !== 'aguardando_beat') return;
  avancarAcerto(sessao);
}

export function aplicar(sessao, evento, payload = {}) {
  switch (evento) {
    case EVENTOS.INICIAR_MAO:
      if (sessao.hud.estado !== 'ociosa') return sessao;
      tentarIniciar(sessao, payload);
      return sessao;
    case EVENTOS.PROXIMA_MAO:
      if (sessao.hud.estado !== 'resultado') return sessao;
      tentarIniciar(sessao, payload);
      return sessao;
    case EVENTOS.CONTINUAR:
      continuar(sessao);
      return sessao;
    case EVENTOS.ESCOLHER_OPCAO:
      escolherOpcao(sessao, payload.id);
      return sessao;
    case EVENTOS.ALTERNAR_OPCAO:
      alternarOpcao(sessao, payload.id);
      return sessao;
    case EVENTOS.CONFIRMAR:
      confirmarMultipla(sessao);
      return sessao;
    case EVENTOS.FIM_BEAT_ACERTO:
      fimBeatAcerto(sessao);
      return sessao;
    case EVENTOS.FIM_ANIMACAO_STREET:
      fimAnimacao(sessao, payload.etapa);
      return sessao;
    case EVENTOS.FALHA_DEAL:
      if (sessao.hud.estado === 'deal') {
        voltarOciosa(sessao, { reverterIndice: true });
      }
      return sessao;
    case EVENTOS.FALHA_MONTAGEM:
      falhaMontagem(sessao);
      return sessao;
    case EVENTOS.FALHA_ENUMERACAO:
      falhaEnumeracao(sessao);
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
    ['adversarioA', 0, 1, 'verso'],
    ['adversarioB', 2, 3, 'verso'],
    ['voce', 4, 5, 'face'],
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

function resetarOffsetPote(pote) {
  pote.style.setProperty('--pote-dx', '0px');
  pote.style.setProperty('--pote-dy', '0px');
  for (const grupo of pote.querySelectorAll('.pote-grupo')) {
    grupo.style.setProperty('--split-x', '0px');
    grupo.style.setProperty('--split-y', '0px');
  }
}

function aplicarOffsetPote() {
  const pote = $('[data-pote]');
  const boundsEl = $('#mesa');
  if (!pote || !boundsEl) return;
  resetarOffsetPote(pote);
  const modo = sessao.pote.modo;
  const vencedores = sessao.pote.vencedoresVisuais ?? [];
  const bounds = boundsEl.getBoundingClientRect();

  if (modo === 'para_vencedor' && vencedores[0]) {
    const assento = document.querySelector(`[data-seat="${vencedores[0]}"]`);
    if (!assento) return;
    const { dx, dy } = offsetPote({
      origem: pote.getBoundingClientRect(),
      destino: assento.getBoundingClientRect(),
      bounds,
    });
    pote.style.setProperty('--pote-dx', `${dx}px`);
    pote.style.setProperty('--pote-dy', `${dy}px`);
    return;
  }

  if (modo === 'split') {
    for (const id of vencedores) {
      const grupo = pote.querySelector(`.pote-grupo[data-para="${id}"]`);
      const assento = document.querySelector(`[data-seat="${id}"]`);
      if (!grupo || !assento || grupo.hidden) continue;
      const { dx, dy } = offsetPote({
        origem: grupo.getBoundingClientRect(),
        destino: assento.getBoundingClientRect(),
        bounds,
      });
      grupo.style.setProperty('--split-x', `${dx}px`);
      grupo.style.setProperty('--split-y', `${dy}px`);
    }
  }
}

function destacarCartasVencedoras() {
  for (const el of $all('.carta')) {
    delete el.dataset.vencedora;
  }
  if (sessao.hud.estado !== 'resultado') return;
  const chaves = new Set(
    chavesCartasVencedoras(sessao.mao?.showdown, sessao.pote.vencedoresVisuais),
  );
  for (const el of $all('.carta')) {
    const chave = `${el.dataset.rank}-${el.dataset.suit}`;
    if (chaves.has(chave)) el.dataset.vencedora = 'true';
  }
}

function atualizarFocoAssento() {
  const foco = assentoEmFoco(sessao.mao?.passo);
  for (const el of $all('.assento')) {
    if (foco && el.dataset.seat === foco && sessao.hud.estado === 'perguntando') {
      el.dataset.foco = 'true';
    } else {
      delete el.dataset.foco;
    }
  }
}

function aplicarComposicao() {
  const clube = $('#clube');
  if (!clube) return;
  clube.dataset.composicao = composicaoDoViewport({
    width: window.innerWidth,
    height: window.innerHeight,
  });
}

function atualizarPote() {
  const pote = $('[data-pote]');
  if (!pote) return;
  const modo = sessao.pote.modo;
  const vencedores = sessao.pote.vencedoresVisuais ?? [];
  pote.dataset.modo = modo;
  if (modo === 'para_vencedor' && vencedores[0]) {
    pote.dataset.para = vencedores[0];
  } else {
    pote.removeAttribute('data-para');
  }

  const comum = pote.querySelector('[data-para="comum"]');
  const grupos = {
    voce: pote.querySelector('.pote-grupo[data-para="voce"]'),
    adversarioA: pote.querySelector('.pote-grupo[data-para="adversarioA"]'),
    adversarioB: pote.querySelector('.pote-grupo[data-para="adversarioB"]'),
  };

  if (modo === 'split') {
    if (comum) comum.hidden = true;
    for (const id of ['voce', 'adversarioA', 'adversarioB']) {
      if (grupos[id]) grupos[id].hidden = !vencedores.includes(id);
    }
  } else {
    if (comum) comum.hidden = false;
    for (const id of ['voce', 'adversarioA', 'adversarioB']) {
      if (grupos[id]) grupos[id].hidden = true;
    }
  }

  for (const el of $all('.assento')) {
    if (sessao.hud.estado === 'resultado' && vencedores.includes(el.dataset.seat)) {
      el.dataset.vencedor = 'true';
    } else {
      delete el.dataset.vencedor;
    }
  }

  aplicarOffsetPote();
  destacarCartasVencedoras();
  atualizarFocoAssento();
}

function textoFeedback() {
  if (sessao.hud.feedback === 'acerto') return COPY.acerto;
  if (sessao.hud.feedback === 'erro') return COPY.erro;
  return '';
}

function marcadorStreet(street) {
  const nav = document.createElement('p');
  nav.className = 'hud__street';
  nav.setAttribute('aria-label', 'Street da mao');
  const nomes = [
    ['flop', 'Flop'],
    ['turn', 'Turn'],
    ['river', 'River'],
  ];
  for (const [id, rotulo] of nomes) {
    const passo = document.createElement('span');
    passo.dataset.street = id;
    passo.textContent = rotulo;
    if (id === street) passo.setAttribute('aria-current', 'step');
    nav.append(passo);
  }
  return nav;
}

function renderHud() {
  const hud = $('#hud');
  if (!hud) return;
  hud.dataset.hudEstado = sessao.hud.estado;
  hud.dataset.modo = sessao.mao?.modo ?? '';
  const street = sessao.hud.street ?? streetVisivel(sessao.mao?.street);
  if (street) hud.dataset.street = street;
  else hud.removeAttribute('data-street');
  hud.replaceChildren();

  const linha = document.createElement('p');
  linha.className = 'hud__linha';

  const feedback = document.createElement('p');
  feedback.className = 'hud__feedback';
  const fb =
    sessao.hud.estado === 'perguntando' && sessao.hud.feedbackTexto === COPY.revelado
      ? COPY.revelado
      : textoFeedback();
  if (fb && sessao.hud.estado === 'perguntando') {
    feedback.dataset.kind = sessao.hud.feedback === 'erro' ? 'erro' : 'acerto';
    if (sessao.hud.feedbackTexto === COPY.revelado) feedback.dataset.kind = 'revelado';
    feedback.textContent = fb;
  }

  if (sessao.hud.estado === 'ociosa') {
    linha.textContent = sessao.hud.linhaErro ?? COPY.linhaProposito;
    hud.append(linha, acoesCta(COPY.ctaNovaMao));
    return;
  }

  if (sessao.hud.estado === 'deal') {
    if (street) hud.append(marcadorStreet(street));
    linha.textContent = '';
    hud.append(linha);
    return;
  }

  if (sessao.hud.estado === 'perguntando') {
    if (street) hud.append(marcadorStreet(street));
    linha.textContent = sessao.hud.enunciado ?? '';
    hud.append(linha);
    if (sessao.hud.hint) {
      const hint = document.createElement('p');
      hint.className = 'hud__hint';
      hint.textContent = sessao.hud.hint;
      hud.append(hint);
    }
    hud.append(feedback, gradeOpcoes());
    const confirmar =
      sessao.hud.cta?.nome === COPY.ctaConfirmar &&
      sessao.mao?.faseTentativa !== 'aguardando_beat';
    if (confirmar) hud.append(acoesMultipla());
    if (sessao.hud.cta?.nome === COPY.ctaContinuar) {
      hud.append(acoesCta(COPY.ctaContinuar));
    }
    focarPrimeiroHabilitado(hud);
    atualizarFocoAssento();
    return;
  }

  if (sessao.hud.estado === 'sem_upgrade') {
    if (street) hud.append(marcadorStreet(street));
    linha.textContent = COPY.semUpgrade;
    hud.append(linha, acoesCta(COPY.ctaContinuar));
    focarPrimeiroHabilitado(hud);
    return;
  }

  if (sessao.hud.estado === 'resultado') {
    if (street) hud.append(marcadorStreet(street));
    const bloco = document.createElement('div');
    bloco.className = 'hud__resultado';
    const venceu = document.createElement('p');
    venceu.className = 'hud__resultado-pote';
    const rotulo = rotuloVencedor(sessao.mao?.showdown?.vencedorId);
    const split = (sessao.pote.vencedoresVisuais?.length ?? 0) >= 2;
    venceu.textContent = split ? `${rotulo} dividem o pote.` : `${rotulo} levou o pote.`;
    const cats = document.createElement('p');
    cats.className = 'hud__resultado-cats';
    const c = sessao.hud.categoriasIdentificadas;
    const ordem = [
      [APELIDOS.voce, c.voce],
      [APELIDOS.adversarioA, c.adversarioA],
      [APELIDOS.adversarioB, c.adversarioB],
    ];
    for (const [apelido, rotuloCat] of ordem) {
      const item = document.createElement('span');
      item.textContent = `${apelido}: ${rotuloCat}`;
      cats.append(item);
    }
    bloco.append(venceu, cats);
    hud.append(bloco, acoesCta(COPY.ctaProximaMao));
    focarPrimeiroHabilitado(hud);
  }
}

function botaoCta(nome, { primario = true, desabilitado = false } = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = primario ? 'btn btn--cta' : 'btn btn--secundario';
  btn.dataset.cta = nome;
  btn.textContent = nome;
  btn.disabled = desabilitado;
  btn.addEventListener('click', () => onCta(nome));
  return btn;
}

function acoesCta(nome) {
  const wrap = document.createElement('div');
  wrap.className = 'hud__acoes';
  wrap.append(botaoCta(nome));
  return wrap;
}

function acoesMultipla() {
  const wrap = document.createElement('div');
  wrap.className = 'hud__acoes';
  if (sessao.hud.cta?.desabilitado) {
    wrap.append(botaoCta(COPY.ctaNenhuma, { primario: false }));
  }
  wrap.append(
    botaoCta(COPY.ctaConfirmar, {
      desabilitado: sessao.hud.cta?.desabilitado === true,
    }),
  );
  return wrap;
}

function gradeOpcoes() {
  const wrap = document.createElement('div');
  wrap.className = 'hud__opcoes';
  if (sessao.mao?.passo === PASSOS.river_vencedor) {
    wrap.classList.add('hud__opcoes--pote');
  }
  const multipla = modoDoPasso(sessao.mao?.passo) === 'multipla';
  for (const opcao of sessao.hud.opcoes) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--opcao';
    btn.dataset.opcaoId = opcao.id;
    btn.dataset.estado = opcao.estadoVisual;
    btn.disabled = !opcao.ativavel;
    btn.tabIndex = opcao.ativavel ? 0 : -1;
    const rotulo = document.createElement('span');
    rotulo.className = 'btn__rotulo btn__rotulo--longo';
    rotulo.textContent = opcao.rotulo;
    btn.append(rotulo);
    if (opcao.rotuloCurto && opcao.rotuloCurto !== opcao.rotulo) {
      const curto = document.createElement('span');
      curto.className = 'btn__rotulo btn__rotulo--curto';
      curto.textContent = opcao.rotuloCurto;
      btn.append(curto);
    }
    if (opcao.marca === 'acerto' || opcao.marca === 'corte') {
      const marca = document.createElement('span');
      marca.className = 'btn__marca';
      marca.setAttribute('aria-hidden', 'true');
      marca.textContent = opcao.marca === 'acerto' ? '\u2713' : '\u2715';
      btn.append(marca);
    }
    if (multipla) {
      btn.setAttribute('aria-pressed', marcadaVisual(opcao) ? 'true' : 'false');
    }
    btn.addEventListener('click', () => onOpcao(opcao.id));
    wrap.append(btn);
  }
  return wrap;
}

function marcadaVisual(opcao) {
  return (
    opcao.selecionada === true ||
    opcao.estadoVisual === 'selecionada' ||
    opcao.estadoVisual === 'acertada'
  );
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
    ['adversarioA', 0, 0],
    ['adversarioA', 1, 1],
    ['adversarioB', 0, 2],
    ['adversarioB', 1, 3],
    ['voce', 0, 4],
    ['voce', 1, 5],
  ];
  await comTeto(async (ms) => {
    const cada = destinos.length ? Math.max(90, Math.floor((ms || 0) / destinos.length)) : 0;
    for (const [seat, hole, idx] of destinos) {
      const spec = sessao.mao.cartasJogo[idx];
      const el = criarElementoCarta({
        rank: spec.rank,
        suit: spec.naipe,
        papel: 'hole',
        visibilidade: 'verso',
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
  if (sessao.hud.estado === 'ociosa') limparCartas();
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
    if (sessao.hud.estado === 'deal' && sessao.mao) {
      const extra = sessao.movimentoReduzido ? 0 : TETO_SHOWDOWN_EXTRA_MS;
      if (extra > 0) await esperar(extra);
      if (sessao.hud.estado === 'deal' && sessao.mao) {
        prepararShowdown(sessao);
        aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
        if (sessao.hud.estado === 'deal') {
          aplicar(sessao, EVENTOS.FALHA_ENUMERACAO);
        }
      }
    }
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

function aplicarMontagemNaHud(proxima, resultado) {
  const payload = {
    permutacao: resultado.permutacao,
    cartasJogo: resultado.cartasJogo,
    aceitarMontagem: true,
  };
  aplicar(sessao, proxima ? EVENTOS.PROXIMA_MAO : EVENTOS.INICIAR_MAO, payload);
}

async function iniciarMao({ proxima = false } = {}) {
  if (ritualTrava || sessao.montagemEmCurso) return;
  cancelarBeat();
  ritualTrava = true;
  sessao.montagemEmCurso = true;
  try {
    sessao.movimentoReduzido = reduzirMovimento();
    await unlockAudio();
    if (proxima) {
      await recolherCartas();
      limparCartas();
    }
    const resultado = montarMao(sessao.misturaVisita);
    if (resultado.status !== 'ok') {
      aplicar(sessao, EVENTOS.FALHA_MONTAGEM);
      atualizarPote();
      renderHud();
      return;
    }
    aplicarMontagemNaHud(proxima, resultado);
    if (!sessao.mao || sessao.hud.estado !== 'deal') {
      aplicar(sessao, EVENTOS.FALHA_MONTAGEM);
      atualizarPote();
      renderHud();
      return;
    }
    const clube = $('#clube');
    if (clube) {
      clube.dataset.mao = String(sessao.indiceMaoSessao);
      clube.classList.toggle('clube--mao-rapida', sessao.indiceMaoSessao >= 2);
    }
    atualizarPote();
    renderHud();
    await ritualHoles();
    await ritualFlop();
  } catch {
    if (sessao.hud.estado === 'deal') {
      aplicar(sessao, EVENTOS.FALHA_DEAL);
    } else {
      aplicar(sessao, EVENTOS.FALHA_MONTAGEM);
    }
    limparCartas();
    atualizarPote();
    renderHud();
  } finally {
    sessao.montagemEmCurso = false;
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

let beatTimer = 0;

function cancelarBeat() {
  if (beatTimer) {
    clearTimeout(beatTimer);
    beatTimer = 0;
  }
}

function aposFimBeatVisual() {
  renderHud();
  atualizarPote();
  if (sessao.hud.estado === 'ociosa') {
    limparCartas();
    return;
  }
  if (sessao.hud.estado === 'deal' && sessao.mao?.street === 'turn') {
    void ritualTurnOuRiver('turn', 4);
    return;
  }
  if (sessao.hud.estado === 'deal' && sessao.mao?.street === 'river') {
    void ritualTurnOuRiver('river', 5);
  }
}

function agendarFimBeatAcerto() {
  cancelarBeat();
  const disparar = () => {
    beatTimer = 0;
    if (sessao.mao?.faseTentativa !== 'aguardando_beat') return;
    aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
    aposFimBeatVisual();
  };
  const ms = duracaoBeatMs(sessao.movimentoReduzido);
  if (ms <= 0) {
    disparar();
    return;
  }
  beatTimer = setTimeout(disparar, ms);
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
  if (nome === COPY.ctaNenhuma) {
    if (sessao.mao?.faseTentativa === 'aguardando_beat') return;
    aplicar(sessao, EVENTOS.CONFIRMAR);
    if (sessao.hud.feedback === 'erro') {
      playAudio('erro');
      flashHud('erro');
    } else if (sessao.hud.feedback === 'acerto') {
      playAudio('acerto');
      flashHud('acerto');
    }
    renderHud();
    if (sessao.mao?.faseTentativa === 'aguardando_beat') agendarFimBeatAcerto();
    return;
  }
  if (nome === COPY.ctaConfirmar) {
    if (sessao.mao?.faseTentativa === 'aguardando_beat') return;
    if (sessao.hud.cta?.desabilitado) return;
    aplicar(sessao, EVENTOS.CONFIRMAR);
    if (sessao.hud.feedback === 'erro') {
      playAudio('erro');
      flashHud('erro');
    } else if (sessao.hud.feedback === 'acerto') {
      playAudio('acerto');
      flashHud('acerto');
    }
    renderHud();
    if (sessao.mao?.faseTentativa === 'aguardando_beat') agendarFimBeatAcerto();
    return;
  }
  if (nome === COPY.ctaContinuar) {
    const passo = sessao.mao?.passo;
    aplicar(sessao, EVENTOS.CONTINUAR);
    renderHud();
    atualizarPote();
    if (passo === PASSOS.flop_skip || passo === PASSOS.flop_upgrade) {
      void ritualTurnOuRiver('turn', 4);
    }
    if (passo === PASSOS.turn_skip || passo === PASSOS.turn_upgrade) {
      void ritualTurnOuRiver('river', 5);
    }
  }
}

function onOpcao(id) {
  const modo = modoDoPasso(sessao.mao?.passo);
  if (modo === 'multipla') {
    aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id });
    renderHud();
    return;
  }
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id });
  if (sessao.hud.feedback === 'erro') {
    playAudio('erro');
    flashHud('erro');
  } else if (sessao.hud.feedback === 'acerto') {
    playAudio('acerto');
    flashHud('acerto');
  }
  renderHud();
  atualizarPote();
  if (sessao.mao?.faseTentativa === 'aguardando_beat') agendarFimBeatAcerto();
}

function onPointerMove(evento) {
  misturarCursor(sessao.misturaVisita, evento.clientX, evento.clientY);
}

export function bootMesa() {
  const clube = $('#clube');
  if (!clube || !$('#hud')) return;
  if (window.location.protocol === 'file:') {
    clube.classList.add('clube--file');
    const aviso = $('.aviso-file');
    if (aviso) aviso.hidden = false;
  }
  sessao = criarSessao();
  sessao.movimentoReduzido = reduzirMovimento();
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  clube.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('resize', () => {
    aplicarComposicao();
    aplicarOffsetPote();
  });
  aplicarComposicao();
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
