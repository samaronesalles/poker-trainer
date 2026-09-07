import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cartasDeJogo, criarBaralhoPadrao, criarMisturaVisita, montarMao } from '../../js/baralho.js';
import { aplicar, criarSessao, EVENTOS, LINHA_ERRO_MONTAGEM } from '../../js/mesa.js';
import { COPY, PASSOS } from '../../js/quiz-stub.js';

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

function ate(sessao, alvo, payload = payloadMontagem()) {
  aplicar(sessao, EVENTOS.INICIAR_MAO, payload);
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
  assert.equal(sessao.hud.linhaErro, null);
  assert.equal(sessao.mao, null);
  assert.equal(sessao.indiceMaoSessao, 0);
  assert.equal(sessao.montagemEmCurso, false);
  assert.ok(sessao.misturaVisita);
});

test('2. INICIAR_MAO com montagem RN-044 ? deal com 0 opções', () => {
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

test('INICIAR_MAO sem payload válido permanece ociosa e mao null', () => {
  const sessao = criarSessao();
  aplicar(sessao, EVENTOS.INICIAR_MAO);
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.mao, null);
  assert.equal(sessao.indiceMaoSessao, 0);
  aplicar(sessao, EVENTOS.INICIAR_MAO, { cartasJogo: [], permutacao: [] });
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.mao, null);
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

test('após holes, mapeamento RN-044 A=[0][1] B=[2][3] Você=[4][5]', () => {
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
  aplicar(sessao, EVENTOS.PROXIMA_MAO, payloadMontagem());
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
  aplicar(sessao, EVENTOS.INICIAR_MAO, payloadMontagem());
  aplicar(sessao, EVENTOS.FALHA_DEAL);
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaNovaMao);
  assert.equal(sessao.mao, null);
  assert.equal(sessao.hud.opcoes.length, 0);
  assert.equal(sessao.hud.linhaErro, null);
});

test('clique em opção desabilitada ignora', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_hero');
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
});

test('CONTINUAR / streets não substituem cartasJogo nem permutacao', () => {
  const sessao = criarSessao();
  const payload = payloadFabrica();
  ate(sessao, 'flop_hero', payload);
  const jogoAntes = sessao.mao.cartasJogo.map(chave).join('|');
  const permAntes = sessao.mao.permutacao.map(chave).join('|');
  const flopAntes = [6, 7, 8].map((i) => chave(sessao.mao.cartasJogo[i]));
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.CONTINUAR);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  assert.equal(sessao.mao.cartasJogo.map(chave).join('|'), jogoAntes);
  assert.equal(sessao.mao.permutacao.map(chave).join('|'), permAntes);
  assert.deepEqual(
    [6, 7, 8].map((i) => chave(sessao.mao.cartasJogo[i])),
    flopAntes,
  );
  assert.equal(chave(sessao.board.slots[0].carta), chave(payload.cartasJogo[6]));
  assert.equal(chave(sessao.board.slots[3].carta), chave(payload.cartasJogo[9]));
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.CONTINUAR);
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

test('FALHA_MONTAGEM permanece ociosa com copy canônica e Nova mão', () => {
  const sessao = criarSessao();
  aplicar(sessao, EVENTOS.FALHA_MONTAGEM);
  assert.equal(sessao.hud.estado, 'ociosa');
  assert.equal(sessao.mao, null);
  assert.equal(sessao.hud.linhaErro, LINHA_ERRO_MONTAGEM);
  assert.equal(LINHA_ERRO_MONTAGEM, 'NÃ£o foi possÃ­vel embaralhar. Tente de novo.');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaNovaMao);
  assert.equal(sessao.hud.opcoes.length, 0);
  assert.notEqual(sessao.hud.estado, 'deal');
});

test('segunda intenção com montagemEmCurso não incrementa indiceMaoSessao', () => {
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
