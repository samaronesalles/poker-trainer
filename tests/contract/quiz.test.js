import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { aplicar, criarSessao, EVENTOS } from '../../js/mesa.js';
import {
  COPY,
  PASSOS,
  criarOpcoesCategoria,
  shuffleOpcoes,
} from '../../js/quiz.js';
import { CHAVE_EVOLUCAO, criarStorage } from '../../js/storage.js';
import { criarMisturaVisita, montarMao } from '../../js/baralho.js';

const raiz = dirname(fileURLToPath(import.meta.url));
const fonteQuiz = readFileSync(join(raiz, '../../js/quiz.js'), 'utf8');

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

function payloadMontagem() {
  const resultado = montarMao(criarMisturaVisita());
  assert.equal(resultado.status, 'ok');
  return { permutacao: resultado.permutacao, cartasJogo: resultado.cartasJogo };
}

function sessaoNova(api) {
  return criarSessao({ storage: criarStorage({ api: api ?? memoria().api }) });
}

function ateFlopHero(sessao) {
  aplicar(sessao, EVENTOS.INICIAR_MAO, payloadMontagem());
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'holes' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'flop' });
}

function acertarUnica(sessao, id) {
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id });
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
}

function opcao(sessao, id) {
  return sessao.hud.opcoes.find((item) => item.id === id);
}

test('unica: 0 Confirmar; clique distratora submete; clique flush submete', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  assert.notEqual(sessao.hud.cta?.nome, COPY.ctaConfirmar);
  assert.equal(sessao.hud.cta, null);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  assert.equal(sessao.hud.feedback, 'erro');
  assert.equal(sessao.hud.feedbackTexto, COPY.erro);
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
  assert.equal(sessao.hud.feedback, 'acerto');
  assert.equal(sessao.hud.feedbackTexto, COPY.acerto);
  assert.equal(sessao.mao.faseTentativa, 'aguardando_beat');
});

test('erro: copy exata, ✕ no mesmo índice, ordem congelada, certa ainda não marcada', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  const ordem = sessao.hud.opcoes.map((item) => item.id);
  const indice = ordem.indexOf('carta_alta');
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'carta_alta' });
  assert.equal(sessao.hud.feedbackTexto, 'Não é essa. Tente de novo.');
  assert.deepEqual(
    sessao.hud.opcoes.map((item) => item.id),
    ordem,
  );
  const morta = sessao.hud.opcoes[indice];
  assert.equal(morta.id, 'carta_alta');
  assert.equal(morta.estadoVisual, 'eliminada');
  assert.equal(morta.marca, 'corte');
  assert.equal(morta.ativavel, false);
  const flush = opcao(sessao, 'flush');
  assert.notEqual(flush.estadoVisual, 'acertada');
  assert.notEqual(flush.marca, 'acerto');
  assert.equal(flush.ativavel, true);
});

test('erro depois acerto no herói: mao_atual.flush +1 erro +0 acerto', () => {
  const { api } = memoria();
  const sessao = sessaoNova(api);
  ateFlopHero(sessao);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
  const flush = sessao.evolucao.mao_atual.flush;
  assert.equal(flush.acertos, 0);
  assert.equal(flush.erros, 1);
  assert.equal(flush.exposicoes, 1);
  assert.deepEqual(sessao.evolucao.mao_atual.par, {
    acertos: 0,
    erros: 0,
    exposicoes: 0,
  });
});

test('acerto de primeira em flop_hero incrementa mao_atual.flush', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
  assert.equal(sessao.evolucao.mao_atual.flush.acertos, 1);
  assert.equal(sessao.evolucao.mao_atual.flush.erros, 0);
  assert.equal(sessao.evolucao.mao_atual.flush.exposicoes, 1);
});

test('multipla: toggle não avalia; só CONFIRMAR avalia', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarUnica(sessao, 'flush');
  assert.equal(sessao.mao.passo, PASSOS.flop_upgrade);
  const antes = JSON.stringify(sessao.evolucao.upgrade);
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'par' });
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.equal(sessao.hud.feedback, null);
  assert.equal(JSON.stringify(sessao.evolucao.upgrade), antes);
  assert.equal(opcao(sessao, 'flush').estadoVisual, 'selecionada');
});

test('1ª Confirmar Flush+Par: acerto flush, erro par, pergunta não fecha', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarUnica(sessao, 'flush');
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  assert.equal(sessao.evolucao.upgrade.flush.acertos, 1);
  assert.equal(sessao.evolucao.upgrade.par.erros, 1);
  assert.equal(sessao.evolucao.upgrade.par.acertos, 0);
  assert.equal(opcao(sessao, 'par').estadoVisual, 'eliminada');
  assert.equal(opcao(sessao, 'par').marca, 'corte');
  assert.equal(opcao(sessao, 'flush').estadoVisual, 'acertada');
  assert.equal(opcao(sessao, 'flush').ativavel, false);
  assert.equal(sessao.mao.passo, PASSOS.flop_upgrade);
  assert.equal(sessao.hud.estado, 'perguntando');
  assert.notEqual(sessao.mao.faseTentativa, 'aguardando_beat');
});

test('1ª Confirmar vazio: upgrade.flush +1 erro; Flush segue ativável', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarUnica(sessao, 'flush');
  aplicar(sessao, EVENTOS.CONFIRMAR);
  assert.equal(sessao.evolucao.upgrade.flush.erros, 1);
  assert.equal(sessao.evolucao.upgrade.flush.acertos, 0);
  assert.equal(sessao.evolucao.upgrade.par.erros, 0);
  assert.equal(opcao(sessao, 'flush').ativavel, true);
  assert.equal(sessao.hud.feedbackTexto, COPY.erro);
});

test('2ª Confirmar não muda contadores; distratora nova morre', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarUnica(sessao, 'flush');
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  const antes = JSON.stringify(sessao.evolucao.upgrade);
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'trinca' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  assert.equal(JSON.stringify(sessao.evolucao.upgrade), antes);
  assert.equal(opcao(sessao, 'trinca').estadoVisual, 'eliminada');
});

test('conjunto só Flush na 1ª Confirmar: acerto + beat', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarUnica(sessao, 'flush');
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  assert.equal(sessao.hud.feedback, 'acerto');
  assert.equal(sessao.mao.faseTentativa, 'aguardando_beat');
  assert.equal(sessao.evolucao.upgrade.flush.acertos, 1);
});

test('turn_skip / Continuar não toca upgrade', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarUnica(sessao, 'flush');
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  const antes = JSON.stringify(sessao.evolucao.upgrade);
  acertarUnica(sessao, 'flush');
  assert.equal(sessao.hud.estado, 'sem_upgrade');
  aplicar(sessao, EVENTOS.CONTINUAR);
  assert.equal(JSON.stringify(sessao.evolucao.upgrade), antes);
});

test('G008: 10 apresentar não fixam a correta; retry não permuta', () => {
  const indices = [];
  for (let i = 0; i < 10; i += 1) {
    const opcoes = criarOpcoesCategoria(PASSOS.flop_hero);
    indices.push(opcoes.findIndex((item) => item.id === 'flush'));
  }
  assert.ok(new Set(indices).size > 1);
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  const ordem = sessao.hud.opcoes.map((item) => item.id);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  assert.deepEqual(
    sessao.hud.opcoes.map((item) => item.id),
    ordem,
  );
  const rng = () => 0;
  const a = shuffleOpcoes([{ id: 'a' }, { id: 'b' }, { id: 'c' }], rng);
  const b = shuffleOpcoes([{ id: 'a' }, { id: 'b' }, { id: 'c' }], rng);
  assert.deepEqual(
    a.map((item) => item.id),
    b.map((item) => item.id),
  );
});

test('vencedor 1ª tentativa alimenta só vencedor_pote', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarUnica(sessao, 'flush');
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  acertarUnica(sessao, 'flush');
  aplicar(sessao, EVENTOS.CONTINUAR);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  acertarUnica(sessao, 'flush');
  acertarUnica(sessao, 'par');
  acertarUnica(sessao, 'par');
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'voce' });
  assert.equal(sessao.evolucao.vencedor_pote.acertos, 1);
  assert.equal(sessao.evolucao.vencedor_pote.erros, 0);
  assert.equal(sessao.evolucao.vencedor_pote.exposicoes, 1);
});

test('river: três exposições mao_atual independentes (Flush, Par, Par)', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarUnica(sessao, 'flush');
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
  acertarUnica(sessao, 'flush');
  aplicar(sessao, EVENTOS.CONTINUAR);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
  acertarUnica(sessao, 'flush');
  acertarUnica(sessao, 'par');
  acertarUnica(sessao, 'par');
  assert.equal(sessao.evolucao.mao_atual.flush.acertos, 3);
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 2);
  assert.equal(sessao.evolucao.mao_atual.par.exposicoes, 2);
});

test('storage indisponível: HUD e mão seguem; 0 throw; blob sem PII', () => {
  const sessao = criarSessao({ storage: criarStorage({ indisponivel: true }) });
  assert.doesNotThrow(() => {
    ateFlopHero(sessao);
    aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
    aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
    aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  });
  assert.equal(sessao.hud.feedbackTexto ?? COPY.acerto, COPY.acerto);
  assert.equal(sessao.mao.passo, PASSOS.flop_upgrade);
  const { map, api } = memoria();
  const ok = sessaoNova(api);
  ateFlopHero(ok);
  aplicar(ok, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
  const blob = JSON.parse(map.get(CHAVE_EVOLUCAO));
  const json = JSON.stringify(blob);
  assert.equal('nome' in blob, false);
  assert.equal('email' in blob, false);
  assert.equal('cpf' in blob, false);
  assert.equal('versao' in blob, false);
  assert.match(json, /mao_atual/);
  assert.equal(/@/.test(json), false);
});

test('quiz.js não importa baralho nem usa setTimeout na FSM', () => {
  assert.equal(fonteQuiz.includes('baralho.js'), false);
  assert.equal(fonteQuiz.includes('setTimeout'), false);
  assert.equal(fonteQuiz.includes('alert('), false);
});
