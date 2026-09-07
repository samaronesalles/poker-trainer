import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { cartasDeJogo, criarBaralhoPadrao } from '../../js/baralho.js';
import {
  assentoEmFoco,
  chavesCartasVencedoras,
  composicaoDoViewport,
  offsetPote,
  rotuloPoteCurto,
  streetVisivel,
} from '../../js/layout.js';
import { aplicar, criarSessao, EVENTOS } from '../../js/mesa.js';
import {
  COPY,
  PASSOS,
  apresentarPergunta,
  streetVisivelDoPasso,
} from '../../js/quiz.js';

const raiz = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(raiz, '../../index.html'), 'utf8');
const mesaCss = readFileSync(join(raiz, '../../css/mesa.css'), 'utf8');
const hudCss = readFileSync(join(raiz, '../../css/hud.css'), 'utf8');
const cartasCss = readFileSync(join(raiz, '../../css/cartas.css'), 'utf8');
const fonteMesa = readFileSync(join(raiz, '../../js/mesa.js'), 'utf8');
const fonteQuiz = readFileSync(join(raiz, '../../js/quiz.js'), 'utf8');
const fonteLayout = readFileSync(join(raiz, '../../js/layout.js'), 'utf8');

function carta(rank, naipe) {
  return { rank, naipe };
}

function payloadDeOnze(onze) {
  const usadas = new Set(onze.map((item) => `${item.rank}-${item.naipe}`));
  const resto = criarBaralhoPadrao().filter((item) => !usadas.has(`${item.rank}-${item.naipe}`));
  return { permutacao: [...onze, ...resto], cartasJogo: cartasDeJogo([...onze, ...resto]) };
}

function payloadParFlop() {
  return payloadDeOnze([
    carta('K', 'espadas'),
    carta('K', 'copas'),
    carta('Q', 'espadas'),
    carta('Q', 'copas'),
    carta('2', 'espadas'),
    carta('9', 'copas'),
    carta('2', 'copas'),
    carta('A', 'ouros'),
    carta('7', 'paus'),
    carta('3', 'ouros'),
    carta('4', 'paus'),
  ]);
}

function payloadHeroiParAFlush() {
  return payloadDeOnze([
    carta('4', 'copas'),
    carta('8', 'copas'),
    carta('3', 'ouros'),
    carta('6', 'espadas'),
    carta('2', 'espadas'),
    carta('2', 'paus'),
    carta('A', 'copas'),
    carta('K', 'copas'),
    carta('Q', 'copas'),
    carta('7', 'ouros'),
    carta('9', 'paus'),
  ]);
}

function acertarUnica(sessao) {
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: sessao.mao.corretaUnica });
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
}

function ateFlopUpgrade(sessao, payload = payloadParFlop()) {
  aplicar(sessao, EVENTOS.INICIAR_MAO, payload);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'holes' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'flop' });
  acertarUnica(sessao);
}

function bloco(css, seletor) {
  const idx = css.indexOf(seletor);
  return idx === -1 ? '' : css.slice(idx, idx + 280);
}

test('UX-01: paisagem baixa vira mesa+HUD lado a lado (não mesa de 420px)', () => {
  assert.equal(composicaoDoViewport({ width: 844, height: 390 }), 'paisagem');
  assert.equal(composicaoDoViewport({ width: 667, height: 375 }), 'paisagem');
  assert.match(mesaCss, /max-height:\s*520px/);
  assert.match(mesaCss, /orientation:\s*landscape/);
  assert.match(mesaCss, /flex-direction:\s*row/);
  assert.equal(/\.rail\s*\{[^}]*height:\s*420px/.test(mesaCss), false);
  assert.match(hudCss, /max-height:\s*520px/);
  assert.match(hudCss, /overflow-y:\s*auto/);
});

test('UX-02: em tela baixa a mesa cede altura; HUD compacto cabe na dobra', () => {
  assert.equal(composicaoDoViewport({ width: 375, height: 667 }), 'estreito');
  assert.equal(composicaoDoViewport({ width: 320, height: 568 }), 'estreito');
  assert.match(mesaCss, /\.palco[\s\S]*min-height:\s*0/);
  assert.match(mesaCss, /height:\s*min\(100%,\s*46dvh\)/);
  assert.match(hudCss, /max-height:\s*52dvh/);
  assert.equal(mesaCss.includes('height: 420px'), false);
});

test('UX-03: em 320 px A e B ficam em fileira no arco, fora do recorte do oval', () => {
  assert.match(html, /class="arco-adversarios"/);
  const feltro = html.slice(html.indexOf('class="feltro"'), html.indexOf('class="arco-adversarios"'));
  assert.equal(feltro.includes('data-seat="adversarioA"'), false);
  assert.equal(feltro.includes('data-seat="adversarioB"'), false);
  assert.match(html, /data-seat="adversarioA"/);
  assert.match(html, /data-seat="adversarioB"/);
  assert.match(mesaCss, /\.arco-adversarios[\s\S]*display:\s*flex/);
  assert.match(mesaCss, /justify-content:\s*space-between/);
  assert.match(mesaCss, /\n\.apelido \{\n[\s\S]*?white-space:\s*nowrap/);
});

test('UX-04: fichas do pote caminham até o assento real e ficam no feltro', () => {
  const origem = { left: 160, top: 200, width: 40, height: 22 };
  const destino = { left: -80, top: 40, width: 80, height: 60 };
  const bounds = { left: 0, top: 0, right: 390, bottom: 400 };
  const fora = offsetPote({ origem, destino, bounds, margem: 12 });
  assert.ok(fora.dx + origem.left + origem.width / 2 >= 12);
  assert.ok(fora.dx + origem.left + origem.width / 2 <= 390 - 12);
  const dentro = offsetPote({
    origem,
    destino: { left: 40, top: 50, width: 80, height: 60 },
    bounds,
  });
  assert.ok(dentro.dx < 0);
  assert.ok(dentro.dy < 0);
  assert.match(fonteMesa, /offsetPote\(/);
  assert.equal(fonteMesa.includes('translate(-220px'), false);
  assert.match(mesaCss, /--pote-dx/);
});

test('UX-05: assentos moram no rail; o oval não recorta nome nem avatar', () => {
  assert.match(mesaCss, /\.rail[\s\S]*overflow:\s*visible/);
  assert.match(mesaCss, /\.feltro[\s\S]*overflow:\s*hidden/);
  assert.match(html, /class="arco-adversarios"/);
  assert.match(mesaCss, /\.arco-adversarios[\s\S]*z-index:\s*4/);
});

test('UX-06: pote acima do board, com vão; sapato não encosta no bolo', () => {
  assert.match(bloco(mesaCss, '.pote {'), /top:\s*24%/);
  assert.match(bloco(mesaCss, '.board {'), /top:\s*52%/);
  assert.match(bloco(mesaCss, '.sapato {'), /top:\s*8%/);
});

test('UX-07: hole cards do herói são maiores que as comunitárias', () => {
  assert.match(mesaCss, /\.assento--heroi \.hole-slot[\s\S]*92px/);
  assert.match(mesaCss, /\.slot[\s\S]*76px/);
  assert.match(mesaCss, /\.assento--heroi \.ident[\s\S]*left:\s*calc\(100%/);
});

test('UX-08: no desktop a mesa encolhe quando o HUD cresce; não há altura fixa de 560px', () => {
  assert.match(mesaCss, /\.rail[\s\S]*height:\s*min\(100%,\s*72dvh\)/);
  assert.equal(mesaCss.includes('height: min(560px'), false);
  assert.match(hudCss, /grid-template-columns:\s*1fr auto/);
});

test('UX-09: mesa e HUD compartilham o mesmo teto de largura; mesa cresce no monitor grande', () => {
  assert.match(mesaCss, /--mesa-max-w:\s*1400px/);
  assert.match(mesaCss, /min-width:\s*1600px[\s\S]*--mesa-max-w:\s*1600px/);
  assert.match(mesaCss, /min-width:\s*2200px[\s\S]*--mesa-max-w:\s*1840px/);
  assert.match(hudCss, /width:\s*min\(94vw,\s*var\(--mesa-max-w\)\)/);
  assert.match(hudCss, /min-width:\s*2200px[\s\S]*--mesa-max-w:\s*1840px/);
  assert.equal(composicaoDoViewport({ width: 2560, height: 1440 }), 'desktop');
  assert.equal(composicaoDoViewport({ width: 1920, height: 1080 }), 'desktop');
});

test('UX-10: três composições mentais — desktop, retrato/estreito e paisagem', () => {
  assert.equal(composicaoDoViewport({ width: 1280, height: 720 }), 'desktop');
  assert.equal(composicaoDoViewport({ width: 768, height: 1024 }), 'retrato');
  assert.equal(composicaoDoViewport({ width: 900, height: 700 }), 'retrato');
  assert.equal(composicaoDoViewport({ width: 390, height: 844 }), 'estreito');
  assert.equal(composicaoDoViewport({ width: 844, height: 390 }), 'paisagem');
  assert.match(fonteLayout, /desktop/);
  assert.match(fonteLayout, /retrato/);
  assert.match(fonteLayout, /paisagem/);
  assert.match(fonteMesa, /data-composicao|dataset.composicao/);
});

test('UX-11: zoom / overflow — a página rola; o desktop não esconde o vazamento', () => {
  assert.match(mesaCss, /html,\s*body[\s\S]*overflow:\s*auto/);
  assert.equal(/body\s*\{[^}]*overflow:\s*hidden/.test(mesaCss), false);
  assert.equal(composicaoDoViewport({ width: 640, height: 360 }), 'paisagem');
});

test('UX-12: no showdown o assento da pergunta ganha foco visual', () => {
  assert.equal(assentoEmFoco(PASSOS.river_a), 'adversarioA');
  assert.equal(assentoEmFoco(PASSOS.river_b), 'adversarioB');
  assert.equal(assentoEmFoco(PASSOS.river_hero), 'voce');
  assert.match(fonteMesa, /dataset.foco/);
  assert.match(mesaCss, /\[data-foco='true'\]/);
});

test('UX-13: opções longas do pote têm rótulo curto e coluna única no estreito', () => {
  assert.equal(rotuloPoteCurto('a_b'), 'A e B');
  assert.equal(rotuloPoteCurto('voce_a'), 'Você e A');
  assert.equal(rotuloPoteCurto('tres'), 'Os três');
  const sessao = criarSessao();
  aplicar(sessao, EVENTOS.INICIAR_MAO, payloadHeroiParAFlush());
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'holes' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'flop' });
  acertarUnica(sessao);
  if (sessao.hud.estado === 'perguntando') {
    for (const item of sessao.hud.opcoes.filter((opcao) => opcao.verdadeira && opcao.ativavel)) {
      aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: item.id });
    }
    aplicar(sessao, EVENTOS.CONFIRMAR);
    aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  } else {
    aplicar(sessao, EVENTOS.CONTINUAR);
  }
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  acertarUnica(sessao);
  if (sessao.mao?.passo === PASSOS.turn_upgrade) {
    for (const item of sessao.hud.opcoes.filter((opcao) => opcao.verdadeira && opcao.ativavel)) {
      aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: item.id });
    }
    aplicar(sessao, EVENTOS.CONFIRMAR);
    aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  } else if (sessao.hud.estado === 'sem_upgrade') {
    aplicar(sessao, EVENTOS.CONTINUAR);
  }
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  acertarUnica(sessao);
  acertarUnica(sessao);
  acertarUnica(sessao);
  assert.equal(sessao.mao.passo, PASSOS.river_vencedor);
  const longa = sessao.hud.opcoes.find((item) => item.id === 'a_b' || item.rotulo.includes(' e '));
  assert.ok(longa);
  if (longa.id === 'a_b') assert.equal(longa.rotuloCurto, 'A e B');
  assert.match(hudCss, /\.hud__opcoes--pote[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(fonteMesa, /hud__opcoes--pote/);
  assert.match(fonteMesa, /btn__rotulo--curto/);
});

test('UX-14: HUD ocioso e de resultado alinhados à mesa, não à largura do monitor', () => {
  assert.match(hudCss, /\[data-hud-estado='ociosa'\][\s\S]*justify-content:\s*space-between/);
  assert.match(hudCss, /\[data-hud-estado='resultado'\]/);
  assert.match(hudCss, /width:\s*min\(94vw,\s*var\(--mesa-max-w\)\)/);
});

test('UX-15: marcador Flop · Turn · River no HUD', () => {
  assert.equal(streetVisivel('flop'), 'flop');
  assert.equal(streetVisivelDoPasso(PASSOS.flop_upgrade), 'flop');
  assert.equal(streetVisivelDoPasso(PASSOS.turn_hero), 'turn');
  assert.equal(streetVisivelDoPasso(PASSOS.river_vencedor), 'river');
  const sessao = criarSessao();
  ateFlopUpgrade(sessao);
  assert.equal(sessao.hud.street, 'flop');
  assert.match(fonteMesa, /hud__street/);
  assert.match(fonteMesa, /Flop/);
  assert.match(hudCss, /\.hud__street/);
});

test('UX-16: cartas da melhor 5 do vencedor recebem destaque; dump não vai ao storage', () => {
  const showdown = {
    maos: {
      adversarioA: {
        cartas: [
          { rank: 'A', naipe: 'copas' },
          { rank: 'K', naipe: 'copas' },
        ],
      },
    },
  };
  assert.deepEqual(chavesCartasVencedoras(showdown, ['adversarioA']), ['A-copas', 'K-copas']);
  assert.match(fonteMesa, /data-vencedora|dataset.vencedora/);
  assert.match(cartasCss, /\[data-vencedora='true'\]/);
  assert.equal(fonteLayout.includes('localStorage'), false);
});

test('UX-17: Confirmar nasce desligado; hint de várias respostas; Nenhuma no DOM', () => {
  const sessao = criarSessao();
  ateFlopUpgrade(sessao);
  assert.equal(sessao.hud.cta?.nome, COPY.ctaConfirmar);
  assert.equal(sessao.hud.cta?.desabilitado, true);
  assert.equal(sessao.hud.hint, COPY.hintMultipla);
  assert.match(COPY.hintMultipla, /mais de uma/i);
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: sessao.hud.opcoes[0].id });
  assert.equal(sessao.hud.cta?.desabilitado, false);
  assert.match(fonteMesa, /ctaNenhuma/);
  assert.match(hudCss, /\[data-modo='multipla'\] \.btn--opcao/);
  assert.equal(fonteQuiz.includes('marcar todas'), false);
});

test('UX-18: lista toda revelada troca o tom para Continuar, sem “tente de novo”', () => {
  const sessao = criarSessao();
  ateFlopUpgrade(sessao);
  apresentarPergunta(sessao, PASSOS.flop_upgrade, () => 0);
  for (const item of sessao.hud.opcoes) {
    aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: item.id });
  }
  aplicar(sessao, EVENTOS.CONFIRMAR);
  if (sessao.mao.faseTentativa === 'aguardando_beat') {
    assert.equal(sessao.hud.feedback, 'acerto');
    return;
  }
  assert.equal(sessao.hud.feedbackTexto, COPY.revelado);
  assert.equal(sessao.hud.cta?.nome, COPY.ctaContinuar);
  assert.notEqual(sessao.hud.feedbackTexto, COPY.erro);
  aplicar(sessao, EVENTOS.CONTINUAR);
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.mao.street, 'turn');
});

test('UX-19: burn some em tela estreita e na paisagem baixa', () => {
  assert.match(mesaCss, /max-width:\s*900px[\s\S]*\.burn-area[\s\S]*display:\s*none/);
  assert.match(mesaCss, /orientation:\s*landscape[\s\S]*\.burn-area[\s\S]*display:\s*none/);
});

test('UX-20: heading, main, viewport-fit e recorte seguro', () => {
  assert.match(html, /<main class="clube"/);
  assert.match(html, /<h1 class="visually-hidden">Poker Trainer<\/h1>/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /role="region"/);
  assert.match(mesaCss, /safe-area-inset-top/);
  assert.match(hudCss, /safe-area-inset-bottom/);
  assert.match(mesaCss, /\.visually-hidden/);
});
