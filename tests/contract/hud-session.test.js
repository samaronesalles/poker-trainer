import { cartasDeJogo, criarBaralhoPadrao, criarMisturaVisita, montarMao } from '../../js/baralho.js';
import { aplicar, criarSessao, duracaoBeatMs, EVENTOS, LINHA_ERRO_MONTAGEM } from '../../js/mesa.js';
import { COPY, PASSOS } from '../../js/quiz.js';
import { CHAVE_EVOLUCAO, criarStorage } from '../../js/storage.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';

function opcao(sessao, id) {
  return sessao.hud.opcoes.find((item) => item.id === id);
}

function chave(carta) {
  return `${carta.rank}-${carta.naipe}`;
}

function payloadMontagem() {
  const resultado = montarMao(criarMisturaVisita());
  assert.equal(resultado.status, 'ok');
  return { permutacao: resultado.permutacao, cartasJogo: resultado.cartasJogo };
}

function payloadFabrica() {
  const permutacao = criarBaralhoPadrao();
  return { permutacao, cartasJogo: cartasDeJogo(permutacao) };
}

function memoria() {
  const map = new Map();
  return {
    map,
    api: {
      getItem: (chave) => (map.has(chave) ? map.get(chave) : null),
      setItem: (chave, valor) => {
        map.set(chave, String(valor));
      },
      removeItem: (chave) => {
        map.delete(chave);
      },
    },
  };
}

function acertarUnica(sessao, id) {
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id });
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
}

function acertarHeroStreet(sessao) {
  acertarUnica(sessao, sessao.mao.corretaUnica);
}

function acertarUpgradeExibido(sessao) {
  for (const item of sessao.hud.opcoes.filter((opcao) => opcao.verdadeira && opcao.ativavel)) {
    aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: item.id });
  }
  aplicar(sessao, EVENTOS.CONFIRMAR);
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
}

function concluirPosMaoAtual(sessao) {
  if (sessao.hud.estado === 'ociosa') return;
  if (sessao.hud.estado === 'sem_upgrade') {
    aplicar(sessao, EVENTOS.CONTINUAR);
    return;
  }
  if (sessao.mao?.passo === PASSOS.flop_upgrade || sessao.mao?.passo === PASSOS.turn_upgrade) {
    acertarUpgradeExibido(sessao);
  }
}

function payloadParFlop() {
  const onze = [
    { rank: 'K', naipe: 'espadas' },
    { rank: 'K', naipe: 'copas' },
    { rank: 'Q', naipe: 'espadas' },
    { rank: 'Q', naipe: 'copas' },
    { rank: '2', naipe: 'espadas' },
    { rank: '9', naipe: 'copas' },
    { rank: '2', naipe: 'copas' },
    { rank: 'A', naipe: 'ouros' },
    { rank: '7', naipe: 'paus' },
    { rank: '3', naipe: 'ouros' },
    { rank: '4', naipe: 'paus' },
  ];
  const usadas = new Set(onze.map((item) => `${item.rank}-${item.naipe}`));
  const resto = criarBaralhoPadrao().filter((item) => !usadas.has(`${item.rank}-${item.naipe}`));
  const permutacao = [...onze, ...resto];
  return { permutacao, cartasJogo: cartasDeJogo(permutacao) };
}

function payloadDeOnze(onze) {
  const usadas = new Set(onze.map((item) => `${item.rank}-${item.naipe}`));
  const resto = criarBaralhoPadrao().filter((item) => !usadas.has(`${item.rank}-${item.naipe}`));
  const permutacao = [...onze, ...resto];
  return { permutacao, cartasJogo: cartasDeJogo(permutacao) };
}

function payloadHeroiParAFlush() {
  return payloadDeOnze([
    { rank: '4', naipe: 'copas' },
    { rank: '8', naipe: 'copas' },
    { rank: '3', naipe: 'ouros' },
    { rank: '6', naipe: 'espadas' },
    { rank: '2', naipe: 'espadas' },
    { rank: '2', naipe: 'paus' },
    { rank: 'A', naipe: 'copas' },
    { rank: 'K', naipe: 'copas' },
    { rank: 'Q', naipe: 'copas' },
    { rank: '7', naipe: 'ouros' },
    { rank: '9', naipe: 'paus' },
  ]);
}

function payloadEmpateVoceA() {
  return payloadDeOnze([
    { rank: 'A', naipe: 'ouros' },
    { rank: '9', naipe: 'paus' },
    { rank: '4', naipe: 'copas' },
    { rank: '5', naipe: 'espadas' },
    { rank: 'A', naipe: 'copas' },
    { rank: '9', naipe: 'espadas' },
    { rank: 'K', naipe: 'espadas' },
    { rank: 'K', naipe: 'ouros' },
    { rank: '7', naipe: 'copas' },
    { rank: '3', naipe: 'paus' },
    { rank: '2', naipe: 'ouros' },
  ]);
}

function payloadRoyalBoard() {
  return payloadDeOnze([
    { rank: '4', naipe: 'copas' },
    { rank: '5', naipe: 'ouros' },
    { rank: '6', naipe: 'copas' },
    { rank: '7', naipe: 'ouros' },
    { rank: '2', naipe: 'copas' },
    { rank: '3', naipe: 'ouros' },
    { rank: 'A', naipe: 'espadas' },
    { rank: 'K', naipe: 'espadas' },
    { rank: 'Q', naipe: 'espadas' },
    { rank: 'J', naipe: 'espadas' },
    { rank: '10', naipe: 'espadas' },
  ]);
}

function ate(sessao, alvo, payload = payloadMontagem()) {
  aplicar(sessao, EVENTOS.INICIAR_MAO, payload);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'holes' });
  if (alvo === 'holes') return;
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'flop' });
  if (alvo === 'flop_hero') return;
  acertarHeroStreet(sessao);
  if (alvo === 'flop_upgrade' || alvo === 'flop_skip') return;
  concluirPosMaoAtual(sessao);
  if (alvo === 'turn_deal') return;
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  if (alvo === 'turn_hero') return;
  acertarHeroStreet(sessao);
  if (alvo === 'turn_skip' || alvo === 'turn_upgrade') return;
  concluirPosMaoAtual(sessao);
  if (alvo === 'river_deal') return;
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
  if (alvo === 'river') return;
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  if (alvo === 'river_hero') return;
  acertarUnica(sessao, sessao.mao.corretaUnica);
  if (alvo === 'river_a') return;
  acertarUnica(sessao, sessao.mao.corretaUnica);
  if (alvo === 'river_b') return;
  acertarUnica(sessao, sessao.mao.corretaUnica);
  if (alvo === 'river_vencedor') return;
  acertarUnica(sessao, sessao.mao.corretaUnica);
}

test('1. estado inicial ociosa, CTA Nova mo, 0 opes e linha de propsito', () => {
  const sessao = criarSessao();
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaNovaMao);
  assert.equal(sessao.hud.opcoes.length, 0);
  assert.equal(sessao.hud.linhaProposito, COPY.linhaProposito);
  assert.equal(sessao.hud.linhaErro, null);
  assert.equal(sessao.mao, null);
  assert.equal(sessao.indiceMaoSessao, 0);
  assert.equal(sessao.montagemEmCurso, false);
  assert.ok(sessao.misturaVisita);
});

test('2. INICIAR_MAO com montagem RN-044 ? deal com 0 opes', () => {
  const sessao = criarSessao();
  aplicar(sessao, EVENTOS.INICIAR_MAO, payloadMontagem());
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.hud.opcoes.length, 0);
  assert.equal(sessao.hud.cta, null);
  assert.equal(sessao.indiceMaoSessao, 1);
  assert.equal(sessao.hud.linhaErro, null);
  assert.equal(sessao.mao.cartasJogo.length, 11);
  assert.equal(sessao.mao.permutacao.length, 52);
});

test('INICIAR_MAO sem payload vlido permanece ociosa e mao null', () => {
  const sessao = criarSessao();
  aplicar(sessao, EVENTOS.INICIAR_MAO);
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.mao, null);
  assert.equal(sessao.indiceMaoSessao, 0);
  aplicar(sessao, EVENTOS.INICIAR_MAO, { cartasJogo: [], permutacao: [] });
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.mao, null);
});

test('3. board vazio aps hole pousadas permanece fora de perguntando', () => {
  const sessao = criarSessao();
  ate(sessao, 'holes');
  assert.notEqual(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.hud.opcoes.length, 0);
  assert.ok(sessao.board.slots.every((slot) => slot.carta === null));
  const heroi = sessao.assentos.find((a) => a.id === 'voce');
  const a = sessao.assentos.find((s) => s.id === 'adversarioA');
  assert.equal(heroi.hole[0].visibilidade, 'face');
  assert.equal(a.hole[0].visibilidade, 'verso');
});

test('aps holes, mapeamento RN-044 A=[0][1] B=[2][3] Voc=[4][5]', () => {
  const sessao = criarSessao();
  const payload = payloadFabrica();
  ate(sessao, 'holes', payload);
  const a = sessao.assentos.find((s) => s.id === 'adversarioA');
  const b = sessao.assentos.find((s) => s.id === 'adversarioB');
  const heroi = sessao.assentos.find((s) => s.id === 'voce');
  assert.equal(chave(a.hole[0]), chave(payload.cartasJogo[0]));
  assert.equal(chave(a.hole[1]), chave(payload.cartasJogo[1]));
  assert.equal(chave(b.hole[0]), chave(payload.cartasJogo[2]));
  assert.equal(chave(b.hole[1]), chave(payload.cartasJogo[3]));
  assert.equal(chave(heroi.hole[0]), chave(payload.cartasJogo[4]));
  assert.equal(chave(heroi.hole[1]), chave(payload.cartasJogo[5]));
  assert.equal(a.hole[0].visibilidade, 'verso');
  assert.equal(heroi.hole[0].visibilidade, 'face');
  assert.ok(sessao.board.slots.every((slot) => slot.carta === null));
  assert.notEqual(sessao.hud.estado, 'perguntando');
});

test('4. flop pousado ? perguntando flop_hero, 6 opes, correta = Melhor5', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_hero');
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoHero);
  assert.equal(sessao.hud.opcoes.length, 6);
  const corretas = sessao.hud.opcoes.filter((o) => o.correta);
  assert.equal(corretas.length, 1);
  assert.equal(corretas[0].id, sessao.mao.corretaUnica);
  assert.equal(sessao.hud.cta, null);
});

test('payloadFabrica no flop do heri  Straight flush, no Flush', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_hero', payloadFabrica());
  const corretas = sessao.hud.opcoes.filter((o) => o.correta);
  assert.equal(sessao.mao.corretaUnica, 'straight_flush');
  assert.equal(corretas[0].id, 'straight_flush');
  assert.equal(corretas[0].rotulo, 'Straight flush');
});

test('5. escolha errada permanece flop_hero, opo eliminada e mostra erro', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_hero');
  const chute = sessao.hud.opcoes.find((item) => item.verdadeira === false);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: chute.id });
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
  assert.equal(sessao.hud.feedback, 'erro');
  const morta = opcao(sessao, chute.id);
  assert.equal(morta.desabilitada, true);
  assert.equal(morta.estadoVisual, 'eliminada');
  assert.equal(morta.marca, 'corte');
  assert.equal(opcao(sessao, sessao.mao.corretaUnica).ativavel, true);
  assert.notEqual(opcao(sessao, sessao.mao.corretaUnica).estadoVisual, 'acertada');
});

test('escolha da correta permanece perguntando at FIM_BEAT_ACERTO', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_hero');
  const id = sessao.mao.corretaUnica;
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id });
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
  assert.equal(sessao.hud.feedback, 'acerto');
  assert.equal(sessao.mao.faseTentativa, 'aguardando_beat');
  assert.equal(sessao.hud.cta, null);
  assert.equal(opcao(sessao, id).marca, 'acerto');
});

test('6. acerto da 5.3 + beat ? flop_upgrade ou flop_skip; turn fechado', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_upgrade', payloadParFlop());
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.flop_upgrade);
  assert.equal(sessao.hud.cta?.nome, COPY.ctaConfirmar);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoUpgrades);
  assert.notEqual(sessao.hud.estado, 'sem_upgrade');
  assert.equal(PASSOS.flop_skip, 'flop_skip');
  assert.notEqual(sessao.mao.street, 'turn');
});

test('ALTERNAR_OPCAO em flop_upgrade permanece perguntando com feedback null', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_upgrade', payloadParFlop());
  const alvo = sessao.hud.opcoes[0];
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: alvo.id });
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.hud.feedback, null);
});

test('7. conjunto correto + beat ? deal turn, no skip', () => {
  const sessao = criarSessao();
  ate(sessao, 'turn_deal', payloadParFlop());
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.mao.street, 'turn');
  assert.equal(sessao.hud.opcoes.length, 0);
  assert.equal(sessao.hud.cta, null);
});

test('8. turn_hero acertado em SF sem upgrade ? sem_upgrade + Continuar ? deal river', () => {
  const sessao = criarSessao();
  ate(sessao, 'turn_skip', payloadFabrica());
  assert.equal(sessao.hud.estado, 'sem_upgrade');
  assert.equal(sessao.mao.passo, PASSOS.turn_skip);
  assert.equal(sessao.hud.cta?.nome, COPY.ctaContinuar);
  aplicar(sessao, EVENTOS.CONTINUAR);
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.mao.street, 'river');
});

test('9. river pousado sem virada permanece deal', () => {
  const sessao = criarSessao();
  ate(sessao, 'river', payloadHeroiParAFlush());
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.mao.viradaShowdownConcluida, false);
  assert.equal(sessao.hud.opcoes.length, 0);
  const a = sessao.assentos.find((s) => s.id === 'adversarioA');
  const b = sessao.assentos.find((s) => s.id === 'adversarioB');
  assert.equal(a.hole[0].visibilidade, 'verso');
  assert.equal(b.hole[0].visibilidade, 'verso');
  assert.equal(sessao.pote.modo, 'centro');
  assert.deepEqual(sessao.pote.vencedoresVisuais, []);
  assert.ok(sessao.mao.showdown);
});

test('10. virada concluida -> perguntando river_hero; A e B face no mesmo evento', () => {
  const sessao = criarSessao();
  ate(sessao, 'river', payloadHeroiParAFlush());
  const aAntes = sessao.assentos.find((s) => s.id === 'adversarioA').hole[0].visibilidade;
  const bAntes = sessao.assentos.find((s) => s.id === 'adversarioB').hole[0].visibilidade;
  assert.equal(aAntes, 'verso');
  assert.equal(bAntes, 'verso');
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  const a = sessao.assentos.find((s) => s.id === 'adversarioA');
  const b = sessao.assentos.find((s) => s.id === 'adversarioB');
  const heroi = sessao.assentos.find((s) => s.id === 'voce');
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.river_hero);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoHero);
  assert.equal(sessao.hud.opcoes.length, 6);
  assert.ok(sessao.hud.opcoes.every((o) => o.tipo === 'categoria'));
  assert.equal(sessao.mao.viradaShowdownConcluida, true);
  assert.equal(sessao.hud.cta, null);
  assert.equal(a.hole[0].visibilidade, 'face');
  assert.equal(a.hole[1].visibilidade, 'face');
  assert.equal(b.hole[0].visibilidade, 'face');
  assert.equal(b.hole[1].visibilidade, 'face');
  assert.equal(heroi.hole[0].visibilidade, 'face');
  assert.ok(sessao.board.slots.every((slot) => slot.carta?.visibilidade === 'face'));
  assert.equal(sessao.pote.modo, 'centro');
  assert.equal(sessao.mao.corretaUnica, 'par');
});

test('11. sequencia A -> B -> vencedor uma a uma', () => {
  const sessao = criarSessao();
  ate(sessao, 'river_a', payloadHeroiParAFlush());
  assert.equal(sessao.mao.passo, PASSOS.river_a);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoA);
  assert.equal(sessao.pote.modo, 'centro');
  assert.deepEqual(sessao.pote.vencedoresVisuais, []);
  acertarUnica(sessao, sessao.mao.corretaUnica);
  assert.equal(sessao.mao.passo, PASSOS.river_b);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoB);
  acertarUnica(sessao, sessao.mao.corretaUnica);
  assert.equal(sessao.mao.passo, PASSOS.river_vencedor);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoPote);
  assert.ok(sessao.hud.opcoes.every((o) => o.tipo === 'vencedor'));
  assert.equal(sessao.pote.modo, 'centro');
});

test('12. unico vencedor real (A) -> resultado para_vencedor, nao sempre voce', () => {
  const sessao = criarSessao();
  ate(sessao, 'river_vencedor', payloadHeroiParAFlush());
  acertarUnica(sessao, sessao.mao.corretaUnica);
  assert.equal(sessao.hud.estado, 'resultado');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaProximaMao);
  assert.equal(sessao.pote.modo, 'para_vencedor');
  assert.deepEqual(sessao.pote.vencedoresVisuais, ['adversarioA']);
  assert.equal(sessao.hud.categoriasIdentificadas.voce, 'Par');
  assert.equal(sessao.hud.categoriasIdentificadas.adversarioA, 'Flush');
  assert.equal(sessao.hud.categoriasIdentificadas.adversarioB, 'Carta alta');
});

test('13. segunda mao nao vira split so porque indiceMaoSessao >= 2', () => {
  const sessao = criarSessao();
  ate(sessao, 'resultado', payloadHeroiParAFlush());
  assert.equal(sessao.hud.estado, 'resultado');
  aplicar(sessao, EVENTOS.PROXIMA_MAO, payloadHeroiParAFlush());
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.pote.modo, 'centro');
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'holes' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'flop' });
  acertarHeroStreet(sessao);
  concluirPosMaoAtual(sessao);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  acertarHeroStreet(sessao);
  concluirPosMaoAtual(sessao);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  acertarUnica(sessao, sessao.mao.corretaUnica);
  acertarUnica(sessao, sessao.mao.corretaUnica);
  acertarUnica(sessao, sessao.mao.corretaUnica);
  const correta = sessao.hud.opcoes.find((o) => o.correta);
  assert.equal(correta.id, 'adversarioA');
  assert.notEqual(correta.id, 'voce_a');
  acertarUnica(sessao, correta.id);
  assert.equal(sessao.hud.estado, 'resultado');
  assert.equal(sessao.pote.modo, 'para_vencedor');
  assert.deepEqual(sessao.pote.vencedoresVisuais, ['adversarioA']);
});

test('14. FALHA_DEAL ? ociosa + Nova mo', () => {
  const sessao = criarSessao();
  aplicar(sessao, EVENTOS.INICIAR_MAO, payloadMontagem());
  aplicar(sessao, EVENTOS.FALHA_DEAL);
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaNovaMao);
  assert.equal(sessao.mao, null);
  assert.equal(sessao.hud.opcoes.length, 0);
  assert.equal(sessao.hud.linhaErro, null);
});

test('clique em opo desabilitada ignora', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_hero');
  const chute = sessao.hud.opcoes.find((item) => item.verdadeira === false);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: chute.id });
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: chute.id });
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
});

test('CONTINUAR / streets no substituem cartasJogo nem permutacao', () => {
  const sessao = criarSessao();
  const payload = payloadFabrica();
  ate(sessao, 'flop_hero', payload);
  const jogoAntes = sessao.mao.cartasJogo.map(chave).join('|');
  const permAntes = sessao.mao.permutacao.map(chave).join('|');
  const flopAntes = [6, 7, 8].map((i) => chave(sessao.mao.cartasJogo[i]));
  acertarHeroStreet(sessao);
  concluirPosMaoAtual(sessao);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  assert.equal(sessao.mao.cartasJogo.map(chave).join('|'), jogoAntes);
  assert.equal(sessao.mao.permutacao.map(chave).join('|'), permAntes);
  assert.deepEqual(
    [6, 7, 8].map((i) => chave(sessao.mao.cartasJogo[i])),
    flopAntes,
  );
  assert.equal(chave(sessao.board.slots[0].carta), chave(payload.cartasJogo[6]));
  assert.equal(chave(sessao.board.slots[3].carta), chave(payload.cartasJogo[9]));
  acertarHeroStreet(sessao);
  concluirPosMaoAtual(sessao);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
  assert.equal(chave(sessao.board.slots[0].carta), chave(payload.cartasJogo[6]));
  assert.equal(chave(sessao.board.slots[3].carta), chave(payload.cartasJogo[9]));
  assert.equal(chave(sessao.board.slots[4].carta), chave(payload.cartasJogo[10]));
  assert.equal(sessao.mao.cartasJogo.map(chave).join('|'), jogoAntes);
});

test('showdown vira A/B com as mesmas identidades do deal', () => {
  const sessao = criarSessao();
  const payload = payloadFabrica();
  ate(sessao, 'holes', payload);
  const dealA = sessao.assentos.find((s) => s.id === 'adversarioA').hole.map(chave);
  const dealB = sessao.assentos.find((s) => s.id === 'adversarioB').hole.map(chave);
  ate(sessao, 'river', payload);
  assert.equal(sessao.assentos.find((s) => s.id === 'adversarioA').hole[0].visibilidade, 'verso');
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  const a = sessao.assentos.find((s) => s.id === 'adversarioA');
  const b = sessao.assentos.find((s) => s.id === 'adversarioB');
  assert.equal(sessao.mao.viradaShowdownConcluida, true);
  assert.deepEqual(a.hole.map(chave), dealA);
  assert.deepEqual(b.hole.map(chave), dealB);
  assert.equal(a.hole[0].visibilidade, 'face');
  assert.equal(b.hole[1].visibilidade, 'face');
  assert.deepEqual(dealA, [chave(payload.cartasJogo[0]), chave(payload.cartasJogo[1])]);
});

test('FALHA_MONTAGEM permanece ociosa com copy cannica e Nova mo', () => {
  const sessao = criarSessao();
  aplicar(sessao, EVENTOS.FALHA_MONTAGEM);
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.mao, null);
  assert.equal(sessao.hud.linhaErro, LINHA_ERRO_MONTAGEM);
  assert.equal(LINHA_ERRO_MONTAGEM, 'No foi possvel embaralhar. Tente de novo.');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaNovaMao);
  assert.equal(sessao.hud.opcoes.length, 0);
  assert.notEqual(sessao.hud.estado, 'deal');
});

test('segunda inteno com montagemEmCurso no incrementa indiceMaoSessao', () => {
  const sessao = criarSessao();
  sessao.montagemEmCurso = true;
  aplicar(sessao, EVENTOS.INICIAR_MAO, payloadMontagem());
  aplicar(sessao, EVENTOS.INICIAR_MAO, payloadMontagem());
  assert.equal(sessao.indiceMaoSessao, 0);
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.mao, null);
  sessao.montagemEmCurso = false;
  aplicar(sessao, EVENTOS.INICIAR_MAO, payloadMontagem());
  assert.equal(sessao.indiceMaoSessao, 1);
  assert.equal(sessao.hud.estado, 'deal');
});

test('orquestracao aceitarMontagem inicia com montagemEmCurso', () => {
  const sessao = criarSessao();
  sessao.montagemEmCurso = true;
  aplicar(sessao, EVENTOS.INICIAR_MAO, { ...payloadMontagem(), aceitarMontagem: true });
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.indiceMaoSessao, 1);
  assert.ok(sessao.mao);
});

test('0 Confirmar em flop_hero e river_hero', () => {
  const flop = criarSessao();
  ate(flop, 'flop_hero');
  assert.equal(flop.hud.cta, null);
  const river = criarSessao();
  ate(river, 'river_hero');
  assert.equal(river.mao.passo, PASSOS.river_hero);
  assert.equal(river.hud.cta, null);
});

test('reload aps 1 tentativa preserva contadores e HUD volta ociosa', () => {
  const { api } = memoria();
  const storage = criarStorage({ api });
  const sessao = criarSessao({ storage });
  ate(sessao, 'flop_hero', payloadFabrica());
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: sessao.mao.corretaUnica });
  assert.equal(sessao.evolucao.mao_atual.straight_flush.acertos, 1);
  const deNovo = criarSessao({ storage });
  assert.equal(deNovo.hud.estado, 'ociosa');
  assert.equal(deNovo.mao, null);
  assert.equal(deNovo.evolucao.mao_atual.straight_flush.acertos, 1);
});

test('sesso no tem CTA zerar nem campos de relatrio; CTAs permitidos', () => {
  const sessao = criarSessao();
  const permitidos = new Set([COPY.ctaNovaMao, COPY.ctaProximaMao, COPY.ctaContinuar, COPY.ctaConfirmar]);
  assert.equal('zerar' in sessao, false);
  assert.equal('relatorio' in sessao, false);
  assert.equal(sessao.hud.cta?.nome, COPY.ctaNovaMao);
  ate(sessao, 'flop_upgrade', payloadParFlop());
  assert.ok(permitidos.has(sessao.hud.cta.nome));
  const skip = criarSessao();
  ate(skip, 'turn_skip', payloadFabrica());
  assert.ok(permitidos.has(skip.hud.cta.nome));
  const fim = criarSessao();
  ate(fim, 'river_vencedor', payloadFabrica());
  acertarUnica(fim, fim.mao.corretaUnica);
  assert.ok(permitidos.has(fim.hud.cta.nome));
  assert.equal(fim.hud.cta.nome, COPY.ctaProximaMao);
});

test('beat 400 ms padro e 0 se movimento reduzido', () => {
  assert.equal(duracaoBeatMs(false), 400);
  assert.equal(duracaoBeatMs(true), 0);
});

test('T022: erro no flop_hero nao revela a certa nem oferece pular', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_hero', payloadFabrica());
  const chute = sessao.hud.opcoes.find((item) => item.verdadeira === false);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: chute.id });
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
  assert.equal(opcao(sessao, chute.id).estadoVisual, 'eliminada');
  const certa = opcao(sessao, sessao.mao.corretaUnica);
  assert.notEqual(certa.estadoVisual, 'acertada');
  assert.equal(certa.ativavel, true);
  const textos = `${sessao.hud.enunciado}|${sessao.hud.cta?.nome ?? ''}|${sessao.hud.feedbackTexto}`;
  assert.equal(/pular|mostrar resposta/i.test(textos), false);
});

test('T022: flop e turn da mesma mao sao duas 1as tentativas; turn_skip nao grava upgrade', () => {
  const { api } = memoria();
  const sessao = criarSessao({ storage: criarStorage({ api }) });
  ate(sessao, 'turn_hero', payloadFabrica());
  assert.equal(sessao.evolucao.mao_atual.straight_flush.acertos, 1);
  assert.equal(sessao.evolucao.mao_atual.straight_flush.exposicoes, 1);
  const upgradeAntes = JSON.stringify(sessao.evolucao.upgrade);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: sessao.mao.corretaUnica });
  assert.equal(sessao.evolucao.mao_atual.straight_flush.acertos, 2);
  assert.equal(sessao.evolucao.mao_atual.straight_flush.exposicoes, 2);
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  assert.equal(sessao.hud.estado, 'sem_upgrade');
  assert.equal(sessao.mao.passo, PASSOS.turn_skip);
  assert.equal(JSON.stringify(sessao.evolucao.upgrade), upgradeAntes);
});

test('FIM_BEAT_ACERTO em flop_hero no abre o turn', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_upgrade', payloadParFlop());
  assert.notEqual(sessao.mao.street, 'turn');
  assert.notEqual(sessao.mao.passo, PASSOS.turn_hero);
  assert.ok(sessao.mao.passo === PASSOS.flop_upgrade || sessao.mao.passo === PASSOS.flop_skip);
});

test('duplicata nas visveis no pouso ? ociosa + copy de enumerao', () => {
  const sessao = criarSessao();
  aplicar(sessao, EVENTOS.INICIAR_MAO, payloadParFlop());
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'holes' });
  sessao.mao.cartasJogo[5] = { ...sessao.mao.cartasJogo[6] };
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'flop' });
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.mao, null);
  assert.equal(sessao.hud.linhaErro, COPY.linhaErroEnumeracao);
  assert.equal(sessao.hud.cta?.nome, COPY.ctaNovaMao);
  assert.notEqual(sessao.hud.estado, 'sem_upgrade');
});

test('flop e turn no-skip: duas 1s Confirmar em upgrade; 0 toque em mao_atual nesta pergunta', () => {
  const { api } = memoria();
  const sessao = criarSessao({ storage: criarStorage({ api }) });
  ate(sessao, 'flop_upgrade', payloadParFlop());
  const maoAntes = JSON.stringify(sessao.evolucao.mao_atual);
  const vencedorAntes = JSON.stringify(sessao.evolucao.vencedor_pote);
  acertarUpgradeExibido(sessao);
  assert.equal(JSON.stringify(sessao.evolucao.mao_atual), maoAntes);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  acertarHeroStreet(sessao);
  assert.equal(sessao.mao.passo, PASSOS.turn_upgrade);
  const upgradeFlop = JSON.stringify(sessao.evolucao.upgrade);
  acertarUpgradeExibido(sessao);
  assert.notEqual(JSON.stringify(sessao.evolucao.upgrade), upgradeFlop);
  assert.equal(JSON.stringify(sessao.evolucao.vencedor_pote), vencedorAntes);
});

const raizHud = dirname(fileURLToPath(import.meta.url));
const fonteMesa = readFileSync(join(raizHud, '../../js/mesa.js'), 'utf8');
const fonteIndex = readFileSync(join(raizHud, '../../index.html'), 'utf8');

test('split heroi vs A: modo split, texto empate, Prxima mo', () => {
  const sessao = criarSessao();
  ate(sessao, 'resultado', payloadEmpateVoceA());
  assert.equal(sessao.hud.estado, 'resultado');
  assert.equal(sessao.pote.modo, 'split');
  assert.deepEqual(sessao.pote.vencedoresVisuais, ['voce', 'adversarioA']);
  assert.equal(sessao.hud.cta?.nome, COPY.ctaProximaMao);
});

test('tres: tres assentos destacados; 0 classe de escurecer perdedor', () => {
  const sessao = criarSessao();
  ate(sessao, 'resultado', payloadRoyalBoard());
  assert.equal(sessao.pote.modo, 'split');
  assert.deepEqual(sessao.pote.vencedoresVisuais, ['voce', 'adversarioA', 'adversarioB']);
  assert.equal(fonteMesa.includes('opacity'), false);
  assert.equal(/escurec|dimmed|perdedor/.test(fonteMesa), false);
  assert.ok(fonteIndex.includes("data-para=\"adversarioB\"") || fonteIndex.includes("data-para='adversarioB'"));
});

test('showdown.ok false apos virada -> ociosa + Nova mo; 0 perguntando', () => {
  const sessao = criarSessao();
  ate(sessao, 'river', payloadHeroiParAFlush());
  sessao.mao.cartasJogo[10] = { ...sessao.mao.cartasJogo[0] };
  sessao.mao.showdown = { ok: false, maos: null, vencedorId: null, vencedores: [], conjuntoPote: null };
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaNovaMao);
  assert.notEqual(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao, null);
});

test('pendente apos virada permanece deal', () => {
  const sessao = criarSessao();
  ate(sessao, 'river', payloadHeroiParAFlush());
  delete sessao.mao.showdown;
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.mao.viradaShowdownConcluida, true);
});

test('Proxima mo com pote split devolve centro e novo deal', () => {
  const sessao = criarSessao();
  ate(sessao, 'resultado', payloadEmpateVoceA());
  assert.equal(sessao.pote.modo, 'split');
  aplicar(sessao, EVENTOS.PROXIMA_MAO, payloadHeroiParAFlush());
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.pote.modo, 'centro');
  assert.deepEqual(sessao.pote.vencedoresVisuais, []);
  assert.equal(sessao.hud.cta, null);
});

test('acerto river_hero vai a river_a; 0 upgrade no river', () => {
  const sessao = criarSessao();
  ate(sessao, 'river_hero', payloadHeroiParAFlush());
  acertarUnica(sessao, sessao.mao.corretaUnica);
  assert.equal(sessao.mao.passo, PASSOS.river_a);
  assert.notEqual(sessao.mao.passo, PASSOS.flop_upgrade);
  assert.notEqual(sessao.mao.passo, PASSOS.turn_upgrade);
  assert.equal(fonteMesa.includes('river_upgrade'), false);
});

test('reload no showdown aborta a mo e preserva contadores; blob s 3 buckets', () => {
  const { map, api } = memoria();
  const storage = criarStorage({ api });
  const sessao = criarSessao({ storage });
  ate(sessao, 'river_a', payloadHeroiParAFlush());
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: sessao.hud.opcoes.find((o) => !o.verdadeira).id });
  assert.equal(sessao.evolucao.mao_atual.flush.erros, 1);
  const deNovo = criarSessao({ storage });
  assert.equal(deNovo.hud.estado, 'ociosa');
  assert.equal(deNovo.mao, null);
  assert.equal(deNovo.evolucao.mao_atual.flush.erros, 1);
  const blob = JSON.parse(map.get(CHAVE_EVOLUCAO));
  assert.deepEqual(Object.keys(blob).sort(), ['mao_atual', 'upgrade', 'vencedor_pote']);
  const json = JSON.stringify(blob);
  assert.equal(/chaveDesempate/.test(json), false);
  assert.equal(/Melhor5/.test(json), false);
  assert.equal(/cartasJogo/.test(json), false);
});

test('fail-open de storage deixa as quatro perguntas e o resultado seguirem', () => {
  const sessao = criarSessao({ storage: criarStorage({ indisponivel: true }) });
  assert.doesNotThrow(() => {
    ate(sessao, 'resultado', payloadHeroiParAFlush());
  });
  assert.equal(sessao.hud.estado, 'resultado');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaProximaMao);
});

test('mesa.js no importa motor.js nem chama localStorage; foca primeiro habilitado', () => {
  assert.equal(fonteMesa.includes("from './motor.js'"), false);
  assert.equal(/localStorage\s*[.([]/.test(fonteMesa), false);
  assert.ok(fonteMesa.includes('focarPrimeiroHabilitado'));
  assert.ok(fonteMesa.includes('prepararShowdown'));
  assert.equal(/Embaralhar/.test(fonteMesa), false);
});

test('categoriasIdentificadas s no resultado; 0 rtulo nas cartas', () => {
  const sessao = criarSessao();
  ate(sessao, 'river_vencedor', payloadHeroiParAFlush());
  assert.equal(sessao.hud.categoriasIdentificadas.voce, null);
  assert.equal(sessao.pote.modo, 'centro');
  acertarUnica(sessao, sessao.mao.corretaUnica);
  const c = sessao.hud.categoriasIdentificadas;
  assert.equal(c.voce, 'Par');
  assert.equal(c.adversarioA, 'Flush');
  assert.equal(c.adversarioB, 'Carta alta');
  assert.equal(JSON.stringify(sessao.hud).includes('chaveDesempate'), false);
  assert.equal(fonteMesa.includes('melhor 5'), false);
});

