import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aplicar, criarSessao, EVENTOS } from '../../js/mesa.js';
import { COPY, PASSOS } from '../../js/quiz-stub.js';

function opcao(sessao, id) {
  return sessao.hud.opcoes.find((item) => item.id === id);
}

function ate(sessao, alvo) {
  aplicar(sessao, EVENTOS.INICIAR_MAO);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'holes' });
  if (alvo === 'holes') return;
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'flop' });
  if (alvo === 'flop_hero') return;
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  if (alvo === 'flop_skip') return;
  aplicar(sessao, EVENTOS.CONTINUAR);
  if (alvo === 'turn_deal') return;
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  if (alvo === 'turn_hero') return;
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  if (alvo === 'turn_skip') return;
  aplicar(sessao, EVENTOS.CONTINUAR);
  if (alvo === 'river_deal') return;
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
  if (alvo === 'river') return;
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  if (alvo === 'river_hero') return;
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  if (alvo === 'river_a') return;
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  if (alvo === 'river_b') return;
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  if (alvo === 'river_vencedor') return;
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'voce' });
}

test('1. estado inicial ociosa, CTA Nova mão, 0 opções e linha de propósito', () => {
  const sessao = criarSessao();
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaNovaMao);
  assert.equal(sessao.hud.opcoes.length, 0);
  assert.equal(sessao.hud.linhaProposito, COPY.linhaProposito);
  assert.equal(sessao.mao, null);
  assert.equal(sessao.indiceMaoSessao, 0);
});

test('2. INICIAR_MAO ? deal com 0 opções', () => {
  const sessao = criarSessao();
  aplicar(sessao, EVENTOS.INICIAR_MAO);
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.hud.opcoes.length, 0);
  assert.equal(sessao.hud.cta, null);
  assert.equal(sessao.indiceMaoSessao, 1);
});

test('3. board vazio após hole pousadas permanece fora de perguntando', () => {
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

test('4. flop pousado ? perguntando flop_hero, 6 opções, correta par', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_hero');
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoHero);
  assert.equal(sessao.hud.opcoes.length, 6);
  const corretas = sessao.hud.opcoes.filter((o) => o.correta);
  assert.equal(corretas.length, 1);
  assert.equal(corretas[0].id, 'par');
  assert.equal(corretas[0].rotulo, 'Par');
});

test('5. escolha errada permanece perguntando, desabilita a opção e mostra erro', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_hero');
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
  assert.equal(sessao.hud.feedback, 'erro');
  const flush = opcao(sessao, 'flush');
  assert.equal(flush.desabilitada, true);
  assert.equal(flush.estadoVisual, 'errado_desabilitado');
  assert.equal(opcao(sessao, 'par').desabilitada, false);
});

test('6. escolha par ? sem_upgrade + Continuar', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_skip');
  assert.equal(sessao.hud.estado, 'sem_upgrade');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaContinuar);
  assert.equal(sessao.hud.opcoes.length, 0);
  assert.equal(sessao.mao.passo, PASSOS.flop_skip);
});

test('7. Continuar ? deal (turn)', () => {
  const sessao = criarSessao();
  ate(sessao, 'turn_deal');
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.mao.street, 'turn');
  assert.equal(sessao.hud.opcoes.length, 0);
  assert.equal(sessao.hud.cta, null);
});

test('8. turn_hero acertado ? sem_upgrade; Continuar ? deal river', () => {
  const sessao = criarSessao();
  ate(sessao, 'turn_skip');
  assert.equal(sessao.hud.estado, 'sem_upgrade');
  aplicar(sessao, EVENTOS.CONTINUAR);
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.mao.street, 'river');
});

test('9. river pousado sem virada permanece deal', () => {
  const sessao = criarSessao();
  ate(sessao, 'river');
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.mao.viradaShowdownConcluida, false);
  assert.equal(sessao.hud.opcoes.length, 0);
  const a = sessao.assentos.find((s) => s.id === 'adversarioA');
  assert.equal(a.hole[0].visibilidade, 'verso');
});

test('10. virada concluída ? perguntando river_hero apenas', () => {
  const sessao = criarSessao();
  ate(sessao, 'river_hero');
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.river_hero);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoHero);
  assert.equal(sessao.hud.opcoes.length, 6);
  assert.ok(sessao.hud.opcoes.every((o) => o.tipo === 'categoria'));
  assert.equal(sessao.mao.viradaShowdownConcluida, true);
});

test('11. sequência A ? B ? vencedor uma a uma', () => {
  const sessao = criarSessao();
  ate(sessao, 'river_a');
  assert.equal(sessao.mao.passo, PASSOS.river_a);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoA);
  ateContinua(sessao, 'river_b');
  assert.equal(sessao.mao.passo, PASSOS.river_b);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoB);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  assert.equal(sessao.mao.passo, PASSOS.river_vencedor);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoPote);
  assert.ok(sessao.hud.opcoes.every((o) => o.tipo === 'vencedor'));
});

function ateContinua(sessao, alvo) {
  if (alvo === 'river_b') {
    aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  }
}

test('12. vencedor mão 1 voce ? resultado não-split + Próxima mão', () => {
  const sessao = criarSessao();
  ate(sessao, 'river_vencedor');
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'voce' });
  assert.equal(sessao.hud.estado, 'resultado');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaProximaMao);
  assert.equal(sessao.pote.modo, 'para_vencedor');
  assert.deepEqual(sessao.pote.vencedoresVisuais, ['voce']);
  assert.equal(sessao.hud.categoriasIdentificadas.voce, 'Par');
});

test('13. segunda mão, vencedor voce_a ? resultado split', () => {
  const sessao = criarSessao();
  ate(sessao, 'river_vencedor');
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'voce' });
  aplicar(sessao, EVENTOS.PROXIMA_MAO);
  assert.equal(sessao.hud.estado, 'deal');
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'holes' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'flop' });
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.CONTINUAR);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.CONTINUAR);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  const correta = sessao.hud.opcoes.find((o) => o.correta);
  assert.equal(correta.id, 'voce_a');
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'voce_a' });
  assert.equal(sessao.hud.estado, 'resultado');
  assert.equal(sessao.pote.modo, 'split');
  assert.deepEqual(sessao.pote.vencedoresVisuais, ['voce', 'adversarioA']);
});

test('14. FALHA_DEAL ? ociosa + Nova mão', () => {
  const sessao = criarSessao();
  aplicar(sessao, EVENTOS.INICIAR_MAO);
  aplicar(sessao, EVENTOS.FALHA_DEAL);
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaNovaMao);
  assert.equal(sessao.mao, null);
  assert.equal(sessao.hud.opcoes.length, 0);
});

test('clique em opção desabilitada ignora', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_hero');
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
});
