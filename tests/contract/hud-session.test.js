import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cartasDeJogo, criarBaralhoPadrao, criarMisturaVisita, montarMao } from '../../js/baralho.js';
import { aplicar, criarSessao, duracaoBeatMs, EVENTOS, LINHA_ERRO_MONTAGEM } from '../../js/mesa.js';
import { COPY, PASSOS } from '../../js/quiz.js';
import { criarStorage } from '../../js/storage.js';

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

function acertarUpgradeStub(sessao) {
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
}

function ate(sessao, alvo, payload = payloadMontagem()) {
  aplicar(sessao, EVENTOS.INICIAR_MAO, payload);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'holes' });
  if (alvo === 'holes') return;
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'flop' });
  if (alvo === 'flop_hero') return;
  acertarUnica(sessao, 'flush');
  if (alvo === 'flop_upgrade') return;
  acertarUpgradeStub(sessao);
  if (alvo === 'turn_deal') return;
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  if (alvo === 'turn_hero') return;
  acertarUnica(sessao, 'flush');
  if (alvo === 'turn_skip') return;
  aplicar(sessao, EVENTOS.CONTINUAR);
  if (alvo === 'river_deal') return;
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
  if (alvo === 'river') return;
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  if (alvo === 'river_hero') return;
  acertarUnica(sessao, 'flush');
  if (alvo === 'river_a') return;
  acertarUnica(sessao, 'par');
  if (alvo === 'river_b') return;
  acertarUnica(sessao, 'par');
  if (alvo === 'river_vencedor') return;
  acertarUnica(sessao, 'voce');
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

test('4. flop pousado ? perguntando flop_hero, 6 opes, correta flush', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_hero');
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoHero);
  assert.equal(sessao.hud.opcoes.length, 6);
  const corretas = sessao.hud.opcoes.filter((o) => o.correta);
  assert.equal(corretas.length, 1);
  assert.equal(corretas[0].id, 'flush');
  assert.equal(corretas[0].rotulo, 'Flush');
  assert.equal(sessao.hud.cta, null);
});

test('5. escolha errada permanece flop_hero, opo eliminada e mostra erro', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_hero');
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
  assert.equal(sessao.hud.feedback, 'erro');
  const par = opcao(sessao, 'par');
  assert.equal(par.desabilitada, true);
  assert.equal(par.estadoVisual, 'eliminada');
  assert.equal(par.marca, 'corte');
  assert.equal(opcao(sessao, 'flush').ativavel, true);
});

test('escolha flush permanece perguntando at FIM_BEAT_ACERTO', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_hero');
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
  assert.equal(sessao.hud.feedback, 'acerto');
  assert.equal(sessao.mao.faseTentativa, 'aguardando_beat');
  assert.equal(sessao.hud.cta, null);
  assert.equal(opcao(sessao, 'flush').marca, 'acerto');
});

test('6. flush + FIM_BEAT_ACERTO ? flop_upgrade com Confirmar, 0 sem_upgrade', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_upgrade');
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.flop_upgrade);
  assert.equal(sessao.hud.cta?.nome, COPY.ctaConfirmar);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoUpgrades);
  assert.notEqual(sessao.hud.estado, 'sem_upgrade');
  assert.equal(PASSOS.flop_skip, undefined);
});

test('ALTERNAR_OPCAO em flop_upgrade permanece perguntando com feedback null', () => {
  const sessao = criarSessao();
  ate(sessao, 'flop_upgrade');
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.hud.feedback, null);
});

test('7. CONFIRMAR s flush + beat ? deal turn, no skip', () => {
  const sessao = criarSessao();
  ate(sessao, 'turn_deal');
  assert.equal(sessao.hud.estado, 'deal');
  assert.equal(sessao.mao.street, 'turn');
  assert.equal(sessao.hud.opcoes.length, 0);
  assert.equal(sessao.hud.cta, null);
});

test('8. turn_hero acertado ? sem_upgrade + Continuar; Continuar ? deal river', () => {
  const sessao = criarSessao();
  ate(sessao, 'turn_skip');
  assert.equal(sessao.hud.estado, 'sem_upgrade');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaContinuar);
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

test('10. virada concluda ? perguntando river_hero apenas', () => {
  const sessao = criarSessao();
  ate(sessao, 'river_hero');
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.mao.passo, PASSOS.river_hero);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoHero);
  assert.equal(sessao.hud.opcoes.length, 6);
  assert.ok(sessao.hud.opcoes.every((o) => o.tipo === 'categoria'));
  assert.equal(sessao.mao.viradaShowdownConcluida, true);
  assert.equal(sessao.hud.cta, null);
});

test('11. sequncia A ? B ? vencedor uma a uma', () => {
  const sessao = criarSessao();
  ate(sessao, 'river_a');
  assert.equal(sessao.mao.passo, PASSOS.river_a);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoA);
  acertarUnica(sessao, 'par');
  assert.equal(sessao.mao.passo, PASSOS.river_b);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoB);
  acertarUnica(sessao, 'par');
  assert.equal(sessao.mao.passo, PASSOS.river_vencedor);
  assert.equal(sessao.hud.enunciado, COPY.enunciadoPote);
  assert.ok(sessao.hud.opcoes.every((o) => o.tipo === 'vencedor'));
});

test('12. vencedor mo 1 voce ? resultado no-split + Prxima mo (Voc Flush)', () => {
  const sessao = criarSessao();
  ate(sessao, 'river_vencedor');
  acertarUnica(sessao, 'voce');
  assert.equal(sessao.hud.estado, 'resultado');
  assert.equal(sessao.hud.cta?.nome, COPY.ctaProximaMao);
  assert.equal(sessao.pote.modo, 'para_vencedor');
  assert.deepEqual(sessao.pote.vencedoresVisuais, ['voce']);
  assert.equal(sessao.hud.categoriasIdentificadas.voce, 'Flush');
  assert.equal(sessao.hud.categoriasIdentificadas.adversarioA, 'Par');
  assert.equal(sessao.hud.categoriasIdentificadas.adversarioB, 'Par');
});

test('13. segunda mo, vencedor voce_a ? resultado split', () => {
  const sessao = criarSessao();
  ate(sessao, 'river_vencedor');
  acertarUnica(sessao, 'voce');
  aplicar(sessao, EVENTOS.PROXIMA_MAO, payloadMontagem());
  assert.equal(sessao.hud.estado, 'deal');
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'holes' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'flop' });
  acertarUnica(sessao, 'flush');
  acertarUpgradeStub(sessao);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  acertarUnica(sessao, 'flush');
  aplicar(sessao, EVENTOS.CONTINUAR);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  acertarUnica(sessao, 'flush');
  acertarUnica(sessao, 'par');
  acertarUnica(sessao, 'par');
  const correta = sessao.hud.opcoes.find((o) => o.correta);
  assert.equal(correta.id, 'voce_a');
  acertarUnica(sessao, 'voce_a');
  assert.equal(sessao.hud.estado, 'resultado');
  assert.equal(sessao.pote.modo, 'split');
  assert.deepEqual(sessao.pote.vencedoresVisuais, ['voce', 'adversarioA']);
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
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
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
  acertarUnica(sessao, 'flush');
  acertarUpgradeStub(sessao);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  assert.equal(sessao.mao.cartasJogo.map(chave).join('|'), jogoAntes);
  assert.equal(sessao.mao.permutacao.map(chave).join('|'), permAntes);
  assert.deepEqual(
    [6, 7, 8].map((i) => chave(sessao.mao.cartasJogo[i])),
    flopAntes,
  );
  assert.equal(chave(sessao.board.slots[0].carta), chave(payload.cartasJogo[6]));
  assert.equal(chave(sessao.board.slots[3].carta), chave(payload.cartasJogo[9]));
  acertarUnica(sessao, 'flush');
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
  ate(sessao, 'flop_hero');
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
  assert.equal(sessao.evolucao.mao_atual.flush.acertos, 1);
  const deNovo = criarSessao({ storage });
  assert.equal(deNovo.hud.estado, 'ociosa');
  assert.equal(deNovo.mao, null);
  assert.equal(deNovo.evolucao.mao_atual.flush.acertos, 1);
});

test('sesso no tem CTA zerar nem campos de relatrio; CTAs permitidos', () => {
  const sessao = criarSessao();
  const permitidos = new Set([COPY.ctaNovaMao, COPY.ctaProximaMao, COPY.ctaContinuar, COPY.ctaConfirmar]);
  assert.equal('zerar' in sessao, false);
  assert.equal('relatorio' in sessao, false);
  assert.equal(sessao.hud.cta?.nome, COPY.ctaNovaMao);
  ate(sessao, 'flop_upgrade');
  assert.ok(permitidos.has(sessao.hud.cta.nome));
  ate(sessao, 'turn_skip');
  assert.ok(permitidos.has(sessao.hud.cta.nome));
  ate(sessao, 'river_vencedor');
  acertarUnica(sessao, 'voce');
  assert.ok(permitidos.has(sessao.hud.cta.nome));
  assert.equal(sessao.hud.cta.nome, COPY.ctaProximaMao);
});

test('beat 400 ms padro e 0 se movimento reduzido', () => {
  assert.equal(duracaoBeatMs(false), 400);
  assert.equal(duracaoBeatMs(true), 0);
});
