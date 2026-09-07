import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { cartasDeJogo, criarBaralhoPadrao } from '../../js/baralho.js';
import { aplicar, criarSessao, EVENTOS } from '../../js/mesa.js';
import {
  COPY,
  PASSOS,
  criarOpcoesCategoria,
  shuffleOpcoes,
} from '../../js/quiz.js';
import { CHAVE_EVOLUCAO, criarStorage } from '../../js/storage.js';
import { CATEGORIAS } from '../../js/motor.js';

const raiz = dirname(fileURLToPath(import.meta.url));
const fonteQuiz = readFileSync(join(raiz, '../../js/quiz.js'), 'utf8');

const ROTULOS_RN014 = new Set(CATEGORIAS.map((item) => item.rotulo));

function carta(rank, naipe) {
  return { rank, naipe };
}

function payloadDeOnze(onze) {
  const usadas = new Set(onze.map((item) => `${item.rank}-${item.naipe}`));
  const resto = criarBaralhoPadrao().filter((item) => !usadas.has(`${item.rank}-${item.naipe}`));
  const permutacao = [...onze, ...resto];
  return { permutacao, cartasJogo: cartasDeJogo(permutacao) };
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

function payloadParFlopDoisParesTurn() {
  return payloadDeOnze([
    carta('K', 'espadas'),
    carta('K', 'copas'),
    carta('Q', 'espadas'),
    carta('Q', 'copas'),
    carta('A', 'espadas'),
    carta('3', 'paus'),
    carta('A', 'copas'),
    carta('K', 'ouros'),
    carta('7', 'espadas'),
    carta('7', 'copas'),
    carta('4', 'paus'),
  ]);
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

function sessaoNova(api) {
  return criarSessao({ storage: criarStorage({ api: api ?? memoria().api }) });
}

function ateFlopHero(sessao, payload = payloadParFlop()) {
  aplicar(sessao, EVENTOS.INICIAR_MAO, payload);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'holes' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'flop' });
}

function acertarHero(sessao) {
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: sessao.mao.corretaUnica });
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
}

function acertarUpgradeStub(sessao) {
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
}

function ateTurnHero(sessao, payload = payloadParFlop()) {
  ateFlopHero(sessao, payload);
  acertarHero(sessao);
  acertarUpgradeStub(sessao);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'turn' });
}

function opcao(sessao, id) {
  return sessao.hud.opcoes.find((item) => item.id === id);
}

function distratora(sessao) {
  return sessao.hud.opcoes.find((item) => item.verdadeira === false);
}

function ateRiverHero(sessao, payload = payloadParFlop()) {
  ateTurnHero(sessao, payload);
  acertarHero(sessao);
  aplicar(sessao, EVENTOS.CONTINUAR);
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'river' });
  aplicar(sessao, EVENTOS.FIM_ANIMACAO_STREET, { etapa: 'showdown' });
}

test('§5.1 flop pousado: enunciado canônico, 6 rótulos RN-014, 0 Confirmar', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  assert.equal(sessao.hud.enunciado, 'Qual mão você tem agora?');
  assert.equal(sessao.hud.opcoes.length, 6);
  assert.equal(sessao.hud.cta, null);
  const ids = new Set(sessao.hud.opcoes.map((item) => item.id));
  const rotulos = new Set(sessao.hud.opcoes.map((item) => item.rotulo));
  assert.equal(ids.size, 6);
  assert.equal(rotulos.size, 6);
  assert.ok([...rotulos].every((rotulo) => ROTULOS_RN014.has(rotulo)));
});

test('§5.2 fixture de par no flop: corretaUnica par; 1ª acerto → mao_atual.par', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  assert.equal(sessao.mao.corretaUnica, 'par');
  const verdadeiras = sessao.hud.opcoes.filter((item) => item.verdadeira);
  assert.equal(verdadeiras.length, 1);
  assert.equal(verdadeiras[0].id, 'par');
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 1);
  assert.equal(sessao.evolucao.mao_atual.par.erros, 0);
  assert.equal(sessao.evolucao.mao_atual.par.exposicoes, 1);
});

test('§5.4 acerto flop + beat → flop_upgrade, não turn', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarHero(sessao);
  assert.equal(sessao.mao.passo, PASSOS.flop_upgrade);
  assert.notEqual(sessao.mao.street, 'turn');
  assert.notEqual(sessao.mao.passo, PASSOS.turn_hero);
});

test('unica: 0 Confirmar; clique distratora submete; clique da certa submete', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  assert.notEqual(sessao.hud.cta?.nome, COPY.ctaConfirmar);
  assert.equal(sessao.hud.cta, null);
  const morta = distratora(sessao);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: morta.id });
  assert.equal(sessao.hud.feedback, 'erro');
  assert.equal(sessao.hud.feedbackTexto, COPY.erro);
  assert.equal(sessao.mao.passo, PASSOS.flop_hero);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: sessao.mao.corretaUnica });
  assert.equal(sessao.hud.feedback, 'acerto');
  assert.equal(sessao.hud.feedbackTexto, COPY.acerto);
  assert.equal(sessao.mao.faseTentativa, 'aguardando_beat');
});

test('§5.3 / RN-019: erro na categoria correta; morta no lugar; 2º clique não vira acerto', () => {
  const { api } = memoria();
  const sessao = sessaoNova(api);
  ateFlopHero(sessao);
  const ordem = sessao.hud.opcoes.map((item) => item.id);
  const chute = distratora(sessao);
  const indice = ordem.indexOf(chute.id);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: chute.id });
  assert.equal(sessao.hud.feedbackTexto, 'Não é essa. Tente de novo.');
  assert.deepEqual(
    sessao.hud.opcoes.map((item) => item.id),
    ordem,
  );
  const morta = sessao.hud.opcoes[indice];
  assert.equal(morta.id, chute.id);
  assert.equal(morta.estadoVisual, 'eliminada');
  assert.equal(morta.marca, 'corte');
  assert.equal(morta.ativavel, false);
  const certa = opcao(sessao, 'par');
  assert.notEqual(certa.estadoVisual, 'acertada');
  assert.notEqual(certa.marca, 'acerto');
  assert.equal(sessao.evolucao.mao_atual.par.erros, 1);
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 0);
  assert.deepEqual(sessao.evolucao.mao_atual[chute.id], {
    acertos: 0,
    erros: 0,
    exposicoes: 0,
  });
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: chute.id });
  assert.equal(sessao.evolucao.mao_atual.par.erros, 1);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'ausente' });
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 0);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 0);
  assert.equal(sessao.evolucao.mao_atual.par.erros, 1);
  assert.equal(sessao.hud.feedback, 'acerto');
});

test('multipla: toggle não avalia; só CONFIRMAR avalia', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  acertarHero(sessao);
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
  acertarHero(sessao);
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
  acertarHero(sessao);
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
  acertarHero(sessao);
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
  acertarHero(sessao);
  aplicar(sessao, EVENTOS.ALTERNAR_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.CONFIRMAR);
  assert.equal(sessao.hud.feedback, 'acerto');
  assert.equal(sessao.mao.faseTentativa, 'aguardando_beat');
  assert.equal(sessao.evolucao.upgrade.flush.acertos, 1);
});

test('§5.5–5.6 turn pousado: nova pergunta; 1ª tentativa nova; beat → turn_skip', () => {
  const sessao = sessaoNova();
  ateTurnHero(sessao, payloadParFlopDoisParesTurn());
  assert.equal(sessao.hud.enunciado, 'Qual mão você tem agora?');
  assert.equal(sessao.hud.opcoes.length, 6);
  assert.equal(sessao.mao.corretaUnica, 'dois_pares');
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 1);
  assert.equal(sessao.evolucao.mao_atual.dois_pares.exposicoes, 0);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'dois_pares' });
  assert.equal(sessao.evolucao.mao_atual.dois_pares.acertos, 1);
  assert.equal(sessao.evolucao.mao_atual.dois_pares.exposicoes, 1);
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  assert.equal(sessao.hud.estado, 'sem_upgrade');
  assert.equal(sessao.mao.passo, PASSOS.turn_skip);
  assert.equal(sessao.hud.cta?.nome, COPY.ctaContinuar);
  assert.notEqual(sessao.mao.street, 'river');
});

test('SC-012: flop e turn da mesma mão são duas exposições mesmo com o mesmo id', () => {
  const sessao = sessaoNova();
  ateTurnHero(sessao, payloadParFlop());
  assert.equal(sessao.mao.corretaUnica, 'par');
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 1);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 2);
  assert.equal(sessao.evolucao.mao_atual.par.exposicoes, 2);
});

test('turn_skip / Continuar não toca upgrade', () => {
  const sessao = sessaoNova();
  ateTurnHero(sessao);
  const antes = JSON.stringify(sessao.evolucao.upgrade);
  acertarHero(sessao);
  assert.equal(sessao.hud.estado, 'sem_upgrade');
  aplicar(sessao, EVENTOS.CONTINUAR);
  assert.equal(JSON.stringify(sessao.evolucao.upgrade), antes);
});

test('§5.8 G008: 10 apresentar não fixam a correta; retry não permuta; conjunto estável', () => {
  const indices = [];
  const conjuntos = [];
  for (let i = 0; i < 10; i += 1) {
    const sessao = sessaoNova();
    const payload = i % 2 === 0 ? payloadParFlop() : payloadParFlopDoisParesTurn();
    if (i < 5) ateFlopHero(sessao, payload);
    else ateTurnHero(sessao, payload);
    indices.push(sessao.hud.opcoes.findIndex((item) => item.id === sessao.mao.corretaUnica));
    conjuntos.push([...sessao.hud.opcoes.map((item) => item.id)].sort().join('|'));
  }
  assert.ok(new Set(indices).size > 1);
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  const ordem = sessao.hud.opcoes.map((item) => item.id);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: distratora(sessao).id });
  assert.deepEqual(
    sessao.hud.opcoes.map((item) => item.id),
    ordem,
  );
  const repetida = sessaoNova();
  ateFlopHero(repetida, payloadParFlop());
  const idsA = new Set(sessao.hud.opcoes.map((item) => item.id));
  const idsB = new Set(repetida.hud.opcoes.map((item) => item.id));
  assert.deepEqual([...idsA].sort(), [...idsB].sort());
  const rng = () => 0;
  const a = shuffleOpcoes([{ id: 'a' }, { id: 'b' }, { id: 'c' }], rng);
  const b = shuffleOpcoes([{ id: 'a' }, { id: 'b' }, { id: 'c' }], rng);
  assert.deepEqual(
    a.map((item) => item.id),
    b.map((item) => item.id),
  );
  void conjuntos;
});

test('§5.9 / SC-008: 0 kickers, 0 sinônimos, 0 chaveDesempate no HUD', () => {
  const sessao = sessaoNova();
  ateFlopHero(sessao);
  const textos = [
    sessao.hud.enunciado,
    ...sessao.hud.opcoes.map((item) => item.rotulo),
    JSON.stringify(sessao.hud),
  ].join(' | ');
  assert.equal(/par de (reis|ases)/i.test(textos), false);
  assert.equal(/Sequência/.test(textos), false);
  assert.equal(/chaveDesempate/.test(textos), false);
  assert.ok(sessao.hud.opcoes.every((item) => ROTULOS_RN014.has(item.rotulo)));
  ateTurnHero(sessaoNova());
  const turn = sessaoNova();
  ateTurnHero(turn);
  const textosTurn = [turn.hud.enunciado, ...turn.hud.opcoes.map((item) => item.rotulo)].join(' | ');
  assert.equal(/par de (reis|ases)/i.test(textosTurn), false);
  assert.equal(/Sequência/.test(textosTurn), false);
});

test('vencedor 1ª tentativa alimenta só vencedor_pote', () => {
  const sessao = sessaoNova();
  ateRiverHero(sessao);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'flush' });
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'voce' });
  assert.equal(sessao.evolucao.vencedor_pote.acertos, 1);
  assert.equal(sessao.evolucao.vencedor_pote.erros, 0);
  assert.equal(sessao.evolucao.vencedor_pote.exposicoes, 1);
});

test('§5.7 river_hero continua stub Flush; flop/turn independentes', () => {
  const sessao = sessaoNova();
  ateRiverHero(sessao);
  assert.equal(sessao.mao.passo, PASSOS.river_hero);
  assert.equal(sessao.mao.corretaUnica, 'flush');
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 2);
  acertarHero(sessao);
  assert.equal(sessao.evolucao.mao_atual.flush.acertos, 1);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  assert.equal(sessao.evolucao.mao_atual.flush.acertos, 1);
  assert.equal(sessao.evolucao.mao_atual.par.acertos, 4);
  assert.equal(sessao.evolucao.mao_atual.par.exposicoes, 4);
});

test('storage indisponível: HUD e mão seguem; 0 throw; blob sem PII', () => {
  const sessao = criarSessao({ storage: criarStorage({ indisponivel: true }) });
  assert.doesNotThrow(() => {
    ateFlopHero(sessao);
    aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: distratora(sessao).id });
    aplicar(sessao, EVENTOS.ESCOLHER_OPCAO, { id: sessao.mao.corretaUnica });
    aplicar(sessao, EVENTOS.FIM_BEAT_ACERTO);
  });
  assert.equal(sessao.hud.feedbackTexto ?? COPY.acerto, COPY.acerto);
  assert.equal(sessao.mao.passo, PASSOS.flop_upgrade);
  const { map, api } = memoria();
  const ok = sessaoNova(api);
  ateFlopHero(ok);
  aplicar(ok, EVENTOS.ESCOLHER_OPCAO, { id: 'par' });
  const blob = JSON.parse(map.get(CHAVE_EVOLUCAO));
  const json = JSON.stringify(blob);
  assert.equal('nome' in blob, false);
  assert.equal('email' in blob, false);
  assert.equal('cpf' in blob, false);
  assert.equal('versao' in blob, false);
  assert.equal('chaveDesempate' in blob, false);
  assert.match(json, /mao_atual/);
  assert.equal(/@/.test(json), false);
  assert.equal(/chaveDesempate/.test(json), false);
});

test('quiz.js não importa baralho nem usa setTimeout na FSM', () => {
  assert.equal(fonteQuiz.includes('baralho.js'), false);
  assert.equal(fonteQuiz.includes('setTimeout'), false);
  assert.equal(fonteQuiz.includes('alert('), false);
  assert.equal(fonteQuiz.includes('embaralhar'), false);
  assert.ok(fonteQuiz.includes("from './motor.js'"));
});

test('criarOpcoesCategoria no river_hero permanece stub Flush', () => {
  const opcoes = criarOpcoesCategoria(PASSOS.river_hero, () => 0);
  const certa = opcoes.find((item) => item.verdadeira);
  assert.equal(certa.id, 'flush');
});
